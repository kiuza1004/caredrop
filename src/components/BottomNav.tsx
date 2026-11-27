'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Sparkles, ShoppingBag, UserCheck, Store } from 'lucide-react';
import { useApp } from '@/context/AppContext';

export default function BottomNav() {
  const pathname = usePathname();
  const { cartCount, currentUser } = useApp();

  const navItems = [
    { label: '홈', href: '/', icon: Home },
    { label: '카드보관함', href: '/my?tab=cards', icon: Sparkles },
    { label: '주문/결제', href: '/checkout', icon: ShoppingBag, badge: cartCount },
    { label: '내포인트', href: '/my', icon: UserCheck },
    { label: '점주정산', href: `/store-admin/1`, icon: Store },
  ];

  return (
    <nav className="sticky bottom-0 z-40 bg-white border-t border-slate-200 shadow-lg pb-safe">
      <div className="flex items-center justify-around py-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex flex-col items-center justify-center relative py-1 px-3 transition-colors ${
                isActive ? 'text-rose-600 font-bold' : 'text-slate-500 hover:text-slate-900 font-medium'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-1 -right-2 bg-rose-600 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-0.5">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
