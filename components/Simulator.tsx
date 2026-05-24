'use client'

import { useState, useMemo } from 'react'
import { calc, SITES, DEFAULT_ITEMS, ITEM_COLORS, type InvestmentItem } from '@/lib/calc'
import { fmio } from '@/lib/format'

type Tab = 'overview' | 'per-scale' | 'site' | 'compare'

let nextId = DEFAULT_ITEMS.length

export default function Simulator() {
  const [items, setItems] = useState<InvestmentItem[]>(DEFAULT_ITEMS)
  const [rate, setRate] = useState(20)
  const [horizon, setHorizon] = useState(5)
  const [totalScales, setTotalScales] = useState(114)
  const [siteWD, setSiteWD] = useState(8)
  const [siteCW, setSiteCW] = useState(5)
  const [siteName, setSiteName] = useState('SAKA')
  const [activeTab, setActiveTab] = useState<Tab>('overview')

  const d = useMemo(
    () => calc({ items, rate, horizon, totalScales, siteWD, siteCW }),
    [items, rate, horizon, totalScales, siteWD, siteCW]
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

  const totalInvDisplay = d.totalInv.toLocaleString('en-US')

  return (
    <>
      <header className="header">
        <div className="header-brand">
          <div className="logo-mark">eWS</div>
          <span className="header-title">
            <span>eWS</span> Pricing Simulator
          </span>
        </div>
        <span className="header-badge">Kalbe Group · Internal</span>
      </header>

      <main className="main">
        <div className="page-title">
          <h1>Perpetual License Pricing Simulator</h1>
          <p>AMC-based per-scale pricing model for the Electronic Weighing System rollout across Kalbe Group sites.</p>
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

                {items.map((item, i) => (
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

                <div className="cost-row total" style={{ marginTop: '8px' }}>
                  <span className="cost-name">Total Investment</span>
                  <span className="cost-val">IDR {totalInvDisplay} Mio</span>
                </div>

                <div className="divider" />

                <div className="sec-label">Model parameters</div>

                <div className="control-group">
                  <div className="control-label">
                    <span>AMC Rate</span>
                    <span className="val">{rate}%</span>
                  </div>
                  <input
                    type="range" min={10} max={30} value={rate} step={1}
                    onChange={e => setRate(Number(e.target.value))}
                  />
                </div>

                <div className="control-group">
                  <div className="control-label">
                    <span>Perpetual horizon (years)</span>
                    <span className="val">{horizon} yr</span>
                  </div>
                  <input
                    type="range" min={3} max={10} value={horizon} step={1}
                    onChange={e => setHorizon(Number(e.target.value))}
                  />
                </div>

                <div className="control-group">
                  <div className="control-label">
                    <span>Total active scales (Kalbe Group)</span>
                    <span className="val">{totalScales}</span>
                  </div>
                  <input
                    type="range" min={50} max={250} value={totalScales} step={1}
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
                  <span className="comment">// Annual AMC</span><br />
                  AMC = {totalInvDisplay} × {rate}% = <span>{d.amc.toFixed(1)}</span> Mio<br /><br />
                  <span className="comment">// Perpetual per scale</span><br />
                  P = (AMC × {horizon}) ÷ {totalScales}<br />
                  P = <span style={{ color: 'white', fontWeight: 500 }}>{fmio(d.perScale)}</span>
                </div>
                <div className="note">
                  <strong>Validated (WD)</strong> = base × 1.20 — reflects GxP/CSV Annex 11 qualification overhead.<br />
                  <strong>Unvalidated (CW)</strong> = base × 0.80 — standard setup, lower compliance burden.
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
                  {(['overview', 'per-scale', 'site', 'compare'] as Tab[]).map((tab, i) => (
                    <button
                      key={tab}
                      className={`tab-btn${activeTab === tab ? ' active' : ''}`}
                      onClick={() => setActiveTab(tab)}
                    >
                      {['Overview', 'Per scale', 'Site view', 'vs Werum'][i]}
                    </button>
                  ))}
                </div>

                {/* TAB: Overview */}
                <div className={`tab-pane${activeTab === 'overview' ? ' active' : ''}`}>
                  <div className="sec-label">Program-level AMC</div>
                  <div className="metric-grid">
                    <div className="metric-card">
                      <div className="m-label">Annual AMC (whole program)</div>
                      <div className="m-val amber">{fmio(d.amc)}</div>
                      <div className="m-sub">Per year</div>
                    </div>
                    <div className="metric-card">
                      <div className="m-label">Cumulative over horizon</div>
                      <div className="m-val">{fmio(d.cumAMC)}</div>
                      <div className="m-sub">Over {horizon} years</div>
                    </div>
                    <div className="metric-card">
                      <div className="m-label">AMC / scale / year</div>
                      <div className="m-val blue">{fmio(d.amcPerScaleYr)}</div>
                      <div className="m-sub">Across {totalScales} scales</div>
                    </div>
                    <div className="metric-card">
                      <div className="m-label">AMC / scale / month</div>
                      <div className="m-val">{fmio(d.amcPerScaleMo)}</div>
                      <div className="m-sub">Monthly burden</div>
                    </div>
                  </div>

                  <div className="sec-label">Cost component breakdown</div>
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
                    gap: '6px',
                    marginTop: '8px',
                  }}>
                    {items.map((item, i) => (
                      <div key={item.id} className="metric-card">
                        <div className="m-label">{item.label || `Item ${i + 1}`} / scale</div>
                        <div
                          className="m-val"
                          style={{ fontSize: '14px', color: ITEM_COLORS[i % ITEM_COLORS.length] }}
                        >
                          {fmio(d.itemPortions[i])}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* TAB: Per Scale */}
                <div className={`tab-pane${activeTab === 'per-scale' ? ' active' : ''}`}>
                  <div className="metric-grid">
                    <div className="metric-card hero">
                      <div className="m-label">Base perpetual price per scale</div>
                      <div className="m-val">{fmio(d.perScale)}</div>
                      <div className="m-sub">Cumulative AMC ÷ {totalScales} scales over {horizon} yr</div>
                    </div>
                  </div>

                  <div className="sec-label">Scale type pricing tiers</div>
                  <div className="tier-grid">
                    <div className="tier-card validated">
                      <span className="tier-tag wd">WD · Validated</span>
                      <div className="tier-price">{fmio(d.validated)}</div>
                      <div className="tier-desc">+20% premium — GxP / CSV Annex 11 qualification overhead</div>
                    </div>
                    <div className="tier-card unvalidated">
                      <span className="tier-tag cw">CW · Unvalidated</span>
                      <div className="tier-price">{fmio(d.unvalidated)}</div>
                      <div className="tier-desc">−20% — standard checkweighing, lighter compliance setup</div>
                    </div>
                  </div>

                  <div className="note">
                    Pricing applies once per physical scale as a one-time perpetual license. No annual renewal is required — ongoing support is handled separately through an annual support fee (if applicable).
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
                      <span>WD scales (validated)</span>
                      <span className="val">{siteWD}</span>
                    </div>
                    <input
                      type="range" min={1} max={60} value={siteWD} step={1}
                      onChange={e => { setSiteWD(Number(e.target.value)); setSiteName('') }}
                    />
                  </div>
                  <div className="control-group">
                    <div className="control-label">
                      <span>CW scales (unvalidated)</span>
                      <span className="val">{siteCW}</span>
                    </div>
                    <input
                      type="range" min={0} max={30} value={siteCW} step={1}
                      onChange={e => { setSiteCW(Number(e.target.value)); setSiteName('') }}
                    />
                  </div>

                  <div className="metric-grid">
                    <div className="metric-card">
                      <div className="m-label">WD perpetual cost</div>
                      <div className="m-val amber">{fmio(d.siteWDcost)}</div>
                      <div className="m-sub">{siteWD} scales × {fmio(d.validated)}</div>
                    </div>
                    <div className="metric-card">
                      <div className="m-label">CW perpetual cost</div>
                      <div className="m-val blue">{fmio(d.siteCWcost)}</div>
                      <div className="m-sub">{siteCW} scales × {fmio(d.unvalidated)}</div>
                    </div>
                    <div className="metric-card hero">
                      <div className="m-label">Total perpetual (this site)</div>
                      <div className="m-val">{fmio(d.siteTotal)}</div>
                      <div className="m-sub">One-time · {siteWD + siteCW} scales</div>
                    </div>
                  </div>
                </div>

                {/* TAB: vs Werum */}
                <div className={`tab-pane${activeTab === 'compare' ? ' active' : ''}`}>
                  <div className="sec-label">Site-level comparison (using current site selection)</div>
                  <table className="comp-table">
                    <thead>
                      <tr>
                        <th>Item</th>
                        <th style={{ textAlign: 'right' }}>eWS perpetual</th>
                        <th style={{ textAlign: 'right' }}>Werum AMC</th>
                        <th style={{ textAlign: 'right' }}>Savings</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>Year 1</td>
                        <td className="num">{fmio(d.siteTotal)}</td>
                        <td className="num">{fmio(d.werumYears[0])}</td>
                        <td className="num savings">{fmio(d.werumYears[0] - d.siteTotal)}</td>
                      </tr>
                      {[1, 2, 3, 4].map(i => (
                        <tr key={i}>
                          <td>Year {i + 1}</td>
                          <td className="num">—</td>
                          <td className="num">{fmio(d.werumYears[i])}</td>
                          <td className="num savings">{fmio(d.werumYears[i])}</td>
                        </tr>
                      ))}
                      <tr className="total">
                        <td>5-year total</td>
                        <td className="num">{fmio(d.siteTotal)}</td>
                        <td className="num">{fmio(d.werumTotal)}</td>
                        <td className="num savings">{fmio(d.sav5yr)}</td>
                      </tr>
                    </tbody>
                  </table>

                  <div className="savings-banner">
                    <div>
                      <div className="s-label">5-year cost avoidance (this site)</div>
                      <div className="s-val">{fmio(d.sav5yr)}</div>
                    </div>
                    <div className="s-badge">
                      {Math.round(d.sav5yr / d.werumTotal * 100)}% reduction
                    </div>
                  </div>

                  <div className="note">
                    Werum AMC assumed at IDR 750 Mio/site/year base, increasing 5% annually (per feasibility study). eWS perpetual is paid once with no recurring scale fee.
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
