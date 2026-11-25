
create type public.app_role as enum ('admin','staff');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  email text,
  permissions text[] not null default array['pos','customers','payments','history']::text[],
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  unique(user_id, role)
);
grant select, update on public.profiles to authenticated;
grant select on public.user_roles to authenticated;
grant all on public.profiles, public.user_roles to service_role;
alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;
create or replace function public.is_member(_user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles r join public.profiles p on p.id=r.user_id where r.user_id = _user_id and p.active)
$$;
create or replace function public.has_perm(_perm text)
returns boolean language sql stable security definer set search_path = public as $$
  select public.has_role(auth.uid(),'admin') or exists (
    select 1 from public.profiles p join public.user_roles r on r.user_id=p.id
    where p.id=auth.uid() and p.active and _perm = any(p.permissions))
$$;

create policy "own or admin read profiles" on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_member(auth.uid()));
create policy "admin update profiles" on public.profiles for update to authenticated
  using (public.has_role(auth.uid(),'admin'));
create policy "read roles" on public.user_roles for select to authenticated
  using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles(id, full_name, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email,'@',1)), new.email);
  if not exists (select 1 from public.user_roles where role='admin') then
    insert into public.user_roles(user_id, role) values (new.id, 'admin');
  end if;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- settings
create table public.settings (
  id int primary key default 1 check (id = 1),
  business_name text not null default 'MP PAINT DEPOT AZARE',
  address text not null default 'Shop No 6-8 opp Yaji and Grill Restaurant, Layin Asibitin Ali Kwara, Azare, Bauchi State',
  phone text not null default '09033154072, 07038596473',
  receipt_footer text not null default 'Thank you for your patronage! Goods sold in good condition are not returnable.',
  updated_at timestamptz not null default now()
);
insert into public.settings(id) values (1);
grant select, update on public.settings to authenticated;
grant all on public.settings to service_role;
alter table public.settings enable row level security;
create policy "members read settings" on public.settings for select to authenticated using (public.is_member(auth.uid()));
create policy "admin update settings" on public.settings for update to authenticated using (public.has_role(auth.uid(),'admin'));

