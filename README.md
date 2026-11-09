# sf26-agenda

Unofficial, phone-first agenda for Current SF 2026, served by a Cloudflare Worker.

An hourly cron fetches the Sessionboard feed, keeps an allowlist of fields (`src/trim.ts`) and stores the result in KV.

## Run locally

```sh
npm install
npm run dev        # http://127.0.0.1:8787
npm test
```

`.dev.vars` (gitignored, never deployed) holds `DEMO_SCHEDULE=1`, which gives every session a made-up time and room so the schedule views have something to show. With it set, a banner at the top switches demo mode on and off (`?demo=0` / `?demo=1`, remembered in a cookie) so you can compare against the real feed without restarting.

In demo mode, add `?now=2026-11-04T14:50` (Pacific time) to fake the clock, so the Now button and the "on now" highlights have something to point at.

Trigger the cron locally: `curl 'http://127.0.0.1:8787/__scheduled?cron=17+*+*+*+*'`

## Deploy

```sh
CLOUDFLARE_API_TOKEN=$(cat ~/.config/cloudflare/sf26-token) npx wrangler deploy
```

The token file (chmod 600, never committed) holds a Cloudflare API token for this account.

The account, KV namespace and custom domain (sf26.rmoff.net) are set in `wrangler.jsonc`. KV stays empty until the first cron run at 17 minutes past the hour.

## Licence

MIT (see `LICENSE`). The Overpass fonts in `public/fonts/` are under the SIL Open Font License (`public/fonts/OFL.txt`).
