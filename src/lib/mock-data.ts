export const MOCK_STORES = [
  {
    id: 'store-1',
    name: 'Aarong Heritage',
    slug: 'aarong-heritage',
    ownerName: 'Nazmul Hossen',
    phone: '+8801712345678',
    email: 'hello@aarongheritage.bd',
    address: 'House 42, Road 27, Dhanmondi',
    city: 'Dhaka',
    language: 'en',
    planKey: 'business',
    status: 'ACTIVE',
    createdAt: '2026-06-14',
  },
]

export const MOCK_PRODUCTS = [
  {
    id: 'prod-1',
    storeId: 'store-1',
    name: 'Narayanganj Silk Jamdani Saree',
    slug: 'jamdani-festive-saree',
    sku: 'AH-SR-001',
    category: "Women's Wear",
    price: 6850,
    comparePrice: 8200,
    quantity: 24,
    status: 'ACTIVE',
    tags: ['eid', 'jamdani', 'silk'],
    images: ['/images/cat-women.jpg'],
    sold: 68,
    description: 'Handwoven half-silk Jamdani saree crafted by master weavers in Rupganj, Narayanganj.',
  },
  {
    id: 'prod-2',
    storeId: 'store-1',
    name: 'Royal Embroidered Cotton Panjabi',
    slug: 'royal-cotton-panjabi',
    sku: 'AH-PJ-014',
    category: "Men's Wear",
    price: 3250,
    comparePrice: 3800,
    quantity: 42,
    status: 'ACTIVE',
    tags: ['cotton', 'eid', 'panjabi'],
    images: ['/images/cat-men.jpg'],
    sold: 94,
    description: 'Breathable 100% combed Giza cotton Panjabi with subtle tonal geometric embroidery on collar and placket.',
  },
  {
    id: 'prod-3',
    storeId: 'store-1',
    name: 'Festive Muslin Three-Piece Set',
    slug: 'festive-muslin-three-piece',
    sku: 'AH-TP-008',
    category: "Women's Wear",
    price: 4600,
    comparePrice: 5400,
    quantity: 7,
    status: 'ACTIVE',
    tags: ['three-piece', 'festive'],
    images: ['/images/promo.jpg'],
    sold: 51,
    description: 'Unstitched digital printed kameez with zari chiffon dupatta and matching cotton salwar.',
  },
  {
    id: 'prod-4',
    storeId: 'store-1',
    name: 'Kids Festive Kabli & Waistcoat Set',
    slug: 'kids-festive-kabli',
    sku: 'AH-KD-003',
    category: 'Kids Wear',
    price: 2150,
    comparePrice: 2500,
    quantity: 19,
    status: 'ACTIVE',
    tags: ['kids', 'eid'],
    images: ['/images/cat-accessories.jpg'],
    sold: 38,
    description: 'Kids 2-piece jacquard kabli suit paired with contrast raw-silk waistcoat.',
  },
  {
    id: 'prod-5',
    storeId: 'store-1',
    name: 'Artisanal Handcrafted Leather Loafers',
    slug: 'artisanal-leather-loafers',
    sku: 'AH-FT-022',
    category: 'Footwear',
    price: 3950,
    comparePrice: 4500,
    quantity: 16,
    status: 'ACTIVE',
    tags: ['leather', 'formal'],
    images: ['/images/cat-accessories.jpg'],
    sold: 37,
    description: 'Full-grain cowhide leather penny loafers with hand-stitched apron and cushioned leather insole.',
  },
  {
    id: 'prod-6',
    storeId: 'store-1',
    name: 'Traditional Brass Nakshi Pitha Mould Set',
    slug: 'brass-nakshi-pitha-mould',
    sku: 'AH-HM-011',
    category: 'Home & Craft',
    price: 1250,
    comparePrice: 1500,
    quantity: 58,
    status: 'ACTIVE',
    tags: ['brass', 'craft', 'kitchen'],
    images: ['/images/promo.jpg'],
    sold: 52,
    description: 'Heavy solid brass handcrafted traditional Pitha moulds featuring paisley and floral motifs.',
  },
  {
    id: 'prod-7',
    storeId: 'store-1',
    name: 'Terracotta Pottery Chai & Tea Set',
    slug: 'terracotta-pottery-tea-set',
    sku: 'AH-HM-005',
    category: 'Home & Craft',
    price: 1650,
    comparePrice: 1950,
    quantity: 33,
    status: 'ACTIVE',
    tags: ['terracotta', 'craft', 'tea'],
    images: ['/images/cat-accessories.jpg'],
    sold: 41,
    description: 'Natural clay glazed teapot with 6 earthen kulhad cups fired in traditional kilns in Dhamrai.',
  },
  {
    id: 'prod-8',
    storeId: 'store-1',
    name: 'Golden Fiber Jute Tote Bag',
    slug: 'golden-jute-tote-bag',
    sku: 'AH-AC-019',
    category: 'Accessories',
    price: 850,
    comparePrice: 1050,
    quantity: 75,
    status: 'ACTIVE',
    tags: ['jute', 'eco', 'bag'],
    images: ['/images/cat-accessories.jpg'],
    sold: 83,
    description: '100% biodegradable natural laminated jute tote bag with reinforced cotton webbing handles.',
  },
]

