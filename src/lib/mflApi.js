/**
 * MFL API client — official MyFantasyLeague XML export API.
 * Base: https://api.myfantasyleague.com/{YEAR}/export?TYPE=...&L={LEAGUE_ID}&JSON=0
 *
 * Requests go through a relative /mfl/* path which is proxied to
 * api.myfantasyleague.com by the Vite dev server (vite.config.js) locally and
 * by Vercel (vercel.json) in production — this avoids browser CORS blocks.
 *
 * Responses are cached in localStorage (30 min TTL); "Refresh Data" busts it.
 */

const CACHE_PREFIX = 'mflcc:'
const CACHE_TTL_MS = 1000 * 60 * 30 // 30 min

function cacheKey(year, leagueId, type) {
  return `${CACHE_PREFIX}${year}:${leagueId}:${type}`
}

export function clearCache(year, leagueId) {
  Object.keys(localStorage)
    .filter((k) => k.startsWith(`${CACHE_PREFIX}${year}:${leagueId}:`))
    .forEach((k) => localStorage.removeItem(k))
}

async function fetchXml(year, leagueId, type, extraParams = {}, { force = false, apiKey = '' } = {}) {
  const key = cacheKey(year, leagueId, type + JSON.stringify(extraParams))
  if (!force) {
    try {
      const cached = JSON.parse(localStorage.getItem(key) || 'null')
      if (cached && Date.now() - cached.t < CACHE_TTL_MS) {
        return new DOMParser().parseFromString(cached.xml, 'text/xml')
      }
    } catch { /* ignore bad cache */ }
  }
  const params = new URLSearchParams({ TYPE: type, L: leagueId, JSON: '0', ...extraParams })
  if (apiKey) params.set('APIKEY', apiKey) // required for private leagues
  // Relative /mfl path → proxied to api.myfantasyleague.com (see header comment)
  const url = `/mfl/${year}/export?${params}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`MFL ${type} request failed (${res.status})`)
  const text = await res.text()
  const doc = new DOMParser().parseFromString(text, 'text/xml')
  if (doc.querySelector('error')) {
    throw new Error(`MFL error: ${doc.querySelector('error').textContent}`)
  }
  try { localStorage.setItem(key, JSON.stringify({ t: Date.now(), xml: text })) } catch { /* quota */ }
  return doc
}

const attr = (el, name) => el?.getAttribute(name) ?? ''

/** league: franchise names, roster sizes, salary cap settings */
export async function getLeague(year, leagueId, opts) {
  const doc = await fetchXml(year, leagueId, 'league', {}, opts)
  const league = doc.querySelector('league')
  return {
    name: attr(league, 'name'),
    salaryCapAmount: parseFloat(attr(league, 'salaryCapAmount')) || 0,
    rosterSize: parseInt(attr(league, 'rosterSize')) || 0,
    franchises: [...doc.querySelectorAll('franchise')].map((f) => ({
      id: attr(f, 'id'),
      name: attr(f, 'name'),
      owner: attr(f, 'owner_name'),
      icon: attr(f, 'icon'),
    })),
  }
}

/** rosters: players per franchise with salary + contract info */
export async function getRosters(year, leagueId, opts) {
  const doc = await fetchXml(year, leagueId, 'rosters', {}, opts)
  return [...doc.querySelectorAll('franchise')].map((f) => ({
    franchiseId: attr(f, 'id'),
    players: [...f.querySelectorAll('player')].map((p) => ({
      id: attr(p, 'id'),
      status: attr(p, 'status'),
      salary: parseFloat(attr(p, 'salary')) || 0,
      contractYear: attr(p, 'contractYear'),
      contractInfo: attr(p, 'contractInfo'),
    })),
  }))
}

/** leagueStandings: W-L, points for, etc. — drives motivation scoring */
export async function getStandings(year, leagueId, opts) {
  const doc = await fetchXml(year, leagueId, 'leagueStandings', {}, opts)
  return [...doc.querySelectorAll('franchise')].map((f) => ({
    franchiseId: attr(f, 'id'),
    wins: parseInt(attr(f, 'h2hw')) || 0,
    losses: parseInt(attr(f, 'h2hl')) || 0,
    ties: parseInt(attr(f, 'h2ht')) || 0,
    pointsFor: parseFloat(attr(f, 'pf')) || 0,
    pointsAgainst: parseFloat(attr(f, 'pa')) || 0,
  }))
}

/** assets: includes current + future draft picks per franchise */
export async function getAssets(year, leagueId, opts) {
  const doc = await fetchXml(year, leagueId, 'assets', {}, opts)
  return [...doc.querySelectorAll('franchise')].map((f) => ({
    franchiseId: attr(f, 'id'),
    futurePicks: [...f.querySelectorAll('futureYearDraftPicks draftPick')].map((p) =>
      attr(p, 'pick'),
    ),
    currentPicks: [...f.querySelectorAll('currentYearDraftPicks draftPick')].map((p) =>
      attr(p, 'pick'),
    ),
  }))
}

/** tradeBait: what other managers have listed as available */
export async function getTradeBait(year, leagueId, opts) {
  const doc = await fetchXml(year, leagueId, 'tradeBait', {}, opts)
  return [...doc.querySelectorAll('tradeBait')].map((t) => ({
    franchiseId: attr(t, 'franchise_id'),
    willGiveUp: (attr(t, 'willGiveUp') || '').split(',').filter(Boolean),
    inExchangeFor: t.querySelector('comments')?.textContent || '',
  }))
}

/** freeAgents */
export async function getFreeAgents(year, leagueId, opts) {
  const doc = await fetchXml(year, leagueId, 'freeAgents', {}, opts)
  return [...doc.querySelectorAll('player')].map((p) => ({ id: attr(p, 'id') }))
}

/** players: id → name/position/team database (shared across leagues) */
export async function getPlayers(year, leagueId, opts) {
  const doc = await fetchXml(year, leagueId, 'players', { DETAILS: '0' }, opts)
  const map = {}
  ;[...doc.querySelectorAll('player')].forEach((p) => {
    map[attr(p, 'id')] = {
      id: attr(p, 'id'),
      name: attr(p, 'name'), // "Last, First"
      position: attr(p, 'position'),
      team: attr(p, 'team'),
    }
  })
  return map
}

/** projectedScores for a week (or season via AVG) */
export async function getProjectedScores(year, leagueId, week, opts) {
  const doc = await fetchXml(year, leagueId, 'projectedScores', { W: week || '' }, opts)
  const map = {}
  ;[...doc.querySelectorAll('playerScore')].forEach((p) => {
    map[attr(p, 'id')] = parseFloat(attr(p, 'score')) || 0
  })
  return map
}

/** Pull everything the app needs in parallel. Throws on failure → caller falls back to sample. */
export async function loadLeagueData(year, leagueId, { force = false, apiKey = '' } = {}) {
  const opts = { force, apiKey }
  const [league, rosters, standings, assets, tradeBait, players] = await Promise.all([
    getLeague(year, leagueId, opts),
    getRosters(year, leagueId, opts),
    getStandings(year, leagueId, opts),
    getAssets(year, leagueId, opts),
    getTradeBait(year, leagueId, opts).catch(() => []),
    getPlayers(year, leagueId, opts),
  ])
  return { league, rosters, standings, assets, tradeBait, players, source: 'live', loadedAt: Date.now() }
}
