import { getDb } from './db';
import { calculateCardMatching, createCurationCard, getCardById } from './card-engine';
import { Order, OrderPayment, OrderStatus, PointLedger, StoreSettlementSummary } from './types';

// 1. 유저 포인트 잔액 조회 (가용 포인트 CONFIRMED vs 적립 예정 PENDING)
export function getUserPointBalance(userId: number): { availablePoints: number; pendingPoints: number } {
  const db = getDb();

  // 가용 포인트: 확정된 적립 - 사용한 포인트
  const earnStmt = db.prepare(`
    SELECT COALESCE(SUM(amount), 0) as total
    FROM point_ledger
    WHERE user_id = ? AND tx_type = 'EARN' AND status = 'CONFIRMED'
  `);
  const earned = (earnStmt.get(userId) as any)?.total || 0;

  const useStmt = db.prepare(`
    SELECT COALESCE(SUM(amount), 0) as total
    FROM point_ledger
    WHERE user_id = ? AND tx_type = 'USE' AND status = 'CONFIRMED'
  `);
  const used = (useStmt.get(userId) as any)?.total || 0;

  // 적립 예정 포인트
  const pendingStmt = db.prepare(`
    SELECT COALESCE(SUM(amount), 0) as total
    FROM point_ledger
    WHERE user_id = ? AND tx_type = 'EARN' AND status = 'PENDING'
  `);
  const pending = (pendingStmt.get(userId) as any)?.total || 0;

  return {
    availablePoints: Math.max(0, earned - used),
    pendingPoints: pending,
  };
}

