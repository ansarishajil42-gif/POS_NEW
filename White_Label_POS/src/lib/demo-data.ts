export type Tenant = {
    id: string;
    name: string;
    plan: "Starter" | "Growth" | "Enterprise";
    status: "Active" | "Suspended" | "Trial";
    outlets: number;
    tills: number;
    monthlyOrders: number;
    trn: string;
};

export const initialTenants: Tenant[] = [
    { id: "t-001", name: "Al Barsha Hypermarket Group", plan: "Enterprise", status: "Active", outlets: 14, tills: 128, monthlyOrders: 412000, trn: "100234567800003" },
    { id: "t-002", name: "Deira Fresh Markets", plan: "Growth", status: "Active", outlets: 6, tills: 34, monthlyOrders: 96500, trn: "100987654300003" },
    { id: "t-003", name: "Corniche Retail LLC", plan: "Growth", status: "Trial", outlets: 3, tills: 12, monthlyOrders: 21400, trn: "100554433220003" },
    { id: "t-004", name: "Sharjah Value Stores", plan: "Starter", status: "Suspended", outlets: 2, tills: 5, monthlyOrders: 4200, trn: "100112233440003" },
    { id: "t-005", name: "Gulf Grocers Union", plan: "Enterprise", status: "Active", outlets: 22, tills: 190, monthlyOrders: 688000, trn: "100776655440003" },
];

export const platformSeries = [
    { t: "00:00", sales: 42, tills: 96, api: 310 },
    { t: "04:00", sales: 28, tills: 72, api: 190 },
    { t: "08:00", sales: 118, tills: 214, api: 720 },
    { t: "12:00", sales: 186, tills: 268, api: 980 },
    { t: "16:00", sales: 164, tills: 251, api: 890 },
    { t: "20:00", sales: 232, tills: 288, api: 1180 },
    { t: "23:00", sales: 142, tills: 176, api: 640 },
];

export type Outlet = {
    id: string;
    name: string;
    emirate: string;
    sales: number;
    growth: number;
    tills: number;
    stockHealth: number;
};

export const outlets: Outlet[] = [
    { id: "o1", name: "Al Barsha Hypermarket", emirate: "Dubai", sales: 92430, growth: 12.4, tills: 18, stockHealth: 96 },
    { id: "o2", name: "Deira Fresh Market", emirate: "Dubai", sales: 64120, growth: 4.8, tills: 9, stockHealth: 91 },
    { id: "o3", name: "Corniche Superstore", emirate: "Abu Dhabi", sales: 51880, growth: -2.1, tills: 7, stockHealth: 84 },
    { id: "o4", name: "Al Nahda Express", emirate: "Sharjah", sales: 33240, growth: 8.9, tills: 5, stockHealth: 88 },
];

export const branchTrend = [
    { d: "Mon", "Al Barsha": 78, Deira: 55, Corniche: 43 },
    { d: "Tue", "Al Barsha": 84, Deira: 58, Corniche: 46 },
    { d: "Wed", "Al Barsha": 72, Deira: 61, Corniche: 40 },
    { d: "Thu", "Al Barsha": 96, Deira: 69, Corniche: 52 },
    { d: "Fri", "Al Barsha": 128, Deira: 88, Corniche: 71 },
    { d: "Sat", "Al Barsha": 134, Deira: 92, Corniche: 74 },
    { d: "Sun", "Al Barsha": 101, Deira: 70, Corniche: 55 },
];

export type Product = {
    sku: string;
    name: string;
    barcode: string;
    unit: string;
    category: string;
    cost: number;
    price: number;
    vat: "5%" | "0%";
    stock: number;
};

export const products: Product[] = [
    { sku: "SKU-10241", name: "Bananas (Loose)", barcode: "6291001·2", unit: "kg → g", category: "Fresh Produce", cost: 3.2, price: 5.75, vat: "5%", stock: 412 },
    { sku: "SKU-10388", name: "Al Ain Laban 1L", barcode: "6291102·1", unit: "pcs / 12-pack", category: "Dairy", cost: 3.9, price: 5.5, vat: "5%", stock: 268 },
    { sku: "SKU-10455", name: "Arabic Bread Large", barcode: "6291320·4", unit: "pack", category: "Bakery", cost: 1.5, price: 3.0, vat: "0%", stock: 96 },
    { sku: "SKU-10501", name: "Fresh Chicken Whole", barcode: "6291455·9", unit: "kg → g", category: "Butchery", cost: 12.4, price: 18.9, vat: "5%", stock: 74 },
    { sku: "SKU-10620", name: "Basmati Rice 5kg", barcode: "6291777·3", unit: "bag", category: "Grocery", cost: 26.0, price: 38.5, vat: "5%", stock: 152 },
    { sku: "SKU-10733", name: "Medjool Dates 500g", barcode: "6291888·6", unit: "box", category: "Grocery", cost: 18.0, price: 29.0, vat: "5%", stock: 61 },
];

