'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Store as StoreIcon, Sparkles, ChevronRight, Award, Zap, ArrowRight, ShieldCheck } from 'lucide-react';
import { useApp } from '@/context/AppContext';

export default function HomePage() {
  const { currentUser } = useApp();
  const [stores, setStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/stores')
      .then((res) => res.json())
      .then((data) => {
        setStores(data.stores || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="flex-1 bg-slate-50 pb-8">
      {/* 1. Hero Viral Banner */}
      <div className="bg-gradient-to-br from-rose-600 via-rose-500 to-amber-500 text-white p-5 shadow-sm">
        <div className="inline-flex items-center gap-1 bg-white/20 backdrop-blur-md px-2.5 py-1 rounded-full text-[11px] font-semibold mb-2">
          <Sparkles className="w-3.5 h-3.5 text-amber-200" />
          <span>Zero-Effort 인용형 3인 바이럴 리워드</span>
        </div>
        <h1 className="text-xl font-extrabold leading-snug tracking-tight">
          터치 1번으로 꿀조합 추천하고<br />
          나 + 친구 + 원작자 <span className="text-amber-200 underline decoration-white">총 3% 적립!</span>
        </h1>
        <p className="text-xs text-rose-100 mt-2 leading-relaxed">
          방문판매법 다단계 규제 100% 원천 봉쇄! 구매 강제성 없는 무료 추천권 & 활동 시 30일 자동 연장
        </p>

        {/* Quick Simulator CTA Buttons */}
        <div className="mt-4 pt-3 border-t border-white/20 flex items-center justify-between gap-2">
          <Link
            href="/card/YOUNGHEE88"
            className="flex-1 bg-white text-rose-600 font-bold px-3 py-2 rounded-xl text-center text-xs shadow-sm hover:bg-rose-50 transition-all flex items-center justify-center gap-1"
          >
            <span>합체 카드 체험하기</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
          <Link
            href="/my?tab=cards"
            className="bg-black/20 hover:bg-black/30 text-white font-medium px-3 py-2 rounded-xl text-xs backdrop-blur-sm transition-all"
          >
            내 카드함
          </Link>
        </div>
      </div>

      {/* 2. Fast Interactive Scenario Tester Box */}
      <div className="px-4 -mt-2">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
              핵심 바이럴 시나리오 1분 체험 가이드
            </h2>
          </div>
          <div className="grid grid-cols-3 gap-2 text-[11px] mt-2">
            <Link
              href="/card/CHULSOO77"
              className="p-2.5 bg-slate-50 hover:bg-rose-50 rounded-xl border border-slate-100 transition-all text-center block"
            >
              <div className="text-[10px] text-slate-400 font-bold">1단계 원작자</div>
              <div className="font-bold text-slate-800 mt-0.5">철수's 세트</div>
              <div className="text-[9px] text-rose-600 mt-0.5">단독 카드 보기 →</div>
            </Link>

            <Link
              href="/card/YOUNGHEE88"
              className="p-2.5 bg-rose-50/60 hover:bg-rose-100/60 rounded-xl border border-rose-100 transition-all text-center block"
            >
              <div className="text-[10px] text-rose-500 font-bold">2단계 인용 합체</div>
              <div className="font-bold text-rose-950 mt-0.5">영희 합체 카드</div>
              <div className="text-[9px] text-rose-700 mt-0.5">철수×영희 합체 →</div>
            </Link>

            <Link
              href="/checkout"
              className="p-2.5 bg-amber-50 hover:bg-amber-100 rounded-xl border border-amber-100 transition-all text-center block"
            >
              <div className="text-[10px] text-amber-600 font-bold">3단계 구매자</div>
              <div className="font-bold text-slate-800 mt-0.5">민수 주문 결제</div>
              <div className="text-[9px] text-amber-700 mt-0.5">3인 정산 적용 →</div>
            </Link>
          </div>
        </div>
      </div>

      {/* 3. Stores List */}
      <div className="px-4 mt-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-extrabold text-slate-900 text-base flex items-center gap-1.5">
            <StoreIcon className="w-4 h-4 text-rose-600" />
            주문 가능한 제휴 매장
          </h2>
          <span className="text-[11px] text-slate-400 font-medium">전체 {stores.length}곳</span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-400 text-xs">매장 정보를 불러오는 중입니다...</div>
        ) : (
          <div className="space-y-3">
            {stores.map((store) => (
              <Link
                key={store.id}
                href={`/store/${store.id}`}
                className="block bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-md transition-all group"
              >
                {/* Store Banner */}
                <div className="h-32 bg-slate-200 relative overflow-hidden">
                  <img
                    src={store.banner_url}
                    alt={store.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {store.category}
                  </div>
                  {store.policy_active === 1 && (
                    <div className="absolute top-2 right-2 bg-rose-600 text-white text-[10px] font-extrabold px-2.5 py-0.5 rounded-full shadow-sm flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-300" />
                      <span>최대 3.0% 리워드</span>
                    </div>
                  )}
                </div>

                {/* Store Content */}
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm group-hover:text-rose-600 transition-colors">
                        {store.name}
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">{store.address}</p>
                    </div>
                    <span className="text-xl">{store.logo_url}</span>
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-50 flex items-center justify-between text-xs text-slate-600">
                    <div className="flex items-center gap-3">
                      <span>최소주문 <strong>{store.min_order_amount.toLocaleString()}원</strong></span>
                      <span className="text-slate-300">•</span>
                      <span>배달팁 <strong>{store.delivery_fee.toLocaleString()}원</strong></span>
                    </div>
                    <span className="text-rose-600 font-bold text-xs flex items-center">
                      메뉴 보기 <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* 4. Legal Compliance & Zero-Effort Safety Notice */}
      <div className="px-4 mt-6">
        <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100 text-xs">
          <div className="flex items-center gap-1.5 font-bold text-emerald-900 mb-1">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            대한민국 방문판매법 준수 3대 안전 설계
          </div>
          <ul className="text-emerald-800 space-y-1 text-[11px] leading-relaxed list-disc list-inside">
            <li><strong>구매 강제성 100% 제거:</strong> 비주문 무료 회원도 1초 만에 무료 추천 카드 발급</li>
            <li><strong>30일 활동 연장:</strong> 단순 유입 클릭 발생 시에도 유효기간 30일 자동 리셋</li>
            <li><strong>저작권·콘텐츠 인용 모델:</strong> 꿀조합 세트 콘텐츠 공유 광고 수익 분배 (최대 3인 고정)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
