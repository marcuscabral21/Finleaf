create or replace function public.save_user_finance_state(
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
  income_amount numeric;
  payday_value numeric;
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

  if jsonb_typeof(p_data -> 'income') is distinct from 'number' then
    raise exception 'Finance income must be a number';
  end if;

  if jsonb_typeof(p_data -> 'payday') is distinct from 'number' then
    raise exception 'Finance payday must be a number';
  end if;

  income_amount := (p_data ->> 'income')::numeric;
  payday_value := (p_data ->> 'payday')::numeric;

  if income_amount < 0 or income_amount > 9007199254740991 or trunc(income_amount) <> income_amount then
    raise exception 'Finance income must be a non-negative integer';
  end if;

  if payday_value < 1 or payday_value > 31 or trunc(payday_value) <> payday_value then
    raise exception 'Finance payday must be an integer between 1 and 31';
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

  insert into public.income_settings (
    user_id,
    base_amount_cents,
    payday,
    updated_at
  )
  values (
    auth.uid(),
    income_amount::bigint,
    payday_value::smallint,
    now()
  )
  on conflict (user_id) do update
  set base_amount_cents = excluded.base_amount_cents,
      payday = excluded.payday,
      updated_at = excluded.updated_at;

  return next_revision;
end;
$$;

revoke all on function public.save_user_finance_state(jsonb, bigint)
  from public, anon;
grant execute on function public.save_user_finance_state(jsonb, bigint)
  to authenticated;
