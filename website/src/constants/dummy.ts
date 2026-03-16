// ============ TYPES ============
export type UserRole = 'superadmin' | 'owner' | 'manager' | 'kasir';
export type TransactionStatus = 'pending' | 'completed' | 'cancelled';
export type MaterialCategory = 'kain' | 'benang' | 'kancing' | 'zipper' | 'velcro' | 'label';
export type ProductCategory = 'T-shirt' | 'Hoodie' | 'Jacket' | 'Hat' | 'Accessories';
export type ProductType = 'hoodie' | 't-shirt' | 'jacket' | 'hat';

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  status: 'active' | 'inactive';
  avatar?: string;
  createdAt: string;
}

export interface Product {
  id: string;
  code: string;
  name: string;
  category: ProductCategory;
  stock: number;
  unit: string;
  buyPrice: number;
  sellPrice: number;
  discount: number;
  status: 'active' | 'inactive';
  description: string;
  images: string[];
}

export interface RawMaterial {
  id: string;
  code: string;
  name: string;
  category: MaterialCategory;
  productType: ProductType;
  stock: number;
  unit: string;
  minStock: number;
  status: 'normal' | 'low' | 'critical';
}

export interface Supplier {
  id: string;
  company: string;
  contact: string;
  phone: string;
  email: string;
  address: string;
  productType: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  category: 'umum' | 'reseller' | 'vip';
  points: number;
}

export interface TransactionItem {
  productId: string;
  productName: string;
  qty: number;
  price: number;
  subtotal: number;
}

export interface Transaction {
  id: string;
  invoice: string;
  date: string;
  customerId: string;
  customerName: string;
  items: TransactionItem[];
  total: number;
  status: TransactionStatus;
  paymentMethod: string;
}

// ============ USERS ============
export const users: User[] = [
  { id: 'U001', name: 'Admin Velcrone', email: 'admin@velcrone.com', password: '123456', role: 'superadmin', status: 'active', createdAt: '2023-01-01' },
  { id: 'U002', name: 'Budi Santoso', email: 'owner@velcrone.com', password: '123456', role: 'owner', status: 'active', createdAt: '2023-01-05' },
  { id: 'U003', name: 'Rina Kartika', email: 'manager@velcrone.com', password: '123456', role: 'manager', status: 'active', createdAt: '2023-02-10' },
  { id: 'U004', name: 'Andi Pratama', email: 'kasir@velcrone.com', password: '123456', role: 'kasir', status: 'active', createdAt: '2023-03-15' },
  { id: 'U005', name: 'Sari Dewi', email: 'sari@velcrone.com', password: '123456', role: 'kasir', status: 'active', createdAt: '2023-04-01' },
  { id: 'U006', name: 'Rizky Fauzan', email: 'rizky@velcrone.com', password: '123456', role: 'manager', status: 'active', createdAt: '2023-04-15' },
  { id: 'U007', name: 'Maya Putri', email: 'maya@velcrone.com', password: '123456', role: 'kasir', status: 'inactive', createdAt: '2023-05-01' },
  { id: 'U008', name: 'Dika Prasetyo', email: 'dika@velcrone.com', password: '123456', role: 'manager', status: 'active', createdAt: '2023-06-01' },
];

