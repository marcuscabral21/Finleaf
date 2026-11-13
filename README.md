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

3. No Supabase, abra **SQL Editor** e aplique apenas as migrações ainda em falta,
   sempre pela ordem indicada em `supabase/migrations`. Não volte a executar
   migrações já aplicadas.

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

Nas Definições, a aparência pode seguir a preferência do dispositivo ou ser
definida manualmente como clara ou escura. As páginas de autenticação também
seguem a preferência de esquema de cores do dispositivo.

O esquema SQL inicial define tabelas normalizadas para movimentos, rendimento,
categorias, gastos recorrentes e poupança. O painel sincroniza o estado completo
como JSONB em `user_finance_state`, uma linha por utilizador. O RPC
`save_user_finance_state` usa revisão otimista para evitar sobrescrever
alterações feitas noutro dispositivo; também atualiza `income_settings`
atomicamente com o rendimento padrão e o dia de recebimento. A política RLS
limita a leitura do estado JSONB à conta autenticada. O RPC
`generate_monthly_recurring_expenses` continua disponível para geração de
despesas recorrentes na base de dados.

**Armazenamento e privacidade:** os dados financeiros novos são enviados ao
Supabase por HTTPS e guardados na linha JSONB do utilizador. A encriptação em
repouso é gerida pelo Supabase; a aplicação não cifra cada campo. Os registos
que já existiam no armazenamento local do navegador não são importados nem
apagados. Confirme a configuração de encriptação em repouso do seu projeto
Supabase antes de guardar dados reais. O ciclo mensal do painel começa no dia de
recebimento configurado em **Definições** (individual para cada utilizador) e
termina no dia anterior ao recebimento seguinte. Dias que não existam num mês,
como o dia 31 em fevereiro, são ajustados ao último dia desse mês. O rendimento
e a data real do recebimento podem ser ajustados individualmente em cada ciclo
no botão **Ajustar**, mantendo o dia padrão para os ciclos seguintes. A navegação
permite consultar ciclos anteriores, mas não avança para ciclos futuros. Os gastos
fixos lançados num ciclo usam o dia mensal configurado,
com ajuste para o último dia quando esse dia não existe no mês. A app regista
automaticamente os pagamentos vencidos quando está aberta ou é reaberta e
deduz os valores do saldo disponível; por ser uma versão local, não executa
débitos bancários reais. Depósitos e levantamentos do cofre/metas aparecem como
transferências nos movimentos, sem serem contabilizados como rendimento ou
despesa.


Use somente a chave publishable (ou a chave `anon` legada) no frontend. Nunca
adicione a chave secreta do Supabase a variáveis `NEXT_PUBLIC_*`, ao Git ou ao
código do cliente.

## Bot do Telegram

O fluxo do bot está preparado, mas só fica ativo depois de criar um bot no
BotFather e configurar as variáveis de servidor em `.env.local` e no ambiente de
produção:

- `TELEGRAM_BOT_TOKEN`: token fornecido pelo BotFather.
- `TELEGRAM_WEBHOOK_SECRET`: segredo aleatório composto por letras, números, `_`
  ou `-`; use o mesmo ao configurar o webhook no Telegram.
- `FINLEAF_SITE_URL`: URL pública HTTPS do Finleaf, sem caminho adicional.
- `SUPABASE_SECRET_KEY`: chave secreta do projeto Supabase, apenas no servidor.
- `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME`: nome público do bot, sem o `@`; mostra
  o botão para abrir o bot nas Definições do painel.

Depois de aplicar também a migração
`20261114000000_telegram_bot.sql`, configure o webhook do bot para
`https://o-seu-dominio/api/telegram/webhook`, incluindo o segredo configurado.
Não publique o token nem a chave secreta em código, frontend ou repositório.

No chat privado, `/start` envia um link temporário. A pessoa inicia sessão no
navegador e confirma a associação; o fuso horário desse navegador passa a
determinar a data dos gastos. Depois, `/gasto` inicia o registo de descrição,
valor e categoria opcional. Também existem `/cancelar` e `/desassociar`. Para
atualizar os dados do painel depois de um registo no Telegram, recarregue a
página se ela já estiver aberta.

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
