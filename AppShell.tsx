import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { LogOut, ShieldCheck } from 'lucide-react'
import logo from '../assets/logo_rbr.svg'
import { useAuth } from '../context/AuthContext'

export function AppShell() {
  const { session, profile, isAdmin, signOut } = useAuth()
  const nav = useNavigate()
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6">
          {/* Logomarca oficial, sem alteração (apenas dimensionada pela altura) */}
          <Link to="/" aria-label="RBR Representações — início"><img src={logo} alt="RBR Representações" className="h-10 w-auto" /></Link>
          <nav className="ml-2 hidden items-center gap-1 sm:flex">
            {session && <NavLink to="/regioes" className={({ isActive }) => `rounded-lg px-3 py-2 text-sm font-semibold ${isActive ? 'bg-rbr-50 text-rbr-700' : 'text-slate-600 hover:bg-slate-100'}`}>Regiões</NavLink>}
            {isAdmin && <NavLink to="/admin" className={({ isActive }) => `flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold ${isActive ? 'bg-rbr-50 text-rbr-700' : 'text-slate-600 hover:bg-slate-100'}`}><ShieldCheck className="h-4 w-4" />Administração</NavLink>}
          </nav>
          <div className="ml-auto flex items-center gap-3">
            {session && (
              <>
                <div className="hidden text-right leading-tight md:block">
                  <p className="text-sm font-semibold text-slate-800">{profile?.full_name ?? session.user.email}</p>
                  <p className="text-xs text-slate-500">{isAdmin ? 'Administrador' : 'Promotor'}</p>
                </div>
                <button className="btn-secondary btn-sm" onClick={async () => { await signOut(); nav('/') }}><LogOut className="h-4 w-4" /><span className="hidden sm:inline">Sair</span></button>
              </>
            )}
          </div>
        </div>
        {session && (
          <nav className="flex gap-1 border-t border-slate-100 px-3 py-1.5 sm:hidden">
            <NavLink to="/regioes" className="rounded-lg px-3 py-1.5 text-sm font-semibold text-slate-700">Regiões</NavLink>
            {isAdmin && <NavLink to="/admin" className="rounded-lg px-3 py-1.5 text-sm font-semibold text-slate-700">Administração</NavLink>}
          </nav>
        )}
      </header>
      <main className="flex-1"><Outlet /></main>
      <footer className="border-t border-slate-200 bg-white py-5 text-center text-xs text-slate-500">
        RBR Representações Ltda. · Uso interno · Os dados deste portal são confidenciais
      </footer>
    </div>
  )
}