// ============ PRODUCTS ============
export const products: Product[] = [
  { id: 'P001', code: 'VLC-001', name: 'Essential Hoodie Black', category: 'Hoodie', stock: 45, unit: 'pcs', buyPrice: 150000, sellPrice: 350000, discount: 0, status: 'active', description: 'Premium heavyweight cotton hoodie with minimalist design. Perfect for everyday layering.', images: [] },
  { id: 'P002', code: 'VLC-002', name: 'Velcrone Cargo Pants', category: 'Accessories', stock: 30, unit: 'pcs', buyPrice: 120000, sellPrice: 280000, discount: 10, status: 'active', description: 'Relaxed fit cargo pants with multiple utility pockets. Durable ripstop fabric.', images: [] },
  { id: 'P003', code: 'VLC-003', name: 'Racing Stripe Tee', category: 'T-shirt', stock: 60, unit: 'pcs', buyPrice: 55000, sellPrice: 150000, discount: 0, status: 'active', description: 'Oversized t-shirt with signature racing stripe detail.', images: [] },
  { id: 'P004', code: 'VLC-004', name: 'Paddock Custom Shirt', category: 'T-shirt', stock: 25, unit: 'pcs', buyPrice: 75000, sellPrice: 185000, discount: 15, status: 'active', description: 'Custom printed paddock-style shirt with premium cotton blend.', images: [] },
  { id: 'P005', code: 'VLC-005', name: 'Hoodie Oversized Grey', category: 'Hoodie', stock: 40, unit: 'pcs', buyPrice: 160000, sellPrice: 380000, discount: 0, status: 'active', description: 'Oversized fit hoodie in heather grey. Drop shoulder design.', images: [] },
  { id: 'P006', code: 'VLC-006', name: 'Bomber Jacket Navy', category: 'Jacket', stock: 15, unit: 'pcs', buyPrice: 250000, sellPrice: 550000, discount: 5, status: 'active', description: 'Classic bomber jacket with ribbed cuffs and hem. Water-resistant shell.', images: [] },
  { id: 'P007', code: 'VLC-007', name: 'Trucker Cap Red', category: 'Hat', stock: 80, unit: 'pcs', buyPrice: 35000, sellPrice: 120000, discount: 0, status: 'active', description: 'Structured trucker cap with embroidered VELCRONE logo.', images: [] },
  { id: 'P008', code: 'VLC-008', name: 'Windbreaker Black', category: 'Jacket', stock: 20, unit: 'pcs', buyPrice: 200000, sellPrice: 450000, discount: 10, status: 'active', description: 'Lightweight windbreaker with packable hood. Reflective details.', images: [] },
  { id: 'P009', code: 'VLC-009', name: 'Basic Tee White', category: 'T-shirt', stock: 100, unit: 'pcs', buyPrice: 40000, sellPrice: 120000, discount: 0, status: 'active', description: 'Essential crew neck t-shirt in premium 220gsm cotton.', images: [] },
  { id: 'P010', code: 'VLC-010', name: 'Zip Hoodie Charcoal', category: 'Hoodie', stock: 35, unit: 'pcs', buyPrice: 170000, sellPrice: 399000, discount: 0, status: 'active', description: 'Full-zip hoodie with YKK zipper and kangaroo pockets.', images: [] },
  { id: 'P011', code: 'VLC-011', name: 'Graphic Tee Motorsport', category: 'T-shirt', stock: 55, unit: 'pcs', buyPrice: 60000, sellPrice: 165000, discount: 20, status: 'active', description: 'Motorsport-inspired graphic tee with vintage racing print.', images: [] },
  { id: 'P012', code: 'VLC-012', name: 'Coach Jacket Olive', category: 'Jacket', stock: 18, unit: 'pcs', buyPrice: 180000, sellPrice: 420000, discount: 0, status: 'active', description: 'Snap-button coach jacket in olive green nylon.', images: [] },
  { id: 'P013', code: 'VLC-013', name: 'Beanie Knit Black', category: 'Hat', stock: 70, unit: 'pcs', buyPrice: 25000, sellPrice: 85000, discount: 0, status: 'active', description: 'Ribbed knit beanie with woven label. One size fits all.', images: [] },
  { id: 'P014', code: 'VLC-014', name: 'Tote Bag Canvas', category: 'Accessories', stock: 50, unit: 'pcs', buyPrice: 30000, sellPrice: 95000, discount: 0, status: 'active', description: 'Heavy-duty canvas tote with screen-printed logo.', images: [] },
  { id: 'P015', code: 'VLC-015', name: 'Long Sleeve Henley', category: 'T-shirt', stock: 38, unit: 'pcs', buyPrice: 65000, sellPrice: 175000, discount: 0, status: 'active', description: 'Henley-collar long sleeve in soft jersey cotton.', images: [] },
  { id: 'P016', code: 'VLC-016', name: 'Puffer Vest Black', category: 'Jacket', stock: 12, unit: 'pcs', buyPrice: 220000, sellPrice: 480000, discount: 0, status: 'active', description: 'Quilted puffer vest with stand collar. Synthetic insulation.', images: [] },
  { id: 'P017', code: 'VLC-017', name: 'Snapback Racing', category: 'Hat', stock: 65, unit: 'pcs', buyPrice: 40000, sellPrice: 130000, discount: 0, status: 'active', description: 'Flat-brim snapback with racing-inspired embroidery.', images: [] },
  { id: 'P018', code: 'VLC-018', name: 'Polo Shirt Classic', category: 'T-shirt', stock: 42, unit: 'pcs', buyPrice: 70000, sellPrice: 195000, discount: 0, status: 'active', description: 'Classic piqué polo shirt with contrast collar tipping.', images: [] },
  { id: 'P019', code: 'VLC-019', name: 'Track Jacket Red', category: 'Jacket', stock: 22, unit: 'pcs', buyPrice: 190000, sellPrice: 430000, discount: 15, status: 'active', description: 'Retro track jacket with side stripe detail and zip front.', images: [] },
  { id: 'P020', code: 'VLC-020', name: 'Bucket Hat Camo', category: 'Hat', stock: 48, unit: 'pcs', buyPrice: 30000, sellPrice: 110000, discount: 0, status: 'active', description: 'Reversible bucket hat in camo and solid black.', images: [] },
];

