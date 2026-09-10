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
// Dependencies: salonData (PRODUCTS), types (Product, CartItem, ServiceItem),
// and every global component it renders (Header, Footer, FloatingWidget,
// CartDrawer, BookingModal, ProductModal).
// ---------------------------------------------------------------------------

import React, { createContext, useContext, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { PRODUCTS } from '@/data/salonData';
import { Product, CartItem, ServiceItem } from '@/types';
import { Header } from './Header';
import { Footer } from './Footer';
import { FloatingWidget } from './FloatingWidget';
import { CartDrawer } from './CartDrawer';
import { BookingModal } from './BookingModal';
import { ProductModal } from './ProductModal';

export interface SiteContextValue {
  onBookNow: () => void;
  onSelectServiceForBooking: (service: ServiceItem) => void;
  onOpenCart: () => void;
  onOpenProduct: (product: Product) => void;
  onAddToCart: (product: Product, quantity?: number) => void;
}

const SiteContext = createContext<SiteContextValue>({
  onBookNow: () => {},
  onSelectServiceForBooking: () => {},
  onOpenCart: () => {},
  onOpenProduct: () => {},
  onAddToCart: () => {},
});

export const useSite = () => useContext(SiteContext);

export const Providers: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([
    { product: PRODUCTS[0], quantity: 1 },
  ]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [bookingPreSelect, setBookingPreSelect] = useState<{
    service?: ServiceItem | null;
    date?: string;
    time?: string;
  }>({});
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const pathname = usePathname();

  React.useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [pathname]);

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

  const handleRemoveItem = (productId: string) => {
    setCartItems((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const handleClearCart = () => setCartItems([]);

  const handleOpenBooking = () => {
    setBookingPreSelect({});
    setIsBookingOpen(true);
  };

  const handleSelectServiceForBooking = (service: ServiceItem) => {
    setBookingPreSelect({ service });
    setIsBookingOpen(true);
  };

  const handleNavigate = (sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const handleScrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

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
        <Header
          cartCount={totalCartCount}
          onOpenCart={() => setIsCartOpen(true)}
          onOpenBooking={handleOpenBooking}
          onNavigate={handleNavigate}
        />

        <main className="flex-1">{children}</main>

        <Footer onScrollToTop={handleScrollToTop} />

        <FloatingWidget
          cartCount={totalCartCount}
          onOpenCart={() => setIsCartOpen(true)}
          onOpenBooking={handleOpenBooking}
        />

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
      </div>
    </SiteContext.Provider>
  );
};