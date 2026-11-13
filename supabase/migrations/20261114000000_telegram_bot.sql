create table public.telegram_links (
  chat_id bigint primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  timezone text not null,
  created_at timestamptz not null default now(),
  unique (chat_id, user_id)
);

create table public.telegram_link_tokens (
  token_hash text primary key check (token_hash ~ '^[0-9a-f]{64}$'),
  chat_id bigint not null,
  expires_at timestamptz not null
);

create index telegram_link_tokens_expiry_idx
  on public.telegram_link_tokens (expires_at);

create table public.telegram_conversations (
  chat_id bigint primary key references public.telegram_links (chat_id) on delete cascade,
  step text not null
    check (step in ('description', 'amount', 'category')),
  description text,
  amount_cents bigint check (amount_cents is null or amount_cents > 0),
  expires_at timestamptz not null
);

alter table public.telegram_links enable row level security;
alter table public.telegram_link_tokens enable row level security;
alter table public.telegram_conversations enable row level security;

revoke all on public.telegram_links,
  public.telegram_link_tokens,
  public.telegram_conversations
  from public, anon, authenticated;
grant select, insert, update, delete on public.telegram_links,
  public.telegram_link_tokens,
  public.telegram_conversations
  to service_role;
grant select on public.user_finance_state to service_role;

create function public.claim_telegram_link(
  p_token text,
  p_timezone text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  link_chat_id bigint;
  v_token_hash text;
  affected_rows integer;
begin
  if auth.uid() is null then
    raise exception 'Authentication is required';
  end if;

  if p_token is null or length(p_token) < 32 or length(p_token) > 128 then
    raise exception 'TELEGRAM_LINK_EXPIRED';
  end if;

  if p_timezone is null
    or length(p_timezone) > 80
    or not exists (
      select 1
      from pg_catalog.pg_timezone_names
      where name = p_timezone
    )
  then
    raise exception 'A valid time zone is required';
  end if;

  v_token_hash := pg_catalog.encode(
    extensions.digest(p_token, 'sha256'),
    'hex'
  );

  select chat_id
  into link_chat_id
  from public.telegram_link_tokens
  where telegram_link_tokens.token_hash = v_token_hash
    and expires_at > pg_catalog.now()
  for update;

  if not found then
    raise exception 'TELEGRAM_LINK_EXPIRED';
  end if;

  insert into public.telegram_links as linked (chat_id, user_id, timezone)
  values (link_chat_id, auth.uid(), p_timezone)
  on conflict (chat_id) do update
  set timezone = excluded.timezone
  where linked.user_id = auth.uid();

  get diagnostics affected_rows = row_count;
  if affected_rows = 0 then
    raise exception 'TELEGRAM_CHAT_ALREADY_LINKED';
  end if;

  delete from public.telegram_link_tokens
  where telegram_link_tokens.chat_id = link_chat_id;
end;
$$;

revoke all on function public.claim_telegram_link(text, text)
  from public, anon;
grant execute on function public.claim_telegram_link(text, text)
  to authenticated;

create function public.add_telegram_expense(
  p_chat_id bigint,
  p_description text,
  p_amount_cents bigint,
  p_category text default null
)
returns date
language plpgsql
security definer
set search_path = ''
as $$
declare
  linked_user_id uuid;
  linked_timezone text;
  finance_data jsonb;
  expense_date date;
begin
  if p_description is null
    or length(pg_catalog.btrim(p_description)) not between 1 and 160
    or p_amount_cents is null
    or p_amount_cents <= 0
  then
    raise exception 'Invalid expense details';
  end if;

  select user_id, timezone
  into linked_user_id, linked_timezone
  from public.telegram_links
  where chat_id = p_chat_id;

  if not found then
    raise exception 'Telegram account is not linked';
  end if;

  select data
  into finance_data
  from public.user_finance_state
  where user_id = linked_user_id
  for update;

  if not found
    or coalesce(pg_catalog.jsonb_typeof(finance_data -> 'expenses'), '') <> 'array'
    or coalesce(pg_catalog.jsonb_typeof(finance_data -> 'categories'), '') <> 'array'
  then
    raise exception 'User finance data is unavailable';
  end if;

  if p_category is not null and not exists (
    select 1
    from pg_catalog.jsonb_array_elements(finance_data -> 'categories')
      as item(category)
    where category ->> 'name' = p_category
  ) then
    raise exception 'Expense category does not exist';
  end if;

  expense_date := pg_catalog.timezone(linked_timezone, pg_catalog.now())::date;

  update public.user_finance_state
  set data = pg_catalog.jsonb_set(
        finance_data,
        '{expenses}',
        (finance_data -> 'expenses') || pg_catalog.jsonb_build_array(
          pg_catalog.jsonb_build_object(
            'id', pg_catalog.gen_random_uuid()::text,
            'description', pg_catalog.btrim(p_description),
            'amount', p_amount_cents,
            'date', expense_date::text,
            'category', coalesce(p_category, ''),
            'note', '',
            'type', 'expense'
          )
        ),
        true
      ),
      revision = revision + 1,
      updated_at = pg_catalog.now()
  where user_id = linked_user_id;

  return expense_date;
end;
$$;

revoke all on function public.add_telegram_expense(bigint, text, bigint, text)
  from public, anon, authenticated;
grant execute on function public.add_telegram_expense(bigint, text, bigint, text)
  to service_role;
