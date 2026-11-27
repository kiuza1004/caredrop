'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Store, Sliders, CheckCircle2, XCircle, ArrowUpRight, ShieldCheck, DollarSign, RefreshCw, AlertTriangle } from 'lucide-react';

export default function StoreAdminPage() {
  const params = useParams();
  const storeId = parseInt(params.id as string, 10);

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
    fetch(`/api/store-admin/${storeId}`)
      .then((res) => res.json())
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

  // 점주 정책 업데이트
  const handleSavePolicy = async () => {
    setIsSavingPolicy(true);
    try {
      const res = await fetch(`/api/store-admin/${storeId}/policy`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isActive,
          buyerRate: parseFloat(buyerRate.toString()),
          referrerRate: parseFloat(referrerRate.toString()),
          originalRate: parseFloat(originalRate.toString()),
          validDays: parseInt(validDays.toString(), 10),
        }),
      });
      const data = await res.json();
      alert(data.message || '정책이 저장되었습니다.');
      loadData();
    } catch (e: any) {
      alert(`오류: ${e.message}`);
    } finally {
      setIsSavingPolicy(false);
    }
  };

  // 배달 완료 처리
  const handleDeliver = async (orderId: number) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/deliver`, { method: 'POST' });
      const data = await res.json();
      alert(data.message || '배달 완료 처리되었습니다.');
      loadData();
    } catch (e: any) {
      alert(`오류: ${e.message}`);
    }
  };

  // 주문 취소
  const handleCancel = async (orderId: number) => {
    if (!confirm('정말 주문을 취소하고 환불하시겠습니까?')) return;
    try {
      const res = await fetch(`/api/orders/${orderId}/cancel`, { method: 'POST' });
      const data = await res.json();
      alert(data.message || '주문이 취소되었습니다.');
      loadData();
    } catch (e: any) {
      alert(`오류: ${e.message}`);
    }
  };

  // 24시간 포인트 확정 배치 즉시 실행
  const handleConfirmBatch = async () => {
    try {
      const res = await fetch('/api/admin/confirm-points', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ forceImmediate: true }),
      });
      const data = await res.json();
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
      {/* 1. Header */}
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

      {/* 2. Settlement Table (상계 정산 명세서) */}
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

          <div className="text-[10px] text-slate-400 leading-relaxed">
            * 고객이 타 매장에서 적립된 포인트를 본 매장에서 결제한 경우, 플랫폼이 분리 보관 중인 <strong>'포인트 예치금 전용 계좌'에서 100% 현금으로 보전</strong>하여 지급합니다.
          </div>
        </div>
      </div>

      {/* 3. Affiliate Reward Policy Settings (점주 제어권) */}
      <div className="px-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-rose-600" />
              <span>제휴 리워드 요율 및 정책 제어</span>
            </h2>
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-slate-700">프로그램 ON/OFF</label>
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 accent-rose-600 rounded"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 text-xs">
            <div>
              <label className="text-[10px] text-slate-500 font-semibold block mb-1">구매자 적립률</label>
              <input
                type="number"
                step="0.005"
                value={buyerRate}
                onChange={(e) => setBuyerRate(parseFloat(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-bold text-slate-900"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">{Math.round(buyerRate * 1000) / 10}%</span>
            </div>
            <div>
              <label className="text-[10px] text-slate-500 font-semibold block mb-1">전달자 리워드</label>
              <input
                type="number"
                step="0.005"
                value={referrerRate}
                onChange={(e) => setReferrerRate(parseFloat(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-bold text-slate-900"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">{Math.round(referrerRate * 1000) / 10}%</span>
            </div>
            <div>
              <label className="text-[10px] text-slate-500 font-semibold block mb-1">원작자 리워드</label>
              <input
                type="number"
                step="0.005"
                value={originalRate}
                onChange={(e) => setOriginalRate(parseFloat(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-bold text-slate-900"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">{Math.round(originalRate * 1000) / 10}%</span>
            </div>
          </div>

          <div className="text-[10px] text-slate-400">
            * 일일 예산 한도(Cap) 미적용 원칙: 주문량 제한 없이 100% 정률 지급됩니다.
          </div>

          <button
            disabled={isSavingPolicy}
            onClick={handleSavePolicy}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-xl text-xs transition-all"
          >
            {isSavingPolicy ? '저장 중...' : '리워드 요율 설정 저장'}
          </button>
        </div>
      </div>

      {/* 4. Orders Management & Delivery Completion */}
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

                {/* Delivery and Cancel Action Buttons */}
                {o.status === 'PAID' && (
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => handleDeliver(o.order_id)}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-1.5 rounded-lg text-xs flex items-center justify-center gap-1 shadow-sm"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>배달 완료 처리</span>
                    </button>
                    <button
                      onClick={() => handleCancel(o.order_id)}
                      className="bg-slate-200 hover:bg-rose-100 hover:text-rose-700 text-slate-700 font-semibold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>취소</span>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 5. Curation Cards Generated for This Store */}
      <div className="px-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm space-y-2">
          <h2 className="font-extrabold text-slate-900 text-xs">매장 바이럴 카드 모니터링 ({cards.length}개)</h2>
          <div className="space-y-1.5">
            {cards.map((c: any) => (
              <div
                key={c.card_id}
                className="p-2.5 bg-slate-50 rounded-xl text-xs flex items-center justify-between"
              >
                <div>
                  <div className="font-bold text-slate-800">{c.curation_payload?.title}</div>
                  <div className="text-[10px] text-slate-400">
                    작성자: {c.owner_name} {c.original_name ? `(원작: ${c.original_name})` : '(단독)'} • 하위 실적: {c.downline_count}명
                  </div>
                </div>
                <span className="font-mono text-[11px] text-rose-600 font-bold">{c.card_code}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
