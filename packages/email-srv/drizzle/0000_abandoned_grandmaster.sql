CREATE SCHEMA "email_srv";
--> statement-breakpoint
CREATE TABLE "email_srv"."email_account" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer NOT NULL,
	"provider" text DEFAULT 'gmail' NOT NULL,
	"sender_email" text NOT NULL,
	"refresh_token" text NOT NULL,
	"connected_at" timestamp with time zone DEFAULT now() NOT NULL,
	"connected_by_user_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "email_account_tenant_id_unique" UNIQUE("tenant_id")
);
