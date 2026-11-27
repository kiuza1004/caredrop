'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '@/lib/types';

export interface CartItem {
  menuId: number;
  menuName: string;
  price: number;
  quantity: number;
  storeId: number;
}

export const DEMO_USERS: User[] = [
  { id: 1, name: '철수 (원작자)', email: 'chulsoo@caredrop.kr', phone: '010-1111-2222', role: 'USER', created_at: '' },
  { id: 2, name: '영희 (전달자)', email: 'younghee@caredrop.kr', phone: '010-3333-4444', role: 'USER', created_at: '' },
  { id: 3, name: '민수 (구매자)', email: 'minsoo@caredrop.kr', phone: '010-5555-6666', role: 'USER', created_at: '' },
  { id: 4, name: '홍길동 점주 (치킨본점)', email: 'owner1@caredrop.kr', phone: '010-7777-8888', role: 'OWNER', created_at: '' },
  { id: 5, name: '이순신 점주 (피자파스타)', email: 'owner2@caredrop.kr', phone: '010-9999-0000', role: 'OWNER', created_at: '' },
  { id: 6, name: '플랫폼 슈퍼관리자', email: 'admin@caredrop.kr', phone: '010-1234-5678', role: 'ADMIN', created_at: '' },
];

interface AppContextType {
  currentUser: User;
  setCurrentUser: (user: User) => void;
  cart: CartItem[];
  addToCart: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void;
  updateQuantity: (menuId: number, delta: number) => void;
  clearCart: () => void;
  cartTotal: number;
  cartCount: number;
  activeCardCode: string | null;
  setActiveCardCode: (code: string | null) => void;
  userPoints: { availablePoints: number; pendingPoints: number };
  refreshPoints: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  // 기본 페르소나는 '민수 (구매자)'로 시작
  const [currentUser, setCurrentUser] = useState<User>(DEMO_USERS[2]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeCardCode, setActiveCardCode] = useState<string | null>(null);
  const [userPoints, setUserPoints] = useState({ availablePoints: 0, pendingPoints: 0 });

  const refreshPoints = async () => {
    try {
      const res = await fetch(`/api/users/${currentUser.id}`);
      if (res.ok) {
        const data = await res.json();
        setUserPoints(data.points || { availablePoints: 0, pendingPoints: 0 });
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    refreshPoints();
  }, [currentUser.id]);

  const addToCart = (item: Omit<CartItem, 'quantity'>, quantity = 1) => {
    setCart((prev) => {
      // 다른 매장의 메뉴가 들어있는 경우 초기화
      if (prev.length > 0 && prev[0].storeId !== item.storeId) {
        return [{ ...item, quantity }];
      }
      const existing = prev.find((i) => i.menuId === item.menuId);
      if (existing) {
        return prev.map((i) =>
          i.menuId === item.menuId ? { ...i, quantity: i.quantity + quantity } : i
        );
      }
      return [...prev, { ...item, quantity }];
    });
  };

  const updateQuantity = (menuId: number, delta: number) => {
    setCart((prev) => {
      return prev
        .map((i) => {
          if (i.menuId === menuId) {
            const nextQty = i.quantity + delta;
            return nextQty > 0 ? { ...i, quantity: nextQty } : null;
          }
          return i;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  const clearCart = () => setCart([]);

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <AppContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        cart,
        addToCart,
        updateQuantity,
        clearCart,
        cartTotal,
        cartCount,
        activeCardCode,
        setActiveCardCode,
        userPoints,
        refreshPoints,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
}
