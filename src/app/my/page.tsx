'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { Sparkles, Clock, Share2, Layers, CheckCircle2, ArrowRight, RefreshCw, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { fetchUserDetail, confirmPointsBatchApi } from '@/lib/api-client';

function MyPageContent() {
  const searchParams = useSearchParams();
  const defaultTab = searchParams.get('tab') === 'cards' ? 'cards' : 'points';
  const [tab, setTab] = useState<'points' | 'cards' | 'received' | 'ledger'>(defaultTab as any);

  const { currentUser, userPoints, refreshPoints } = useApp();
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isConfirming, setIsConfirming] = useState(false);

  const loadUserData = () => {
    setLoading(true);
    fetchUserDetail(currentUser.id)
      .then((data) => {
        setUserData(data);
        setLoading(false);
      })
      .catch((e) => {
        console.error(e);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadUserData();
  }, [currentUser.id]);

  // 데모 편의 기능: 24시간 확정 배치 즉시 실행
  const handleForceConfirmPoints = async () => {
    setIsConfirming(true);
    try {
      const data = await confirmPointsBatchApi();
      alert(data.message || '포인트가 확정되었습니다.');
      refreshPoints();
      loadUserData();
    } catch (e: any) {
      alert(`오류: ${e.message}`);
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <div className="flex-1 bg-slate-50 pb-20">
      {/* 1. Profile Header */}
      <div className="bg-white p-5 border-b border-slate-100 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-500 to-amber-500 text-white flex items-center justify-center font-black text-lg shadow-sm">
              {currentUser.name.charAt(0)}
            </div>
            <div>
              <h1 className="font-extrabold text-slate-900 text-base">{currentUser.name}</h1>
              <p className="text-xs text-slate-400 mt-0.5">{currentUser.email}</p>
            </div>
          </div>
          <button
            onClick={() => {
              refreshPoints();
              loadUserData();
            }}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
            title="새로고침"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Point Summary Card */}
        <div className="mt-4 bg-gradient-to-r from-rose-600 to-rose-500 text-white rounded-2xl p-4 shadow-md">
          <div className="flex items-center justify-between text-xs text-rose-100 mb-1">
            <span>보유 가용 포인트 (1P = 1원)</span>
            <span className="bg-white/20 backdrop-blur-sm px-2 py-0.5 rounded-full text-[10px] font-bold">
              전 가맹점 교차 결제 가능
            </span>
          </div>
          <div className="text-2xl font-black tracking-tight">
            {userPoints.availablePoints.toLocaleString()}P
          </div>

          <div className="mt-3 pt-3 border-t border-white/20 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-300" />
              <span>적립 예정 (PENDING): <strong>+{userPoints.pendingPoints.toLocaleString()}P</strong></span>
            </div>
            {userPoints.pendingPoints > 0 && (
              <button
                disabled={isConfirming}
                onClick={handleForceConfirmPoints}
                className="bg-white text-rose-600 hover:bg-rose-50 font-bold px-2 py-1 rounded-lg text-[10px] shadow-sm transition-all"
              >
                {isConfirming ? '처리 중...' : '즉시 확정 테스트'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. Navigation Tabs */}
      <div className="flex border-b border-slate-200 bg-white text-xs font-bold text-slate-500">
        <button
          onClick={() => setTab('points')}
          className={`flex-1 py-3 text-center border-b-2 transition-colors ${
            tab === 'points' ? 'border-rose-600 text-rose-600' : 'border-transparent'
          }`}
        >
          포인트 요약
        </button>
        <button
          onClick={() => setTab('cards')}
          className={`flex-1 py-3 text-center border-b-2 transition-colors ${
            tab === 'cards' ? 'border-rose-600 text-rose-600' : 'border-transparent'
          }`}
        >
          내 카드 ({userData?.myCards?.length || 0})
        </button>
        <button
          onClick={() => setTab('received')}
          className={`flex-1 py-3 text-center border-b-2 transition-colors ${
            tab === 'received' ? 'border-rose-600 text-rose-600' : 'border-transparent'
          }`}
        >
          공유받은 카드
        </button>
        <button
          onClick={() => setTab('ledger')}
          className={`flex-1 py-3 text-center border-b-2 transition-colors ${
            tab === 'ledger' ? 'border-rose-600 text-rose-600' : 'border-transparent'
          }`}
        >
          원장 이력
        </button>
      </div>

      {/* 3. Tab Contents */}
      <div className="p-4">
        {loading ? (
          <div className="py-8 text-center text-xs text-slate-400">정보를 불러오는 중입니다...</div>
        ) : (
          <>
            {/* Tab: Points Guide */}
            {tab === 'points' && (
              <div className="space-y-4">
                <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm text-xs space-y-2">
                  <h3 className="font-bold text-slate-900">포인트 정책 안내</h3>
                  <ul className="text-slate-600 space-y-1.5 text-[11px] leading-relaxed list-disc list-inside">
                    <li><strong>1P = 1원 가치:</strong> 앱 내 모든 제휴 가맹점에서 최소 사용 금액 없이 1원 단위 사용 가능.</li>
                    <li><strong>가맹점 간 교차 결제 지원:</strong> A가게에서 적립된 포인트를 B가게에서 사용 시 플랫폼이 B가게에 100% 현금 보전.</li>
                    <li><strong>현금 출금 불가:</strong> 다단계·유사수신 의혹 원천 차단을 위해 계좌 출금은 지원하지 않습니다.</li>
                    <li><strong>24시간 환불 어뷰징 방어:</strong> 배달 완료 후 24시간 뒤 가용 포인트로 확정됩니다.</li>
                  </ul>
                </div>

                <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100 text-xs">
                  <div className="font-bold text-emerald-900 mb-1">30일 유효기간 자동 리셋 규칙</div>
                  <p className="text-emerald-800 text-[11px] leading-relaxed">
                    재주문하지 않아도 30일 이내에 내 링크를 통한 <strong>신규 유입(클릭) 1회 이상 발생 시</strong> 30일이 자동으로 계속 연장됩니다.
                  </p>
                </div>
              </div>
            )}

            {/* Tab: My Cards */}
            {tab === 'cards' && (
              <div className="space-y-3">
                {userData.myCards.length === 0 ? (
                  <div className="bg-white rounded-2xl p-6 text-center text-xs text-slate-400">
                    아직 생성한 큐레이션 카드가 없습니다.<br />
                    매장 페이지에서 원클릭으로 3초 만에 만들어보세요!
                  </div>
                ) : (
                  userData.myCards.map((card: any) => {
                    const daysLeft = Math.max(
                      0,
                      Math.ceil((new Date(card.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                    );
                    const isCombined = Boolean(card.original_user_id);

                    return (
                      <div
                        key={card.card_id}
                        className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm space-y-3"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="inline-block bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-full mb-1">
                              {card.store_name}
                            </div>
                            <h3 className="font-extrabold text-slate-900 text-sm">
                              {card.curation_payload?.title}
                            </h3>
                            <div className="text-[11px] font-mono text-rose-600 font-bold mt-0.5">
                              코드: {card.card_code}
                            </div>
                          </div>

                          <div className="text-right">
                            <span className="bg-rose-100 text-rose-700 font-bold text-[10px] px-2 py-0.5 rounded-full">
                              {isCombined ? '3인 합체 카드' : '단독 카드'}
                            </span>
                            <div className="text-[10px] text-slate-400 mt-1">
                              잔여: <strong className="text-rose-600">{daysLeft}일</strong>
                            </div>
                          </div>
                        </div>

                        {/* Card Stats */}
                        <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-xl text-[11px] text-slate-600">
                          <div>
                            하위 인용/사용 실적: <strong>{card.downline_count}명</strong>
                          </div>
                          <div>
                            후발 합류 여부: <strong>{card.has_joined_upline ? '합류 완료' : '단독 상태'}</strong>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(
                                `${window.location.origin}/card/${card.card_code}`
                              );
                              alert('내 카드 공유 링크가 클립보드에 복사되었습니다!');
                            }}
                            className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all"
                          >
                            <Share2 className="w-3.5 h-3.5" />
                            <span>공유 링크 복사</span>
                          </button>
                          <Link
                            href={`/card/${card.card_code}`}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-3 py-2 rounded-xl text-xs flex items-center"
                          >
                            미리보기
                          </Link>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* Tab: Received Cards */}
            {tab === 'received' && (
              <div className="space-y-3">
                {userData.receivedCards.length === 0 ? (
                  <div className="bg-white rounded-2xl p-6 text-center text-xs text-slate-400">
                    공유받은 카드가 없습니다.
                  </div>
                ) : (
                  userData.receivedCards.map((rc: any) => (
                    <div
                      key={rc.receipt_id}
                      className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex items-center justify-between"
                    >
                      <div>
                        <div className="text-[10px] text-slate-400">{rc.store_name}</div>
                        <h4 className="font-bold text-slate-900 text-xs">
                          {rc.curation_payload?.title}
                        </h4>
                        <div className="text-[10px] text-rose-600 font-semibold mt-0.5">
                          추천자: {rc.owner_name} ({rc.original_name ? `${rc.original_name} 합체` : '단독'})
                        </div>
                      </div>
                      <Link
                        href={`/card/${rc.card_code}`}
                        className="bg-slate-900 hover:bg-rose-600 text-white font-bold text-xs px-3 py-1.5 rounded-xl transition-all"
                      >
                        주문하기
                      </Link>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Tab: Point Ledger */}
            {tab === 'ledger' && (
              <div className="space-y-2">
                {userData.pointLedger.length === 0 ? (
                  <div className="bg-white rounded-2xl p-6 text-center text-xs text-slate-400">
                    원장 기록이 없습니다.
                  </div>
                ) : (
                  userData.pointLedger.map((l: any) => {
                    const isEarn = l.tx_type === 'EARN';
                    const isConfirmed = l.status === 'CONFIRMED';
                    return (
                      <div
                        key={l.ledger_id}
                        className="bg-white rounded-xl p-3 border border-slate-100 shadow-sm flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="font-bold text-slate-800">
                            {l.role_type === 'BUYER'
                              ? '구매자 적립 (1%)'
                              : l.role_type === 'REFERRER'
                              ? '전달자 리워드 (1%)'
                              : l.role_type === 'ORIGINAL'
                              ? '원작자 리워드 (1%)'
                              : '주문 시 포인트 결제'}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            {l.store_name} • #{l.order_id} • {l.created_at}
                          </div>
                        </div>

                        <div className="text-right">
                          <div
                            className={`font-black ${
                              isEarn ? 'text-rose-600' : 'text-slate-900'
                            }`}
                          >
                            {isEarn ? `+${l.amount.toLocaleString()}` : `-${l.amount.toLocaleString()}`}P
                          </div>
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                              isConfirmed
                                ? 'bg-emerald-100 text-emerald-800'
                                : l.status === 'PENDING'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {l.status}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function MyPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-xs text-slate-400">마이페이지를 불러오는 중...</div>}>
      <MyPageContent />
    </Suspense>
  );
}
