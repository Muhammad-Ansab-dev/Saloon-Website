// ─────────────────────────────────────────────────────────────
// ROOT LAYOUT — the outer shell for the whole website.
// What it does: loads the global stylesheet + fonts, then mounts the
// site-wide <Providers> context exactly once around every page.
// What it connects to: <Providers> (src/components/layout/Providers.tsx),
// which owns shared state (cart, booking modal, product modal) and renders
// the chrome (Header, Footer, FloatingWidget, CartDrawer, BookingModal,
// ProductModal) so those overlays are available on every route.
// Why it exists: without a single root mount, popups/modals would have to
// be repeated per page — this mounts them once on first paint.
// NOTE: on /dashboard that chrome is suppressed by Providers.
// ─────────────────────────────────────────────────────────────
import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/components/layout/Providers';
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

// Local sans-serif font loaded via next/font (bundled with the CSS build) —
// exposed as the --font-sans CSS variable, the site's default body font.
const geist = Geist({subsets:['latin'],variable:'--font-sans'});

// Site-wide <title> and meta description used by browsers/search engines for
// any page that does not supply its own metadata override.
export const metadata: Metadata = {
  title: 'Paul Hair Studio',
  description:
    'Editorial luxury hair salon and haircare studio website with interactive appointment booking, luxury product shop, service menu, and press showcase.',
};

// Root layout component — React calls this once and wraps every route with it.
// Params: children = the page matching the current URL.
// Returns: the full <html>/<body> skeleton with fonts, styles, and Providers.
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={cn("font-sans", geist.variable)}>
      <head>
        {/* Google Fonts: preconnect hints speed up the font download */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Belleza&family=Caveat:wght@400;700&family=Montserrat:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,400&family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Syne:wght@700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}