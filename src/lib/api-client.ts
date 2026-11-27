'use client';

import {
  clientCalculateCardMatching,
  clientCalculateStoreSettlement,
  clientConfirmPoints,
  clientCreateOrder,
  clientDeliverOrder,
  getClientDb,
  saveClientDb,
  clientGetUserPointBalance,
} from './client-engine';

export function isStaticMode(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.location.hostname.includes('github.io') ||
    process.env.NEXT_PUBLIC_STATIC_EXPORT === 'true'
  );
}

// 1. 매장 목록 가져오기
export async function fetchStores() {
  if (isStaticMode()) {
    const db = getClientDb();
    return { stores: db.stores };
  }
  const res = await fetch('/api/stores');
  return res.json();
}

// 2. 매장 상세 가져오기
export async function fetchStoreDetail(storeId: number) {
  if (isStaticMode()) {
    const db = getClientDb();
    const store = db.stores.find((s) => s.id === storeId);
    const menus = db.menus.filter((m) => m.store_id === storeId);
    return { store, menus };
  }
  const res = await fetch(`/api/stores/${storeId}`);
  return res.json();
}

// 3. 카드 정보 가져오기
export async function fetchCardDetail(code: string, currentUserId?: number) {
  if (isStaticMode()) {
    const db = getClientDb();
    const card = db.cards.find((c) => c.card_code === code);
    if (!card) return { error: '카드를 찾을 수 없습니다.' };

    // 클릭 유입 +30일 연장
    card.expires_at = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    // 수신 이력 등록
    if (currentUserId && card.owner_user_id !== currentUserId) {
      if (!db.receivedCards.some((r) => r.receiver_user_id === currentUserId && r.card_id === card.card_id)) {
        db.receivedCards.push({
          receipt_id: db.receivedCards.length + 1,
          receiver_user_id: currentUserId,
          store_id: card.store_id,
          card_id: card.card_id,
          received_at: new Date().toISOString(),
        });
      }
    }
    saveClientDb(db);

    const store = db.stores.find((s) => s.id === card.store_id);
    const owner = db.users.find((u) => u.id === card.owner_user_id);
    const orig = db.users.find((u) => u.id === card.original_user_id);
    const menuItems = card.curation_payload?.menu_ids
      ? db.menus.filter((m) => card.curation_payload.menu_ids.includes(m.id))
      : [];

    return {
      card: {
        ...card,
        owner_name: owner?.name || '추천인',
        original_name: orig?.name || null,
      },
      store,
      menuItems,
    };
  }

  const url = currentUserId ? `/api/cards/${code}?userId=${currentUserId}` : `/api/cards/${code}`;
  const res = await fetch(url);
  return res.json();
}

// 4. 프리셋 태그 카드 생성
export async function createCardApi(params: {
  storeId: number;
  ownerUserId: number;
  curationType: string;
  curationPayload: any;
}) {
  if (isStaticMode()) {
    const db = getClientDb();
    const user = db.users.find((u) => u.id === params.ownerUserId);
    const code = `${(user?.name || 'USER').slice(0, 3).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const newCard = {
      card_id: db.cards.length + 1,
      card_code: code,
      store_id: params.storeId,
      owner_user_id: params.ownerUserId,
      original_user_id: null,
      curation_type: params.curationType,
      curation_payload: params.curationPayload,
      downline_count: 0,
      has_joined_upline: false,
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date().toISOString(),
    };
    db.cards.push(newCard);
    saveClientDb(db);
    return { success: true, card: newCard };
  }

  const res = await fetch('/api/cards', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  return res.json();
}

// 5. 합체 카드 리믹스
export async function remixCardApi(ownerUserId: number, parentCardId: number) {
  if (isStaticMode()) {
    const db = getClientDb();
    const parent = db.cards.find((c) => c.card_id === parentCardId);
    if (!parent) return { error: '원본 카드를 찾을 수 없습니다.' };

    const user = db.users.find((u) => u.id === ownerUserId);
    const parentOwner = db.users.find((u) => u.id === parent.owner_user_id);
    const code = `${(user?.name || 'USER').slice(0, 3).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const remixTitle = `${parentOwner?.name?.split(' ')[0] || '원작자'} 추천 × ${user?.name?.split(' ')[0] || '나'}의 찐추천 합체 세트`;
    const newCard = {
      card_id: db.cards.length + 1,
      card_code: code,
      store_id: parent.store_id,
      owner_user_id: ownerUserId,
      original_user_id: parent.owner_user_id,
      curation_type: parent.curation_type,
      curation_payload: {
        ...parent.curation_payload,
        title: remixTitle,
      },
      downline_count: 0,
      has_joined_upline: true,
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date().toISOString(),
    };

    parent.downline_count = (parent.downline_count || 0) + 1;
    parent.expires_at = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    db.cards.push(newCard);
    saveClientDb(db);
    return { success: true, message: '합체 카드가 발급되었습니다!', card: newCard };
  }

  const res = await fetch('/api/cards/remix', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ownerUserId, parentCardId }),
  });
  return res.json();
}

