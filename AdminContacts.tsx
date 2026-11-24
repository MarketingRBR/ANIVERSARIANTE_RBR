import { useMemo, useState } from 'react'
import { Pencil, Search } from 'lucide-react'
import { FILTERS, matchesFilter, visualStatus, type FilterKey } from '../../lib/status'
import { REGIONS, regionName } from '../../lib/regions'
import { formatDDMM, maskDDMM, parseDDMM } from '../../lib/dates'
import { normalize } from '../../lib/text'
import type { BirthdayStatus, Contact, RegistrationStatus } from '../../lib/types'
import { useToast } from '../../context/Toast'
import { Modal, Notice, StatusBadge } from '../../components/ui'

const PAGE = 50

function EditModal({ c, onClose, onSave }: { c: Contact; onClose: () => void; onSave: (p: Partial<Contact>) => Promise<void> }) {
  const [f, setF] = useState({
    name: c.name, company: c.company ?? '', contact_type: c.contact_type ?? '', job_title: c.job_title ?? '', department: c.department ?? '',
    email: c.email ?? '', mobile: c.mobile ?? '', company_phone: c.company_phone ?? '', region_code: c.region_code,
    bd: formatDDMM(c.birthday_day, c.birthday_month), registration_status: c.registration_status, birthday_status: c.birthday_status, notes: c.notes ?? '',
  })
  const [err, setErr] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const set = (k: keyof typeof f, v: string) => setF((s) => ({ ...s, [k]: v }))
  const nn = (s: string) => s.trim() || null

  const save = async () => {
    setErr(null)
    if (f.name.trim().length < 2) return setErr('Informe o nome.')
    let day: number | null = null, month: number | null = null
    if (f.bd.trim()) { const p = parseDDMM(f.bd); if (!p) return setErr('Aniversário inválido (use DD/MM).'); day = p.day; month = p.month }
    setBusy(true)
    try {
      await onSave({ name: f.name.trim(), company: nn(f.company), contact_type: nn(f.contact_type), job_title: nn(f.job_title), department: nn(f.department), email: nn(f.email), mobile: nn(f.mobile), company_phone: nn(f.company_phone),
        region_code: f.region_code, birthday_day: day, birthday_month: month, registration_status: f.registration_status as RegistrationStatus, birthday_status: f.birthday_status as BirthdayStatus, notes: nn(f.notes) })
    } catch (e) { setErr(e instanceof Error ? e.message : 'Falha ao salvar.'); setBusy(false) }
  }
  const T = (label: string, k: keyof typeof f, extra?: { mask?: boolean }) => (
    <div><label className="label">{label}</label><input className="input" value={f[k]} onChange={(e) => set(k, extra?.mask ? maskDDMM(e.target.value) : e.target.value)} /></div>
  )
  return (
    <Modal wide title="Editar registro" subtitle={c.name} onClose={onClose}>
      <div className="grid gap-4 sm:grid-cols-2">
        {T('Nome', 'name')}{T('Cliente / Empresa', 'company')}{T('Tipo', 'contact_type')}{T('Cargo', 'job_title')}{T('Departamento', 'department')}{T('E-mail', 'email')}{T('Celular', 'mobile')}{T('Telefone empresa', 'company_phone')}
        <div><label className="label">Região</label><select className="input" value={f.region_code} onChange={(e) => set('region_code', e.target.value)}>{REGIONS.map((r) => <option key={r.code} value={r.code}>{r.name}</option>)}</select></div>
        {T('Aniversário (DD/MM)', 'bd', { mask: true })}
        <div><label className="label">Situação do cadastro</label><select className="input" value={f.registration_status} onChange={(e) => set('registration_status', e.target.value)}><option value="pending">A confirmar</option><option value="active">Ativo</option><option value="inactive">Inativo</option></select></div>
        <div><label className="label">Conferência do aniversário</label><select className="input" value={f.birthday_status} onChange={(e) => set('birthday_status', e.target.value)}><option value="pending">Pendente</option><option value="confirmed">Confirmado</option><option value="corrected">Corrigido</option><option value="unknown">Sem informação</option></select></div>
        <div className="sm:col-span-2"><label className="label">Observação</label><textarea className="input min-h-[64px]" value={f.notes} onChange={(e) => set('notes', e.target.value)} /></div>
        <p className="text-xs text-slate-500 sm:col-span-2">“Tem Acesso?” da planilha original: <strong>{c.had_access_original ?? '—'}</strong> (informação preservada; não define se o cadastro está ativo).</p>
        {err && <div className="sm:col-span-2"><Notice tone="error">{err}</Notice></div>}
        <div className="flex justify-end gap-2 sm:col-span-2"><button className="btn-secondary" onClick={onClose} disabled={busy}>Cancelar</button><button className="btn-primary" onClick={save} disabled={busy}>{busy ? 'Salvando…' : 'Salvar alterações'}</button></div>
      </div>
    </Modal>
  )
}

