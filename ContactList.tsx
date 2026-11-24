import { CalendarX2, CheckCircle2, Cake } from 'lucide-react'
import { StatusBadge } from './ui'
import { formatDDMM } from '../lib/dates'
import { hasBirthday, isFullyChecked, visualStatus } from '../lib/status'
import type { Contact } from '../lib/types'
import type { ReviewMode } from './ReviewModal'

const REG = { pending: ['A confirmar', 'text-amber-700'], active: ['Ativo', 'text-emerald-700'], inactive: ['Inativo', 'text-slate-500'] } as const

function Birthday({ c }: { c: Contact }) {
  return hasBirthday(c)
    ? <span className="inline-flex items-center gap-1.5 font-semibold text-slate-800"><Cake className="h-4 w-4 text-rbr-500" />{formatDDMM(c.birthday_day, c.birthday_month)}</span>
    : <span className="inline-flex items-center gap-1.5 rounded-md bg-red-50 px-2 py-1 text-xs font-semibold text-red-700 ring-1 ring-inset ring-red-200"><CalendarX2 className="h-3.5 w-3.5" />Sem aniversário</span>
}

function Actions({ c, onReview }: { c: Contact; onReview: (c: Contact, m: ReviewMode) => void }) {
  const done = (ok: boolean) => (ok ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : null)
  return (
    <div className="flex flex-wrap gap-2">
      <button className="btn-soft btn-sm" onClick={() => onReview(c, 'registration')}>{done(c.registration_status !== 'pending')}Confirmar cadastro</button>
      <button className="btn-soft btn-sm" onClick={() => onReview(c, 'birthday')}>{done(c.birthday_status !== 'pending')}Conferir aniversário</button>
    </div>
  )
}

export function ContactList({ contacts, onReview }: { contacts: Contact[]; onReview: (c: Contact, m: ReviewMode) => void }) {
  return (
    <>
      {/* Tabela: tablets e computadores */}
      <div className="card hidden overflow-hidden md:block">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>{['Nome', 'Cliente / Empresa', 'Tipo', 'Cargo', 'Aniversário', 'Cadastro', 'Conferência', 'Ações'].map((h) => <th key={h} className="whitespace-nowrap px-4 py-3 font-semibold">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {contacts.map((c) => (
                <tr key={c.id} className={isFullyChecked(c) ? 'bg-white' : 'bg-white hover:bg-rbr-50/30'}>
                  <td className="px-4 py-3 font-semibold text-slate-900">{c.name}</td>
                  <td className="max-w-[240px] px-4 py-3 text-slate-600">{c.company ?? '—'}</td>
                  <td className="px-4 py-3 text-slate-600">{c.contact_type ?? '—'}</td>
                  <td className="px-4 py-3 text-slate-600">{c.job_title ?? '—'}</td>
                  <td className="px-4 py-3"><Birthday c={c} /></td>
                  <td className={`whitespace-nowrap px-4 py-3 font-semibold ${REG[c.registration_status][1]}`}>{REG[c.registration_status][0]}</td>
                  <td className="px-4 py-3"><StatusBadge status={visualStatus(c)} /></td>
                  <td className="px-4 py-3"><Actions c={c} onReview={onReview} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cartões: celulares */}
      <ul className="space-y-3 md:hidden">
        {contacts.map((c) => (
          <li key={c.id} className="card p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-bold text-slate-900">{c.name}</p>
                <p className="text-sm text-slate-500">{c.company ?? 'Sem empresa vinculada'}</p>
              </div>
              <Birthday c={c} />
            </div>
            <p className="mt-1.5 text-xs text-slate-500">{[c.contact_type, c.job_title].filter(Boolean).join(' · ')}</p>
            <div className="mt-2.5 flex flex-wrap items-center gap-2">
              <StatusBadge status={visualStatus(c)} />
              <span className={`text-xs font-semibold ${REG[c.registration_status][1]}`}>Cadastro: {REG[c.registration_status][0].toLowerCase()}</span>
            </div>
            <div className="mt-3"><Actions c={c} onReview={onReview} /></div>
          </li>
        ))}
      </ul>
    </>
  )
}
