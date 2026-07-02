-- ============================================================
-- Stratly — Phase 1 : schéma initial
-- À exécuter dans Supabase : SQL Editor > New query > coller > Run
-- ============================================================

-- Profils : une ligne par utilisateur, créée automatiquement à l'inscription.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles: chacun voit et modifie le sien"
  on public.profiles for all
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Création automatique du profil à l'inscription.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Projets : le contenu complet vit en jsonb (même structure que le
-- localStorage actuel), les colonnes servent au listing et au tri.
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  module text not null default 'studio',      -- studio | momentum | rse
  title text not null default '',
  status text not null default 'draft',
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists projects_user_updated_idx
  on public.projects (user_id, updated_at desc);

alter table public.projects enable row level security;

create policy "projects: chacun gère les siens"
  on public.projects for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Quotas mensuels : lecture par l'utilisateur, écriture réservée au
-- serveur (service role) pour empêcher toute triche côté client.
create table if not exists public.usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  month_key text not null,                     -- format YYYY-MM
  studio integer not null default 0,
  momentum integer not null default 0,
  rse integer not null default 0,
  primary key (user_id, month_key)
);

alter table public.usage enable row level security;

create policy "usage: lecture de son propre usage"
  on public.usage for select
  using (auth.uid() = user_id);
