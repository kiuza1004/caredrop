'use client';

// GitHub Pages 정적 배포 환경을 위한 클라이언트 사이드 데이터베이스 및 비즈니스 로직 엔진
import { CardMatchResult, CurationPayload, CurationType, StoreAffiliatePolicy, StoreSettlementSummary, UserCurationCard } from './types';

const STORAGE_KEY = 'caredrop_client_db_v1';

interface ClientDbData {
  users: any[];
  stores: any[];
  menus: any[];
  policies: any[];
  cards: any[];
  receivedCards: any[];
  orders: any[];
  payments: any[];
  pointLedger: any[];
}

function getDefaultData(): ClientDbData {
  return {
    users: [
      { id: 1, name: '철수 (원작자 크리에이터)', email: 'chulsoo@caredrop.kr', phone: '010-1111-2222', role: 'USER' },
      { id: 2, name: '영희 (전달자 크리에이터)', email: 'younghee@caredrop.kr', phone: '010-3333-4444', role: 'USER' },
      { id: 3, name: '민수 (구매자/신규 유입자)', email: 'minsoo@caredrop.kr', phone: '010-5555-6666', role: 'USER' },
      { id: 4, name: '홍길동 점주 (치킨본점)', email: 'owner1@caredrop.kr', phone: '010-7777-8888', role: 'OWNER' },
      { id: 5, name: '이순신 점주 (피자파스타)', email: 'owner2@caredrop.kr', phone: '010-9999-0000', role: 'OWNER' },
      { id: 6, name: 'CareDrop 플랫폼 관리자', email: 'admin@caredrop.kr', phone: '010-1234-5678', role: 'ADMIN' },
    ],
    stores: [
      {
        id: 1,
        name: '황금올리브 바삭치킨 본점',
        category: '치킨/안주',
        address: '서울시 강남구 테헤란로 123',
        phone: '02-1234-5678',
        min_order_amount: 15000,
        delivery_fee: 3000,
        logo_url: '🍗',
        banner_url: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=600&auto=format&fit=crop&q=80',
        policy_active: 1,
        buyer_rate: 0.010,
        referrer_rate: 0.010,
        original_rate: 0.010,
      },
      {
        id: 2,
        name: '화덕피자 & 파스타 동네맛집',
        category: '피자/양식',
        address: '서울시 강남구 역삼로 456',
        phone: '02-8765-4321',
        min_order_amount: 16000,
        delivery_fee: 2500,
        logo_url: '🍕',
        banner_url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&auto=format&fit=crop&q=80',
        policy_active: 1,
        buyer_rate: 0.010,
        referrer_rate: 0.010,
        original_rate: 0.010,
      },
    ],
    menus: [
      { id: 101, store_id: 1, name: '황금 시그니처 바삭 후라이드', price: 20000, description: '국내산 냉장 신선육으로 튀겨낸 겉바속촉 극강의 시그니처 치킨', category: '메인 치킨', is_popular: 1 },
      { id: 102, store_id: 1, name: '매콤달콤 황금 양념치킨', price: 21000, description: '전통 비법 소스로 버무린 매콤달콤한 인기 만점 양념치킨', category: '메인 치킨', is_popular: 1 },
      { id: 103, store_id: 1, name: '모짜렐라 치즈볼 (5개)', price: 5000, description: '쫀득한 찹쌀 피 속에 자연산 모짜렐라 치즈가 듬뿍!', category: '사이드', is_popular: 1 },
      { id: 104, store_id: 1, name: '시원한 제로콜라 1.25L', price: 2500, description: '부담 없이 시원하게 즐기는 제로 펩시', category: '음료', is_popular: 0 },
      { id: 201, store_id: 2, name: '정통 콰트로 마르게리타 피자', price: 22000, description: '이탈리아 카푸토 밀가루와 생모짜렐라, 바질의 환상 조합', category: '화덕 피자', is_popular: 1 },
      { id: 202, store_id: 2, name: '진한 트러플 크림 파스타', price: 16000, description: '이탈리아산 블랙 트러플 오일의 깊은 풍미를 담은 크림 파스타', category: '파스타', is_popular: 1 },
      { id: 203, store_id: 2, name: '갈릭 버터 감자튀김', price: 6000, description: '달콤한 갈릭 소스와 버터 풍미의 바삭 감자', category: '사이드', is_popular: 0 },
    ],
    policies: [
      { store_id: 1, is_active: 1, buyer_rate: 0.010, referrer_rate: 0.010, original_rate: 0.010, valid_days: 30 },
      { store_id: 2, is_active: 1, buyer_rate: 0.010, referrer_rate: 0.010, original_rate: 0.010, valid_days: 30 },
    ],
    cards: [
      {
        card_id: 1,
        card_code: 'CHULSOO77',
        store_id: 1,
        owner_user_id: 1,
        original_user_id: null,
        curation_type: 'ORDER_SET',
        curation_payload: {
          title: "철수의 Pick 꿀조합 바삭세트",
          tag: '🍺 야식·안주 최고',
          menu_ids: [101, 103],
          menu_names: ['황금 시그니처 바삭 후라이드', '모짜렐라 치즈볼 (5개)'],
        },
        downline_count: 1,
        has_joined_upline: false,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date().toISOString(),
      },
      {
        card_id: 2,
        card_code: 'YOUNGHEE88',
        store_id: 1,
        owner_user_id: 2,
        original_user_id: 1,
        curation_type: 'ORDER_SET',
        curation_payload: {
          title: '철수 추천 × 영희 찐추천 합체 세트',
          tag: '👍 동네 찐맛집 강추',
          menu_ids: [101, 103],
          menu_names: ['황금 시그니처 바삭 후라이드', '모짜렐라 치즈볼 (5개)'],
        },
        downline_count: 0,
        has_joined_upline: false,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date().toISOString(),
      },
    ],
    receivedCards: [
      { receipt_id: 1, receiver_user_id: 3, store_id: 1, card_id: 2, received_at: new Date().toISOString() },
      { receipt_id: 2, receiver_user_id: 3, store_id: 1, card_id: 1, received_at: new Date().toISOString() },
    ],
    orders: [
      {
        order_id: 999,
        store_id: 2,
        buyer_user_id: 3,
        order_amount: 22000,
        status: 'DELIVERED',
        created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ],
    payments: [
      { payment_id: 999, order_id: 999, total_order_amount: 22000, pg_paid_amount: 22000, point_used_amount: 0 },
    ],
    pointLedger: [
      {
        ledger_id: 1,
        user_id: 3,
        order_id: 999,
        store_id: 2,
        role_type: 'BUYER',
        tx_type: 'EARN',
        amount: 5000,
        status: 'CONFIRMED',
        created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ],
  };
}

export function getClientDb(): ClientDbData {
  if (typeof window === 'undefined') return getDefaultData();
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const init = getDefaultData();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(init));
    return init;
  }
  try {
    return JSON.parse(raw);
  } catch {
    const init = getDefaultData();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(init));
    return init;
  }
}

