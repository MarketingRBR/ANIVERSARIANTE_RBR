// Importação inicial da planilha para o Supabase. Rode LOCALMENTE:
//   npm run import:planilha -- caminho/LISTA_ANIVERSARIANTES_FINAL.xlsx --dry-run   (só confere, não grava)
//   npm run import:planilha -- caminho/LISTA_ANIVERSARIANTES_FINAL.xlsx             (grava)
// Requer SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env LOCAL (nunca no GitHub).
import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'
import { parsePlanilha } from './parse-planilha.mjs'

const args = process.argv.slice(2)
const file = args.find((a) => !a.startsWith('--'))
const dry = args.includes('--dry-run')
if (!file) { console.error('Uso: npm run import:planilha -- <arquivo.xlsx> [--dry-run]'); process.exit(1) }

const { rows, warnings, perRegion } = await parsePlanilha(file)
console.log(`\nLidos ${rows.length} registros:`)
console.table(perRegion)
console.log(`Com aniversário: ${rows.filter((r) => r.birthday_day).length} · sem aniversário: ${rows.filter((r) => !r.birthday_day).length}`)
warnings.forEach((w) => console.warn('⚠', w))
if (dry) { console.log('\n--dry-run: nada foi gravado.'); process.exit(0) }

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) { console.error('Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no arquivo .env local.'); process.exit(1) }
const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })

const { count, error: ce } = await db.from('contacts').select('id', { count: 'exact', head: true }).eq('source', 'planilha')
if (ce) { console.error('Erro ao consultar o banco:', ce.message); process.exit(1) }
if (count && count > 0) { console.error(`\nO banco já tem ${count} registros importados da planilha. Importação cancelada para não duplicar.`); process.exit(1) }

for (let i = 0; i < rows.length; i += 200) {
  const { error } = await db.from('contacts').insert(rows.slice(i, i + 200))
  if (error) { console.error(`Falha no lote ${i}–${i + 200}:`, error.message, '\nOs lotes anteriores já foram gravados; apague-os antes de repetir.'); process.exit(1) }
  console.log(`Gravados ${Math.min(i + 200, rows.length)}/${rows.length}`)
}
console.log('\n✔ Importação concluída.')
