import { Product, ServiceItem, PressArticle, Testimonial, LookbookItem, LocationBranch } from '../types';

export const PARTNERS = [
  { id: '1', name: 'bed head', fontStyle: 'font-black tracking-tighter text-xl lowercase' },
  { id: '2', name: 'HAIRCARE', fontStyle: 'font-script text-2xl font-bold tracking-wider' },
  { id: '3', name: 'CURL', fontStyle: 'font-editorial font-bold tracking-widest text-xl uppercase' },
  { id: '4', name: 'HAIRWAVE', fontStyle: 'font-sans font-light tracking-[0.25em] text-sm uppercase' },
  { id: '5', name: 'ArganOil', fontStyle: 'font-serif-luxury text-xl italic font-semibold' },
  { id: '6', name: 'BEAUTY SALON', fontStyle: 'font-sans text-xs tracking-[0.3em] font-bold uppercase' },
];

export const PRODUCTS: Product[] = [
  {
    id: 'sos-conditioner',
    name: 'SOS CONDITIONER',
    category: 'Recovery & Moisture',
    subtitle: 'Intense reconstructive treatment for damaged hair',
    description: 'Intense reconstructive treatment formulated with active botanical proteins and botanical lipids to instantly restore brittle hair fibers.',
    price: 77.0,
    rating: 4.9,
    reviewsCount: 128,
    size: '150ml / 5.1 fl. oz.',
    image: '/products/sos-conditioner.svg',
    isBestSeller: true,
    ingredients: ['Hydrolyzed Silk Protein', 'Argan Kernel Oil', 'Ceramide Complex', 'Panthenol Provitamin B5'],
    howToUse: 'Apply evenly from mid-lengths to ends on towel-dried hair. Leave for 3 to 5 minutes before rinsing thoroughly.',
    benefits: ['Deep cuticle repair', 'Anti-frizz moisture barrier', 'Thermal protection up to 230°C']
  },
  {
    id: 'light-shampoo',
    name: 'LIGHT SHAMPOO',
    category: 'Daily Cleanse & Volume',
    subtitle: 'Purifying micellar formula for daily cleanse and volume',
    description: 'Purifying micellar formulation enriched with white tea leaf extract and botanical peptides to gently clarify scalp and strand without stripping.',
    price: 60.0,
    rating: 4.8,
    reviewsCount: 94,
    size: '300ml / 10.1 fl. oz.',
    image: '/products/light-shampoo.svg',
    isBestSeller: true,
    ingredients: ['Organic Camellia Sinensis', 'Gentle Glucosides', 'Rice Amino Acids', 'Rosemary Extract'],
    howToUse: 'Massage gently into wet scalp using circular motions. Lather through ends and rinse with lukewarm water.',
    benefits: ['Weightless bounce', 'Color-safe formula', 'Balanced scalp microbiome']
  },
  {
    id: 'silk-serum',
    name: 'SILK SERUM',
    category: 'High Gloss & Smoothness',
    subtitle: 'Weightless micro-gloss serum for reflective radiance',
    description: 'Weightless micro-gloss serum that envelopes each hair follicle in reflective radiance while sealing split ends effortlessly.',
    price: 65.0,
    rating: 5.0,
    reviewsCount: 210,
    size: '80ml / 2.7 fl. oz.',
    image: '/products/silk-serum.svg',
    isBestSeller: true,
    ingredients: ['Cold-pressed Marula Oil', 'Squalane', 'Vitamin E Acetate', 'Bergamot Essential Essence'],
    howToUse: 'Dispense 1-2 pumps onto palms, emulsify, and smooth through lengths on damp or dry styled hair.',
    benefits: ['Luminous mirror shine', 'Instant flyaway smoothing', 'Humidity shield for 48 hours']
  },
  {
    id: 'leave-in-cream',
    name: 'LEAVE-IN CREAM',
    category: 'Hydration & Definition',
    subtitle: 'Rich velvety leave-in for hydration and definition',
    description: 'Rich velvety leave-in conditioner that detangles, softens curls, and nourishes thirsty ends all day long.',
    price: 55.0,
    rating: 4.9,
    reviewsCount: 86,
    size: '120ml / 4.0 fl. oz.',
    image: '/products/leave-in-cream.svg',
    isBestSeller: true,
    ingredients: ['Shea Butter Ethyl Esters', 'Hyaluronic Acid Micro-spheres', 'Jojoba Golden Oil', 'Oat Beta-Glucan'],
    howToUse: 'Apply a dime-sized amount to mid-lengths and ends before air-drying or blow-drying.',
    benefits: ['Effortless detangling', 'Natural wave definition', 'All-day hydration']
  }
];

