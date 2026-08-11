CREATE TABLE "pt_client_performance_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" uuid NOT NULL,
	"exercise_id" uuid,
	"metric_type" text NOT NULL,
	"metric_name" text,
	"performance_date" date NOT NULL,
	"value" numeric(10, 2) NOT NULL,
	"unit" text NOT NULL,
	"repetitions" smallint,
	"load_kg" numeric(10, 2),
	"source" text NOT NULL,
	"confidence" text,
	"technique_acceptable" boolean DEFAULT true NOT NULL,
	"pain_reported" boolean DEFAULT false NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pt_client_performance_value_positive" CHECK ("pt_client_performance_records"."value" > 0)
);
--> statement-breakpoint
ALTER TABLE "pt_client_performance_records" ADD CONSTRAINT "pt_client_performance_records_client_id_pt_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."pt_clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pt_client_performance_records" ADD CONSTRAINT "pt_client_performance_records_exercise_id_pt_exercises_id_fk" FOREIGN KEY ("exercise_id") REFERENCES "public"."pt_exercises"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "pt_client_performance_client_date_idx" ON "pt_client_performance_records" USING btree ("client_id","performance_date");--> statement-breakpoint
CREATE INDEX "pt_client_performance_exercise_idx" ON "pt_client_performance_records" USING btree ("exercise_id");