// ============ RAW MATERIALS ============
export const rawMaterials: RawMaterial[] = [
  { id: 'BHN-001', code: 'BHN-001', name: 'Kain Fleece 280gsm', category: 'kain', productType: 'hoodie', stock: 150, unit: 'm', minStock: 50, status: 'normal' },
  { id: 'BHN-002', code: 'BHN-002', name: 'Kain Cotton Combed 24s', category: 'kain', productType: 't-shirt', stock: 200, unit: 'm', minStock: 80, status: 'normal' },
  { id: 'BHN-003', code: 'BHN-003', name: 'Kain Parasut Taslan', category: 'kain', productType: 'jacket', stock: 80, unit: 'm', minStock: 30, status: 'normal' },
  { id: 'BHN-004', code: 'BHN-004', name: 'Kain Drill', category: 'kain', productType: 'hat', stock: 45, unit: 'm', minStock: 20, status: 'normal' },
  { id: 'BHN-005', code: 'BHN-005', name: 'Benang Jahit Polyester', category: 'benang', productType: 'hoodie', stock: 500, unit: 'pcs', minStock: 100, status: 'normal' },
  { id: 'BHN-006', code: 'BHN-006', name: 'Velcro 2cm', category: 'velcro', productType: 'jacket', stock: 12, unit: 'm', minStock: 20, status: 'critical' },
  { id: 'BHN-007', code: 'BHN-007', name: 'Zipper YKK 50cm', category: 'zipper', productType: 'jacket', stock: 30, unit: 'pcs', minStock: 25, status: 'low' },
  { id: 'BHN-008', code: 'BHN-008', name: 'Zipper YKK 60cm', category: 'zipper', productType: 'hoodie', stock: 8, unit: 'pcs', minStock: 20, status: 'critical' },
  { id: 'BHN-009', code: 'BHN-009', name: 'Kancing Tekan 15mm', category: 'kancing', productType: 'jacket', stock: 200, unit: 'pcs', minStock: 50, status: 'normal' },
  { id: 'BHN-010', code: 'BHN-010', name: 'Label Woven VELCRONE', category: 'label', productType: 'hoodie', stock: 300, unit: 'pcs', minStock: 100, status: 'normal' },
  { id: 'BHN-011', code: 'BHN-011', name: 'Kain Ripstop Nylon', category: 'kain', productType: 'jacket', stock: 60, unit: 'm', minStock: 25, status: 'normal' },
  { id: 'BHN-012', code: 'BHN-012', name: 'Benang Obras', category: 'benang', productType: 't-shirt', stock: 15, unit: 'pcs', minStock: 30, status: 'critical' },
  { id: 'BHN-013', code: 'BHN-013', name: 'Kancing Kemeja 12mm', category: 'kancing', productType: 't-shirt', stock: 180, unit: 'pcs', minStock: 50, status: 'normal' },
  { id: 'BHN-014', code: 'BHN-014', name: 'Velcro 5cm', category: 'velcro', productType: 'jacket', stock: 25, unit: 'm', minStock: 15, status: 'normal' },
  { id: 'BHN-015', code: 'BHN-015', name: 'Label Hangtag', category: 'label', productType: 't-shirt', stock: 400, unit: 'pcs', minStock: 150, status: 'normal' },
  { id: 'BHN-016', code: 'BHN-016', name: 'Kain Canvas 12oz', category: 'kain', productType: 'hat', stock: 35, unit: 'm', minStock: 15, status: 'normal' },
  { id: 'BHN-017', code: 'BHN-017', name: 'Benang Bordir', category: 'benang', productType: 'hat', stock: 250, unit: 'pcs', minStock: 80, status: 'normal' },
  { id: 'BHN-018', code: 'BHN-018', name: 'Zipper Invisible 20cm', category: 'zipper', productType: 'hoodie', stock: 40, unit: 'pcs', minStock: 20, status: 'normal' },
  { id: 'BHN-019', code: 'BHN-019', name: 'Kain Scuba', category: 'kain', productType: 'hoodie', stock: 5, unit: 'm', minStock: 15, status: 'critical' },
  { id: 'BHN-020', code: 'BHN-020', name: 'Label Care Instruction', category: 'label', productType: 't-shirt', stock: 350, unit: 'pcs', minStock: 100, status: 'normal' },
];