// 6. 유저 프로필 & 포인트 & 카드함 조회
export async function fetchUserDetail(userId: number) {
  if (isStaticMode()) {
    const db = getClientDb();
    const user = db.users.find((u) => u.id === userId);
    const points = clientGetUserPointBalance(userId);

    const myCards = db.cards
      .filter((c) => c.owner_user_id === userId)
      .map((c) => {
        const store = db.stores.find((s) => s.id === c.store_id);
        const orig = db.users.find((u) => u.id === c.original_user_id);
        return {
          ...c,
          store_name: store?.name || '',
          original_name: orig?.name || null,
        };
      });

    const receivedCards = db.receivedCards
      .filter((r) => r.receiver_user_id === userId)
      .map((r) => {
        const card = db.cards.find((c) => c.card_id === r.card_id);
        const store = db.stores.find((s) => s.id === r.store_id);
        const owner = db.users.find((u) => u.id === card?.owner_user_id);
        const orig = db.users.find((u) => u.id === card?.original_user_id);
        return {
          receipt_id: r.receipt_id,
          received_at: r.received_at,
          ...card,
          store_name: store?.name || '',
          owner_name: owner?.name || '',
          original_name: orig?.name || null,
        };
      });

    const orders = db.orders.filter((o) => o.buyer_user_id === userId);
    const pointLedger = db.pointLedger.filter((l) => l.user_id === userId);

    return {
      user,
      points,
      myCards,
      receivedCards,
      orders,
      pointLedger,
    };
  }

  const res = await fetch(`/api/users/${userId}`);
  return res.json();
}

// 7. 주문 매칭 계산
export async function matchOrderReward(params: {
  buyerUserId: number;
  storeId: number;
  orderAmount: number;
  selectedCardId?: number | null;
}) {
  if (isStaticMode()) {
    const matchResult = clientCalculateCardMatching(
      params.buyerUserId,
      params.storeId,
      params.orderAmount,
      params.selectedCardId
    );
    return { matchResult };
  }

  const res = await fetch('/api/orders/match', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  return res.json();
}

// 8. 주문 생성 및 결제
export async function submitOrderApi(params: {
  buyerUserId: number;
  storeId: number;
  items: any[];
  pointToUse?: number;
  selectedCardId?: number | null;
}) {
  if (isStaticMode()) {
    return clientCreateOrder(
      params.buyerUserId,
      params.storeId,
      params.items,
      params.pointToUse || 0,
      params.selectedCardId
    );
  }

  const res = await fetch('/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  return res.json();
}

// 9. 주문 상세 조회
export async function fetchOrderDetail(orderId: number) {
  if (isStaticMode()) {
    const db = getClientDb();
    const order = db.orders.find((o) => o.order_id === orderId);
    if (!order) return { error: '주문을 찾을 수 없습니다.' };
    const store = db.stores.find((s) => s.id === order.store_id);
    const payment = db.payments.find((p) => p.order_id === orderId);
    const points = db.pointLedger.filter((l) => l.order_id === orderId);
    const items = [
      { item_id: 1, menu_name: '황금 시그니처 바삭 후라이드', quantity: 1, price: 20000 },
      { item_id: 2, menu_name: '모짜렐라 치즈볼 (5개)', quantity: 1, price: 5000 },
    ];

    return {
      order: {
        ...order,
        store_name: store?.name || '',
      },
      items,
      payment,
      points,
    };
  }

  const res = await fetch(`/api/orders/${orderId}`);
  return res.json();
}

// 10. 점주 관리자 데이터 조회
export async function fetchStoreAdminDetail(storeId: number) {
  if (isStaticMode()) {
    const db = getClientDb();
    const store = db.stores.find((s) => s.id === storeId);
    const policy = db.policies.find((p) => p.store_id === storeId);
    const settlement = clientCalculateStoreSettlement(storeId);
    const orders = db.orders
      .filter((o) => o.store_id === storeId)
      .map((o) => {
        const u = db.users.find((usr) => usr.id === o.buyer_user_id);
        const p = db.payments.find((pay) => pay.order_id === o.order_id);
        return {
          ...o,
          buyer_name: u?.name || '구매자',
          pg_paid_amount: p?.pg_paid_amount || 0,
          point_used_amount: p?.point_used_amount || 0,
        };
      });
    const cards = db.cards
      .filter((c) => c.store_id === storeId)
      .map((c) => {
        const u = db.users.find((usr) => usr.id === c.owner_user_id);
        const orig = db.users.find((usr) => usr.id === c.original_user_id);
        return {
          ...c,
          owner_name: u?.name || '작성자',
          original_name: orig?.name || null,
        };
      });

    return { store, policy, settlement, orders, cards };
  }

  const res = await fetch(`/api/store-admin/${storeId}`);
  return res.json();
}

// 11. 배달 완료 처리
export async function deliverOrderApi(orderId: number) {
  if (isStaticMode()) {
    clientDeliverOrder(orderId);
    return { success: true, message: '배달이 완료 처리되었습니다.' };
  }

  const res = await fetch(`/api/orders/${orderId}/deliver`, { method: 'POST' });
  return res.json();
}

// 12. 포인트 확정 배치 트리거
export async function confirmPointsBatchApi() {
  if (isStaticMode()) {
    const count = clientConfirmPoints();
    return { success: true, message: `${count}건의 포인트가 확정되었습니다.` };
  }

  const res = await fetch('/api/admin/confirm-points', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ forceImmediate: true }),
  });
  return res.json();
}
