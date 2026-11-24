import { describe, expect, it } from 'vitest'
import { formatDDMM, isValidDayMonth, maskDDMM, parseDDMM } from './dates'
import { computeStats, isFullyChecked, matchesFilter, visualStatus } from './status'
import { findDuplicates } from './duplicates'
import type { Contact } from './types'

const base: Contact = {
  id: '1', region_code: 'BA', name: 'FULANO TESTE', company: 'EMPRESA TESTE LTDA', contact_type: 'CLIENTE',
  email: null, mobile: null, company_phone: null, registered_at: null, had_access_original: 'Não', department: null,
  job_title: null, region_criterion: null, origin: null, birthday_day: null, birthday_month: null,
  registration_status: 'pending', registration_checked_at: null, registration_checked_by: null,
  birthday_status: 'pending', birthday_checked_at: null, birthday_checked_by: null, notes: null,
  source: 'planilha', created_by: null, created_at: '2026-01-01', updated_at: '2026-01-01',
}
const mk = (p: Partial<Contact>): Contact => ({ ...base, ...p })

describe('datas DD/MM', () => {
  it('valida e formata', () => {
    expect(parseDDMM('25/07')).toEqual({ day: 25, month: 7 })
    expect(parseDDMM('29/02')).toEqual({ day: 29, month: 2 })
    expect(parseDDMM('30/02')).toBeNull()
    expect(parseDDMM('31/04')).toBeNull()
    expect(parseDDMM('32/01')).toBeNull()
    expect(parseDDMM('10/13')).toBeNull()
    expect(parseDDMM('1/3')).toEqual({ day: 1, month: 3 })
    expect(parseDDMM('abc')).toBeNull()
    expect(isValidDayMonth(31, 12)).toBe(true)
    expect(formatDDMM(5, 3)).toBe('05/03')
    expect(maskDDMM('2507')).toBe('25/07')
    expect(maskDDMM('25/07/1990')).toBe('25/07')
  })
})

describe('conferência', () => {
  it('só considera conferido com cadastro E aniversário verificados', () => {
    expect(isFullyChecked(base)).toBe(false)
    expect(isFullyChecked(mk({ registration_status: 'active' }))).toBe(false)
    expect(isFullyChecked(mk({ registration_status: 'active', birthday_status: 'confirmed', birthday_day: 1, birthday_month: 1 }))).toBe(true)
    expect(isFullyChecked(mk({ registration_status: 'active', birthday_status: 'unknown' }))).toBe(true)
    expect(isFullyChecked(mk({ registration_status: 'inactive' }))).toBe(true)
  })
  it('status visual', () => {
    expect(visualStatus(base)).toBe('pending')
    expect(visualStatus(mk({ registration_status: 'active' }))).toBe('registration_confirmed')
    expect(visualStatus(mk({ registration_status: 'active', birthday_status: 'confirmed' }))).toBe('birthday_confirmed')
    expect(visualStatus(mk({ registration_status: 'active', birthday_status: 'corrected' }))).toBe('corrected')
    expect(visualStatus(mk({ registration_status: 'inactive' }))).toBe('inactive')
    expect(visualStatus(mk({ source: 'promotor', registration_status: 'active' }))).toBe('new')
  })
  it('estatísticas e filtros', () => {
    const list = [base, mk({ id: '2', registration_status: 'inactive' }), mk({ id: '3', registration_status: 'active', birthday_status: 'confirmed', birthday_day: 2, birthday_month: 2 })]
    const s = computeStats(list)
    expect(s).toMatchObject({ total: 3, checked: 2, percent: 67, inactive: 1, active: 1, withBirthday: 1, withoutBirthday: 2 })
    expect(list.filter((c) => matchesFilter(c, 'pending'))).toHaveLength(1)
    expect(list.filter((c) => matchesFilter(c, 'no_birthday'))).toHaveLength(2)
  })
})

describe('duplicidades', () => {
  const list = [
    mk({ id: 'a', name: 'MARCOS ALVES TESTE', company: 'DISTRIBUIDORA EXEMPLO' }),
    mk({ id: 'b', name: 'JOSÉ EXEMPLO', company: 'ATACADO MODELO AUTOPEÇAS (PB)' }),
  ]
  it('detecta nome parecido na mesma empresa, ignorando acento e caixa', () => {
    expect(findDuplicates('Marcos', 'distribuidora exemplo', list)).toHaveLength(1)
    expect(findDuplicates('Jose Exemplo', 'Atacado Modelo Autopecas (PB)', list)[0].exact).toBe(true)
  })
  it('não alerta para pessoas diferentes', () => {
    expect(findDuplicates('Carlos Souza', 'DISTRIBUIDORA EXEMPLO', list)).toHaveLength(0)
    expect(findDuplicates('Marcos', 'Outra Empresa', list)).toHaveLength(0)
  })
})
