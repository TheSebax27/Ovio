-- Préstamos
create table public.loans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  type text not null check (type in ('given', 'received')),
  person text not null,
  amount decimal not null,
  note text,
  status text not null default 'pending' check (status in ('pending', 'paid')),
  created_at date not null default current_date
);

alter table public.loans enable row level security;
create policy "Users manage own loans" on public.loans for all using (auth.uid() = user_id);

-- Pagos de préstamos
create table public.loan_payments (
  id uuid primary key default gen_random_uuid(),
  loan_id uuid references public.loans(id) on delete cascade not null,
  amount decimal not null,
  note text,
  date date not null default current_date
);

alter table public.loan_payments enable row level security;
create policy "Users manage own loan payments" on public.loan_payments for all
  using (exists (select 1 from public.loans l where l.id = loan_id and l.user_id = auth.uid()));

-- Metas de ahorro
create table public.savings_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  target_amount decimal not null,
  current_amount decimal not null default 0,
  deadline date,
  status text not null default 'active' check (status in ('active', 'completed')),
  created_at date not null default current_date
);

alter table public.savings_goals enable row level security;
create policy "Users manage own savings goals" on public.savings_goals for all using (auth.uid() = user_id);

-- Aportes a metas de ahorro
create table public.savings_contributions (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid references public.savings_goals(id) on delete cascade not null,
  amount decimal not null,
  note text,
  date date not null default current_date
);

alter table public.savings_contributions enable row level security;
create policy "Users manage own savings contributions" on public.savings_contributions for all
  using (exists (select 1 from public.savings_goals g where g.id = goal_id and g.user_id = auth.uid()));

-- Presupuestos mensuales
create table public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  category text not null,
  limit_amount decimal not null,
  month int not null check (month between 1 and 12),
  year int not null,
  unique(user_id, category, month, year)
);

alter table public.budgets enable row level security;
create policy "Users manage own budgets" on public.budgets for all using (auth.uid() = user_id);

-- Deudas fijas / recurrentes
create table public.fixed_expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  amount decimal not null,
  category text not null,
  due_day int not null check (due_day between 1 and 31),
  is_active boolean not null default true
);

alter table public.fixed_expenses enable row level security;
create policy "Users manage own fixed expenses" on public.fixed_expenses for all using (auth.uid() = user_id);

-- Pagos de deudas fijas (historial mensual)
create table public.fixed_expense_payments (
  id uuid primary key default gen_random_uuid(),
  fixed_expense_id uuid references public.fixed_expenses(id) on delete cascade not null,
  month int not null check (month between 1 and 12),
  year int not null,
  paid_at date,
  unique(fixed_expense_id, month, year)
);

alter table public.fixed_expense_payments enable row level security;
create policy "Users manage own fixed expense payments" on public.fixed_expense_payments for all
  using (exists (select 1 from public.fixed_expenses f where f.id = fixed_expense_id and f.user_id = auth.uid()));