-- products
create table public.products (
  id uuid primary key default gen_random_uuid(),
  brand text not null,
  paint_type text not null default 'Emulsion',
  size text not null default '20L',
  colour text not null default 'White',
  sku text unique,
  cost_price numeric(14,2) not null default 0 check (cost_price >= 0),
  selling_price numeric(14,2) not null default 0 check (selling_price >= 0),
  stock_qty numeric(14,2) not null default 0,
  reorder_level numeric(14,2) not null default 5,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create table public.customers (
  id uuid primary key default gen_random_uuid(),
  name text not null, phone text, address text,
  balance numeric(14,2) not null default 0,
  created_at timestamptz not null default now()
);
create table public.suppliers (
  id uuid primary key default gen_random_uuid(),
  name text not null, phone text, address text,
  balance numeric(14,2) not null default 0,
  created_at timestamptz not null default now()
);
create table public.accounts (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  kind text not null default 'cash' check (kind in ('cash','bank','pos','other')),
  balance numeric(14,2) not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
insert into public.accounts(name, kind) values ('Cash at Hand','cash'),('Bank Account','bank'),('POS / Transfer','pos');

grant select, insert, update on public.products, public.customers, public.suppliers, public.accounts to authenticated;
grant all on public.products, public.customers, public.suppliers, public.accounts to service_role;
alter table public.products enable row level security;
alter table public.customers enable row level security;
alter table public.suppliers enable row level security;
alter table public.accounts enable row level security;
create policy "members read" on public.products for select to authenticated using (public.is_member(auth.uid()));
create policy "admin write products" on public.products for insert to authenticated with check (public.has_role(auth.uid(),'admin'));
create policy "admin update products" on public.products for update to authenticated using (public.has_role(auth.uid(),'admin'));
create policy "members read" on public.customers for select to authenticated using (public.is_member(auth.uid()));
create policy "members add customers" on public.customers for insert to authenticated with check (public.is_member(auth.uid()) and balance = 0);
create policy "admin update customers" on public.customers for update to authenticated using (public.has_role(auth.uid(),'admin'));
create policy "members read" on public.suppliers for select to authenticated using (public.is_member(auth.uid()));
create policy "members add suppliers" on public.suppliers for insert to authenticated with check (public.is_member(auth.uid()) and balance = 0);
create policy "admin update suppliers" on public.suppliers for update to authenticated using (public.has_role(auth.uid(),'admin'));
create policy "members read" on public.accounts for select to authenticated using (public.is_member(auth.uid()));
create policy "admin add accounts" on public.accounts for insert to authenticated with check (public.has_role(auth.uid(),'admin') and balance = 0);
create policy "admin update accounts" on public.accounts for update to authenticated using (public.has_role(auth.uid(),'admin'));

-- protect balances/stock from direct edits (only posting functions may change them)
create or replace function public.guard_balances() returns trigger language plpgsql as $$
begin
  if current_setting('app.posting', true) = 'on' then return new; end if;
  if tg_table_name = 'products' then new.stock_qty := old.stock_qty;
  else new.balance := old.balance; end if;
  return new;
end $$;
create trigger guard_products before update on public.products for each row execute function public.guard_balances();
create trigger guard_customers before update on public.customers for each row execute function public.guard_balances();
create trigger guard_suppliers before update on public.suppliers for each row execute function public.guard_balances();
create trigger guard_accounts before update on public.accounts for each row execute function public.guard_balances();

-- transactions (receipts)
create sequence public.receipt_seq start 1001;
create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  ref text not null unique,
  client_key uuid unique,
  tx_type text not null,
  customer_id uuid references public.customers(id),
  supplier_id uuid references public.suppliers(id),
  account_id uuid references public.accounts(id),
  to_account_id uuid references public.accounts(id),
  category text,
  description text,
  total numeric(14,2) not null default 0,
  paid numeric(14,2) not null default 0,
  balance_due numeric(14,2) not null default 0,
  cost_total numeric(14,2) not null default 0,
  payment_method text,
  staff_id uuid,
  staff_name text,
  refunded boolean not null default false,
  related_id uuid references public.transactions(id),
  print_count int not null default 0,
  created_at timestamptz not null default now()
);
create index on public.transactions(created_at desc);
create table public.transaction_items (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid not null references public.transactions(id) on delete cascade,
  product_id uuid references public.products(id),
  description text not null,
  qty numeric(14,2) not null,
  unit_price numeric(14,2) not null,
  unit_cost numeric(14,2) not null default 0,
  line_total numeric(14,2) not null
);
create table public.journal_lines (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid not null references public.transactions(id) on delete cascade,
  ledger text not null,
  debit numeric(14,2) not null default 0,
  credit numeric(14,2) not null default 0,
  created_at timestamptz not null default now()
);
create table public.daily_closings (
  id uuid primary key default gen_random_uuid(),
  close_date date not null default current_date,
  account_id uuid not null references public.accounts(id),
  expected numeric(14,2) not null,
  counted numeric(14,2) not null,
  difference numeric(14,2) not null,
  notes text,
  staff_name text,
  created_at timestamptz not null default now(),
  unique(close_date, account_id)
);
create table public.audit_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid, user_name text,
  action text not null, details text,
  created_at timestamptz not null default now()
);
grant select on public.transactions, public.transaction_items, public.journal_lines, public.daily_closings, public.audit_log to authenticated;
grant all on public.transactions, public.transaction_items, public.journal_lines, public.daily_closings, public.audit_log to service_role;
alter table public.transactions enable row level security;
alter table public.transaction_items enable row level security;
alter table public.journal_lines enable row level security;
alter table public.daily_closings enable row level security;
alter table public.audit_log enable row level security;
create policy "members read" on public.transactions for select to authenticated using (public.is_member(auth.uid()));
create policy "members read" on public.transaction_items for select to authenticated using (public.is_member(auth.uid()));
create policy "members read" on public.journal_lines for select to authenticated using (public.is_member(auth.uid()));
create policy "members read" on public.daily_closings for select to authenticated using (public.is_member(auth.uid()));
create policy "admin read audit" on public.audit_log for select to authenticated using (public.has_role(auth.uid(),'admin'));

