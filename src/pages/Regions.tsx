import { useNavigate } from 'react-router-dom'
import { ArrowRight, Lock } from 'lucide-react'
import { REGIONS } from '../lib/regions'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/Toast'
import { Notice } from '../components/ui'

export default function Regions() {
  const { allowed, profile, isAdmin } = useAuth()
  const nav = useNavigate()
  const toast = useToast()
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Selecione sua região</h1>
      <p className="mt-1 text-slate-500">Escolha a região que você atende para conferir os cadastros.</p>
      {profile && allowed.length === 0 && (
        <div className="mt-5"><Notice tone="warn">Seu usuário ainda não tem nenhuma região liberada. Fale com o Marketing RBR para solicitar o acesso.</Notice></div>
      )}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {REGIONS.map((r) => {
          const ok = allowed.includes(r.code)
          return (
            <div key={r.code} className={`card flex flex-col p-5 transition-shadow ${ok ? 'hover:shadow-lift' : 'opacity-60'}`}>
              <div className="flex items-start justify-between">
                <span className={`grid h-12 w-12 place-items-center rounded-xl ${ok ? 'bg-rbr-50 text-rbr-600' : 'bg-slate-100 text-slate-400'}`}><r.icon className="h-6 w-6" /></span>
                {r.short && <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-bold tracking-wider text-slate-600">{r.short}</span>}
              </div>
              <h2 className="mt-4 text-lg font-bold leading-snug text-slate-900">{r.name}</h2>
              <button className={`mt-5 ${ok ? 'btn-primary' : 'btn-secondary'} w-full`}
                onClick={() => ok ? nav(`/regiao/${r.code}`) : toast('error', 'Acesso não autorizado', `Seu usuário não tem permissão para ${r.name}.`)}>
                {ok ? <>Acessar região <ArrowRight className="h-4 w-4" /></> : <><Lock className="h-4 w-4" />Sem permissão</>}
              </button>
            </div>
          )
        })}
      </div>
      {isAdmin && <p className="mt-6 text-sm text-slate-500">Como administrador, você tem acesso a todas as regiões.</p>}
    </div>
  )
}
