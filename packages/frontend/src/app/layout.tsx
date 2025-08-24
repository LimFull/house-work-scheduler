import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { UserProfileProvider } from './contexts/UserProfileContext';
import QueryProvider from './providers/QueryProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'House Work Scheduler',
  description: '집안일 스케줄러',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className={inter.className}>
        <QueryProvider>
          <UserProfileProvider>{children}</UserProfileProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
