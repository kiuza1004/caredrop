'use client';

import React, { useEffect, useState } from 'react';
import { ShieldCheck, Database, DollarSign, RefreshCw, Layers } from 'lucide-react';

export default function PlatformAdminPage() {
  const [stores, setStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = () => {
    setLoading(true);
    fetch('/api/stores')
      .then((res) => res.json())
      .then((data) => {
        setStores(data.stores || []);
        setLoading(false);
      })
      .catch((e) => {
        console.error(e);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="flex-1 bg-slate-50 pb-20">
      <div className="bg-white p-5 border-b border-slate-100 shadow-sm flex items-center justify-between">
        <div>
          <div className="inline-block bg-rose-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full mb-1">
            슈퍼 어드민
          </div>
          <h1 className="font-extrabold text-slate-900 text-base">CareDrop 플랫폼 총괄 자금 & 정산 센터</h1>
        </div>
        <button
          onClick={loadData}
          className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
          title="새로고침"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4 space-y-4">
        {/* Treasury Account Monitoring */}
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm space-y-2 text-xs">
          <h2 className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
            <Database className="w-4 h-4 text-rose-600" />
            <span>플랫폼 자금 흐름 & 부채 계정 모니터링</span>
          </h2>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            PG 결제대금은 PG사에 안전하게 보관되며, 배달 완료 시 API 지시를 통해 점주 정산금과 플랫폼 수취분(중개수수료 2.5% + 포인트 예치금)을 분리 입금합니다.
          </p>

          <div className="grid grid-cols-2 gap-2 pt-2">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <span className="text-[10px] text-slate-400 font-bold block">포인트 예치금 전용 계좌</span>
              <span className="font-extrabold text-slate-900 text-sm mt-0.5 block">분리 보관 운용</span>
              <span className="text-[9px] text-emerald-600 font-semibold mt-0.5 block">교차 결제 100% 현금 보전용</span>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <span className="text-[10px] text-slate-400 font-bold block">플랫폼 순수익 (중개수수료)</span>
              <span className="font-extrabold text-rose-600 text-sm mt-0.5 block">주문액의 2.5%</span>
              <span className="text-[9px] text-slate-400 mt-0.5 block">PG원가 3.0% 제외 순마진</span>
            </div>
          </div>
        </div>

        {/* Store Settlement Links */}
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm space-y-2 text-xs">
          <h2 className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-slate-700" />
            <span>가맹점별 실시간 정산 관리자 바로가기</span>
          </h2>
          <div className="space-y-1.5 pt-1">
            {stores.map((s) => (
              <a
                key={s.id}
                href={`/store-admin/${s.id}`}
                className="p-3 bg-slate-50 hover:bg-rose-50 rounded-xl flex items-center justify-between border border-slate-100 transition-colors block"
              >
                <div>
                  <span className="font-bold text-slate-900 block">{s.name}</span>
                  <span className="text-[10px] text-slate-400">{s.category} • {s.address}</span>
                </div>
                <span className="text-xs font-bold text-rose-600">정산서 보기 →</span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
