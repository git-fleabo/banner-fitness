ALTER TABLE "glossary_versions" DROP CONSTRAINT "glossary_versions_publish_timestamp";--> statement-breakpoint
ALTER TABLE "learning_object_versions" DROP CONSTRAINT "learning_object_versions_publish_timestamp";--> statement-breakpoint
ALTER TABLE "lesson_versions" DROP CONSTRAINT "lesson_versions_publish_timestamp";--> statement-breakpoint
ALTER TABLE "question_versions" DROP CONSTRAINT "question_versions_publish_timestamp";--> statement-breakpoint
ALTER TABLE "glossary_versions" ADD CONSTRAINT "glossary_versions_publish_timestamp" CHECK (("glossary_versions"."status" in ('published', 'retired')) = ("glossary_versions"."published_at" is not null));--> statement-breakpoint
ALTER TABLE "learning_object_versions" ADD CONSTRAINT "learning_object_versions_publish_timestamp" CHECK (("learning_object_versions"."status" in ('published', 'retired')) = ("learning_object_versions"."published_at" is not null));--> statement-breakpoint
ALTER TABLE "lesson_versions" ADD CONSTRAINT "lesson_versions_publish_timestamp" CHECK (("lesson_versions"."status" in ('published', 'retired')) = ("lesson_versions"."published_at" is not null));--> statement-breakpoint
ALTER TABLE "question_versions" ADD CONSTRAINT "question_versions_publish_timestamp" CHECK (("question_versions"."status" in ('published', 'retired')) = ("question_versions"."published_at" is not null));
--> statement-breakpoint
CREATE FUNCTION "public"."protect_published_version"() RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog, public
AS '
BEGIN
  IF OLD.published_at IS NULL THEN
    IF TG_OP = ''DELETE'' THEN RETURN OLD; END IF;
    RETURN NEW;
  END IF;

  IF TG_OP = ''DELETE'' THEN
    RAISE EXCEPTION ''Published content versions cannot be deleted'';
  END IF;

  IF (to_jsonb(NEW) - ARRAY[''status'', ''updated_at''])
      <> (to_jsonb(OLD) - ARRAY[''status'', ''updated_at'']) THEN
    RAISE EXCEPTION ''Published content versions cannot be edited in place'';
  END IF;

  IF OLD.status = ''published'' AND NEW.status NOT IN (''published'', ''retired'') THEN
    RAISE EXCEPTION ''Published content can only remain published or be retired'';
  END IF;

  IF OLD.status = ''retired'' AND NEW.status <> ''retired'' THEN
    RAISE EXCEPTION ''Retired content versions cannot be reactivated'';
  END IF;

  RETURN NEW;
END;
';
--> statement-breakpoint
CREATE TRIGGER "lesson_versions_protect_published"
BEFORE UPDATE OR DELETE ON "lesson_versions"
FOR EACH ROW EXECUTE FUNCTION "public"."protect_published_version"();
--> statement-breakpoint
CREATE TRIGGER "learning_object_versions_protect_published"
BEFORE UPDATE OR DELETE ON "learning_object_versions"
FOR EACH ROW EXECUTE FUNCTION "public"."protect_published_version"();
--> statement-breakpoint
CREATE TRIGGER "question_versions_protect_published"
BEFORE UPDATE OR DELETE ON "question_versions"
FOR EACH ROW EXECUTE FUNCTION "public"."protect_published_version"();
--> statement-breakpoint
CREATE TRIGGER "glossary_versions_protect_published"
BEFORE UPDATE OR DELETE ON "glossary_versions"
FOR EACH ROW EXECUTE FUNCTION "public"."protect_published_version"();
