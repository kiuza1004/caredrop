'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { CheckCircle2, Sparkles, Share2, ArrowRight, Clock, Store, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

export default function OrderCompletePage() {
  const params = useParams();
  const router = useRouter();
  const orderId = parseInt(params.id as string, 10);

  const [orderData, setOrderData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/orders/${orderId}`)
      .then((res) => res.json())
      .then((data) => {
        setOrderData(data);
        setLoading(false);
      })
      .catch((e) => {
        console.error(e);
        setLoading(false);
      });
  }, [orderId]);

  if (loading) {
    return <div className="p-12 text-center text-xs text-slate-400">주문 정보를 불러오는 중...</div>;
  }

  if (!orderData || orderData.error) {
    return <div className="p-8 text-center text-xs text-slate-500">주문 내역을 찾을 수 없습니다.</div>;
  }

  const { order, items, payment, points } = orderData;
  const buyerEarn = points.find((p: any) => p.role_type === 'BUYER' && p.tx_type === 'EARN');

  return (
    <div className="flex-1 bg-slate-50 pb-20">
      {/* 1. Success Message */}
      <div className="bg-white p-6 text-center border-b border-slate-100 shadow-sm">
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3 shadow-sm">
          <CheckCircle2 className="w-9 h-9" />
        </div>
        <h1 className="text-lg font-extrabold text-slate-900">주문 및 결제 완료!</h1>
        <p className="text-xs text-slate-500 mt-1">
          주문번호: #{order.order_id} • {order.store_name}
        </p>
      </div>

      {/* 2. Zero-Effort: Automatically Assembled Pick Card */}
      <div className="p-4">
        <div className="bg-gradient-to-br from-rose-500 to-amber-500 rounded-2xl p-4 text-white shadow-md">
          <div className="inline-flex items-center gap-1 bg-white/20 backdrop-blur-md px-2 py-0.5 rounded-full text-[10px] font-bold mb-2">
            <Sparkles className="w-3 h-3 text-amber-200" />
            <span>Zero-Effort 자동 조립 완료</span>
          </div>

          <h2 className="text-base font-black leading-snug">
            방금 시킨 꿀조합 카드가<br />자동으로 완성되었습니다!
          </h2>
          <p className="text-[11px] text-rose-100 mt-1 leading-relaxed">
            별도 글쓰기나 사진 등록 없이 바로 친구에게 공유하세요. 친구가 주문할 때마다 나에게 1%가 적립됩니다!
          </p>

          {/* Menus in this combo */}
          <div className="mt-3 bg-black/20 rounded-xl p-2.5 backdrop-blur-sm text-xs space-y-1">
            <div className="font-bold text-[11px] text-amber-200">내 꿀조합 메뉴 구성:</div>
            {items.map((i: any) => (
              <div key={i.item_id} className="text-[11px] text-white flex justify-between">
                <span>• {i.menu_name}</span>
                <span>{i.quantity}개</span>
              </div>
            ))}
          </div>

          <div className="mt-3 flex gap-2">
            <button
              onClick={() => {
                // 내 카드함 링크 복사
                navigator.clipboard.writeText(`${window.location.origin}/my?tab=cards`);
                alert('내 큐레이션 카드 공유 링크가 클립보드에 복사되었습니다!');
              }}
              className="flex-1 bg-white text-rose-600 hover:bg-rose-50 font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>원클릭 공유하기</span>
            </button>
            <Link
              href="/my?tab=cards"
              className="bg-black/25 hover:bg-black/35 text-white font-semibold px-3 py-2.5 rounded-xl text-xs text-center flex items-center"
            >
              내 카드 보기
            </Link>
          </div>
        </div>
      </div>

      {/* 3. Pending Reward Status (환불 방어 상태머신) */}
      <div className="px-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-800 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              <span>적립 예정 포인트</span>
            </span>
            <span className="bg-amber-100 text-amber-800 font-extrabold text-[10px] px-2 py-0.5 rounded-full">
              PENDING
            </span>
          </div>

          <div className="text-xl font-extrabold text-slate-900">
            +{buyerEarn ? buyerEarn.amount.toLocaleString() : 0}P
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            * 환불 어뷰징 방지를 위해 배달 완료(DELIVERED) 후 24시간 뒤 가용 포인트로 일괄 확정됩니다.
          </p>

          {/* Quick Demo Deliver & Confirm Button */}
          <div className="pt-2 border-t border-slate-100">
            <Link
              href={`/store-admin/${order.store_id}`}
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-2 rounded-xl flex items-center justify-center gap-1 transition-colors"
            >
              <Store className="w-3.5 h-3.5 text-rose-600" />
              <span>점주 화면에서 배달 완료 및 즉시 확정 테스트 →</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 4. Payment Receipt */}
      <div className="px-4 mt-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm space-y-2 text-xs">
          <h3 className="font-bold text-slate-900">결제 영수증</h3>
          <div className="space-y-1 text-slate-600 text-[11px]">
            <div className="flex justify-between">
              <span>총 주문금액</span>
              <span>{order.order_amount.toLocaleString()}원</span>
            </div>
            {payment?.point_used_amount > 0 && (
              <div className="flex justify-between text-rose-600 font-semibold">
                <span>포인트 결제</span>
                <span>-{payment.point_used_amount.toLocaleString()}P</span>
              </div>
            )}
            <div className="pt-1.5 border-t flex justify-between font-extrabold text-xs text-slate-900">
              <span>카드 결제 (토스페이)</span>
              <span>{payment?.pg_paid_amount.toLocaleString()}원</span>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 mt-5">
        <Link
          href="/"
          className="block w-full text-center bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-3.5 rounded-2xl shadow-sm"
        >
          메인 화면으로 이동
        </Link>
      </div>
    </div>
  );
}
