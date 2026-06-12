/**
 * Trade Targets & Sell List — mode-aware recommendations.
 * Targets = assets on OTHER rosters whose value to you (current mode) most exceeds
 *           their value to their current owner's likely strategy.
 * Sells   = YOUR assets worth more to the opposite strategy than to yours.
 */
import React from 'react'
import { PosBadge, ValuePill, SectionTitle } from './shared'

export default function Targets({ model, mode }) {
  const { myTeam, teams, allPlayers, allPicks } = model

  // Owner strategy guess from motivation: contenders value win-now, tankers value rebuild
  const ownerMotivation = {}
  teams.forEach((t) => { ownerMotivation[t.franchise.id] = t.motivation })

  const others = [...allPlayers, ...allPicks].filter((a) => a.franchiseId !== myTeam.franchise.id)

  // Buy-low score: my-mode value, boosted when the owner's strategy mismatches the asset
  const targets = others
    .map((a) => {
      const ownerWantsWinNow = ownerMotivation[a.franchiseId] > 15
      const ownerWantsRebuild = ownerMotivation[a.franchiseId] < -15
      // Asset leans "future" if it's worth more in rebuild terms (valueOther comparison
      // depends on current mode, so normalize):
      const mismatch =
        (ownerWantsWinNow && a.valueOther !== undefined && isFutureAsset(a, mode)) ||
        (ownerWantsRebuild && !isFutureAsset(a, mode))
      return { ...a, score: a.value * (mismatch ? 1.3 : 1), mismatch }
    })
    .sort((x, y) => y.score - x.score)
    .slice(0, 12)

  const sells = [...myTeam.players, ...myTeam.picks]
    .filter((a) => a.valueOther - a.value > 5)
    .sort((x, y) => (y.valueOther - y.value) - (x.valueOther - x.value))
    .slice(0, 10)

  const bait = (model.tradeBait || [])

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <div className="card">
        <SectionTitle sub="Highest-value acquisitions for your strategy; ⚡ = owner's strategy mismatches the asset (buy-low window)">
          🎯 Trade Targets
        </SectionTitle>
        <AssetList items={targets} right={(a) => (
          <span className="flex items-center gap-2">
            {a.mismatch && <span title="Owner likely undervalues this asset">⚡</span>}
            <ValuePill value={a.value} valueOther={a.valueOther} />
          </span>
        )} />
      </div>

      <div className="card">
        <SectionTitle sub="Your assets worth significantly more to teams running the opposite strategy — sell into that demand">
          💰 Sell List
        </SectionTitle>
        {sells.length === 0 && <p className="text-sm text-slate-500">Nothing obvious to sell — your roster aligns with your strategy.</p>}
        <AssetList items={sells} right={(a) => (
          <span className="text-sm">
            <span className="text-slate-500">{a.value}</span>
            <span className="text-emerald-400 font-bold mx-1">→ {a.valueOther}</span>
            <span className="text-xs text-emerald-500">to them</span>
          </span>
        )} />
      </div>
    </div>
  )
}

/** Future-leaning asset = pick, or young player whose rebuild value tops win-now value */
function isFutureAsset(a, mode) {
  if (a.type === 'pick') return true
  const rebuildVal = mode === 'rebuild' ? a.value : a.valueOther
  const winNowVal = mode === 'rebuild' ? a.valueOther : a.value
  return rebuildVal > winNowVal
}

function AssetList({ items, right }) {
  return (
    <div className="space-y-2">
      {items.map((a) => (
        <div key={a.id + (a.franchiseId || '')} className="flex justify-between items-center bg-ink-800 rounded-lg px-3 py-2 border border-ink-700">
          <span className="text-sm flex items-center gap-2">
            <PosBadge position={a.position} />
            <span className="text-white font-medium">{a.name}</span>
            <span className="text-xs text-slate-500">{a.franchiseName || a.tier || ''}</span>
          </span>
          {right(a)}
        </div>
      ))}
    </div>
  )
}
