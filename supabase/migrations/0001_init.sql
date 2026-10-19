-- Financial Tracker: skema awal. Semua tabel dibatasi per-user lewat RLS.

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  type text not null check (type in ('income', 'expense')),
  amount bigint not null check (amount > 0),
  category text not null,
  note text,
  occurred_on date not null default current_date,
  created_at timestamptz not null default now()
);
create index on public.transactions (user_id, occurred_on desc);

create table public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  category text not null,
  monthly_limit bigint not null check (monthly_limit > 0),
  created_at timestamptz not null default now(),
  unique (user_id, category)
);

create table public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  name text not null,
  target_amount bigint not null check (target_amount > 0),
  saved_amount bigint not null default 0 check (saved_amount >= 0),
  deadline date,
  created_at timestamptz not null default now()
);

create table public.loans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  name text not null,
  lender text,
  principal bigint not null check (principal > 0),
  annual_rate numeric(6,3) not null check (annual_rate >= 0),
  tenor_months int not null check (tenor_months between 1 and 480),
  method text not null check (method in ('annuity', 'flat')),
  start_date date not null,
  due_day int not null check (due_day between 1 and 31),
  created_at timestamptz not null default now()
);

create table public.loan_installments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  loan_id uuid not null references public.loans on delete cascade,
  installment_no int not null,
  due_date date not null,
  principal_part bigint not null,
  interest_part bigint not null,
  amount bigint not null,
  remaining_balance bigint not null,
  paid_on date,
  unique (loan_id, installment_no)
);
create index on public.loan_installments (user_id, due_date) where paid_on is null;

do $$
declare t text;
begin
  foreach t in array array['transactions','budgets','goals','loans','loan_installments'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format(
      'create policy "owner full access" on public.%I for all to authenticated
         using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()))', t);
  end loop;
end $$;