export const MOCK_ORDERS = [
  {
    id: 'ord-1042',
    orderNumber: 1042,
    storeId: 'store-1',
    customer: { id: 'cust-1', name: 'Fatima Akter', email: 'fatima.akter@gmail.com', phone: '01715889900' },
    status: 'DELIVERED',
    paymentMethod: 'BKASH',
    paymentStatus: 'PAID',
    transactionId: 'BKH9823412',
    subtotal: 6850,
    shippingFee: 60,
    total: 6910,
    shippingName: 'Fatima Akter',
    shippingPhone: '01715889900',
    shippingAddress: 'Flat 4B, House 19, Road 9A, Dhanmondi',
    city: 'Dhaka',
    courier: 'pathao',
    trackingCode: 'PTH-883192',
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    items: [
      { id: 'item-1', name: 'Narayanganj Silk Jamdani Saree', sku: 'AH-SR-001', price: 6850, quantity: 1, total: 6850 }
    ]
  },
  {
    id: 'ord-1041',
    orderNumber: 1041,
    storeId: 'store-1',
    customer: { id: 'cust-2', name: 'Mahmudul Hasan', email: 'mahmud.ctg@yahoo.com', phone: '01812445566' },
    status: 'PROCESSING',
    paymentMethod: 'COD',
    paymentStatus: 'PENDING',
    transactionId: null,
    subtotal: 4900,
    shippingFee: 120,
    total: 5020,
    shippingName: 'Mahmudul Hasan',
    shippingPhone: '01812445566',
    shippingAddress: 'House 12, Kumarpara Residential Area',
    city: 'Chattogram',
    courier: 'steadfast',
    trackingCode: 'STF-554109',
    createdAt: new Date(Date.now() - 3600000 * 8).toISOString(),
    items: [
      { id: 'item-2', name: 'Royal Embroidered Cotton Panjabi', sku: 'AH-PJ-014', price: 3250, quantity: 1, total: 3250 },
      { id: 'item-3', name: 'Terracotta Pottery Chai Set', sku: 'AH-HM-005', price: 1650, quantity: 1, total: 1650 }
    ]
  },
  {
    id: 'ord-1040',
    orderNumber: 1040,
    storeId: 'store-1',
    customer: { id: 'cust-3', name: 'Farhana Ahmed', email: 'farhana.syl@gmail.com', phone: '01914778899' },
    status: 'PENDING',
    paymentMethod: 'NAGAD',
    paymentStatus: 'PAID',
    transactionId: 'NGD3321901',
    subtotal: 4600,
    shippingFee: 60,
    total: 4660,
    shippingName: 'Farhana Ahmed',
    shippingPhone: '01914778899',
    shippingAddress: 'GEC Circle, Nasirabad Housing',
    city: 'Sylhet',
    courier: 'redx',
    trackingCode: 'RDX-990142',
    createdAt: new Date(Date.now() - 3600000 * 14).toISOString(),
    items: [
      { id: 'item-4', name: 'Festive Muslin Three-Piece Set', sku: 'AH-TP-008', price: 4600, quantity: 1, total: 4600 }
    ]
  },
  {
    id: 'ord-1039',
    orderNumber: 1039,
    storeId: 'store-1',
    customer: { id: 'cust-4', name: 'Tanvir Chowdhury', email: 'tanvir.c@corp.bd', phone: '01611334455' },
    status: 'DELIVERED',
    paymentMethod: 'BKASH',
    paymentStatus: 'PAID',
    transactionId: 'BKH4412091',
    subtotal: 3950,
    shippingFee: 60,
    total: 4010,
    shippingName: 'Tanvir Chowdhury',
    shippingPhone: '01611334455',
    shippingAddress: 'Banani Road 11, Block F',
    city: 'Dhaka',
    courier: 'pathao',
    trackingCode: 'PTH-771234',
    createdAt: new Date(Date.now() - 3600000 * 28).toISOString(),
    items: [
      { id: 'item-5', name: 'Artisanal Handcrafted Leather Loafers', sku: 'AH-FT-022', price: 3950, quantity: 1, total: 3950 }
    ]
  }
]

