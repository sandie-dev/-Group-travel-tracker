CREATE TABLE "users" (
	"id" serial PRIMARY KEY,
	"name" text NOT NULL,
	"color" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "visited_countries" (
	"id" serial PRIMARY KEY,
	"country_code" text NOT NULL,
	"user_id" integer NOT NULL,
	CONSTRAINT "visited_country_per_user" UNIQUE("user_id","country_code")
);
--> statement-breakpoint
ALTER TABLE "visited_countries" ADD CONSTRAINT "visited_countries_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;