// ============ SUPPLIERS ============
export const suppliers: Supplier[] = [
  { id: 'SUP-001', company: 'PT Tekstil Jaya', contact: 'Hendra Wijaya', phone: '021-5551234', email: 'hendra@tekstiljaya.com', address: 'Jl. Industri No. 45, Bandung', productType: 'Kain' },
  { id: 'SUP-002', company: 'CV Benang Mas', contact: 'Lina Susanti', phone: '022-4567890', email: 'lina@benangmas.co.id', address: 'Jl. Raya Cimahi No. 12, Cimahi', productType: 'Benang' },
  { id: 'SUP-003', company: 'YKK Indonesia', contact: 'Takeshi Yamada', phone: '021-7890123', email: 'sales@ykk.co.id', address: 'Kawasan Industri MM2100, Bekasi', productType: 'Zipper' },
  { id: 'SUP-004', company: 'PT Kancing Utama', contact: 'Dewi Ratna', phone: '031-3456789', email: 'dewi@kancingutama.com', address: 'Jl. Margomulyo No. 8, Surabaya', productType: 'Kancing' },
  { id: 'SUP-005', company: 'CV Label Pro', contact: 'Ahmad Faisal', phone: '021-6789012', email: 'ahmad@labelpro.id', address: 'Jl. Kebon Jeruk No. 22, Jakarta Barat', productType: 'Label' },
  { id: 'SUP-006', company: 'PT Velcro Nusantara', contact: 'Rita Anggraini', phone: '021-2345678', email: 'rita@velcronusantara.com', address: 'Jl. Gatot Subroto No. 100, Jakarta Selatan', productType: 'Velcro' },
  { id: 'SUP-007', company: 'CV Kain Premium', contact: 'Bambang Sutrisno', phone: '022-8901234', email: 'bambang@kainpremium.co.id', address: 'Jl. Textile No. 77, Majalaya', productType: 'Kain' },
  { id: 'SUP-008', company: 'PT Aksesoris Fashion', contact: 'Nita Wulandari', phone: '021-1234567', email: 'nita@aksesorisfashion.com', address: 'Jl. Tanah Abang No. 33, Jakarta Pusat', productType: 'Aksesoris' },
  { id: 'SUP-009', company: 'CV Packaging Indo', contact: 'Rudi Hermawan', phone: '031-5678901', email: 'rudi@packagingindo.com', address: 'Jl. Rungkut Industri No. 5, Surabaya', productType: 'Packaging' },
  { id: 'SUP-010', company: 'PT Thread Master', contact: 'Yuni Kartini', phone: '022-3456789', email: 'yuni@threadmaster.co.id', address: 'Jl. Soekarno Hatta No. 55, Bandung', productType: 'Benang' },
];

