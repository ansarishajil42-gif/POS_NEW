// Mock data for cloudynationpos mobile app

export const tenants = [
  { id: 't1', name: 'FreshMart Supermarkets', status: 'active', outlets: 12, tills: 48, plan: 'Enterprise', mrr: 2400, country: 'UAE' },
  { id: 't2', name: 'GreenGrocer Chain', status: 'active', outlets: 7, tills: 22, plan: 'Growth', mrr: 1050, country: 'KSA' },
  { id: 't3', name: 'AlMadina Stores', status: 'suspended', outlets: 4, tills: 14, plan: 'Starter', mrr: 280, country: 'UAE' },
  { id: 't4', name: 'Sunrise Grocers', status: 'active', outlets: 9, tills: 31, plan: 'Growth', mrr: 1350, country: 'Qatar' },
  { id: 't5', name: 'DailyFresh Co.', status: 'trial', outlets: 2, tills: 6, plan: 'Starter', mrr: 0, country: 'Bahrain' },
  { id: 't6', name: 'Oasis Hypermarket', status: 'active', outlets: 15, tills: 60, plan: 'Enterprise', mrr: 3000, country: 'UAE' },
];

export const networkSales = [
  { day: 'Mon', sales: 142000, tills: 180 },
  { day: 'Tue', sales: 138000, tills: 178 },
  { day: 'Wed', sales: 151000, tills: 182 },
  { day: 'Thu', sales: 168000, tills: 185 },
  { day: 'Fri', sales: 192000, tills: 191 },
  { day: 'Sat', sales: 210000, tills: 195 },
  { day: 'Sun', sales: 175000, tills: 188 },
];

export const apiTraffic = [
  { t: '00', req: 120 }, { t: '04', req: 80 }, { t: '08', req: 540 },
  { t: '12', req: 890 }, { t: '16', req: 1120 }, { t: '20', req: 760 },
];

export const systemLogs = [
  { id: 'l1', level: 'info', msg: 'Tenant sync completed — FreshMart', time: '2 min ago' },
  { id: 'l2', level: 'warn', msg: 'High API latency on Careem gateway', time: '14 min ago' },
  { id: 'l3', level: 'info', msg: 'Backup snapshot stored', time: '1 hr ago' },
  { id: 'l4', level: 'error', msg: 'AlMadina payment gateway timeout', time: '2 hr ago' },
  { id: 'l5', level: 'info', msg: 'New tenant onboarded — DailyFresh Co.', time: '3 hr ago' },
];

export const branches = [
  { id: 'b1', name: 'Downtown Branch', salesToday: 18400, stockAlerts: 6, tills: 4, staff: 12 },
  { id: 'b2', name: 'Marina Outlet', salesToday: 12750, stockAlerts: 3, tills: 3, staff: 9 },
  { id: 'b3', name: 'Jumeirah Store', salesToday: 22100, stockAlerts: 8, tills: 5, staff: 15 },
  { id: 'b4', name: 'Business Bay', salesToday: 9800, stockAlerts: 2, tills: 2, staff: 7 },
];

export const products = [
  { id: 'p1', name: 'Arabica Coffee Beans 500g', sku: 'CFE-001', barcode: '6291234500011', price: 42.0, unit: 'pcs', stock: 120, category: 'Beverages' },
  { id: 'p2', name: 'Organic Dates 1kg', sku: 'DRY-220', barcode: '6291234500028', price: 35.5, unit: 'kg', stock: 64, category: 'Dry Goods' },
  { id: 'p3', name: 'Fresh Milk 2L', sku: 'DRY-105', barcode: '6291234500035', price: 14.0, unit: 'pcs', stock: 8, category: 'Dairy' },
  { id: 'p4', name: 'Basmati Rice 5kg', sku: 'GRC-410', barcode: '6291234500042', price: 48.0, unit: 'pcs', stock: 210, category: 'Grains' },
  { id: 'p5', name: 'Chicken Breast 1kg', sku: 'MT-088', barcode: '6291234500059', price: 28.5, unit: 'kg', stock: 45, category: 'Meat' },
  { id: 'p6', name: 'Tomatoes 1kg', sku: 'VG-031', barcode: '6291234500066', price: 6.5, unit: 'kg', stock: 3, category: 'Produce' },
  { id: 'p7', name: 'Olive Oil 750ml', sku: 'OIL-014', barcode: '6291234500073', price: 39.0, unit: 'pcs', stock: 88, category: 'Pantry' },
  { id: 'p8', name: 'Greek Yogurt 500g', sku: 'DRY-210', barcode: '6291234500080', price: 12.5, unit: 'pcs', stock: 22, category: 'Dairy' },
];

