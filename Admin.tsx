import { useMemo, useState } from 'react'
import { BarChart3, Download, History, ListChecks, Users } from 'lucide-react'
import { useContacts } from '../../lib/useContacts'
import { fetchHistory } from '../../lib/api'
import { exportToExcel } from '../../lib/export'
import { useToast } from '../../context/Toast'
import { Notice, Spinner } from '../../components/ui'
import Overview from './Overview'
import AdminContacts from './AdminContacts'
import HistoryTab from './HistoryTab'
import UsersTab from './UsersTab'

const TABS = [
  { key: 'overview', label: 'Visão geral', icon: BarChart3 },
  { key: 'contacts', label: 'Cadastros', icon: ListChecks },
  { key: 'history', label: 'Histórico', icon: History },
  { key: 'users', label: 'Usuários', icon: Users },
] as const

export default function Admin() {
  const [tab, setTab] = useState<(typeof TABS)[number]['key']>('overview')
  const { contacts, loading, error, update } = useContacts()
  const toast = useToast()
  const [exporting, setExporting] = useState(false)
  const names = useMemo(() => new Map(contacts.map((c) => [c.id, c.name])), [contacts])

  const doExport = async () => {
    setExporting(true)
    try {
      const history = await fetchHistory(2000)
      await exportToExcel(contacts, history, (id) => names.get(id) ?? id)
      toast('success', 'Planilha gerada', 'O download do arquivo Excel foi iniciado.')
    } catch (e) { toast('error', 'Falha ao exportar', e instanceof Error ? e.message : undefined) }
    finally { setExporting(false) }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Painel administrativo</h1><p className="text-slate-500">Acompanhamento da conferência em todas as regiões.</p></div>
        <button className="btn-primary" onClick={doExport} disabled={exporting || loading}><Download className="h-4 w-4" />{exporting ? 'Gerando…' : 'Exportar para Excel'}</button>
      </div>
      <div className="mt-5 flex gap-1 overflow-x-auto border-b border-slate-200" role="tablist">
        {TABS.map((t) => (
          <button key={t.key} role="tab" aria-selected={tab === t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-semibold ${tab === t.key ? 'border-rbr-600 text-rbr-700' : 'border-transparent text-slate-500 hover:text-slate-800'}`}><t.icon className="h-4 w-4" />{t.label}</button>
        ))}
      </div>
      <div className="mt-6">
        {error && <Notice tone="error">{error}</Notice>}
        {loading ? <Spinner /> : (
          <>
            {tab === 'overview' && <Overview contacts={contacts} />}
            {tab === 'contacts' && <AdminContacts contacts={contacts} onSave={update} />}
            {tab === 'history' && <HistoryTab names={names} />}
            {tab === 'users' && <UsersTab />}
          </>
        )}
      </div>
    </div>
  )
}
