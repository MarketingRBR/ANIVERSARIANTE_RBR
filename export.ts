import type { Contact, HistoryEntry } from './types'
import { regionName } from './regions'
import { formatDDMM, formatDateTime } from './dates'
import { STATUS_LABEL, visualStatus, isFullyChecked } from './status'

const REG: Record<string, string> = { pending: 'A confirmar', active: 'Ativo', inactive: 'Inativo' }

const COLS: { header: string; width: number; get: (c: Contact) => string }[] = [
  { header: 'Região', width: 24, get: (c) => regionName(c.region_code) },
  { header: 'Nome', width: 32, get: (c) => c.name },
  { header: 'Cliente / Empresa', width: 40, get: (c) => c.company ?? '' },
  { header: 'Tipo', width: 16, get: (c) => c.contact_type ?? '' },
  { header: 'Cargo', width: 24, get: (c) => c.job_title ?? '' },
  { header: 'Departamento', width: 20, get: (c) => c.department ?? '' },
  { header: 'E-mail', width: 32, get: (c) => c.email ?? '' },
  { header: 'Celular', width: 17, get: (c) => c.mobile ?? '' },
  { header: 'Telefone empresa', width: 17, get: (c) => c.company_phone ?? '' },
  { header: 'Aniversário (DD/MM)', width: 14, get: (c) => formatDDMM(c.birthday_day, c.birthday_month) },
  { header: 'Situação do cadastro', width: 18, get: (c) => REG[c.registration_status] },
  { header: 'Conferência do aniversário', width: 22, get: (c) => ({ pending: 'Pendente', confirmed: 'Confirmado', corrected: 'Corrigido', unknown: 'Sem informação' }[c.birthday_status]) },
  { header: 'Situação visual', width: 24, get: (c) => STATUS_LABEL[visualStatus(c)] },
  { header: 'Totalmente conferido', width: 12, get: (c) => (isFullyChecked(c) ? 'Sim' : 'Não') },
  { header: 'Origem', width: 14, get: (c) => (c.source === 'promotor' ? 'Incluído por promotor' : c.source === 'admin' ? 'Admin' : 'Planilha') },
  { header: 'Incluído em', width: 18, get: (c) => (c.source === 'promotor' ? formatDateTime(c.created_at) : '') },
  { header: 'Última conferência', width: 18, get: (c) => formatDateTime([c.registration_checked_at, c.birthday_checked_at].filter(Boolean).sort().pop() ?? null) },
  { header: 'Tem Acesso? (planilha original)', width: 16, get: (c) => c.had_access_original ?? '' },
  { header: 'Observação', width: 36, get: (c) => c.notes ?? '' },
]

export async function exportToExcel(contacts: Contact[], history: HistoryEntry[], nameOf: (id: string) => string) {
  const ExcelJS = (await import('exceljs')).default
  const wb = new ExcelJS.Workbook()
  wb.creator = 'Aniversariantes RBR'
  wb.created = new Date()

  const sheet = (title: string, list: Contact[]) => {
    const ws = wb.addWorksheet(title, { views: [{ state: 'frozen', ySplit: 1 }] })
    ws.columns = COLS.map((c) => ({ header: c.header, width: c.width }))
    list.forEach((c) => ws.addRow(COLS.map((col) => col.get(c))))
    const head = ws.getRow(1)
    head.font = { bold: true, color: { argb: 'FFFFFFFF' } }
    head.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF23669A' } }
    head.alignment = { vertical: 'middle', wrapText: true }
    head.height = 30
    ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: COLS.length } }
    // Aniversário como texto DD/MM: o Excel não converte em data com ano
    ws.getColumn(10).numFmt = '@'
  }

  sheet('Todos os cadastros', contacts)
  sheet('Novos cadastros', contacts.filter((c) => c.source === 'promotor'))
  sheet('Aniversários corrigidos', contacts.filter((c) => c.birthday_status === 'corrected'))
  sheet('Cadastros inativos', contacts.filter((c) => c.registration_status === 'inactive'))

  if (history.length) {
    const ws = wb.addWorksheet('Histórico (recentes)', { views: [{ state: 'frozen', ySplit: 1 }] })
    ws.columns = [
      { header: 'Data/hora', width: 18 }, { header: 'Região', width: 22 }, { header: 'Contato', width: 32 },
      { header: 'Ação', width: 12 }, { header: 'Campo', width: 24 }, { header: 'De', width: 28 }, { header: 'Para', width: 28 }, { header: 'Usuário', width: 26 },
    ]
    for (const h of history) {
      for (const [campo, v] of Object.entries(h.changes)) {
        ws.addRow([formatDateTime(h.created_at), regionName(h.region_code), nameOf(h.contact_id), h.action === 'insert' ? 'Inclusão' : 'Alteração', campo, String(v.de ?? ''), String(v.para ?? ''), h.actor_name ?? ''])
      }
    }
    ws.getRow(1).font = { bold: true }
  }

  const buf = await wb.xlsx.writeBuffer()
  const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `aniversariantes-rbr-${new Date().toISOString().slice(0, 10)}.xlsx`
  a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 2000)
}
