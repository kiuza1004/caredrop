import { getDb } from './db';
import { CardMatchResult, CurationPayload, CurationType, StoreAffiliatePolicy, UserCurationCard } from './types';

// 단축 카드 코드 생성기 (예: CHULSOO77, CD-XXXX)
export function generateCardCode(prefix = 'CD'): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = prefix.slice(0, 8).toUpperCase() + '-';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// 1. 카드 발급 (미주문 프리셋 태그형 또는 주문 완료 세트형)
export function createCurationCard(params: {
  storeId: number;
  ownerUserId: number;
  curationType: CurationType;
  curationPayload: CurationPayload;
  originalUserId?: number | null;
  customCode?: string;
}): UserCurationCard {
  const db = getDb();
  const { storeId, ownerUserId, curationType, curationPayload, originalUserId = null, customCode } = params;

  // 1-1. 사용자 이름 가져오기
  const userStmt = db.prepare('SELECT name FROM users WHERE id = ?');
  const user = userStmt.get(ownerUserId) as { name: string } | undefined;
  const userName = user?.name || `유저${ownerUserId}`;

  // 코드 자동 생성
  const cardCode = customCode || generateCardCode(userName.replace(/[^a-zA-Z0-9가-힣]/g, '').slice(0, 6));
  const payloadStr = JSON.stringify(curationPayload);

  // 1-2. 기존 카드가 있는지 확인 (가게당 1인 1카드 마스터)
  const existingStmt = db.prepare('SELECT * FROM user_curation_cards WHERE owner_user_id = ? AND store_id = ?');
  const existing = existingStmt.get(ownerUserId, storeId) as any;

  if (existing) {
    // 기존 카드 내용 업데이트 및 30일 재연장
    const updateStmt = db.prepare(`
      UPDATE user_curation_cards
      SET curation_type = ?,
          curation_payload = ?,
          original_user_id = ?,
          expires_at = datetime('now', '+30 days'),
          updated_at = datetime('now', 'localtime')
      WHERE card_id = ?
    `);
    updateStmt.run(
      curationType,
      payloadStr,
      originalUserId ? originalUserId : (existing.original_user_id ? existing.original_user_id : null),
      existing.card_id
    );
    return getCardById(existing.card_id)!;
  }

  // 1-3. 신규 카드 생성 (유효기간: +30일)
  const insertStmt = db.prepare(`
    INSERT INTO user_curation_cards (
      card_code, store_id, owner_user_id, original_user_id, curation_type,
      curation_payload, downline_count, has_joined_upline, expires_at
    ) VALUES (
      ?, ?, ?, ?, ?,
      ?, 0, ?, datetime('now', '+30 days')
    )
  `);
  insertStmt.run(
    cardCode, storeId, ownerUserId, originalUserId || null, curationType,
    payloadStr, originalUserId ? 1 : 0
  );

  const inserted = db.prepare('SELECT * FROM user_curation_cards WHERE card_code = ?').get(cardCode) as any;
  return formatCard(inserted);
}