-- ===== posting helpers =====
create or replace function public._begin(_perm text) returns text
language plpgsql security definer set search_path = public as $$
declare n text;
begin
  if auth.uid() is null or not public.is_member(auth.uid()) then raise exception 'Not authorised'; end if;
  if _perm is not null and not public.has_perm(_perm) then raise exception 'You do not have permission for this action'; end if;
  perform set_config('app.posting','on', true);
  select full_name into n from public.profiles where id = auth.uid();
  return coalesce(n,'Staff');
end $$;

create or replace function public._ref(_prefix text) returns text language sql as $$
  select 'MP-' || _prefix || '-' || to_char(now() at time zone 'Africa/Lagos','YYMMDD') || '-' || lpad(nextval('public.receipt_seq')::text, 5, '0')
$$;

create or replace function public._jl(_tx uuid, _ledger text, _dr numeric, _cr numeric) returns void language sql as $$
  insert into public.journal_lines(transaction_id, ledger, debit, credit) select _tx, _ledger, _dr, _cr where coalesce(_dr,0) <> 0 or coalesce(_cr,0) <> 0
$$;

create or replace function public._check_balanced(_tx uuid) returns void language plpgsql as $$
declare d numeric; c numeric;
begin
  select coalesce(sum(debit),0), coalesce(sum(credit),0) into d, c from public.journal_lines where transaction_id = _tx;
  if d <> c then raise exception 'Journal not balanced (% vs %)', d, c; end if;
end $$;

create or replace function public._acct(_id uuid, _delta numeric) returns text
language plpgsql as $$
declare nm text; bal numeric;
begin
  update public.accounts set balance = balance + _delta where id = _id and active returning name, balance into nm, bal;
  if nm is null then raise exception 'Account not found'; end if;
  if bal < 0 then raise exception 'Insufficient balance in %', nm; end if;
  return 'Cash/Bank: ' || nm;
end $$;

create or replace function public._audit(_name text, _action text, _details text) returns void language sql as $$
  insert into public.audit_log(user_id, user_name, action, details) values (auth.uid(), _name, _action, _details)
$$;

create or replace function public._existing(_key uuid) returns uuid language sql stable as $$
  select id from public.transactions where client_key = _key
$$;

