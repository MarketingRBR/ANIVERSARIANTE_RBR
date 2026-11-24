const DAYS_IN_MONTH = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31] // fevereiro aceita 29/02

export function isValidDayMonth(day: number, month: number): boolean {
  return Number.isInteger(day) && Number.isInteger(month) && month >= 1 && month <= 12 && day >= 1 && day <= DAYS_IN_MONTH[month - 1]
}

/** Aplica máscara DD/MM enquanto a pessoa digita. */
export function maskDDMM(raw: string): string {
  const d = raw.replace(/\D/g, '').slice(0, 4)
  return d.length <= 2 ? d : `${d.slice(0, 2)}/${d.slice(2)}`
}

/** "25/07" -> {day:25, month:7}; devolve null se inválido. */
export function parseDDMM(text: string): { day: number; month: number } | null {
  const m = /^(\d{1,2})\/(\d{1,2})$/.exec(text.trim())
  if (!m) return null
  const day = Number(m[1]), month = Number(m[2])
  return isValidDayMonth(day, month) ? { day, month } : null
}

export function formatDDMM(day: number | null, month: number | null): string {
  if (day == null || month == null) return ''
  return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}`
}

export function formatDateTime(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
}
