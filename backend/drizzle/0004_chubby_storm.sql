DROP TABLE "refresh_tokens" CASCADE;--> statement-breakpoint
ALTER TABLE "staff_users" ADD COLUMN "name" text;--> statement-breakpoint
ALTER TABLE "staff_users" ADD COLUMN "phone" text;--> statement-breakpoint
ALTER TABLE "staff_users" ADD COLUMN "address" text;--> statement-breakpoint
ALTER TABLE "orders" DROP COLUMN "device_transaction_id";--> statement-breakpoint
ALTER TABLE "orders" DROP COLUMN "sync_status";