-- SALE
create or replace function public.post_sale(_key uuid, _customer_id uuid, _items jsonb, _paid numeric, _account_id uuid, _method text, _note text)
returns uuid language plpgsql security definer set search_path = public as $$
declare staff text; tx uuid; it jsonb; p record; q numeric; up numeric; tot numeric := 0; cost numeric := 0; due numeric; ex uuid; lbl text;
begin
  ex := public._existing(_key); if ex is not null then return ex; end if;
  staff := public._begin('pos');
  if jsonb_array_length(coalesce(_items,'[]'::jsonb)) = 0 then raise exception 'Add at least one product'; end if;
  if _paid < 0 then raise exception 'Invalid amount paid'; end if;
  insert into public.transactions(ref, client_key, tx_type, customer_id, account_id, payment_method, description, staff_id, staff_name)
  values (public._ref('SL'), _key, 'sale', _customer_id, _account_id, _method, _note, auth.uid(), staff) returning id into tx;
  for it in select * from jsonb_array_elements(_items) loop
    q := (it->>'qty')::numeric; up := (it->>'unit_price')::numeric;
    if q <= 0 or up < 0 then raise exception 'Invalid quantity or price'; end if;
    select * into p from public.products where id = (it->>'product_id')::uuid and active for update;
    if p.id is null then raise exception 'Product not found'; end if;
    if p.stock_qty < q then raise exception 'Not enough stock for % % % (available %)', p.brand, p.colour, p.size, p.stock_qty; end if;
    update public.products set stock_qty = stock_qty - q where id = p.id;
    insert into public.transaction_items(transaction_id, product_id, description, qty, unit_price, unit_cost, line_total)
    values (tx, p.id, p.brand || ' ' || p.paint_type || ' - ' || p.colour || ' (' || p.size || ')', q, up, p.cost_price, round(q*up,2));
    tot := tot + round(q*up,2); cost := cost + round(q*p.cost_price,2);
  end loop;
  if _paid > tot then raise exception 'Amount paid (%) is more than the total (%)', _paid, tot; end if;
  due := tot - _paid;
  if due > 0 and _customer_id is null then raise exception 'Select a customer for credit (unpaid) sales'; end if;
  update public.transactions set total = tot, paid = _paid, balance_due = due, cost_total = cost where id = tx;
  if _paid > 0 then
    if _account_id is null then raise exception 'Choose the account receiving payment'; end if;
    lbl := public._acct(_account_id, _paid); perform public._jl(tx, lbl, _paid, 0);
  end if;
  if due > 0 then
    update public.customers set balance = balance + due where id = _customer_id;
    perform public._jl(tx, 'Accounts Receivable', due, 0);
  end if;
  perform public._jl(tx, 'Sales Revenue', 0, tot);
  perform public._jl(tx, 'Cost of Goods Sold', cost, 0);
  perform public._jl(tx, 'Inventory', 0, cost);
  perform public._check_balanced(tx);
  perform public._audit(staff, 'sale', 'Sale ' || tot::text);
  return tx;
end $$;

-- CUSTOMER PAYMENT
create or replace function public.post_customer_payment(_key uuid, _customer_id uuid, _amount numeric, _account_id uuid, _method text, _note text)
returns uuid language plpgsql security definer set search_path = public as $$
declare staff text; tx uuid; c record; lbl text; ex uuid;
begin
  ex := public._existing(_key); if ex is not null then return ex; end if;
  staff := public._begin('payments');
  if _amount <= 0 then raise exception 'Amount must be greater than zero'; end if;
  select * into c from public.customers where id = _customer_id for update;
  if c.id is null then raise exception 'Customer not found'; end if;
  if _amount > c.balance then raise exception 'Payment (%) exceeds outstanding debt (%)', _amount, c.balance; end if;
  insert into public.transactions(ref, client_key, tx_type, customer_id, account_id, payment_method, description, total, paid, balance_due, staff_id, staff_name)
  values (public._ref('CP'), _key, 'customer_payment', _customer_id, _account_id, _method, coalesce(nullif(_note,''),'Debt repayment'), _amount, _amount, c.balance - _amount, auth.uid(), staff) returning id into tx;
  update public.customers set balance = balance - _amount where id = _customer_id;
  lbl := public._acct(_account_id, _amount);
  perform public._jl(tx, lbl, _amount, 0);
  perform public._jl(tx, 'Accounts Receivable', 0, _amount);
  perform public._check_balanced(tx);
  perform public._audit(staff, 'customer_payment', c.name || ' paid ' || _amount::text);
  return tx;
end $$;

