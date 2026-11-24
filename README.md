# Aniversariantes RBR

Portal interno para os promotores conferirem e atualizarem os aniversários dos contatos de cada região, com painel administrativo para o Marketing.

**Stack:** React 19 + TypeScript + Tailwind CSS + Lucide · Supabase (Postgres, Auth, RLS) · GitHub Pages.

## O que já vem pronto

| Área | O que faz |
|---|---|
| Início / Login | Tela inicial com a mensagem institucional; login por e-mail e senha (Supabase Auth) |
| Regiões | 10 cards (BA, PE, PB, AL, RN, CE, SE, MA, PI e Indústrias e Transportadoras). Regiões sem permissão aparecem bloqueadas |
| Painel da região | Total, ativos, inativos, aniversários cadastrados, sem aniversário, novos cadastros e barra de % conferido |
| Lista | Tabela (desktop) / cartões (celular), busca por nome ou empresa, filtros Todos · Pendentes · Conferidos · Sem aniversário · Inativos · Novos |
| Conferência | "Este cadastro continua ativo?" e "A data está correta?" (corrigir em DD/MM, sem ano). Retoma de onde parou (abre em Pendentes) |
| Novo aniversariante | Formulário completo com alerta de duplicidade (nome + empresa, ignora acento/caixa) |
| Admin | Visão geral com gráficos, edição de registros, histórico de alterações, gestão de usuários/regiões, exportação para Excel |

Regra de conferência: um cadastro só conta como **conferido** quando a situação do cadastro foi respondida **e** (o cadastro é inativo **ou** o aniversário foi respondido).
O campo **"Tem Acesso?"** da planilha é guardado em `had_access_original` e **não** define se o cadastro está ativo (campo independente `registration_status`).

## Segurança (como está desenhada)

- Acesso real no banco por **RLS**: promotor só lê/atualiza contatos das regiões liberadas para o seu usuário; a tela de seleção de região é só conveniência.
- Promotor só pode alterar situação do cadastro, aniversário e observação (trigger bloqueia qualquer outro campo). Origem, autoria e carimbo de data/hora das inclusões e conferências são definidos **pelo servidor**, não pelo navegador.
- Histórico de alterações é gravado por trigger; ninguém escreve nele pelo front-end. Só admin lê.
- O front-end usa apenas a chave **anon**. A **service_role** só é usada no script de importação, no seu computador.
- Dados pessoais **não** ficam no GitHub: `.gitignore` bloqueia `*.xlsx`, `*.csv` e `.env`; o repositório contém só código.

## Passo a passo de configuração

### 1. Supabase
1. Crie um projeto em supabase.com.
2. **SQL Editor** → rode, nesta ordem, `supabase/migrations/001_schema.sql` e `002_rls_triggers.sql`.
3. **Authentication → Providers → Email**: desative **"Allow new users to sign up"** (usuários só são criados por você).
4. **Authentication → Users → Add user**: crie o seu usuário (e-mail + senha) e depois, no SQL Editor:
   ```sql
   update public.profiles set role = 'admin' where email = 'seu.email@rbr.com.br';
   ```
5. **Project Settings → API**: copie a **Project URL** e a chave **anon/publishable**.

### 2. Importar a planilha (uma única vez, no seu computador)
```bash
npm install
cp .env.example .env          # preencha SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY (somente local!)
npm run import:planilha -- "C:/caminho/LISTA_ANIVERSARIANTES_FINAL.xlsx" --dry-run   # confere
npm run import:planilha -- "C:/caminho/LISTA_ANIVERSARIANTES_FINAL.xlsx"             # grava
```
O script lê as abas BA, PE, PB, AL, RN, CE, SE, MA, PI e "Indústrias e Transp." (→ região `IND`), guarda só dia/mês do aniversário e se recusa a rodar de novo se o banco já tiver dados importados. As abas "Resumo" e "Conferência" não são importadas.
Na conferida com o arquivo enviado: **675 registros** (BA 180, PE 132, PB 61, AL 38, RN 39, CE 25, SE 34, MA 7, PI 8, IND 151), 251 com aniversário.

### 3. Criar os promotores
No Supabase, **Authentication → Users → Add user** para cada promotor. Depois entre no portal como admin → **Administração → Usuários** e marque as regiões de cada um.

### 4. Rodar localmente
```bash
# no .env, preencha também VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY
npm run dev
```

### 5. Publicar no GitHub Pages
1. Crie o repositório e envie o código (`git push` na branch `main`).
2. **Settings → Secrets and variables → Actions**: crie `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` (somente URL e chave **anon**).
3. **Settings → Pages → Source: GitHub Actions**.
4. Cada push em `main` roda os testes, gera o build e publica. O endereço fica em `https://SEU-USUARIO.github.io/NOME-DO-REPOSITORIO/`.
5. No Supabase, **Authentication → URL Configuration**, informe esse endereço em *Site URL*.

> O portal usa rotas com `#` (HashRouter), então funciona no GitHub Pages sem configuração extra.

## Testes

```bash
npm test         # regras de negócio (DD/MM, conferência, filtros, duplicidade) + renderização das telas
npm run test:sql # schema, triggers e RLS num Postgres embutido (PGlite): permissões, histórico, carimbos
npm run build
```

## Estrutura
```
src/lib        regras (datas, status, duplicidade), API Supabase, exportação Excel
src/pages      Home, Login, Regions, RegionPanel, admin/*
src/components modais de conferência e novo cadastro, lista, UI
supabase/      migrations (schema + RLS) e testes SQL
scripts/       importação da planilha
```

## Limitações conhecidas
- Redefinição de senha não está no portal: faça pelo painel do Supabase (Authentication → Users).
- "Finalizar conferência" é uma confirmação na tela; a conclusão é visível ao admin pelo 100% da região, sem registro próprio de data de encerramento.
- Cadastros de contatos de outras regiões não aparecem na checagem de duplicidade do promotor (ele só enxerga a própria região).