export default function AdminContacts({ contacts, onSave }: { contacts: Contact[]; onSave: (id: string, p: Partial<Contact>) => Promise<Contact> }) {
  const [region, setRegion] = useState('all')
  const [filter, setFilter] = useState<FilterKey>('all')
  const [q, setQ] = useState('')
  const [shown, setShown] = useState(PAGE)
  const [edit, setEdit] = useState<Contact | null>(null)
  const toast = useToast()
  const list = useMemo(() => {
    const nq = normalize(q)
    return contacts.filter((c) => (region === 'all' || c.region_code === region) && matchesFilter(c, filter) && (!nq || normalize(c.name).includes(nq) || normalize(c.company).includes(nq)))
  }, [contacts, region, filter, q])

  return (
    <div>
      <div className="grid gap-3 md:grid-cols-[200px_200px_1fr]">
        <select className="input" aria-label="Região" value={region} onChange={(e) => { setRegion(e.target.value); setShown(PAGE) }}><option value="all">Todas as regiões</option>{REGIONS.map((r) => <option key={r.code} value={r.code}>{r.name}</option>)}</select>
        <select className="input" aria-label="Filtro" value={filter} onChange={(e) => { setFilter(e.target.value as FilterKey); setShown(PAGE) }}>{FILTERS.map((f) => <option key={f.key} value={f.key}>{f.label}</option>)}</select>
        <div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input className="input pl-10" placeholder="Pesquisar por nome ou empresa" value={q} onChange={(e) => { setQ(e.target.value); setShown(PAGE) }} /></div>
      </div>
      <p className="mt-3 text-sm text-slate-500">{list.length} registros</p>
      <div className="card mt-2 overflow-hidden"><div className="overflow-x-auto"><table className="w-full text-left text-sm">
        <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr>{['Região', 'Nome', 'Empresa', 'Cargo', 'Aniv.', 'Situação', ''].map((h) => <th key={h} className="whitespace-nowrap px-4 py-3 font-semibold">{h}</th>)}</tr></thead>
        <tbody className="divide-y divide-slate-100">
          {list.slice(0, shown).map((c) => (
            <tr key={c.id}><td className="whitespace-nowrap px-4 py-2.5 text-slate-600">{regionName(c.region_code)}</td><td className="px-4 py-2.5 font-semibold text-slate-900">{c.name}</td><td className="max-w-[240px] px-4 py-2.5 text-slate-600">{c.company ?? '—'}</td>
              <td className="px-4 py-2.5 text-slate-600">{c.job_title ?? '—'}</td><td className="px-4 py-2.5 font-semibold">{formatDDMM(c.birthday_day, c.birthday_month) || <span className="text-red-600">—</span>}</td>
              <td className="px-4 py-2.5"><StatusBadge status={visualStatus(c)} /></td>
              <td className="px-4 py-2.5"><button className="btn-secondary btn-sm" onClick={() => setEdit(c)}><Pencil className="h-3.5 w-3.5" />Editar</button></td></tr>
          ))}
        </tbody></table></div></div>
      {list.length > shown && <div className="mt-4 text-center"><button className="btn-secondary" onClick={() => setShown((n) => n + PAGE)}>Mostrar mais</button></div>}
      {edit && <EditModal c={edit} onClose={() => setEdit(null)} onSave={async (p) => { await onSave(edit.id, p); setEdit(null); toast('success', 'Registro atualizado', 'A alteração foi gravada no histórico.') }} />}
    </div>
  )
}