-- PURCHASE
create or replace function public.post_purchase(_key uuid, _supplier_id uuid, _items jsonb, _paid numeric, _account_id uuid, _method text, _note text)
returns uuid language plpgsql security definer set search_path = public as $$
declare staff text; tx uuid; it jsonb; p record; q numeric; uc numeric; tot numeric := 0; due numeric; lbl text; ex uuid;
begin
  ex := public._existing(_key); if ex is not null then return ex; end if;
  staff := public._begin('purchases');
  if _supplier_id is null then raise exception 'Select a supplier'; end if;
  if jsonb_array_length(coalesce(_items,'[]'::jsonb)) = 0 then raise exception 'Add at least one product'; end if;
  insert into public.transactions(ref, client_key, tx_type, supplier_id, account_id, payment_method, description, staff_id, staff_name)
  values (public._ref('PU'), _key, 'purchase', _supplier_id, _account_id, _method, _note, auth.uid(), staff) returning id into tx;
  for it in select * from jsonb_array_elements(_items) loop
    q := (it->>'qty')::numeric; uc := (it->>'unit_cost')::numeric;
    if q <= 0 or uc < 0 then raise exception 'Invalid quantity or cost'; end if;
    select * into p from public.products where id = (it->>'product_id')::uuid for update;
    if p.id is null then raise exception 'Product not found'; end if;
    update public.products set
      cost_price = case when stock_qty + q > 0 then round(((greatest(stock_qty,0) * cost_price) + q*uc) / (greatest(stock_qty,0) + q), 2) else uc end,
      stock_qty = stock_qty + q where id = p.id;
    insert into public.transaction_items(transaction_id, product_id, description, qty, unit_price, unit_cost, line_total)
    values (tx, p.id, p.brand || ' ' || p.paint_type || ' - ' || p.colour || ' (' || p.size || ')', q, uc, uc, round(q*uc,2));
    tot := tot + round(q*uc,2);
  end loop;
  if _paid < 0 or _paid > tot then raise exception 'Invalid amount paid'; end if;
  due := tot - _paid;
  update public.transactions set total = tot, paid = _paid, balance_due = due, cost_total = tot where id = tx;
  perform public._jl(tx, 'Inventory', tot, 0);
  if _paid > 0 then
    if _account_id is null then raise exception 'Choose the paying account'; end if;
    lbl := public._acct(_account_id, -_paid); perform public._jl(tx, lbl, 0, _paid);
  end if;
  if due > 0 then
    update public.suppliers set balance = balance + due where id = _supplier_id;
    perform public._jl(tx, 'Accounts Payable', 0, due);
  end if;
  perform public._check_balanced(tx);
  perform public._audit(staff, 'purchase', 'Purchase ' || tot::text);
  return tx;
end $$;

-- SUPPLIER PAYMENT
create or replace function public.post_supplier_payment(_key uuid, _supplier_id uuid, _amount numeric, _account_id uuid, _method text, _note text)
returns uuid language plpgsql security definer set search_path = public as $$
declare staff text; tx uuid; s record; lbl text; ex uuid;
begin
  ex := public._existing(_key); if ex is not null then return ex; end if;
  staff := public._begin('purchases');
  if _amount <= 0 then raise exception 'Amount must be greater than zero'; end if;
  select * into s from public.suppliers where id = _supplier_id for update;
  if s.id is null then raise exception 'Supplier not found'; end if;
  if _amount > s.balance then raise exception 'Payment (%) exceeds amount owed (%)', _amount, s.balance; end if;
  insert into public.transactions(ref, client_key, tx_type, supplier_id, account_id, payment_method, description, total, paid, balance_due, staff_id, staff_name)
  values (public._ref('SP'), _key, 'supplier_payment', _supplier_id, _account_id, _method, coalesce(nullif(_note,''),'Supplier payment'), _amount, _amount, s.balance - _amount, auth.uid(), staff) returning id into tx;
  update public.suppliers set balance = balance - _amount where id = _supplier_id;
  lbl := public._acct(_account_id, -_amount);
  perform public._jl(tx, 'Accounts Payable', _amount, 0);
  perform public._jl(tx, lbl, 0, _amount);
  perform public._check_balanced(tx);
  perform public._audit(staff, 'supplier_payment', s.name || ' paid ' || _amount::text);
  return tx;
end $$;