export const batches = [
  { id: 'bt1', product: 'Fresh Milk 2L', batch: 'MILK-2412A', qty: 40, expiry: '2026-08-22', status: 'near' },
  { id: 'bt2', product: 'Greek Yogurt 500g', batch: 'YGT-2411', qty: 22, expiry: '2026-08-19', status: 'urgent' },
  { id: 'bt3', product: 'Organic Dates 1kg', batch: 'DT-2410', qty: 64, expiry: '2027-03-15', status: 'fresh' },
  { id: 'bt4', product: 'Chicken Breast 1kg', batch: 'CHK-2412', qty: 45, expiry: '2026-08-18', status: 'urgent' },
  { id: 'bt5', product: 'Tomatoes 1kg', batch: 'TMT-2412', qty: 3, expiry: '2026-08-20', status: 'near' },
  { id: 'bt6', product: 'Olive Oil 750ml', batch: 'OIL-2410', qty: 88, expiry: '2027-06-01', status: 'fresh' },
];

export const purchaseOrders = [
  { id: 'po1', number: 'PO-2088', vendor: 'Gulf Foods LLC', date: '2026-08-15', total: 12400, status: 'open' },
  { id: 'po2', number: 'PO-2089', vendor: 'FreshPro Supply', date: '2026-08-16', total: 8200, status: 'sent' },
  { id: 'po3', number: 'PO-2090', vendor: 'Daily Dairy Co.', date: '2026-08-16', total: 5600, status: 'sent' },
  { id: 'po4', number: 'PO-2091', vendor: 'Gulf Foods LLC', date: '2026-08-17', total: 18900, status: 'draft' },
];

export const grns = [
  { id: 'grn1', number: 'GRN-3401', po: 'PO-2086', vendor: 'Gulf Foods LLC', date: '2026-08-14', variance: 0, status: 'received' },
  { id: 'grn2', number: 'GRN-3402', po: 'PO-2087', vendor: 'FreshPro Supply', date: '2026-08-15', variance: 2, status: 'received' },
  { id: 'grn3', number: 'GRN-3403', po: 'PO-2088', vendor: 'Gulf Foods LLC', date: '2026-08-16', variance: 0, status: 'pending' },
  { id: 'grn4', number: 'GRN-3404', po: 'PO-2089', vendor: 'Daily Dairy Co.', date: '2026-08-17', variance: 5, status: 'pending' },
];

export const vendors = [
  { id: 'v1', name: 'Gulf Foods LLC', category: 'Grocery', payable: 24800, status: 'active', orders: 14 },
  { id: 'v2', name: 'FreshPro Supply', category: 'Produce', payable: 8200, status: 'active', orders: 9 },
  { id: 'v3', name: 'Daily Dairy Co.', category: 'Dairy', payable: 5600, status: 'active', orders: 6 },
  { id: 'v4', name: 'Arabia Beverages', category: 'Beverages', payable: 0, status: 'active', orders: 11 },
  { id: 'v5', name: 'Sunrise Meats', category: 'Meat', payable: 13200, status: 'suspended', orders: 4 },
];

export const staff = [
  { id: 's1', name: 'Ahmed Khalil', role: 'Cashier', shift: 'open', till: 'Till 02', permissions: 'Cashier' },
  { id: 's2', name: 'Sara Mohammed', role: 'Supervisor', shift: 'open', till: 'Till 01', permissions: 'Supervisor' },
  { id: 's3', name: 'Omar Farouk', role: 'Cashier', shift: 'closed', till: '—', permissions: 'Cashier' },
  { id: 's4', name: 'Layla Hassan', role: 'Stock Clerk', shift: 'open', till: '—', permissions: 'Inventory' },
  { id: 's5', name: 'Yusuf Rahman', role: 'Cashier', shift: 'open', till: 'Till 03', permissions: 'Cashier' },
];

export const transfers = [
  { id: 'tr1', from: 'Downtown', to: 'Marina', item: 'Basmati Rice 5kg', qty: 20, status: 'in-transit', date: '2026-08-16' },
  { id: 'tr2', from: 'Jumeirah', to: 'Downtown', item: 'Olive Oil 750ml', qty: 15, status: 'pending', date: '2026-08-17' },
  { id: 'tr3', from: 'Downtown', to: 'Business Bay', item: 'Fresh Milk 2L', qty: 30, status: 'approved', date: '2026-08-17' },
  { id: 'tr4', from: 'Marina', to: 'Jumeirah', item: 'Arabica Coffee 500g', qty: 12, status: 'completed', date: '2026-08-14' },
];

export const reports = [
  { id: 'r1', number: 'Z-2401', date: '2026-08-17', sales: 18400, cash: 9200, card: 7800, other: 1400, type: 'Z' },
  { id: 'r2', number: 'X-2401', date: '2026-08-17', sales: 14200, cash: 6800, card: 6200, other: 1200, type: 'X' },
  { id: 'r3', number: 'Z-2400', date: '2026-08-16', sales: 17200, cash: 8100, card: 7600, other: 1500, type: 'Z' },
  { id: 'r4', number: 'Z-2399', date: '2026-08-15', sales: 16100, cash: 7900, card: 6900, other: 1300, type: 'Z' },
];

