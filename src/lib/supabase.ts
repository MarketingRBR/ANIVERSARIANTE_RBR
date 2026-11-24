import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

/** false enquanto .env / Secrets do GitHub não estiverem configurados. */
export const isConfigured = Boolean(url && anon && !url.includes('SEU-PROJETO'))

// Somente a chave ANON/publishable entra no front-end. A proteção dos dados é feita pelas políticas RLS.
export const supabase = createClient(url ?? 'http://localhost:54321', anon ?? 'sem-configuracao', {
  auth: { persistSession: true, autoRefreshToken: true },
})
