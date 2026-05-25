'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import { calc, SITES, DEFAULT_ITEMS, ITEM_COLORS, type InvestmentItem } from '@/lib/calc'
import { fmio } from '@/lib/format'
import { loadState, saveState, clearState, exportJSON, importJSON } from '@/lib/storage'

type Tab = 'overview' | 'per-scale' | 'site'

let nextId = DEFAULT_ITEMS.length

function fill(value: number, min: number, max: number) {
  return { '--fill-pct': `${((value - min) / (max - min)) * 100}%` } as React.CSSProperties
}

export default function Simulator() {
  const [items, setItems] = useState<InvestmentItem[]>(DEFAULT_ITEMS)
  const [rate, setRate] = useState(20)
  const [horizon, setHorizon] = useState(5)
  const [totalScales, setTotalScales] = useState(114)
  const [siteWD, setSiteWD] = useState(15)
  const [siteCW, setSiteCW] = useState(5)
  const [siteName, setSiteName] = useState('SAKA')
  const [implFee, setImplFee] = useState(0)
  const [addOns, setAddOns] = useState(0)
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [savedAt, setSavedAt] = useState<string | null>(null)
  const isFirstRender = useRef(true)

  // Load persisted state on mount
  useEffect(() => {
    const saved = loadState()
    if (saved) {
      setItems(saved.items)
      setRate(saved.rate)
      setHorizon(saved.horizon)
      setTotalScales(saved.totalScales)
      setSiteWD(saved.siteWD)
      setSiteCW(saved.siteCW)
      setSiteName(saved.siteName)
      setImplFee(saved.implFee ?? 0)
      setAddOns(saved.addOns ?? 0)
      // keep nextId above any loaded item ids
      const maxId = Math.max(...saved.items.map(it => Number(it.id) || 0))
      if (maxId >= nextId) nextId = maxId + 1
    }
    isFirstRender.current = false
  }, [])

  // Auto-save whenever state changes (skip the initial mount)
  useEffect(() => {
    if (isFirstRender.current) return
    saveState({ items, rate, horizon, totalScales, siteWD, siteCW, siteName, implFee, addOns })
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    setSavedAt(now)
  }, [items, rate, horizon, totalScales, siteWD, siteCW, siteName, implFee, addOns])

  const d = useMemo(
    () => calc({ items, rate, horizon, totalScales, siteWD, siteCW, implFee, addOns }),
    [items, rate, horizon, totalScales, siteWD, siteCW, implFee, addOns]
  )

  function updateLabel(id: string, label: string) {
    setItems(prev => prev.map(it => it.id === id ? { ...it, label } : it))
  }

  function updateValue(id: string, raw: string) {
    const value = raw === '' ? 0 : parseFloat(raw)
    setItems(prev => prev.map(it => it.id === id ? { ...it, value: isNaN(value) ? 0 : value } : it))
  }

  function addItem() {
    setItems(prev => [...prev, { id: String(++nextId), label: '', value: 0 }])
  }

  function removeItem(id: string) {
    setItems(prev => prev.filter(it => it.id !== id))
  }

  function selectSite(name: string) {
    const site = SITES[name]
    setSiteName(name)
    setSiteWD(site.wd)
    setSiteCW(site.cw)
  }

  function handleReset() {
    if (!confirm('Reset all values to defaults?')) return
    clearState()
    setItems(DEFAULT_ITEMS)
    setRate(20)
    setHorizon(5)
    setTotalScales(114)
    setSiteWD(15)
    setSiteCW(5)
    setSiteName('SAKA')
    setImplFee(0)
    setAddOns(0)
    setSavedAt(null)
  }

  function handleExport() {
    exportJSON({ items, rate, horizon, totalScales, siteWD, siteCW, siteName, implFee, addOns })
  }

  async function handleImport() {
    try {
      const state = await importJSON()
      setItems(state.items)
      setRate(state.rate)
      setHorizon(state.horizon)
      setTotalScales(state.totalScales)
      setSiteWD(state.siteWD)
      setSiteCW(state.siteCW)
      setSiteName(state.siteName)
      setImplFee(state.implFee ?? 0)
      setAddOns(state.addOns ?? 0)
    } catch {
      alert('Could not read file. Make sure it is a valid eWS simulator JSON.')
    }
  }

  const totalInvDisplay = d.totalInv.toLocaleString('en-US')
  const siteScales = siteWD + siteCW

  return (
    <>
      <header className="header">
        <div className="header-brand">
          <div className="logo-mark">eWS</div>
          <span className="header-title">
            <span>eWS</span> Pricing Simulator
          </span>
        </div>
        <div className="storage-bar">
          {savedAt && (
            <span className="save-indicator">
              <span className="save-dot" />
              Saved {savedAt}
            </span>
          )}
          <button className="icon-btn" onClick={handleImport} title="Import configuration">
            ↑ Import
          </button>
          <button className="icon-btn" onClick={handleExport} title="Export configuration">
            ↓ Export
          </button>
          <button className="icon-btn danger" onClick={handleReset} title="Reset to defaults">
            Reset
          </button>
        </div>
      </header>

      <main className="main">
        <div className="page-title">
          <h1>Perpetual License Pricing Simulator</h1>
          <p>Two-product pricing model — perpetual license (one-time) and annual support fee (recurring) — for the Electronic Weighing System rollout across Kalbe Group sites.</p>
        </div>

        <div className="grid-2">
          {/* LEFT: INPUTS */}
          <div>
            {/* Investment Components */}
            <div className="panel" style={{ marginBottom: '1rem' }}>
              <div className="panel-header">
                <div className="icon">💰</div>
                <h2>Investment Components</h2>
              </div>
              <div className="panel-body">
                <div className="sec-label">Base cost structure (IDR Mio)</div>

                {items.map((item) => (
                  <div key={item.id} className="cost-row editable">
                    <input
                      className="cost-name-input"
                      value={item.label}
                      placeholder="Item name"
                      onChange={e => updateLabel(item.id, e.target.value)}
                    />
                    <div className="cost-row-actions">
                      <input
                        className="cost-val-input"
                        type="number"
                        value={item.value || ''}
                        placeholder="0"
                        min={0}
                        onChange={e => updateValue(item.id, e.target.value)}
                      />
                      {items.length > 1 && (
                        <button
                          className="remove-item-btn"
                          onClick={() => removeItem(item.id)}
                          title="Remove item"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                <button className="add-item-btn" onClick={addItem}>
                  + Add item
                </button>

                <div className="cost-row total" style={{ marginTop: '10px' }}>
                  <span className="cost-name">Total Investment</span>
                  <span className="cost-val">IDR {totalInvDisplay} Mio</span>
                </div>

                <div className="control-group" style={{ marginTop: '1rem' }}>
                  <div className="control-label">
                    <span>AMC horizon (years)</span>
                    <span className="val">{horizon} yr</span>
                  </div>
                  <input
                    type="range" min={1} max={10} value={horizon} step={1}
                    style={fill(horizon, 1, 10)}
                    onChange={e => setHorizon(Number(e.target.value))}
                  />
                </div>

                <div className="divider" />

                <div className="sec-label">Model parameters</div>

                <div className="control-group">
                  <div className="control-label">
                    <span>AMC Rate — drives annual support fee only</span>
                    <span className="val">{rate}%</span>
                  </div>
                  <input
                    type="range" min={10} max={30} value={rate} step={1}
                    style={fill(rate, 10, 30)}
                    onChange={e => setRate(Number(e.target.value))}
                  />
                </div>

                <div className="control-group">
                  <div className="control-label">
                    <span>Total active scales (Kalbe Group)</span>
                    <span className="val">{totalScales}</span>
                  </div>
                  <input
                    type="range" min={50} max={250} value={totalScales} step={1}
                    style={fill(totalScales, 50, 250)}
                    onChange={e => setTotalScales(Number(e.target.value))}
                  />
                </div>
              </div>
            </div>

            {/* Formula */}
            <div className="panel">
              <div className="panel-header">
                <div className="icon">🧮</div>
                <h2>Pricing formula</h2>
              </div>
              <div className="panel-body">
                <div className="formula-box">
                  <span className="comment">// PRODUCT 1 — Perpetual license (one-time)</span><br />
                  Perpetual = {totalInvDisplay} ÷ {totalScales}<br />
                  {'          '}= <span style={{ color: 'white', fontWeight: 600 }}>{fmio(d.perScale)}</span> per scale<br />
                  <br />
                  <span className="comment">// PRODUCT 2 — Annual support fee (recurring)</span><br />
                  Annual{'    '}= {totalInvDisplay} × {rate}%<br />
                  {'          '}= <span style={{ color: '#A7F3D0' }}>{fmio(d.annualAMC)}</span> / yr (whole program)
                </div>
                <div className="note">
                  <strong>WD (Higher complexity)</strong> = base × 1.20 — ERP BOM integration, multi-step CSV, deeper Oracle sync.<br />
                  <strong>CW (Standard complexity)</strong> = base × 0.80 — lighter ERP dependency, more standardized setup.
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: RESULTS */}
          <div>
            <div className="panel">
              <div className="panel-header">
                <div className="icon">📊</div>
                <h2>Simulation results</h2>
              </div>
              <div className="panel-body">

                <div className="tabs">
                  {(['overview', 'per-scale', 'site'] as Tab[]).map((tab, i) => (
                    <button
                      key={tab}
                      className={`tab-btn${activeTab === tab ? ' active' : ''}`}
                      onClick={() => setActiveTab(tab)}
                    >
                      {['Overview', 'Per scale', 'Site view'][i]}
                    </button>
                  ))}
                </div>

                {/* TAB: Overview */}
                <div className={`tab-pane${activeTab === 'overview' ? ' active' : ''}`}>
                  <div className="sec-label">All-sites summary — AMC &amp; Investment</div>
                  <table className="comp-table">
                    <thead>
                      <tr>
                        <th>Site</th>
                        <th style={{ textAlign: 'right' }}>Scales</th>
                        <th style={{ textAlign: 'right' }}>Perpetual (one-time)</th>
                        <th style={{ textAlign: 'right' }}>Annual AMC</th>
                        <th style={{ textAlign: 'right' }}>{horizon}-yr AMC</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(SITES).map(([name, site]) => {
                        const perpetual = site.wd * d.validated + site.cw * d.unvalidated
                        const annualAMC = perpetual * rate / 100
                        return (
                          <tr key={name}>
                            <td><strong>{name}</strong> <span style={{ color: 'var(--gray-400)', fontWeight: 400 }}>{site.wd}WD · {site.cw}CW</span></td>
                            <td className="num">{site.total}</td>
                            <td className="num">{fmio(perpetual)}</td>
                            <td className="num" style={{ color: '#D97706' }}>{fmio(annualAMC)}</td>
                            <td className="num">{fmio(annualAMC * horizon)}</td>
                          </tr>
                        )
                      })}
                      {(() => {
                        const totalPerp = Object.values(SITES).reduce((s, site) => s + site.wd * d.validated + site.cw * d.unvalidated, 0)
                        const totalAnnual = totalPerp * rate / 100
                        const totalScalesAll = Object.values(SITES).reduce((s, site) => s + site.total, 0)
                        return (
                          <tr className="total">
                            <td>Total (all sites)</td>
                            <td className="num">{totalScalesAll}</td>
                            <td className="num">{fmio(totalPerp)}</td>
                            <td className="num" style={{ color: '#D97706' }}>{fmio(totalAnnual)}</td>
                            <td className="num">{fmio(totalAnnual * horizon)}</td>
                          </tr>
                        )
                      })()}
                    </tbody>
                  </table>

                  <div className="sec-label" style={{ marginTop: '1.25rem' }}>Investment component breakdown</div>
                  <div className="bar-legend">
                    {items.map((item, i) => (
                      <div key={item.id} className="leg">
                        <div className="dot" style={{ background: ITEM_COLORS[i % ITEM_COLORS.length] }} />
                        {item.label || `Item ${i + 1}`} ({item.value})
                      </div>
                    ))}
                  </div>
                  <div className="breakdown-bar">
                    {items.map((item, i) => (
                      <div
                        key={item.id}
                        className="seg"
                        style={{ background: ITEM_COLORS[i % ITEM_COLORS.length], width: `${d.itemPcts[i]}%` }}
                      />
                    ))}
                  </div>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: `repeat(${Math.min(items.length, 3)}, 1fr)`,
                    gap: '8px',
                    marginTop: '10px',
                  }}>
                    {items.map((item, i) => (
                      <div key={item.id} className="metric-card">
                        <div className="m-label">{item.label || `Item ${i + 1}`} / scale</div>
                        <div className="m-val" style={{ fontSize: '14px', color: ITEM_COLORS[i % ITEM_COLORS.length] }}>
                          {fmio(d.itemPortions[i])}
                        </div>
                        <div className="m-sub">Perpetual share</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* TAB: Per Scale */}
                <div className={`tab-pane${activeTab === 'per-scale' ? ' active' : ''}`}>

                  {/* Section A */}
                  <div className="sec-label">Section A — Perpetual License (one-time)</div>
                  <div className="metric-grid">
                    <div className="metric-card hero">
                      <div className="m-label">Base perpetual price per scale</div>
                      <div className="m-val">{fmio(d.perScale)}</div>
                      <div className="m-sub">Total Investment ÷ {totalScales} scales · paid once</div>
                    </div>
                  </div>

                  <div className="tier-grid">
                    <div className="tier-card validated">
                      <span className="tier-tag wd">WD · Higher Complexity</span>
                      <div className="tier-price">{fmio(d.validated)}</div>
                      <div className="tier-desc">+20% — ERP BOM integration, multi-step CSV, deeper Oracle sync</div>
                    </div>
                    <div className="tier-card unvalidated">
                      <span className="tier-tag cw">CW · Standard Complexity</span>
                      <div className="tier-price">{fmio(d.unvalidated)}</div>
                      <div className="tier-desc">−20% — lighter ERP dependency, more standardized setup</div>
                    </div>
                  </div>

                </div>

                {/* TAB: Site View */}
                <div className={`tab-pane${activeTab === 'site' ? ' active' : ''}`}>
                  <div className="sec-label">Quick-select site (actual fleet data)</div>
                  <div className="site-selector">
                    {Object.entries(SITES).map(([name, site]) => (
                      <button
                        key={name}
                        className={`site-btn${siteName === name ? ' active' : ''}`}
                        onClick={() => selectSite(name)}
                      >
                        {name}
                        <span className="site-count">{site.total}</span>
                      </button>
                    ))}
                  </div>

                  <div className="sec-label">Or configure manually</div>
                  <div className="control-group">
                    <div className="control-label">
                      <span>WD scales (higher complexity)</span>
                      <span className="val">{siteWD}</span>
                    </div>
                    <input
                      type="range" min={1} max={60} value={siteWD} step={1}
                      style={fill(siteWD, 1, 60)}
                      onChange={e => { setSiteWD(Number(e.target.value)); setSiteName('') }}
                    />
                  </div>
                  <div className="control-group">
                    <div className="control-label">
                      <span>CW scales (standard complexity)</span>
                      <span className="val">{siteCW}</span>
                    </div>
                    <input
                      type="range" min={0} max={30} value={siteCW} step={1}
                      style={fill(siteCW, 0, 30)}
                      onChange={e => { setSiteCW(Number(e.target.value)); setSiteName('') }}
                    />
                  </div>

                  <div className="sec-label">Section A — Site Quotation (one-time)</div>
                  <div className="metric-grid">
                    <div className="metric-card">
                      <div className="m-label">WD perpetual cost</div>
                      <div className="m-val teal">{fmio(d.siteWDcost)}</div>
                      <div className="m-sub">{siteWD} scales × {fmio(d.validated)}</div>
                    </div>
                    <div className="metric-card">
                      <div className="m-label">CW perpetual cost</div>
                      <div className="m-val blue">{fmio(d.siteCWcost)}</div>
                      <div className="m-sub">{siteCW} scales × {fmio(d.unvalidated)}</div>
                    </div>
                  </div>

                  <div className="cost-row editable" style={{ marginTop: '10px' }}>
                    <span className="cost-name" style={{ fontSize: '13px', color: 'var(--gray-100)', fontWeight: 600 }}>Implementation Fee</span>
                    <div className="cost-row-actions">
                      <input
                        className="cost-val-input"
                        type="number"
                        value={implFee || ''}
                        placeholder="0"
                        min={0}
                        onChange={e => setImplFee(e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)}
                      />
                      <span style={{ fontSize: '11px', color: 'var(--gray-200)', marginLeft: '4px' }}>Mio</span>
                    </div>
                  </div>
                  <div className="cost-row editable">
                    <span className="cost-name" style={{ fontSize: '13px', color: 'var(--gray-100)', fontWeight: 600 }}>Add-ons</span>
                    <div className="cost-row-actions">
                      <input
                        className="cost-val-input"
                        type="number"
                        value={addOns || ''}
                        placeholder="0"
                        min={0}
                        onChange={e => setAddOns(e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)}
                      />
                      <span style={{ fontSize: '11px', color: 'var(--gray-200)', marginLeft: '4px' }}>Mio</span>
                    </div>
                  </div>

                  <div className="metric-grid" style={{ marginTop: '10px' }}>
                    <div className="metric-card hero" style={{ gridColumn: 'span 2' }}>
                      <div className="m-label">Total site quotation</div>
                      <div className="m-val">{fmio(d.siteQuotation)}</div>
                      <div className="m-sub">Perpetual + Implementation Fee + Add-ons · one-time</div>
                    </div>
                  </div>

                  <div className="sec-label" style={{ marginTop: '1rem' }}>Section B — Annual Support Fee <span style={{ textTransform: 'none', letterSpacing: 0, fontSize: '10px', color: 'var(--amber)', fontWeight: 500 }}>recurring · based on site quotation</span></div>
                  <div className="metric-grid">
                    <div className="metric-card" style={{ gridColumn: 'span 2' }}>
                      <div className="m-label">Annual AMC (this site)</div>
                      <div className="m-val amber">{fmio(d.siteAnnualAMC)}</div>
                      <div className="m-sub">{fmio(d.siteQuotation)} × {rate}%</div>
                    </div>
                    <div className="metric-card" style={{ gridColumn: 'span 2' }}>
                      <div className="m-label">Cumulative AMC over {horizon} years</div>
                      <div className="m-val blue">{fmio(d.siteCumulativeAMC)}</div>
                      <div className="m-sub">Annual × {horizon} years</div>
                    </div>
                  </div>
                </div>


              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="footer">
        eWS Pricing Simulator · <span>Corporate Digital Technology</span> · Kalbe Group · Internal use only
      </footer>
    </>
  )
}
