'use client';
// ---------------------------------------------------------------------------
// Providers — Top-level client wrapper that owns all shared site state: cart,
// booking modal, product modal, and section navigation. Creates the SiteContext
// so any child component can open modals or add to cart without prop drilling.
//
// Workflow role: The orchestrator. Renders Header, Footer, FloatingWidget,
// CartDrawer, BookingModal, and ProductModal as global chrome around {children}.
// Exposes useSite() hook with: onBookNow, onSelectServiceForBooking, onOpenCart,
// onOpenProduct, and onAddToCart.
//
// Dependencies: types (Product, CartItem, ServiceItem) and every global
// component it renders (Header, Footer, FloatingWidget, CartDrawer,
// BookingModal, ProductModal).
// ---------------------------------------------------------------------------

import React, { createContext, useContext, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Product, CartItem, ServiceItem } from '@/types';
import { Header } from './Header';
import { Footer } from './Footer';
import { FloatingWidget } from './FloatingWidget';
import { CartDrawer } from '../cart/CartDrawer';
import { BookingModal } from '../booking/BookingModal';
import { ProductModal } from '../cart/ProductModal';

export interface SiteContextValue {
  onBookNow: () => void;
  onSelectServiceForBooking: (service: ServiceItem) => void;
  onOpenCart: () => void;
  onOpenProduct: (product: Product) => void;
  onAddToCart: (product: Product, quantity?: number) => void;
}

// The shared "bucket" (React context) that stores all the global actions.
// Every page section can reach in and call these without being directly connected.
const SiteContext = createContext<SiteContextValue>({
  onBookNow: () => {},
  onSelectServiceForBooking: () => {},
  onOpenCart: () => {},
  onOpenProduct: () => {},
  onAddToCart: () => {},
});

// The hook every section uses: returns the global actions above.
export const useSite = () => useContext(SiteContext);

export const Providers: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // Cart state: the items in the bag, and whether the slide-out cart drawer is open.
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  // Booking modal state: whether it is open, plus an optional service/date/time to pre-fill.
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [bookingPreSelect, setBookingPreSelect] = useState<{
    service?: ServiceItem | null;
    date?: string;
    time?: string;
  }>({});
  // Product modal state: the product being shown in the popup (null = closed).
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Which route we are on; the admin dashboard should hide all site chrome.
  const pathname = usePathname();
  const isDashboard = pathname.startsWith('/dashboard');

  // On every page navigation: reset scroll, and clean up overlays / handle the ?scrollTo deep link.
  React.useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
    // Close all overlays when entering the dashboard area so site modals don't bleed through.
    if (isDashboard) {
      setIsBookingOpen(false);
      setIsCartOpen(false);
      setSelectedProduct(null);
      return;
    }
    // Deep link support: Header sends "/?scrollTo=<sectionId>" from non-home
    // routes. Scroll to that section, then strip the query param.
    const target = new URLSearchParams(window.location.search).get('scrollTo');
    if (target) {
      requestAnimationFrame(() => {
        document.getElementById(target)?.scrollIntoView({ behavior: 'smooth' });
      });
      const url = new URL(window.location.href);
      url.searchParams.delete('scrollTo');
      window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
    }
  }, [pathname, isDashboard]);

  // Adds a product to the cart; if it is already there, just bumps the quantity.
  const handleAddToCart = (product: Product, quantity = 1) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { product, quantity }];
    });
  };

  // Increases/decreases an item's quantity by delta; removes it if that would drop below 1.
  const handleUpdateQuantity = (productId: string, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  // Removes a single line item from the cart entirely.
  const handleRemoveItem = (productId: string) => {
    setCartItems((prev) => prev.filter((item) => item.product.id !== productId));
  };

  // Empties the whole cart in one go.
  const handleClearCart = () => setCartItems([]);

  // Generic "Book now": opens the booking modal with no service pre-selected.
  const handleOpenBooking = () => {
    setBookingPreSelect({});
    setIsBookingOpen(true);
  };

  // "Book now" from a specific service: pre-selects it, then opens the modal.
  const handleSelectServiceForBooking = (service: ServiceItem) => {
    setBookingPreSelect({ service });
    setIsBookingOpen(true);
  };

  // Smooth-scrolls to a section on the same page (used by the header nav links).
  const handleNavigate = (sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  // Smooth-scrolls to the very top (footer "back to top" arrow).
  const handleScrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  // Total number of items in the bag, used for the header cart badge.
  const totalCartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <SiteContext.Provider
      value={{
        onBookNow: handleOpenBooking,
        onSelectServiceForBooking: handleSelectServiceForBooking,
        onOpenCart: () => setIsCartOpen(true),
        onOpenProduct: setSelectedProduct,
        onAddToCart: handleAddToCart,
      }}
    >
      <div className="min-h-screen bg-white text-black flex flex-col selection:bg-black selection:text-white font-sans antialiased">
        {!isDashboard && (
          <Header
            cartCount={totalCartCount}
            onOpenCart={() => setIsCartOpen(true)}
            onOpenBooking={handleOpenBooking}
            onNavigate={handleNavigate}
          />
        )}

        <main className="flex-1">{children}</main>

        {!isDashboard && <Footer onScrollToTop={handleScrollToTop} />}

        {!isDashboard && <FloatingWidget onOpenBooking={handleOpenBooking} />}

        {!isDashboard && (
          <>
            <CartDrawer
              isOpen={isCartOpen}
              onClose={() => setIsCartOpen(false)}
              cartItems={cartItems}
              onUpdateQuantity={handleUpdateQuantity}
              onRemoveItem={handleRemoveItem}
              onClearCart={handleClearCart}
            />

            <BookingModal
              isOpen={isBookingOpen}
              onClose={() => setIsBookingOpen(false)}
              preSelectedService={bookingPreSelect.service}
              preSelectedDate={bookingPreSelect.date}
              preSelectedTime={bookingPreSelect.time}
            />

            <ProductModal
              product={selectedProduct}
              onClose={() => setSelectedProduct(null)}
              onAddToCart={handleAddToCart}
            />
          </>
        )}
      </div>
    </SiteContext.Provider>
  );
};