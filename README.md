# BindBench

AI binding-affinity screening platform for small biotech labs. Create a screening project, add protein targets and a compound library, and BindBench ranks every candidate by predicted binding affinity using the Boltz-2 model. Results are browsable, filterable, and exportable.

**Live demo:** https://bindbench.vercel.app

Built for the H0 Hackathon (Track 2: Monetizable B2B).

## Features

- Project-based screening workflows with protein targets and compound libraries (CSV import)
- Binding-affinity predictions powered by Boltz-2, with a deterministic mock mode for offline demos
- Background polling of running predictions via a scheduled job
- Ranked results with affinity scores, confidence metrics, and structure data
- Postgres + pgvector storage through Drizzle ORM

## Tech stack

Next.js 16 (App Router) · TypeScript · Tailwind CSS · Drizzle ORM · PostgreSQL with pgvector · Boltz API · Vercel Cron

## Getting started

### Prerequisites

- Node.js 22+
- A Postgres database with the pgvector extension (the free tier of Neon works)

### Setup

```bash
git clone https://github.com/Vrajesh-works/BindBench.git
cd BindBench
npm install
cp .env.example .env.local
# Fill in DATABASE_URL and CRON_SECRET in .env.local
npm run db:migrate
npm run dev
```

Open http://localhost:3000.

### Environment variables

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | Yes | Postgres connection string (needs pgvector) |
| `CRON_SECRET` | Yes | Bearer token protecting `/api/screens/poll` |
| `BOLTZ_MOCK` | No | `true` runs the prediction loop with fake results, no API key needed |
| `BOLTZ_API_KEY` | No | Live Boltz API key (only when `BOLTZ_MOCK=false`) |
| `BOLTZ_BASE_URL` | No | Override the Boltz API base URL |
| `BOLTZ_AUTH_STYLE` | No | `bearer` or `apikey` |
| `NEXT_PUBLIC_PENDO_API_KEY` | No | Enables Pendo analytics in the browser |
| `PENDO_TRACK_EVENT_SECRET` | No | Server-side Pendo event tracking |

## Project structure

```
app/            # Pages and API routes (App Router)
  api/          # REST endpoints: compounds, projects, results, screens
components/     # UI components (shadcn-style, Tailwind)
drizzle/        # SQL migrations; 0001_init.sql is the schema source of truth
lib/            # DB client (lazy, serverless-safe), Boltz client, polling, schema
```

## Deployment

The app deploys to Vercel as-is. Set the environment variables in the Vercel dashboard, run `drizzle/0001_init.sql` once against your database, and deploy. The daily prediction poller is configured in `vercel.json` as a cron job hitting `/api/screens/poll` with `CRON_SECRET`.

## License

MIT
