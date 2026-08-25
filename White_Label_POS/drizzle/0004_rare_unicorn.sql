CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"branch_id" uuid,
	"user_id" uuid,
	"action" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" text NOT NULL,
	"details" json,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "login_attempts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"identifier" text NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"locked_until" timestamp,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "login_attempts_identifier_unique" UNIQUE("identifier")
);
--> statement-breakpoint
CREATE TABLE "price_override_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"stock_level_id" uuid NOT NULL,
	"standard_price" numeric(10, 2) NOT NULL,
	"requested_price" numeric(10, 2) NOT NULL,
	"reason" text NOT NULL,
	"status" text DEFAULT 'Pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"approved_by" uuid,
	"approved_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "role_permissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"role" "role" NOT NULL,
	"permission" text NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "role_perm_unique" UNIQUE("tenant_id","role","permission")
);
--> statement-breakpoint
CREATE TABLE "tills" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"status" text DEFAULT 'Closed' NOT NULL,
	"opening_float" numeric(12, 2) DEFAULT '0.00' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"created_by" uuid,
	CONSTRAINT "till_branch_unique" UNIQUE("branch_id","name")
);
--> statement-breakpoint
CREATE TABLE "vendor_payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"vendor_id" uuid NOT NULL,
	"invoice_id" uuid NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"method" text NOT NULL,
	"reference_no" text,
	"notes" text,
	"payment_date" timestamp NOT NULL,
	"recorded_by" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "is_batch_tracked" SET DEFAULT true;--> statement-breakpoint
ALTER TABLE "batches" ADD COLUMN "tenant_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "batches" ADD COLUMN "grn_id" uuid;--> statement-breakpoint
ALTER TABLE "batches" ADD COLUMN "manufacturing_date" timestamp;--> statement-breakpoint
ALTER TABLE "batches" ADD COLUMN "received_qty" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "batches" ADD COLUMN "unit_cost" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "batches" ADD COLUMN "created_by" uuid;--> statement-breakpoint
ALTER TABLE "grn_items" ADD COLUMN "batch_number" text;--> statement-breakpoint
ALTER TABLE "grn_items" ADD COLUMN "manufacturing_date" timestamp;--> statement-breakpoint
ALTER TABLE "grn_items" ADD COLUMN "expiry_date" timestamp;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "cash_received" numeric(12, 2);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "change_given" numeric(12, 2);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "idempotency_key" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "is_expiry_tracked" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "promotions" ADD COLUMN "type" text;--> statement-breakpoint
ALTER TABLE "promotions" ADD COLUMN "target" text;--> statement-breakpoint
ALTER TABLE "promotions" ADD COLUMN "value" text;--> statement-breakpoint
ALTER TABLE "promotions" ADD COLUMN "target_category" text;--> statement-breakpoint
ALTER TABLE "promotions" ADD COLUMN "target_product_ids" text;--> statement-breakpoint
ALTER TABLE "promotions" ADD COLUMN "bundle_products" text;--> statement-breakpoint
ALTER TABLE "promotions" ADD COLUMN "pricing_basis" text;--> statement-breakpoint
ALTER TABLE "promotions" ADD COLUMN "min_qty" integer;--> statement-breakpoint
ALTER TABLE "promotions" ADD COLUMN "max_qty" integer;--> statement-breakpoint
ALTER TABLE "promotions" ADD COLUMN "start_time" text;--> statement-breakpoint
ALTER TABLE "promotions" ADD COLUMN "end_time" text;--> statement-breakpoint
ALTER TABLE "purchase_orders" ADD COLUMN "subtotal" numeric(12, 2);--> statement-breakpoint
ALTER TABLE "purchase_orders" ADD COLUMN "vat_rate" numeric(5, 2);--> statement-breakpoint
ALTER TABLE "purchase_orders" ADD COLUMN "vat_amount" numeric(12, 2);--> statement-breakpoint
ALTER TABLE "shifts" ADD COLUMN "till_id" text;--> statement-breakpoint
ALTER TABLE "shifts" ADD COLUMN "start_time" text;--> statement-breakpoint
ALTER TABLE "shifts" ADD COLUMN "end_time" text;--> statement-breakpoint
ALTER TABLE "shifts" ADD COLUMN "shift_date" text;--> statement-breakpoint
ALTER TABLE "shifts" ADD COLUMN "notes" text;--> statement-breakpoint
ALTER TABLE "tenant_settings" ADD COLUMN "loyalty_points_per_aed" integer DEFAULT 10 NOT NULL;--> statement-breakpoint
ALTER TABLE "tenant_settings" ADD COLUMN "loyalty_min_points_to_redeem" integer DEFAULT 5000 NOT NULL;--> statement-breakpoint
ALTER TABLE "tenant_settings" ADD COLUMN "allow_inventory_manager_po_draft" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "outlet_limit" integer DEFAULT 5 NOT NULL;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "till_limit" integer DEFAULT 10 NOT NULL;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "monthly_order_limit" integer DEFAULT 10000 NOT NULL;--> statement-breakpoint
ALTER TABLE "vendor_invoices" ADD COLUMN "grn_id" uuid;--> statement-breakpoint
ALTER TABLE "vendor_invoices" ADD COLUMN "subtotal" numeric(12, 2);--> statement-breakpoint
ALTER TABLE "vendor_invoices" ADD COLUMN "vat_rate" numeric(5, 2);--> statement-breakpoint
ALTER TABLE "vendor_invoices" ADD COLUMN "vat_amount" numeric(12, 2);--> statement-breakpoint
ALTER TABLE "vendor_invoices" ADD COLUMN "paid_amount" numeric(12, 2) DEFAULT '0.00' NOT NULL;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_staff_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."staff_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "price_override_requests" ADD CONSTRAINT "price_override_requests_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "price_override_requests" ADD CONSTRAINT "price_override_requests_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "price_override_requests" ADD CONSTRAINT "price_override_requests_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "price_override_requests" ADD CONSTRAINT "price_override_requests_stock_level_id_stock_levels_id_fk" FOREIGN KEY ("stock_level_id") REFERENCES "public"."stock_levels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "price_override_requests" ADD CONSTRAINT "price_override_requests_approved_by_staff_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."staff_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tills" ADD CONSTRAINT "tills_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tills" ADD CONSTRAINT "tills_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tills" ADD CONSTRAINT "tills_created_by_staff_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."staff_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_payments" ADD CONSTRAINT "vendor_payments_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_payments" ADD CONSTRAINT "vendor_payments_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_payments" ADD CONSTRAINT "vendor_payments_invoice_id_vendor_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."vendor_invoices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_payments" ADD CONSTRAINT "vendor_payments_recorded_by_staff_users_id_fk" FOREIGN KEY ("recorded_by") REFERENCES "public"."staff_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "batches" ADD CONSTRAINT "batches_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "batches" ADD CONSTRAINT "batches_grn_id_grn_id_fk" FOREIGN KEY ("grn_id") REFERENCES "public"."grn"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "batches" ADD CONSTRAINT "batches_created_by_staff_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."staff_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_invoices" ADD CONSTRAINT "vendor_invoices_grn_id_grn_id_fk" FOREIGN KEY ("grn_id") REFERENCES "public"."grn"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_idempotency_key_unique" UNIQUE("idempotency_key");