export const LOOKBOOK_ITEMS: LookbookItem[] = [
  {
    id: 'look-1',
    title: 'TEXTURED SWEPT CROP',
    model: 'Julian Vance',
    style: 'Artistic Matte Texture',
    image: '/images/hair-gallery1.jpeg',
    alt: 'Male model with tousled wavy haircut'
  },
  {
    id: 'look-2',
    title: 'THE GOLDEN FLORA TWIST',
    model: 'Elena Rostova',
    style: 'Haute Couture Bridal Chignon',
    image: '/images/lookbook-2.jpg',
    alt: 'Back view of elegant blonde hair twist with gold leaf ornament'
  },
  {
    id: 'look-3',
    title: 'EDITORIAL WET STRAND PROFILE',
    model: 'Clara Delacroix',
    style: 'High Fashion Sculpted Wet Look',
    image: '/images/lookbook-3.jpg',
    alt: 'Side profile of female model with dark glossy styled hair strands'
  }
];

export const TESTIMONIALS: Testimonial[] = [
  {
    id: 'test-2',
    quote: 'PAUL HAS REDEFINED THE ARCHITECTURE OF HAIR. VISITING THE SALON IS A PURE MEDITATIVE LUXURY.',
    author: 'Camille Laurent',
    role: 'Fashion Editor, Vogue',
    location: 'Zurich'
  },
  {
    id: 'test-3',
    quote: 'FROM THE BESPOKE CONSULTATION TO THE SILK FINISH, THIS IS SWISS PRECISION CRAFTSMANSHIP AT ITS FINEST.',
    author: 'Sébastien Moreau',
    role: 'Creative Director',
    location: 'Geneva'
  },
  {
    id: 'test-4',
    quote: 'THE CUT MOVES WITH MY DAILY LIFE. EFFORTLESS, EXACT, AND SOMEHOW ALWAYS ALIVE.',
    author: 'Isabella Novak',
    role: 'Model',
    location: 'Zurich'
  },
  {
    id: 'test-5',
    quote: 'MY COLOUR HAS NEVER FELT SO INTENTIONAL. STYLISTS WHO ACTUALLY LISTEN, THEN EXECUTE.',
    author: 'Amelie Weber',
    role: 'Interior Designer',
    location: 'Zug'
  },
  {
    id: 'test-6',
    quote: 'SIXTY MINUTES THAT RESET EVERYTHING. TIME ITSELF GETS SCULPTED HERE.',
    author: 'Henri Valmont',
    role: 'Photographer',
    location: 'Paris'
  },
  {
    id: 'test-7',
    quote: 'FROM ZURICH TO PARIS, THE SAME RIGOR. THE DETAILS ARE NEVER LEFT TO CHANCE.',
    author: 'Lara Fischer',
    role: 'Architect',
    location: 'Basel'
  },
  {
    id: 'test-8',
    quote: 'THE BOTANICAL TREATMENTS LEFT MY HAIR SILKIER THAN ANY SALON I HAVE EVER VISITED.',
    author: 'Olivia Hart',
    role: 'Stylist',
    location: 'London'
  },
  {
    id: 'test-9',
    quote: 'PRECISION CUTS MY OLD SALON COULD NOT TOUCH. THE CONSISTENCY IS ABSURD.',
    author: 'Marco Rosetti',
    role: 'Chef',
    location: 'Milan'
  },
  {
    id: 'test-10',
    quote: 'A TRUE ATELIER FEEL. PRIVATE, QUIET, WITH CRAFT AT THE CENTRE OF EVERYTHING.',
    author: 'Sofia Marchetti',
    role: 'Gallery Owner',
    location: 'Florence'
  }
];

export const LOCATIONS: LocationBranch[] = [
  {
    city: 'ZURICH',
    address: 'Seestrasse 21, CH',
    email: 'zurich@paulhairstudio.com',
    telephone: '00 123 456 789',
    hours: 'Mon - Fri: 09:00 - 20:00, Sat: 10:00 - 18:00'
  },
  {
    city: 'PARIS',
    address: 'Seestrasse 21, CH',
    email: 'paris@paulhairstudio.com',
    telephone: '00 123 456 777',
    hours: 'Tue - Sat: 10:00 - 19:30'
  }
];

