import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/hooks/useAuth';
import { Toaster } from 'sonner';

export const metadata: Metadata = {
  title: 'Gazgan Marmo · Admin Console',
  description: 'Internal admin dashboard for Gazgan Marmo Alliance.',
  robots: { index: false, follow: false }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
        <Toaster position="bottom-right" theme="light" toastOptions={{
          style: { fontFamily: 'Inter, sans-serif', borderRadius: 0, border: '1px solid #e6e6e6' }
        }} />
      </body>
    </html>
  );
}
