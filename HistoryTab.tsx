import { useEffect, useState } from 'react'
import { fetchHistory } from '../../lib/api'
import { REGIONS, regionName } from '../../lib/regions'
import { formatDateTime } from '../../lib/dates'
import type { HistoryEntry } from '../../lib/types'
import { Notice, Spinner } from '../../components/ui'

const FIELD: Record<string, string> = {
  name: 'Nome', company: 'Empresa', contact_type: 'Tipo', job_title: 'Cargo', department: 'Departamento', email: 'E-mail', mobile: 'Celular', company_phone: 'Telefone empresa',
  region_code: 'Região', birthday_day: 'Dia do aniversário', birthday_month: 'Mês do aniversário', registration_status: 'Situação do cadastro', birthday_status: 'Conferência do aniversário', notes: 'Observação', source: 'Origem',
}
const VAL: Record<string, string> = { pending: 'pendente', active: 'ativo', inactive: 'inativo', confirmed: 'confirmado', corrected: 'corrigido', unknown: 'sem informação', promotor: 'promotor', planilha: 'planilha', admin: 'admin' }
const show = (v: unknown) => (v == null || v === '' ? '—' : VAL[String(v)] ?? String(v))

export default function HistoryTab({ names }: { names: Map<string, string> }) {
  const [rows, setRows] = useState<HistoryEntry[] | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [region, setRegion] = useState('all')
  useEffect(() => { fetchHistory(500).then(setRows).catch((e) => setErr(e.message)) }, [])
  if (err) return <Notice tone="error">{err}</Notice>
  if (!rows) return <Spinner />
  const list = rows.filter((r) => region === 'all' || r.region_code === region)
  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-slate-500">Últimas {rows.length} alterações registradas automaticamente pelo banco.</p>
        <select className="input !w-56" aria-label="Região" value={region} onChange={(e) => setRegion(e.target.value)}><option value="all">Todas as regiões</option>{REGIONS.map((r) => <option key={r.code} value={r.code}>{r.name}</option>)}</select>
      </div>
      <ul className="mt-3 space-y-2">
        {list.length === 0 && <li className="card p-8 text-center text-slate-500">Nenhuma alteração registrada.</li>}
        {list.map((h) => (
          <li key={h.id} className="card p-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="font-semibold text-slate-900">{names.get(h.contact_id) ?? 'Contato'} <span className="font-normal text-slate-500">· {regionName(h.region_code)}</span></p>
              <p className="text-xs text-slate-500">{formatDateTime(h.created_at)} · {h.actor_name ?? 'Sistema'}</p>
            </div>
            <p className="mt-1 text-xs font-bold uppercase tracking-wide text-rbr-600">{h.action === 'insert' ? 'Inclusão' : 'Alteração'}</p>
            <ul className="mt-1 space-y-0.5 text-sm text-slate-700">
              {Object.entries(h.changes).map(([k, v]) => <li key={k}><strong>{FIELD[k] ?? k}:</strong> {h.action === 'insert' ? show(v.para) : <>{show(v.de)} → <strong>{show(v.para)}</strong></>}</li>)}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  )
}
