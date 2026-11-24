import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react'

type Tone = 'success' | 'error' | 'info'
interface T { id: number; tone: Tone; title: string; text?: string }
const Ctx = createContext<(tone: Tone, title: string, text?: string) => void>(() => {})
export const useToast = () => useContext(Ctx)

const ICON = { success: CheckCircle2, error: AlertTriangle, info: Info }
const COLOR = { success: 'text-emerald-600', error: 'text-red-600', info: 'text-rbr-600' }

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<T[]>([])
  const push = useCallback((tone: Tone, title: string, text?: string) => {
    const id = Date.now() + Math.random()
    setItems((l) => [...l, { id, tone, title, text }])
    setTimeout(() => setItems((l) => l.filter((x) => x.id !== id)), tone === 'error' ? 7000 : 4500)
  }, [])
  return (
    <Ctx.Provider value={push}>
      {children}
      <div className="fixed inset-x-0 bottom-4 z-[60] flex flex-col items-center gap-2 px-4 pointer-events-none" aria-live="polite">
        {items.map((t) => {
          const I = ICON[t.tone]
          return (
            <div key={t.id} role="status" className="pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-xl2 border border-slate-200 bg-white p-4 shadow-lift">
              <I className={`mt-0.5 h-5 w-5 shrink-0 ${COLOR[t.tone]}`} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-900">{t.title}</p>
                {t.text && <p className="mt-0.5 text-sm text-slate-600">{t.text}</p>}
              </div>
              <button onClick={() => setItems((l) => l.filter((x) => x.id !== t.id))} aria-label="Fechar" className="text-slate-400 hover:text-slate-600"><X className="h-4 w-4" /></button>
            </div>
          )
        })}
      </div>
    </Ctx.Provider>
  )
}
