'use client';

import React, { useState, useEffect } from 'react';
import { AlertTriangle, Download, X } from 'lucide-react';

export default function PwaBanner() {
  const [isVisible, setIsVisible] = useState(true);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    // Service Worker 등록
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        console.log('SW registration error:', err);
      });
    }

    const handleBeforeInstall = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } else {
      alert('모바일 브라우저 메뉴에서 [홈 화면에 추가]를 눌러 PWA 앱으로 바로 설치할 수 있습니다.');
    }
  };

  if (!isVisible) return null;

  return (
    <div className="bg-amber-500 text-slate-900 border-b border-amber-600 px-3 py-2 text-xs">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-1.5 flex-1">
          <AlertTriangle className="w-4 h-4 text-slate-950 mt-0.5 shrink-0" />
          <div>
            <span className="font-bold">PWA 설치 필수 안내:</span>{' '}
            <span className="text-slate-950 font-semibold underline decoration-slate-950">
              캐시가 꼬일 수 있으니 꼭 기존 앱을 완전히 삭제하고 설치하셔야 합니다.
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={handleInstallClick}
            className="flex items-center gap-1 bg-slate-900 text-white font-medium px-2 py-1 rounded text-[11px] hover:bg-slate-800"
          >
            <Download className="w-3 h-3" />
            설치
          </button>
          <button
            onClick={() => setIsVisible(false)}
            className="text-slate-800 hover:text-black p-0.5"
            aria-label="닫기"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
