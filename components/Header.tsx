'use client';
// ---------------------------------------------------------------------------
// Header — Fixed top navigation bar with responsive desktop nav, mobile drawer,
// and "Book Now" CTA. Toggles between transparent (over hero) and solid (scrolled)
// styles via scroll detection. Delegates navigation to page sections or routes.
//
// Workflow role: Global chrome — rendered by Providers on every page. Triggers
// BookingModal via onOpenBooking, scrolls to sections via onNavigate, and drives
// the mobile hamburger drawer for smaller viewports.
//
// Dependencies: next/navigation (router, usePathname), lucide-react icons,
// framer-motion (mobile drawer animation). Consumed only by Providers.tsx.
// ---------------------------------------------------------------------------
import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Calendar, X, ArrowUpRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface HeaderProps {
  cartCount?: number;
  onOpenCart?: () => void;
  onOpenBooking: () => void;
  onNavigate: (sectionId: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  cartCount = 0,
  onOpenCart,
  onOpenBooking,
  onNavigate,
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'HOME', href: 'hero', path: '/' },
    { name: 'ABOUT', href: 'about', path: '/about' },
    { name: 'SERVICES', href: 'services', path: '/services' },
    { name: 'GALLERY', href: 'lookbook', path: '/gallery' },
    { name: 'CONTACT', href: 'contact', path: '/contact' },
  ];

  const isHomePage = pathname === '/';
  const isOverHero = isHomePage && !isScrolled;
  const linkColor = isOverHero ? 'text-white hover:text-neutral-300' : 'text-black hover:text-neutral-500';
  const underlineColor = isOverHero ? 'bg-white' : 'bg-black';

  const handleNavClick = (link: { name: string; href: string; path: string }) => {
    setIsMobileMenuOpen(false);
    if (link.path !== '/') {
      router.push(link.path);
      return;
    }
    if (isHomePage) {
      onNavigate(link.href);
    } else {
      router.push('/?scrollTo=' + link.href);
    }
  };

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 bg-white/10 backdrop-blur-md py-4 sm:py-5 ${
          isScrolled ? 'shadow-sm' : ''
        }`}
      >
        <div className="relative w-full flex items-center justify-between px-4 sm:px-6">
          {/* Left Navigation (Desktop) */}
          <nav className="hidden min-[1181px]:flex items-center justify-start flex-1 space-x-7 xl:space-x-9">
            {navLinks.map((link) => (
              <button
                key={link.name}
                onClick={() => handleNavClick(link)}
                className={`group relative text-sm font-medium tracking-[0.18em] ${linkColor} transition-colors cursor-pointer py-1`}
              >
                <span>{link.name}</span>
                <span className={`absolute bottom-0 left-0 w-0 h-[1.5px] ${underlineColor} transition-all duration-200 group-hover:w-full`} />
              </button>
            ))}
          </nav>

          {/* Center Brand Logo */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex-shrink-0 flex items-center justify-center z-10">
            <button
              onClick={() => handleNavClick({ name: 'HOME', href: 'hero', path: '/' })}
              className="group block text-center focus:outline-none cursor-pointer transform hover:scale-[1.02] transition-transform duration-200"
              aria-label="Paul Haircare Home"
            >
              <div className="bg-black text-white px-5 py-2 sm:px-6 sm:py-2.5 flex flex-col items-center justify-center shadow-sm">
                <span className="text-[9px] sm:text-[10px] tracking-[0.25em] font-light leading-tight lowercase">
                  haircare
                </span>
                <span className="text-xl sm:text-2xl font-black tracking-tight leading-none uppercase">
                  paul
                </span>
              </div>
            </button>
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center justify-end flex-1 gap-4 sm:gap-7">
            {/* BOOK NOW Action */}
            <button
              id="header-book-now-btn"
              onClick={onOpenBooking}
              className={`inline-flex items-center gap-1.5 text-[11px] font-bold tracking-[0.2em] uppercase cursor-pointer transition-all duration-200 px-4 py-2 rounded ${
                isOverHero
                  ? 'bg-white text-black hover:bg-neutral-100 shadow-sm'
                  : 'bg-black text-white hover:bg-neutral-800 shadow-sm'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>BOOK NOW</span>
            </button>

            {/* Hamburger Menu Trigger (Mobile & Full Editorial Drawer) */}
            <button
              id="header-menu-toggle"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={`p-1 min-[1181px]:hidden ${isOverHero ? 'text-white' : 'text-black'} hover:opacity-70 transition-opacity focus:outline-none cursor-pointer`}
              aria-label="Toggle navigation menu"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <div className="w-6 h-4 flex flex-col justify-between items-end">
                  <span className={`w-6 h-[2px] block ${isOverHero ? 'bg-white' : 'bg-black'}`} />
                  <span className={`w-4 h-[2px] block ${isOverHero ? 'bg-white' : 'bg-black'} group-hover:w-6 transition-all`} />
                </div>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Full-Screen / Mobile Editorial Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 top-[60px] sm:top-[70px] z-30 bg-white/10 backdrop-blur-xl border-t border-white/20 flex flex-col justify-between px-6 py-8 overflow-y-auto"
          >
            <div className="max-w-md mx-auto w-full pt-4 space-y-6">
              <div className="border-b border-neutral-200 pb-4">
                <span className="text-[10px] font-bold tracking-[0.3em] text-neutral-400 uppercase">
                  Navigation
                </span>
              </div>
              <div className="flex flex-col space-y-4">
                {navLinks.map((link) => (
                  <button
                    key={link.name}
                    onClick={() => handleNavClick(link)}
                    className="text-left text-2xl font-editorial font-bold text-black hover:translate-x-2 transition-transform tracking-tight flex items-center justify-between"
                  >
                    <span>{link.name}</span>
                    <ArrowUpRight className="w-5 h-5 text-neutral-400" />
                  </button>
                ))}
              </div>

              <div className="pt-8 border-t border-neutral-200">
                <button
                  onClick={() => {
                    onOpenBooking();
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full py-3.5 bg-black text-white text-xs font-bold tracking-[0.2em] uppercase hover:bg-neutral-800 transition-colors shadow-sm"
                >
                  SCHEDULE APPOINTMENT
                </button>
              </div>
            </div>

            <div className="max-w-md mx-auto w-full pt-6 text-center text-xs text-neutral-500 border-t border-neutral-100">
              <p className="font-semibold text-black mb-1">Paul Hair Studio • Zurich & Paris</p>
              <p>Appointments: 00 123 456 789</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};