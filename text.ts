export const normalize = (s: string | null | undefined): string =>
  (s ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim()

function bigrams(s: string): Map<string, number> {
  const m = new Map<string, number>()
  const t = s.replace(/ /g, '')
  for (let i = 0; i < t.length - 1; i++) { const g = t.slice(i, i + 2); m.set(g, (m.get(g) ?? 0) + 1) }
  return m
}

/** Coeficiente de Dice sobre bigramas (0 a 1). */
export function similarity(a: string, b: string): number {
  if (!a || !b) return 0
  if (a === b) return 1
  const A = bigrams(a), B = bigrams(b)
  let inter = 0, sa = 0, sb = 0
  A.forEach((n, g) => { sa += n; inter += Math.min(n, B.get(g) ?? 0) })
  B.forEach((n) => { sb += n })
  return sa + sb === 0 ? 0 : (2 * inter) / (sa + sb)
}
