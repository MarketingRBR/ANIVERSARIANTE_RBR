// Lê LISTA_ANIVERSARIANTES_FINAL.xlsx e devolve os registros prontos para a tabela public.contacts.
import ExcelJS from 'exceljs'

const SHEETS = { BA: 'BA', PE: 'PE', PB: 'PB', AL: 'AL', RN: 'RN', CE: 'CE', SE: 'SE', MA: 'MA', PI: 'PI', 'Indústrias e Transp.': 'IND' }

const text = (v) => {
  if (v == null) return null
  if (typeof v === 'object' && 'text' in v) v = v.text            // hiperlink/rich text
  if (typeof v === 'object' && 'result' in v) v = v.result        // fórmula
  const s = String(v).trim()
  return s === '' ? null : s
}

export async function parsePlanilha(path) {
  const wb = new ExcelJS.Workbook()
  await wb.xlsx.readFile(path)
  const rows = [], warnings = [], perRegion = {}

  for (const [sheetName, regionCode] of Object.entries(SHEETS)) {
    const ws = wb.getWorksheet(sheetName)
    if (!ws) { warnings.push(`Aba "${sheetName}" não encontrada.`); continue }
    const head = {}
    ws.getRow(1).eachCell((cell, col) => { head[text(cell.value)] = col })
    const need = ['Nome', 'Vínculo com', 'Tipo', 'Aniversário', 'Tem Acesso?']
    for (const n of need) if (!head[n]) throw new Error(`Aba "${sheetName}": coluna "${n}" não encontrada.`)
    const get = (row, name) => (head[name] ? row.getCell(head[name]).value : null)

    ws.eachRow((row, i) => {
      if (i === 1) return
      const name = text(get(row, 'Nome'))
      if (!name) return
      const bd = get(row, 'Aniversário')
      let birthday_day = null, birthday_month = null
      if (bd instanceof Date && !Number.isNaN(bd.getTime())) { birthday_day = bd.getUTCDate(); birthday_month = bd.getUTCMonth() + 1 } // o ano da planilha (2026) é ignorado
      else if (bd != null) warnings.push(`${sheetName} linha ${i}: aniversário "${bd}" não reconhecido (ignorado).`)
      const dt = get(row, 'Dt. Cadastro')
      rows.push({
        region_code: regionCode,
        name,
        company: text(get(row, 'Vínculo com')),
        contact_type: text(get(row, 'Tipo')),
        email: text(get(row, 'E-mail do Contato')),
        mobile: text(get(row, 'Celular')),
        company_phone: text(get(row, 'Telefone Empresa')),
        registered_at: dt instanceof Date ? dt.toISOString() : null,
        had_access_original: text(get(row, 'Tem Acesso?')),     // preservado, NÃO vira "ativo"
        department: text(get(row, 'Departamento')),
        job_title: text(get(row, 'Cargo')),
        region_criterion: text(get(row, 'Critério da região')),
        origin: text(get(row, 'Origem')),
        birthday_day, birthday_month,
        source: 'planilha',
        // registration_status e birthday_status ficam no padrão 'pending' (nada é conferido automaticamente)
      })
      perRegion[regionCode] = (perRegion[regionCode] ?? 0) + 1
    })
  }
  return { rows, warnings, perRegion }
}
