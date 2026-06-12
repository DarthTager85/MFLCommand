/** Trade Analyzer — build both sides with players AND picks, get a verdict. */
import React, { useMemo, useState } from 'react'
import { PosBadge, SectionTitle } from './shared'
import { evaluateTrade, pickValue } from '../lib/valuation'

export default function TradeAnalyzer({ model, mode, year }) {
  const [sideA, setSideA] = useState([]) // assets I give
  const [sideB, setSideB] = useState([]) // assets I get
  const [queryA, setQueryA] = useState('')
  const [queryB, setQueryB] = useState('')

  const pool = useMemo(() => [...model.allPlayers, ...model.allPicks], [model])

  const result = useMemo(
    () => (sideA.length || sideB.length ? evaluateTrade(sideB, sideA) : null), // B = incoming, A = outgoing
    [sideA, sideB],
  )

  return (
    <div className="space-y-6">
      <div className="grid lg:grid-cols-2 gap-6">
        <TradeSide
          title="You Send" tint="rose" items={sideA} setItems={setSideA}
          query={queryA} setQuery={setQueryA} pool={pool} mode={mode} year={year}
          exclude={sideB}
        />
        <TradeSide
          title="You Receive" tint="emerald" items={sideB} setItems={setSideB}
          query={queryB} setQuery={setQueryB} pool={pool} mode={mode} year={year}
          exclude={sideA}
        />
      </div>

      {result && (
        <div className="card text-center">
          <div className="text-sm text-slate-400 mb-1">
            Incoming {result.totalA} vs Outgoing {result.totalB} (Δ {result.delta > 0 ? '+' : ''}{result.delta})
          </div>
          <div className={`text-2xl font-bold ${
            result.verdict.includes('win') ? 'text-emerald-400'
            : result.verdict.includes('lose') ? 'text-rose-400' : 'text-accent'}`}>
            {result.verdict}
          </div>
          <ValueBar a={result.totalA} b={result.totalB} />
          <p className="text-xs text-slate-500 mt-2">
            Values reflect your current strategy mode — flip the toggle to see the deal through the other GM's eyes.
          </p>
        </div>
      )}
    </div>
  )
}

function ValueBar({ a, b }) {
  const total = a + b || 1
  return (
    <div className="h-3 rounded-full overflow-hidden bg-ink-700 flex mt-3 max-w-md mx-auto">
      <div className="bg-emerald-500" style={{ width: `${(a / total) * 100}%` }} />
      <div className="bg-rose-500" style={{ width: `${(b / total) * 100}%` }} />
    </div>
  )
}

function TradeSide({ title, tint, items, setItems, query, setQuery, pool, mode, year, exclude }) {
  const [pickInput, setPickInput] = useState('')
  const chosen = new Set([...items, ...exclude].map((i) => i.id))
  const matches = query.length >= 2
    ? pool.filter((p) => !chosen.has(p.id) && p.name.toLowerCase().includes(query.toLowerCase())).slice(0, 8)
    : []

  const addPick = () => {
    const pv = pickValue(pickInput, mode, year)
    if (!pv.parsed) return alert('Pick format: "2027 1.05", "1.01", or "2027 2nd"')
    setItems([...items, { id: `custom:${pickInput}:${Math.random()}`, type: 'pick', name: pv.parsed.display, position: 'PICK', value: pv.value, tier: pv.label }])
    setPickInput('')
  }

  return (
    <div className={`card border-${tint}-500/30`}>
      <SectionTitle>{title} <span className={`text-${tint}-400`}>({items.reduce((s, i) => s + i.value, 0).toFixed(1)})</span></SectionTitle>
      <div className="relative mb-2">
        <input className="input" placeholder="Search any player or rostered pick…" value={query} onChange={(e) => setQuery(e.target.value)} />
        {matches.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-ink-800 border border-ink-600 rounded-lg max-h-56 overflow-auto shadow-xl">
            {matches.map((m) => (
              <button key={m.id} className="w-full text-left px-3 py-2 text-sm hover:bg-ink-700 flex justify-between"
                onClick={() => { setItems([...items, m]); setQuery('') }}>
                <span>{m.name} <span className="text-xs text-slate-500">{m.franchiseName}</span></span>
                <span className="text-accent font-semibold">{m.value}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="flex gap-2 mb-3">
        <input className="input" placeholder='Add any pick, e.g. "2027 1.03"' value={pickInput}
          onChange={(e) => setPickInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addPick()} />
        <button className="btn-ghost shrink-0" onClick={addPick}>+ Pick</button>
      </div>
      <div className="space-y-2 min-h-[60px]">
        {items.length === 0 && <p className="text-xs text-slate-600 italic">Empty — add players or picks</p>}
        {items.map((i, idx) => (
          <div key={i.id + idx} className="flex justify-between items-center bg-ink-800 rounded-lg px-3 py-2 border border-ink-700">
            <span className="text-sm flex items-center gap-2">
              <PosBadge position={i.position} />
              <span className="text-white">{i.name}</span>
              <span className="text-xs text-slate-500">{i.type === 'pick' ? i.tier : i.franchiseName}</span>
            </span>
            <span className="flex items-center gap-3">
              <span className="font-semibold text-accent">{i.value}</span>
              <button className="text-slate-500 hover:text-rose-400" onClick={() => setItems(items.filter((_, j) => j !== idx))}>✕</button>
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
