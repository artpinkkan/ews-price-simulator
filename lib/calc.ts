const INV = { rd: 720, hw: 322, as_: 720 }
const TOTAL_INV = 1762
const WERUM_BASE = 750
const WERUM_GROWTH = 0.05

export interface SimState {
  rate: number
  horizon: number
  totalScales: number
  siteWD: number
  siteCW: number
}

export interface CalcResult {
  amc: number
  cumAMC: number
  perScale: number
  validated: number
  unvalidated: number
  amcPerScaleYr: number
  amcPerScaleMo: number
  rdPortion: number
  hwPortion: number
  asPortion: number
  rdPct: number
  hwPct: number
  asPct: number
  siteWDcost: number
  siteCWcost: number
  siteTotal: number
  werumYears: number[]
  werumTotal: number
  sav5yr: number
}

export function calc(state: SimState): CalcResult {
  const amc = TOTAL_INV * state.rate / 100
  const cumAMC = amc * state.horizon
  const perScale = cumAMC / state.totalScales
  const validated = perScale * 1.2
  const unvalidated = perScale * 0.8
  const amcPerScaleYr = amc / state.totalScales
  const amcPerScaleMo = amcPerScaleYr / 12

  const rdPortion = (INV.rd * state.rate / 100 * state.horizon) / state.totalScales
  const hwPortion = (INV.hw * state.rate / 100 * state.horizon) / state.totalScales
  const asPortion = (INV.as_ * state.rate / 100 * state.horizon) / state.totalScales

  const rdPct = (INV.rd / TOTAL_INV) * 100
  const hwPct = (INV.hw / TOTAL_INV) * 100
  const asPct = (INV.as_ / TOTAL_INV) * 100

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
    amc, cumAMC, perScale, validated, unvalidated, amcPerScaleYr, amcPerScaleMo,
    rdPortion, hwPortion, asPortion, rdPct, hwPct, asPct,
    siteWDcost, siteCWcost, siteTotal, werumYears, werumTotal, sav5yr,
  }
}

export const SITES: Record<string, { wd: number; cw: number; total: number }> = {
  SAKA:   { wd: 8,  cw: 5, total: 13 },
  FIMA:   { wd: 3,  cw: 3, total: 6  },
  DANKOS: { wd: 23, cw: 9, total: 32 },
  KF:     { wd: 47, cw: 9, total: 56 },
}
