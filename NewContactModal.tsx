import { useMemo, useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Modal, Notice } from './ui'
import { maskDDMM, parseDDMM } from '../lib/dates'
import { findDuplicates, type DuplicateHit } from '../lib/duplicates'
import { regionName } from '../lib/regions'
import type { NewContact } from '../lib/api'
import type { Contact } from '../lib/types'

const TYPES = ['CLIENTE', 'PARCEIRO', 'INDÚSTRIA', 'TRANSPORTADORA']

export function NewContactModal({ regionCode, existing, onClose, onSave }: { regionCode: string; existing: Contact[]; onClose: () => void; onSave: (c: NewContact) => Promise<void> }) {
  const [f, setF] = useState({ name: '', company: '', type: regionCode === 'IND' ? 'INDÚSTRIA' : 'CLIENTE', job: '', bd: '', notes: '' })
  const [error, setError] = useState<string | null>(null)
  const [dups, setDups] = useState<DuplicateHit[] | null>(null)
  const [saving, setSaving] = useState(false)
  const companies = useMemo(() => [...new Set(existing.map((c) => c.company).filter(Boolean) as string[])].sort(), [existing])
  const set = (k: keyof typeof f, v: string) => { setF((s) => ({ ...s, [k]: v })); setDups(null) }

  const save = async (ignoreDuplicates: boolean) => {
    setError(null)
    if (f.name.trim().length < 2) return setError('Informe o nome completo do contato.')
    let day: number | null = null, month: number | null = null
    if (f.bd.trim()) {
      const p = parseDDMM(f.bd)
      if (!p) return setError('Data de aniversário inválida. Use o formato DD/MM (ex.: 25/07).')
      day = p.day; month = p.month
    }
    if (!ignoreDuplicates) {
      const hits = findDuplicates(f.name, f.company, existing)
      if (hits.length) { setDups(hits); return }
    }
    setSaving(true)
    try {
      await onSave({ region_code: regionCode, name: f.name.trim(), company: f.company.trim() || null, contact_type: f.type, job_title: f.job.trim() || null, birthday_day: day, birthday_month: month, notes: f.notes.trim() || null })
    } catch (e) { setError(e instanceof Error ? e.message : 'Não foi possível salvar.'); setSaving(false) }
  }

  return (
    <Modal wide onClose={onClose} title="Adicionar novo aniversariante" subtitle={`Região: ${regionName(regionCode)}`}>
      <form className="grid gap-4 sm:grid-cols-2" onSubmit={(e) => { e.preventDefault(); void save(false) }}>
        <div className="sm:col-span-2">
          <label className="label" htmlFor="n-name">Nome completo <span className="text-red-600">*</span></label>
          <input id="n-name" className="input" value={f.name} onChange={(e) => set('name', e.target.value)} autoFocus autoComplete="off" />
        </div>
        <div>
          <label className="label" htmlFor="n-co">Cliente / Empresa vinculada</label>
          <input id="n-co" className="input" list="companies" value={f.company} onChange={(e) => set('company', e.target.value)} autoComplete="off" />
          <datalist id="companies">{companies.map((c) => <option key={c} value={c} />)}</datalist>
        </div>
        <div>
          <label className="label" htmlFor="n-type">Tipo de contato</label>
          <select id="n-type" className="input" value={f.type} onChange={(e) => set('type', e.target.value)}>{TYPES.map((t) => <option key={t}>{t}</option>)}</select>
        </div>
        <div>
          <label className="label" htmlFor="n-job">Cargo</label>
          <input id="n-job" className="input" value={f.job} onChange={(e) => set('job', e.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor="n-bd">Data de aniversário (DD/MM)</label>
          <input id="n-bd" className="input" inputMode="numeric" placeholder="DD/MM" value={f.bd} onChange={(e) => set('bd', maskDDMM(e.target.value))} />
        </div>
        <div>
          <label className="label" htmlFor="n-reg">Região</label>
          <input id="n-reg" className="input bg-slate-100 text-slate-600" value={regionName(regionCode)} readOnly />
        </div>
        <div className="sm:col-span-2">
          <label className="label" htmlFor="n-obs">Observação <span className="font-normal text-slate-400">(opcional)</span></label>
          <textarea id="n-obs" className="input min-h-[72px]" value={f.notes} onChange={(e) => set('notes', e.target.value)} />
        </div>

        {dups && (
          <div className="sm:col-span-2 rounded-xl border border-amber-300 bg-amber-50 p-4" role="alert">
            <p className="flex items-center gap-2 text-sm font-bold text-amber-900"><AlertTriangle className="h-4 w-4" />Encontramos cadastros parecidos nesta região</p>
            <ul className="mt-2 space-y-1 text-sm text-amber-900">
              {dups.map(({ contact: c, exact }) => (
                <li key={c.id}>• <strong>{c.name}</strong>{c.company ? ` — ${c.company}` : ''} {exact && <span className="rounded bg-amber-200 px-1.5 py-0.5 text-[11px] font-bold">IGUAL</span>}</li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-amber-800">Se for a mesma pessoa, cancele e atualize o cadastro existente.</p>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <button type="button" className="btn-secondary btn-sm" onClick={() => setDups(null)}>Voltar e revisar</button>
              <button type="button" className="btn btn-sm bg-amber-600 text-white hover:bg-amber-700" disabled={saving} onClick={() => void save(true)}>É outra pessoa — salvar mesmo assim</button>
            </div>
          </div>
        )}
        {error && <div className="sm:col-span-2"><Notice tone="error">{error}</Notice></div>}
        <div className="flex flex-col-reverse gap-2 sm:col-span-2 sm:flex-row sm:justify-end">
          <button type="button" className="btn-secondary" onClick={onClose} disabled={saving}>Cancelar</button>
          <button type="submit" className="btn-primary" disabled={saving || !!dups}>{saving ? 'Salvando…' : 'Salvar aniversariante'}</button>
        </div>
      </form>
    </Modal>
  )
}
