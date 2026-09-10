'use client';
// ---------------------------------------------------------------------------
// CartDrawer — Slide-in shopping bag panel (right edge) that displays cart
// items with quantity controls, subtotal, complimentary shipping, and a mock
// checkout flow. Shows a confetti celebration on order confirmation.
//
// Workflow role: E-commerce cart UI — opened by Providers via isCartOpen state.
// Receives cart items and mutation callbacks from Providers. The checkout button
// simulates a 1.2 s processing delay, fires confetti, then auto-closes.
//
// Dependencies: types (CartItem), ProductBottleVisual (bottle thumbnails),
// lucide-react icons, framer-motion (slide animation), canvas-confetti.
// Rendered by Providers.tsx.
// ---------------------------------------------------------------------------
import React, { useState } from 'react';
import { CartItem } from '../types';
import { ProductBottleVisual } from './ProductBottleVisual';
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateQuantity: (productId: string, delta: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
}) => {
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [orderCompleted, setOrderCompleted] = useState(false);

  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  const handleCheckout = () => {
    setIsCheckingOut(true);
    setTimeout(() => {
      setIsCheckingOut(false);
      setOrderCompleted(true);
      confetti({
        particleCount: 70,
        spread: 70,
        origin: { y: 0.6 },
      });
      setTimeout(() => {
        onClearCart();
        setOrderCompleted(false);
        onClose();
      }, 3000);
    }, 1200);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.35 }}
              className="w-screen max-w-md bg-white shadow-2xl flex flex-col"
            >
              {/* Header */}
              <div className="px-6 py-5 border-b border-neutral-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-black" />
                  <h2 className="font-editorial text-sm font-black tracking-[0.2em] uppercase text-black">
                    SHOPPING BAG ({cartItems.reduce((acc, item) => acc + item.quantity, 0)})
                  </h2>
                </div>
                <button
                  onClick={onClose}
                  className="p-1 text-neutral-400 hover:text-black transition-colors cursor-pointer"
                  aria-label="Close cart"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto px-6 py-4">
                {orderCompleted ? (
                  <div className="h-full flex flex-col items-center justify-center text-center py-12">
                    <div className="w-12 h-12 bg-emerald-500 text-white rounded-full flex items-center justify-center mb-4">
                      <Check className="w-6 h-6" />
                    </div>
                    <h3 className="font-editorial text-lg font-bold uppercase tracking-tight text-black mb-1">
                      ORDER CONFIRMED
                    </h3>
                    <p className="text-xs text-neutral-500 max-w-xs">
                      Thank you for choosing Paul Haircare Studio. Your luxury package is being
                      prepared.
                    </p>
                  </div>
                ) : cartItems.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center py-12 text-neutral-400">
                    <ShoppingBag className="w-12 h-12 stroke-[1] mb-3 text-neutral-300" />
                    <p className="text-xs uppercase tracking-widest font-semibold text-neutral-600 mb-1">
                      Your bag is empty
                    </p>
                    <p className="text-[11px] text-neutral-400 max-w-xs">
                      Explore our best seller formulas to treat your hair with salon excellence.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-neutral-100">
                    {cartItems.map((item) => (
                      <div key={item.product.id} className="py-4 flex gap-4 items-center">
                        <div className="w-16 h-20 bg-neutral-50 flex items-center justify-center p-1 shrink-0">
                          <ProductBottleVisual
                            type={
                              item.product.id as
                                | 'sos-conditioner'
                                | 'light-shampoo'
                                | 'silk-serum'
                                | 'leave-in-cream'
                            }
                            className="h-16"
                          />
                        </div>

                        <div className="flex-1 min-w-0">
                          <h4 className="font-editorial text-xs font-bold uppercase tracking-wider text-black truncate">
                            {item.product.name}
                          </h4>
                          <p className="text-[10px] text-neutral-500 mb-2">{item.product.size}</p>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center border border-neutral-200">
                              <button
                                onClick={() => onUpdateQuantity(item.product.id, -1)}
                                className="p-1 text-neutral-500 hover:text-black"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="px-2 text-xs font-semibold">{item.quantity}</span>
                              <button
                                onClick={() => onUpdateQuantity(item.product.id, 1)}
                                className="p-1 text-neutral-500 hover:text-black"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                            <span className="text-xs font-bold">
                              ${(item.product.price * item.quantity).toFixed(2)}
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => onRemoveItem(item.product.id)}
                          className="text-neutral-300 hover:text-neutral-700 p-1"
                          aria-label="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              {cartItems.length > 0 && !orderCompleted && (
                <div className="p-6 border-t border-neutral-100 bg-neutral-50 space-y-4">
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between text-neutral-600">
                      <span>Subtotal</span>
                      <span className="font-bold text-black">${subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-neutral-600">
                      <span>Express Shipping</span>
                      <span className="text-emerald-600 font-medium">COMPLIMENTARY</span>
                    </div>
                  </div>

                  <button
                    onClick={handleCheckout}
                    disabled={isCheckingOut}
                    className="w-full py-3.5 bg-black text-white text-xs font-bold tracking-[0.2em] uppercase hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isCheckingOut ? (
                      <span>PROCESSING...</span>
                    ) : (
                      <>
                        <span>CHECKOUT • ${subtotal.toFixed(2)}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};
