import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AppProvider } from '@/context/AppContext';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';

export const metadata: Metadata = {
  title: 'CareDrop — 원클릭 큐레이션 바이럴 배달 플랫폼',
  description: '방문판매법 완벽 준수! 원클릭 큐레이션 카드 인용형 3인 바이럴 배달 리워드 플랫폼',
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#e11d48',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body>
        <AppProvider>
          <div className="mobile-app-container">
            <Header />
            <main className="flex-1 flex flex-col">{children}</main>
            <BottomNav />
          </div>
        </AppProvider>
      </body>
    </html>
  );
}