export type Batch = {
    id: string;
    product: string;
    batch: string;
    qty: number;
    expiry: string;
    daysLeft: number;
    outlet: string;
    rule: "FEFO" | "FIFO";
};

export const batches: Batch[] = [
    { id: "b1", product: "Al Ain Laban 1L", batch: "LB-2291", qty: 84, expiry: "2026-08-14", daysLeft: 3, outlet: "Al Barsha", rule: "FEFO" },
    { id: "b2", product: "Fresh Chicken Whole", batch: "CH-8842", qty: 22, expiry: "2026-08-13", daysLeft: 2, outlet: "Deira", rule: "FEFO" },
    { id: "b3", product: "Arabic Bread Large", batch: "BR-1120", qty: 40, expiry: "2026-08-18", daysLeft: 7, outlet: "Corniche", rule: "FIFO" },
    { id: "b4", product: "Medjool Dates 500g", batch: "DT-6610", qty: 120, expiry: "2026-10-02", daysLeft: 52, outlet: "Al Barsha", rule: "FIFO" },
    { id: "b5", product: "Basmati Rice 5kg", batch: "RC-3390", qty: 240, expiry: "2027-01-20", daysLeft: 162, outlet: "Al Nahda", rule: "FIFO" },
];

export type Purchase = {
    id: string;
    vendor: string;
    value: number;
    stage: "PO" | "GRN" | "Invoice";
    variance?: string;
};

export const purchases: Purchase[] = [
    { id: "PO-4821", vendor: "Emirates Fresh Supply", value: 84200, stage: "PO" },
    { id: "PO-4830", vendor: "Gulf Dairy Distribution", value: 32100, stage: "PO" },
    { id: "GRN-2210", vendor: "Al Marai Trading", value: 51400, stage: "GRN", variance: "3 units short" },
    { id: "GRN-2214", vendor: "Nakheel Produce", value: 18900, stage: "GRN" },
    { id: "INV-9902", vendor: "Emirates Fresh Supply", value: 76500, stage: "Invoice" },
    { id: "INV-9910", vendor: "Gulf Dairy Distribution", value: 29400, stage: "Invoice", variance: "Price variance AED 620" },
];

export const roles = [
    { role: "Store Manager", users: 14, perms: ["Full outlet access", "Price overrides", "Void receipts", "Shift approvals"] },
    { role: "Inventory Manager", users: 9, perms: ["Stock adjustments", "Batch & expiry", "Transfers", "Clearance pricing"] },
    { role: "Purchasing Officer", users: 6, perms: ["Create POs", "Record GRNs", "Vendor invoices", "AP monitoring"] },
    { role: "Cashier", users: 212, perms: ["Checkout", "Shift float", "Loyalty redemption"] },
];

export type Customer = {
    id: string;
    name: string;
    phone: string;
    tier: "Bronze" | "Silver" | "Gold" | "Platinum";
    points: number;
    visits: number;
    spend: number;
};

export const customers: Customer[] = [
    { id: "c1", name: "Fatima Al Marzooqi", phone: "+971 50 •• 4412", tier: "Platinum", points: 12840, visits: 96, spend: 41200 },
    { id: "c2", name: "Rahul Menon", phone: "+971 55 •• 8821", tier: "Gold", points: 6420, visits: 61, spend: 18900 },
    { id: "c3", name: "Sara Haddad", phone: "+971 52 •• 3390", tier: "Silver", points: 2180, visits: 34, spend: 7400 },
    { id: "c4", name: "James Okoro", phone: "+971 56 •• 1102", tier: "Bronze", points: 640, visits: 12, spend: 2100 },
];

export type TillProduct = { id: string; name: string; price: number; unit: string; vat: number; image: string };

