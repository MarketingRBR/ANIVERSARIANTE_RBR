import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { Profile } from '../lib/types'
import { REGIONS } from '../lib/regions'

interface AuthState {
  loading: boolean
  session: Session | null
  profile: Profile | null
  isAdmin: boolean
  /** Regiões que o usuário pode abrir (admin = todas). A garantia real é a RLS no banco. */
  allowed: string[]
  signIn: (email: string, password: string) => Promise<string | null>
  signOut: () => Promise<void>
}

const Ctx = createContext<AuthState | null>(null)
export const useAuth = () => {
  const v = useContext(Ctx)
  if (!v) throw new Error('useAuth fora do AuthProvider')
  return v
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [regionCodes, setRegionCodes] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

const loadProfile = useCallback(async (s: Session | null) => {
  if (!s) {
    setProfile(null)
    setRegionCodes([])
    return
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, full_name, role, active')
    .eq('id', s.user.id)
    .single()

  if (error) {
    console.error('Erro ao carregar perfil:', error)
    setProfile(null)
    return
  }

  console.log('Perfil carregado:', data)

  setProfile(data as Profile)

  const { data: regions, error: regionError } = await supabase
    .from('user_regions')
    .select('region_code')
    .eq('user_id', s.user.id)

  if (regionError) {
    console.error('Erro ao carregar regiões:', regionError)
    setRegionCodes([])
    return
  }

  setRegionCodes((regions ?? []).map((x) => x.region_code))
}, [])
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session)
      await loadProfile(data.session)
      setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, s) => {
      setSession(s)
      // adia a consulta para fora do callback do Auth (evita deadlock do supabase-js)
      setTimeout(() => { void loadProfile(s) }, 0)
    })
    return () => sub.subscription.unsubscribe()
  }, [loadProfile])

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    return error ? 'E-mail ou senha incorretos.' : null
  }, [])

  const signOut = useCallback(async () => { await supabase.auth.signOut() }, [])

  const value = useMemo<AuthState>(() => {
    const usable = !!profile && profile.active
    const isAdmin = usable && profile!.role === 'admin'
    return {
      loading, session, profile, isAdmin, signIn, signOut,
      allowed: !usable ? [] : isAdmin ? REGIONS.map((r) => r.code) : regionCodes,
    }
  }, [loading, session, profile, regionCodes, signIn, signOut])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
