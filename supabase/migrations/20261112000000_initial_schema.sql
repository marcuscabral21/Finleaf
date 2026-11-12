create extension if not exists pgcrypto with schema extensions;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  display_name text not null default 'Utilizador',
  currency text not null default 'EUR' check (currency ~ '^[A-Z]{3}$'),
  created_at timestamptz not null default now()
);

create table public.income_settings (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  base_amount_cents bigint not null default 0 check (base_amount_cents >= 0),
  payday smallint not null default 25 check (payday between 1 and 31),
  updated_at timestamptz not null default now()
);

create table public.monthly_income (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  month_start date not null check (extract(day from month_start) = 1),
  amount_cents bigint not null check (amount_cents >= 0),
  payday_override smallint check (payday_override between 1 and 31),
  note text,
  created_at timestamptz not null default now(),
  unique (user_id, month_start),
  unique (id, user_id)
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null check (length(trim(name)) between 1 and 60),
  color text not null default '#9b9b91' check (color ~ '^#[0-9A-Fa-f]{6}$'),
  icon text,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  unique (id, user_id),
  unique (user_id, name)
);

create table public.recurring_expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  category_id uuid,
  description text not null check (length(trim(description)) between 1 and 160),
  amount_cents bigint not null check (amount_cents > 0),
  day_of_month smallint not null check (day_of_month between 1 and 31),
  status text not null default 'active'
    check (status in ('active', 'paused', 'ended')),
  start_date date not null default current_date,
  end_date date check (end_date is null or end_date >= start_date),
  note text,
  created_at timestamptz not null default now(),
  unique (id, user_id),
  foreign key (category_id, user_id)
    references public.categories (id, user_id) on delete restrict
);

create table public.recurring_expense_overrides (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  recurring_expense_id uuid not null,
  month_start date not null check (extract(day from month_start) = 1),
  amount_cents bigint check (amount_cents is null or amount_cents > 0),
  due_on date,
  note text,
  created_at timestamptz not null default now(),
  unique (recurring_expense_id, month_start),
  foreign key (recurring_expense_id, user_id)
    references public.recurring_expenses (id, user_id) on delete cascade,
  check (
    due_on is null
    or (
      due_on >= month_start
      and due_on < (month_start + interval '1 month')::date
    )
  )
);

create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  category_id uuid,
  recurring_expense_id uuid,
  recurring_period date check (
    recurring_period is null or extract(day from recurring_period) = 1
  ),
  amount_cents bigint not null check (amount_cents > 0),
  description text not null check (length(trim(description)) between 1 and 160),
  occurred_on date not null default current_date,
  transaction_type text not null default 'expense'
    check (transaction_type in ('expense', 'income', 'refund')),
  note text,
  created_at timestamptz not null default now(),
  unique (recurring_expense_id, recurring_period),
  foreign key (category_id, user_id)
    references public.categories (id, user_id) on delete restrict,
  foreign key (recurring_expense_id, user_id)
    references public.recurring_expenses (id, user_id) on delete restrict,
  check (
    (recurring_expense_id is null and recurring_period is null)
    or (recurring_expense_id is not null and recurring_period is not null)
  )
);

create table public.savings_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null check (length(trim(name)) between 1 and 100),
  goal_type text not null check (goal_type in ('vault', 'goal')),
  target_cents bigint check (target_cents is null or target_cents > 0),
  deadline date,
  created_at timestamptz not null default now(),
  unique (id, user_id),
  check (
    (goal_type = 'vault' and target_cents is null and deadline is null)
    or (goal_type = 'goal' and target_cents is not null and deadline is not null)
  )
);

create table public.savings_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  goal_id uuid not null,
  amount_cents bigint not null check (amount_cents <> 0),
  occurred_on date not null default current_date,
  note text,
  created_at timestamptz not null default now(),
  foreign key (goal_id, user_id)
    references public.savings_goals (id, user_id) on delete restrict
);

create table public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  category_id uuid not null,
  month_start date not null check (extract(day from month_start) = 1),
  limit_cents bigint not null check (limit_cents > 0),
  created_at timestamptz not null default now(),
  unique (user_id, category_id, month_start),
  foreign key (category_id, user_id)
    references public.categories (id, user_id) on delete cascade
);

create index monthly_income_user_month_idx
  on public.monthly_income (user_id, month_start desc);
create index expenses_user_date_idx
  on public.expenses (user_id, occurred_on desc);
create index expenses_user_category_date_idx
  on public.expenses (user_id, category_id, occurred_on desc);
create index recurring_expenses_user_status_idx
  on public.recurring_expenses (user_id, status);
create index savings_transactions_user_goal_date_idx
  on public.savings_transactions (user_id, goal_id, occurred_on desc);
