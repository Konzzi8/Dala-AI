create table if not exists public.shipments (
  id uuid primary key,
  reference text,
  status text,
  risk_level text,
  eta text,
  origin text,
  destination text,
  carrier text,
  created_at timestamp with time zone default now(),
  raw_email text
);
