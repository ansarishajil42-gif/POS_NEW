import { pgTable, text, timestamp, pgEnum, uuid, decimal, integer, boolean, unique, index, json } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const roleEnum = pgEnum("role", [
  "super_admin",
  "head_office_admin",
  "branch_manager",
  "inventory_manager",
  "purchasing_officer",
  "cashier",
  "vendor",
]);

// 1. tenants
export const tenants = pgTable("tenants", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  subdomain: text("subdomain").notNull().unique(),
  plan: text("plan").notNull().default("Starter"),
  status: text("status").notNull().default("Active"),
  outletLimit: integer("outlet_limit").notNull().default(5),
  tillLimit: integer("till_limit").notNull().default(10),
  monthlyOrderLimit: integer("monthly_order_limit").notNull().default(10000),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 1.1 tenant_settings
export const tenantSettings = pgTable("tenant_settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  vatRate: decimal("vat_rate", { precision: 5, scale: 2 }).notNull().default("5.00"),
  vatInclusive: boolean("vat_inclusive").notNull().default(true),
  loyaltyRedemptionRate: decimal("loyalty_redemption_rate", { precision: 5, scale: 2 }).notNull().default("0.01"), // e.g. 1 point = 0.01 currency
  loyaltyPointsPerAed: integer("loyalty_points_per_aed").notNull().default(10),
  loyaltyMinPointsToRedeem: integer("loyalty_min_points_to_redeem").notNull().default(5000),
  currency: text("currency").notNull().default("AED"),
  taxRegistrationNumber: text("trn"),
  allowInventoryManagerPoDraft: boolean("allow_inventory_manager_po_draft").notNull().default(true),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// 2. branches
export const branches = pgTable("branches", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  address: text("address"),
  tillCount: integer("till_count").default(1),
  status: text("status").notNull().default("Active"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 3. staff_users
export const staffUsers = pgTable("staff_users", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").references(() => tenants.id, { onDelete: "cascade" }),
  branchId: uuid("branch_id").references(() => branches.id, { onDelete: "set null" }),
  name: text("name"),
  phone: text("phone"),
  address: text("address"),
  email: text("email").unique(),
  passwordHash: text("password_hash"),
  pinHash: text("pin_hash"),
  role: roleEnum("role").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 4. products
export const products = pgTable("products", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  barcode: text("barcode"),
  category: text("category").notNull(),
  unit: text("unit").notNull(),
  costPrice: decimal("cost_price", { precision: 10, scale: 2 }).notNull(),
  salePrice: decimal("sale_price", { precision: 10, scale: 2 }).notNull(),
  isBatchTracked: boolean("is_batch_tracked").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const productBarcodes = pgTable("product_barcodes", {
  id: uuid("id").primaryKey().defaultRandom(),
  productId: uuid("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  barcode: text("barcode").notNull(),
});

export const productVariants = pgTable("product_variants", {
  id: uuid("id").primaryKey().defaultRandom(),
  productId: uuid("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  variantName: text("variant_name").notNull(),
  variantValue: text("variant_value").notNull(),
  sku: text("sku"),
  priceAdjustment: decimal("price_adjustment", { precision: 10, scale: 2 }).default("0.00").notNull(),
});

export const unitConversions = pgTable("unit_conversions", {
  id: uuid("id").primaryKey().defaultRandom(),
  productId: uuid("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  fromUnit: text("from_unit").notNull(),
  toUnit: text("to_unit").notNull(),
  conversionFactor: decimal("conversion_factor", { precision: 10, scale: 4 }).notNull(),
});

// 5. stock_levels
export const stockLevels = pgTable("stock_levels", {
  id: uuid("id").primaryKey().defaultRandom(),
  productId: uuid("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  branchId: uuid("branch_id").notNull().references(() => branches.id, { onDelete: "cascade" }),
  stock: integer("stock").notNull().default(0),
  reorderLevel: integer("reorder_level").notNull().default(10),
  priceOverride: decimal("price_override", { precision: 10, scale: 2 }), // Branch-specific pricing
});

// 5.1 promotions
export const promotions = pgTable("promotions", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  discountType: text("discount_type").notNull(), // percentage, fixed
  discountValue: decimal("discount_value", { precision: 10, scale: 2 }).notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  status: text("status").notNull().default("Active"), // Active, Inactive
  createdAt: timestamp("created_at").defaultNow().notNull(),
  type: text("type"),
  target: text("target"),
  value: text("value"),
  targetCategory: text("target_category"),
  targetProductIds: text("target_product_ids"),
  bundleProducts: text("bundle_products"),
  pricingBasis: text("pricing_basis"),
  minQty: integer("min_qty"),
  maxQty: integer("max_qty"),
  startTime: text("start_time"),
  endTime: text("end_time"),
});

// 6. batches
export const batches = pgTable("batches", {
  id: uuid("id").primaryKey().defaultRandom(),
  productId: uuid("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  branchId: uuid("branch_id").references(() => branches.id, { onDelete: "cascade" }),
  batchNumber: text("batch_number").notNull(),
  expiryDate: timestamp("expiry_date").notNull(),
  stock: integer("stock").notNull().default(0),
});

// 7. vendors
export const vendors = pgTable("vendors", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  email: text("email").unique(),
  passwordHash: text("password_hash"),
  contact: text("contact"),
  trn: text("trn"),
});

// 8. purchase_orders
export const purchaseOrders = pgTable("purchase_orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  branchId: uuid("branch_id").references(() => branches.id),
  vendorId: uuid("vendor_id").notNull().references(() => vendors.id),
  status: text("status").notNull().default("Draft"), // Draft, Ordered, GRN, Invoiced
  total: decimal("total", { precision: 12, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 9. purchase_order_items
export const purchaseOrderItems = pgTable("purchase_order_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  purchaseOrderId: uuid("purchase_order_id").notNull().references(() => purchaseOrders.id, { onDelete: "cascade" }),
  productId: uuid("product_id").notNull().references(() => products.id),
  qty: integer("qty").notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
});

// 10. grn (Goods Received Notes)
export const grn = pgTable("grn", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  branchId: uuid("branch_id").notNull().references(() => branches.id, { onDelete: "cascade" }),
  purchaseOrderId: uuid("purchase_order_id").references(() => purchaseOrders.id),
  vendorId: uuid("vendor_id").notNull().references(() => vendors.id),
  grnNumber: text("grn_number").notNull(),
  status: text("status").notNull().default("received"), // received, variance
  vendorConfirmed: boolean("vendor_confirmed").notNull().default(false),
  vendorConfirmedAt: timestamp("vendor_confirmed_at"),
  vendorNotes: text("vendor_notes"),
  receivedAt: timestamp("received_at").defaultNow().notNull(),
});

// 11. grn_items
export const grnItems = pgTable("grn_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  grnId: uuid("grn_id").notNull().references(() => grn.id, { onDelete: "cascade" }),
  productId: uuid("product_id").notNull().references(() => products.id),
  orderedQty: integer("ordered_qty").notNull(),
  receivedQty: integer("received_qty").notNull(),
  variance: integer("variance").notNull().default(0),
});

// 12. vendor_invoices
export const vendorInvoices = pgTable("vendor_invoices", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  vendorId: uuid("vendor_id").notNull().references(() => vendors.id),
  invoiceNumber: text("invoice_number").notNull(),
  purchaseOrderId: uuid("purchase_order_id").references(() => purchaseOrders.id),
  total: decimal("total", { precision: 12, scale: 2 }).notNull(),
  status: text("status").notNull().default("pending"), // pending, paid, overdue
  dueDate: timestamp("due_date").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 13. customers
export const customers = pgTable("customers", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  phone: text("phone"),
  email: text("email"),
  points: integer("points").notNull().default(0),
  tier: text("tier").notNull().default("Bronze"), // Bronze, Silver, Gold, Platinum
  storeCredit: decimal("store_credit", { precision: 12, scale: 2 }).notNull().default("0.00"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 14. customer_transactions
export const customerTransactions = pgTable("customer_transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  customerId: uuid("customer_id").notNull().references(() => customers.id, { onDelete: "cascade" }),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  orderId: uuid("order_id"), // Not enforced foreign key to avoid circular deps or optional link
  type: text("type").notNull(), // earn, redeem, adjustment
  points: integer("points").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 14.1 shifts
export const shifts = pgTable("shifts", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  branchId: uuid("branch_id").notNull().references(() => branches.id, { onDelete: "cascade" }),
  cashierId: uuid("cashier_id").notNull().references(() => staffUsers.id),
  openedAt: timestamp("opened_at").defaultNow().notNull(),
  closedAt: timestamp("closed_at"),
  openingFloat: decimal("opening_float", { precision: 12, scale: 2 }).notNull().default("0.00"),
  cashDrops: text("cash_drops").default("[]"), // JSON string array of drops
  expectedCash: decimal("expected_cash", { precision: 12, scale: 2 }),
  actualCash: decimal("actual_cash", { precision: 12, scale: 2 }),
  status: text("status").notNull().default("Open"), // Open, Closed
  tillId: text("till_id"),
  startTime: text("start_time"),
  endTime: text("end_time"),
  shiftDate: text("shift_date"),
  notes: text("notes"),
});

// 15. orders
export const orders = pgTable("orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  branchId: uuid("branch_id").notNull().references(() => branches.id),
  cashierId: uuid("cashier_id").references(() => staffUsers.id),
  tillId: text("till_id"),
  source: text("source").default("POS"), // POS, talabat, careem, instashop
  subtotal: decimal("subtotal", { precision: 12, scale: 2 }).notNull(),
  vat: decimal("vat", { precision: 12, scale: 2 }).notNull(),
  total: decimal("total", { precision: 12, scale: 2 }).notNull(),
  paymentMethod: text("payment_method"), // Deprecated: Replaced by order_payments table. Kept temporarily.
  customerId: uuid("customer_id").references(() => customers.id),
  status: text("status").notNull().default("completed"), // completed, voided, refunded, auto-synced
  createdAt: timestamp("created_at").defaultNow().notNull(),
  cashReceived: decimal("cash_received", { precision: 12, scale: 2 }),
  changeGiven: decimal("change_given", { precision: 12, scale: 2 }),
  idempotencyKey: text("idempotency_key").unique(),
  invoiceNumber: text("invoice_number"),
});

// 15.01 invoice_sequences
export const invoiceSequences = pgTable("invoice_sequences", {
  tenantId: uuid("tenant_id").primaryKey().references(() => tenants.id, { onDelete: "cascade" }),
  currentValue: integer("current_value").notNull().default(0),
});

// 15.1 order_payments
export const orderPayments = pgTable("order_payments", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  method: text("method").notNull(), // Cash, Card, Loyalty, Store Credit
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
});

// 16. order_items
export const orderItems = pgTable("order_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  productId: uuid("product_id").notNull().references(() => products.id),
  qty: integer("qty").notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
});

// 17. aggregator_credentials
export const aggregatorCredentials = pgTable("aggregator_credentials", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  branchId: uuid("branch_id").notNull().references(() => branches.id, { onDelete: "cascade" }),
  channel: text("channel").notNull(), // Talabat, Careem, Deliveroo, InstaShop
  apiKey: text("api_key").notNull(),
  apiSecret: text("api_secret"),
  status: text("status").notNull().default("active"), // active, sandbox, suspended
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 18. aggregator_orders
export const aggregatorOrders = pgTable("aggregator_orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  branchId: uuid("branch_id").notNull().references(() => branches.id, { onDelete: "cascade" }),
  channel: text("channel").notNull(), // Talabat, Careem, Deliveroo, InstaShop
  externalOrderId: text("external_order_id").notNull(),
  customerName: text("customer_name"),
  itemsJson: text("items_json").notNull(), // JSON list of synced items
  total: decimal("total", { precision: 12, scale: 2 }).notNull(),
  status: text("status").notNull().default("new"), // new, preparing, packed, dispatched, completed
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations
export const tenantsRelations = relations(tenants, ({ one, many }) => ({
  settings: one(tenantSettings),
  branches: many(branches),
  staffUsers: many(staffUsers),
  products: many(products),
  promotions: many(promotions),
  shifts: many(shifts),
  orders: many(orders),
  vendors: many(vendors),
  customers: many(customers),
  aggregatorCredentials: many(aggregatorCredentials),
  aggregatorOrders: many(aggregatorOrders),
}));

export const branchesRelations = relations(branches, ({ one, many }) => ({
  tenant: one(tenants, { fields: [branches.tenantId], references: [tenants.id] }),
  staffUsers: many(staffUsers),
  shifts: many(shifts),
  orders: many(orders),
  stockLevels: many(stockLevels),
  batches: many(batches),
  aggregatorCredentials: many(aggregatorCredentials),
  aggregatorOrders: many(aggregatorOrders),
}));

export const staffUsersRelations = relations(staffUsers, ({ one, many }) => ({
  tenant: one(tenants, { fields: [staffUsers.tenantId], references: [tenants.id] }),
  branch: one(branches, { fields: [staffUsers.branchId], references: [branches.id] }),
  shifts: many(shifts),
  orders: many(orders),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  tenant: one(tenants, { fields: [products.tenantId], references: [tenants.id] }),
  batches: many(batches),
  stockLevels: many(stockLevels),
  orderItems: many(orderItems),
  purchaseOrderItems: many(purchaseOrderItems),
}));

export const stockLevelsRelations = relations(stockLevels, ({ one }) => ({
  product: one(products, { fields: [stockLevels.productId], references: [products.id] }),
  branch: one(branches, { fields: [stockLevels.branchId], references: [branches.id] }),
}));

export const batchesRelations = relations(batches, ({ one }) => ({
  product: one(products, { fields: [batches.productId], references: [products.id] }),
  branch: one(branches, { fields: [batches.branchId], references: [branches.id] }),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  tenant: one(tenants, { fields: [orders.tenantId], references: [tenants.id] }),
  branch: one(branches, { fields: [orders.branchId], references: [branches.id] }),
  cashier: one(staffUsers, { fields: [orders.cashierId], references: [staffUsers.id] }),
  payments: many(orderPayments),
  items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
  product: one(products, { fields: [orderItems.productId], references: [products.id] }),
}));

export const customersRelations = relations(customers, ({ one, many }) => ({
  tenant: one(tenants, { fields: [customers.tenantId], references: [tenants.id] }),
  transactions: many(customerTransactions),
}));

export const customerTransactionsRelations = relations(customerTransactions, ({ one }) => ({
  customer: one(customers, { fields: [customerTransactions.customerId], references: [customers.id] }),
  tenant: one(tenants, { fields: [customerTransactions.tenantId], references: [tenants.id] }),
}));

export const purchaseOrdersRelations = relations(purchaseOrders, ({ one, many }) => ({
  tenant: one(tenants, { fields: [purchaseOrders.tenantId], references: [tenants.id] }),
  branch: one(branches, { fields: [purchaseOrders.branchId], references: [branches.id] }),
  vendor: one(vendors, { fields: [purchaseOrders.vendorId], references: [vendors.id] }),
  items: many(purchaseOrderItems),
  grns: many(grn),
  invoices: many(vendorInvoices),
}));

export const purchaseOrderItemsRelations = relations(purchaseOrderItems, ({ one }) => ({
  purchaseOrder: one(purchaseOrders, { fields: [purchaseOrderItems.purchaseOrderId], references: [purchaseOrders.id] }),
  product: one(products, { fields: [purchaseOrderItems.productId], references: [products.id] }),
}));

export const grnRelations = relations(grn, ({ one, many }) => ({
  tenant: one(tenants, { fields: [grn.tenantId], references: [tenants.id] }),
  branch: one(branches, { fields: [grn.branchId], references: [branches.id] }),
  purchaseOrder: one(purchaseOrders, { fields: [grn.purchaseOrderId], references: [purchaseOrders.id] }),
  vendor: one(vendors, { fields: [grn.vendorId], references: [vendors.id] }),
  items: many(grnItems),
}));

export const grnItemsRelations = relations(grnItems, ({ one }) => ({
  grn: one(grn, { fields: [grnItems.grnId], references: [grn.id] }),
  product: one(products, { fields: [grnItems.productId], references: [products.id] }),
}));

export const vendorInvoicesRelations = relations(vendorInvoices, ({ one }) => ({
  tenant: one(tenants, { fields: [vendorInvoices.tenantId], references: [tenants.id] }),
  vendor: one(vendors, { fields: [vendorInvoices.vendorId], references: [vendors.id] }),
  purchaseOrder: one(purchaseOrders, { fields: [vendorInvoices.purchaseOrderId], references: [purchaseOrders.id] }),
}));

export const tenantSettingsRelations = relations(tenantSettings, ({ one }) => ({
  tenant: one(tenants, { fields: [tenantSettings.tenantId], references: [tenants.id] }),
}));

export const promotionsRelations = relations(promotions, ({ one }) => ({
  tenant: one(tenants, { fields: [promotions.tenantId], references: [tenants.id] }),
}));

export const shiftsRelations = relations(shifts, ({ one }) => ({
  tenant: one(tenants, { fields: [shifts.tenantId], references: [tenants.id] }),
  branch: one(branches, { fields: [shifts.branchId], references: [branches.id] }),
  cashier: one(staffUsers, { fields: [shifts.cashierId], references: [staffUsers.id] }),
  till: one(tills, { fields: [shifts.tillId], references: [tills.id] }),
}));

export const orderPaymentsRelations = relations(orderPayments, ({ one }) => ({
  order: one(orders, { fields: [orderPayments.orderId], references: [orders.id] }),
}));

export const rolePermissions = pgTable(
  "role_permissions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    role: roleEnum("role").notNull(),
    permission: text("permission").notNull(),
    enabled: boolean("enabled").notNull().default(true),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull(),
  },
  (t) => [unique("role_perm_unique").on(t.tenantId, t.role, t.permission)],
);

export const rolePermissionsRelations = relations(rolePermissions, ({ one }) => ({
  tenant: one(tenants, { fields: [rolePermissions.tenantId], references: [tenants.id] }),
}));

// 18. platform_settings
export const platformSettings = pgTable("platform_settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  currency: text("currency").notNull().default("AED"),
  timezone: text("timezone").notNull().default("Asia/Dubai"),
  dateFormat: text("date_format").notNull().default("DD/MM/YYYY"),
  vatRate: decimal("vat_rate", { precision: 5, scale: 2 }).notNull().default("5.00"),
  vatInclusive: boolean("vat_inclusive").notNull().default(true),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const staffPermissionOverrides = pgTable(
  "staff_permission_overrides",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    staffUserId: uuid("staff_user_id")
      .notNull()
      .references(() => staffUsers.id, { onDelete: "cascade" }),
    permission: text("permission").notNull(),
    enabled: boolean("enabled").notNull().default(true),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull(),
  },
  (t) => [unique("staff_perm_override_unique").on(t.tenantId, t.staffUserId, t.permission)],
);

export const staffPermissionOverridesRelations = relations(staffPermissionOverrides, ({ one }) => ({
  tenant: one(tenants, { fields: [staffPermissionOverrides.tenantId], references: [tenants.id] }),
  staffUser: one(staffUsers, { fields: [staffPermissionOverrides.staffUserId], references: [staffUsers.id] }),
}));

export const blogPosts = pgTable("blog_posts", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  coverImageUrl: text("cover_image_url"),
  shortDescription: text("short_description").notNull(),
  content: text("content").notNull(),
  status: text("status").notNull().default("Draft"),
  authorName: text("author_name").notNull().default("Admin"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  publishedAt: timestamp("published_at"),
});

export const priceOverrideRequests = pgTable("price_override_requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  branchId: uuid("branch_id")
    .notNull()
    .references(() => branches.id, { onDelete: "cascade" }),
  productId: uuid("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  stockLevelId: uuid("stock_level_id")
    .notNull()
    .references(() => stockLevels.id, { onDelete: "cascade" }),
  standardPrice: decimal("standard_price", { precision: 10, scale: 2 }).notNull(),
  requestedPrice: decimal("requested_price", { precision: 10, scale: 2 }).notNull(),
  reason: text("reason").notNull(),
  status: text("status").notNull().default("Pending"), // Pending, Approved, Rejected
  createdAt: timestamp("created_at").defaultNow().notNull(),
  approvedBy: uuid("approved_by").references(() => staffUsers.id),
  approvedAt: timestamp("approved_at"),
});

export const priceOverrideRequestsRelations = relations(priceOverrideRequests, ({ one }) => ({
  tenant: one(tenants, { fields: [priceOverrideRequests.tenantId], references: [tenants.id] }),
  branch: one(branches, { fields: [priceOverrideRequests.branchId], references: [branches.id] }),
  product: one(products, { fields: [priceOverrideRequests.productId], references: [products.id] }),
}));

export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  branchId: uuid("branch_id").references(() => branches.id),
  userId: uuid("user_id").references(() => staffUsers.id),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id").notNull(),
  details: json("details"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  tenantIdx: index("audit_logs_tenant_idx").on(table.tenantId),
  createdAtIdx: index("audit_logs_created_at_idx").on(table.createdAt),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  tenant: one(tenants, { fields: [auditLogs.tenantId], references: [tenants.id] }),
  branch: one(branches, { fields: [auditLogs.branchId], references: [branches.id] }),
  user: one(staffUsers, { fields: [auditLogs.userId], references: [staffUsers.id] }),
}));

export const tills = pgTable(
  "tills",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    branchId: uuid("branch_id")
      .notNull()
      .references(() => branches.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    status: text("status").notNull().default("Closed"), // Open, Closed
    openingFloat: decimal("opening_float", { precision: 12, scale: 2 }).notNull().default("0.00"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    createdBy: uuid("created_by").references(() => staffUsers.id),
  },
  (t) => [unique("till_branch_unique").on(t.branchId, t.name)],
);

export const tillsRelations = relations(tills, ({ one }) => ({
  tenant: one(tenants, { fields: [tills.tenantId], references: [tenants.id] }),
  branch: one(branches, { fields: [tills.branchId], references: [branches.id] }),
  creator: one(staffUsers, { fields: [tills.createdBy], references: [staffUsers.id] }),
}));

export const stockAdjustments = pgTable("stock_adjustments", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  branchId: uuid("branch_id")
    .notNull()
    .references(() => branches.id, { onDelete: "cascade" }),
  productId: uuid("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  batchId: uuid("batch_id").references(() => batches.id),
  previousQuantity: integer("previous_quantity").notNull(),
  quantityChange: integer("quantity_change").notNull(),
  newQuantity: integer("new_quantity").notNull(),
  reason: text("reason").notNull(),
  adjustedBy: uuid("adjusted_by").references(() => staffUsers.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const stockAdjustmentsRelations = relations(stockAdjustments, ({ one }) => ({
  product: one(products, { fields: [stockAdjustments.productId], references: [products.id] }),
  staff: one(staffUsers, { fields: [stockAdjustments.adjustedBy], references: [staffUsers.id] }),
}));

export const stockTransfers = pgTable("stock_transfers", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  productId: uuid("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  sourceBranchId: uuid("source_branch_id")
    .notNull()
    .references(() => branches.id, { onDelete: "cascade" }),
  destinationBranchId: uuid("destination_branch_id")
    .notNull()
    .references(() => branches.id, { onDelete: "cascade" }),
  quantity: integer("quantity").notNull(),
  transferredBy: uuid("transferred_by").references(() => staffUsers.id),
  status: text("status").notNull().default("Completed"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const inventoryLedger = pgTable("inventory_ledger", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  branchId: uuid("branch_id")
    .notNull()
    .references(() => branches.id, { onDelete: "cascade" }),
  productId: uuid("product_id")
    .notNull()
    .references(() => products.id),
  batchId: uuid("batch_id").references(() => batches.id),
  transactionType: text("transaction_type").notNull(), // 'Sale', 'GRN', 'Adjustment', 'Transfer'
  previousQuantity: integer("previous_quantity").notNull(),
  changedQuantity: integer("changed_quantity").notNull(),
  newQuantity: integer("new_quantity").notNull(),
  referenceId: text("reference_id"),
  createdBy: uuid("created_by").references(() => staffUsers.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  tenantIdx: index("inventory_ledger_tenant_idx").on(table.tenantId),
  branchIdx: index("inventory_ledger_branch_idx").on(table.branchId),
  productIdx: index("inventory_ledger_product_idx").on(table.productId),
  createdAtIdx: index("inventory_ledger_created_at_idx").on(table.createdAt),
}));

export const aggregatorConnections = pgTable("aggregator_connections", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  branchId: uuid("branch_id").notNull().references(() => branches.id, { onDelete: "cascade" }),
  aggregatorName: text("aggregator_name").notNull(), // e.g. talabat
  sftpHost: text("sftp_host"),
  sftpPort: integer("sftp_port").default(22),
  sftpUsername: text("sftp_username"),
  sftpPassword: text("sftp_password"), // Encrypted AES-256-GCM
  remoteDirectory: text("remote_directory").default("/Assortment"),
  vendorId: text("vendor_id"),
  priceFormat: text("price_format").notNull().default("price_discounted"), // price_discounted, original_discounted, original_price
  syncFrequency: text("sync_frequency").notNull().default("manual"), // manual, 15min, hourly, daily
  isPaused: boolean("is_paused").notNull().default(false), // Pause automation separate from isActive
  consecutiveFailures: integer("consecutive_failures").notNull().default(0),
  lastScheduledSyncAt: timestamp("last_scheduled_sync_at"),
  isActive: boolean("is_active").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const aggregatorSyncLogs = pgTable("aggregator_sync_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  aggregatorConnectionId: uuid("aggregator_connection_id").notNull().references(() => aggregatorConnections.id, { onDelete: "cascade" }),
  syncType: text("sync_type").notNull().default("manual"), // manual, scheduled
  status: text("status").notNull(), // success, failed, preview_only
  fileName: text("file_name").notNull(),
  rowCount: integer("row_count").notNull().default(0),
  errorMessage: text("error_message"),
  triggeredByUserId: uuid("triggered_by_user_id").references(() => staffUsers.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