export const MOCK_CUSTOMERS = [
  { id: 'cust-1', name: 'Fatima Akter', email: 'fatima.akter@gmail.com', phone: '+8801715889900', address: 'Flat 4B, House 19, Road 9A, Dhanmondi', city: 'Dhaka', totalSpent: 42800, ordersCount: 7, lastOrderAt: 'Today' },
  { id: 'cust-2', name: 'Mahmudul Hasan', email: 'mahmud.ctg@yahoo.com', phone: '+8801812445566', address: 'House 12, Kumarpara Residential Area', city: 'Chattogram', totalSpent: 24650, ordersCount: 4, lastOrderAt: 'Yesterday' },
  { id: 'cust-3', name: 'Farhana Ahmed', email: 'farhana.syl@gmail.com', phone: '+8801914778899', address: 'GEC Circle, Nasirabad Housing', city: 'Sylhet', totalSpent: 31200, ordersCount: 6, lastOrderAt: '2 days ago' },
  { id: 'cust-4', name: 'Tanvir Chowdhury', email: 'tanvir.c@corp.bd', phone: '+8801611334455', address: 'Banani Road 11, Block F', city: 'Dhaka', totalSpent: 19500, ordersCount: 3, lastOrderAt: '3 days ago' },
  { id: 'cust-5', name: 'Samira Rahman', email: 'samira.raj@gmail.com', phone: '+8801722998877', address: 'Shaheb Bazar Zero Point', city: 'Rajshahi', totalSpent: 14900, ordersCount: 3, lastOrderAt: '5 days ago' }
]

