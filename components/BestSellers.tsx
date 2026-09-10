'use client';
// BestSellers — Product showcase grid displaying the salon's top 4 haircare
// products with SVG bottle visuals (ProductBottleVisual). On hover, reveals
// quick-action buttons for "Add to Bag" (with confirmation flash) and "View
// Details" (opens the product modal). Rendered in the #shop section of the
// home page to drive e-commerce conversions.
import React, { useState } from 'react';
import { Product } from '../types';
import { ProductBottleVisual } from './ProductBottleVisual';
import { Eye, Plus, Check } from 'lucide-react';
import { motion } from 'motion/react';

interface BestSellersProps {
  products: Product[];
  onAddToCart: (product: Product) => void;
  onSelectProduct: (product: Product) => void;
}

export const BestSellers: React.FC<BestSellersProps> = ({
  products,
  onAddToCart,
  onSelectProduct,
}) => {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [addedId, setAddedId] = useState<string | null>(null);

  const handleAdd = (product: Product, e: React.MouseEvent) => {
    e.stopPropagation();
    onAddToCart(product);
    setAddedId(product.id);
    setTimeout(() => setAddedId(null), 1500);
  };

  return (
    <section id="shop" className="py-20 sm:py-28 bg-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16 sm:mb-20">
          <motion.h2
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="font-editorial text-3xl sm:text-4xl md:text-5xl font-black uppercase text-black tracking-tight mb-4"
          >
            BEST SELLERS
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-xs sm:text-sm text-neutral-600 leading-relaxed font-medium"
          >
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor
            incididunt ut labore et dolore magna aliqua.
          </motion.p>
        </div>

        {/* 4-Column Product Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6 xl:gap-8">
          {products.map((product) => {
            const isHovered = hoveredId === product.id;
            const bottleType = product.id as
              | 'sos-conditioner'
              | 'light-shampoo'
              | 'silk-serum'
              | 'leave-in-cream';

            return (
              <div
                key={product.id}
                id={`product-${product.id}`}
                onMouseEnter={() => setHoveredId(product.id)}
                onMouseLeave={() => setHoveredId(null)}
                onClick={() => onSelectProduct(product)}
                className="group flex flex-col items-center text-center cursor-pointer relative"
              >
                {/* Bottle Container with soft hover background */}
                <div className="relative w-full h-80 sm:h-84 flex items-center justify-center p-4 mb-6 transition-all duration-300">
                  <ProductBottleVisual
                    type={bottleType}
                    isHovered={isHovered}
                    className="h-68 sm:h-72"
                  />

                  {/* Quick Action Overlay on Hover */}
                  <div
                    className={`absolute bottom-2 inset-x-4 flex items-center justify-center gap-2 transition-all duration-300 ${
                      isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3 pointer-events-none'
                    }`}
                  >
                    <button
                      onClick={(e) => handleAdd(product, e)}
                      className="px-4 py-2 bg-black text-white text-[11px] font-bold tracking-[0.15em] uppercase hover:bg-neutral-800 transition-colors flex items-center gap-1.5 shadow-md"
                      aria-label={`Add ${product.name} to cart`}
                    >
                      {addedId === product.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span>ADDED</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5" />
                          <span>ADD TO BAG</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectProduct(product);
                      }}
                      className="p-2 bg-white border border-black/20 text-black hover:bg-neutral-100 transition-colors shadow-sm"
                      aria-label={`View details of ${product.name}`}
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Product Title & Info */}
                <h3 className="font-editorial text-sm sm:text-base font-bold tracking-[0.1em] text-black uppercase mb-1.5 group-hover:text-neutral-600 transition-colors">
                  {product.name}
                </h3>
                <p className="text-[11px] text-neutral-500 font-normal mb-2 max-w-[220px]">
                  {product.subtitle}
                </p>
                <span className="text-xs sm:text-sm font-semibold tracking-wider text-black">
                  ${product.price.toFixed(2)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