export const PRESS_ARTICLES: PressArticle[] = [
  {
    id: 'press-1',
    dateBadge: { month: 'Mar', day: '4' },
    author: 'PAUL',
    category: 'HAIR, MODERN',
    title: 'MODERN HIGHLIGHTS SEASON TRENDS',
    excerpt: 'Discover the revolutionary balayage and tone-feathering techniques defining this autumn’s haute couture runways.',
    content: 'Hair color in the modern era is no longer about uniform saturation; it is an intimate play of light, shadow, and organic movement. At Paul Hair Studio, our signature multi-dimensional color placement illuminates the cheekbones and contours naturally without harsh demarcation lines.',
    image: '/images/press-1.jpg',
    readTime: '4 min read'
  },
  {
    id: 'press-2',
    dateBadge: { month: 'Mar', day: '10' },
    author: 'PAUL',
    category: 'FRESH',
    title: 'ECO FRIENDLY GENTLE HAIR CARE PRODUCTS',
    excerpt: 'How clean bio-fermented ingredients are replacing synthetic polymers without compromising runway-grade performance.',
    content: 'Sustainability is an uncompromising pillar of luxury. Our in-house botanical laboratory synthesizes plant squalane, cold-pressed marula, and cold-extracted oat lipids into microscopic delivery vehicles that penetrate the cortex effortlessly.',
    image: '/images/press-2.jpg',
    readTime: '3 min read'
  },
  {
    id: 'press-3',
    dateBadge: { month: 'Mar', day: '16' },
    author: 'PAUL',
    category: 'HAIRSTYLE',
    title: 'FAMOUS HAIRSTYLES AND PHOTOGRAPHY',
    excerpt: 'Behind the lens with master photographer Lucas Stern exploring motion and silhouette in editorial portraiture.',
    content: 'Hair is sculpture in motion. In our exclusive collaboration with European fashion houses, we explored how high-speed strobe photography captures the micro-second velocity of brushed tresses in atmospheric wind.',
    image: '/images/press-3.jpg',
    readTime: '5 min read'
  }
];

export const SERVICES: ServiceItem[] = [
  {
    id: 'srv-1',
    name: 'HAIRCUT WITH BLOW DRY',
    description: 'Precision cut tailored to your face shape, finished with a luxurious blow dry.',
    price: 39,
    durationMinutes: 45,
    category: 'Cut & Style'
  },
  {
    id: 'srv-2',
    name: 'BLOW DRY & CURL',
    description: 'Signature blow dry with soft curls or waves for a polished, editorial finish.',
    price: 49,
    durationMinutes: 40,
    category: 'Style & Finish'
  },
  {
    id: 'srv-3',
    name: 'SHAMPOO & SET',
    description: 'Relaxing scalp massage with botanical wash, followed by a classic set style.',
    price: 29,
    durationMinutes: 30,
    category: 'Wash & Refresh'
  },
  {
    id: 'srv-4',
    name: 'HAIRCUT WITH HIGHLIGHTS',
    description: 'Bespoke colour placement with precision cutting for multi-dimensional dimension.',
    price: 79,
    durationMinutes: 90,
    category: 'Color & Cut'
  },
  {
    id: 'srv-5',
    name: 'HAIRCUT & CURL',
    description: 'Textured cut with natural curl definition and movement for effortless style.',
    price: 59,
    durationMinutes: 60,
    category: 'Cut & Texture'
  },
  {
    id: 'srv-6',
    name: 'BEARD SCULPT & SHAPE',
    description: 'Precision beard sculpting with a hot-towel finish for a sharp, defined profile.',
    price: 35,
    durationMinutes: 30,
    category: 'Cut & Style'
  },
  {
    id: 'srv-7',
    name: 'GLAZE & GLOSS',
    description: 'In-salon gloss treatment that seals the cuticle for glass-like shine and tone.',
    price: 55,
    durationMinutes: 45,
    category: 'Color & Cut'
  },
  {
    id: 'srv-8',
    name: 'DEEP CONDITIONING RITUAL',
    description: 'Intensive botanical mask, steam and scalp massage to restore moisture and movement.',
    price: 45,
    durationMinutes: 45,
    category: 'Wash & Refresh'
  },
  {
    id: 'srv-9',
    name: 'EDITORIAL UPDO',
    description: 'Runs the show ready: sculptural updo styled for events, shoots and red carpets.',
    price: 65,
    durationMinutes: 50,
    category: 'Bridal & Occasion'
  },
  {
    id: 'srv-10',
    name: 'BALAYAGE & TONER',
    description: 'Hand-painted balayage with a gloss toner for dimensional, low-maintenance colour.',
    price: 95,
    durationMinutes: 120,
    category: 'Color & Cut'
  },
  {
    id: 'srv-11',
    name: 'CURL REVIVAL SET',
    description: 'Frizz-free hydration cut and a curl-by-curl refresh for defined, bouncy spirals.',
    price: 49,
    durationMinutes: 60,
    category: 'Cut & Texture'
  },
  {
    id: 'srv-12',
    name: 'CORPORATE BLOW DRY',
    description: 'A polished, camera-ready blow dry in time for your next meeting or event.',
    price: 35,
    durationMinutes: 25,
    category: 'Style & Finish'
  }
];

