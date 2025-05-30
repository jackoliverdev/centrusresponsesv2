CREATE TABLE "public"."threads" (
  "id" bigint GENERATED BY DEFAULT AS IDENTITY NOT NULL,
  "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  "tags" TEXT[] NOT NULL,
  "user_id" integer,
  "messages" jsonb[] NOT NULL
);

ALTER TABLE "public"."threads" enable ROW level security;

CREATE UNIQUE INDEX threads_pkey ON public.threads USING btree (id);

ALTER TABLE "public"."threads"
ADD CONSTRAINT "threads_pkey" PRIMARY KEY USING index "threads_pkey";

ALTER TABLE "public"."threads"
ADD CONSTRAINT "threads_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL NOT valid;

ALTER TABLE "public"."threads" validate CONSTRAINT "threads_user_id_fkey";

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

GRANT delete ON TABLE "public"."threads" TO "anon";

GRANT insert ON TABLE "public"."threads" TO "anon";

GRANT REFERENCES ON TABLE "public"."threads" TO "anon";

GRANT
SELECT
  ON TABLE "public"."threads" TO "anon";

GRANT trigger ON TABLE "public"."threads" TO "anon";

GRANT
TRUNCATE ON TABLE "public"."threads" TO "anon";

GRANT
UPDATE ON TABLE "public"."threads" TO "anon";

GRANT delete ON TABLE "public"."threads" TO "authenticated";

GRANT insert ON TABLE "public"."threads" TO "authenticated";

GRANT REFERENCES ON TABLE "public"."threads" TO "authenticated";

GRANT
SELECT
  ON TABLE "public"."threads" TO "authenticated";

GRANT trigger ON TABLE "public"."threads" TO "authenticated";

GRANT
TRUNCATE ON TABLE "public"."threads" TO "authenticated";

GRANT
UPDATE ON TABLE "public"."threads" TO "authenticated";

GRANT delete ON TABLE "public"."threads" TO "service_role";

GRANT insert ON TABLE "public"."threads" TO "service_role";

GRANT REFERENCES ON TABLE "public"."threads" TO "service_role";

GRANT
SELECT
  ON TABLE "public"."threads" TO "service_role";

GRANT trigger ON TABLE "public"."threads" TO "service_role";

GRANT
TRUNCATE ON TABLE "public"."threads" TO "service_role";

GRANT
UPDATE ON TABLE "public"."threads" TO "service_role";
