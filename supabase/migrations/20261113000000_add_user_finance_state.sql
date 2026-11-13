create table public.user_finance_state (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  data jsonb not null default '{}'::jsonb
    check (jsonb_typeof(data) = 'object'),
  revision bigint not null default 0 check (revision >= 0),
  updated_at timestamptz not null default now()
);

create function public.ensure_user_finance_state()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.user_finance_state (user_id, data)
  values (new.id, '{}'::jsonb)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

create trigger on_profile_created_finance_state
  after insert on public.profiles
  for each row execute function public.ensure_user_finance_state();

insert into public.user_finance_state (user_id, data)
select id, '{}'::jsonb
from public.profiles
on conflict (user_id) do nothing;

alter table public.user_finance_state enable row level security;

create policy "Users can read their own finance state"
  on public.user_finance_state for select to authenticated
  using (user_id = (select auth.uid()));

revoke all on table public.user_finance_state from anon, authenticated;
grant select on public.user_finance_state to authenticated;

create function public.save_user_finance_state(
  p_data jsonb,
  p_expected_revision bigint
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  next_revision bigint;
begin
  if auth.uid() is null then
    raise exception 'Authentication is required';
  end if;

  if p_data is null or jsonb_typeof(p_data) <> 'object' then
    raise exception 'Finance data must be a JSON object';
  end if;

  if p_expected_revision is null or p_expected_revision < 0 then
    raise exception 'A valid finance data revision is required';
  end if;

  update public.user_finance_state
  set data = p_data,
      revision = revision + 1,
      updated_at = now()
  where user_id = auth.uid()
    and revision = p_expected_revision
  returning revision into next_revision;

  if not found then
    raise exception using
      errcode = 'P0001',
      message = 'FINANCE_STATE_CONFLICT: reload before saving again';
  end if;

  return next_revision;
end;
$$;

revoke all on function public.ensure_user_finance_state()
  from public, anon, authenticated;
revoke all on function public.save_user_finance_state(jsonb, bigint)
  from public, anon;
grant execute on function public.save_user_finance_state(jsonb, bigint)
  to authenticated;