// 2. 전달자(영희)의 원작자(철수) 카드 인용 및 합체 카드 생성
export function quoteAndRemixCard(ownerUserId: number, parentCardId: number): { success: boolean; message: string; card?: UserCurationCard | null } {
  const db = getDb();
  const parentCard = getCardById(parentCardId);

  if (!parentCard) {
    return { success: false, message: '인용할 원본 카드를 찾을 수 없습니다.' };
  }

  if (parentCard.owner_user_id === ownerUserId) {
    return { success: false, message: '본인의 카드는 인용(합체)할 수 없습니다.' };
  }

  // 2-1. 기존 카드 존재 여부 및 후발 합류 검증 (생애 1회, 하위 0명 조건)
  const existingCard = getCardByOwnerAndStore(ownerUserId, parentCard.store_id);

  if (existingCard) {
    // 이미 하위 실적이 있는 경우 인용 불가 (계보 왜곡 방지)
    if (existingCard.downline_count > 0) {
      return { success: false, message: '이미 본인의 카드를 인용한 하위 회원이 있어 다른 사람의 카드로 합체할 수 없습니다.' };
    }
    // 이미 생애 1회 후발 합류를 소진한 경우
    if (existingCard.has_joined_upline) {
      return { success: false, message: '후발 상위 합류는 매장당 생애 최초 1회만 가능합니다.' };
    }

    // 조건 충족: 후발 합류 허용!
    db.exec(`
      UPDATE user_curation_cards
      SET original_user_id = ${parentCard.owner_user_id},
          has_joined_upline = 1,
          expires_at = datetime('now', '+30 days'),
          updated_at = datetime('now', 'localtime')
      WHERE card_id = ${existingCard.card_id}
    `);

    // 상위 원작자의 하위 실적 카운트 증가 및 원작자 유효기간 +30일 자동 연장!
    db.exec(`
      UPDATE user_curation_cards
      SET downline_count = downline_count + 1,
          expires_at = datetime('now', '+30 days'),
          updated_at = datetime('now', 'localtime')
      WHERE card_id = ${parentCard.card_id}
    `);

    return {
      success: true,
      message: '기존 단독 카드가 상위 원작자와 결합된 합체 카드로 성공적으로 업그레이드되었습니다!',
      card: getCardById(existingCard.card_id)
    };
  }

  // 2-2. 완전 신규 합체 카드 발급
  const user = db.prepare('SELECT name FROM users WHERE id = ?').get(ownerUserId) as { name: string } | undefined;
  const parentOwner = db.prepare('SELECT name FROM users WHERE id = ?').get(parentCard.owner_user_id) as { name: string } | undefined;

  const remixTitle = `${parentOwner?.name?.split(' ')[0] || '원작자'} 추천 × ${user?.name?.split(' ')[0] || '나'}의 찐추천 합체 세트`;
  const remixPayload: CurationPayload = {
    ...parentCard.curation_payload,
    title: remixTitle,
    tag: parentCard.curation_payload.tag || '👍 동네 찐맛집 강추'
  };

  const newCard = createCurationCard({
    storeId: parentCard.store_id,
    ownerUserId,
    curationType: parentCard.curation_type,
    curationPayload: remixPayload,
    originalUserId: parentCard.owner_user_id,
  });

  // 상위 원작자 하위 실적 + 30일 활동 연장
  db.exec(`
    UPDATE user_curation_cards
    SET downline_count = downline_count + 1,
        expires_at = datetime('now', '+30 days'),
        updated_at = datetime('now', 'localtime')
    WHERE card_id = ${parentCard.card_id}
  `);

  return {
    success: true,
    message: '원클릭으로 합체 카드가 생성되었습니다! 친구들에게 공유해 함께 적립을 받아보세요.',
    card: newCard
  };
}

// 3. 신규 유입 클릭 시 유효기간 30일 자동 연장 및 수신함 등록
export function receiveAndTrackCard(receiverUserId: number, cardCode: string): { success: boolean; card?: UserCurationCard | null; message: string } {
  const db = getDb();
  const card = getCardByCode(cardCode);
  if (!card) {
    return { success: false, message: '유효하지 않은 카드 코드입니다.' };
  }

  // 3-1. 유입(클릭) 발생에 의한 카드 유효기간 30일 자동 연장 (방문판매법 방어 핵심)
  db.exec(`
    UPDATE user_curation_cards
    SET expires_at = datetime('now', '+30 days'),
        updated_at = datetime('now', 'localtime')
    WHERE card_id = ${card.card_id}
  `);

  // 3-2. 수신 이력 저장 (본인 카드가 아닐 때)
  if (card.owner_user_id !== receiverUserId) {
    db.exec(`
      INSERT OR IGNORE INTO user_received_cards (receiver_user_id, store_id, card_id)
      VALUES (${receiverUserId}, ${card.store_id}, ${card.card_id})
    `);
  }

  return {
    success: true,
    message: '카드를 성공적으로 받았습니다! (작성자 카드가 30일 연장되었습니다)',
    card: getCardById(card.card_id)
  };
}

