import { useCallback, useEffect, useState } from 'react'
import { fetchContacts, insertContact, patchContact, type NewContact } from './api'
import type { Contact } from './types'

export function useContacts(regionCode?: string) {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    setLoading(true); setError(null)
    try { setContacts(await fetchContacts(regionCode)) }
    catch (e) { setError(e instanceof Error ? e.message : 'Falha ao carregar os cadastros.') }
    finally { setLoading(false) }
  }, [regionCode])

  useEffect(() => { void reload() }, [reload])

  const update = useCallback(async (id: string, patch: Partial<Contact>) => {
    const saved = await patchContact(id, patch)            // o banco devolve a linha já carimbada pelos triggers
    setContacts((l) => l.map((c) => (c.id === id ? saved : c)))
    return saved
  }, [])

  const add = useCallback(async (c: NewContact) => {
    const saved = await insertContact(c)
    setContacts((l) => [saved, ...l])
    return saved
  }, [])

  return { contacts, loading, error, reload, update, add }
}
