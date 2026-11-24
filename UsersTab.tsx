import { useEffect, useState } from 'react'
import { fetchProfiles, setUserRegion, updateProfile } from '../../lib/api'
import { REGIONS } from '../../lib/regions'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/Toast'
import { Notice, Spinner } from '../../components/ui'
import type { Profile } from '../../lib/types'

export default function UsersTab() {
  const { profile: me } = useAuth()
  const toast = useToast()
  const [data, setData] = useState<{ profiles: Profile[]; regions: Record<string, string[]> } | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const load = () => fetchProfiles().then(setData).catch((e) => setErr(e.message))
  useEffect(() => { void load() }, [])

  const run = async (fn: () => Promise<void>) => { try { await fn(); await load() } catch (e) { toast('error', 'Não foi possível salvar', e instanceof Error ? e.message : undefined) } }
  if (err) return <Notice tone="error">{err}</Notice>
  if (!data) return <Spinner />
  return (
    <div className="space-y-4">
      <Notice tone="info">Novos usuários são criados em <strong>Supabase → Authentication → Users</strong> (a senha nunca passa pelo portal). Depois de criados, aparecem aqui sem região: libere as regiões abaixo.</Notice>
      <div className="space-y-3">
        {data.profiles.map((p) => {
          const mine = data.regions[p.id] ?? []
          const self = p.id === me?.id
          return (
            <div key={p.id} className={`card p-4 ${p.active ? '' : 'opacity-60'}`}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div><p className="font-semibold text-slate-900">{p.full_name ?? p.email}{self && <span className="ml-2 text-xs text-slate-500">(você)</span>}</p><p className="text-sm text-slate-500">{p.email}</p></div>
                <div className="flex items-center gap-3">
                  <select className="input !w-40" aria-label="Perfil" value={p.role} disabled={self} onChange={(e) => run(() => updateProfile(p.id, { role: e.target.value as Profile['role'] }))}><option value="promoter">Promotor</option><option value="admin">Administrador</option></select>
                  <label className="flex items-center gap-2 text-sm font-semibold text-slate-700"><input type="checkbox" className="h-4 w-4" checked={p.active} disabled={self} onChange={(e) => run(() => updateProfile(p.id, { active: e.target.checked }))} />Ativo</label>
                </div>
              </div>
              {p.role === 'promoter' && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {REGIONS.map((r) => { const on = mine.includes(r.code); return (
                    <button key={r.code} onClick={() => run(() => setUserRegion(p.id, r.code, !on))} aria-pressed={on}
                      className={`rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ring-inset ${on ? 'bg-rbr-600 text-white ring-rbr-600' : 'bg-white text-slate-600 ring-slate-300 hover:bg-slate-50'}`}>{r.short ?? 'Indústrias'}</button>
                  ) })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
