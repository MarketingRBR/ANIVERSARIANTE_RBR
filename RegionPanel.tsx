import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, CalendarX2, CheckCircle2, ListChecks, PartyPopper, Plus, Search, UserCheck, UserPlus, UserX, Users } from 'lucide-react'
import { regionName } from '../lib/regions'
import { useContacts } from '../lib/useContacts'
import { FILTERS, computeStats, matchesFilter, type FilterKey } from '../lib/status'
import { normalize } from '../lib/text'
import type { Contact } from '../lib/types'
import { useToast } from '../context/Toast'
import { ContactList } from '../components/ContactList'
import { ReviewModal, type ReviewMode } from '../components/ReviewModal'
import { NewContactModal } from '../components/NewContactModal'
import { Notice, ProgressBar, Spinner, StatCard } from '../components/ui'

const PAGE = 40

export default function RegionPanel() {
  const { code = '' } = useParams()
  const nav = useNavigate()
  const toast = useToast()
  const { contacts, loading, error, update, add, reload } = useContacts(code)
  const [filter, setFilter] = useState<FilterKey | null>(null)
  const [q, setQ] = useState('')
  const [shown, setShown] = useState(PAGE)
  const [review, setReview] = useState<{ c: Contact; mode: ReviewMode } | null>(null)
  const [adding, setAdding] = useState(false)

  const stats = useMemo(() => computeStats(contacts), [contacts])
  // Retomar de onde parou: ao abrir, já mostra os pendentes (se houver)
  const active: FilterKey = filter ?? (stats.checked < stats.total ? 'pending' : 'all')
  useEffect(() => setShown(PAGE), [active, q])

  const counts = useMemo(() => Object.fromEntries(FILTERS.map((f) => [f.key, contacts.filter((c) => matchesFilter(c, f.key)).length])) as Record<FilterKey, number>, [contacts])
  const list = useMemo(() => {
    const nq = normalize(q)
    return contacts.filter((c) => matchesFilter(c, active) && (!nq || normalize(c.name).includes(nq) || normalize(c.company).includes(nq)))
  }, [contacts, active, q])

  const name = regionName(code)
  const msg = stats.total === 0 ? 'Nenhum cadastro nesta região.'
    : stats.percent === 0 ? 'Você ainda não conferiu nenhum cadastro da sua região. Vamos começar?'
    : stats.percent === 100 ? 'Conferência completa! Você conferiu 100% dos cadastros da sua região.'
    : `Você já conferiu ${stats.percent}% dos cadastros da sua região.`

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <Link to="/regioes" className="inline-flex items-center gap-1.5 text-sm font-semibold text-rbr-700 hover:underline"><ArrowLeft className="h-4 w-4" />Todas as regiões</Link>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{name}</h1>
        <button className="btn-primary" onClick={() => setAdding(true)}><Plus className="h-5 w-5" />ADICIONAR NOVO ANIVERSARIANTE</button>
      </div>

      {error && <div className="mt-4"><Notice tone="error">{error} <button className="font-bold underline" onClick={reload}>Tentar de novo</button></Notice></div>}
      {loading ? <Spinner /> : (
        <>
          <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard icon={Users} label="Total de cadastros" value={stats.total} />
            <StatCard icon={UserCheck} tone="green" label="Cadastros ativos" value={stats.active} hint={`${stats.pendingRegistration} a confirmar`} />
            <StatCard icon={UserX} tone="slate" label="Cadastros inativos" value={stats.inactive} />
            <StatCard icon={PartyPopper} label="Aniversários cadastrados" value={stats.withBirthday} />
            <StatCard icon={CalendarX2} tone="red" label="Sem informação de aniversário" value={stats.withoutBirthday} />
            <StatCard icon={UserPlus} tone="amber" label="Novos cadastros adicionados" value={stats.added} />
          </div>

          <div className="card mt-4 p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="font-semibold text-slate-800">{msg}</p>
              <p className="text-sm text-slate-500">{stats.checked} de {stats.total} conferidos</p>
            </div>
            <ProgressBar percent={stats.percent} className="mt-3" />
            {stats.percent < 100 && stats.total > 0 && (
              <button className="btn-soft btn-sm mt-3" onClick={() => { setFilter('pending'); setQ('') }}><ListChecks className="h-4 w-4" />Continuar conferência ({stats.total - stats.checked} pendentes)</button>
            )}
          </div>

          <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Filtros">
              {FILTERS.map((f) => (
                <button key={f.key} role="tab" aria-selected={active === f.key} onClick={() => setFilter(f.key)}
                  className={`whitespace-nowrap rounded-full px-3.5 py-2 text-sm font-semibold ring-1 ring-inset transition-colors ${active === f.key ? 'bg-rbr-600 text-white ring-rbr-600' : 'bg-white text-slate-600 ring-slate-300 hover:bg-slate-50'}`}>
                  {f.label} <span className={active === f.key ? 'text-rbr-100' : 'text-slate-400'}>{counts[f.key]}</span>
                </button>
              ))}
            </div>
            <div className="relative lg:w-80">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input className="input pl-10" placeholder="Pesquisar por nome ou empresa" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Pesquisar" />
            </div>
          </div>

          <div className="mt-4">
            {list.length === 0 ? (
              <div className="card p-10 text-center text-slate-500">{contacts.length === 0 ? 'Nenhum cadastro encontrado para esta região.' : 'Nenhum cadastro neste filtro.'}</div>
            ) : (
              <>
                <ContactList contacts={list.slice(0, shown)} onReview={(c, mode) => setReview({ c, mode })} />
                {list.length > shown && <div className="mt-4 text-center"><button className="btn-secondary" onClick={() => setShown((n) => n + PAGE)}>Mostrar mais ({list.length - shown} restantes)</button></div>}
              </>
            )}
          </div>

          {stats.total > 0 && stats.percent === 100 && (
            <div className="card mt-8 border-emerald-200 bg-emerald-50 p-6 text-center">
              <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600" />
              <h2 className="mt-2 text-lg font-bold text-emerald-900">Conferência da região concluída</h2>
              <p className="mt-1 text-sm text-emerald-800">{stats.total} cadastros conferidos, {stats.corrected} aniversários corrigidos e {stats.added} novos contatos incluídos. Obrigado!</p>
              <button className="btn-primary mt-4" onClick={() => { toast('success', 'Conferência finalizada', 'Obrigado por manter a base de aniversariantes atualizada.'); nav('/regioes') }}>Finalizar conferência</button>
            </div>
          )}
        </>
      )}

      {review && (
        <ReviewModal contact={review.c} mode={review.mode} onClose={() => setReview(null)}
          onSave={async (patch, summary) => { await update(review.c.id, patch); setReview(null); toast('success', 'Salvo!', `${review.c.name}: ${summary}`) }} />
      )}
      {adding && (
        <NewContactModal regionCode={code} existing={contacts} onClose={() => setAdding(false)}
          onSave={async (c) => { await add(c); setAdding(false); setFilter('new'); toast('success', 'Cadastro adicionado com sucesso!', 'Obrigado por contribuir com a atualização da nossa base.') }} />
      )}
    </div>
  )
}
