import { pgTable, text, timestamp, pgEnum, uuid, decimal, integer, boolean } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const roleEnum = pgEnum("role", [
  "super_admin",
  "head_office_admin",
  "branch_manager",
  "inventory_manager",
  "purchasing_officer",
  "cashier",
]);

// 1. tenants
export const tenants = pgTable("tenants", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  subdomain: text("subdomain").notNull().unique(),
  plan: text("plan").notNull().default("Starter"),
  status: text("status").notNull().default("Active"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
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

// 5. stock_levels
export const stockLevels = pgTable("stock_levels", {
  id: uuid("id").primaryKey().defaultRandom(),
  productId: uuid("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  branchId: uuid("branch_id").notNull().references(() => branches.id, { onDelete: "cascade" }),
  stock: integer("stock").notNull().default(0),
  reorderLevel: integer("reorder_level").notNull().default(10),
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
  paymentMethod: text("payment_method"), // Cash, Card, Split, Online
  status: text("status").notNull().default("completed"), // completed, voided, refunded, auto-synced
  createdAt: timestamp("created_at").defaultNow().notNull(),
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
export const tenantsRelations = relations(tenants, ({ many }) => ({
  branches: many(branches),
  staffUsers: many(staffUsers),
  products: many(products),
  orders: many(orders),
  vendors: many(vendors),
  customers: many(customers),
  aggregatorCredentials: many(aggregatorCredentials),
  aggregatorOrders: many(aggregatorOrders),
}));

export const branchesRelations = relations(branches, ({ one, many }) => ({
  tenant: one(tenants, { fields: [branches.tenantId], references: [tenants.id] }),
  staffUsers: many(staffUsers),
  orders: many(orders),
  stockLevels: many(stockLevels),
  batches: many(batches),
  aggregatorCredentials: many(aggregatorCredentials),
  aggregatorOrders: many(aggregatorOrders),
}));

export const staffUsersRelations = relations(staffUsers, ({ one, many }) => ({
  tenant: one(tenants, { fields: [staffUsers.tenantId], references: [tenants.id] }),
  branch: one(branches, { fields: [staffUsers.branchId], references: [branches.id] }),
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
