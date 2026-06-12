/** My Roster Analysis — sortable table, contract heat, keep/trade verdicts, GM notes, CSV export. */
import React, { useState } from 'react'
import { PosBadge, ValuePill, SectionTitle, download, toCsv } from './shared'
import { MODES } from '../lib/valuation'

/** Verdict logic: compares value in current vs other mode + age/contract context. */
function verdict(p, mode) {
  const swing = p.value - p.valueOther
  if (mode === MODES.WIN_NOW) {
    if (swing > 8) return { text: 'CORE — keep', cls: 'text-emerald-400' }
    if (swing < -8) return { text: 'SELL to rebuilder', cls: 'text-rose-400' }
  } else {
    if (swing > 8) return { text: 'CORE — keep', cls: 'text-emerald-400' }
    if (swing < -8) return { text: 'SELL to contender', cls: 'text-rose-400' }
  }
  if (p.contractYears <= 1) return { text: 'Expiring — extend or move', cls: 'text-amber-400' }
  return { text: 'Hold', cls: 'text-slate-400' }
}

export default function Roster({ model, mode, notes, setNotes }) {
  const { myTeam, cap } = model
  const [sortKey, setSortKey] = useState('value')
  const rows = [...myTeam.players].sort((a, b) =>
    typeof a[sortKey] === 'string' ? a[sortKey].localeCompare(b[sortKey]) : b[sortKey] - a[sortKey],
  )

  const exportCsv = () =>
    download('my-roster.csv', toCsv(rows.map((p) => ({
      name: p.name, pos: p.position, team: p.team, age: p.age, ppg: p.ppg,
      salary: p.salary, contractYears: p.contractYears, value: p.value, verdict: verdict(p, mode).text,
    }))))

  const th = (label, key) => (
    <th className="px-3 py-2 text-left cursor-pointer hover:text-accent select-none" onClick={() => setSortKey(key)}>
      {label}{sortKey === key && ' ↓'}
    </th>
  )

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="flex justify-between items-start flex-wrap gap-2">
          <SectionTitle sub={`Cap: $${myTeam.capUsed} / $${cap} · ${myTeam.players.length} players · ${myTeam.picks.length} picks`}>
            {myTeam.franchise.name}
          </SectionTitle>
          <button className="btn-ghost" onClick={exportCsv}>⬇ Export CSV</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-slate-500 text-xs uppercase border-b border-ink-700">
              <tr>
                {th('Player', 'name')}{th('Pos', 'position')}{th('Age', 'age')}{th('PPG', 'ppg')}
                {th('Salary', 'salary')}{th('Yrs', 'contractYears')}{th('Value', 'value')}
                <th className="px-3 py-2 text-left">Verdict</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => {
                const v = verdict(p, mode)
                return (
                  <tr key={p.id} className="border-b border-ink-800 hover:bg-ink-800/50">
                    <td className="px-3 py-2 font-medium text-white">{p.name} <span className="text-slate-500 text-xs">{p.team}</span></td>
                    <td className="px-3 py-2"><PosBadge position={p.position} /></td>
                    <td className="px-3 py-2">{p.age}</td>
                    <td className="px-3 py-2">{p.ppg}</td>
                    <td className={`px-3 py-2 ${p.salary / cap > 0.15 ? 'text-rose-400 font-semibold' : ''}`}>${p.salary}</td>
                    <td className={`px-3 py-2 ${p.contractYears <= 1 ? 'text-amber-400' : ''}`}>{p.contractYears}</td>
                    <td className="px-3 py-2"><ValuePill value={p.value} valueOther={p.valueOther} /></td>
                    <td className={`px-3 py-2 text-xs font-semibold ${v.cls}`}>{v.text}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card">
          <SectionTitle sub="Current + future rookie picks, valued under your mode">My Draft Capital</SectionTitle>
          {myTeam.picks.length === 0 && <p className="text-sm text-slate-500">No picks held. In Rebuild mode this is a red flag — acquire capital.</p>}
          <div className="space-y-2">
            {myTeam.picks.map((p) => (
              <div key={p.id} className="flex justify-between items-center bg-ink-800 rounded-lg px-3 py-2 border border-ink-700">
                <span className="text-sm font-medium text-white">{p.name} <span className="text-xs text-slate-500 ml-1">{p.tier}</span></span>
                <ValuePill value={p.value} valueOther={p.valueOther} />
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <SectionTitle sub="Private scratchpad — saved to your browser">GM Notes</SectionTitle>
          <textarea
            className="input h-44 resize-none font-mono text-xs"
            placeholder="e.g. Dave undervalues picks — target his 2027 1st. Extend Nabers before camp…"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
      </div>
    </div>
  )
}
