'use client';

import React, { useEffect, useState } from 'react';
import { Store, Sliders, CheckCircle2, XCircle, DollarSign, RefreshCw } from 'lucide-react';
import { fetchStoreAdminDetail, deliverOrderApi, confirmPointsBatchApi } from '@/lib/api-client';

export default function StoreAdminClient({ storeId }: { storeId: number }) {
  const [adminData, setAdminData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSavingPolicy, setIsSavingPolicy] = useState(false);

  // Policy Form State
  const [isActive, setIsActive] = useState(true);
  const [buyerRate, setBuyerRate] = useState(0.010);
  const [referrerRate, setReferrerRate] = useState(0.010);
  const [originalRate, setOriginalRate] = useState(0.010);
  const [validDays, setValidDays] = useState(30);

  const loadData = () => {
    setLoading(true);
    fetchStoreAdminDetail(storeId)
      .then((data) => {
        setAdminData(data);
        if (data.policy) {
          setIsActive(Boolean(data.policy.is_active));
          setBuyerRate(data.policy.buyer_rate);
          setReferrerRate(data.policy.referrer_rate);
          setOriginalRate(data.policy.original_rate);
          setValidDays(data.policy.valid_days);
        }
        setLoading(false);
      })
      .catch((e) => {
        console.error(e);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadData();
  }, [storeId]);

  const handleDeliver = async (orderId: number) => {
    try {
      const data = await deliverOrderApi(orderId);
      alert(data.message || '배달 완료 처리되었습니다.');
      loadData();
    } catch (e: any) {
      alert(`오류: ${e.message}`);
    }
  };

  const handleConfirmBatch = async () => {
    try {
      const data = await confirmPointsBatchApi();
      alert(data.message || '포인트가 확정되었습니다.');
      loadData();
    } catch (e: any) {
      alert(`오류: ${e.message}`);
    }
  };

  if (loading || !adminData) {
    return <div className="p-12 text-center text-xs text-slate-400">점주 관리자 데이터를 불러오는 중...</div>;
  }

  const { store, settlement, orders, cards } = adminData;

  return (
    <div className="flex-1 bg-slate-50 pb-20">
      <div className="bg-white p-5 border-b border-slate-100 shadow-sm flex items-center justify-between">
        <div>
          <div className="inline-block bg-slate-900 text-white text-[10px] font-bold px-2 py-0.5 rounded-full mb-1">
            가맹점 관리자 페이지
          </div>
          <h1 className="font-extrabold text-slate-900 text-base">{store.name}</h1>
          <p className="text-xs text-slate-400 mt-0.5">{store.address}</p>
        </div>

        <button
          onClick={loadData}
          className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
          title="새로고침"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Settlement Table */}
      <div className="p-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              <span>정산 내역서 (교차 결제 상계 정산)</span>
            </h2>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
              배달 완료 주문 기준
            </span>
          </div>

          <div className="bg-slate-50 rounded-xl p-3 text-xs space-y-2">
            <div className="flex justify-between text-slate-700">
              <span>① 총 주문매출 (100%)</span>
              <strong className="text-slate-900 font-extrabold">{settlement.totalOrderAmount.toLocaleString()}원</strong>
            </div>

            <div className="pl-2 border-l-2 border-slate-200 text-[11px] text-slate-500 space-y-1">
              <div className="flex justify-between">
                <span>- 카드 실결제액 (PG):</span>
                <span>{settlement.totalPgPaidAmount.toLocaleString()}원</span>
              </div>
              <div className="flex justify-between">
                <span>- 포인트 교차 결제액:</span>
                <span className="text-rose-600 font-semibold">{settlement.totalPointUsedAmount.toLocaleString()}원</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200 space-y-1 text-[11px] text-slate-600">
              <div className="flex justify-between">
                <span>② PG 카드 결제 원가 실비 (3.0%):</span>
                <span className="text-slate-900">-{settlement.pgFee.toLocaleString()}원</span>
              </div>
              <div className="flex justify-between">
                <span>③ 플랫폼 중개 수수료 (2.5%):</span>
                <span className="text-slate-900">-{settlement.platformFee.toLocaleString()}원</span>
              </div>
              <div className="flex justify-between">
                <span>④ 제휴 리워드 점주 부담금 (1~3%):</span>
                <span className="text-slate-900">-{settlement.rewardEarnedAmount.toLocaleString()}원</span>
              </div>
              <div className="flex justify-between text-emerald-700 font-bold bg-emerald-50/80 p-1.5 rounded-lg">
                <span>⑤ 타 매장 포인트 교차사용 플랫폼 현금보전:</span>
                <span>+{settlement.crossPointUsedAmount.toLocaleString()}원</span>
              </div>
            </div>

            <div className="pt-2 border-t-2 border-slate-300 flex justify-between items-center text-sm">
              <span className="font-extrabold text-slate-900">최종 점주 입금 정산금</span>
              <span className="font-black text-rose-600 text-base">
                {settlement.finalSettlementAmount.toLocaleString()}원
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Orders Management */}
      <div className="p-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-extrabold text-slate-900 text-sm">실시간 주문 관리 ({orders.length}건)</h2>
            <button
              onClick={handleConfirmBatch}
              className="bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-[10px] px-2.5 py-1 rounded-lg transition-colors"
            >
              24시간 확정 배치 실행
            </button>
          </div>

          <div className="space-y-3">
            {orders.map((o: any) => (
              <div
                key={o.order_id}
                className="bg-slate-50 rounded-xl p-3 border border-slate-200/70 text-xs space-y-2"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-bold text-slate-900">
                      주문 #{o.order_id} • {o.buyer_name}
                    </div>
                    <div className="text-[10px] text-slate-400">{o.created_at}</div>
                  </div>
                  <span
                    className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                      o.status === 'DELIVERED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : o.status === 'PAID'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {o.status === 'PAID' ? '결제완료 (배달대기)' : o.status === 'DELIVERED' ? '배달완료' : '취소됨'}
                  </span>
                </div>

                <div className="flex justify-between text-[11px] text-slate-600">
                  <span>총 주문액: <strong>{o.order_amount.toLocaleString()}원</strong></span>
                  <span>(카드 {o.pg_paid_amount?.toLocaleString() || 0}원 / 포인트 {o.point_used_amount?.toLocaleString() || 0}P)</span>
                </div>

                {o.status === 'PAID' && (
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => handleDeliver(o.order_id)}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-1.5 rounded-lg text-xs flex items-center justify-center gap-1 shadow-sm"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>배달 완료 처리</span>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
