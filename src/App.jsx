/**
 * MFL Command Center — app shell.
 * Handles: settings (league ID / year / my franchise), live data load with
 * sample-data fallback, strategy mode toggle, tab navigation.
 */
import React, { useEffect, useMemo, useState } from 'react'
import { loadLeagueData, clearCache } from './lib/mflApi'
import { buildModel } from './lib/enrich'
import { MODES } from './lib/valuation'
import { SAMPLE_DATA } from './data/sampleData'
import { Spinner, ErrorBanner } from './components/shared'
import Dashboard from './components/Dashboard'
import Roster from './components/Roster'
import TradeAnalyzer from './components/TradeAnalyzer'
import Targets from './components/Targets'
import LeagueIntel from './components/LeagueIntel'
import Universe from './components/Universe'

const TABS = [
  ['dashboard', '📊 Dashboard'],
  ['roster', '🏈 My Roster'],
  ['trade', '🔁 Trade Analyzer'],
  ['targets', '🎯 Targets & Sells'],
  ['intel', '🕵️ League Intel'],
  ['universe', '🌌 Universe'],
]

const LS = {
  get: (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d } catch { return d } },
  set: (k, v) => localStorage.setItem(k, JSON.stringify(v)),
}

export default function App() {
  const [settings, setSettings] = useState(() => LS.get('mflcc:settings', {
    leagueId: '', year: String(new Date().getFullYear()), franchiseId: '0001',
  }))
  const [mode, setMode] = useState(() => LS.get('mflcc:mode', MODES.WIN_NOW))
  const [notes, setNotes] = useState(() => LS.get('mflcc:notes', ''))
  const [tab, setTab] = useState('dashboard')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showSettings, setShowSettings] = useState(false)

  useEffect(() => { LS.set('mflcc:mode', mode) }, [mode])
  useEffect(() => { LS.set('mflcc:notes', notes) }, [notes])
  useEffect(() => { LS.set('mflcc:settings', settings) }, [settings])

  async function load(force = false) {
    setLoading(true); setError('')
    if (!settings.leagueId) {
      setData(SAMPLE_DATA); setLoading(false)
      return
    }
    try {
      if (force) clearCache(settings.year, settings.leagueId)
      const live = await loadLeagueData(settings.year, settings.leagueId, { force })
      setData(live)
    } catch (e) {
      console.error(e)
      setError(e.message || 'Could not reach the MFL API')
      setData(SAMPLE_DATA)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [settings.leagueId, settings.year]) // eslint-disable-line

  const model = useMemo(
    () => (data ? buildModel(data, mode, settings.franchiseId, parseInt(settings.year)) : null),
    [data, mode, settings.franchiseId, settings.year],
  )

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-ink-700 bg-ink-900/80 backdrop-blur sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center gap-3">
          <h1 className="text-lg font-black text-white tracking-tight">
            🏈 MFL <span className="text-accent">Command Center</span>
          </h1>
          <span className="text-xs text-slate-500 hidden sm:block">
            {data?.league?.name}{data?.source === 'sample' && ' · SAMPLE DATA'}
          </span>
          <div className="ml-auto flex items-center gap-2">
            {/* Strategy toggle — re-values every asset in the app */}
            <div className="flex rounded-lg overflow-hidden border border-ink-600">
              <button
                onClick={() => setMode(MODES.WIN_NOW)}
                className={`px-3 py-1.5 text-xs font-bold transition-colors ${mode === MODES.WIN_NOW ? 'bg-winnow text-ink-950' : 'bg-ink-800 text-slate-400'}`}>
                🏆 WIN-NOW
              </button>
              <button
                onClick={() => setMode(MODES.REBUILD)}
                className={`px-3 py-1.5 text-xs font-bold transition-colors ${mode === MODES.REBUILD ? 'bg-rebuild text-ink-950' : 'bg-ink-800 text-slate-400'}`}>
                🌱 REBUILD
              </button>
            </div>
            <button className="btn-ghost" onClick={() => load(true)} disabled={loading} title="Bust cache and re-fetch from MFL">
              {loading ? '…' : '⟳ Refresh'}
            </button>
            <button className="btn-ghost" onClick={() => setShowSettings(!showSettings)}>⚙</button>
          </div>
        </div>

        {/* Settings panel */}
        {showSettings && (
          <div className="border-t border-ink-700 bg-ink-900">
            <div className="max-w-7xl mx-auto px-4 py-3 grid sm:grid-cols-4 gap-3 items-end">
              <label className="text-xs text-slate-400">League ID
                <input className="input mt-1" placeholder="e.g. 12345" value={settings.leagueId}
                  onChange={(e) => setSettings({ ...settings, leagueId: e.target.value.trim() })} />
              </label>
              <label className="text-xs text-slate-400">Year
                <input className="input mt-1" value={settings.year}
                  onChange={(e) => setSettings({ ...settings, year: e.target.value.trim() })} />
              </label>
              <label className="text-xs text-slate-400">My Franchise
                <select className="input mt-1" value={settings.franchiseId}
                  onChange={(e) => setSettings({ ...settings, franchiseId: e.target.value })}>
                  {(data?.league?.franchises || []).map((f) => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
              </label>
              <p className="text-xs text-slate-500">
                Find your League ID in your MFL URL: …myfantasyleague.com/{settings.year}/home/<b className="text-accent">XXXXX</b>.
                Leave blank to explore with sample data.
              </p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <nav className="max-w-7xl mx-auto px-4 flex gap-1 overflow-x-auto">
          {TABS.map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)}
              className={`px-3 py-2 text-sm whitespace-nowrap border-b-2 transition-colors ${
                tab === id ? 'border-accent text-white font-semibold' : 'border-transparent text-slate-500 hover:text-slate-300'}`}>
              {label}
            </button>
          ))}
        </nav>
      </header>

      {/* Body */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        <ErrorBanner message={error} onDismiss={() => setError('')} />
        {loading || !model ? (
          <Spinner />
        ) : (
          <>
            {tab === 'dashboard' && <Dashboard model={model} mode={mode} />}
            {tab === 'roster' && <Roster model={model} mode={mode} notes={notes} setNotes={setNotes} />}
            {tab === 'trade' && <TradeAnalyzer model={model} mode={mode} year={parseInt(settings.year)} />}
            {tab === 'targets' && <Targets model={{ ...model, tradeBait: data.tradeBait }} mode={mode} />}
            {tab === 'intel' && <LeagueIntel model={model} tradeBait={data.tradeBait} players={data.players} />}
            {tab === 'universe' && <Universe model={model} />}
          </>
        )}
      </main>

      <footer className="max-w-7xl mx-auto px-4 pb-6 text-xs text-slate-600">
        Data: MyFantasyLeague XML API · Valuations are strategy-mode dependent estimates, not gospel. Trust your gut, GM.
      </footer>
    </div>
  )
}