// 4. 합체 카드 우선순위 및 4가지 경우의 수 정산 매칭 계산기
export function calculateCardMatching(params: {
  buyerUserId: number;
  storeId: number;
  orderAmount: number;
  selectedCardId?: number | null;
}): CardMatchResult {
  const db = getDb();
  const { buyerUserId, storeId, orderAmount, selectedCardId } = params;

  // 4-1. 매장의 제휴 리워드 정책 확인
  const policyStmt = db.prepare('SELECT * FROM store_affiliate_policies WHERE store_id = ?');
  const policy = (policyStmt.get(storeId) as StoreAffiliatePolicy) || {
    store_id: storeId,
    is_active: 1,
    buyer_rate: 0.010,
    referrer_rate: 0.010,
    original_rate: 0.010,
    valid_days: 30,
    updated_at: ''
  };

  if (!policy.is_active) {
    return {
      appliedCard: null,
      matchCase: 'EXPIRED_OR_NONE',
      caseDescription: '매장 제휴 리워드가 비활성화되어 리워드가 적용되지 않습니다.',
      buyerRate: 0,
      referrerRate: 0,
      originalRate: 0,
      totalRewardRate: 0,
      buyerAmount: 0,
      referrerAmount: 0,
      originalAmount: 0,
      isSelfReferral: false,
    };
  }

  // 4-2. 적용 대상 카드 결정
  let candidateCard: UserCurationCard | null = null;

  if (selectedCardId) {
    candidateCard = getCardById(selectedCardId);
  } else {
    // 자동 매칭 우선순위:
    // 유저가 수신한 카드들 중 3인 정산이 가능한 '합체 카드(original_user_id IS NOT NULL)'를 최우선 탐색!
    const receivedCardsStmt = db.prepare(`
      SELECT c.* FROM user_curation_cards c
      JOIN user_received_cards r ON c.card_id = r.card_id
      WHERE r.receiver_user_id = ? AND r.store_id = ?
      ORDER BY (c.original_user_id IS NOT NULL) DESC, c.created_at DESC
    `);
    const rows = receivedCardsStmt.all(buyerUserId, storeId) as any[];
    if (rows.length > 0) {
      candidateCard = formatCard(rows[0]);
    }
  }

  // 카드가 아예 없는 경우: 구매자 자체 1% 기본 적립
  if (!candidateCard) {
    const buyerRate = policy.buyer_rate;
    return {
      appliedCard: null,
      matchCase: 'EXPIRED_OR_NONE',
      caseDescription: '일반 주문: 구매자 1% 자체 적립',
      buyerRate,
      referrerRate: 0,
      originalRate: 0,
      totalRewardRate: buyerRate,
      buyerAmount: Math.floor(orderAmount * buyerRate),
      referrerAmount: 0,
      originalAmount: 0,
      isSelfReferral: false,
    };
  }

  // 4-3. 셀프 어뷰징 검증 (본인 카드 사용 시)
  const isSelf = candidateCard.owner_user_id === buyerUserId;

  // 4-4. 유효성 검사 (만료 여부 체크)
  const now = new Date();
  const isReferrerActive = new Date(candidateCard.expires_at) > now;

  let isOriginalActive = false;
  let originalCard: UserCurationCard | null = null;

  if (candidateCard.original_user_id) {
    const origStmt = db.prepare('SELECT * FROM user_curation_cards WHERE owner_user_id = ? AND store_id = ?');
    const origRow = origStmt.get(candidateCard.original_user_id, storeId) as any;
    if (origRow) {
      originalCard = formatCard(origRow);
      isOriginalActive = new Date(origRow.expires_at) > now;
    }
  }

  // 4-5. 4가지 경우의 수 매칭
  if (isReferrerActive && isOriginalActive) {
    // Case 1: 전달자 + 원작자 모두 유효 -> 3인 정산 (구매자 1% + 전달자 1% + 원작자 1% = 총 3%)
    if (isSelf) {
      // 본인 카드 셀프 재주문: 본인 전달자 1% 제외, 구매자 1% + 원작자 1% = 2%
      return {
        appliedCard: candidateCard,
        matchCase: 'ALL_VALID',
        caseDescription: '본인 재주문: 본인(1%) + 상위 원작자(1%) = 총 2% 적립 (전달자 중복 제외)',
        buyerRate: policy.buyer_rate,
        referrerRate: 0,
        originalRate: policy.original_rate,
        totalRewardRate: policy.buyer_rate + policy.original_rate,
        buyerAmount: Math.floor(orderAmount * policy.buyer_rate),
        referrerAmount: 0,
        originalAmount: Math.floor(orderAmount * policy.original_rate),
        isSelfReferral: true,
      };
    }

    return {
      appliedCard: candidateCard,
      matchCase: 'ALL_VALID',
      caseDescription: '합체 카드 3인 정산: 구매자(1%) + 전달자(1%) + 원작자(1%) = 총 3% 적립',
      buyerRate: policy.buyer_rate,
      referrerRate: policy.referrer_rate,
      originalRate: policy.original_rate,
      totalRewardRate: policy.buyer_rate + policy.referrer_rate + policy.original_rate,
      buyerAmount: Math.floor(orderAmount * policy.buyer_rate),
      referrerAmount: Math.floor(orderAmount * policy.referrer_rate),
      originalAmount: Math.floor(orderAmount * policy.original_rate),
      isSelfReferral: false,
    };
  }

  if (isReferrerActive && !isOriginalActive) {
    // Case 2: 전달자 유효, 원작자 만료 -> 원작자 몫 제외 (구매자 1% + 전달자 1% = 총 2%)
    if (isSelf) {
      return {
        appliedCard: candidateCard,
        matchCase: 'REFERRER_ONLY',
        caseDescription: '본인 재주문 및 원작자 만료: 구매자 본인(1%) 자체 적립',
        buyerRate: policy.buyer_rate,
        referrerRate: 0,
        originalRate: 0,
        totalRewardRate: policy.buyer_rate,
        buyerAmount: Math.floor(orderAmount * policy.buyer_rate),
        referrerAmount: 0,
        originalAmount: 0,
        isSelfReferral: true,
      };
    }

    return {
      appliedCard: candidateCard,
      matchCase: 'REFERRER_ONLY',
      caseDescription: '전달자 카드 적용 (원작자 만료 제외): 구매자(1%) + 전달자(1%) = 총 2% 적립',
      buyerRate: policy.buyer_rate,
      referrerRate: policy.referrer_rate,
      originalRate: 0,
      totalRewardRate: policy.buyer_rate + policy.referrer_rate,
      buyerAmount: Math.floor(orderAmount * policy.buyer_rate),
      referrerAmount: Math.floor(orderAmount * policy.referrer_rate),
      originalAmount: 0,
      isSelfReferral: false,
    };
  }

  if (!isReferrerActive && isOriginalActive) {
    // Case 3: 전달자 만료, 원작자 유효 -> 살아있는 원작자 카드로 자동 전환 (구매자 1% + 원작자 1% = 총 2%)
    return {
      appliedCard: originalCard,
      matchCase: 'ORIGINAL_ONLY',
      caseDescription: '전달자 만료 → 살아있는 원작자 카드로 자동 전환: 구매자(1%) + 원작자(1%) = 총 2% 적립',
      buyerRate: policy.buyer_rate,
      referrerRate: 0,
      originalRate: policy.original_rate,
      totalRewardRate: policy.buyer_rate + policy.original_rate,
      buyerAmount: Math.floor(orderAmount * policy.buyer_rate),
      referrerAmount: 0,
      originalAmount: Math.floor(orderAmount * policy.original_rate),
      isSelfReferral: isSelf,
    };
  }

  // Case 4: 모두 만료
  return {
    appliedCard: null,
    matchCase: 'EXPIRED_OR_NONE',
    caseDescription: '추천 카드 만료: 구매자 1% 자체 적립',
    buyerRate: policy.buyer_rate,
    referrerRate: 0,
    originalRate: 0,
    totalRewardRate: policy.buyer_rate,
    buyerAmount: Math.floor(orderAmount * policy.buyer_rate),
    referrerAmount: 0,
    originalAmount: 0,
    isSelfReferral: isSelf,
  };
}

