CREATE TABLE "platform_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"currency" text DEFAULT 'AED' NOT NULL,
	"timezone" text DEFAULT 'Asia/Dubai' NOT NULL,
	"date_format" text DEFAULT 'DD/MM/YYYY' NOT NULL,
	"vat_rate" numeric(5, 2) DEFAULT '5.00' NOT NULL,
	"vat_inclusive" boolean DEFAULT true NOT NULL,
	"self_signup" boolean DEFAULT true NOT NULL,
	"enforce_2fa" boolean DEFAULT false NOT NULL,
	"auto_suspend" boolean DEFAULT true NOT NULL,
	"beta_features" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
