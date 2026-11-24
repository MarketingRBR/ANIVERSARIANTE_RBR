export type RegistrationStatus = 'pending' | 'active' | 'inactive'
export type BirthdayStatus = 'pending' | 'confirmed' | 'corrected' | 'unknown'
export type Role = 'admin' | 'promoter'

export interface Region { code: string; name: string; sort_order: number }

export interface Contact {
  id: string
  region_code: string
  name: string
  company: string | null
  contact_type: string | null
  email: string | null
  mobile: string | null
  company_phone: string | null
  registered_at: string | null
  had_access_original: string | null
  department: string | null
  job_title: string | null
  region_criterion: string | null
  origin: string | null
  birthday_day: number | null
  birthday_month: number | null
  registration_status: RegistrationStatus
  registration_checked_at: string | null
  registration_checked_by: string | null
  birthday_status: BirthdayStatus
  birthday_checked_at: string | null
  birthday_checked_by: string | null
  notes: string | null
  source: 'planilha' | 'promotor' | 'admin'
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface Profile {
  id: string
  email: string | null
  full_name: string | null
  role: Role
  active: boolean
}

export interface HistoryEntry {
  id: number
  contact_id: string
  region_code: string
  action: 'insert' | 'update'
  changes: Record<string, { de?: unknown; para?: unknown }>
  actor_id: string | null
  actor_name: string | null
  created_at: string
}