// 2. 주문 생성 및 결제 / 포인트 원장 적립 처리
export function createOrderWithPayment(params: {
  buyerUserId: number;
  storeId: number;
  items: { menuId: number; menuName: string; price: number; quantity: number }[];
  pointToUse?: number;
  selectedCardId?: number | null;
}): { success: boolean; orderId?: number; message: string; autoCardCode?: string } {
  const db = getDb();
  const { buyerUserId, storeId, items, pointToUse = 0, selectedCardId } = params;

  if (!items || items.length === 0) {
    return { success: false, message: '주문할 메뉴를 1개 이상 선택해주세요.' };
  }

  // 2-1. 주문 금액 계산
  const orderAmount = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // 2-2. 포인트 사용 가능 여부 검증
  const { availablePoints } = getUserPointBalance(buyerUserId);
  const actualPointUse = Math.min(Math.max(0, pointToUse), availablePoints, orderAmount);
  const pgPaidAmount = orderAmount - actualPointUse;

  // 2-3. 제휴 리워드 매칭 계산
  const matchResult = calculateCardMatching({
    buyerUserId,
    storeId,
    orderAmount,
    selectedCardId
  });

  const appliedCard = matchResult.appliedCard;
  const snapReferrerId = appliedCard?.owner_user_id || null;
  const snapOriginalId = appliedCard?.original_user_id || null;

  // 2-4. 주문 DB 트랜잭션 처리
  db.exec('BEGIN TRANSACTION;');
  try {
    // 2-4-1. orders insert
    const insertOrderStmt = db.prepare(`
      INSERT INTO orders (
        store_id, buyer_user_id, order_amount, applied_card_id,
        snap_referrer_id, snap_original_id, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, 'PAID', datetime('now', 'localtime'))
    `);
    insertOrderStmt.run(
      storeId, buyerUserId, orderAmount, appliedCard ? appliedCard.card_id : null,
      snapReferrerId || null, snapOriginalId || null
    );

    const orderRow = db.prepare('SELECT last_insert_rowid() as id').get() as { id: number };
    const orderId = orderRow.id;

    // 2-4-2. order_items insert
    const insertItemStmt = db.prepare(`
      INSERT INTO order_items (order_id, menu_id, menu_name, price, quantity)
      VALUES (?, ?, ?, ?, ?)
    `);
    for (const item of items) {
      insertItemStmt.run(orderId, item.menuId, item.menuName, item.price, item.quantity);
    }

    // 2-4-3. order_payments insert
    const fakeTid = 'TOSS_PAY_' + Math.random().toString(36).substring(2, 10).toUpperCase();
    const insertPaymentStmt = db.prepare(`
      INSERT INTO order_payments (
        order_id, total_order_amount, pg_paid_amount, point_used_amount, pg_tid
      ) VALUES (?, ?, ?, ?, ?)
    `);
    insertPaymentStmt.run(orderId, orderAmount, pgPaidAmount, actualPointUse, fakeTid);

    // 2-4-4. 포인트 사용 기록 (있는 경우)
    if (actualPointUse > 0) {
      const insertUseLedgerStmt = db.prepare(`
        INSERT INTO point_ledger (
          user_id, order_id, store_id, role_type, tx_type, amount, status
        ) VALUES (?, ?, ?, 'POINT_USE', 'USE', ?, 'CONFIRMED')
      `);
      insertUseLedgerStmt.run(buyerUserId, orderId, storeId, actualPointUse);
    }

    // 2-4-5. 리워드 적립 기록 (PENDING 상태, 24시간 후 확정 예정)
    const insertEarnLedgerStmt = db.prepare(`
      INSERT INTO point_ledger (
        user_id, order_id, store_id, role_type, tx_type, amount, status, confirm_due_at
      ) VALUES (?, ?, ?, ?, 'EARN', ?, 'PENDING', datetime('now', '+24 hours'))
    `);

    // 1) 구매자 몫
    if (matchResult.buyerAmount > 0) {
      insertEarnLedgerStmt.run(buyerUserId, orderId, storeId, 'BUYER', matchResult.buyerAmount);
    }

    // 2) 전달자 몫 (본인 셀프 재주문이 아닐 때)
    if (matchResult.referrerAmount > 0 && snapReferrerId && !matchResult.isSelfReferral) {
      insertEarnLedgerStmt.run(snapReferrerId, orderId, storeId, 'REFERRER', matchResult.referrerAmount);
    }

    // 3) 원작자 몫
    if (matchResult.originalAmount > 0 && snapOriginalId) {
      insertEarnLedgerStmt.run(snapOriginalId, orderId, storeId, 'ORIGINAL', matchResult.originalAmount);
    }

    // 2-4-6. 주문자의 기존 카드가 있다면 재주문으로 30일 자동 연장!
    const userCardStmt = db.prepare('SELECT card_id FROM user_curation_cards WHERE owner_user_id = ? AND store_id = ?');
    const userCard = userCardStmt.get(buyerUserId, storeId) as { card_id: number } | undefined;
    if (userCard) {
      const updateCardStmt = db.prepare(`
        UPDATE user_curation_cards
        SET prev_expires_at = expires_at,
            expires_at = datetime('now', '+30 days'),
            updated_at = datetime('now', 'localtime')
        WHERE card_id = ?
      `);
      updateCardStmt.run(userCard.card_id);
    }

    // 2-4-7. 주문 완료 유저용: 방금 시킨 메뉴 구성을 바탕으로 [유저의 Pick 꿀조합 세트] 자동 조립 카드 생성/갱신
    const userStmt = db.prepare('SELECT name FROM users WHERE id = ?');
    const user = userStmt.get(buyerUserId) as { name: string } | undefined;
    const shortName = user?.name ? user.name.split(' ')[0] : '유저';

    const autoPayload = {
      title: `${shortName}의 Pick 꿀조합 주문세트`,
      tag: '🔥 방금 주문한 실시간 인기 세트',
      menu_ids: items.map(i => i.menuId),
      menu_names: items.map(i => i.menuName),
    };

    const autoCard = createCurationCard({
      storeId,
      ownerUserId: buyerUserId,
      curationType: 'ORDER_SET',
      curationPayload: autoPayload,
      originalUserId: snapReferrerId || snapOriginalId || null,
    });

    db.exec('COMMIT;');

    return {
      success: true,
      orderId,
      message: '주문과 결제가 성공적으로 완료되었습니다!',
      autoCardCode: autoCard.card_code,
    };
  } catch (err: any) {
    db.exec('ROLLBACK;');
    return { success: false, message: `주문 처리 중 오류가 발생했습니다: ${err.message}` };
  }
}

// 3. 배달 완료 처리 (점주 접수 -> 배달완료)
export function deliverOrder(orderId: number): boolean {
  const db = getDb();
  db.exec(`
    UPDATE orders
    SET status = 'DELIVERED',
        delivered_at = datetime('now', 'localtime')
    WHERE order_id = ${orderId} AND status = 'PAID'
  `);
  return true;
}

// 4. 환불 어뷰징 방어: 24시간 경과 후 포인트 확정 배치 (또는 테스트용 즉시 확정)
export function confirmPendingPoints(orderId?: number, forceImmediate = false): number {
  const db = getDb();
  let query = `
    UPDATE point_ledger
    SET status = 'CONFIRMED'
    WHERE status = 'PENDING' AND tx_type = 'EARN'
  `;

  if (orderId) {
    query += ` AND order_id = ${orderId}`;
  } else if (!forceImmediate) {
    // 24시간 경과된 것만
    query += ` AND confirm_due_at <= datetime('now')`;
  }

  db.exec(query);
  const changed = db.prepare('SELECT changes() as count').get() as { count: number };
  return changed.count;
}

