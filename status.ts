import type { Contact } from './types'

export type VisualStatus = 'pending' | 'registration_confirmed' | 'birthday_confirmed' | 'corrected' | 'inactive' | 'new'

export const STATUS_LABEL: Record<VisualStatus, string> = {
  pending: 'Pendente de conferência',
  registration_confirmed: 'Cadastro confirmado',
  birthday_confirmed: 'Aniversário confirmado',
  corrected: 'Informação corrigida',
  inactive: 'Cadastro inativo',
  new: 'Novo cadastro',
}

/** Situação visual única de cada registro (a mais relevante para o promotor). */
export function visualStatus(c: Contact): VisualStatus {
  if (c.registration_status === 'inactive') return 'inactive'
  if (c.source === 'promotor') return 'new'
  if (c.birthday_status === 'corrected') return 'corrected'
  if (c.birthday_status === 'confirmed') return 'birthday_confirmed'
  if (c.registration_status === 'active') return 'registration_confirmed'
  return 'pending'
}

/**
 * Totalmente conferido = situação do cadastro respondida E (cadastro inativo OU aniversário respondido).
 * Cadastro confirmado sem checar o aniversário continua pendente.
 */
export function isFullyChecked(c: Contact): boolean {
  if (c.registration_status === 'pending') return false
  if (c.registration_status === 'inactive') return true
  return c.birthday_status !== 'pending'
}

export const hasBirthday = (c: Contact) => c.birthday_day != null && c.birthday_month != null

export interface Stats {
  total: number; active: number; inactive: number; pendingRegistration: number
  withBirthday: number; withoutBirthday: number; added: number; corrected: number
  checked: number; percent: number
}

export function computeStats(list: Contact[]): Stats {
  const total = list.length
  const checked = list.filter(isFullyChecked).length
  return {
    total,
    active: list.filter((c) => c.registration_status === 'active').length,
    inactive: list.filter((c) => c.registration_status === 'inactive').length,
    pendingRegistration: list.filter((c) => c.registration_status === 'pending').length,
    withBirthday: list.filter(hasBirthday).length,
    withoutBirthday: list.filter((c) => !hasBirthday(c)).length,
    added: list.filter((c) => c.source === 'promotor').length,
    corrected: list.filter((c) => c.birthday_status === 'corrected').length,
    checked,
    percent: total === 0 ? 0 : Math.round((checked / total) * 100),
  }
}

export type FilterKey = 'all' | 'pending' | 'checked' | 'no_birthday' | 'inactive' | 'new'

export const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'Todos' },
  { key: 'pending', label: 'Pendentes' },
  { key: 'checked', label: 'Conferidos' },
  { key: 'no_birthday', label: 'Sem aniversário' },
  { key: 'inactive', label: 'Inativos' },
  { key: 'new', label: 'Novos cadastros' },
]

export function matchesFilter(c: Contact, f: FilterKey): boolean {
  switch (f) {
    case 'all': return true
    case 'pending': return !isFullyChecked(c)
    case 'checked': return isFullyChecked(c)
    case 'no_birthday': return !hasBirthday(c)
    case 'inactive': return c.registration_status === 'inactive'
    case 'new': return c.source === 'promotor'
  }
}
