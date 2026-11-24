import { useState } from 'react'
import { CheckCircle2, HelpCircle, PencilLine, XCircle } from 'lucide-react'
import { Modal, Notice } from './ui'
import { formatDDMM, maskDDMM, parseDDMM } from '../lib/dates'
import { hasBirthday } from '../lib/status'
import type { Contact } from '../lib/types'

export type ReviewMode = 'registration' | 'birthday'
type Patch = Partial<Contact>

function Option({ selected, disabled, icon: Icon, label, sub, tone, onClick }: { selected: boolean; disabled?: boolean; icon: typeof XCircle; label: string; sub?: string; tone: 'green' | 'red' | 'blue' | 'slate'; onClick: () => void }) {
  const ring = { green: 'border-emerald-500 bg-emerald-50', red: 'border-red-500 bg-red-50', blue: 'border-rbr-500 bg-rbr-50', slate: 'border-slate-500 bg-slate-100' }[tone]
  const ic = { green: 'text-emerald-600', red: 'text-red-600', blue: 'text-rbr-600', slate: 'text-slate-600' }[tone]
  return (
    <button type="button" disabled={disabled} onClick={onClick} aria-pressed={selected}
      className={`flex w-full items-center gap-3 rounded-xl border-2 p-3.5 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${selected ? ring : 'border-slate-200 bg-white hover:border-slate-300'}`}>
      <Icon className={`h-6 w-6 shrink-0 ${selected ? ic : 'text-slate-400'}`} />
      <span><span className="block text-[15px] font-semibold text-slate-900">{label}</span>{sub && <span className="block text-xs text-slate-500">{sub}</span>}</span>
    </button>
  )
}

export function ReviewModal({ contact, mode, onClose, onSave }: { contact: Contact; mode: ReviewMode; onClose: () => void; onSave: (patch: Patch, summary: string) => Promise<void> }) {
  const had = hasBirthday(contact)
  const [reg, setReg] = useState<'active' | 'inactive' | null>(contact.registration_status === 'pending' ? null : contact.registration_status)
  const [bd, setBd] = useState<'confirmed' | 'corrected' | 'unknown' | null>(contact.birthday_status === 'pending' ? null : contact.birthday_status)
  const [date, setDate] = useState(formatDDMM(contact.birthday_day, contact.birthday_month))
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const submit = async () => {
    setError(null)
    let patch: Patch, summary: string
    if (mode === 'registration') {
      if (!reg) return setError('Escolha uma das opções para continuar.')
      patch = { registration_status: reg }
      summary = reg === 'active' ? 'Cadastro confirmado como ativo.' : 'Cadastro marcado como inativo.'
    } else {
      if (!bd) return setError('Escolha uma das opções para continuar.')
      if (bd === 'corrected') {
        const p = parseDDMM(date)
        if (!p) return setError('Informe uma data válida no formato DD/MM (ex.: 25/07).')
        patch = { birthday_status: 'corrected', birthday_day: p.day, birthday_month: p.month }
        summary = `Aniversário corrigido para ${formatDDMM(p.day, p.month)}.`
      } else {
        patch = { birthday_status: bd }
        summary = bd === 'confirmed' ? 'Aniversário confirmado.' : 'Registrado: sem informação de aniversário.'
      }
    }
    setSaving(true)
    try { await onSave(patch, summary) }
    catch (e) { setError(e instanceof Error ? e.message : 'Não foi possível salvar. Tente novamente.'); setSaving(false) }
  }

  return (
    <Modal onClose={onClose} title={mode === 'registration' ? 'Este cadastro continua ativo?' : 'A data de aniversário está correta?'}
      subtitle={`${contact.name}${contact.company ? ' · ' + contact.company : ''}`}>
      <div className="space-y-3">
        {mode === 'registration' ? (
          <>
            <Option selected={reg === 'active'} icon={CheckCircle2} tone="green" label="Sim, cadastro ativo" onClick={() => setReg('active')} />
            <Option selected={reg === 'inactive'} icon={XCircle} tone="red" label="Não, cadastro inativo" sub="Ex.: a pessoa saiu da empresa ou não é mais o contato" onClick={() => setReg('inactive')} />
          </>
        ) : (
          <>
            {had && <p className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">Data cadastrada: <strong className="text-slate-900">{formatDDMM(contact.birthday_day, contact.birthday_month)}</strong></p>}
            <Option selected={bd === 'confirmed'} disabled={!had} icon={CheckCircle2} tone="green" label="Sim, está correta" sub={had ? undefined : 'Não há data cadastrada para confirmar'} onClick={() => setBd('confirmed')} />
            <Option selected={bd === 'corrected'} icon={PencilLine} tone="blue" label={had ? 'Não, preciso corrigir' : 'Quero informar a data'} onClick={() => setBd('corrected')} />
            {bd === 'corrected' && (
              <div className="rounded-xl border border-rbr-200 bg-rbr-50/50 p-3.5">
                <label htmlFor="bd" className="label">Data correta (DD/MM)</label>
                <input id="bd" className="input max-w-[160px] text-center text-lg font-semibold tracking-wider" inputMode="numeric" placeholder="DD/MM" autoFocus
                  value={date} onChange={(e) => setDate(maskDDMM(e.target.value))} />
                <p className="mt-1.5 text-xs text-slate-500">Não precisa informar o ano de nascimento.</p>
              </div>
            )}
            <Option selected={bd === 'unknown'} icon={HelpCircle} tone="slate" label="Não tenho essa informação" onClick={() => setBd('unknown')} />
          </>
        )}
        {error && <Notice tone="error">{error}</Notice>}
        <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
          <button className="btn-secondary" onClick={onClose} disabled={saving}>Cancelar</button>
          <button className="btn-primary" onClick={submit} disabled={saving}>{saving ? 'Salvando…' : 'Salvar'}</button>
        </div>
      </div>
    </Modal>
  )
}
