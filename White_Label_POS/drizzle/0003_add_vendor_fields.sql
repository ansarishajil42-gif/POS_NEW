ALTER TABLE "vendors" ADD COLUMN "phone" text;--> statement-breakpoint
ALTER TABLE "vendors" ADD COLUMN "address" text;--> statement-breakpoint
ALTER TABLE "vendors" ADD COLUMN "status" text DEFAULT 'Active' NOT NULL;--> statement-breakpoint
ALTER TABLE "vendors" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "vendors" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;