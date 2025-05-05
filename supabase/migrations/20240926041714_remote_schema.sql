SET
  statement_timeout = 0;

SET
  lock_timeout = 0;

SET
  idle_in_transaction_session_timeout = 0;

SET
  client_encoding = 'UTF8';

SET
  standard_conforming_strings = ON;

SELECT
  pg_catalog.set_config ('search_path', '', FALSE);

SET
  check_function_bodies = FALSE;

SET
  xmloption = content;

SET
  client_min_messages = warning;

SET
  row_security = off;

CREATE EXTENSION IF NOT EXISTS "pgsodium"
WITH
  SCHEMA "pgsodium";

COMMENT ON SCHEMA "public" IS 'standard public schema';

CREATE EXTENSION IF NOT EXISTS "pg_graphql"
WITH
  SCHEMA "graphql";

CREATE EXTENSION IF NOT EXISTS "pg_stat_statements"
WITH
  SCHEMA "extensions";

CREATE EXTENSION IF NOT EXISTS "pgcrypto"
WITH
  SCHEMA "extensions";

CREATE EXTENSION IF NOT EXISTS "pgjwt"
WITH
  SCHEMA "extensions";

CREATE EXTENSION IF NOT EXISTS "supabase_vault"
WITH
  SCHEMA "vault";

CREATE EXTENSION IF NOT EXISTS "uuid-ossp"
WITH
  SCHEMA "extensions";

SET
  default_tablespace = '';

SET
  default_table_access_method = "heap";

CREATE TABLE IF NOT EXISTS "public"."organizations" (
  "id" integer NOT NULL,
  "name" "text" NOT NULL,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE "public"."organizations" OWNER TO "postgres";

CREATE SEQUENCE IF NOT EXISTS "public"."organizations_id_seq" AS integer START
WITH
  1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;

ALTER TABLE "public"."organizations_id_seq" OWNER TO "postgres";

ALTER SEQUENCE "public"."organizations_id_seq" OWNED BY "public"."organizations"."id";

CREATE TABLE IF NOT EXISTS "public"."user_organizations" (
  "user_id" integer NOT NULL,
  "organization_id" integer NOT NULL,
  "role" "text" NOT NULL
);

ALTER TABLE "public"."user_organizations" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."users" (
  "id" integer NOT NULL,
  "email" "text" NOT NULL,
  "first_name" "text",
  "last_name" "text",
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "firebase_uid" "text" NOT NULL
);

ALTER TABLE "public"."users" OWNER TO "postgres";

CREATE SEQUENCE IF NOT EXISTS "public"."users_id_seq" AS integer START
WITH
  1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;

ALTER TABLE "public"."users_id_seq" OWNER TO "postgres";

ALTER SEQUENCE "public"."users_id_seq" OWNED BY "public"."users"."id";

ALTER TABLE ONLY "public"."organizations"
ALTER COLUMN "id"
SET DEFAULT "nextval" ('"public"."organizations_id_seq"'::"regclass");

ALTER TABLE ONLY "public"."users"
ALTER COLUMN "id"
SET DEFAULT "nextval" ('"public"."users_id_seq"'::"regclass");

ALTER TABLE ONLY "public"."organizations"
ADD CONSTRAINT "organizations_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."user_organizations"
ADD CONSTRAINT "user_organizations_pkey" PRIMARY KEY ("user_id", "organization_id");

ALTER TABLE ONLY "public"."users"
ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."user_organizations"
ADD CONSTRAINT "user_organizations_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations" ("id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE ONLY "public"."user_organizations"
ADD CONSTRAINT "user_organizations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users" ("id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";

GRANT USAGE ON SCHEMA "public" TO "postgres";

GRANT USAGE ON SCHEMA "public" TO "anon";

GRANT USAGE ON SCHEMA "public" TO "authenticated";

GRANT USAGE ON SCHEMA "public" TO "service_role";

GRANT ALL ON TABLE "public"."organizations" TO "anon";

GRANT ALL ON TABLE "public"."organizations" TO "authenticated";

GRANT ALL ON TABLE "public"."organizations" TO "service_role";

GRANT ALL ON SEQUENCE "public"."organizations_id_seq" TO "anon";

GRANT ALL ON SEQUENCE "public"."organizations_id_seq" TO "authenticated";

GRANT ALL ON SEQUENCE "public"."organizations_id_seq" TO "service_role";

GRANT ALL ON TABLE "public"."user_organizations" TO "anon";

GRANT ALL ON TABLE "public"."user_organizations" TO "authenticated";

GRANT ALL ON TABLE "public"."user_organizations" TO "service_role";

GRANT ALL ON TABLE "public"."users" TO "anon";

GRANT ALL ON TABLE "public"."users" TO "authenticated";

GRANT ALL ON TABLE "public"."users" TO "service_role";

GRANT ALL ON SEQUENCE "public"."users_id_seq" TO "anon";

GRANT ALL ON SEQUENCE "public"."users_id_seq" TO "authenticated";

GRANT ALL ON SEQUENCE "public"."users_id_seq" TO "service_role";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public"
GRANT ALL ON SEQUENCES TO "postgres";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public"
GRANT ALL ON SEQUENCES TO "anon";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public"
GRANT ALL ON SEQUENCES TO "authenticated";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public"
GRANT ALL ON SEQUENCES TO "service_role";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public"
GRANT ALL ON FUNCTIONS TO "postgres";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public"
GRANT ALL ON FUNCTIONS TO "anon";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public"
GRANT ALL ON FUNCTIONS TO "authenticated";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public"
GRANT ALL ON FUNCTIONS TO "service_role";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public"
GRANT ALL ON TABLES TO "postgres";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public"
GRANT ALL ON TABLES TO "anon";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public"
GRANT ALL ON TABLES TO "authenticated";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public"
GRANT ALL ON TABLES TO "service_role";

RESET ALL;
