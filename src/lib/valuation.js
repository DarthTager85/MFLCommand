/**
 * Valuation engine — the heart of the Command Center.
 *
 * Every asset (player or pick) gets a 0–100 "dynasty value" that shifts with
 * the selected strategy mode:
 *
 *   WIN-NOW:   value = production-weighted. Current PPG dominates; age penalty
 *              softens for ages 26–30 (prime producers); contract cheapness
 *              matters less; rookie picks discounted ~35–55%.
 *
 *   REBUILD:   value = future-weighted. Age curve dominates (peak value at
 *              21–24); contract length and cheapness boosted; rookie picks get
 *              a 25–45% premium; aging producers heavily discounted.
 *
 * Core player formula (documented inline below):
 *   base       = positional baseline from production score (0–100 scale)
 *   ageFactor  = mode-specific multiplier from the age curve for the position
 *   contractF  = bonus for cheap salary relative to positional market +
 *                years of team control remaining
 *   value      = clamp(base * ageFactor * contractF, 0, 100)
 *
 * Pick formula:
 *   baseTier   = tiered chart (1.01–1.03 elite, mid 1sts, late 1sts, 2nds, 3rds+)
 *   yearDecay  = future picks discounted ~12%/yr in Win-Now, only ~4%/yr in
 *                Rebuild (future capital is the whole point of a rebuild)
 *   modeShift  = ×0.55–0.75 Win-Now, ×1.25–1.45 Rebuild (earlier picks shift more)
 */

export const MODES = { WIN_NOW: 'win-now', REBUILD: 'rebuild' }

// ----- Age curves: [peakStart, peakEnd, declinePerYearAfterPeak, riseDiscountBeforePeak]
const AGE_CURVES = {
  QB: { peak: [25, 33], decline: 0.05, young: 0.02 },
  RB: { peak: [22, 26], decline: 0.13, young: 0.03 },
  WR: { peak: [23, 28], decline: 0.09, young: 0.02 },
  TE: { peak: [24, 29], decline: 0.08, young: 0.03 },
  PK: { peak: [24, 36], decline: 0.03, young: 0.01 },
  DEF: { peak: [0, 99], decline: 0, young: 0 },
}

function ageFactor(position, age, mode) {
  const c = AGE_CURVES[position] || AGE_CURVES.WR
  if (!age) return 1
  let f = 1
  if (age < c.peak[0]) {
    // Pre-peak: slight discount in Win-Now (not producing yet), premium in Rebuild
    const yearsOut = c.peak[0] - age
    f = mode === MODES.REBUILD ? 1 + 0.04 * yearsOut : 1 - c.young * yearsOut
  } else if (age > c.peak[1]) {
    const yearsPast = age - c.peak[1]
    // Decline is brutal in Rebuild (asset depreciating), gentler in Win-Now
    const declineRate = mode === MODES.REBUILD ? c.decline * 1.8 : c.decline * 0.7
    f = Math.max(0.15, 1 - declineRate * yearsPast)
  }
  return f
}

/**
 * Contract factor: cheap long contracts are gold in Rebuild, mildly nice in Win-Now.
 * salaryPctOfCap: player salary / league cap. yearsLeft: contract years remaining.
 */
function contractFactor(salaryPctOfCap, yearsLeft, mode) {
  const cheapness = Math.max(0, 0.12 - (salaryPctOfCap || 0.05)) * 4 // 0..~0.4
  const control = Math.min(yearsLeft || 1, 4) / 4 // 0.25..1
  const weight = mode === MODES.REBUILD ? 0.35 : 0.15
  return 1 + weight * (cheapness + control * 0.5)
}

/** Production score 0–100 from projected/actual PPG, normalized per position. */
const POS_PPG_ELITE = { QB: 24, RB: 18, WR: 17, TE: 13, PK: 9, DEF: 10 }
export function productionScore(position, ppg) {
  const elite = POS_PPG_ELITE[position] || 15
  return Math.min(100, Math.max(0, (ppg / elite) * 100))
}

/** Main player valuation. player: {position, age, ppg, salaryPctOfCap, contractYears} */
export function playerValue(player, mode) {
  const base = productionScore(player.position, player.ppg ?? 0)
  const v =
    base *
    ageFactor(player.position, player.age, mode) *
    contractFactor(player.salaryPctOfCap, player.contractYears, mode)
  return Math.round(Math.min(100, Math.max(1, v)) * 10) / 10
}

// ---------------------------------------------------------------- Rookie picks

/** Tiered base chart (neutral baseline, 12-team league). Pick = round.slot e.g. "1.01" */
const PICK_TIERS = [
  { match: (r, s) => r === 1 && s <= 3, base: 78, label: 'Elite 1st' },
  { match: (r, s) => r === 1 && s <= 6, base: 62, label: 'Early 1st' },
  { match: (r, s) => r === 1 && s <= 9, base: 50, label: 'Mid 1st' },
  { match: (r) => r === 1, base: 40, label: 'Late 1st' },
  { match: (r, s) => r === 2 && s <= 6, base: 28, label: 'Early 2nd' },
  { match: (r) => r === 2, base: 20, label: 'Late 2nd' },
  { match: (r) => r === 3, base: 10, label: '3rd' },
  { match: () => true, base: 4, label: 'Day 3' },
]

