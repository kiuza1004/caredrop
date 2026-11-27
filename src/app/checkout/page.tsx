'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { Sparkles, ShieldAlert, CreditCard, ChevronDown, Check, ArrowRight, Minus, Plus, AlertCircle } from 'lucide-react';
import { CardMatchResult } from '@/lib/types';

export default function CheckoutPage() {
  const router = useRouter();
  const {
    currentUser,
    cart,
    updateQuantity,
    clearCart,
    cartTotal,
    activeCardCode,
    setActiveCardCode,
    userPoints,
    refreshPoints,
  } = useApp();

  const [matchResult, setMatchResult] = useState<CardMatchResult | null>(null);
  const [pointToUse, setPointToUse] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userReceivedCards, setUserReceivedCards] = useState<any[]>([]);
  const [selectedCardId, setSelectedCardId] = useState<number | null>(null);

  const storeId = cart.length > 0 ? cart[0].storeId : 1;

  // 유저 수신 카드 목록 조회
  useEffect(() => {
    fetch(`/api/users/${currentUser.id}`)
      .then((res) => res.json())
      .then((data) => {
        const cards = (data.receivedCards || []).filter((c: any) => c.store_id === storeId);
        setUserReceivedCards(cards);
      })
      .catch((e) => console.error(e));
  }, [currentUser.id, storeId]);

  // 카드 매칭 결과 계산 (자동 매칭 우선순위 반영)
  useEffect(() => {
    if (cart.length === 0) return;

    fetch('/api/orders/match', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        buyerUserId: currentUser.id,
        storeId,
        orderAmount: cartTotal,
        selectedCardId,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.matchResult) {
          setMatchResult(data.matchResult);
          if (data.matchResult.appliedCard && !selectedCardId) {
            setSelectedCardId(data.matchResult.appliedCard.card_id);
          }
        }
      })
      .catch((e) => console.error(e));
  }, [currentUser.id, storeId, cartTotal, selectedCardId, cart.length]);

  // 장바구니가 비어있는 경우 기본 예시 메뉴 세팅 버튼 제공
  const handleSetSampleOrder = () => {
    router.push('/store/1');
  };

  const handlePointChange = (val: number) => {
    const maxUse = Math.min(userPoints.availablePoints, cartTotal);
    const clamped = Math.max(0, Math.min(val, maxUse));
    setPointToUse(clamped);
  };

  const handleUseAllPoints = () => {
    handlePointChange(Math.min(userPoints.availablePoints, cartTotal));
  };

  // 결제 실행
  const handlePayment = async () => {
    if (cart.length === 0) {
      alert('주문할 메뉴를 담아주세요.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          buyerUserId: currentUser.id,
          storeId,
          items: cart.map((i) => ({
            menuId: i.menuId,
            menuName: i.menuName,
            price: i.price,
            quantity: i.quantity,
          })),
          pointToUse,
          selectedCardId,
        }),
      });

      const data = await res.json();
      if (data.success && data.orderId) {
        clearCart();
        refreshPoints();
        router.push(`/order/complete/${data.orderId}`);
      } else {
        alert(data.error || '주문 처리에 실패했습니다.');
      }
    } catch (err: any) {
      alert(`오류: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="flex-1 bg-slate-50 p-6 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
          <CreditCard className="w-8 h-8" />
        </div>
        <h2 className="font-extrabold text-slate-900 text-base mb-1">장바구니가 비어 있습니다</h2>
        <p className="text-xs text-slate-500 mb-5 leading-relaxed">
          매장에서 맛있는 메뉴를 고르거나 꿀조합 카드를 통해 바로 담아보세요.
        </p>
        <button
          onClick={handleSetSampleOrder}
          className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-5 py-3 rounded-2xl shadow-sm"
        >
          제휴 매장 메뉴 보러가기
        </button>
      </div>
    );
  }

  const pgPaidAmount = Math.max(0, cartTotal - pointToUse);

  return (
    <div className="flex-1 bg-slate-50 pb-24">
      {/* 1. Checkout Header */}
      <div className="bg-white p-4 border-b border-slate-100 shadow-sm">
        <h1 className="text-base font-extrabold text-slate-900">주문서 및 결제하기</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          주문자: <strong className="text-slate-800">{currentUser.name}</strong>
        </p>
      </div>

      {/* 2. Order Items List */}
      <div className="p-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm space-y-3">
          <h2 className="text-xs font-bold text-slate-900">주문 메뉴</h2>
          {cart.map((item) => (
            <div key={item.menuId} className="flex items-center justify-between py-1">
              <div className="flex-1">
                <div className="text-xs font-bold text-slate-800">{item.menuName}</div>
                <div className="text-[11px] text-slate-400">
                  {item.price.toLocaleString()}원 × {item.quantity}개
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden">
                  <button
                    onClick={() => updateQuantity(item.menuId, -1)}
                    className="p-1 hover:bg-slate-100 text-slate-600"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="px-2 text-xs font-bold">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.menuId, 1)}
                    className="p-1 hover:bg-slate-100 text-slate-600"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
                <div className="text-xs font-extrabold text-slate-900 w-16 text-right">
                  {(item.price * item.quantity).toLocaleString()}원
                </div>
              </div>
            </div>
          ))}
          <div className="pt-2 border-t border-slate-100 flex justify-between text-xs">
            <span className="font-semibold text-slate-600">주문 총액</span>
            <span className="font-extrabold text-slate-900">{cartTotal.toLocaleString()}원</span>
          </div>
        </div>
      </div>

      {/* 3. Automatic Best Card Matching (합체 쿠폰 우선순위 적용) */}
      <div className="px-4">
        <div className="bg-white rounded-2xl p-4 border border-rose-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 font-extrabold text-xs text-rose-600">
              <Sparkles className="w-4 h-4" />
              <span>원클릭 큐레이션 쿠폰 자동 적용</span>
            </div>
            <span className="bg-rose-100 text-rose-700 font-extrabold text-[10px] px-2 py-0.5 rounded-full">
              최대 3인 혜택 우선
            </span>
          </div>

          {matchResult ? (
            <div className="space-y-2">
              <div className="bg-rose-50/80 rounded-xl p-3 border border-rose-100 text-xs">
                <div className="font-bold text-slate-900 flex items-center justify-between">
                  <span>{matchResult.caseDescription}</span>
                  <span className="text-rose-600 font-extrabold text-sm">
                    {Math.round(matchResult.totalRewardRate * 100)}% 적립
                  </span>
                </div>

                {/* 4-Cases Breakdown Visual */}
                <div className="mt-2 pt-2 border-t border-rose-200/50 space-y-1 text-[11px] text-slate-600">
                  <div className="flex justify-between">
                    <span>• 구매자 본인 ({currentUser.name.split(' ')[0]}):</span>
                    <strong className="text-rose-600 font-bold">{matchResult.buyerAmount.toLocaleString()}원 (1%)</strong>
                  </div>

                  {matchResult.referrerAmount > 0 && (
                    <div className="flex justify-between">
                      <span>• 전달자 ({matchResult.appliedCard?.owner_name || '전달자'}):</span>
                      <strong className="text-slate-800">{matchResult.referrerAmount.toLocaleString()}원 (1%)</strong>
                    </div>
                  )}

                  {matchResult.originalAmount > 0 && (
                    <div className="flex justify-between">
                      <span>• 원작자 ({matchResult.appliedCard?.original_name || '원작자'}):</span>
                      <strong className="text-slate-800">{matchResult.originalAmount.toLocaleString()}원 (1%)</strong>
                    </div>
                  )}
                </div>
              </div>

              {/* Self-referral alert */}
              {matchResult.isSelfReferral && (
                <div className="bg-amber-50 rounded-xl p-2.5 border border-amber-200 text-[11px] text-amber-800 flex items-start gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>본인 카드 재주문 감지:</strong> 전달자 1% 중복 수령은 차단되며 구매자 1% 및 상위 원작자 1%가 적립됩니다 (카드 30일 연장).
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="text-xs text-slate-400">혜택 계산 중...</div>
          )}

          {/* Change Card Selector */}
          {userReceivedCards.length > 0 && (
            <div className="pt-2">
              <label className="text-[11px] text-slate-400 block mb-1">적용 쿠폰 선택/변경</label>
              <select
                value={selectedCardId || ''}
                onChange={(e) => setSelectedCardId(e.target.value ? parseInt(e.target.value, 10) : null)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs text-slate-800 font-medium"
              >
                <option value="">자동 최적 매칭</option>
                {userReceivedCards.map((rc: any) => (
                  <option key={rc.card_id} value={rc.card_id}>
                    {rc.card_code} - {rc.curation_payload?.title} ({rc.original_user_id ? '3인 합체' : '단독'})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* 4. Cross-Store Point Usage (가맹점 간 교차 결제 - 1원 단위 전액 사용 가능) */}
      <div className="px-4 mt-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-900">포인트 교차 결제 사용</h2>
            <div className="text-xs text-slate-500">
              보유 가용 포인트: <strong className="text-rose-600">{userPoints.availablePoints.toLocaleString()}P</strong>
            </div>
          </div>
          <p className="text-[10px] text-slate-400 leading-relaxed">
            * 앱 내 모든 가맹점에서 1원 단위로 교차 사용 가능하며, 점주에게는 플랫폼 예치금에서 현금으로 100% 보전됩니다.
          </p>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="number"
              min={0}
              max={userPoints.availablePoints}
              value={pointToUse === 0 ? '' : pointToUse}
              placeholder="0"
              onChange={(e) => handlePointChange(parseInt(e.target.value, 10) || 0)}
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-sm font-bold text-slate-900 focus:outline-none focus:border-rose-500"
            />
            <button
              onClick={handleUseAllPoints}
              className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-3 py-2.5 rounded-xl transition-all"
            >
              전액 사용
            </button>
          </div>
        </div>
      </div>

      {/* 5. Final Payment Breakdown & PG Pay Button */}
      <div className="px-4 mt-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm space-y-2 text-xs">
          <h2 className="font-bold text-slate-900">최종 결제 금액</h2>
          <div className="space-y-1 text-slate-600">
            <div className="flex justify-between">
              <span>주문 메뉴 총액</span>
              <span>{cartTotal.toLocaleString()}원</span>
            </div>
            {pointToUse > 0 && (
              <div className="flex justify-between text-rose-600 font-bold">
                <span>포인트 사용</span>
                <span>-{pointToUse.toLocaleString()}P</span>
              </div>
            )}
            <div className="pt-2 border-t border-slate-100 flex justify-between text-sm font-extrabold text-slate-900">
              <span>PG 최종 카드결제액</span>
              <span className="text-rose-600">{pgPaidAmount.toLocaleString()}원</span>
            </div>
          </div>

          <button
            disabled={isSubmitting}
            onClick={handlePayment}
            className="w-full mt-3 bg-rose-600 hover:bg-rose-700 text-white font-extrabold py-3.5 rounded-2xl shadow-lg shadow-rose-200 flex items-center justify-center gap-2 text-sm active:scale-98 transition-all"
          >
            <CreditCard className="w-4 h-4" />
            <span>
              {isSubmitting
                ? '결제 처리 중...'
                : `${pgPaidAmount.toLocaleString()}원 결제하기 (토스페이 Mock)`}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
