ALTER TABLE "tenant_invoices" ADD COLUMN IF NOT EXISTS "sent_to_client_at" timestamp;--> statement-breakpoint
ALTER TABLE "tenant_invoices" ADD COLUMN IF NOT EXISTS "reminder_sent_at" timestamp;--> statement-breakpoint
ALTER TABLE "tenant_invoices" ADD COLUMN IF NOT EXISTS "client_seen_at" timestamp;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "expenses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid REFERENCES "tenants"("id") ON DELETE cascade,
	"branch_id" uuid REFERENCES "branches"("id") ON DELETE cascade,
	"category" text NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"expense_date" date NOT NULL,
	"notes" text,
	"receipt_url" text,
	"created_by" uuid REFERENCES "staff_users"("id") ON DELETE set null,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "expenses_amount_check" CHECK (amount > 0)
);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "expenses_tenant_branch_date_idx" ON "expenses" USING btree ("tenant_id", "branch_id", "expense_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "expenses_tenant_idx" ON "expenses" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "expenses_branch_idx" ON "expenses" USING btree ("branch_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "expenses_date_idx" ON "expenses" USING btree ("expense_date");
