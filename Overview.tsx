import { useMemo } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { CalendarX2, CheckCheck, PencilLine, UserPlus, UserX, Users } from 'lucide-react'
import { REGIONS } from '../../lib/regions'
import { STATUS_LABEL, computeStats, visualStatus, type VisualStatus } from '../../lib/status'
import type { Contact } from '../../lib/types'
import { ProgressBar, StatCard } from '../../components/ui'

const COLORS: Record<VisualStatus, string> = { pending: '#F59E0B', registration_confirmed: '#38BDF8', birthday_confirmed: '#10B981', corrected: '#8B5CF6', inactive: '#94A3B8', new: '#23669A' }

export default function Overview({ contacts }: { contacts: Contact[] }) {
  const total = useMemo(() => computeStats(contacts), [contacts])
  const byRegion = useMemo(() => REGIONS.map((r) => ({ r, s: computeStats(contacts.filter((c) => c.region_code === r.code)) })), [contacts])
  const pie = useMemo(() => (Object.keys(STATUS_LABEL) as VisualStatus[]).map((k) => ({ key: k, name: STATUS_LABEL[k], value: contacts.filter((c) => visualStatus(c) === k).length })).filter((x) => x.value > 0), [contacts])
  const bars = byRegion.map(({ r, s }) => ({ name: r.short ?? 'IND', percent: s.percent }))

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard icon={Users} label="Total de cadastros" value={total.total} />
        <StatCard icon={CheckCheck} tone="green" label="Conferidos" value={`${total.percent}%`} hint={`${total.checked} de ${total.total}`} />
        <StatCard icon={PencilLine} tone="blue" label="Aniversários corrigidos" value={total.corrected} />
        <StatCard icon={UserPlus} tone="amber" label="Novos cadastros" value={total.added} />
        <StatCard icon={UserX} tone="slate" label="Cadastros inativos" value={total.inactive} />
        <StatCard icon={CalendarX2} tone="red" label="Sem aniversário" value={total.withoutBirthday} />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card p-5">
          <h2 className="font-bold text-slate-900">Conferência por região (%)</h2>
          <div className="mt-3 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bars} margin={{ left: -20, right: 8 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis domain={[0, 100]} tickLine={false} axisLine={false} fontSize={12} />
                <Tooltip formatter={(v) => [`${v}%`, 'Conferido']} cursor={{ fill: '#EEF5FA' }} />
                <Bar dataKey="percent" fill="#23669A" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="card p-5">
          <h2 className="font-bold text-slate-900">Situação dos cadastros</h2>
          <div className="mt-3 grid h-64 grid-cols-[1fr_auto] items-center gap-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart><Pie data={pie} dataKey="value" nameKey="name" innerRadius="55%" outerRadius="90%" paddingAngle={2}>{pie.map((p) => <Cell key={p.key} fill={COLORS[p.key]} />)}</Pie><Tooltip /></PieChart>
            </ResponsiveContainer>
            <ul className="space-y-1.5 text-xs text-slate-600">{pie.map((p) => <li key={p.key} className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: COLORS[p.key] }} />{p.name} <strong className="text-slate-900">{p.value}</strong></li>)}</ul>
          </div>
        </div>
      </div>
      <div className="card overflow-hidden">
        <div className="overflow-x-auto"><table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr>{['Região', 'Cadastros', 'Confirmados', 'Inativos', 'Corrigidos', 'Novos', 'Sem aniversário', 'Conferência'].map((h) => <th key={h} className="whitespace-nowrap px-4 py-3 font-semibold">{h}</th>)}</tr></thead>
          <tbody className="divide-y divide-slate-100">
            {byRegion.map(({ r, s }) => (
              <tr key={r.code}>
                <td className="px-4 py-3 font-semibold text-slate-900">{r.name}</td><td className="px-4 py-3">{s.total}</td><td className="px-4 py-3">{s.active}</td><td className="px-4 py-3">{s.inactive}</td>
                <td className="px-4 py-3">{s.corrected}</td><td className="px-4 py-3">{s.added}</td><td className="px-4 py-3">{s.withoutBirthday}</td>
                <td className="min-w-[160px] px-4 py-3"><div className="flex items-center gap-2"><ProgressBar percent={s.percent} className="!h-2" /><span className="w-10 text-right font-semibold">{s.percent}%</span></div></td>
              </tr>
            ))}
          </tbody>
        </table></div>
      </div>
    </div>
  )
}
