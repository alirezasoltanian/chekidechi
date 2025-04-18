-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
CREATE TABLE "channels" (
	"id" serial PRIMARY KEY NOT NULL,
	"channel_id" text NOT NULL,
	"title" text,
	"username" text,
	CONSTRAINT "channels_channel_id_unique" UNIQUE("channel_id")
);
--> statement-breakpoint
CREATE TABLE "summaries" (
	"id" serial PRIMARY KEY NOT NULL,
	"channel_id" text NOT NULL,
	"summary" text NOT NULL,
	"message_count" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"chat_id" text NOT NULL,
	"username" text,
	"first_name" text,
	"last_name" text,
	"token" integer DEFAULT 200,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT "users_chat_id_unique" UNIQUE("chat_id")
);
--> statement-breakpoint
CREATE TABLE "channel_lists" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"channels" json NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "channel_lists" ADD CONSTRAINT "channel_lists_user_id_users_chat_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("chat_id") ON DELETE no action ON UPDATE no action;
*/