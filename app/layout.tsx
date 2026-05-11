import type { Metadata } from 'next';
import { Figtree } from 'next/font/google';

import './globals.css';

const figtree = Figtree({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
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
      <body className="min-h-full">
       
          
          <main className="main-content">
            {children}
          </main>
       
      </body>
    </html>
  );
}