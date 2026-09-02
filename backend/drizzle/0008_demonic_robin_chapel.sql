CREATE TABLE "aggregator_connections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"aggregator_name" text NOT NULL,
	"sftp_host" text,
	"sftp_port" integer DEFAULT 22,
	"sftp_username" text,
	"sftp_password" text,
	"remote_directory" text DEFAULT '/Assortment',
	"vendor_id" text,
	"price_format" text DEFAULT 'price_discounted' NOT NULL,
	"sync_frequency" text DEFAULT 'manual' NOT NULL,
	"is_paused" boolean DEFAULT false NOT NULL,
	"consecutive_failures" integer DEFAULT 0 NOT NULL,
	"last_scheduled_sync_at" timestamp,
	"is_active" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "aggregator_sync_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"aggregator_connection_id" uuid NOT NULL,
	"sync_type" text DEFAULT 'manual' NOT NULL,
	"status" text NOT NULL,
	"file_name" text NOT NULL,
	"row_count" integer DEFAULT 0 NOT NULL,
	"error_message" text,
	"triggered_by_user_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
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
CREATE TABLE "inventory_ledger" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"batch_id" uuid,
	"transaction_type" text NOT NULL,
	"previous_quantity" integer NOT NULL,
	"changed_quantity" integer NOT NULL,
	"new_quantity" integer NOT NULL,
	"reference_id" text,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoice_sequences" (
	"tenant_id" uuid PRIMARY KEY NOT NULL,
	"current_value" integer DEFAULT 0 NOT NULL
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
CREATE TABLE "stock_adjustments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"batch_id" uuid,
	"previous_quantity" integer NOT NULL,
	"quantity_change" integer NOT NULL,
	"new_quantity" integer NOT NULL,
	"reason" text NOT NULL,
	"adjusted_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stock_transfers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"source_branch_id" uuid NOT NULL,
	"destination_branch_id" uuid NOT NULL,
	"quantity" integer NOT NULL,
	"transferred_by" uuid,
	"status" text DEFAULT 'Completed' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
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
ALTER TABLE "customers" ADD COLUMN "store_credit" numeric(12, 2) DEFAULT '0.00' NOT NULL;--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "is_active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "grn" ADD COLUMN "vendor_confirmed" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "grn" ADD COLUMN "vendor_confirmed_at" timestamp;--> statement-breakpoint
ALTER TABLE "grn" ADD COLUMN "vendor_notes" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "customer_id" uuid;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "cash_received" numeric(12, 2);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "change_given" numeric(12, 2);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "idempotency_key" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "invoice_number" text;--> statement-breakpoint
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
ALTER TABLE "shifts" ADD COLUMN "till_id" text;--> statement-breakpoint
ALTER TABLE "shifts" ADD COLUMN "start_time" text;--> statement-breakpoint
ALTER TABLE "shifts" ADD COLUMN "end_time" text;--> statement-breakpoint
ALTER TABLE "shifts" ADD COLUMN "shift_date" text;--> statement-breakpoint
ALTER TABLE "shifts" ADD COLUMN "notes" text;--> statement-breakpoint
ALTER TABLE "staff_users" ADD COLUMN "vendor_id" uuid;--> statement-breakpoint
ALTER TABLE "tenant_settings" ADD COLUMN "loyalty_points_per_aed" integer DEFAULT 10 NOT NULL;--> statement-breakpoint
ALTER TABLE "tenant_settings" ADD COLUMN "loyalty_min_points_to_redeem" integer DEFAULT 5000 NOT NULL;--> statement-breakpoint
ALTER TABLE "tenant_settings" ADD COLUMN "allow_inventory_manager_po_draft" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "outlet_limit" integer DEFAULT 5 NOT NULL;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "till_limit" integer DEFAULT 10 NOT NULL;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "monthly_order_limit" integer DEFAULT 10000 NOT NULL;--> statement-breakpoint
ALTER TABLE "aggregator_connections" ADD CONSTRAINT "aggregator_connections_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "aggregator_connections" ADD CONSTRAINT "aggregator_connections_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "aggregator_sync_logs" ADD CONSTRAINT "aggregator_sync_logs_aggregator_connection_id_aggregator_connections_id_fk" FOREIGN KEY ("aggregator_connection_id") REFERENCES "public"."aggregator_connections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "aggregator_sync_logs" ADD CONSTRAINT "aggregator_sync_logs_triggered_by_user_id_staff_users_id_fk" FOREIGN KEY ("triggered_by_user_id") REFERENCES "public"."staff_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_staff_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."staff_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_ledger" ADD CONSTRAINT "inventory_ledger_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_ledger" ADD CONSTRAINT "inventory_ledger_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_ledger" ADD CONSTRAINT "inventory_ledger_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_ledger" ADD CONSTRAINT "inventory_ledger_batch_id_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."batches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_ledger" ADD CONSTRAINT "inventory_ledger_created_by_staff_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."staff_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_sequences" ADD CONSTRAINT "invoice_sequences_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "price_override_requests" ADD CONSTRAINT "price_override_requests_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "price_override_requests" ADD CONSTRAINT "price_override_requests_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "price_override_requests" ADD CONSTRAINT "price_override_requests_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "price_override_requests" ADD CONSTRAINT "price_override_requests_stock_level_id_stock_levels_id_fk" FOREIGN KEY ("stock_level_id") REFERENCES "public"."stock_levels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "price_override_requests" ADD CONSTRAINT "price_override_requests_approved_by_staff_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."staff_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_adjustments" ADD CONSTRAINT "stock_adjustments_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_adjustments" ADD CONSTRAINT "stock_adjustments_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_adjustments" ADD CONSTRAINT "stock_adjustments_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_adjustments" ADD CONSTRAINT "stock_adjustments_batch_id_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."batches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_adjustments" ADD CONSTRAINT "stock_adjustments_adjusted_by_staff_users_id_fk" FOREIGN KEY ("adjusted_by") REFERENCES "public"."staff_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_transfers" ADD CONSTRAINT "stock_transfers_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_transfers" ADD CONSTRAINT "stock_transfers_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_transfers" ADD CONSTRAINT "stock_transfers_source_branch_id_branches_id_fk" FOREIGN KEY ("source_branch_id") REFERENCES "public"."branches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_transfers" ADD CONSTRAINT "stock_transfers_destination_branch_id_branches_id_fk" FOREIGN KEY ("destination_branch_id") REFERENCES "public"."branches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_transfers" ADD CONSTRAINT "stock_transfers_transferred_by_staff_users_id_fk" FOREIGN KEY ("transferred_by") REFERENCES "public"."staff_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tills" ADD CONSTRAINT "tills_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tills" ADD CONSTRAINT "tills_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tills" ADD CONSTRAINT "tills_created_by_staff_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."staff_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_logs_tenant_idx" ON "audit_logs" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "inventory_ledger_tenant_idx" ON "inventory_ledger" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "inventory_ledger_branch_idx" ON "inventory_ledger" USING btree ("branch_id");--> statement-breakpoint
CREATE INDEX "inventory_ledger_product_idx" ON "inventory_ledger" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "inventory_ledger_created_at_idx" ON "inventory_ledger" USING btree ("created_at");--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_users" ADD CONSTRAINT "staff_users_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "product_barcodes_product_idx" ON "product_barcodes" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "product_barcodes_barcode_idx" ON "product_barcodes" USING btree ("barcode");--> statement-breakpoint
CREATE INDEX "product_variants_product_idx" ON "product_variants" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "products_tenant_idx" ON "products" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "products_barcode_idx" ON "products" USING btree ("barcode");--> statement-breakpoint
CREATE INDEX "stock_levels_prod_branch_idx" ON "stock_levels" USING btree ("product_id","branch_id");--> statement-breakpoint
CREATE INDEX "unit_conversions_product_idx" ON "unit_conversions" USING btree ("product_id");--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_idempotency_key_unique" UNIQUE("idempotency_key");