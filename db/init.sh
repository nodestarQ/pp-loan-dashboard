#!/bin/bash
# Bootstraps the Huddle Health Postgres instance.
#
# Runs once via the postgres image's /docker-entrypoint-initdb.d convention.
# Creates two least-privilege roles (ponder_rw, web_ro), the app schema
# holding the configurable goals tracker target, and default privileges
# so Ponder's tables created later are automatically SELECT-able by
# web_ro without a follow-up migration.
set -euo pipefail

: "${PONDER_DB_PASSWORD:?PONDER_DB_PASSWORD must be set for the init script}"
: "${WEB_DB_PASSWORD:?WEB_DB_PASSWORD must be set for the init script}"

psql -v ON_ERROR_STOP=1 \
	--username "$POSTGRES_USER" \
	--dbname "$POSTGRES_DB" <<-SQL
	CREATE ROLE ponder_rw LOGIN PASSWORD '${PONDER_DB_PASSWORD}';
	CREATE ROLE web_ro LOGIN PASSWORD '${WEB_DB_PASSWORD}';

	GRANT ALL PRIVILEGES ON DATABASE "${POSTGRES_DB}" TO ponder_rw;
	GRANT CONNECT ON DATABASE "${POSTGRES_DB}" TO web_ro;

	GRANT USAGE, CREATE ON SCHEMA public TO ponder_rw;
	GRANT USAGE ON SCHEMA public TO web_ro;

	CREATE SCHEMA IF NOT EXISTS app AUTHORIZATION ponder_rw;
	GRANT USAGE ON SCHEMA app TO web_ro;
	GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA app TO web_ro;
	ALTER DEFAULT PRIVILEGES IN SCHEMA app
		GRANT SELECT, INSERT, UPDATE ON TABLES TO web_ro;

	CREATE TABLE IF NOT EXISTS app.goals (
		id TEXT PRIMARY KEY,
		target INTEGER NOT NULL,
		updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
	);
	GRANT SELECT, INSERT, UPDATE ON app.goals TO web_ro;

	INSERT INTO app.goals (id, target)
	VALUES ('active_loans', 100)
	ON CONFLICT (id) DO NOTHING;

	-- OpenSea profile cache. Keyed by lowercase address to match how Ponder's
	-- t.hex() stores addresses in public.holder / public.loan, so the web app
	-- does not need per-row case normalisation when looking up rows. A row
	-- with display columns all null but a fresh resolved_at means "OpenSea
	-- confirmed no profile" — that negative result is cached so we do not
	-- re-hit the rate-limited API for 24h.
	CREATE TABLE IF NOT EXISTS app.profile (
		address TEXT PRIMARY KEY,
		username TEXT,
		pfp_url TEXT,
		twitter TEXT,
		resolved_at TIMESTAMPTZ NOT NULL
	);
	GRANT SELECT, INSERT, UPDATE ON app.profile TO web_ro;

	-- When ponder_rw creates tables in the public schema later, web_ro
	-- automatically gets SELECT via default privileges. This avoids a
	-- second migration step once the indexer runs its first backfill.
	ALTER DEFAULT PRIVILEGES FOR ROLE ponder_rw IN SCHEMA public
		GRANT SELECT ON TABLES TO web_ro;
SQL
