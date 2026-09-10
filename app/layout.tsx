// ─────────────────────────────────────────────────────────────
// Root layout — wraps every page with global styles, Google Fonts
// (Caveat, Montserrat, Playfair Display, Syne) and the site-wide
// Providers shell (Header, Footer, FloatingWidget, Cart, Booking,
// Product modals) so overlays mount once on first paint.
// ─────────────────────────────────────────────────────────────
import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '../components/Providers';

export const metadata: Metadata = {
  title: 'Paul Hair Studio',
  description:
    'Editorial luxury hair salon and haircare studio website with interactive appointment booking, luxury product shop, service menu, and press showcase.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Caveat:wght@400;700&family=Montserrat:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,400&family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Syne:wght@700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}