alter table public.categories enable row level security;
alter table public.fixed_expenses enable row level security;
alter table public.goal_contributions enable row level security;
alter table public.goals enable row level security;
alter table public.transactions enable row level security;
alter table public.user_settings enable row level security;

create policy "Users can read own and default categories"
on public.categories
for select
using (user_id = auth.uid() or user_id is null);

create policy "Users can create own categories"
on public.categories
for insert
with check (user_id = auth.uid());

create policy "Users can update own categories"
on public.categories
for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "Users can delete own categories"
on public.categories
for delete
using (user_id = auth.uid());

create policy "Users can manage own fixed expenses"
on public.fixed_expenses
for all
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "Users can manage own goal contributions"
on public.goal_contributions
for all
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "Users can manage own goals"
on public.goals
for all
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "Users can manage own transactions"
on public.transactions
for all
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "Users can manage own settings"
on public.user_settings
for all
using (user_id = auth.uid())
with check (user_id = auth.uid());
