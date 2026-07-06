-- ============================================================
-- Stratly — Sync Momentum : identifiants projet en texte
-- Les diagnostics utilisent des ids "mmt_..." (non-UUID).
-- À exécuter dans Supabase : SQL Editor > New query > coller > Run
-- ============================================================

alter table public.projects
  alter column id drop default,
  alter column id type text using id::text,
  alter column id set default gen_random_uuid()::text;
