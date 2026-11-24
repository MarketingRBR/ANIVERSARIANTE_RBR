import { useEffect, useRef, type ReactNode } from 'react'
import { Loader2, X, type LucideIcon } from 'lucide-react'
import { STATUS_LABEL, type VisualStatus } from '../lib/status'

export function Spinner({ label = 'Carregando…' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-16 text-slate-500" role="status">
      <Loader2 className="h-5 w-5 animate-spin" /> <span className="text-sm">{label}</span>
    </div>
  )
}

export function StatCard({ icon: Icon, label, value, tone = 'blue', hint }: { icon: LucideIcon; label: string; value: ReactNode; tone?: 'blue' | 'green' | 'red' | 'amber' | 'slate'; hint?: string }) {
  const tones = {
    blue: 'bg-rbr-50 text-rbr-600', green: 'bg-emerald-50 text-emerald-600', red: 'bg-red-50 text-red-600',
    amber: 'bg-amber-50 text-amber-600', slate: 'bg-slate-100 text-slate-600',
  }
  return (
    <div className="card flex items-center gap-3.5 p-4">
      <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${tones[tone]}`}><Icon className="h-5 w-5" /></span>
      <div className="min-w-0">
        <p className="text-2xl font-bold leading-none tracking-tight text-slate-900">{value}</p>
        <p className="mt-1 text-[13px] leading-tight text-slate-500">{label}</p>
        {hint && <p className="text-[11px] text-slate-400">{hint}</p>}
      </div>
    </div>
  )
}

export function ProgressBar({ percent, className = '' }: { percent: number; className?: string }) {
  return (
    <div className={`h-3 w-full overflow-hidden rounded-full bg-slate-200 ${className}`} role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
      <div className="h-full rounded-full bg-gradient-to-r from-rbr-500 to-rbr-600 transition-[width] duration-500" style={{ width: `${percent}%` }} />
    </div>
  )
}

const BADGE: Record<VisualStatus, string> = {
  pending: 'bg-amber-50 text-amber-800 ring-amber-200',
  registration_confirmed: 'bg-sky-50 text-sky-800 ring-sky-200',
  birthday_confirmed: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
  corrected: 'bg-violet-50 text-violet-800 ring-violet-200',
  inactive: 'bg-slate-100 text-slate-600 ring-slate-300',
  new: 'bg-rbr-50 text-rbr-700 ring-rbr-200',
}
export function StatusBadge({ status }: { status: VisualStatus }) {
  return <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${BADGE[status]}`}>{STATUS_LABEL[status]}</span>
}

export function Modal({ title, subtitle, onClose, children, wide }: { title: string; subtitle?: string; onClose: () => void; children: ReactNode; wide?: boolean }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    ref.current?.focus()
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = '' }
  }, [onClose])
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-rbr-950/50 p-0 sm:items-center sm:p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-label={title}
        className={`flex max-h-[92vh] w-full flex-col rounded-t-2xl bg-white shadow-lift outline-none sm:rounded-2xl ${wide ? 'sm:max-w-2xl' : 'sm:max-w-lg'}`}>
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-slate-900">{title}</h2>
            {subtitle && <p className="mt-0.5 truncate text-sm text-slate-500">{subtitle}</p>}
          </div>
          <button onClick={onClose} aria-label="Fechar" className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"><X className="h-5 w-5" /></button>
        </div>
        <div className="overflow-y-auto px-5 py-5">{children}</div>
      </div>
    </div>
  )
}

export function Notice({ tone, children }: { tone: 'error' | 'warn' | 'info'; children: ReactNode }) {
  const c = { error: 'border-red-200 bg-red-50 text-red-800', warn: 'border-amber-200 bg-amber-50 text-amber-900', info: 'border-rbr-200 bg-rbr-50 text-rbr-800' }[tone]
  return <div role={tone === 'error' ? 'alert' : undefined} className={`rounded-xl border px-4 py-3 text-sm ${c}`}>{children}</div>
}
