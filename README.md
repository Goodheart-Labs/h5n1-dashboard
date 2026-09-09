# H5N1 Risk Dashboard (birdflurisk.com)

Launched January 2025 as a live bird-flu risk index built from Polymarket, Kalshi, Metaculus and CDC data.
The markets behind the index closed at the end of 2025 (all resolved No), so since September 2026 the site is
**archived**: a "not currently tracking" notice, the index frozen at the last capture (5 February 2025), and a
list of open markets that still say something about bird flu, refreshed hourly from public APIs.

## Layout

- `src/app/page.tsx` — server-rendered archive page.
- `src/lib/live-markets.ts` — hourly-cached pointers to open Kalshi / Polymarket / Manifold / Metaculus markets.
  Each source fails soft. Metaculus community predictions need a `METACULUS_API_KEY` whose account can see them.
- `src/data/archive/*.json` — frozen series bundled into the page (generated, do not hand-edit).
- `public/archive/raw/` — the raw captures: Wayback Machine snapshots of this site's own API routes
  (8 Jan to 8 Feb 2025) plus current-day pulls from the market APIs.
- `public/archive/data/` — the same frozen series, pretty-printed for download. `manifest.json` has provenance.
- `archive/build.ts` — rebuilds `src/data/archive` and `public/archive/data` from the raw captures
  (`bun archive/build.ts`). Uses the original `combineDataSources` formula and weights.
- `archive/kalshi-pull.ts` — signed Kalshi puller kept for reference; the 2025 markets are no longer served by the API.
- `src/app/api/*` — the original data routes, unused by the page now but left in place.

## Development

```bash
bun install
vercel env pull .env.local   # Kalshi / Metaculus / PostHog keys
bun dev
```

`bun run check` (tsc), `bun run lint`, `bun run build`. Deploys from `main` via Vercel (Goodheart Labs team).
