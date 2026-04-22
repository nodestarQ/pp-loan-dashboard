# pp-loan-dashboard

Pudgy Penguins Huddle Health dashboard. Public view of active loans against the
PPG collection across NFTfi, Arcade, and Blur Blend, plus top holders and a
community goals tracker. Intended to be shared on X/Twitter to rally the
huddle and push active loans down.

## Stack

- SvelteKit (web) in `apps/web`
- Ponder indexer in `apps/indexer`
- Postgres (shared by both)
- Docker Compose wraps everything into one `docker compose up`

## Status

Scaffold phase. Not yet runnable. See the phased build plan in
`/home/nodestarq/.claude/plans/hey-i-want-to-staged-pine.md`.

## Quickstart (will work after phase 14)

```bash
cp .env.example .env
# Fill in PONDER_RPC_URL_1 with your Infura or Alchemy mainnet key.
docker compose up
# Open http://localhost:3000
```
