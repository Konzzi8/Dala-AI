-- Dala: profiles, shipments extensions, emails, Outlook connections, RLS
-- Run in Supabase SQL editor or via supabase db push

create extension if not exists "pgcrypto";

-- Profiles (1:1 with auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id);

-- Extend shipments
alter table public.shipments
  add column if not exists user_id uuid references auth.users (id) on delete cascade;

alter table public.shipments
  add column if not exists container_numbers jsonb not null default '[]'::jsonb;

alter table public.shipments
  add column if not exists bill_of_lading text;

alter table public.shipments
  add column if not exists updated_at timestamptz not null default now();

create index if not exists shipments_user_id_idx on public.shipments (user_id);
create index if not exists shipments_reference_idx on public.shipments (reference);

-- Emails (inbox + parsed)
create table if not exists public.emails (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  subject text,
  sender text,
  body text,
  parsed jsonb,
  shipment_id uuid references public.shipments (id) on delete set null,
  received_at timestamptz not null default now(),
  graph_message_id text unique,
  is_read boolean not null default false,
  is_urgent boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists emails_user_id_idx on public.emails (user_id);
create index if not exists emails_shipment_id_idx on public.emails (shipment_id);
create index if not exists emails_received_at_idx on public.emails (received_at desc);

alter table public.emails enable row level security;

create policy "emails_select_own"
  on public.emails for select
  using (auth.uid() = user_id);

create policy "emails_insert_own"
  on public.emails for insert
  with check (auth.uid() = user_id);

create policy "emails_update_own"
  on public.emails for update
  using (auth.uid() = user_id);

create policy "emails_delete_own"
  on public.emails for delete
  using (auth.uid() = user_id);

-- Microsoft Outlook tokens (encrypted at rest in production recommended)
create table if not exists public.outlook_connections (
  user_id uuid primary key references auth.users (id) on delete cascade,
  ms_account_email text,
  refresh_token text,
  access_token text,
  token_expires_at timestamptz,
  delta_link text,
  updated_at timestamptz not null default now()
);

alter table public.outlook_connections enable row level security;

create policy "outlook_select_own"
  on public.outlook_connections for select
  using (auth.uid() = user_id);

create policy "outlook_insert_own"
  on public.outlook_connections for insert
  with check (auth.uid() = user_id);

create policy "outlook_update_own"
  on public.outlook_connections for update
  using (auth.uid() = user_id);

create policy "outlook_delete_own"
  on public.outlook_connections for delete
  using (auth.uid() = user_id);

-- Shipments RLS
alter table public.shipments enable row level security;

drop policy if exists "shipments_select_own" on public.shipments;
drop policy if exists "shipments_insert_own" on public.shipments;
drop policy if exists "shipments_update_own" on public.shipments;
drop policy if exists "shipments_delete_own" on public.shipments;

create policy "shipments_select_own"
  on public.shipments for select
  using (auth.uid() = user_id);

create policy "shipments_insert_own"
  on public.shipments for insert
  with check (auth.uid() = user_id);

create policy "shipments_update_own"
  on public.shipments for update
  using (auth.uid() = user_id);

create policy "shipments_delete_own"
  on public.shipments for delete
  using (auth.uid() = user_id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
