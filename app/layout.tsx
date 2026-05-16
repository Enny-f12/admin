import type { Metadata } from 'next';
import localFont from 'next/font/local';
import { Toaster } from 'sonner';
import './globals.css';
import { Providers } from './providers';

const figtree = localFont({
  src: [
    { path: '../public/fonts/Figtree-Regular.ttf',   weight: '400', style: 'normal' },
    { path: '../public/fonts/Figtree-Medium.ttf',    weight: '500', style: 'normal' },
    { path: '../public/fonts/Figtree-SemiBold.ttf',  weight: '600', style: 'normal' },
    { path: '../public/fonts/Figtree-Bold.ttf',      weight: '700', style: 'normal' },
  
  ],
  variable: '--font-figtree',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://www.foodieshotandspicy.com/'),
  title: 'Admin — Foodies Hot & Spicy',
  description:
    'Internal admin dashboard for Foodies Hot & Spicy. Manage orders, reservations, delivery, staff, payments, and restaurant analytics across Lekki and Abuja locations.',
  keywords: [
    'Foodies Hot & Spicy admin',
    'restaurant dashboard',
    'order management',
    'reservation system',
    'staff management',
    'Nigerian restaurant admin',
  ],
  openGraph: {
    title: 'Admin — Foodies Hot & Spicy',
    description: 'Restaurant management dashboard for Foodies Hot & Spicy.',
    siteName: 'Foodies Hot & Spicy',
    locale: 'en_NG',
    type: 'website',
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="light" className={`${figtree.variable} h-full antialiased`}>
      <body className="h-full">
        <Providers>
          <Toaster position="top-right" richColors />
          {children}
        </Providers>
      </body>
    </html>
  );
}