import { supabase } from './supabase'
import type { Contact, HistoryEntry, Profile } from './types'

const PAGE = 1000 // limite padrão do PostgREST

function fail(error: { message: string } | null): asserts error is null {
  if (error) throw new Error(error.message)
}

export async function fetchContacts(regionCode?: string): Promise<Contact[]> {
  const all: Contact[] = []
  for (let from = 0; ; from += PAGE) {
    let q = supabase.from('contacts').select('*').order('company', { nullsFirst: false }).order('name').order('id').range(from, from + PAGE - 1)
    if (regionCode) q = q.eq('region_code', regionCode)
    const { data, error } = await q
    fail(error)
    all.push(...(data as Contact[]))
    if (!data || data.length < PAGE) break
  }
  return all
}

export async function patchContact(id: string, patch: Partial<Contact>): Promise<Contact> {
  const { data, error } = await supabase.from('contacts').update(patch).eq('id', id).select().single()
  fail(error)
  return data as Contact
}

export type NewContact = Pick<Contact, 'region_code' | 'name' | 'company' | 'contact_type' | 'job_title' | 'birthday_day' | 'birthday_month' | 'notes'>

export async function insertContact(c: NewContact): Promise<Contact> {
  const { data, error } = await supabase.from('contacts').insert(c).select().single()
  fail(error)
  return data as Contact
}

export async function fetchHistory(limit = 300): Promise<HistoryEntry[]> {
  const { data, error } = await supabase.from('contact_history').select('*').order('created_at', { ascending: false }).limit(limit)
  fail(error)
  return data as HistoryEntry[]
}

export async function fetchProfiles(): Promise<{ profiles: Profile[]; regions: Record<string, string[]> }> {
  const [p, r] = await Promise.all([
    supabase.from('profiles').select('*').order('full_name'),
    supabase.from('user_regions').select('user_id, region_code'),
  ])
  fail(p.error); fail(r.error)
  const regions: Record<string, string[]> = {}
  for (const row of r.data ?? []) (regions[row.user_id] ??= []).push(row.region_code)
  return { profiles: p.data as Profile[], regions }
}

export async function updateProfile(id: string, patch: Partial<Pick<Profile, 'role' | 'active' | 'full_name'>>) {
  const { error } = await supabase.from('profiles').update(patch).eq('id', id)
  fail(error)
}

export async function setUserRegion(userId: string, region: string, enabled: boolean) {
  const { error } = enabled
    ? await supabase.from('user_regions').upsert({ user_id: userId, region_code: region })
    : await supabase.from('user_regions').delete().eq('user_id', userId).eq('region_code', region)
  fail(error)
}
