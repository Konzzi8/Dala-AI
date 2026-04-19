-- Standalone reference: base shipments (same as migrations/000_shipments.sql)
-- Apply migrations in order: 000_shipments.sql, then 001_dala_schema.sql

create extension if not exists "pgcrypto";

create table if not exists public.shipments (
  id uuid primary key default gen_random_uuid(),
  reference text not null,
  status text not null default 'active',
  origin text,
  destination text,
  carrier text,
  eta timestamptz,
  created_at timestamptz not null default now()
);
