CREATE TABLE "platform_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"currency" text DEFAULT 'AED' NOT NULL,
	"timezone" text DEFAULT 'Asia/Dubai' NOT NULL,
	"date_format" text DEFAULT 'DD/MM/YYYY' NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "staff_users" ADD COLUMN "name" text;--> statement-breakpoint
ALTER TABLE "staff_users" ADD COLUMN "phone" text;--> statement-breakpoint
ALTER TABLE "staff_users" ADD COLUMN "address" text;