import { Anchor, Factory, Compass, Mountain, Palmtree, Sailboat, Sun, Trees, Waves, Wind, type LucideIcon } from 'lucide-react'

export interface RegionMeta { code: string; name: string; short?: string; icon: LucideIcon }

export const REGIONS: RegionMeta[] = [
  { code: 'BA', name: 'Bahia', short: 'BA', icon: Waves },
  { code: 'PE', name: 'Pernambuco', short: 'PE', icon: Anchor },
  { code: 'PB', name: 'Paraíba', short: 'PB', icon: Sun },
  { code: 'AL', name: 'Alagoas', short: 'AL', icon: Palmtree },
  { code: 'RN', name: 'Rio Grande do Norte', short: 'RN', icon: Wind },
  { code: 'CE', name: 'Ceará', short: 'CE', icon: Sailboat },
  { code: 'SE', name: 'Sergipe', short: 'SE', icon: Compass },
  { code: 'MA', name: 'Maranhão', short: 'MA', icon: Trees },
  { code: 'PI', name: 'Piauí', short: 'PI', icon: Mountain },
  { code: 'IND', name: 'Indústrias e Transportadoras', icon: Factory },
]

export const regionMeta = (code: string) => REGIONS.find((r) => r.code === code)
export const regionName = (code: string) => regionMeta(code)?.name ?? code
