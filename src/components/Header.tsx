'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useApp, DEMO_USERS } from '@/context/AppContext';
import { Users, ChevronDown, Sparkles, ShoppingBag } from 'lucide-react';
import PwaBanner from './PwaBanner';

export default function Header() {
  const { currentUser, setCurrentUser, userPoints, cartCount } = useApp();
  const [showUserModal, setShowUserModal] = useState(false);

  return (
    <>
      <PwaBanner />
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-slate-100 shadow-sm">
        <div className="flex items-center justify-between px-4 py-3">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-1.5 group">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-rose-600 to-rose-400 flex items-center justify-center text-white font-extrabold text-lg shadow-sm group-hover:scale-105 transition-transform">
              C
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-tight text-slate-900 block leading-none">
                CareDrop
              </span>
              <span className="text-[10px] text-rose-600 font-semibold tracking-wider uppercase block mt-0.5">
                원클릭 바이럴 배달
              </span>
            </div>
          </Link>

          {/* User Persona Switcher & Cart */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowUserModal(true)}
              className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1.5 rounded-full text-xs font-medium transition-colors"
            >
              <Users className="w-3.5 h-3.5 text-rose-500" />
              <span className="max-w-[85px] truncate font-semibold">{currentUser.name.split(' ')[0]}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            <Link
              href="/checkout"
              className="relative p-2 text-slate-700 hover:text-rose-600 transition-colors"
              aria-label="장바구니"
            >
              <ShoppingBag className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-rose-600 text-white rounded-full text-[10px] font-bold flex items-center justify-center shadow-sm">
                  {cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* User Mini Bar: Shows points & Role */}
        <div className="bg-rose-50/70 border-t border-rose-100/50 px-4 py-1.5 flex items-center justify-between text-[11px] text-slate-600">
          <div className="flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>
              접속자: <strong className="text-slate-900">{currentUser.name}</strong>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/my" className="hover:underline flex items-center gap-1 text-rose-600 font-semibold">
              <Sparkles className="w-3 h-3" />
              <span>{userPoints.availablePoints.toLocaleString()}P</span>
              {userPoints.pendingPoints > 0 && (
                <span className="text-amber-600 text-[10px]">(+{userPoints.pendingPoints.toLocaleString()} 예정)</span>
              )}
            </Link>
          </div>
        </div>
      </header>

      {/* User Switcher Modal */}
      {showUserModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl p-5 max-w-sm w-full shadow-2xl">
            <div className="flex items-center justify-between mb-3 border-b pb-2">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <Users className="w-4 h-4 text-rose-600" />
                체험 페르소나 선택
              </h3>
              <button
                onClick={() => setShowUserModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold"
              >
                닫기
              </button>
            </div>
            <p className="text-xs text-slate-500 mb-3 leading-relaxed">
              철수(원작) → 영희(전달 합체) → 민수(구매자 3인 혜택) 시나리오와 점주 정산 시스템을 직접 검증할 수 있습니다.
            </p>
            <div className="space-y-1.5">
              {DEMO_USERS.map((user) => {
                const isSelected = user.id === currentUser.id;
                return (
                  <button
                    key={user.id}
                    onClick={() => {
                      setCurrentUser(user);
                      setShowUserModal(false);
                    }}
                    className={`w-full text-left px-3 py-2.5 rounded-xl text-xs flex items-center justify-between transition-all ${
                      isSelected
                        ? 'bg-rose-600 text-white font-bold shadow-md shadow-rose-200'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <div>
                      <div className="font-semibold">{user.name}</div>
                      <div className={`text-[10px] ${isSelected ? 'text-rose-100' : 'text-slate-400'}`}>
                        {user.role === 'OWNER' ? '점주 계정' : user.role === 'ADMIN' ? '플랫폼 관리자' : '일반 회원'}
                      </div>
                    </div>
                    {isSelected && <span className="text-xs">선택됨 ✓</span>}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