-- EXPENSE
create or replace function public.post_expense(_key uuid, _category text, _amount numeric, _account_id uuid, _method text, _note text)
returns uuid language plpgsql security definer set search_path = public as $$
declare staff text; tx uuid; lbl text; ex uuid;
begin
  ex := public._existing(_key); if ex is not null then return ex; end if;
  staff := public._begin('expenses');
  if _amount <= 0 then raise exception 'Amount must be greater than zero'; end if;
  insert into public.transactions(ref, client_key, tx_type, account_id, category, payment_method, description, total, paid, staff_id, staff_name)
  values (public._ref('EX'), _key, 'expense', _account_id, _category, _method, _note, _amount, _amount, auth.uid(), staff) returning id into tx;
  lbl := public._acct(_account_id, -_amount);
  perform public._jl(tx, 'Expense: ' || coalesce(_category,'General'), _amount, 0);
  perform public._jl(tx, lbl, 0, _amount);
  perform public._check_balanced(tx);
  perform public._audit(staff, 'expense', _category || ' ' || _amount::text);
  return tx;
end $$;

-- DEPOSIT / WITHDRAWAL (owner capital / drawings)
create or replace function public.post_account_movement(_key uuid, _kind text, _account_id uuid, _amount numeric, _note text)
returns uuid language plpgsql security definer set search_path = public as $$
declare staff text; tx uuid; lbl text; ex uuid;
begin
  ex := public._existing(_key); if ex is not null then return ex; end if;
  staff := public._begin('accounts');
  if _amount <= 0 then raise exception 'Amount must be greater than zero'; end if;
  if _kind not in ('deposit','withdrawal') then raise exception 'Invalid type'; end if;
  insert into public.transactions(ref, client_key, tx_type, account_id, description, total, paid, staff_id, staff_name)
  values (public._ref(case when _kind='deposit' then 'DP' else 'WD' end), _key, _kind, _account_id, _note, _amount, _amount, auth.uid(), staff) returning id into tx;
  if _kind = 'deposit' then
    lbl := public._acct(_account_id, _amount);
    perform public._jl(tx, lbl, _amount, 0); perform public._jl(tx, 'Owner Capital', 0, _amount);
  else
    lbl := public._acct(_account_id, -_amount);
    perform public._jl(tx, 'Owner Drawings', _amount, 0); perform public._jl(tx, lbl, 0, _amount);
  end if;
  perform public._check_balanced(tx);
  perform public._audit(staff, _kind, _amount::text);
  return tx;
end $$;

-- TRANSFER
create or replace function public.post_transfer(_key uuid, _from uuid, _to uuid, _amount numeric, _note text)
returns uuid language plpgsql security definer set search_path = public as $$
declare staff text; tx uuid; l1 text; l2 text; ex uuid;
begin
  ex := public._existing(_key); if ex is not null then return ex; end if;
  staff := public._begin('accounts');
  if _amount <= 0 then raise exception 'Amount must be greater than zero'; end if;
  if _from = _to then raise exception 'Choose two different accounts'; end if;
  insert into public.transactions(ref, client_key, tx_type, account_id, to_account_id, description, total, paid, staff_id, staff_name)
  values (public._ref('TR'), _key, 'transfer', _from, _to, _note, _amount, _amount, auth.uid(), staff) returning id into tx;
  l1 := public._acct(_from, -_amount); l2 := public._acct(_to, _amount);
  perform public._jl(tx, l2, _amount, 0); perform public._jl(tx, l1, 0, _amount);
  perform public._check_balanced(tx);
  perform public._audit(staff, 'transfer', _amount::text);
  return tx;
end $$;

