/** Small shared UI atoms used across all views. */
import React from 'react'

export const POS_COLORS = {
  QB: 'bg-rose-500/20 text-rose-300',
  RB: 'bg-emerald-500/20 text-emerald-300',
  WR: 'bg-sky-500/20 text-sky-300',
  TE: 'bg-orange-500/20 text-orange-300',
  PK: 'bg-slate-500/20 text-slate-300',
  DEF: 'bg-slate-500/20 text-slate-300',
  PICK: 'bg-violet-500/20 text-violet-300',
}

export function PosBadge({ position }) {
  return <span className={`badge ${POS_COLORS[position] || POS_COLORS.PK}`}>{position}</span>
}

export function ValuePill({ value, valueOther }) {
  const diff = value - (valueOther ?? value)
  return (
    <span className="inline-flex items-center gap-1">
      <span className="font-bold text-accent">{value}</span>
      {Math.abs(diff) > 2 && (
        <span className={`text-xs ${diff > 0 ? 'text-emerald-400' : 'text-rose-400'}`}
          title="Change vs the other strategy mode">
          {diff > 0 ? '▲' : '▼'}{Math.abs(Math.round(diff))}
        </span>
      )}
    </span>
  )
}

export function SectionTitle({ children, sub }) {
  return (
    <div className="mb-3">
      <h2 className="text-lg font-bold text-white">{children}</h2>
      {sub && <p className="text-sm text-slate-400">{sub}</p>}
    </div>
  )
}

export function Spinner({ label = 'Loading league data…' }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-3 text-slate-400">
      <div className="w-10 h-10 border-4 border-ink-600 border-t-accent rounded-full animate-spin" />
      <span className="text-sm">{label}</span>
    </div>
  )
}

export function ErrorBanner({ message, onDismiss }) {
  if (!message) return null
  return (
    <div className="card border-rose-500/40 bg-rose-950/30 text-rose-200 text-sm flex justify-between items-center mb-4">
      <span>⚠️ {message} — showing sample data instead.</span>
      {onDismiss && <button className="btn-ghost ml-3" onClick={onDismiss}>Dismiss</button>}
    </div>
  )
}

/** Download helper for export buttons (CSV / JSON, all client-side) */
export function download(filename, text, type = 'text/csv') {
  const blob = new Blob([text], { type })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = filename
  a.click()
  URL.revokeObjectURL(a.href)
}

export function toCsv(rows) {
  if (!rows.length) return ''
  const headers = Object.keys(rows[0])
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`
  return [headers.join(','), ...rows.map((r) => headers.map((h) => esc(r[h])).join(','))].join('\n')
}
