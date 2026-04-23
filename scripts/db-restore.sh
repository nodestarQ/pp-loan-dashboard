#!/usr/bin/env bash
# Restore a db-backup.sh dump into the compose postgres. Intended for
# seeding a fresh server so the indexer resumes at the snapshot's
# checkpoint instead of backfilling from scratch.
#
# Preconditions:
#   - `docker compose up -d postgres` has been run at least once so
#     init.sh has created the ponder_rw / web_ro roles.
#   - The dump was produced by scripts/db-backup.sh against a compatible
#     Ponder version.
#
# We stop the indexer and web containers for the duration of the restore
# because `--clean` issues DROP TABLE, which needs an AccessExclusiveLock
# and would otherwise block behind open SELECTs / writes. Postgres itself
# stays up.
#
# --no-owner + --role=ponder_rw forces restored objects to be owned by
# ponder_rw regardless of the role the dump was produced under, so the
# web_ro default-privileges grants from init.sh apply.
#
# Usage: scripts/db-restore.sh <dump-file>
set -euo pipefail

DUMP="${1:-}"
if [ -z "$DUMP" ] || [ ! -f "$DUMP" ]; then
	echo "usage: $0 <dump-file>" >&2
	echo "  e.g. $0 backups/huddle-20260423-123456.dump" >&2
	exit 1
fi

cd "$(dirname "$0")/.."

echo "stopping indexer + web so DROP TABLE is not blocked by open locks"
docker compose stop indexer web 2>/dev/null || true

echo "waiting for postgres readiness"
until docker compose exec -T postgres pg_isready -U postgres -d huddle -q; do
	sleep 1
done

echo "restoring $DUMP -> huddle"
docker compose exec -T postgres pg_restore \
	--username=postgres \
	--dbname=huddle \
	--clean \
	--if-exists \
	--no-owner \
	--role=ponder_rw \
	< "$DUMP"

echo
echo "restore complete. bring the app back up with:"
echo "  docker compose up -d"
