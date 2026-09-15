'use client';
// ProductBottleVisual — Pure SVG illustration of the salon's 4 haircare product
// bottles (SOS Conditioner, Light Shampoo, Silk Serum, Leave-In Cream). Each
// variant renders a hand-crafted bottle shape with labels, specular highlights,
// and a drop shadow. Scales up on hover via the isHovered prop. Used inside
// BestSellers to display product visuals without raster images.

interface ProductBottleVisualProps {
  type: 'sos-conditioner' | 'light-shampoo' | 'silk-serum' | 'leave-in-cream';
  className?: string;
  isHovered?: boolean;
}

export const ProductBottleVisual: React.FC<ProductBottleVisualProps> = ({
  type,
  className = 'h-72 w-auto',
  isHovered = false,
}) => {
  return (
    <div className={`relative flex items-center justify-center transition-transform duration-500 ${isHovered ? 'scale-105' : 'scale-100'} ${className}`}>
      {type === 'sos-conditioner' && (
        <svg viewBox="0 0 160 300" className="w-full h-full max-h-72 drop-shadow-xl" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Pump mechanism */}
          <rect x="72" y="30" width="16" height="28" fill="#1c1c1c" />
          <path d="M60 20 H94 C97 20 100 23 100 26 V30 H54 V26 C54 23 57 20 60 20 Z" fill="#2a2a2a" />
          {/* Spout */}
          <path d="M60 22 C42 22 36 26 34 32 C33 35 36 36 39 34 C44 31 52 30 60 30 Z" fill="#1c1c1c" />
          {/* Collar ring */}
          <rect x="64" y="58" width="32" height="12" rx="2" fill="#333333" />
          <rect x="62" y="70" width="36" height="6" fill="#1a1a1a" />
          {/* Bottle Body */}
          <rect x="42" y="76" width="76" height="195" rx="14" fill="#141414" />
          {/* Bottle Specular Gradient / Gloss highlight */}
          <path d="M46 86 C46 80 50 78 56 78 H60 V265 H54 C48 265 46 260 46 254 Z" fill="white" fillOpacity="0.07" />
          {/* Linear side reflection */}
          <rect x="106" y="86" width="4" height="175" rx="2" fill="white" fillOpacity="0.04" />
          {/* Label Box */}
          <rect x="52" y="112" width="56" height="74" fill="#181818" stroke="#333333" strokeWidth="0.8" />
          {/* haircare paul label */}
          <rect x="58" y="118" width="44" height="38" fill="#000000" />
          <text x="80" y="129" fill="#ffffff" fontSize="6" fontFamily="Montserrat, sans-serif" fontWeight="300" textAnchor="middle" letterSpacing="0.1em">haircare</text>
          <text x="80" y="145" fill="#ffffff" fontSize="13" fontFamily="Montserrat, sans-serif" fontWeight="900" textAnchor="middle" letterSpacing="0.02em">paul</text>
          {/* Subtext on label */}
          <text x="80" y="170" fill="#a0a0a0" fontSize="5" fontFamily="Montserrat, sans-serif" fontWeight="600" textAnchor="middle" letterSpacing="0.15em">OIL</text>
          <text x="80" y="177" fill="#777777" fontSize="4.5" fontFamily="Montserrat, sans-serif" textAnchor="middle">50ml</text>
          {/* Bottle Base */}
          <path d="M44 266 C44 271 48 274 54 274 H106 C112 274 116 271 116 266 V268 C116 273 112 276 106 276 H54 C48 276 44 273 44 268 Z" fill="#080808" />
        </svg>
      )}

      {type === 'light-shampoo' && (
        <svg viewBox="0 0 160 320" className="w-full h-full max-h-76 drop-shadow-xl" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Tall Pump mechanism */}
          <rect x="74" y="24" width="12" height="32" fill="#181818" />
          <path d="M66 14 H94 C97 14 99 16 99 19 V24 H61 V19 C61 16 63 14 66 14 Z" fill="#2e2e2e" />
          {/* Pump Spout */}
          <path d="M66 16 C48 16 40 21 38 27 C37 30 40 31 43 29 C49 26 57 24 66 24 Z" fill="#1c1c1c" />
          {/* Thread neck */}
          <rect x="68" y="56" width="24" height="16" fill="#292929" />
          {/* Bottle Shoulder */}
          <path d="M50 82 C50 74 60 70 70 70 H90 C100 70 110 74 110 82 V280 C110 288 102 292 92 292 H68 C58 292 50 288 50 280 Z" fill="#121212" />
          {/* Gloss overlay */}
          <path d="M54 84 C54 78 62 74 70 74 H74 V286 H68 C60 286 54 282 54 276 Z" fill="white" fillOpacity="0.06" />
          {/* Central Label */}
          <rect x="60" y="106" width="40" height="52" fill="#000000" stroke="#2c2c2c" strokeWidth="0.8" />
          <text x="80" y="122" fill="#ffffff" fontSize="6.5" fontFamily="Montserrat, sans-serif" fontWeight="300" textAnchor="middle" letterSpacing="0.1em">haircare</text>
          <text x="80" y="142" fill="#ffffff" fontSize="14" fontFamily="Montserrat, sans-serif" fontWeight="900" textAnchor="middle" letterSpacing="0.02em">paul</text>
          {/* Print on bottle */}
          <text x="80" y="186" fill="#888888" fontSize="4.8" fontFamily="Montserrat, sans-serif" fontWeight="700" textAnchor="middle" letterSpacing="0.12em">REPAIR SERUM</text>
          <text x="80" y="195" fill="#666666" fontSize="4.2" fontFamily="Montserrat, sans-serif" textAnchor="middle">200ml</text>
        </svg>
      )}

      {type === 'silk-serum' && (
        <svg viewBox="0 0 160 300" className="w-full h-full max-h-72 drop-shadow-xl" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Ergonomic Curved Cap/Pump */}
          <path d="M72 44 C72 32 76 20 84 20 C92 20 98 28 98 44 V68 H72 Z" fill="#202020" />
          <path d="M74 42 C74 34 77 24 84 24 C89 24 93 29 94 40 V68 H74 Z" fill="#2b2b2b" />
          {/* Ring */}
          <rect x="66" y="68" width="34" height="8" fill="#151515" />
          {/* Sleek rounded teardrop bottle */}
          <path d="M52 110 C52 82 64 76 80 76 C96 76 108 82 108 110 V250 C108 266 96 274 80 274 C64 274 52 266 52 250 Z" fill="#131313" />
          {/* Gloss highlight */}
          <path d="M56 112 C56 88 66 82 76 80 V268 C66 266 56 260 56 248 Z" fill="white" fillOpacity="0.07" />
          {/* Label Badge */}
          <rect x="64" y="130" width="32" height="42" fill="#000000" stroke="#333333" strokeWidth="0.8" />
          <text x="80" y="142" fill="#ffffff" fontSize="5" fontFamily="Montserrat, sans-serif" fontWeight="300" textAnchor="middle" letterSpacing="0.1em">haircare</text>
          <text x="80" y="157" fill="#ffffff" fontSize="11" fontFamily="Montserrat, sans-serif" fontWeight="900" textAnchor="middle" letterSpacing="0.02em">paul</text>
          <text x="80" y="196" fill="#888888" fontSize="4.5" fontFamily="Montserrat, sans-serif" fontWeight="600" textAnchor="middle" letterSpacing="0.1em">FOAM</text>
          <text x="80" y="204" fill="#666666" fontSize="4" fontFamily="Montserrat, sans-serif" textAnchor="middle">80ml</text>
        </svg>
      )}

      {type === 'leave-in-cream' && (
        <svg viewBox="0 0 160 300" className="w-full h-full max-h-72 drop-shadow-xl" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Cap at bottom or top (Sleek Tube standing upright) */}
          <path d="M52 64 L58 246 C58 252 66 256 76 256 H84 C94 256 102 252 102 246 L108 64 Z" fill="#161616" />
          {/* Crimp top */}
          <rect x="50" y="58" width="60" height="7" rx="1.5" fill="#2d2d2d" />
          <line x1="56" y1="59" x2="56" y2="64" stroke="#1f1f1f" strokeWidth="1" />
          <line x1="62" y1="59" x2="62" y2="64" stroke="#1f1f1f" strokeWidth="1" />
          <line x1="68" y1="59" x2="68" y2="64" stroke="#1f1f1f" strokeWidth="1" />
          <line x1="74" y1="59" x2="74" y2="64" stroke="#1f1f1f" strokeWidth="1" />
          <line x1="80" y1="59" x2="80" y2="64" stroke="#1f1f1f" strokeWidth="1" />
          <line x1="86" y1="59" x2="86" y2="64" stroke="#1f1f1f" strokeWidth="1" />
          <line x1="92" y1="59" x2="92" y2="64" stroke="#1f1f1f" strokeWidth="1" />
          <line x1="98" y1="59" x2="98" y2="64" stroke="#1f1f1f" strokeWidth="1" />
          <line x1="104" y1="59" x2="104" y2="64" stroke="#1f1f1f" strokeWidth="1" />
          {/* Tube Gloss Highlight */}
          <path d="M56 68 L61 246 H68 L64 68 Z" fill="white" fillOpacity="0.06" />
          {/* Base Stand Cap */}
          <rect x="68" y="256" width="24" height="18" rx="2" fill="#262626" />
          <rect x="65" y="274" width="30" height="4" rx="1" fill="#191919" />
          {/* Label Badge */}
          <rect x="62" y="94" width="36" height="46" fill="#000000" stroke="#333333" strokeWidth="0.8" />
          <text x="80" y="108" fill="#ffffff" fontSize="5.5" fontFamily="Montserrat, sans-serif" fontWeight="300" textAnchor="middle" letterSpacing="0.1em">haircare</text>
          <text x="80" y="126" fill="#ffffff" fontSize="12" fontFamily="Montserrat, sans-serif" fontWeight="900" textAnchor="middle" letterSpacing="0.02em">paul</text>
          {/* Description */}
          <text x="80" y="162" fill="#888888" fontSize="4.5" fontFamily="Montserrat, sans-serif" fontWeight="600" textAnchor="middle" letterSpacing="0.12em">LEAVE-IN CREAM</text>
          <text x="80" y="170" fill="#666666" fontSize="4" fontFamily="Montserrat, sans-serif" textAnchor="middle">120ml</text>
        </svg>
      )}
    </div>
  );
};
