/** Dashboard — top-line snapshot: record, cap, value rank, top assets, charts. */
import React from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend,
} from 'recharts'
import { PosBadge, ValuePill, SectionTitle } from './shared'
import { MODES } from '../lib/valuation'

const POS_PIE = ['#f43f5e', '#10b981', '#0ea5e9', '#f97316', '#a78bfa', '#64748b']

export default function Dashboard({ model, mode }) {
  const { myTeam, teams, cap } = model
  const rank = teams.findIndex((t) => t.franchise.id === myTeam.franchise.id) + 1
  const { wins, losses, ties } = myTeam.standing
  const capPct = Math.round((myTeam.capUsed / cap) * 100)

  const valueByTeam = teams.map((t) => ({
    name: t.franchise.name.slice(0, 14),
    value: t.totalValue,
    mine: t.franchise.id === myTeam.franchise.id,
  }))

  const posMix = Object.entries(
    myTeam.players.reduce((acc, p) => {
      acc[p.position] = (acc[p.position] || 0) + p.value
      return acc
    }, {}),
  ).map(([name, value]) => ({ name, value: Math.round(value) }))

  const topAssets = [...myTeam.players, ...myTeam.picks].sort((a, b) => b.value - a.value).slice(0, 6)

  return (
    <div className="space-y-6">
      {/* Stat tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="Record" value={`${wins}-${losses}${ties ? `-${ties}` : ''}`} sub={myTeam.motivationInfo.text} subClass={myTeam.motivationInfo.color} />
        <Stat label="Cap Used" value={`$${myTeam.capUsed}`} sub={`${capPct}% of $${cap}`} subClass={capPct > 95 ? 'text-rose-400' : 'text-slate-400'} />
        <Stat label="Roster Value Rank" value={`#${rank} of ${teams.length}`} sub={`${myTeam.totalValue} total pts`} />
        <Stat
          label="Strategy"
          value={mode === MODES.WIN_NOW ? 'Win-Now' : 'Rebuild'}
          sub={mode === MODES.WIN_NOW ? 'Production weighted' : 'Youth + picks weighted'}
          subClass={mode === MODES.WIN_NOW ? 'text-winnow' : 'text-rebuild'}
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card">
          <SectionTitle sub="Total asset value (players + picks) under current mode">League Power Rankings</SectionTitle>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={valueByTeam} layout="vertical" margin={{ left: 10 }}>
              <XAxis type="number" stroke="#64748b" fontSize={11} />
              <YAxis type="category" dataKey="name" stroke="#94a3b8" fontSize={11} width={110} />
              <Tooltip contentStyle={{ background: '#161e30', border: '1px solid #2b3a5c', borderRadius: 8 }} />
              <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                {valueByTeam.map((e, i) => (
                  <Cell key={i} fill={e.mine ? '#22d3ee' : '#2b3a5c'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <SectionTitle sub="Where your roster value is concentrated">Positional Value Mix</SectionTitle>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={posMix} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={3}>
                {posMix.map((_, i) => <Cell key={i} fill={POS_PIE[i % POS_PIE.length]} />)}
              </Pie>
              <Legend formatter={(v) => <span className="text-slate-300 text-sm">{v}</span>} />
              <Tooltip contentStyle={{ background: '#161e30', border: '1px solid #2b3a5c', borderRadius: 8 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card">
        <SectionTitle sub="Your most valuable assets in the current mode">Crown Jewels</SectionTitle>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {topAssets.map((a) => (
            <div key={a.id} className="bg-ink-800 rounded-lg p-3 flex items-center justify-between border border-ink-700">
              <div>
                <div className="font-semibold text-white text-sm">{a.name}</div>
                <div className="text-xs text-slate-400 flex gap-2 items-center mt-1">
                  <PosBadge position={a.position} />
                  {a.type === 'player' ? `${a.team} · age ${a.age} · $${a.salary}` : a.tier}
                </div>
              </div>
              <ValuePill value={a.value} valueOther={a.valueOther} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function Stat({ label, value, sub, subClass = 'text-slate-400' }) {
  return (
    <div className="card">
      <div className="text-xs uppercase tracking-wider text-slate-500">{label}</div>
      <div className="text-2xl font-bold text-white mt-1">{value}</div>
      <div className={`text-xs mt-1 ${subClass}`}>{sub}</div>
    </div>
  )
}