// 5. 주문 취소 및 포인트/만료일 롤백
export function cancelOrder(orderId: number): { success: boolean; message: string } {
  const db = getDb();
  const orderStmt = db.prepare('SELECT * FROM orders WHERE order_id = ?');
  const order = orderStmt.get(orderId) as any;

  if (!order) return { success: false, message: '주문 정보를 찾을 수 없습니다.' };
  if (order.status === 'CANCELED') return { success: false, message: '이미 취소된 주문입니다.' };

  db.exec('BEGIN TRANSACTION;');
  try {
    // 주문 상태 CANCELED 변경
    db.exec(`UPDATE orders SET status = 'CANCELED' WHERE order_id = ${orderId}`);

    // 포인트 원장 취소 처리
    // 적립 PENDING 건은 CANCELED로 무효화
    db.exec(`
      UPDATE point_ledger
      SET status = 'CANCELED'
      WHERE order_id = ${orderId} AND tx_type = 'EARN'
    `);

    // 사용한 포인트가 있었다면 환불(CONFIRMED 복구)
    const payment = db.prepare('SELECT * FROM order_payments WHERE order_id = ?').get(orderId) as OrderPayment | undefined;
    if (payment && payment.point_used_amount > 0) {
      db.exec(`
        INSERT INTO point_ledger (
          user_id, order_id, store_id, role_type, tx_type, amount, status
        ) VALUES (
          ${order.buyer_user_id}, ${orderId}, ${order.store_id}, 'POINT_USE', 'CANCEL_USE', ${payment.point_used_amount}, 'CONFIRMED'
        );
      `);
    }

    // 카드 만료일 롤백 (이전 만료일 스냅샷이 있는 경우)
    db.exec(`
      UPDATE user_curation_cards
      SET expires_at = COALESCE(prev_expires_at, expires_at),
          prev_expires_at = NULL
      WHERE owner_user_id = ${order.buyer_user_id} AND store_id = ${order.store_id}
    `);

    db.exec('COMMIT;');
    return { success: true, message: '주문이 정상적으로 취소 및 환불 처리되었습니다.' };
  } catch (err: any) {
    db.exec('ROLLBACK;');
    return { success: false, message: `주문 취소 실패: ${err.message}` };
  }
}

// 6. 점주 정산 명세 및 가맹점 간 교차 결제 상계 정산표 계산기
export function calculateStoreSettlement(storeId: number): StoreSettlementSummary {
  const db = getDb();
  const store = db.prepare('SELECT id, name FROM stores WHERE id = ?').get(storeId) as any;
  const storeName = store?.name || `가맹점 ${storeId}`;

  // 1) 배달 완료된 유효 주문 총액 및 결제 수단 집계
  const orderStatsStmt = db.prepare(`
    SELECT
      COALESCE(SUM(o.order_amount), 0) as total_order,
      COALESCE(SUM(p.pg_paid_amount), 0) as total_pg,
      COALESCE(SUM(p.point_used_amount), 0) as total_points
    FROM orders o
    JOIN order_payments p ON o.order_id = p.order_id
    WHERE o.store_id = ? AND o.status = 'DELIVERED'
  `);
  const stats = orderStatsStmt.get(storeId) as any;
  const totalOrderAmount = stats.total_order || 0;
  const totalPgPaidAmount = stats.total_pg || 0;
  const totalPointUsedAmount = stats.total_points || 0;

  // 2) PG 실비 원가 (3.0% - 실제 카드 결제액 기준)
  const pgFee = Math.round(totalPgPaidAmount * 0.03);

  // 3) 플랫폼 중개수수료 (2.5% - 총 주문 매출 기준)
  const platformFee = Math.round(totalOrderAmount * 0.025);

  // 4) 제휴 리워드 적립금 (본 매장 주문에서 유저들에게 지급된 리워드: 점주 부담 차감)
  const rewardStmt = db.prepare(`
    SELECT COALESCE(SUM(amount), 0) as total_reward
    FROM point_ledger
    WHERE store_id = ? AND tx_type = 'EARN' AND status IN ('CONFIRMED', 'PENDING')
  `);
  const rewardEarnedAmount = (rewardStmt.get(storeId) as any)?.total_reward || 0;

  // 5) 교차 결제 상계 보전금:
  // 고객이 본 매장에서 포인트로 결제한 금액(totalPointUsedAmount)은
  // 플랫폼의 '포인트 예치금 전용 계좌'에서 점주에게 100% 현금으로 보전 지급함!
  const crossPointUsedAmount = totalPointUsedAmount;

  // 6) 최종 점주 정산금 = 총 매출 - PG실비 - 플랫폼수수료 - 점주리워드부담금 + 포인트보전금
  // (참고: 총 매출에서 totalPointUsedAmount가 빠진 PG금액에 포인트보전금이 더해지므로 결과적으로 총 매출 100% 기준으로 수수료/리워드만 공제됨)
  const finalSettlementAmount = totalOrderAmount - pgFee - platformFee - rewardEarnedAmount;

  return {
    storeId,
    storeName,
    totalOrderAmount,
    totalPgPaidAmount,
    totalPointUsedAmount,
    pgFee,
    platformFee,
    rewardEarnedAmount,
    crossPointUsedAmount,
    finalSettlementAmount,
  };
}