/**
 * pickValue("2027 1.05", mode, currentYear)
 * Unknown-slot future picks ("2027 1st") assume mid-round slot.
 */
export function pickValue(pickStr, mode, currentYear = new Date().getFullYear()) {
  const parsed = parsePick(pickStr)
  if (!parsed) return { value: 0, label: 'Unknown', parsed: null }
  const { year, round, slot } = parsed
  const tier = PICK_TIERS.find((t) => t.match(round, slot ?? 6))
  let v = tier.base

  // Future-year decay: distant picks are lottery tickets in Win-Now, core assets in Rebuild
  const yearsOut = Math.max(0, year - currentYear)
  const decay = mode === MODES.REBUILD ? 0.04 : 0.12
  v *= Math.pow(1 - decay, yearsOut)

  // Mode shift: earlier picks swing harder between modes
  const swing = round === 1 ? 0.45 : round === 2 ? 0.3 : 0.2
  v *= mode === MODES.REBUILD ? 1 + swing * 0.9 : 1 - swing

  return { value: Math.round(v * 10) / 10, label: `${tier.label} (${year})`, parsed }
}

/** Accepts "2026 1.01", "1.01", "2027 2nd", "Round 1 Pick 5", MFL "FP_0005_2027_1" formats */
export function parsePick(str) {
  if (!str) return null
  const s = String(str).trim()
  // MFL futureYearDraftPicks format: FP_<franchise>_<year>_<round>
  let m = s.match(/^FP_\d+_(\d{4})_(\d+)$/i)
  if (m) return { year: +m[1], round: +m[2], slot: null, display: `${m[1]} Round ${m[2]}` }
  // MFL currentYearDraftPicks: DP_<round0idx>_<pick0idx>
  m = s.match(/^DP_(\d+)_(\d+)$/i)
  if (m) {
    const round = +m[1] + 1, slot = +m[2] + 1
    return { year: new Date().getFullYear(), round, slot, display: `${round}.${String(slot).padStart(2, '0')}` }
  }
  // "2026 1.01" or "1.01"
  m = s.match(/^(?:(\d{4})\s+)?(\d+)\.(\d+)$/)
  if (m) {
    const year = m[1] ? +m[1] : new Date().getFullYear()
    return { year, round: +m[2], slot: +m[3], display: `${year} ${+m[2]}.${String(+m[3]).padStart(2, '0')}` }
  }
  // "2027 1st" / "2027 2nd"
  m = s.match(/^(\d{4})\s+(\d+)(?:st|nd|rd|th)$/i)
  if (m) return { year: +m[1], round: +m[2], slot: null, display: `${m[1]} Round ${m[2]}` }
  return null
}

// ------------------------------------------------------- Manager motivation

/**
 * Motivation score: how likely is each manager to deal, and in which direction?
 * Contenders (high win%) want Win-Now pieces → will pay up with picks.
 * Cellar-dwellers want picks/youth → will sell veterans.
 * Returns -100 (full rebuild seller) .. +100 (all-in contender buyer).
 */
export function motivationScore(standing, totalTeams) {
  const games = standing.wins + standing.losses + standing.ties || 1
  const winPct = (standing.wins + standing.ties * 0.5) / games
  const pfRank = standing.pfRank ?? totalTeams / 2
  const pfSignal = 1 - (pfRank - 1) / Math.max(1, totalTeams - 1) // 1 = top scorer
  return Math.round((winPct * 0.65 + pfSignal * 0.35) * 200 - 100)
}

export function motivationLabel(score) {
  if (score >= 50) return { text: 'All-In Contender', color: 'text-winnow', hint: 'Buying veterans, will overpay with picks' }
  if (score >= 15) return { text: 'Fringe Contender', color: 'text-amber-300', hint: 'Buying selectively' }
  if (score >= -15) return { text: 'On the Fence', color: 'text-slate-400', hint: 'Could tip either way — watch closely' }
  if (score >= -50) return { text: 'Soft Rebuild', color: 'text-violet-300', hint: 'Selling vets for value' }
  return { text: 'Full Teardown', color: 'text-rebuild', hint: 'Will dump anyone over 26 for picks' }
}

/** Simple trade fairness: sum values per side, report delta + verdict */
export function evaluateTrade(sideA, sideB) {
  const totalA = sideA.reduce((s, a) => s + a.value, 0)
  const totalB = sideB.reduce((s, b) => s + b.value, 0)
  const delta = totalA - totalB
  const pct = totalA + totalB > 0 ? Math.abs(delta) / ((totalA + totalB) / 2) : 0
  let verdict
  if (pct < 0.08) verdict = 'Fair deal'
  else if (delta > 0) verdict = pct > 0.25 ? 'You win big' : 'Slight win for you'
  else verdict = pct > 0.25 ? 'You lose big' : 'Slight loss for you'
  return { totalA: r1(totalA), totalB: r1(totalB), delta: r1(delta), verdict }
}
const r1 = (n) => Math.round(n * 10) / 10
