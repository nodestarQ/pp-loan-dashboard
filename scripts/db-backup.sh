#!/usr/bin/env bash
# Dump Ponder state from the compose postgres to a file that can be
# scp'd to another host and restored with db-restore.sh.
#
# Ponder state lives in two schemas:
#   - public:      holder, loan, _ponder_meta, _ponder_checkpoint
#   - ponder_sync: RPC cache (blocks, logs, transactions) shared across
#                  indexer instances, keyed by (chainId, blockNumber)
#
# We dump both so the target can resume indexing at the same checkpoint
# and reuse the cached RPC responses, skipping the entire historical
# backfill. The `app` schema (goals config) is deliberately excluded so
# each environment keeps its own target values.
#
# pg_dump uses a REPEATABLE READ snapshot, so it is safe to run while
# the indexer is actively writing; the restore will be internally
# consistent as of the snapshot instant.
#
# Usage: scripts/db-backup.sh [output-file]
set -euo pipefail

cd "$(dirname "$0")/.."

OUT="${1:-backups/huddle-$(date +%Y%m%d-%H%M%S).dump}"
mkdir -p "$(dirname "$OUT")"

echo "dumping huddle -> $OUT"
docker compose exec -T postgres pg_dump \
	--username=postgres \
	--dbname=huddle \
	--format=custom \
	--schema=public \
	--schema=ponder_sync \
	> "$OUT"

echo "wrote $OUT ($(du -h "$OUT" | cut -f1))"