-- REFUND (admin approval) of a whole sale
create or replace function public.post_refund(_key uuid, _sale_id uuid, _account_id uuid, _reason text)
returns uuid language plpgsql security definer set search_path = public as $$
declare staff text; tx uuid; s record; it record; lbl text; ex uuid; unpaid numeric;
begin
  ex := public._existing(_key); if ex is not null then return ex; end if;
  staff := public._begin(null);
  if not public.has_role(auth.uid(),'admin') then raise exception 'Only the owner/admin can approve refunds'; end if;
  select * into s from public.transactions where id = _sale_id and tx_type = 'sale' for update;
  if s.id is null then raise exception 'Sale not found'; end if;
  if s.refunded then raise exception 'This sale was already refunded'; end if;
  insert into public.transactions(ref, client_key, tx_type, customer_id, account_id, description, total, paid, cost_total, staff_id, staff_name, related_id, payment_method)
  values (public._ref('RF'), _key, 'refund', s.customer_id, _account_id, 'Refund of ' || s.ref || coalesce(' - ' || nullif(_reason,''), ''), s.total, s.paid, s.cost_total, auth.uid(), staff, s.id, s.payment_method) returning id into tx;
  for it in select * from public.transaction_items where transaction_id = s.id loop
    update public.products set stock_qty = stock_qty + it.qty where id = it.product_id;
    insert into public.transaction_items(transaction_id, product_id, description, qty, unit_price, unit_cost, line_total)
    values (tx, it.product_id, it.description, it.qty, it.unit_price, it.unit_cost, it.line_total);
  end loop;
  perform public._jl(tx, 'Sales Revenue', s.total, 0);
  perform public._jl(tx, 'Inventory', s.cost_total, 0);
  perform public._jl(tx, 'Cost of Goods Sold', 0, s.cost_total);
  if s.paid > 0 then
    lbl := public._acct(coalesce(_account_id, s.account_id), -s.paid); perform public._jl(tx, lbl, 0, s.paid);
  end if;
  unpaid := s.total - s.paid;
  if unpaid > 0 then
    update public.customers set balance = greatest(balance - unpaid, 0) where id = s.customer_id;
    perform public._jl(tx, 'Accounts Receivable', 0, unpaid);
  end if;
  update public.transactions set refunded = true where id = s.id;
  perform public._check_balanced(tx);
  perform public._audit(staff, 'refund', 'Refunded ' || s.ref);
  return tx;
end $$;

-- DAILY CLOSING
create or replace function public.post_daily_close(_account_id uuid, _counted numeric, _notes text)
returns uuid language plpgsql security definer set search_path = public as $$
declare staff text; a record; id_ uuid;
begin
  staff := public._begin('closing');
  select * into a from public.accounts where id = _account_id;
  if a.id is null then raise exception 'Account not found'; end if;
  insert into public.daily_closings(close_date, account_id, expected, counted, difference, notes, staff_name)
  values ((now() at time zone 'Africa/Lagos')::date, _account_id, a.balance, _counted, _counted - a.balance, _notes, staff) returning id into id_;
  perform public._audit(staff, 'daily_close', a.name || ' counted ' || _counted::text || ' expected ' || a.balance::text);
  return id_;
end $$;

create or replace function public.mark_printed(_tx uuid) returns int
language plpgsql security definer set search_path = public as $$
declare n int;
begin
  if not public.is_member(auth.uid()) then raise exception 'Not authorised'; end if;
  update public.transactions set print_count = print_count + 1 where id = _tx returning print_count into n;
  return n;
end $$;

create or replace function public.log_action(_action text, _details text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_member(auth.uid()) then return; end if;
  perform public._audit((select full_name from public.profiles where id=auth.uid()), _action, _details);
end $$;

revoke execute on function public._begin(text), public._ref(text), public._jl(uuid,text,numeric,numeric), public._check_balanced(uuid), public._acct(uuid,numeric), public._audit(text,text,text), public._existing(uuid) from public, anon, authenticated;
grant execute on function public.post_sale, public.post_customer_payment, public.post_purchase, public.post_supplier_payment, public.post_expense, public.post_account_movement, public.post_transfer, public.post_refund, public.post_daily_close, public.mark_printed, public.log_action, public.has_role, public.has_perm to authenticated;
