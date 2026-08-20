CREATE INDEX "aggregator_orders_tenant_idx" ON "aggregator_orders" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "aggregator_orders_branch_idx" ON "aggregator_orders" USING btree ("branch_id");--> statement-breakpoint
CREATE INDEX "aggregator_orders_status_idx" ON "aggregator_orders" USING btree ("status");--> statement-breakpoint
CREATE INDEX "aggregator_orders_created_at_idx" ON "aggregator_orders" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "aggregator_orders_platform_idx" ON "aggregator_orders" USING btree ("platform");--> statement-breakpoint
ALTER TABLE "aggregator_credentials" ADD CONSTRAINT "aggregator_credentials_unique" UNIQUE("tenant_id","branch_id","platform");--> statement-breakpoint
ALTER TABLE "aggregator_sync_settings" ADD CONSTRAINT "aggregator_sync_unique" UNIQUE("tenant_id","branch_id","platform");