export function saveClientDb(data: ClientDbData) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// 1. 유저 포인트 잔액 조회
export function clientGetUserPointBalance(userId: number) {
  const db = getClientDb();
  let earned = 0;
  let used = 0;
  let pending = 0;

  for (const l of db.pointLedger) {
    if (l.user_id === userId) {
      if (l.tx_type === 'EARN' && l.status === 'CONFIRMED') earned += l.amount;
      if (l.tx_type === 'USE' && l.status === 'CONFIRMED') used += l.amount;
      if (l.tx_type === 'EARN' && l.status === 'PENDING') pending += l.amount;
    }
  }

  return {
    availablePoints: Math.max(0, earned - used),
    pendingPoints: pending,
  };
}

// 2. 카드 매칭 계산기
export function clientCalculateCardMatching(buyerUserId: number, storeId: number, orderAmount: number, selectedCardId?: number | null): CardMatchResult {
  const db = getClientDb();
  const policy = db.policies.find((p) => p.store_id === storeId) || {
    store_id: storeId,
    is_active: 1,
    buyer_rate: 0.010,
    referrer_rate: 0.010,
    original_rate: 0.010,
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

  let candidateCard: any = null;
  if (selectedCardId) {
    candidateCard = db.cards.find((c) => c.card_id === selectedCardId);
  } else {
    // 합체 쿠폰 최우선 자동 탐색
    const received = db.receivedCards.filter((r) => r.receiver_user_id === buyerUserId && r.store_id === storeId);
    for (const r of received) {
      const card = db.cards.find((c) => c.card_id === r.card_id);
      if (card && card.original_user_id) {
        candidateCard = card;
        break;
      }
    }
    if (!candidateCard && received.length > 0) {
      candidateCard = db.cards.find((c) => c.card_id === received[0].card_id);
    }
  }

  if (!candidateCard) {
    return {
      appliedCard: null,
      matchCase: 'EXPIRED_OR_NONE',
      caseDescription: '일반 주문: 구매자 1% 자체 적립',
      buyerRate: policy.buyer_rate,
      referrerRate: 0,
      originalRate: 0,
      totalRewardRate: policy.buyer_rate,
      buyerAmount: Math.floor(orderAmount * policy.buyer_rate),
      referrerAmount: 0,
      originalAmount: 0,
      isSelfReferral: false,
    };
  }

  const isSelf = candidateCard.owner_user_id === buyerUserId;
  const now = new Date();
  const isReferrerActive = new Date(candidateCard.expires_at) > now;
  let isOriginalActive = false;
  let originalCard: any = null;

  if (candidateCard.original_user_id) {
    originalCard = db.cards.find((c) => c.owner_user_id === candidateCard.original_user_id && c.store_id === storeId);
    if (originalCard) {
      isOriginalActive = new Date(originalCard.expires_at) > now;
    }
  }

  const owner = db.users.find((u) => u.id === candidateCard.owner_user_id);
  const origOwner = db.users.find((u) => u.id === candidateCard.original_user_id);
  const formattedCandidate: UserCurationCard = {
    ...candidateCard,
    owner_name: owner?.name || '전달자',
    original_name: origOwner?.name || '원작자',
    is_expired: !isReferrerActive,
  };

  if (isReferrerActive && isOriginalActive) {
    if (isSelf) {
      return {
        appliedCard: formattedCandidate,
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
      appliedCard: formattedCandidate,
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
    return {
      appliedCard: formattedCandidate,
      matchCase: 'REFERRER_ONLY',
      caseDescription: '전달자 카드 적용 (원작자 만료 제외): 구매자(1%) + 전달자(1%) = 총 2% 적립',
      buyerRate: policy.buyer_rate,
      referrerRate: isSelf ? 0 : policy.referrer_rate,
      originalRate: 0,
      totalRewardRate: isSelf ? policy.buyer_rate : policy.buyer_rate + policy.referrer_rate,
      buyerAmount: Math.floor(orderAmount * policy.buyer_rate),
      referrerAmount: isSelf ? 0 : Math.floor(orderAmount * policy.referrer_rate),
      originalAmount: 0,
      isSelfReferral: isSelf,
    };
  }

  if (!isReferrerActive && isOriginalActive) {
    const origCardFormatted: UserCurationCard = {
      ...originalCard,
      owner_name: origOwner?.name || '원작자',
      is_expired: false,
    };
    return {
      appliedCard: origCardFormatted,
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

// 3. 주문 생성 및 결제
export function clientCreateOrder(buyerUserId: number, storeId: number, items: any[], pointToUse = 0, selectedCardId?: number | null) {
  const db = getClientDb();
  const orderAmount = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const { availablePoints } = clientGetUserPointBalance(buyerUserId);
  const actualPointUse = Math.min(Math.max(0, pointToUse), availablePoints, orderAmount);
  const pgPaidAmount = orderAmount - actualPointUse;

  const matchResult = clientCalculateCardMatching(buyerUserId, storeId, orderAmount, selectedCardId);
  const appliedCard = matchResult.appliedCard;
  const newOrderId = db.orders.length > 0 ? Math.max(...db.orders.map((o) => o.order_id)) + 1 : 1001;

  // Order
  const order = {
    order_id: newOrderId,
    store_id: storeId,
    buyer_user_id: buyerUserId,
    order_amount: orderAmount,
    applied_card_id: appliedCard?.card_id || null,
    snap_referrer_id: appliedCard?.owner_user_id || null,
    snap_original_id: appliedCard?.original_user_id || null,
    status: 'PAID',
    created_at: new Date().toISOString(),
  };
  db.orders.push(order);

  // Payment
  db.payments.push({
    payment_id: newOrderId,
    order_id: newOrderId,
    total_order_amount: orderAmount,
    pg_paid_amount: pgPaidAmount,
    point_used_amount: actualPointUse,
    pg_tid: 'TOSS_PAY_MOCK_' + Math.random().toString(36).substring(2, 8).toUpperCase(),
  });

  // 포인트 사용 원장
  if (actualPointUse > 0) {
    db.pointLedger.push({
      ledger_id: db.pointLedger.length + 1,
      user_id: buyerUserId,
      order_id: newOrderId,
      store_id: storeId,
      role_type: 'POINT_USE',
      tx_type: 'USE',
      amount: actualPointUse,
      status: 'CONFIRMED',
      created_at: new Date().toISOString(),
    });
  }

  // 포인트 적립 원장 (PENDING)
  if (matchResult.buyerAmount > 0) {
    db.pointLedger.push({
      ledger_id: db.pointLedger.length + 1,
      user_id: buyerUserId,
      order_id: newOrderId,
      store_id: storeId,
      role_type: 'BUYER',
      tx_type: 'EARN',
      amount: matchResult.buyerAmount,
      status: 'PENDING',
      created_at: new Date().toISOString(),
    });
  }
  if (matchResult.referrerAmount > 0 && appliedCard?.owner_user_id && !matchResult.isSelfReferral) {
    db.pointLedger.push({
      ledger_id: db.pointLedger.length + 1,
      user_id: appliedCard.owner_user_id,
      order_id: newOrderId,
      store_id: storeId,
      role_type: 'REFERRER',
      tx_type: 'EARN',
      amount: matchResult.referrerAmount,
      status: 'PENDING',
      created_at: new Date().toISOString(),
    });
  }
  if (matchResult.originalAmount > 0 && appliedCard?.original_user_id) {
    db.pointLedger.push({
      ledger_id: db.pointLedger.length + 1,
      user_id: appliedCard.original_user_id,
      order_id: newOrderId,
      store_id: storeId,
      role_type: 'ORIGINAL',
      tx_type: 'EARN',
      amount: matchResult.originalAmount,
      status: 'PENDING',
      created_at: new Date().toISOString(),
    });
  }

  // 주문 완료 유저용 자동 카드 생성 / 재연장
  const user = db.users.find((u) => u.id === buyerUserId);
  const shortName = user?.name ? user.name.split(' ')[0] : '유저';
  const autoCode = `${shortName.slice(0, 3).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

  const existingCard = db.cards.find((c) => c.owner_user_id === buyerUserId && c.store_id === storeId);
  if (existingCard) {
    existingCard.expires_at = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  } else {
    db.cards.push({
      card_id: db.cards.length + 1,
      card_code: autoCode,
      store_id: storeId,
      owner_user_id: buyerUserId,
      original_user_id: appliedCard?.owner_user_id || appliedCard?.original_user_id || null,
      curation_type: 'ORDER_SET',
      curation_payload: {
        title: `${shortName}의 Pick 꿀조합 주문세트`,
        tag: '🔥 방금 주문한 실시간 인기 세트',
        menu_ids: items.map((i) => i.menuId),
        menu_names: items.map((i) => i.menuName),
      },
      downline_count: 0,
      has_joined_upline: false,
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date().toISOString(),
    });
  }

  saveClientDb(db);
  return { success: true, orderId: newOrderId, message: '주문과 결제가 완료되었습니다!' };
}

// 4. 점주 상계 정산표 계산
export function clientCalculateStoreSettlement(storeId: number): StoreSettlementSummary {
  const db = getClientDb();
  const store = db.stores.find((s) => s.id === storeId) || { name: '가맹점' };

  let totalOrderAmount = 0;
  let totalPgPaidAmount = 0;
  let totalPointUsedAmount = 0;

  const deliveredOrders = db.orders.filter((o) => o.store_id === storeId && o.status === 'DELIVERED');
  for (const o of deliveredOrders) {
    totalOrderAmount += o.order_amount;
    const p = db.payments.find((pay) => pay.order_id === o.order_id);
    if (p) {
      totalPgPaidAmount += p.pg_paid_amount;
      totalPointUsedAmount += p.point_used_amount;
    }
  }

  const pgFee = Math.round(totalPgPaidAmount * 0.03);
  const platformFee = Math.round(totalOrderAmount * 0.025);

  let rewardEarnedAmount = 0;
  for (const l of db.pointLedger) {
    if (l.store_id === storeId && l.tx_type === 'EARN' && (l.status === 'CONFIRMED' || l.status === 'PENDING')) {
      rewardEarnedAmount += l.amount;
    }
  }

  const crossPointUsedAmount = totalPointUsedAmount;
  const finalSettlementAmount = totalOrderAmount - pgFee - platformFee - rewardEarnedAmount;

  return {
    storeId,
    storeName: store.name,
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

// 5. 배달 완료 및 포인트 확정
export function clientDeliverOrder(orderId: number) {
  const db = getClientDb();
  const o = db.orders.find((ord) => ord.order_id === orderId);
  if (o) o.status = 'DELIVERED';
  saveClientDb(db);
  return true;
}

export function clientConfirmPoints() {
  const db = getClientDb();
  let count = 0;
  for (const l of db.pointLedger) {
    if (l.status === 'PENDING') {
      l.status = 'CONFIRMED';
      count++;
    }
  }
  saveClientDb(db);
  return count;
}
