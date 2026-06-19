alter table public.transactions
add column if not exists archived_at timestamptz;

create index if not exists transactions_active_user_date_idx
on public.transactions (user_id, transaction_date desc)
where archived_at is null;

create index if not exists transactions_archived_user_date_idx
on public.transactions (user_id, transaction_date desc)
where archived_at is not null;

update public.transactions
set archived_at = now(),
    updated_at = now()
where archived_at is null
  and transaction_date < current_date - interval '1 year';
