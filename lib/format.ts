export function fmio(n: number): string {
  if (n === 0) return '—'
  if (n >= 1000) return 'IDR ' + (n / 1000).toFixed(2).replace(/\.00$/, '') + ' Bio'
  if (n >= 1) return 'IDR ' + n.toFixed(1).replace(/\.0$/, '') + ' Mio'
  return 'IDR ' + Math.round(n * 1000) + ' K'
}
