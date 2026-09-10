'use client';
// ---------------------------------------------------------------------------
// ProductModal — Product detail overlay with a two-column layout: bottle visual
// on the left, tabbed info (Details / Actives / Ritual), price, quantity selector,
// and "Add to Bag" button on the right. Briefly shows a confirmation state before
// closing after a successful add-to-cart.
//
// Workflow role: E-commerce product detail — opened by Providers via
// selectedProduct state (triggered from product cards via useSite().onOpenProduct).
// Calls onAddToCart from Providers to mutate global cart state.
//
// Dependencies: types (Product), ProductBottleVisual (bottle rendering),
// lucide-react icons, framer-motion (overlay animation).
// Rendered by Providers.tsx.
// ---------------------------------------------------------------------------
import React, { useState } from 'react';
import { Product } from '../types';
import { ProductBottleVisual } from './ProductBottleVisual';
import { X, Check, Star, ShieldCheck, Sparkles, Plus, Minus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ProductModalProps {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (product: Product, quantity: number) => void;
}

export const ProductModal: React.FC<ProductModalProps> = ({
  product,
  onClose,
  onAddToCart,
}) => {
  const [qty, setQty] = useState(1);
  const [activeTab, setActiveTab] = useState<'overview' | 'ingredients' | 'howTo'>('overview');
  const [added, setAdded] = useState(false);

  if (!product) return null;

  const handleAdd = () => {
    onAddToCart(product, qty);
    setAdded(true);
    setTimeout(() => {
      setAdded(false);
      onClose();
    }, 1200);
  };

  const bottleType = product.id as
    | 'sos-conditioner'
    | 'light-shampoo'
    | 'silk-serum'
    | 'leave-in-cream';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 sm:p-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/75 backdrop-blur-xs"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative bg-white w-full max-w-2xl shadow-2xl z-10 overflow-hidden"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-20 p-2 text-neutral-400 hover:text-black cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="grid grid-cols-1 md:grid-cols-2">
            {/* Left: Bottle display */}
            <div className="bg-neutral-50 p-8 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-neutral-100">
              <ProductBottleVisual type={bottleType} className="h-64 sm:h-72" />
              <span className="text-[10px] tracking-widest text-neutral-400 uppercase mt-4">
                {product.size}
              </span>
            </div>

            {/* Right: Info and purchase */}
            <div className="p-6 sm:p-8 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold tracking-[0.2em] text-neutral-400 uppercase">
                  {product.category}
                </span>
                <h3 className="font-editorial text-xl sm:text-2xl font-black uppercase tracking-tight text-black mt-1 mb-2">
                  {product.name}
                </h3>
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex text-amber-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-current" />
                    ))}
                  </div>
                  <span className="text-[11px] text-neutral-500">
                    ({product.reviewsCount} verified reviews)
                  </span>
                </div>

                <div className="text-xl font-bold text-black mb-4">
                  ${product.price.toFixed(2)}
                </div>

                {/* Tabs */}
                <div className="flex border-b border-neutral-200 mb-3 text-[11px] font-bold uppercase tracking-wider">
                  <button
                    onClick={() => setActiveTab('overview')}
                    className={`pb-2 mr-4 ${
                      activeTab === 'overview'
                        ? 'border-b-2 border-black text-black'
                        : 'text-neutral-400 hover:text-neutral-700'
                    }`}
                  >
                    Details
                  </button>
                  <button
                    onClick={() => setActiveTab('ingredients')}
                    className={`pb-2 mr-4 ${
                      activeTab === 'ingredients'
                        ? 'border-b-2 border-black text-black'
                        : 'text-neutral-400 hover:text-neutral-700'
                    }`}
                  >
                    Actives
                  </button>
                  <button
                    onClick={() => setActiveTab('howTo')}
                    className={`pb-2 ${
                      activeTab === 'howTo'
                        ? 'border-b-2 border-black text-black'
                        : 'text-neutral-400 hover:text-neutral-700'
                    }`}
                  >
                    Ritual
                  </button>
                </div>

                <div className="text-xs text-neutral-600 min-h-[90px] leading-relaxed">
                  {activeTab === 'overview' && (
                    <p>{product.description}</p>
                  )}
                  {activeTab === 'ingredients' && (
                    <ul className="list-disc pl-4 space-y-1">
                      {product.ingredients?.map((ing, i) => (
                        <li key={i}>{ing}</li>
                      ))}
                    </ul>
                  )}
                  {activeTab === 'howTo' && (
                    <p>{product.howToUse}</p>
                  )}
                </div>
              </div>

              {/* Add to cart row */}
              <div className="pt-6 border-t border-neutral-100 flex items-center gap-3">
                <div className="flex items-center border border-neutral-300">
                  <button
                    onClick={() => setQty(Math.max(1, qty - 1))}
                    className="p-2 text-neutral-600 hover:text-black"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="px-3 text-xs font-bold">{qty}</span>
                  <button
                    onClick={() => setQty(qty + 1)}
                    className="p-2 text-neutral-600 hover:text-black"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                <button
                  onClick={handleAdd}
                  disabled={added}
                  className="flex-1 py-3 bg-black text-white text-xs font-bold tracking-[0.2em] uppercase hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  {added ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>ADDED TO BAG</span>
                    </>
                  ) : (
                    <span>ADD TO BAG • ${(product.price * qty).toFixed(2)}</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
