# pp-loan-dashboard

Pudgy Penguins Huddle Health dashboard. Public view of active loans
against the PPG collection across NFTfi, Arcade, and Blur Blend, plus
top holders and a community goals tracker. Intended to be shared on X
to rally the huddle and push active loans down.

## Stack

- **SvelteKit 2 / Svelte 5** web app in `apps/web`, adapter-node + Tailwind v4 + Nunito
- **Ponder** indexer in `apps/indexer`, Postgres-backed, TypeScript handlers
- **Postgres 16** shared by both, with role-separated connection credentials
- **Docker Compose** wraps all three onto an internal network, only the web port is published to the host

```
 host :3000
     |
     v
 +-------+       +---------+       +-----------+
 |  web  | <---> |  redis? | <---> |  indexer  |   (mainnet RPC)
 +---+---+  internal net: huddle_net  +-----+---+
     |                                        |
     +------------> +------------+  <---------+
                    |  postgres  |
                    +------------+
```

(Redis is not used; the arrow above is a placeholder for the planned
durable ENS cache that currently lives in the web container's memory.)

## Prerequisites

- Docker + Docker Compose v2
- An Ethereum mainnet JSON-RPC URL (Infura / Alchemy / your own node).
  Needs archive-node access for historical event scans.
- ~5 GB free disk for the Postgres volume (PPG Transfer backfill is
  the largest contributor).

## Setup

```bash
cp .env.example .env
# Fill in at minimum:
#   PONDER_RPC_URL_1        (mainnet RPC URL)
#   POSTGRES_PASSWORD       (any value)
#   PONDER_DB_PASSWORD      (any value)
#   WEB_DB_PASSWORD         (any value)

docker compose up --build
```

First run: Postgres boots, `db/init.sh` provisions roles + `app.goals`,
the indexer begins historical backfill. Expect 20 to 60 minutes before
all four contracts (PPG Transfer, NFTfi v2 + v2.3, Arcade v3, Blur
Blend) are caught up.

During backfill the dashboard renders a mustard banner at the top
("Syncing. Caught up to block X") that clears automatically once the
indexer reports ready.

Open http://localhost:3000.

## How the stack talks

- **web** talks only to **postgres** (as `web_ro`, SELECT-only on
  Ponder tables) and to **indexer** (intra-compose HTTP for sync
  status). The web container has no Ethereum RPC credentials.
- **indexer** talks to **postgres** (as `ponder_rw`) and to the
  mainnet RPC at `PONDER_RPC_URL_1`. The RPC URL exists nowhere else
  in the stack.
- Browsers talk only to **web**. `/api/sync-status` proxies the
  indexer's status so the indexer port never needs to be exposed.

## Repo layout

```
pp-loan-dashboard/
├── apps/
│   ├── web/                      SvelteKit app
│   └── indexer/                  Ponder app
├── packages/
│   └── shared/                   Contract addresses, protocol enum, constants
├── db/
│   └── init.sh                   Postgres bootstrap (roles + app schema)
├── docker-compose.yml
├── .env.example
└── pnpm-workspace.yaml
```

## Local development without Docker

The stack is Docker-first, but individual pieces run standalone:

```bash
pnpm install

# Run the indexer against a local Postgres
PONDER_RPC_URL_1=https://... DATABASE_URL=postgres://... pnpm --filter @pp/indexer dev

# Run the web app
DATABASE_URL=postgres://... PUBLIC_GOAL_TARGET=100 pnpm --filter @pp/web dev
```

The web app is defensive: if Postgres is unreachable, every query logs
a warning and returns a safe fallback, so the dashboard still renders.

## Verification checklist

Run through this after a fresh clone + `docker compose up` to confirm
the stack is healthy end-to-end.

1. **Clean boot.** Postgres, indexer, and web all reach `healthy` in
   `docker compose ps`.
2. **Syncing UX.** Banner shows a non-zero indexed block that advances
   every few seconds during backfill. Once caught up, banner clears
   and the dashboard renders loan counts.
3. **Data sanity.**
   - Top-holder #1 matches the PPG holders tab on Etherscan.
   - A known-active NFTfi PPG loan from nftfi.com appears in the top
     loan addresses panel with the right count.
   - Active loan total is within ~2% of a Dune query that unions
     NFTfi + Arcade + Blend loans for PPG.
4. **Secret containment.**
   ```bash
   docker compose exec web env | grep -i infura
   # (expect empty)
   docker compose exec web env | grep PONDER_RPC_URL_1
   # (expect empty)
   ```
   Also view-source on the page: no RPC URLs should appear.
5. **Mobile layout.** DevTools mobile viewport: single column stack.
   Desktop (>= 768px): two-column grid with meter + goal left,
   leaderboards right. Meter, goal bar, and leaderboards all readable
   at iPhone SE width.
6. **Rate limit.** Hammer `/api/sync-status` more than 10 times in 60
   seconds from one IP and observe 429 responses with a Retry-After
   header.
7. **Graceful degradation.**
   ```bash
   docker compose stop indexer
   # Dashboard still renders using last-known Postgres data; banner
   # flips to "Indexer offline".
   ```

## Out of scope for v1

Lil Pudgys, Pudgy Rods, Gondi, MetaStreet, a persistent ENS cache
table, bonk-a-bear mechanics, user auth, admin panel, tweet-bot
automation, on-chain goal voting, dark mode, historical charts, wallet
connect, notifications.

## Known risks to watch

- First-boot Ponder backfill on four contracts via one RPC key can
  take up to an hour. Consider a second free RPC and tuning
  `maxRequestsPerSecond` if Infura rate limits.
- NFTfi v2 has more loan-type variants (FixedCollection, ProRata) that
  could be added to `apps/indexer/abis/nftfi.ts` if PPG coverage needs
  to approach 100%.
- Arcade v4 is not yet on mainnet per the arcadexyz/arcade-protocol
  README. When it ships, add its LoanCore address to
  `packages/shared/src/index.ts` and register a second contract in
  `ponder.config.ts`.
- Blur Blend refinance chains are treated as one continuous loan (only
  the lender changes). Close + reopen would inflate the active count.
- PPG supply is hardcoded to 8888 in `@pp/shared`. Verify no burns
  before shipping, otherwise the meter denominator is wrong.

## License

MIT. Not affiliated with Pudgy Penguins, NFTfi, Arcade, or Blur.