// ============ CUSTOMERS ============
export const customers: Customer[] = [
  { id: 'CUS-001', name: 'Budi Santoso', email: 'budi@gmail.com', phone: '081234567890', address: 'Jl. Merdeka No. 10, Jakarta', category: 'vip', points: 1500 },
  { id: 'CUS-002', name: 'Siti Rahayu', email: 'siti@gmail.com', phone: '082345678901', address: 'Jl. Sudirman No. 25, Bandung', category: 'reseller', points: 800 },
  { id: 'CUS-003', name: 'Andi Pratama', email: 'andi@gmail.com', phone: '083456789012', address: 'Jl. Gatot Subroto No. 5, Surabaya', category: 'umum', points: 200 },
  { id: 'CUS-004', name: 'Rina Kartika', email: 'rina@gmail.com', phone: '084567890123', address: 'Jl. Asia Afrika No. 15, Bandung', category: 'vip', points: 2200 },
  { id: 'CUS-005', name: 'Fajar Nugroho', email: 'fajar@gmail.com', phone: '085678901234', address: 'Jl. Diponegoro No. 30, Semarang', category: 'umum', points: 100 },
  { id: 'CUS-006', name: 'Diana Lestari', email: 'diana@gmail.com', phone: '086789012345', address: 'Jl. Pahlawan No. 8, Yogyakarta', category: 'reseller', points: 650 },
  { id: 'CUS-007', name: 'Reza Firmansyah', email: 'reza@gmail.com', phone: '087890123456', address: 'Jl. Ahmad Yani No. 42, Malang', category: 'umum', points: 50 },
  { id: 'CUS-008', name: 'Putri Handayani', email: 'putri@gmail.com', phone: '088901234567', address: 'Jl. Imam Bonjol No. 18, Jakarta', category: 'vip', points: 3100 },
  { id: 'CUS-009', name: 'Agus Setiawan', email: 'agus@gmail.com', phone: '089012345678', address: 'Jl. Veteran No. 7, Surabaya', category: 'umum', points: 300 },
  { id: 'CUS-010', name: 'Mega Wati', email: 'mega@gmail.com', phone: '081123456789', address: 'Jl. Cendana No. 12, Bali', category: 'reseller', points: 900 },
  { id: 'CUS-011', name: 'Tommy Wijaya', email: 'tommy@gmail.com', phone: '082234567890', address: 'Jl. Pemuda No. 20, Medan', category: 'umum', points: 150 },
  { id: 'CUS-012', name: 'Lusi Permata', email: 'lusi@gmail.com', phone: '083345678901', address: 'Jl. Hayam Wuruk No. 33, Jakarta', category: 'vip', points: 1800 },
  { id: 'CUS-013', name: 'Hadi Purnomo', email: 'hadi@gmail.com', phone: '084456789012', address: 'Jl. Gajah Mada No. 6, Semarang', category: 'umum', points: 75 },
  { id: 'CUS-014', name: 'Speed Tuner Garage', email: 'speedtuner@gmail.com', phone: '085567890123', address: 'Jl. Otomotif No. 99, Jakarta', category: 'reseller', points: 1200 },
  { id: 'CUS-015', name: 'Fitri Amalia', email: 'fitri@gmail.com', phone: '086678901234', address: 'Jl. Bunga No. 14, Makassar', category: 'umum', points: 180 },
];

