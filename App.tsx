import { lazy, Suspense, type ReactNode } from 'react'
import { HashRouter, Navigate, Route, Routes, useLocation, useParams } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ToastProvider } from './context/Toast'
import { AppShell } from './components/AppShell'
import { Spinner } from './components/ui'
import { isConfigured } from './lib/supabase'
import Home from './pages/Home'
import Login from './pages/Login'
import Regions from './pages/Regions'
import RegionPanel from './pages/RegionPanel'
import { SetupNeeded } from './pages/Setup'

const Admin = lazy(() => import('./pages/admin/Admin'))

function RequireAuth({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth()
  const loc = useLocation()
  if (loading) return <Spinner />
  if (!session) return <Navigate to="/entrar" state={{ from: loc.pathname }} replace />
  return <>{children}</>
}

function RequireRegion({ children }: { children: ReactNode }) {
  const { allowed, profile } = useAuth()
  const { code = '' } = useParams()
  if (!profile) return <Spinner />
  if (!allowed.includes(code)) return <Navigate to="/regioes" replace />
  return <>{children}</>
}

function RequireAdmin({ children }: { children: ReactNode }) {
  const { isAdmin, profile } = useAuth()
  if (!profile) return <Spinner />
  if (!isAdmin) return <Navigate to="/regioes" replace />
  return <>{children}</>
}

export default function App() {
  if (!isConfigured) return <SetupNeeded />
  return (
    <HashRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            <Route element={<AppShell />}>
              <Route index element={<Home />} />
              <Route path="entrar" element={<Login />} />
              <Route path="regioes" element={<RequireAuth><Regions /></RequireAuth>} />
              <Route path="regiao/:code" element={<RequireAuth><RequireRegion><RegionPanel /></RequireRegion></RequireAuth>} />
              <Route path="admin" element={<RequireAuth><RequireAdmin><Suspense fallback={<Spinner />}><Admin /></Suspense></RequireAdmin></RequireAuth>} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </HashRouter>
  )
}
