ALTER TABLE "pt_clients" ADD COLUMN "client_colour" text DEFAULT 'emerald' NOT NULL;
UPDATE "pt_clients"
SET "client_colour" = (ARRAY['emerald','blue','orange','violet','rose','lime','sky','magenta','ochre','teal','coral','indigo'])[(get_byte(decode(md5("id"::text), 'hex'), 0) % 12) + 1]
WHERE "client_colour" = 'emerald';