// 헬퍼 함수들
export function getCardById(cardId: number): UserCurationCard | null {
  const db = getDb();
  const row = db.prepare(`
    SELECT c.*, u.name as owner_name, o.name as original_name, s.name as store_name
    FROM user_curation_cards c
    LEFT JOIN users u ON c.owner_user_id = u.id
    LEFT JOIN users o ON c.original_user_id = o.id
    LEFT JOIN stores s ON c.store_id = s.id
    WHERE c.card_id = ?
  `).get(cardId) as any;

  return row ? formatCard(row) : null;
}

export function getCardByCode(code: string): UserCurationCard | null {
  const db = getDb();
  const row = db.prepare(`
    SELECT c.*, u.name as owner_name, o.name as original_name, s.name as store_name
    FROM user_curation_cards c
    LEFT JOIN users u ON c.owner_user_id = u.id
    LEFT JOIN users o ON c.original_user_id = o.id
    LEFT JOIN stores s ON c.store_id = s.id
    WHERE c.card_code = ?
  `).get(code) as any;

  return row ? formatCard(row) : null;
}

export function getCardByOwnerAndStore(ownerUserId: number, storeId: number): UserCurationCard | null {
  const db = getDb();
  const row = db.prepare(`
    SELECT c.*, u.name as owner_name, o.name as original_name, s.name as store_name
    FROM user_curation_cards c
    LEFT JOIN users u ON c.owner_user_id = u.id
    LEFT JOIN users o ON c.original_user_id = o.id
    LEFT JOIN stores s ON c.store_id = s.id
    WHERE c.owner_user_id = ? AND c.store_id = ?
  `).get(ownerUserId, storeId) as any;

  return row ? formatCard(row) : null;
}

function formatCard(row: any): UserCurationCard {
  return {
    ...row,
    curation_payload: typeof row.curation_payload === 'string' ? JSON.parse(row.curation_payload) : row.curation_payload,
    is_expired: new Date(row.expires_at) <= new Date(),
    has_joined_upline: Boolean(row.has_joined_upline)
  };
}
