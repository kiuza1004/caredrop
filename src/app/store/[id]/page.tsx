'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Sparkles, Plus, Check, ShoppingBag, Share2, Tag, ArrowLeft, Clock } from 'lucide-react';
import { useApp } from '@/context/AppContext';

export default function StoreDetailPage() {
  const params = useParams();
  const router = useRouter();
  const storeId = parseInt(params.id as string, 10);
  const { currentUser, addToCart, cart, cartCount, cartTotal } = useApp();

  const [storeData, setStoreData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // 미주문 유저용 원클릭 태그 카드 생성 모달
  const [showTagModal, setShowTagModal] = useState(false);
  const [generatedCard, setGeneratedCard] = useState<any>(null);
  const [isCreatingCard, setIsCreatingCard] = useState(false);

  const PRESET_TAGS = [
    '👍 동네 찐맛집',
    '🍺 야식·안주 최고',
    '👨‍👩‍👧‍👦 아이랑 먹기 좋아요',
    '🛵 배달 초고속',
    '✨ 가성비 최강 조합',
  ];

  useEffect(() => {
    fetch(`/api/stores/${storeId}`)
      .then((res) => res.json())
      .then((data) => {
        setStoreData(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [storeId]);

  // 원클릭 프리셋 태그 카드 발급 (터치 1번 3초 완성)
  const handleCreateTagCard = async (tag: string) => {
    setIsCreatingCard(true);
    try {
      const res = await fetch('/api/cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId,
          ownerUserId: currentUser.id,
          curationType: 'PRESET_TAG',
          curationPayload: {
            title: `${currentUser.name.split(' ')[0]}의 추천 - ${tag}`,
            tag,
            menu_ids: [],
            menu_names: []
          }
        })
      });

      const data = await res.json();
      if (data.card) {
        setGeneratedCard(data.card);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsCreatingCard(false);
    }
  };

  if (loading || !storeData) {
    return <div className="p-8 text-center text-xs text-slate-400">매장 정보를 불러오는 중...</div>;
  }

  const { store, menus } = storeData;

  return (
    <div className="flex-1 bg-slate-50 pb-24">
      {/* 1. Header Banner */}
      <div className="relative h-44 bg-slate-900 overflow-hidden">
        <img
          src={store.banner_url}
          alt={store.name}
          className="w-full h-full object-cover opacity-85"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>

        <button
          onClick={() => router.back()}
          className="absolute top-3 left-3 w-8 h-8 rounded-full bg-black/40 backdrop-blur-md text-white flex items-center justify-center hover:bg-black/60"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        <div className="absolute bottom-3 left-4 right-4 text-white">
          <div className="inline-block bg-rose-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full mb-1">
            {store.category}
          </div>
          <h1 className="text-lg font-extrabold tracking-tight">{store.name}</h1>
          <p className="text-[11px] text-slate-200 mt-0.5">{store.address}</p>
        </div>
      </div>

      {/* 2. Zero-Effort Free Curation Card CTA (미주문 회원도 무료 발급) */}
      <div className="px-4 py-3 bg-gradient-to-r from-rose-50 to-amber-50 border-b border-rose-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-rose-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900 flex items-center gap-1">
              <span>미주문 회원도 1초 무료 카드 발급!</span>
            </div>
            <div className="text-[10px] text-slate-500">
              구매 의무 0원! 친구가 주문할 때마다 나에게 1% 적립
            </div>
          </div>
        </div>
        <button
          onClick={() => setShowTagModal(true)}
          className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-3 py-1.5 rounded-xl shadow-sm transition-transform active:scale-95"
        >
          카드 만들기
        </button>
      </div>

      {/* 3. Menu List */}
      <div className="p-4">
        <h2 className="font-extrabold text-slate-900 text-sm mb-3">대표 메뉴</h2>
        <div className="space-y-3">
          {menus.map((menu: any) => {
            const inCart = cart.find((i) => i.menuId === menu.id);
            return (
              <div
                key={menu.id}
                className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex items-start justify-between gap-3 hover:border-rose-100 transition-all"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-1.5">
                    {menu.is_popular === 1 && (
                      <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-1.5 py-0.5 rounded">
                        인기
                      </span>
                    )}
                    <h3 className="font-bold text-slate-900 text-sm">{menu.name}</h3>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                    {menu.description}
                  </p>
                  <div className="mt-2 text-rose-600 font-extrabold text-sm">
                    {menu.price.toLocaleString()}원
                  </div>
                </div>

                <div className="flex flex-col items-end justify-between self-stretch shrink-0">
                  <button
                    onClick={() =>
                      addToCart({
                        menuId: menu.id,
                        menuName: menu.name,
                        price: menu.price,
                        storeId: store.id,
                      })
                    }
                    className="mt-auto flex items-center gap-1 bg-slate-900 hover:bg-rose-600 text-white text-xs font-semibold px-3 py-1.5 rounded-xl transition-all shadow-sm active:scale-95"
                  >
                    {inCart ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>담김 ({inCart.quantity})</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5" />
                        <span>담기</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Floating Cart Summary Bar */}
      {cartCount > 0 && (
        <div className="fixed bottom-14 left-0 right-0 max-w-[480px] mx-auto p-3 z-30 pointer-events-none">
          <div className="bg-slate-900 text-white p-3.5 rounded-2xl shadow-xl flex items-center justify-between pointer-events-auto">
            <div>
              <div className="text-[11px] text-slate-400">총 {cartCount}개 메뉴 담김</div>
              <div className="text-sm font-extrabold text-white">
                {cartTotal.toLocaleString()}원
              </div>
            </div>
            <button
              onClick={() => router.push('/checkout')}
              className="bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>주문서 작성하기</span>
            </button>
          </div>
        </div>
      )}

      {/* 5. One-Click Preset Tag Card Creation Modal */}
      {showTagModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl p-5 max-w-sm w-full shadow-2xl">
            <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-1.5 mb-1">
              <Tag className="w-4 h-4 text-rose-600" />
              터치 1번 원클릭 추천 카드 발급
            </h3>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              원하는 키워드를 누르면 즉시 고유 코드가 발급됩니다. 글쓰기나 사진 등록 없이 바로 공유할 수 있습니다!
            </p>

            {generatedCard ? (
              <div className="bg-rose-50 rounded-xl p-4 border border-rose-100 text-center space-y-3">
                <div className="inline-block bg-rose-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                  카드 발급 완료!
                </div>
                <div className="font-extrabold text-slate-900 text-base">
                  {generatedCard.curation_payload?.title}
                </div>
                <div className="bg-white p-2 rounded-lg border border-rose-200 text-xs font-mono font-bold text-rose-600 select-all">
                  코드: {generatedCard.card_code}
                </div>
                <p className="text-[11px] text-slate-500">
                  친구가 이 코드로 접속하거나 주문 시 <strong>나에게 1% 적립</strong> & 30일 자동 연장!
                </p>
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(
                        `${window.location.origin}/card/${generatedCard.card_code}`
                      );
                      alert('카드 공유 링크가 클립보드에 복사되었습니다!');
                    }}
                    className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    공유 링크 복사
                  </button>
                  <button
                    onClick={() => {
                      setShowTagModal(false);
                      setGeneratedCard(null);
                    }}
                    className="bg-slate-200 text-slate-700 font-semibold px-3 py-2 rounded-xl text-xs"
                  >
                    닫기
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {PRESET_TAGS.map((tag) => (
                  <button
                    key={tag}
                    disabled={isCreatingCard}
                    onClick={() => handleCreateTagCard(tag)}
                    className="w-full text-left p-3 rounded-xl border border-slate-200 hover:border-rose-400 hover:bg-rose-50/50 flex items-center justify-between text-xs font-bold text-slate-800 transition-all active:scale-98"
                  >
                    <span>{tag}</span>
                    <span className="text-[10px] text-rose-600 font-semibold">1초 발급 →</span>
                  </button>
                ))}
                <button
                  onClick={() => setShowTagModal(false)}
                  className="w-full mt-3 text-slate-400 hover:text-slate-600 text-xs py-2 font-medium"
                >
                  취소
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