create index budgets_user_month_idx
  on public.budgets (user_id, month_start desc);

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(
      nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''),
      nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
      'Utilizador'
    )
  );

  insert into public.income_settings (user_id) values (new.id);

  insert into public.categories (user_id, name, color, is_default)
  values
    (new.id, 'Alimentação', '#7a9c70', true),
    (new.id, 'Compras', '#d7a16c', true),
    (new.id, 'Saúde', '#d17872', true),
    (new.id, 'Entretenimento', '#8576b7', true),
    (new.id, 'Casa', '#5e9eaa', true),
    (new.id, 'Transportes', '#d0b85b', true),
    (new.id, 'Subscrições', '#cf7da0', true),
    (new.id, 'Educação', '#718ac1', true),
    (new.id, 'Lazer/Saídas', '#6aa88e', true),
    (new.id, 'Outros', '#9b9b91', true);

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create function public.prevent_negative_savings_balance()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  current_balance bigint;
begin
  perform 1
  from public.savings_goals
  where id = new.goal_id and user_id = new.user_id
  for update;

  if not found then
    raise exception 'Savings goal not found for this user';
  end if;

  select coalesce(sum(amount_cents), 0)
  into current_balance
  from public.savings_transactions
  where goal_id = new.goal_id and user_id = new.user_id;

  if current_balance + new.amount_cents < 0 then
    raise exception 'Withdrawal exceeds the available savings balance';
  end if;

  return new;
end;
$$;

create trigger savings_balance_guard
  before insert on public.savings_transactions
  for each row execute function public.prevent_negative_savings_balance();

create function public.generate_monthly_recurring_expenses(
  p_month date default date_trunc('month', current_date)::date
)
returns integer
language plpgsql
set search_path = ''
as $$
declare
  month_start date := date_trunc('month', p_month)::date;
  last_day smallint;
  inserted_count integer;
begin
  if auth.uid() is null then
    raise exception 'Authentication is required';
  end if;

  if p_month <> month_start then
    raise exception 'The requested month must be the first day of a month';
  end if;

  last_day := extract(
    day from (month_start + interval '1 month - 1 day')
  )::smallint;

  insert into public.expenses (
    user_id,
    category_id,
    recurring_expense_id,
    recurring_period,
    amount_cents,
    description,
    occurred_on,
    transaction_type,
    note
  )
  select
    auth.uid(),
    recurring.category_id,
    recurring.id,
    month_start,
    coalesce(override.amount_cents, recurring.amount_cents),
    recurring.description,
    coalesce(
      override.due_on,
      make_date(
        extract(year from month_start)::integer,
        extract(month from month_start)::integer,
        least(recurring.day_of_month, last_day)::integer
      )
    ),
    'expense',
    coalesce(override.note, recurring.note)
  from public.recurring_expenses as recurring
  left join public.recurring_expense_overrides as override
    on override.recurring_expense_id = recurring.id
    and override.user_id = recurring.user_id
    and override.month_start = month_start
  where recurring.user_id = auth.uid()
    and recurring.status = 'active'
    and recurring.start_date <= (month_start + interval '1 month - 1 day')::date
    and (recurring.end_date is null or recurring.end_date >= month_start)
  on conflict (recurring_expense_id, recurring_period) do nothing;

  get diagnostics inserted_count = row_count;
  return inserted_count;
end;
$$;

alter table public.profiles enable row level security;
alter table public.income_settings enable row level security;
alter table public.monthly_income enable row level security;
alter table public.categories enable row level security;
alter table public.recurring_expenses enable row level security;
alter table public.recurring_expense_overrides enable row level security;
alter table public.expenses enable row level security;
alter table public.savings_goals enable row level security;
alter table public.savings_transactions enable row level security;
alter table public.budgets enable row level security;

create policy "Users can read their profile"
  on public.profiles for select to authenticated
  using (id = (select auth.uid()));
create policy "Users can update their profile"
  on public.profiles for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

create policy "Users manage their income settings"
  on public.income_settings for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
create policy "Users manage their monthly income"
  on public.monthly_income for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
create policy "Users manage their categories"
  on public.categories for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
create policy "Users manage their recurring expenses"
  on public.recurring_expenses for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
create policy "Users manage their recurring expense overrides"
  on public.recurring_expense_overrides for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
create policy "Users manage their expenses"
  on public.expenses for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
create policy "Users manage their savings goals"
  on public.savings_goals for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
create policy "Users can read their savings transactions"
  on public.savings_transactions for select to authenticated
  using (user_id = (select auth.uid()));
create policy "Users can add their savings transactions"
  on public.savings_transactions for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy "Users manage their budgets"
  on public.budgets for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

grant select on public.profiles to authenticated;
grant update (display_name, currency) on public.profiles to authenticated;
grant select, insert, update, delete on
  public.income_settings,
  public.monthly_income,
  public.categories,
  public.recurring_expenses,
  public.recurring_expense_overrides,
  public.expenses,
  public.savings_goals,
  public.budgets
to authenticated;
grant select, insert on public.savings_transactions to authenticated;
revoke all on function public.generate_monthly_recurring_expenses(date)
  from public, anon;
grant execute on function public.generate_monthly_recurring_expenses(date)
  to authenticated;

revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.prevent_negative_savings_balance()
  from public, anon, authenticated;
