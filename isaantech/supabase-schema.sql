-- ISAANTECH production security
-- Run this in Supabase SQL Editor.
-- Admin account: 0b545fa3-70a6-45e5-8bee-66d20c89d3b8

create table if not exists public.tutorials (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  youtube_url text not null,
  youtube_id text not null,
  category text not null default 'General',
  published boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.tutorials enable row level security;

-- Remove ALL existing policies on this table so no older permissive policy
-- can accidentally grant broader access alongside the rules below.
do $$
declare
  existing_policy record;
begin
  for existing_policy in
    select policyname
    from pg_policies
    where schemaname = 'public' and tablename = 'tutorials'
  loop
    execute format('drop policy if exists %I on public.tutorials', existing_policy.policyname);
  end loop;
end
$$;

-- Visitors can see published tutorials. The one admin can also see drafts.
create policy "Public can view published tutorials or admin can view all"
on public.tutorials
for select
using (
  published = true
  or (select auth.uid()) = '0b545fa3-70a6-45e5-8bee-66d20c89d3b8'::uuid
);

-- Only the designated admin can create tutorials.
create policy "Only ISAANTECH admin can insert tutorials"
on public.tutorials
for insert
to authenticated
with check (
  (select auth.uid()) = '0b545fa3-70a6-45e5-8bee-66d20c89d3b8'::uuid
);

-- Only the designated admin can edit or publish/unpublish tutorials.
create policy "Only ISAANTECH admin can update tutorials"
on public.tutorials
for update
to authenticated
using (
  (select auth.uid()) = '0b545fa3-70a6-45e5-8bee-66d20c89d3b8'::uuid
)
with check (
  (select auth.uid()) = '0b545fa3-70a6-45e5-8bee-66d20c89d3b8'::uuid
);

-- Only the designated admin can delete tutorials.
create policy "Only ISAANTECH admin can delete tutorials"
on public.tutorials
for delete
to authenticated
using (
  (select auth.uid()) = '0b545fa3-70a6-45e5-8bee-66d20c89d3b8'::uuid
);

-- Keep public sign-ups disabled in Supabase Authentication settings.
-- Never place the service_role key in this frontend project.
