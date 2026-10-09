CREATE INDEX IF NOT EXISTS "products_tenant_created_at_idx" ON "products" USING btree ("tenant_id", "created_at" DESC);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "products_tenant_barcode_idx" ON "products" USING btree ("tenant_id", "barcode");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "stock_levels_product_idx" ON "stock_levels" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "stock_levels_branch_product_idx" ON "stock_levels" USING btree ("branch_id", "product_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "batches_tenant_idx" ON "batches" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "purchase_orders_tenant_idx" ON "purchase_orders" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "vendor_invoices_tenant_idx" ON "vendor_invoices" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "orders_tenant_created_at_idx" ON "orders" USING btree ("tenant_id", "created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "order_items_order_idx" ON "order_items" USING btree ("order_id");
