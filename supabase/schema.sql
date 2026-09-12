-- Sankareshwari Silvers: categories, products, rate history, orders, RLS
create extension if not exists pgcrypto;

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  image_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.silver_rates (
  id uuid primary key default gen_random_uuid(),
  effective_date date not null unique,
  rate_per_gram numeric(12,2) not null check(rate_per_gram > 0),
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories(id) on delete restrict,
  name text not null,
  code text not null unique,
  pricing_mode text not null default 'weight',
  piece_rate numeric(12,2) not null default 0 check(piece_rate >= 0),
  weight_grams numeric(12,3) not null check((pricing_mode = 'weight' and weight_grams > 0) or (pricing_mode = 'piece' and weight_grams = 0 and piece_rate > 0)),
  making_charge numeric(12,2) not null default 0 check(making_charge >= 0),
  image_url text,
  stock_pcs integer not null default 0 check(stock_pcs >= 0),
  stock_grams numeric(12,3) not null default 0 check(stock_grams >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists products_category_id_idx on public.products(category_id);
create index if not exists products_active_idx on public.products(is_active);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  status text not null default 'pending',
  payment_status text not null default 'pending',
  total_amount numeric(12,2) not null default 0,
  delivery_address jsonb,
  razorpay_order_id text,
  razorpay_payment_id text,
  paid_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists orders_user_id_idx on public.orders(user_id);
create index if not exists orders_created_at_idx on public.orders(created_at desc);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  weight_grams numeric(12,3) not null,
  rate_per_gram numeric(12,2) not null,
  making_charge numeric(12,2) not null,
  unit_price numeric(12,2) not null,
  qty integer not null check(qty > 0),
  line_total numeric(12,2) not null
);
create index if not exists order_items_order_id_idx on public.order_items(order_id);


create table if not exists public.payment_webhook_events (
  event_id text primary key,
  event_type text not null,
  received_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;
alter table public.categories enable row level security;
alter table public.silver_rates enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

drop policy if exists "public categories read" on public.categories;
create policy "public categories read" on public.categories for select using (is_active = true);
drop policy if exists "public rates read" on public.silver_rates;
create policy "public rates read" on public.silver_rates for select using (true);
drop policy if exists "public products read" on public.products;
create policy "public products read" on public.products for select using (is_active = true);
drop policy if exists "own orders read" on public.orders;
create policy "own orders read" on public.orders for select using (auth.uid() = user_id);
drop policy if exists "own order items read" on public.order_items;
create policy "own order items read" on public.order_items for select using (
 exists(select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid())
);
drop policy if exists "admin list self" on public.admin_users;
create policy "admin list self" on public.admin_users for select using (auth.uid() = user_id);

-- After your first login, replace the email and run once:
-- insert into public.admin_users(user_id)
-- select id from auth.users where email='YOUR_ADMIN_EMAIL@example.com'
-- on conflict do nothing;


-- Customer profiles. Passwords are NOT stored here; Supabase Auth stores them securely.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profile read own" on public.profiles;
create policy "profile read own" on public.profiles
for select using (auth.uid() = id);

drop policy if exists "profile update own" on public.profiles;
create policy "profile update own" on public.profiles
for update using (auth.uid() = id) with check (auth.uid() = id);

-- Automatically copy name/phone from Auth signup metadata into public.profiles.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'phone', '')
  )
  on conflict (id) do update
    set full_name = excluded.full_name,
        phone = excluded.phone,
        updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

