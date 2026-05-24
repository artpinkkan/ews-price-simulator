const WERUM_BASE = 750
const WERUM_GROWTH = 0.05

export interface InvestmentItem {
  id: string
  label: string
  value: number
}

export const DEFAULT_ITEMS: InvestmentItem[] = [
  { id: 'rd', label: 'Product R&D & Dev Readiness',       value: 720 },
  { id: 'hw', label: 'Hardware IT, Machinery & Equipment', value: 322 },
  { id: 'as', label: 'After-Sales Support (L3, L4)',       value: 720 },
]

export const ITEM_COLORS = [
  '#10B981', '#3B82F6', '#F59E0B', '#8B5CF6', '#EF4444', '#06B6D4', '#F97316',
]

export interface SimState {
  items: InvestmentItem[]
  rate: number        // AMC rate (%) — drives annual fee only
  horizon: number     // AMC horizon (years) — drives annual fee only
  totalScales: number
  siteWD: number
  siteCW: number
}

export interface CalcResult {
  totalInv: number

  // Product 1 — Perpetual license (one-time, no AMC rate, no horizon)
  perScale: number
  validated: number
  unvalidated: number
  siteWDcost: number
  siteCWcost: number
  siteTotal: number

  // Product 2 — Annual support fee (recurring, AMC rate only)
  annualAMC: number
  annualFeePerScale: number
  annualFeePerScaleMo: number
  annualFeeForSite: number
  fiveYearSupportCost: number

  // Breakdown (% and per-scale share of investment)
  itemPortions: number[]
  itemPcts: number[]

  // vs Werum
  werumYears: number[]
  werumTotal: number
  sav5yr: number
}

export function calc(state: SimState): CalcResult {
  const totalInv = state.items.reduce((sum, item) => sum + (item.value || 0), 0)
  const scales = state.totalScales || 1

  // Product 1: Perpetual — total investment ÷ total scales (no AMC, no horizon)
  const perScale = totalInv / scales
  const validated = perScale * 1.2
  const unvalidated = perScale * 0.8
  const siteWDcost = state.siteWD * validated
  const siteCWcost = state.siteCW * unvalidated
  const siteTotal = siteWDcost + siteCWcost

  // Product 2: Annual support fee — (total investment × AMC rate) ÷ total scales
  const annualAMC = totalInv * state.rate / 100
  const annualFeePerScale = annualAMC / scales
  const annualFeePerScaleMo = annualFeePerScale / 12
  const annualFeeForSite = (state.siteWD + state.siteCW) * annualFeePerScale
  const fiveYearSupportCost = annualFeeForSite * state.horizon

  // Item breakdown: perpetual share per scale per component
  const itemPortions = state.items.map(item => (item.value || 0) / scales)
  const itemPcts = state.items.map(item =>
    totalInv > 0 ? ((item.value || 0) / totalInv) * 100 : 0
  )

  // vs Werum (compare against site perpetual one-time cost)
  const werumYears: number[] = []
  let w = WERUM_BASE
  for (let i = 0; i < 5; i++) {
    werumYears.push(w)
    w = w * (1 + WERUM_GROWTH)
  }
  const werumTotal = werumYears.reduce((a, b) => a + b, 0)
  const sav5yr = werumTotal - siteTotal

  return {
    totalInv,
    perScale, validated, unvalidated, siteWDcost, siteCWcost, siteTotal,
    annualAMC, annualFeePerScale, annualFeePerScaleMo, annualFeeForSite, fiveYearSupportCost,
    itemPortions, itemPcts,
    werumYears, werumTotal, sav5yr,
  }
}

export const SITES: Record<string, { wd: number; cw: number; total: number }> = {
  SAKA:   { wd: 15, cw: 5,  total: 20 },
  FIMA:   { wd: 6,  cw: 3,  total: 9  },
  DANKOS: { wd: 23, cw: 9,  total: 32 },
  KF:     { wd: 47, cw: 9,  total: 56 },
}