// ============ TRANSACTIONS ============
export const transactions: Transaction[] = [
  { id: 'T001', invoice: 'INV/20231001/001', date: '2023-10-01 10:30', customerId: 'CUS-001', customerName: 'Budi Santoso', items: [{ productId: 'P001', productName: 'Essential Hoodie Black', qty: 1, price: 350000, subtotal: 350000 }, { productId: 'P009', productName: 'Basic Tee White', qty: 1, price: 120000, subtotal: 120000 }], total: 400000, status: 'completed', paymentMethod: 'transfer' },
  { id: 'T002', invoice: 'INV/20231002/002', date: '2023-10-02 14:15', customerId: 'CUS-014', customerName: 'Speed Tuner Garage', items: [{ productId: 'P006', productName: 'Bomber Jacket Navy', qty: 5, price: 550000, subtotal: 2750000 }], total: 2750000, status: 'completed', paymentMethod: 'transfer' },
  { id: 'T003', invoice: 'INV/20231003/003', date: '2023-10-03 09:45', customerId: 'CUS-003', customerName: 'Andi Pratama', items: [{ productId: 'P017', productName: 'Snapback Racing', qty: 1, price: 130000, subtotal: 130000 }], total: 120000, status: 'completed', paymentMethod: 'cash' },
  { id: 'T004', invoice: 'INV/20231004/004', date: '2023-10-04 16:20', customerId: 'CUS-004', customerName: 'Rina Kartika', items: [{ productId: 'P003', productName: 'Racing Stripe Tee', qty: 2, price: 150000, subtotal: 300000 }, { productId: 'P013', productName: 'Beanie Knit Black', qty: 1, price: 85000, subtotal: 85000 }], total: 350000, status: 'pending', paymentMethod: 'transfer' },
  { id: 'T005', invoice: 'INV/20231005/005', date: '2023-10-05 11:00', customerId: 'CUS-002', customerName: 'Siti Rahayu', items: [{ productId: 'P005', productName: 'Hoodie Oversized Grey', qty: 3, price: 380000, subtotal: 1140000 }], total: 1140000, status: 'completed', paymentMethod: 'transfer' },
  { id: 'T006', invoice: 'INV/20231006/006', date: '2023-10-06 13:30', customerId: 'CUS-005', customerName: 'Fajar Nugroho', items: [{ productId: 'P009', productName: 'Basic Tee White', qty: 2, price: 120000, subtotal: 240000 }], total: 240000, status: 'completed', paymentMethod: 'cash' },
  { id: 'T007', invoice: 'INV/20231007/007', date: '2023-10-07 10:00', customerId: 'CUS-006', customerName: 'Diana Lestari', items: [{ productId: 'P011', productName: 'Graphic Tee Motorsport', qty: 5, price: 132000, subtotal: 660000 }], total: 660000, status: 'completed', paymentMethod: 'transfer' },
  { id: 'T008', invoice: 'INV/20231008/008', date: '2023-10-08 15:45', customerId: 'CUS-007', customerName: 'Reza Firmansyah', items: [{ productId: 'P007', productName: 'Trucker Cap Red', qty: 1, price: 120000, subtotal: 120000 }], total: 120000, status: 'cancelled', paymentMethod: 'cash' },
  { id: 'T009', invoice: 'INV/20231009/009', date: '2023-10-09 09:15', customerId: 'CUS-008', customerName: 'Putri Handayani', items: [{ productId: 'P010', productName: 'Zip Hoodie Charcoal', qty: 1, price: 399000, subtotal: 399000 }, { productId: 'P014', productName: 'Tote Bag Canvas', qty: 2, price: 95000, subtotal: 190000 }], total: 589000, status: 'completed', paymentMethod: 'transfer' },
  { id: 'T010', invoice: 'INV/20231010/010', date: '2023-10-10 14:00', customerId: 'CUS-009', customerName: 'Agus Setiawan', items: [{ productId: 'P019', productName: 'Track Jacket Red', qty: 1, price: 365500, subtotal: 365500 }], total: 365500, status: 'completed', paymentMethod: 'cash' },
  { id: 'T011', invoice: 'INV/20231011/011', date: '2023-10-11 11:30', customerId: 'CUS-010', customerName: 'Mega Wati', items: [{ productId: 'P001', productName: 'Essential Hoodie Black', qty: 10, price: 350000, subtotal: 3500000 }], total: 3500000, status: 'completed', paymentMethod: 'transfer' },
  { id: 'T012', invoice: 'INV/20231012/012', date: '2023-10-12 16:00', customerId: 'CUS-011', customerName: 'Tommy Wijaya', items: [{ productId: 'P018', productName: 'Polo Shirt Classic', qty: 2, price: 195000, subtotal: 390000 }], total: 390000, status: 'pending', paymentMethod: 'transfer' },
  { id: 'T013', invoice: 'INV/20231013/013', date: '2023-10-13 10:45', customerId: 'CUS-012', customerName: 'Lusi Permata', items: [{ productId: 'P008', productName: 'Windbreaker Black', qty: 1, price: 405000, subtotal: 405000 }], total: 405000, status: 'completed', paymentMethod: 'transfer' },
  { id: 'T014', invoice: 'INV/20231014/014', date: '2023-10-14 12:15', customerId: 'CUS-013', customerName: 'Hadi Purnomo', items: [{ productId: 'P003', productName: 'Racing Stripe Tee', qty: 1, price: 150000, subtotal: 150000 }], total: 150000, status: 'completed', paymentMethod: 'cash' },
  { id: 'T015', invoice: 'INV/20231015/015', date: '2023-10-15 09:00', customerId: 'CUS-015', customerName: 'Fitri Amalia', items: [{ productId: 'P020', productName: 'Bucket Hat Camo', qty: 3, price: 110000, subtotal: 330000 }], total: 330000, status: 'completed', paymentMethod: 'cash' },
  { id: 'T016', invoice: 'INV/20231016/016', date: '2023-10-16 14:30', customerId: 'CUS-001', customerName: 'Budi Santoso', items: [{ productId: 'P016', productName: 'Puffer Vest Black', qty: 1, price: 480000, subtotal: 480000 }], total: 480000, status: 'completed', paymentMethod: 'transfer' },
  { id: 'T017', invoice: 'INV/20231017/017', date: '2023-10-17 11:00', customerId: 'CUS-002', customerName: 'Siti Rahayu', items: [{ productId: 'P004', productName: 'Paddock Custom Shirt', qty: 8, price: 157250, subtotal: 1258000 }], total: 1258000, status: 'completed', paymentMethod: 'transfer' },
  { id: 'T018', invoice: 'INV/20231018/018', date: '2023-10-18 15:00', customerId: 'CUS-004', customerName: 'Rina Kartika', items: [{ productId: 'P012', productName: 'Coach Jacket Olive', qty: 1, price: 420000, subtotal: 420000 }], total: 420000, status: 'pending', paymentMethod: 'transfer' },
  { id: 'T019', invoice: 'INV/20231019/019', date: '2023-10-19 10:00', customerId: 'CUS-006', customerName: 'Diana Lestari', items: [{ productId: 'P015', productName: 'Long Sleeve Henley', qty: 4, price: 175000, subtotal: 700000 }], total: 700000, status: 'completed', paymentMethod: 'transfer' },
  { id: 'T020', invoice: 'INV/20231020/020', date: '2023-10-20 13:00', customerId: 'CUS-009', customerName: 'Agus Setiawan', items: [{ productId: 'P002', productName: 'Velcrone Cargo Pants', qty: 1, price: 252000, subtotal: 252000 }], total: 252000, status: 'cancelled', paymentMethod: 'cash' },
  { id: 'T021', invoice: 'INV/20231021/021', date: '2023-10-21 09:30', customerId: 'CUS-003', customerName: 'Andi Pratama', items: [{ productId: 'P007', productName: 'Trucker Cap Red', qty: 2, price: 120000, subtotal: 240000 }], total: 240000, status: 'completed', paymentMethod: 'cash' },
  { id: 'T022', invoice: 'INV/20231022/022', date: '2023-10-22 14:45', customerId: 'CUS-010', customerName: 'Mega Wati', items: [{ productId: 'P005', productName: 'Hoodie Oversized Grey', qty: 5, price: 380000, subtotal: 1900000 }], total: 1900000, status: 'completed', paymentMethod: 'transfer' },
  { id: 'T023', invoice: 'INV/20231023/023', date: '2023-10-23 11:15', customerId: 'CUS-008', customerName: 'Putri Handayani', items: [{ productId: 'P009', productName: 'Basic Tee White', qty: 3, price: 120000, subtotal: 360000 }], total: 360000, status: 'completed', paymentMethod: 'cash' },
  { id: 'T024', invoice: 'INV/20231024/024', date: '2023-10-24 16:30', customerId: 'CUS-014', customerName: 'Speed Tuner Garage', items: [{ productId: 'P019', productName: 'Track Jacket Red', qty: 10, price: 365500, subtotal: 3655000 }], total: 3655000, status: 'completed', paymentMethod: 'transfer' },
  { id: 'T025', invoice: 'INV/20231025/025', date: '2023-10-25 10:30', customerId: 'CUS-005', customerName: 'Fajar Nugroho', items: [{ productId: 'P013', productName: 'Beanie Knit Black', qty: 1, price: 85000, subtotal: 85000 }], total: 85000, status: 'pending', paymentMethod: 'cash' },
  { id: 'T026', invoice: 'INV/20231026/026', date: '2023-10-26 12:00', customerId: 'CUS-012', customerName: 'Lusi Permata', items: [{ productId: 'P006', productName: 'Bomber Jacket Navy', qty: 2, price: 522500, subtotal: 1045000 }], total: 1045000, status: 'completed', paymentMethod: 'transfer' },
  { id: 'T027', invoice: 'INV/20231027/027', date: '2023-10-27 14:15', customerId: 'CUS-011', customerName: 'Tommy Wijaya', items: [{ productId: 'P003', productName: 'Racing Stripe Tee', qty: 1, price: 150000, subtotal: 150000 }], total: 150000, status: 'completed', paymentMethod: 'cash' },
  { id: 'T028', invoice: 'INV/20231028/028', date: '2023-10-28 09:00', customerId: 'CUS-007', customerName: 'Reza Firmansyah', items: [{ productId: 'P010', productName: 'Zip Hoodie Charcoal', qty: 1, price: 399000, subtotal: 399000 }], total: 399000, status: 'completed', paymentMethod: 'transfer' },
  { id: 'T029', invoice: 'INV/20231029/029', date: '2023-10-29 15:30', customerId: 'CUS-015', customerName: 'Fitri Amalia', items: [{ productId: 'P011', productName: 'Graphic Tee Motorsport', qty: 2, price: 132000, subtotal: 264000 }], total: 264000, status: 'cancelled', paymentMethod: 'cash' },
  { id: 'T030', invoice: 'INV/20231030/030', date: '2023-10-30 11:45', customerId: 'CUS-001', customerName: 'Budi Santoso', items: [{ productId: 'P001', productName: 'Essential Hoodie Black', qty: 2, price: 350000, subtotal: 700000 }, { productId: 'P017', productName: 'Snapback Racing', qty: 1, price: 130000, subtotal: 130000 }], total: 830000, status: 'completed', paymentMethod: 'transfer' },
];

