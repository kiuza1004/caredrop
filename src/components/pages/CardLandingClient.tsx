'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, ShoppingBag, Share2, Layers, CheckCircle2, Clock, ArrowRight } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { fetchCardDetail, remixCardApi } from '@/lib/api-client';

export default function CardLandingClient({ cardCode }: { cardCode: string }) {
  const router = useRouter();
  const { currentUser, addToCart, clearCart, setActiveCardCode } = useApp();

  const [cardData, setCardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isRemixing, setIsRemixing] = useState(false);
  const [remixResult, setRemixResult] = useState<any>(null);

  useEffect(() => {
    fetchCardDetail(cardCode, currentUser.id)
      .then((data) => {
        setCardData(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [cardCode, currentUser.id]);

  if (loading) {
    return <div className="p-12 text-center text-xs text-slate-400">큐레이션 카드를 불러오는 중...</div>;
  }

  if (!cardData || cardData.error) {
    return (
      <div className="p-8 text-center text-xs text-slate-600">
        <p className="font-bold text-slate-800 text-sm mb-2">존재하지 않거나 만료된 카드입니다.</p>
        <button
          onClick={() => router.push('/')}
          className="mt-4 bg-rose-600 text-white px-4 py-2 rounded-xl font-bold"
        >
          홈으로 이동
        </button>
      </div>
    );
  }

  const { card, store, menuItems } = cardData;
  const isCombinedCard = Boolean(card.original_user_id);
  const isOwner = card.owner_user_id === currentUser.id;

  const handleOrderSet = () => {
    clearCart();
    if (menuItems && menuItems.length > 0) {
      menuItems.forEach((m: any) => {
        addToCart({
          menuId: m.id,
          menuName: m.name,
          price: m.price,
          storeId: store.id,
        });
      });
    }
    setActiveCardCode(card.card_code);
    router.push('/checkout');
  };

  const handleRemix = async () => {
    setIsRemixing(true);
    try {
      const data = await remixCardApi(currentUser.id, card.card_id);
      if (data.card) {
        setRemixResult(data);
      } else {
        alert(data.error || '합체 카드 생성에 실패했습니다.');
      }
    } catch (err: any) {
      alert(`오류: ${err.message}`);
    } finally {
      setIsRemixing(false);
    }
  };

  return (
    <div className="flex-1 bg-slate-50 pb-20">
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-br from-rose-600 via-rose-500 to-amber-500 text-white p-5">
        <div className="inline-flex items-center gap-1.5 bg-black/20 backdrop-blur-md px-2.5 py-1 rounded-full text-[11px] font-semibold mb-2">
          <Clock className="w-3.5 h-3.5 text-amber-200" />
          <span>신규 유입 확인: 작성자 유효기간 30일 자동 연장 완료!</span>
        </div>

        <div className="flex items-center gap-2 mt-1">
          <span className="text-2xl">{store?.logo_url || '🍗'}</span>
          <div>
            <h2 className="text-xs text-rose-100 font-semibold">{store?.name}</h2>
            <h1 className="text-lg font-black tracking-tight leading-snug">
              {card.curation_payload?.title || '추천 꿀조합 세트'}
            </h1>
          </div>
        </div>
      </div>

      {/* 2. Visual Combined / Solo Badge */}
      <div className="px-4 -mt-3">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              {isCombinedCard ? (
                <div className="flex -space-x-2">
                  <div className="w-7 h-7 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-xs ring-2 ring-white">
                    {card.original_name?.charAt(0) || '원'}
                  </div>
                  <div className="w-7 h-7 rounded-full bg-rose-600 text-white flex items-center justify-center font-bold text-xs ring-2 ring-white">
                    {card.owner_name?.charAt(0) || '전'}
                  </div>
                </div>
              ) : (
                <div className="w-7 h-7 rounded-full bg-rose-600 text-white flex items-center justify-center font-bold text-xs">
                  {card.owner_name?.charAt(0) || '추'}
                </div>
              )}
              <div>
                <div className="text-xs font-bold text-slate-900">
                  {isCombinedCard ? `${card.original_name} × ${card.owner_name} 합체 쿠폰` : `${card.owner_name}의 단독 추천 쿠폰`}
                </div>
                <div className="text-[10px] text-slate-400">코드: {card.card_code}</div>
              </div>
            </div>

            <div className="text-right">
              <span className="bg-rose-100 text-rose-700 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                {isCombinedCard ? '3인 정산 3.0%' : '2인 정산 2.0%'}
              </span>
              <div className="text-[9px] text-slate-400 mt-0.5">유효기간 30일</div>
            </div>
          </div>

          {/* Reward Breakdown Preview */}
          <div className="mt-3 bg-rose-50/70 rounded-xl p-3 text-xs space-y-1.5">
            <div className="font-bold text-slate-900 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-rose-600" />
              <span>이 카드로 주문 시 예상 적립 혜택</span>
            </div>
            <div className="text-[11px] text-slate-600 space-y-0.5">
              <div className="flex justify-between">
                <span>구매자 ({currentUser.name.split(' ')[0]})</span>
                <strong className="text-rose-600 font-bold">1% 적립</strong>
              </div>
              <div className="flex justify-between">
                <span>전달자 ({card.owner_name?.split(' ')[0] || '전달자'})</span>
                <strong className="text-slate-800">1% 적립</strong>
              </div>
              {isCombinedCard && (
                <div className="flex justify-between">
                  <span>원작자 ({card.original_name?.split(' ')[0] || '원작자'})</span>
                  <strong className="text-slate-800">1% 적립</strong>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Recommended Menu Set Items */}
      <div className="p-4">
        <h3 className="font-extrabold text-slate-900 text-sm mb-2 flex items-center justify-between">
          <span>큐레이션 구성 메뉴</span>
          {card.curation_payload?.tag && (
            <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
              {card.curation_payload.tag}
            </span>
          )}
        </h3>

        {menuItems && menuItems.length > 0 ? (
          <div className="space-y-2">
            {menuItems.map((item: any) => (
              <div
                key={item.id}
                className="bg-white rounded-xl p-3 border border-slate-100 shadow-sm flex items-center justify-between"
              >
                <div>
                  <h4 className="font-bold text-slate-900 text-xs">{item.name}</h4>
                  <div className="text-xs text-rose-600 font-bold mt-0.5">
                    {item.price.toLocaleString()}원
                  </div>
                </div>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl p-4 border border-slate-100 text-center text-xs text-slate-500">
            원클릭 추천 태그 카드로, 매장의 모든 메뉴에 혜택이 적용됩니다!
          </div>
        )}
      </div>

      {/* 4. Action CTAs */}
      <div className="p-4 space-y-2.5">
        <button
          onClick={handleOrderSet}
          className="w-full bg-rose-600 hover:bg-rose-700 text-white font-extrabold py-3.5 rounded-2xl shadow-lg shadow-rose-200 flex items-center justify-center gap-2 text-sm active:scale-98 transition-all"
        >
          <ShoppingBag className="w-4 h-4" />
          <span>이 꿀조합 바로 담고 3인 적립 주문하기</span>
          <ArrowRight className="w-4 h-4" />
        </button>

        {!isOwner && (
          <button
            disabled={isRemixing}
            onClick={handleRemix}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 rounded-2xl shadow-sm flex items-center justify-center gap-2 text-xs active:scale-98 transition-all"
          >
            <Layers className="w-4 h-4 text-amber-400" />
            <span>
              {isRemixing
                ? '합체 카드 생성 중...'
                : `나도 이 조합 추천하고 1% 받기 (합체 카드 생성)`}
            </span>
          </button>
        )}

        {remixResult && (
          <div className="mt-3 bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-xs space-y-2">
            <div className="font-bold text-emerald-900 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>새로운 합체 카드가 발급되었습니다!</span>
            </div>
            <p className="text-emerald-800 text-[11px] leading-relaxed">
              {remixResult.message}
            </p>
            <div className="bg-white p-2 rounded-lg border border-emerald-200 font-mono font-bold text-emerald-700 select-all">
              내 합체 코드: {remixResult.card?.card_code}
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(
                  `${window.location.origin}/card/${remixResult.card?.card_code}`
                );
                alert('내 합체 카드 링크가 복사되었습니다!');
              }}
              className="w-full bg-emerald-600 text-white font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1 shadow-sm"
            >
              <Share2 className="w-3.5 h-3.5" />
              내 합체 링크 복사하기
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
