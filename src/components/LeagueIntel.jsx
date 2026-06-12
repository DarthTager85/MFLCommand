/** League & Manager Intelligence — motivation scoring + trade bait board. */
import React from 'react'
import { SectionTitle } from './shared'

export default function LeagueIntel({ model, tradeBait, players }) {
  const { teams, myTeam } = model
  const byRecord = [...teams].sort((a, b) =>
    (b.standing.wins - b.standing.losses) - (a.standing.wins - a.standing.losses) ||
    b.standing.pointsFor - a.standing.pointsFor,
  )

  return (
    <div className="space-y-6">
      <div className="card">
        <SectionTitle sub="Motivation score (-100 full teardown → +100 all-in) drives who to approach and with what">
          🕵️ Manager Intelligence Board
        </SectionTitle>
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
          {byRecord.map((t) => {
            const mine = t.franchise.id === myTeam.franchise.id
            const m = t.motivation
            return (
              <div key={t.franchise.id} className={`rounded-lg p-3 border ${mine ? 'border-accent bg-accent/5' : 'border-ink-700 bg-ink-800'}`}>
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-semibold text-white text-sm">{t.franchise.name}{mine && ' ⭐'}</div>
                    <div className="text-xs text-slate-500">
                      {t.standing.wins}-{t.standing.losses} · {Math.round(t.standing.pointsFor)} PF · value #{teams.indexOf(t) + 1}
                    </div>
                  </div>
                  <span className={`text-lg font-bold ${m > 0 ? 'text-winnow' : 'text-rebuild'}`}>{m > 0 ? '+' : ''}{m}</span>
                </div>
                {/* motivation gauge */}
                <div className="h-2 rounded-full bg-ink-700 mt-2 relative overflow-hidden">
                  <div className="absolute inset-y-0 left-1/2 w-px bg-slate-600" />
                  <div
                    className={`absolute inset-y-0 ${m >= 0 ? 'bg-winnow left-1/2' : 'bg-rebuild right-1/2'}`}
                    style={{ width: `${Math.abs(m) / 2}%` }}
                  />
                </div>
                <div className={`text-xs font-semibold mt-2 ${t.motivationInfo.color}`}>{t.motivationInfo.text}</div>
                <div className="text-xs text-slate-500">{t.motivationInfo.hint}</div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="card">
        <SectionTitle sub="What other managers have publicly listed on the trade block (MFL tradeBait)">📋 Trade Bait Board</SectionTitle>
        {(!tradeBait || tradeBait.length === 0) && <p className="text-sm text-slate-500">No trade bait listed in this league yet.</p>}
        <div className="space-y-2">
          {(tradeBait || []).map((t, i) => {
            const team = teams.find((x) => x.franchise.id === t.franchiseId)
            const names = t.willGiveUp.map((id) => players?.[id]?.name || id).join(', ')
            return (
              <div key={i} className="bg-ink-800 rounded-lg px-3 py-2 border border-ink-700 text-sm">
                <span className="font-semibold text-white">{team?.franchise.name || t.franchiseId}</span>
                <span className="text-slate-300"> offers: {names || '—'}</span>
                {t.inExchangeFor && <span className="text-slate-500"> · wants: {t.inExchangeFor}</span>}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
