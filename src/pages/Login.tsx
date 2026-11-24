import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Lock, Mail } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { Notice } from '../components/ui'

export default function Login() {
  const { session, signIn } = useAuth()
  const nav = useNavigate()
  const from = (useLocation().state as { from?: string } | null)?.from ?? '/regioes'
  const [email, setEmail] = useState('')
  const [pw, setPw] = useState('')
  const [err, setErr] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  if (session) return <Navigate to={from} replace />

  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-12">
      <div className="card p-6 sm:p-8">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Entrar</h1>
        <p className="mt-1 text-sm text-slate-500">Use o e-mail e a senha cadastrados para o seu acesso.</p>
        <form className="mt-6 space-y-4" onSubmit={async (e) => {
          e.preventDefault(); setBusy(true); setErr(null)
          const m = await signIn(email, pw)
          if (m) { setErr(m); setBusy(false) } else nav(from, { replace: true })
        }}>
          <div>
            <label className="label" htmlFor="email">E-mail</label>
            <div className="relative"><Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input id="email" type="email" required autoComplete="username" className="input pl-10" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          </div>
          <div>
            <label className="label" htmlFor="pw">Senha</label>
            <div className="relative"><Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input id="pw" type="password" required autoComplete="current-password" className="input pl-10" value={pw} onChange={(e) => setPw(e.target.value)} /></div>
          </div>
          {err && <Notice tone="error">{err}</Notice>}
          <button className="btn-primary w-full" disabled={busy}>{busy ? 'Entrando…' : 'Entrar'}</button>
        </form>
        <p className="mt-5 text-center text-xs text-slate-500">Não tem acesso? Solicite ao Marketing RBR.</p>
      </div>
    </div>
  )
}
