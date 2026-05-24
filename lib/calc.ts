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
  rate: number
  horizon: number
  totalScales: number
  siteWD: number
  siteCW: number
}

export interface CalcResult {
  totalInv: number
  amc: number
  cumAMC: number
  perScale: number
  validated: number
  unvalidated: number
  amcPerScaleYr: number
  amcPerScaleMo: number
  itemPortions: number[]
  itemPcts: number[]
  siteWDcost: number
  siteCWcost: number
  siteTotal: number
  werumYears: number[]
  werumTotal: number
  sav5yr: number
}

export function calc(state: SimState): CalcResult {
  const totalInv = state.items.reduce((sum, item) => sum + (item.value || 0), 0)
  const amc = totalInv * state.rate / 100
  const cumAMC = amc * state.horizon
  const scales = state.totalScales || 1
  const perScale = cumAMC / scales
  const validated = perScale * 1.2
  const unvalidated = perScale * 0.8
  const amcPerScaleYr = amc / scales
  const amcPerScaleMo = amcPerScaleYr / 12

  const itemPortions = state.items.map(item =>
    ((item.value || 0) * state.rate / 100 * state.horizon) / scales
  )
  const itemPcts = state.items.map(item =>
    totalInv > 0 ? ((item.value || 0) / totalInv) * 100 : 0
  )

  const siteWDcost = state.siteWD * validated
  const siteCWcost = state.siteCW * unvalidated
  const siteTotal = siteWDcost + siteCWcost

  const werumYears: number[] = []
  let w = WERUM_BASE
  for (let i = 0; i < 5; i++) {
    werumYears.push(w)
    w = w * (1 + WERUM_GROWTH)
  }
  const werumTotal = werumYears.reduce((a, b) => a + b, 0)
  const sav5yr = werumTotal - siteTotal

  return {
    totalInv, amc, cumAMC, perScale, validated, unvalidated,
    amcPerScaleYr, amcPerScaleMo, itemPortions, itemPcts,
    siteWDcost, siteCWcost, siteTotal, werumYears, werumTotal, sav5yr,
  }
}

export const SITES: Record<string, { wd: number; cw: number; total: number }> = {
  SAKA:   { wd: 8,  cw: 5, total: 13 },
  FIMA:   { wd: 3,  cw: 3, total: 6  },
  DANKOS: { wd: 23, cw: 9, total: 32 },
  KF:     { wd: 47, cw: 9, total: 56 },
}
