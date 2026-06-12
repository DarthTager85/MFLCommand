/** Player Universe — every rostered player, free agent, and pick. Filter + search + export. */
import React, { useMemo, useState } from 'react'
import { PosBadge, ValuePill, SectionTitle, download, toCsv } from './shared'

const FILTERS = ['ALL', 'QB', 'RB', 'WR', 'TE', 'PICK', 'FA']

export default function Universe({ model }) {
  const [filter, setFilter] = useState('ALL')
  const [q, setQ] = useState('')

  const rows = useMemo(() => {
    const fas = model.freeAgents.map((p) => ({ ...p, franchiseName: 'Free Agent', isFA: true }))
    let all = [...model.allPlayers, ...model.allPicks, ...fas]
    if (filter === 'FA') all = all.filter((a) => a.isFA)
    else if (filter === 'PICK') all = all.filter((a) => a.type === 'pick')
    else if (filter !== 'ALL') all = all.filter((a) => a.position === filter)
    if (q) all = all.filter((a) => a.name.toLowerCase().includes(q.toLowerCase()))
    return all.sort((a, b) => b.value - a.value).slice(0, 200)
  }, [model, filter, q])

  return (
    <div className="card">
      <div className="flex flex-wrap justify-between items-start gap-3 mb-3">
        <SectionTitle sub="All rostered players, free agents, and draft picks — ranked by mode-aware value">🌌 Player Universe</SectionTitle>
        <button className="btn-ghost" onClick={() => download('player-universe.csv', toCsv(rows.map((r) => ({
          name: r.name, pos: r.position, owner: r.franchiseName, age: r.age ?? '', ppg: r.ppg ?? '',
          salary: r.salary ?? '', value: r.value,
        }))))}>⬇ Export CSV</button>
      </div>
      <div className="flex flex-wrap gap-2 mb-4">
        {FILTERS.map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`btn ${filter === f ? 'bg-accent text-ink-950 font-bold' : 'bg-ink-800 text-slate-400 hover:bg-ink-700'}`}>
            {f}
          </button>
        ))}
        <input className="input !w-56" placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-slate-500 text-xs uppercase border-b border-ink-700">
            <tr>
              <th className="px-3 py-2 text-left">#</th>
              <th className="px-3 py-2 text-left">Asset</th>
              <th className="px-3 py-2 text-left">Owner</th>
              <th className="px-3 py-2 text-left">Age</th>
              <th className="px-3 py-2 text-left">PPG</th>
              <th className="px-3 py-2 text-left">Salary</th>
              <th className="px-3 py-2 text-left">Value</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.id + (r.franchiseId || 'fa')} className="border-b border-ink-800 hover:bg-ink-800/50">
                <td className="px-3 py-2 text-slate-600">{i + 1}</td>
                <td className="px-3 py-2">
                  <span className="flex items-center gap-2">
                    <PosBadge position={r.position} />
                    <span className="text-white font-medium">{r.name}</span>
                    {r.tier && <span className="text-xs text-slate-500">{r.tier}</span>}
                  </span>
                </td>
                <td className="px-3 py-2 text-slate-400 text-xs">{r.franchiseName}</td>
                <td className="px-3 py-2">{r.age ?? '—'}</td>
                <td className="px-3 py-2">{r.ppg ?? '—'}</td>
                <td className="px-3 py-2">{r.salary != null && r.type !== 'pick' ? `$${r.salary}` : '—'}</td>
                <td className="px-3 py-2"><ValuePill value={r.value} valueOther={r.valueOther} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
