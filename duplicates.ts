import type { Contact } from './types'
import { normalize, similarity } from './text'

export interface DuplicateHit { contact: Contact; exact: boolean }

const tokens = (s: string) => s.split(' ').filter(Boolean)
const isSubset = (a: string[], b: string[]) => a.length > 0 && a.every((t) => b.includes(t))

/**
 * Procura registros semelhantes por NOME + EMPRESA VINCULADA.
 * - mesma empresa (ou empresas muito parecidas) e nome igual/parecido/contido (ex.: "Melchior" x "Melchior Vieira");
 * - se faltar empresa em algum dos lados, só alerta com nomes praticamente idênticos.
 */
export function findDuplicates(name: string, company: string, list: Contact[]): DuplicateHit[] {
  const n = normalize(name), co = normalize(company)
  if (!n) return []
  const nt = tokens(n)
  const hits: DuplicateHit[] = []
  for (const c of list) {
    const cn = normalize(c.name), cc = normalize(c.company)
    const nameSim = similarity(n, cn)
    const contained = isSubset(nt, tokens(cn)) || isSubset(tokens(cn), nt)
    const bothHaveCompany = co !== '' && cc !== ''
    const sameCompany = bothHaveCompany && (co === cc || similarity(co, cc) >= 0.85)
    const exact = n === cn && (co === cc)
    if (exact) hits.push({ contact: c, exact: true })
    else if (sameCompany && (nameSim >= 0.8 || contained)) hits.push({ contact: c, exact: false })
    else if (!bothHaveCompany && nameSim >= 0.92) hits.push({ contact: c, exact: false })
  }
  return hits.sort((a, b) => Number(b.exact) - Number(a.exact)).slice(0, 5)
}
