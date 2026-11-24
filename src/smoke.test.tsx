import { describe, expect, it } from 'vitest'
import { renderToString } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Home from './pages/Home'
import Regions from './pages/Regions'
import { ContactList } from './components/ContactList'
import { ReviewModal } from './components/ReviewModal'
import { NewContactModal } from './components/NewContactModal'
import { ToastProvider } from './context/Toast'
import type { Contact } from './lib/types'

const c = (p: Partial<Contact>): Contact => ({
  id: '1', region_code: 'BA', name: 'FULANO TESTE', company: 'EMPRESA TESTE LTDA', contact_type: 'CLIENTE', email: null, mobile: null, company_phone: null,
  registered_at: null, had_access_original: 'Não', department: null, job_title: 'COMPRADOR', region_criterion: null, origin: null, birthday_day: null, birthday_month: null,
  registration_status: 'pending', registration_checked_at: null, registration_checked_by: null, birthday_status: 'pending', birthday_checked_at: null, birthday_checked_by: null,
  notes: null, source: 'planilha', created_by: null, created_at: '2026-01-01', updated_at: '2026-01-01', ...p,
})

const wrap = (el: React.ReactNode) => renderToString(<MemoryRouter><AuthProvider><ToastProvider>{el}</ToastProvider></AuthProvider></MemoryRouter>)

describe('renderização (smoke)', () => {
  it('tela inicial traz título, subtítulo, orientação e botão', () => {
    const h = wrap(<Home />)
    expect(h).toContain('ANIVERSARIANTES')
    expect(h).toContain('Manter nossos cadastros atualizados é uma forma de fortalecer relacionamentos.')
    expect(h).toContain('ACESSAR MINHA REGIÃO')
  })
  it('seleção de região lista as 10 regiões', () => {
    const h = wrap(<Regions />)
    for (const n of ['Bahia', 'Pernambuco', 'Paraíba', 'Alagoas', 'Rio Grande do Norte', 'Ceará', 'Sergipe', 'Maranhão', 'Piauí', 'Indústrias e Transportadoras']) expect(h).toContain(n)
  })
  it('lista destaca ausência de aniversário e mostra as duas ações', () => {
    const h = wrap(<ContactList contacts={[c({}), c({ id: '2', birthday_day: 5, birthday_month: 3 })]} onReview={() => {}} />)
    expect(h).toContain('Sem aniversário')
    expect(h).toContain('05/03')
    expect(h).toContain('Confirmar cadastro')
    expect(h).toContain('Conferir aniversário')
  })
  it('modais renderizam as perguntas do enunciado', () => {
    expect(wrap(<ReviewModal contact={c({})} mode="registration" onClose={() => {}} onSave={async () => {}} />)).toContain('Este cadastro continua ativo?')
    const b = wrap(<ReviewModal contact={c({ birthday_day: 1, birthday_month: 2 })} mode="birthday" onClose={() => {}} onSave={async () => {}} />)
    expect(b).toContain('A data de aniversário está correta?'); expect(b).toContain('Não tenho essa informação')
    expect(wrap(<NewContactModal regionCode="BA" existing={[]} onClose={() => {}} onSave={async () => {}} />)).toContain('Adicionar novo aniversariante')
  })
})
