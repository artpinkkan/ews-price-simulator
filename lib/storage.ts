import type { InvestmentItem } from './calc'

const STORAGE_KEY = 'ews-simulator-v1'

export interface PersistedState {
  items: InvestmentItem[]
  rate: number
  horizon: number
  totalScales: number
  siteWD: number
  siteCW: number
  siteName: string
  implFee: number
  addOns: number
}

export function loadState(): PersistedState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    // basic shape check
    if (!Array.isArray(parsed.items)) return null
    return parsed as PersistedState
  } catch {
    return null
  }
}

export function saveState(state: PersistedState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // storage quota exceeded or private mode
  }
}

export function clearState(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {}
}

export function exportJSON(state: PersistedState): void {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `ews-simulator-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}

export function importJSON(): Promise<PersistedState> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json,application/json'
    input.onchange = () => {
      const file = input.files?.[0]
      if (!file) return reject(new Error('No file selected'))
      const reader = new FileReader()
      reader.onload = () => {
        try {
          const parsed = JSON.parse(reader.result as string)
          if (!Array.isArray(parsed.items)) throw new Error('Invalid format')
          resolve(parsed as PersistedState)
        } catch {
          reject(new Error('Invalid JSON file'))
        }
      }
      reader.readAsText(file)
    }
    input.click()
  })
}