// ============ HELPER FUNCTIONS ============
export const formatRupiah = (amount: number): string => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
};

export const getStatusColor = (status: TransactionStatus) => {
  switch (status) {
    case 'completed': return { bg: 'bg-velcrone-success-light', text: 'text-velcrone-success' };
    case 'pending': return { bg: 'bg-velcrone-warning-light', text: 'text-velcrone-warning' };
    case 'cancelled': return { bg: 'bg-destructive/10', text: 'text-destructive' };
  }
};

export const getMaterialStatusColor = (status: string) => {
  switch (status) {
    case 'normal': return { bg: 'bg-velcrone-success-light', text: 'text-velcrone-success' };
    case 'low': return { bg: 'bg-velcrone-warning-light', text: 'text-velcrone-warning' };
    case 'critical': return { bg: 'bg-destructive/10', text: 'text-destructive' };
    default: return { bg: 'bg-muted', text: 'text-muted-foreground' };
  }
};

// Chart data
export const dailyRevenueData = [
  { date: '01/10', revenue: 400000, orders: 1 },
  { date: '02/10', revenue: 2750000, orders: 1 },
  { date: '03/10', revenue: 120000, orders: 1 },
  { date: '04/10', revenue: 350000, orders: 1 },
  { date: '05/10', revenue: 1140000, orders: 1 },
  { date: '06/10', revenue: 240000, orders: 1 },
  { date: '07/10', revenue: 660000, orders: 1 },
  { date: '08/10', revenue: 0, orders: 0 },
  { date: '09/10', revenue: 589000, orders: 1 },
  { date: '10/10', revenue: 365500, orders: 1 },
  { date: '11/10', revenue: 3500000, orders: 1 },
  { date: '12/10', revenue: 390000, orders: 1 },
  { date: '13/10', revenue: 405000, orders: 1 },
  { date: '14/10', revenue: 150000, orders: 1 },
  { date: '15/10', revenue: 330000, orders: 1 },
];

export const monthlyRevenueData = [
  { month: 'Jan', revenue: 4500000 },
  { month: 'Feb', revenue: 5200000 },
  { month: 'Mar', revenue: 6100000 },
  { month: 'Apr', revenue: 4800000 },
  { month: 'May', revenue: 7300000 },
  { month: 'Jun', revenue: 8100000 },
  { month: 'Jul', revenue: 6900000 },
  { month: 'Aug', revenue: 7800000 },
  { month: 'Sep', revenue: 9200000 },
  { month: 'Oct', revenue: 22700000 },
];