export const MOCK_THEMES = [
  {
    id: 'theme-verdantra',
    slug: 'verdantra-climate',
    name: 'Verdantra Climate Template',
    niche: 'general',
    description: 'Uploaded React + Vite environmental & climate action storefront with 6 interactive pages (Home, Our Mission, Problems, Projects, Contribution, Contact), dual bento hero, and 53 source files.',
    author: 'Aarong Heritage',
    status: 'PUBLISHED',
    featured: true,
    price: 0,
    coverUrl: '/images/hero-basin.jpg',
    currentVersion: {
      version: '1.0.0',
      fileCount: 53,
      features: ['catalog', 'search', 'bilingual', 'reviews', 'custom-domain'],
      pages: ['home', 'mission', 'problems', 'projects', 'contribution', 'contact']
    }
  },
  {
    id: 'theme-timberline',
    slug: 'timberline-homes',
    name: 'Timberline Homes (React + Vite)',
    niche: 'furniture',
    description: 'Architectural custom homes storefront with interactive project filters, detail modal, quote form, and timber-frame design.',
    author: 'Aarong Heritage',
    status: 'PUBLISHED',
    featured: true,
    price: 0,
    coverUrl: '/images/timberline-hero.jpg',
    currentVersion: {
      version: '1.0.0',
      fileCount: 32,
      features: ['catalog', 'search', 'reviews', 'bilingual'],
      pages: ['home', 'about', 'services', 'projects', 'contact']
    }
  },
  {
    id: 'theme-lumiere',
    slug: 'lumiere-fashion',
    name: 'Lumière Fashion Minimalist',
    niche: 'fashion',
    description: 'Minimalist Nordic-style fashion & apparel storefront featuring fast checkout, slide-over cart drawer, and lookbook grid.',
    author: 'NexDrop Studio',
    status: 'PUBLISHED',
    featured: true,
    price: 0,
    coverUrl: '/images/cat-women.jpg',
    currentVersion: {
      version: '1.0.0',
      fileCount: 28,
      features: ['catalog', 'cart', 'checkout', 'search', 'cod', 'bkash'],
      pages: ['home', 'collection', 'product', 'cart', 'checkout']
    }
  }
]

export const MOCK_THEME_INSTALLS = [
  {
    id: 'inst-verdantra',
    storeId: 'store-1',
    themeId: 'theme-verdantra',
    theme: MOCK_THEMES[0],
    version: '1.0.0',
    isLive: true,
    publishedAt: 'Active',
    updatedAt: 'Just now'
  },
  {
    id: 'inst-timberline',
    storeId: 'store-1',
    themeId: 'theme-timberline',
    theme: MOCK_THEMES[1],
    version: '1.0.0',
    isLive: false,
    publishedAt: 'Draft',
    updatedAt: 'Yesterday'
  },
  {
    id: 'inst-lumiere',
    storeId: 'store-1',
    themeId: 'theme-lumiere',
    theme: MOCK_THEMES[2],
    version: '1.0.0',
    isLive: false,
    publishedAt: 'Draft',
    updatedAt: '3 days ago'
  }
]

export const MOCK_METRICS = {
  revenue: { value: 1725000, change: 0.158 },
  orders: { value: 279, change: 0.124 },
  customers: { value: 304, new: 28 },
  stock: { units: 842, products: 8 }
}

export const MOCK_MONTHLY_CHART = [
  { month: 'Jun', revenue: 420000, orders: 82, customers: 74 },
  { month: 'Jul', revenue: 580000, orders: 110, customers: 98 },
  { month: 'Aug', revenue: 710000, orders: 135, customers: 118 },
  { month: 'Sep', revenue: 890000, orders: 168, customers: 142 },
  { month: 'Oct', revenue: 1340000, orders: 224, customers: 195 },
  { month: 'Nov', revenue: 1725000, orders: 279, customers: 304 }
]

export const MOCK_PAYMENTS = [
  { method: 'BKASH', percentage: 44, amount: 759000, orders: 122 },
  { method: 'COD', percentage: 28, amount: 483000, orders: 78 },
  { method: 'NAGAD', percentage: 16, amount: 276000, orders: 45 },
  { method: 'SSLCOMMERZ', percentage: 9, amount: 155250, orders: 25 },
  { method: 'ROCKET', percentage: 3, amount: 51750, orders: 9 }
]

export const MOCK_REVENUE_CHART = [
  { date: 'Oct 05', revenue: 42000 },
  { date: 'Oct 10', revenue: 58000 },
  { date: 'Oct 15', revenue: 51000 },
  { date: 'Oct 20', revenue: 69000 },
  { date: 'Oct 25', revenue: 74000 },
  { date: 'Oct 30', revenue: 86000 },
  { date: 'Nov 03', revenue: 92000 }
]

