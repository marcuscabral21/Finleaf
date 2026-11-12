# Finleaf

Aplicação de controlo financeiro em Next.js com autenticação Supabase e esquema
da base de dados preparado para publicação na Vercel.

## Requisitos

- Node.js 20.9 ou superior
- Um projeto no Supabase

## Desenvolvimento local

1. Instale as dependências:

   ```bash
   npm install
   ```

2. Crie `.env.local` a partir de `.env.example` e preencha as credenciais do
   projeto em **Supabase > Project Settings > API**:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://seu-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sua-chave-publishable
   ```

3. No Supabase, abra **SQL Editor**, execute o ficheiro
   `supabase/migrations/20261112000000_initial_schema.sql` e confirme que a
   migração terminou sem erros. A migração cria o perfil e as categorias
   iniciais no registo, além de políticas RLS para isolar os dados de cada
   utilizador.

4. Em **Authentication > URL Configuration**, permita os URLs de redirecionamento
   locais (`http://localhost:3000/auth/callback`) e os domínios de produção e
   preview da Vercel com o caminho `/auth/callback`.

5. Inicie a aplicação:

   ```bash
   npm run dev
   ```

   Acesse http://localhost:3000.

O registo e o início de sessão por email estão em `/register` e `/login`. A
aplicação exige autenticação para abrir o painel; a sessão é terminada pelo
botão **Terminar sessão**. O cliente de navegador está em
`src/lib/supabase/client.ts` e o cliente de servidor, com suporte a cookies de
autenticação, em `src/lib/supabase/server.ts`. A camada `src/proxy.ts` atualiza
a sessão do Supabase em requisições.

## Identidade visual

Os logótipos SVG estão em `public/logos`. O modo claro usa `BlackPlant.svg` com
`BlackFinleaf.svg`; o modo escuro usa `WhitePlant.svg` com `WhiteFinleaf.svg`.
O componente `src/components/finleaf-logo.tsx` seleciona a combinação conforme
o tema.

O esquema SQL guarda montantes em cêntimos e inclui perfis, rendimento base e
exceções mensais, categorias, movimentos (despesas, rendimentos e reembolsos),
despesas recorrentes e respetivas exceções, objetivos/cofre de poupança,
movimentos de poupança e orçamentos por categoria. O RPC
`generate_monthly_recurring_expenses` gera os gastos fixos de um mês sem
duplicações e ajusta dias inexistentes ao último dia do mês.

**Nota:** o painel financeiro existente ainda guarda os movimentos no
armazenamento local do navegador; os registos não são ainda lidos/escritos nas
tabelas Supabase. O esquema e a autenticação ficam preparados para essa próxima
integração.

Use somente a chave publishable (ou a chave `anon` legada) no frontend. Nunca
adicione a chave `service_role` a variáveis `NEXT_PUBLIC_*`, ao Git ou ao código
do cliente.

## Publicação futura na Vercel

1. Importe este repositório no painel da Vercel.
2. Em **Project Settings > Environment Variables**, cadastre
   `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` para os
   ambientes desejados (Preview e Production).
3. Faça um novo deploy após salvar as variáveis.
4. Em **Supabase > Authentication > URL Configuration**, configure o domínio
   publicado como Site URL e permita `https://o-seu-dominio/auth/callback` nos
   Redirect URLs.

O arquivo `.env.local` é local e não deve ser enviado ao Git. `.env.example`
contém apenas valores ilustrativos.
