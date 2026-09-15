# NFL Survivor Pool

A multiplayer NFL Survivor pool planner with live betting odds.

## What It Is

Each week, every player picks one NFL team to win. If your team wins, you survive. If it loses or ties, you're eliminated. You can never pick the same team twice all season. Weeks 9, 12, 13, 14, 15, and 16 require **two** picks — both must win.

## Running Locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

Copy `.env.example` to `.env.local` and fill in the values:

```bash
cp .env.example .env.local
```

### Odds API Key

1. Sign up at [https://the-odds-api.com](https://the-odds-api.com) (free tier: 500 requests/month)
2. Copy your API key
3. Add it to `.env.local`:
   ```
   ODDS_API_KEY=your_actual_key_here
   ```

> **Note:** Phase 1 runs entirely on seed data — you don't need the Odds API key yet. It's required for Phase 2 (live odds).

### Supabase (Phase 3)

Create a free project at [https://supabase.com](https://supabase.com), then add:
```
NEXT_PUBLIC_SUPABASE_URL=https://yourproject.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Running Tests

```bash
npm test
```

Tests cover:
- Pick validation rules (used teams, bye weeks, double-pick weeks, slot conflicts)
- Win probability math (spread → win%, moneyline → win%)

## Deploying to Vercel

1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com) → New Project → import your repo
3. Add environment variables in the Vercel dashboard (Settings → Environment Variables):
   - `ODDS_API_KEY` (Phase 2)
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (Phase 3)
4. Deploy

## Phase Roadmap

| Phase | What's built |
|-------|-------------|
| **1 — Static core** ✅ | Next.js project, seed data, pick board, rule enforcement, win% math, schedule grid |
| **2 — Live odds** | Wire up The Odds API server-side, caching, "odds as of" indicator |
| **3 — Multiplayer** | Supabase DB, player identity (name + token), leaderboard/standings |
| **4 — Results** | Auto-grade picks from scores API, elimination tracking |
| **5 — Polish** | Suggested plan algorithm, CSV export, legend/help, PWA |