export const tillProducts: TillProduct[] = [
    { id: "p1", name: "Bananas", price: 5.75, unit: "kg", vat: 0.05, image: "https://images.unsplash.com/photo-1528825871115-3581a5387919?w=100&q=80" },
    { id: "p2", name: "Laban 1L", price: 5.5, unit: "pcs", vat: 0.05, image: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=100&q=80" },
    { id: "p3", name: "Arabic Bread", price: 3.0, unit: "pack", vat: 0, image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=100&q=80" },
    { id: "p4", name: "Chicken Whole", price: 18.9, unit: "kg", vat: 0.05, image: "https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=100&q=80" },
    { id: "p5", name: "Basmati 5kg", price: 38.5, unit: "bag", vat: 0.05, image: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=100&q=80" },
    { id: "p6", name: "Medjool Dates", price: 29.0, unit: "box", vat: 0.05, image: "https://images.unsplash.com/photo-1596484552834-6a58f850e0a1?w=100&q=80" },
    { id: "p7", name: "Tomatoes", price: 6.25, unit: "kg", vat: 0.05, image: "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=100&q=80" },
    { id: "p8", name: "Mineral Water 24x", price: 12.0, unit: "pack", vat: 0.05, image: "https://images.unsplash.com/photo-1523362628745-0c100150b504?w=100&q=80" },
    { id: "p9", name: "Eggs 30s", price: 16.75, unit: "tray", vat: 0.05, image: "https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=100&q=80" },
    { id: "p10", name: "Olive Oil 1L", price: 34.0, unit: "btl", vat: 0.05, image: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=100&q=80" },
    { id: "p11", name: "Cheese Slices", price: 11.5, unit: "pack", vat: 0.05, image: "https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=100&q=80" },
    { id: "p12", name: "Detergent 3kg", price: 27.9, unit: "box", vat: 0.05, image: "https://images.unsplash.com/photo-1585421514284-efb74c2b69ba?w=100&q=80" },
];

export const aggregators = ["Talabat", "Careem", "InstaShop", "Deliveroo"] as const;
export type Aggregator = (typeof aggregators)[number];

export type AggOrder = {
    id: string;
    channel: Aggregator;
    customer: string;
    items: number;
    total: number;
    branch: string;
    minutesAgo: number;
    status: "New" | "Picking" | "Ready" | "Dispatched";
};

export const aggOrders: AggOrder[] = [
    { id: "TLB-88421", channel: "Talabat", customer: "A. Rahman", items: 12, total: 214.5, branch: "Al Barsha", minutesAgo: 1, status: "New" },
    { id: "TLB-88418", channel: "Talabat", customer: "M. Yusuf", items: 5, total: 88.0, branch: "Deira", minutesAgo: 6, status: "Picking" },
    { id: "CRM-40122", channel: "Careem", customer: "L. Fernandes", items: 8, total: 132.75, branch: "Al Barsha", minutesAgo: 3, status: "New" },
    { id: "CRM-40119", channel: "Careem", customer: "S. Ali", items: 3, total: 44.2, branch: "Corniche", minutesAgo: 11, status: "Ready" },
    { id: "INS-71204", channel: "InstaShop", customer: "N. Khoury", items: 21, total: 486.9, branch: "Al Barsha", minutesAgo: 2, status: "Picking" },
    { id: "INS-71199", channel: "InstaShop", customer: "P. Sharma", items: 6, total: 96.4, branch: "Al Nahda", minutesAgo: 14, status: "Dispatched" },
    { id: "DLV-55031", channel: "Deliveroo", customer: "H. Saeed", items: 4, total: 61.0, branch: "Deira", minutesAgo: 4, status: "New" },
    { id: "DLV-55028", channel: "Deliveroo", customer: "K. Thomas", items: 9, total: 174.3, branch: "Corniche", minutesAgo: 9, status: "Ready" },
];

export type Promotion = {
    id: string;
    name: string;
    type: "Discount" | "BOGO" | "Bundle";
    target: string;
    value: string;
    status: "Active" | "Scheduled" | "Expired";
    startDate: string;
    endDate: string;
};

export const promotions: Promotion[] = [
    { id: "PRM-101", name: "Weekend Produce Sale", type: "Discount", target: "Fresh Produce Category", value: "15% off", status: "Active", startDate: "2026-08-10", endDate: "2026-08-15" },
    { id: "PRM-102", name: "Buy 1 Get 1 Laban", type: "BOGO", target: "SKU-10388 (Laban 1L)", value: "Free Item", status: "Active", startDate: "2026-08-01", endDate: "2026-08-31" },
    { id: "PRM-103", name: "Back to School Lunch Bundle", type: "Bundle", target: "Bread, Cheese, Juice", value: "AED 15 Flat", status: "Scheduled", startDate: "2026-08-25", endDate: "2026-09-10" },
    { id: "PRM-104", name: "Clearance: Dates", type: "Discount", target: "SKU-10733", value: "25% off", status: "Active", startDate: "2026-08-12", endDate: "2026-08-19" },
];

export const aed = (n: number) =>
    `AED ${n.toLocaleString("en-AE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const aedShort = (n: number) => `AED ${n.toLocaleString("en-AE")}`;
