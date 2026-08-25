ALTER TABLE "tenants" ADD COLUMN "outlet_limit" integer DEFAULT 5 NOT NULL;
ALTER TABLE "tenants" ADD COLUMN "till_limit" integer DEFAULT 10 NOT NULL;
ALTER TABLE "tenants" ADD COLUMN "monthly_order_limit" integer DEFAULT 10000 NOT NULL;
