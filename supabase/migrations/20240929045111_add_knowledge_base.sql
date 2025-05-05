CREATE EXTENSION if NOT EXISTS "vector"
WITH
  schema "public" VERSION '0.7.4';

CREATE SEQUENCE "public"."documents_id_seq";

CREATE TABLE "public"."documents" (
  "id" bigint NOT NULL DEFAULT nextval('documents_id_seq'::regclass),
  "content" text,
  "metadata" jsonb,
  "embedding" vector (1536)
);

ALTER SEQUENCE "public"."documents_id_seq" owned by "public"."documents"."id";

CREATE UNIQUE INDEX documents_pkey ON public.documents USING btree (id);

ALTER TABLE "public"."documents"
ADD CONSTRAINT "documents_pkey" PRIMARY KEY USING index "documents_pkey";

SET
  check_function_bodies = off;

CREATE
OR REPLACE FUNCTION public.match_documents (
  query_embedding vector,
  match_count integer DEFAULT NULL::integer,
  FILTER jsonb DEFAULT '{}'::jsonb
) RETURNS TABLE (
  id bigint,
  content text,
  metadata jsonb,
  embedding jsonb,
  similarity double precision
) LANGUAGE plpgsql AS $function$
#variable_conflict use_column
begin
return query
select
    id,
    content,
    metadata,
    (embedding::text)::jsonb as embedding,
        1 - (documents.embedding <=> query_embedding) as similarity
from documents
where metadata @> filter
order by documents.embedding <=> query_embedding
  limit match_count;
end;
$function$;

GRANT delete ON TABLE "public"."documents" TO "anon";

GRANT insert ON TABLE "public"."documents" TO "anon";

GRANT REFERENCES ON TABLE "public"."documents" TO "anon";

GRANT
SELECT
  ON TABLE "public"."documents" TO "anon";

GRANT trigger ON TABLE "public"."documents" TO "anon";

GRANT
TRUNCATE ON TABLE "public"."documents" TO "anon";

GRANT
UPDATE ON TABLE "public"."documents" TO "anon";

GRANT delete ON TABLE "public"."documents" TO "authenticated";

GRANT insert ON TABLE "public"."documents" TO "authenticated";

GRANT REFERENCES ON TABLE "public"."documents" TO "authenticated";

GRANT
SELECT
  ON TABLE "public"."documents" TO "authenticated";

GRANT trigger ON TABLE "public"."documents" TO "authenticated";

GRANT
TRUNCATE ON TABLE "public"."documents" TO "authenticated";

GRANT
UPDATE ON TABLE "public"."documents" TO "authenticated";

GRANT delete ON TABLE "public"."documents" TO "service_role";

GRANT insert ON TABLE "public"."documents" TO "service_role";

GRANT REFERENCES ON TABLE "public"."documents" TO "service_role";

GRANT
SELECT
  ON TABLE "public"."documents" TO "service_role";

GRANT trigger ON TABLE "public"."documents" TO "service_role";

GRANT
TRUNCATE ON TABLE "public"."documents" TO "service_role";

GRANT
UPDATE ON TABLE "public"."documents" TO "service_role";