export const SERVICE_MEDIA: Record<string, { image: string; alt: string }> = {
  'srv-1': {
    image: '/images/hero-1.jpg',
    alt: 'Master stylist finishing a precision haircut with a blow dry'
  },
  'srv-2': {
    image: '/images/instagram-3.jpg',
    alt: 'Sleek graphic bob finished with soft curls'
  },
  'srv-3': {
    image: '/images/hair-hero2.avif',
    alt: 'Relaxing shampoo and scalp ritual'
  },
  'srv-4': {
    image: '/images/instagram-4.jpg',
    alt: 'Honey gloss highlights with beach waves'
  },
  'srv-5': {
    image: '/images/hair-service1.avif',
    alt: 'Barber precision cutting with comb and scissors'
  },
  'srv-6': {
    image: '/images/press-1.jpg',
    alt: 'Master barber sculpting a defined beard with a straight razor'
  },
  'srv-7': {
    image: '/images/lookbook-3.jpg',
    alt: 'Glossy brunette finish with mirror-like shine'
  },
  'srv-8': {
    image: '/images/instagram-2.jpg',
    alt: 'Hand dispensing golden botanical hair elixir serum'
  },
  'srv-9': {
    image: '/images/instagram-1.jpg',
    alt: 'Sculptural editorial updo styled for an event'
  },
  'srv-10': {
    image: '/images/lookbook-1.jpg',
    alt: 'Hand-painted balayage with dimensional honey tones'
  },
  'srv-11': {
    image: '/images/hair-gallery1.jpeg',
    alt: 'Natural curls refreshed and defined by a hydration cut'
  },
  'srv-12': {
    image: '/images/lookbook-2.jpg',
    alt: 'Sleek corporate blow dry with a polished finish'
  }
};

export const INSTAGRAM_POSTS = [
  {
    id: 'ig-1',
    image: '/images/instagram-1.jpg',
    alt: 'Master stylist scissor work on textured male crop',
    likes: '1.4k',
    caption: 'Precision taper fade and natural flow by Master Paul.'
  },
  {
    id: 'ig-2',
    image: '/images/instagram-2.jpg',
    alt: 'Hand dispensing golden organic hair elixir serum',
    likes: '890',
    caption: 'Gold droplet drops: Pure cold-pressed botanical silk serum.'
  },
  {
    id: 'ig-3',
    image: '/images/instagram-3.jpg',
    alt: 'Sleek dark graphic bob cut on Asian female model',
    likes: '2.1k',
    caption: 'High-contrast graphic chin-length bob paired with crimson lip.'
  },
  {
    id: 'ig-4',
    image: '/images/instagram-4.jpg',
    alt: 'Brunette model showing honey gloss highlights and soft beach waves',
    likes: '1.2k',
    caption: 'Sun-drenched honey balayage for the upcoming gala season.'
  },
  {
    id: 'ig-5',
    image: '/images/press-2.jpg',
    alt: 'Paul haircare luxury amber glass bottles with pump dispenser',
    likes: '950',
    caption: 'Our signature restorative collection in recyclable matte glass.'
  }
];

export const STYLISTS = [
  { id: 'paul', name: 'Paul Delacroix', role: 'Creative Director & Master Stylist' },
  { id: 'claire', name: 'Claire Moreau', role: 'Senior Colorist & Balayage Specialist' },
  { id: 'lucas', name: 'Lucas Stern', role: 'Master Barber & Texture Expert' },
  { id: 'sophie', name: 'Sophie Weber', role: 'Editorial Stylist & Scalp Specialist' },
  { id: 'lena', name: 'Lena Fischer', role: 'Junior Stylist & Colourist' },
  { id: 'marc', name: 'Marc Dubois', role: 'Apprentice Barber' },
  { id: 'amelie', name: 'Amélie Rousseau', role: 'Trainee & Scalp Therapist' },
  { id: 'nina', name: 'Nina Vogel', role: 'Colourist & Bridal Specialist' }
];