export const transactions = [
  { id: 'tx1', receipt: 'RCP-50421', time: '14:32', total: 86.5, method: 'Card', items: 6 },
  { id: 'tx2', receipt: 'RCP-50420', time: '14:18', total: 42.0, method: 'Cash', items: 2 },
  { id: 'tx3', receipt: 'RCP-50419', time: '13:55', total: 124.0, method: 'Card', items: 9 },
  { id: 'tx4', receipt: 'RCP-50418', time: '13:40', total: 18.5, method: 'Cash', items: 3 },
  { id: 'tx5', receipt: 'RCP-50417', time: '13:22', total: 67.0, method: 'Loyalty', items: 4 },
  { id: 'tx6', receipt: 'RCP-50416', time: '13:05', total: 210.0, method: 'Split', items: 14 },
];

export const customers = [
  { id: 'c1', name: 'Fatima Al Zahra', points: 1240, tier: 'Gold', visits: 48, spent: 4200 },
  { id: 'c2', name: 'Khalid Ahmed', points: 620, tier: 'Silver', visits: 22, spent: 1850 },
  { id: 'c3', name: 'Noura Saeed', points: 2800, tier: 'Platinum', visits: 96, spent: 9100 },
  { id: 'c4', name: 'Mansour Ali', points: 140, tier: 'Bronze', visits: 8, spent: 540 },
];

export const aggregatorOrders = [
  { id: 'o1', channel: 'Talabat', number: 'TB-88412', items: 3, total: 64.0, status: 'new', customer: 'A. Rahman' },
  { id: 'o2', channel: 'Talabat', number: 'TB-88411', items: 5, total: 92.5, status: 'preparing', customer: 'S. Karim' },
  { id: 'o3', channel: 'Careem', number: 'CR-22041', items: 2, total: 38.0, status: 'new', customer: 'L. Haddad' },
  { id: 'o4', channel: 'InstaShop', number: 'IS-55102', items: 8, total: 142.0, status: 'packed', customer: 'M. Faisal' },
  { id: 'o5', channel: 'Deliveroo', number: 'DR-30921', items: 4, total: 76.5, status: 'preparing', customer: 'N. Bilal' },
];

export const vendorOrders = [
  { id: 'vo1', number: 'PO-2088', from: 'FreshMart Supermarkets', date: '2026-08-15', total: 12400, status: 'new' },
  { id: 'vo2', number: 'PO-2086', from: 'FreshMart Supermarkets', date: '2026-08-12', total: 9800, status: 'acknowledged' },
  { id: 'vo3', number: 'PO-2084', from: 'GreenGrocer Chain', date: '2026-08-09', total: 6400, status: 'fulfilled' },
];

export const vendorInvoices = [
  { id: 'vi1', number: 'INV-1024', to: 'FreshMart Supermarkets', date: '2026-08-13', total: 9800, status: 'paid' },
  { id: 'vi2', number: 'INV-1023', to: 'GreenGrocer Chain', date: '2026-08-10', total: 6400, status: 'pending' },
  { id: 'vi3', number: 'INV-1022', to: 'FreshMart Supermarkets', date: '2026-08-05', total: 11200, status: 'overdue' },
];

export const tillQuickProducts = [
  { id: 'p1', name: 'Arabica Coffee', price: 42.0, emoji: '☕' },
  { id: 'p2', name: 'Organic Dates', price: 35.5, emoji: '🌴' },
  { id: 'p3', name: 'Fresh Milk', price: 14.0, emoji: '🥛' },
  { id: 'p4', name: 'Basmati Rice', price: 48.0, emoji: '🍚' },
  { id: 'p5', name: 'Chicken Breast', price: 28.5, emoji: '🍗' },
  { id: 'p6', name: 'Tomatoes', price: 6.5, emoji: '🍅' },
  { id: 'p7', name: 'Olive Oil', price: 39.0, emoji: '🫒' },
  { id: 'p8', name: 'Greek Yogurt', price: 12.5, emoji: '🥣' },
  { id: 'p9', name: 'Bananas 1kg', price: 5.0, emoji: '🍌' },
  { id: 'p10', name: 'Eggs 12pk', price: 11.0, emoji: '🥚' },
  { id: 'p11', name: 'Water 1.5L', price: 3.0, emoji: '💧' },
  { id: 'p12', name: 'Bread Loaf', price: 7.5, emoji: '🍞' },
];

export const branchSalesWeek = [
  { day: 'Mon', sales: 14200 },
  { day: 'Tue', sales: 13800 },
  { day: 'Wed', sales: 15100 },
  { day: 'Thu', sales: 16800 },
  { day: 'Fri', sales: 19200 },
  { day: 'Sat', sales: 22100 },
  { day: 'Sun', sales: 18400 },
];

export const customerHistory = [
  { id: 'h1', date: '2026-08-10', total: 142.0, items: 8 },
  { id: 'h2', date: '2026-08-03', total: 86.5, items: 5 },
  { id: 'h3', date: '2026-07-28', total: 210.0, items: 14 },
  { id: 'h4', date: '2026-07-19', total: 64.0, items: 3 },
];
