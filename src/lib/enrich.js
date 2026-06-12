/**
 * Enrichment layer: merges raw MFL data (or sample data) into app-ready,
 * mode-aware objects. All views consume the output of buildModel().
 */
import { playerValue, pickValue, motivationScore, motivationLabel, MODES } from './valuation'

const AGE_GUESS = { QB: 27, RB: 25, WR: 26, TE: 27, PK: 29, DEF: 0 }

/** Build one enriched player from roster entry + player DB */
function enrichPlayer(entry, db, cap, mode) {
  const info = db[entry.id] || {}
  const age = info.age ?? AGE_GUESS[info.position] ?? 26
  const ppg = info.ppg ?? 8 // when live projections aren't loaded, neutral baseline
  const contractYears = parseInt(entry.contractYear) || info.contractYears || 1
  const salary = entry.salary ?? info.salary ?? 0
  const p = {
    id: entry.id,
    type: 'player',
    name: info.name || `Player #${entry.id}`,
    position: info.position || '?',
    team: info.team || '',
    age, ppg, salary, contractYears,
    salaryPctOfCap: cap ? salary / cap : 0.05,
  }
  p.value = playerValue(p, mode)
  p.valueOther = playerValue(p, mode === MODES.WIN_NOW ? MODES.REBUILD : MODES.WIN_NOW)
  return p
}

function enrichPick(pickStr, mode, year) {
  const { value, label, parsed } = pickValue(pickStr, mode, year)
  const other = pickValue(pickStr, mode === MODES.WIN_NOW ? MODES.REBUILD : MODES.WIN_NOW, year)
  return {
    id: `pick:${pickStr}`,
    type: 'pick',
    name: parsed?.display || pickStr,
    position: 'PICK',
    tier: label,
    value,
    valueOther: other.value,
  }
}

/**
 * buildModel(data, mode, myFranchiseId, year) →
 * { teams: [{franchise, standing, players, picks, totalValue, capUsed, motivation}],
 *   myTeam, players (all enriched), picks (all enriched), freeAgents }
 */
export function buildModel(data, mode, myFranchiseId, year) {
  const cap = data.league.salaryCapAmount || 200
  const n = data.league.franchises.length

  // points-for ranks for motivation signal
  const sortedPF = [...data.standings].sort((a, b) => b.pointsFor - a.pointsFor)
  const pfRank = {}
  sortedPF.forEach((s, i) => { pfRank[s.franchiseId] = i + 1 })

  const standingsById = {}
  data.standings.forEach((s) => { standingsById[s.franchiseId] = { ...s, pfRank: pfRank[s.franchiseId] } })
  const assetsById = {}
  ;(data.assets || []).forEach((a) => { assetsById[a.franchiseId] = a })

  const teams = data.league.franchises.map((f) => {
    const rosterEntry = (data.rosters || []).find((r) => r.franchiseId === f.id)
    const players = (rosterEntry?.players || []).map((p) => enrichPlayer(p, data.players, cap, mode))
      .sort((a, b) => b.value - a.value)
    const a = assetsById[f.id] || { currentPicks: [], futurePicks: [] }
    const picks = [...(a.currentPicks || []), ...(a.futurePicks || [])]
      .map((p) => enrichPick(p, mode, year)).sort((x, y) => y.value - x.value)
    const standing = standingsById[f.id] || { wins: 0, losses: 0, ties: 0, pointsFor: 0, pfRank: n }
    const mot = motivationScore(standing, n)
    return {
      franchise: f,
      standing,
      players,
      picks,
      capUsed: players.reduce((s, p) => s + p.salary, 0),
      cap,
      totalValue: Math.round(players.reduce((s, p) => s + p.value, 0) + picks.reduce((s, p) => s + p.value, 0)),
      motivation: mot,
      motivationInfo: motivationLabel(mot),
    }
  })

  const myTeam = teams.find((t) => t.franchise.id === myFranchiseId) || teams[0]
  const allPlayers = teams.flatMap((t) => t.players.map((p) => ({ ...p, franchiseId: t.franchise.id, franchiseName: t.franchise.name })))
  const allPicks = teams.flatMap((t) => t.picks.map((p) => ({ ...p, franchiseId: t.franchise.id, franchiseName: t.franchise.name })))

  const freeAgents = (data.freeAgents || [])
    .map((fa) => enrichPlayer({ id: fa.id, salary: 0 }, data.players, cap, mode))
    .filter((p) => p.name !== `Player #${p.id}`)
    .sort((a, b) => b.value - a.value)

  return { teams: teams.sort((a, b) => b.totalValue - a.totalValue), myTeam, allPlayers, allPicks, freeAgents, cap }
}
