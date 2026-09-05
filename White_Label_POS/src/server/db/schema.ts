import {
  pgTable,
  text,
  timestamp,
  pgEnum,
  uuid,
  decimal,
  integer,
  boolean,
  index,
  uniqueIndex,
  json,
  unique,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const platformSettings = pgTable("platform_settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  currency: text("currency").notNull().default("AED"),
  timezone: text("timezone").notNull().default("Asia/Dubai"),
  dateFormat: text("date_format").notNull().default("DD/MM/YYYY"),
  vatRate: decimal("vat_rate", { precision: 5, scale: 2 }).notNull().default("5.00"),
  vatInclusive: boolean("vat_inclusive").notNull().default(true),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const roleEnum = pgEnum("role", [
  "super_admin",
  "head_office_admin",
  "branch_manager",
  "inventory_manager",
  "purchasing_officer",
  "cashier",
  "vendor",
]);

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
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  vatRate: decimal("vat_rate", { precision: 5, scale: 2 }).notNull().default("5.00"),
  vatInclusive: boolean("vat_inclusive").notNull().default(true),
  loyaltyRedemptionRate: decimal("loyalty_redemption_rate", { precision: 5, scale: 2 })
    .notNull()
    .default("0.01"), // e.g. 1 point = 0.01 currency
  loyaltyPointsPerAed: integer("loyalty_points_per_aed").notNull().default(10),
  loyaltyMinPointsToRedeem: integer("loyalty_min_points_to_redeem").notNull().default(5000),
  currency: text("currency").notNull().default("AED"),
  taxRegistrationNumber: text("trn"),
  allowInventoryManagerPoDraft: boolean("allow_inventory_manager_po_draft")
    .notNull()
    .default(false),
  // nearExpiryDays: integer("near_expiry_days").notNull().default(30),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// 2. branches
export const branches = pgTable("branches", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
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
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  barcode: text("barcode"),
  sku: text("sku"),
  category: text("category").notNull(),
  unit: text("unit").notNull(),
  costPrice: decimal("cost_price", { precision: 10, scale: 2 }).notNull(),
  salePrice: decimal("sale_price", { precision: 10, scale: 2 }).notNull(),
  isBatchTracked: boolean("is_batch_tracked").default(true),
  isExpiryTracked: boolean("is_expiry_tracked").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => {
  return {
    skuIdx: uniqueIndex("products_tenant_sku_idx").on(table.tenantId, table.sku),
  };
});

export const productBarcodes = pgTable("product_barcodes", {
  id: uuid("id").primaryKey().defaultRandom(),
  productId: uuid("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  barcode: text("barcode").notNull(),
});

export const productVariants = pgTable("product_variants", {
  id: uuid("id").primaryKey().defaultRandom(),
  productId: uuid("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  variantName: text("variant_name").notNull(),
  variantValue: text("variant_value").notNull(),
  sku: text("sku"),
  priceAdjustment: decimal("price_adjustment", { precision: 10, scale: 2 }).default("0.00").notNull(),
});

export const unitConversions = pgTable("unit_conversions", {
  id: uuid("id").primaryKey().defaultRandom(),
  productId: uuid("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  fromUnit: text("from_unit").notNull(),
  toUnit: text("to_unit").notNull(),
  conversionFactor: decimal("conversion_factor", { precision: 10, scale: 4 }).notNull(),
});


// 5. stock_levels
export const stockLevels = pgTable("stock_levels", {
  id: uuid("id").primaryKey().defaultRandom(),
  productId: uuid("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  branchId: uuid("branch_id")
    .notNull()
    .references(() => branches.id, { onDelete: "cascade" }),
  stock: integer("stock").notNull().default(0),
  reorderLevel: integer("reorder_level").notNull().default(10),
  priceOverride: decimal("price_override", { precision: 10, scale: 2 }), // Branch-specific pricing
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  branchIdx: index("stock_levels_branch_idx").on(table.branchId),
}));

// 5.01 stock_transfers
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

// 5.02 stock_adjustments (from Phase C)
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

// 5.03 inventory_ledger
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

// 5.1 promotions
export const promotions = pgTable("promotions", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
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

// 5.2 promotion_branches
export const promotionBranches = pgTable("promotion_branches", {
  id: uuid("id").primaryKey().defaultRandom(),
  promotionId: uuid("promotion_id")
    .notNull()
    .references(() => promotions.id, { onDelete: "cascade" }),
  branchId: uuid("branch_id")
    .notNull()
    .references(() => branches.id, { onDelete: "cascade" }),
});

// 6. batches
export const batches = pgTable("batches", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  productId: uuid("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  branchId: uuid("branch_id").references(() => branches.id, { onDelete: "cascade" }),
  grnId: uuid("grn_id").references(() => grn.id, { onDelete: "cascade" }),
  batchNumber: text("batch_number").notNull(),
  manufacturingDate: timestamp("manufacturing_date"),
  expiryDate: timestamp("expiry_date").notNull(),
  stock: integer("stock").notNull().default(0),
  receivedQty: integer("received_qty").notNull().default(0),
  unitCost: decimal("unit_cost", { precision: 10, scale: 2 }),
  createdBy: uuid("created_by").references(() => staffUsers.id),
});

// 7. vendors
export const vendors = pgTable("vendors", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  email: text("email").unique(),
  passwordHash: text("password_hash"),
  contact: text("contact"),
  trn: text("trn"),
  phone: text("phone"),
  address: text("address"),
  status: text("status").notNull().default("Active"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdateFn(() => new Date()),
});

// 8. purchase_orders
export const purchaseOrders = pgTable("purchase_orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  branchId: uuid("branch_id").references(() => branches.id),
  vendorId: uuid("vendor_id")
    .notNull()
    .references(() => vendors.id),
  status: text("status").notNull().default("Draft"), // Draft, Ordered, GRN, Invoiced, Cancelled
  subtotal: decimal("subtotal", { precision: 12, scale: 2 }),
  vatRate: decimal("vat_rate", { precision: 5, scale: 2 }),
  vatAmount: decimal("vat_amount", { precision: 12, scale: 2 }),
  total: decimal("total", { precision: 12, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 9. purchase_order_items
export const purchaseOrderItems = pgTable("purchase_order_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  purchaseOrderId: uuid("purchase_order_id")
    .notNull()
    .references(() => purchaseOrders.id, { onDelete: "cascade" }),
  productId: uuid("product_id")
    .notNull()
    .references(() => products.id),
  qty: integer("qty").notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
});

// 10. grn (Goods Received Notes)
export const grn = pgTable("grn", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  branchId: uuid("branch_id")
    .notNull()
    .references(() => branches.id, { onDelete: "cascade" }),
  purchaseOrderId: uuid("purchase_order_id").references(() => purchaseOrders.id),
  vendorId: uuid("vendor_id")
    .notNull()
    .references(() => vendors.id),
  grnNumber: text("grn_number").notNull(),
  status: text("status").notNull().default("received"), // received, variance
  receivedAt: timestamp("received_at").defaultNow().notNull(),
});

// 11. grn_items
export const grnItems = pgTable("grn_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  grnId: uuid("grn_id")
    .notNull()
    .references(() => grn.id, { onDelete: "cascade" }),
  productId: uuid("product_id")
    .notNull()
    .references(() => products.id),
  orderedQty: integer("ordered_qty").notNull(),
  receivedQty: integer("received_qty").notNull(),
  variance: integer("variance").notNull().default(0),
  batchNumber: text("batch_number"),
  manufacturingDate: timestamp("manufacturing_date"),
  expiryDate: timestamp("expiry_date"),
});

// 12. vendor_invoices
export const vendorInvoices = pgTable("vendor_invoices", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  vendorId: uuid("vendor_id")
    .notNull()
    .references(() => vendors.id),
  invoiceNumber: text("invoice_number").notNull(),
  purchaseOrderId: uuid("purchase_order_id").references(() => purchaseOrders.id),
  grnId: uuid("grn_id").references(() => grn.id),
  subtotal: decimal("subtotal", { precision: 12, scale: 2 }),
  vatRate: decimal("vat_rate", { precision: 5, scale: 2 }),
  vatAmount: decimal("vat_amount", { precision: 12, scale: 2 }),
  total: decimal("total", { precision: 12, scale: 2 }).notNull(),
  paidAmount: decimal("paid_amount", { precision: 12, scale: 2 }).notNull().default("0.00"),
  status: text("status").notNull().default("pending"), // pending, Partially Paid, Paid, overdue
  dueDate: timestamp("due_date").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 12.5 vendor_payments
export const vendorPayments = pgTable("vendor_payments", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  vendorId: uuid("vendor_id")
    .notNull()
    .references(() => vendors.id),
  invoiceId: uuid("invoice_id")
    .notNull()
    .references(() => vendorInvoices.id, { onDelete: "cascade" }),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  method: text("method").notNull(), // Cash, Bank Transfer, Cheque
  referenceNo: text("reference_no"),
  notes: text("notes"),
  paymentDate: timestamp("payment_date").notNull(),
  recordedBy: uuid("recorded_by")
    .notNull()
    .references(() => staffUsers.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 13. customers
export const customers = pgTable("customers", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  phone: text("phone"),
  email: text("email"),
  points: integer("points").notNull().default(0),
  tier: text("tier").notNull().default("Bronze"), // Bronze, Silver, Gold, Platinum
  storeCredit: decimal("store_credit", { precision: 12, scale: 2 }).notNull().default("0.00"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => {
  return {
    emailIdx: uniqueIndex("customer_email_idx").on(table.tenantId, table.email),
    phoneIdx: uniqueIndex("customer_phone_idx").on(table.tenantId, table.phone),
  };
});

// 14. customer_transactions
export const customerTransactions = pgTable("customer_transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  customerId: uuid("customer_id")
    .notNull()
    .references(() => customers.id, { onDelete: "cascade" }),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  orderId: uuid("order_id"), // Not enforced foreign key to avoid circular deps or optional link
  type: text("type").notNull(), // earn, redeem, adjustment
  points: integer("points").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 14.1 shifts
export const shifts = pgTable("shifts", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  branchId: uuid("branch_id")
    .notNull()
    .references(() => branches.id, { onDelete: "cascade" }),
  cashierId: uuid("cashier_id")
    .notNull()
    .references(() => staffUsers.id),
  openedAt: timestamp("opened_at").defaultNow().notNull(),
  closedAt: timestamp("closed_at"),
  openingFloat: decimal("opening_float", { precision: 12, scale: 2 }).notNull().default("0.00"),
  cashDrops: text("cash_drops").default("[]"), // JSON string array of drops
  expectedCash: decimal("expected_cash", { precision: 12, scale: 2 }),
  actualCash: decimal("actual_cash", { precision: 12, scale: 2 }),
  status: text("status").notNull().default("Open"), // Open, Closed, Scheduled
  tillId: text("till_id"),
  startTime: text("start_time"),
  endTime: text("end_time"),
  shiftDate: text("shift_date"),
  notes: text("notes"),
}, (table) => ({
  tenantIdx: index("shifts_tenant_idx").on(table.tenantId),
  branchIdx: index("shifts_branch_idx").on(table.branchId),
}));

// 15. orders
export const orders = pgTable("orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  branchId: uuid("branch_id")
    .notNull()
    .references(() => branches.id),
  cashierId: uuid("cashier_id").references(() => staffUsers.id),
  tillId: text("till_id"),
  customerId: uuid("customer_id").references(() => customers.id),
  source: text("source").default("POS"), // POS, talabat, careem, instashop
  subtotal: decimal("subtotal", { precision: 12, scale: 2 }).notNull(),
  vat: decimal("vat", { precision: 12, scale: 2 }).notNull(),
  total: decimal("total", { precision: 12, scale: 2 }).notNull(),
  paymentMethod: text("payment_method"), // Deprecated: Replaced by order_payments table. Kept temporarily.
  cashReceived: decimal("cash_received", { precision: 12, scale: 2 }),
  changeGiven: decimal("change_given", { precision: 12, scale: 2 }),
  idempotencyKey: text("idempotency_key").unique(),
  invoiceNumber: text("invoice_number"),
  status: text("status").notNull().default("completed"), // completed, voided, refunded, auto-synced
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  tenantIdx: index("orders_tenant_idx").on(table.tenantId),
  branchIdx: index("orders_branch_idx").on(table.branchId),
  createdAtIdx: index("orders_created_at_idx").on(table.createdAt),
}));

// 15.01 invoice_sequences
export const invoiceSequences = pgTable("invoice_sequences", {
  tenantId: uuid("tenant_id")
    .primaryKey()
    .references(() => tenants.id, { onDelete: "cascade" }),
  currentValue: integer("current_value").notNull().default(0),
});

// 15.1 order_payments
export const orderPayments = pgTable("order_payments", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  method: text("method").notNull(), // Cash, Card, Loyalty, Store Credit
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
});

// 16. order_items
export const orderItems = pgTable("order_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  productId: uuid("product_id")
    .notNull()
    .references(() => products.id),
  qty: integer("qty").notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
});

// 17. aggregator_credentials
export const aggregatorCredentials = pgTable(
  "aggregator_credentials",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    branchId: uuid("branch_id")
      .notNull()
      .references(() => branches.id, { onDelete: "cascade" }),
    platform: text("platform").notNull(),
    encryptedKey: text("encrypted_key").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull()
      .$onUpdateFn(() => new Date()),
  },
  (table) => ({
    uniqueConstraint: unique("aggregator_credentials_unique").on(
      table.tenantId,
      table.branchId,
      table.platform,
    ),
    tenantIdx: index("aggregator_credentials_tenant_idx").on(table.tenantId),
    branchIdx: index("aggregator_credentials_branch_idx").on(table.branchId),
    platformIdx: index("aggregator_credentials_platform_idx").on(table.platform),
  }),
);

// 18. aggregator_orders
export const aggregatorOrders = pgTable(
  "aggregator_orders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    branchId: uuid("branch_id")
      .notNull()
      .references(() => branches.id, { onDelete: "cascade" }),
    channel: text("channel").notNull(), // Talabat, Careem, Deliveroo, InstaShop
    orderReference: text("order_reference").notNull(),
    platform: text("platform").notNull(),
    items: json("items").notNull(), // JSON array of order items
    status: text("status").notNull().default("new"), // new, preparing, packed, dispatched, completed
    total: decimal("total", { precision: 12, scale: 2 }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull()
      .$onUpdateFn(() => new Date()),
  },
  (table) => ({
    tenantIdx: index("aggregator_orders_tenant_idx").on(table.tenantId),
    branchIdx: index("aggregator_orders_branch_idx").on(table.branchId),
    statusIdx: index("aggregator_orders_status_idx").on(table.status),
    createdAtIdx: index("aggregator_orders_created_at_idx").on(table.createdAt),
    platformIdx: index("aggregator_orders_platform_idx").on(table.platform),
  }),
);

// 19. aggregator_sync_settings
export const aggregatorSyncSettings = pgTable(
  "aggregator_sync_settings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    branchId: uuid("branch_id")
      .notNull()
      .references(() => branches.id, { onDelete: "cascade" }),
    platform: text("platform").notNull(),
    enabled: boolean("enabled").default(false).notNull(),
    lastPublishedAt: timestamp("last_published_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull()
      .$onUpdateFn(() => new Date()),
  },
  (table) => ({
    uniqueConstraint: unique("aggregator_sync_unique").on(
      table.tenantId,
      table.branchId,
      table.platform,
    ),
    tenantIdx: index("aggregator_sync_tenant_idx").on(table.tenantId),
    branchIdx: index("aggregator_sync_branch_idx").on(table.branchId),
    platformIdx: index("aggregator_sync_platform_idx").on(table.platform),
  }),
);

// Relations
// 21. audit_logs
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
  tenant: one(tenants, { fields: [batches.tenantId], references: [tenants.id] }),
  product: one(products, { fields: [batches.productId], references: [products.id] }),
  branch: one(branches, { fields: [batches.branchId], references: [branches.id] }),
  grn: one(grn, { fields: [batches.grnId], references: [grn.id] }),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  tenant: one(tenants, { fields: [orders.tenantId], references: [tenants.id] }),
  branch: one(branches, { fields: [orders.branchId], references: [branches.id] }),
  cashier: one(staffUsers, { fields: [orders.cashierId], references: [staffUsers.id] }),
  till: one(tills, { fields: [orders.tillId], references: [tills.id] }),
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
  customer: one(customers, {
    fields: [customerTransactions.customerId],
    references: [customers.id],
  }),
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
  purchaseOrder: one(purchaseOrders, {
    fields: [purchaseOrderItems.purchaseOrderId],
    references: [purchaseOrders.id],
  }),
  product: one(products, { fields: [purchaseOrderItems.productId], references: [products.id] }),
}));

export const grnRelations = relations(grn, ({ one, many }) => ({
  tenant: one(tenants, { fields: [grn.tenantId], references: [tenants.id] }),
  branch: one(branches, { fields: [grn.branchId], references: [branches.id] }),
  purchaseOrder: one(purchaseOrders, {
    fields: [grn.purchaseOrderId],
    references: [purchaseOrders.id],
  }),
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
  purchaseOrder: one(purchaseOrders, {
    fields: [vendorInvoices.purchaseOrderId],
    references: [purchaseOrders.id],
  }),
  grn: one(grn, { fields: [vendorInvoices.grnId], references: [grn.id] }),
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
      .notNull()
      .$onUpdateFn(() => new Date()),
  },
  (t) => [unique("role_perm_unique").on(t.tenantId, t.role, t.permission)],
);

export const rolePermissionsRelations = relations(rolePermissions, ({ one }) => ({
  tenant: one(tenants, { fields: [rolePermissions.tenantId], references: [tenants.id] }),
}));

export const priceOverrideRequestsRelations = relations(priceOverrideRequests, ({ one }) => ({
  tenant: one(tenants, { fields: [priceOverrideRequests.tenantId], references: [tenants.id] }),
  branch: one(branches, { fields: [priceOverrideRequests.branchId], references: [branches.id] }),
  product: one(products, { fields: [priceOverrideRequests.productId], references: [products.id] }),
  stockLevel: one(stockLevels, {
    fields: [priceOverrideRequests.stockLevelId],
    references: [stockLevels.id],
  }),
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

export const loginAttempts = pgTable("login_attempts", {
  id: uuid("id").primaryKey().defaultRandom(),
  identifier: text("identifier").notNull().unique(), // e.g. cashierId
  attempts: integer("attempts").notNull().default(0),
  lockedUntil: timestamp("locked_until"),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdateFn(() => new Date()),
});

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
