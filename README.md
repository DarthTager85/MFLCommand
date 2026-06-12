# 🏈 MFL Command Center

A free, single-page "front office" app for MyFantasyLeague contract/salary-cap dynasty leagues. Every player and rookie pick gets a 0–100 value that shifts between **Win-Now** and **Rebuild** modes, powering a dashboard, roster analysis, trade analyzer (players + picks), targets/sell lists, manager motivation intel, and a full player universe.

## Quick Start

```bash
npm install      # install dependencies
npm run dev      # run locally → http://localhost:5173
npm run build    # production build → dist/
```

Requires Node 18+. No backend, no database, no paid services — everything runs in the browser with localStorage.

## Deploy to Vercel (free)

**Option A — Git repo (recommended):**
1. Push this folder to GitHub.
2. Go to [vercel.com](https://vercel.com), sign up free (Hobby tier), click **Add New → Project**, import the repo.
3. Vercel auto-detects Vite. Click **Deploy**. Done — every git push redeploys.

**Option B — Drag and drop:**
1. Run `npm run build`.
2. Go to vercel.com → Add New → Project → drag the `dist/` folder onto the page.

Both are completely free for personal use.

## Connecting Your League

1. Click the **⚙** gear in the header.
2. Enter your **League ID** — it's the number in your MFL URL: `https://www46.myfantasyleague.com/2026/home/`**`12345`**
3. Set the **Year** and pick **your franchise** from the dropdown.
4. Click **⟳ Refresh** any time to bust the 30-minute cache and re-pull.

If the league is private or the API is unreachable, the app automatically falls back to realistic sample data (and tells you so).

### MFL API tips

- Base URL: `https://api.myfantasyleague.com/{YEAR}/export?TYPE={type}&L={leagueId}&JSON=0`
- Endpoints used: `league`, `rosters`, `leagueStandings`, `assets` (current + future picks), `tradeBait`, `freeAgents`, `players`, `projectedScores`.
- Public leagues need no authentication. Private leagues require a logged-in MFL cookie; easiest fix is to set your league's data to publicly viewable in MFL settings (Setup → General → Privacy).
- MFL rate-limits aggressive polling — the built-in 30-min localStorage cache keeps you well clear.

## How Valuations Work

See `src/lib/valuation.js` (heavily commented). In short:

- **Players:** production score (PPG vs positional elite baseline) × age-curve factor × contract factor (cheap salary + years of control). Age decline is harsh in Rebuild, gentle in Win-Now; contract cheapness matters ~2.3× more in Rebuild.
- **Rookie picks:** tiered chart (1.01–1.03 elite → 3rds), future-year decay (12%/yr Win-Now, 4%/yr Rebuild), then a mode shift — 1sts swing roughly ×0.55 in Win-Now to ×1.40 in Rebuild.
- **Manager motivation:** win% (65%) + points-for rank (35%) → −100 (full teardown) to +100 (all-in). Drives the Targets "buy-low" ⚡ flags and League Intel board.

Tune any of these numbers in `valuation.js` — they're plain constants.

## Customizing Sample Data

Edit `src/data/sampleData.js`. Players use `P(id, name, pos, team, age, ppg, salary, contractYears)`; picks are plain strings like `'1.05'` or `'2027 1st'`.

## Project Structure

```
index.html                 entry page (dark mode)
vite.config.js             Vite + React build config
tailwind.config.js         theme (ink dark palette, mode colors)
src/
  main.jsx, index.css      bootstrap + Tailwind layers
  App.jsx                  shell: settings, data load, mode toggle, tabs
  lib/mflApi.js            MFL XML API client + localStorage cache
  lib/valuation.js         player/pick valuation + motivation engine
  lib/enrich.js            merges raw data into mode-aware view model
  data/sampleData.js       fallback sample league
  components/              Dashboard, Roster, TradeAnalyzer, Targets,
                           LeagueIntel, Universe, shared atoms
```

## Notes

- GM Notes and all settings persist in your browser's localStorage.
- CSV exports are available on the Roster and Universe tabs.
- Valuations are estimates to support your judgment — not a substitute for it.
