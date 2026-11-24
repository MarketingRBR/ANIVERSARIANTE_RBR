// Testa schema, triggers e políticas RLS num Postgres embutido (PGlite). Rode: npm run test:sql
import { PGlite } from '@electric-sql/pglite'
import fs from 'node:fs'
const db = new PGlite()
const P = new URL('../migrations/', import.meta.url).pathname
await db.exec(`
 create role anon nologin; create role authenticated nologin;
 create schema auth;
 create table auth.users (id uuid primary key default gen_random_uuid(), email text, raw_user_meta_data jsonb default '{}');
 create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
 grant usage on schema auth to anon, authenticated; grant execute on function auth.uid() to anon, authenticated;
 grant usage on schema public to anon, authenticated;
 alter default privileges in schema public grant all on tables to anon, authenticated;
 alter default privileges in schema public grant execute on functions to anon, authenticated;
`)
await db.exec(fs.readFileSync(P + '001_schema.sql', 'utf8'))
await db.exec(fs.readFileSync(P + '002_rls_triggers.sql', 'utf8'))

let pass = 0, fail = 0
const ok = (name, cond, extra='') => { cond ? pass++ : fail++; console.log((cond ? 'PASS ' : 'FAIL ') + name + (cond ? '' : '  ' + extra)) }
const as = async (uid) => { await db.exec('reset role'); if (uid) { await db.exec(`select set_config('request.jwt.claim.sub','${uid}',false); set role authenticated`) } else { await db.exec(`select set_config('request.jwt.claim.sub','',false); set role anon`) } }
const tryq = async (sql, params) => { try { const r = await db.query(sql, params); return { r } } catch (e) { return { e: e.message } } }

// usuários
const mk = async (email) => (await db.query(`insert into auth.users(email) values ($1) returning id`, [email])).rows[0].id
const admin = await mk('admin@rbr'), pBA = await mk('ba@rbr'), pPE = await mk('pe@rbr'), nobody = await mk('x@rbr')
await db.exec(`update profiles set role='admin' where email='admin@rbr'`)
await db.exec(`insert into user_regions values ('${pBA}','BA'), ('${pPE}','PE')`)
ok('trigger criou perfis', (await db.query('select count(*)::int c from profiles')).rows[0].c === 4)

// carga inicial (service role / superuser)
await db.exec(`insert into contacts(region_code,name,company,contact_type,had_access_original,birthday_day,birthday_month) values
 ('BA','TESTE A1','EMPRESA A','CLIENTE','Não',null,null), ('BA','TESTE A2','EMPRESA A','CLIENTE','Não',25,7),
 ('PE','TESTE B1','EMPRESA B','CLIENTE','Não',null,null), ('PE','TESTE B2','EMPRESA C','CLIENTE','Não',3,2)`)
const baId = (await db.query(`select id from contacts where name='TESTE A2'`)).rows[0].id
const peId = (await db.query(`select id from contacts where name='TESTE B1'`)).rows[0].id
ok('"Tem Acesso?" não vira ativo', (await db.query(`select count(*)::int c from contacts where registration_status<>'pending'`)).rows[0].c === 0)

// ---- anon
await as(null)
ok('anon não lê contatos', !!(await tryq('select * from contacts')).e)
// ---- usuário sem região
await as(nobody)
ok('usuário sem região vê 0 contatos', (await db.query('select * from contacts')).rows.length === 0)
// ---- promotor BA
await as(pBA)
ok('promotor BA vê só BA', (await db.query('select distinct region_code from contacts')).rows.map(r=>r.region_code).join() === 'BA')
let r = await db.query(`update contacts set registration_status='active' where id=$1 returning registration_status, registration_checked_by`, [baId])
ok('promotor confirma cadastro (e fica carimbado)', r.rows[0]?.registration_status === 'active' && r.rows[0].registration_checked_by === pBA)
r = await db.query(`update contacts set birthday_status='corrected', birthday_day=26, birthday_month=7 where id=$1 returning birthday_day`, [baId])
ok('promotor corrige aniversário', r.rows[0]?.birthday_day === 26)
ok('promotor não altera nome', !!(await tryq(`update contacts set name='HACK' where id=$1`, [baId])).e)
ok('promotor não muda região do registro', !!(await tryq(`update contacts set region_code='PE' where id=$1`, [baId])).e)
r = await db.query(`update contacts set registration_status='inactive' where id=$1 returning id`, [peId])
ok('promotor BA não altera registro de PE', r.rows.length === 0)
r = await tryq(`insert into contacts(region_code,name,company,source,registration_status,birthday_day,birthday_month) values ('BA','NOVO CONTATO','X','planilha','pending',10,10) returning source, registration_status, birthday_status, created_by`)
ok('inclusão: origem/status forçados pelo servidor', r.r?.rows[0]?.source === 'promotor' && r.r.rows[0].registration_status === 'active' && r.r.rows[0].birthday_status === 'confirmed' && r.r.rows[0].created_by === pBA, JSON.stringify(r))
ok('promotor não inclui em outra região', !!(await tryq(`insert into contacts(region_code,name) values ('PE','INTRUSO')`)).e)
ok('aniversário exige dia e mês juntos', !!(await tryq(`insert into contacts(region_code,name,birthday_day) values ('BA','SO DIA',5)`)).e)
r = await db.query('delete from contacts where id=$1 returning id', [baId])
ok('promotor não exclui', r.rows.length === 0)
ok('promotor não lê histórico', (await db.query('select * from contact_history')).rows.length === 0)
r = await db.query(`update profiles set role='admin' where id=$1 returning id`, [pBA])
ok('promotor não vira admin', r.rows.length === 0)
ok('promotor não se dá regiões', !!(await tryq(`insert into user_regions values ('${pBA}','PE')`)).e)
ok('promotor não escreve histórico', !!(await tryq(`insert into contact_history(contact_id,region_code,action) values ('${baId}','BA','x')`)).e)
// ---- admin
await as(admin)
ok('admin vê todas as regiões', (await db.query('select distinct region_code from contacts')).rows.length === 2)
r = await db.query(`update contacts set name='TESTE B1 EDITADO' where id=$1 returning name`, [peId])
ok('admin edita registros', r.rows[0]?.name === 'TESTE B1 EDITADO')
const h = (await db.query(`select action, actor_name, changes from contact_history order by id`)).rows
ok('histórico registrou inclusão e alterações', h.some(x=>x.action==='insert' && x.actor_name==='ba') && h.some(x=>x.changes?.birthday_day?.para===26) && h.some(x=>x.changes?.name?.para==='TESTE B1 EDITADO' && x.actor_name==='admin'), JSON.stringify(h.slice(-4)))
r = await db.query(`update profiles set role='admin' where id=$1 returning role`, [pPE])
ok('admin gerencia perfis', r.rows[0]?.role === 'admin')
r = await db.query('delete from contacts where name=$1 returning id', ['NOVO CONTATO'])
ok('admin exclui', r.rows.length === 1)
console.log(`\n${pass} ok, ${fail} falhas`)
process.exit(fail ? 1 : 0)
