-- ============================================================
-- Stratly — Phase 3 : quota mensuel de générations côté serveur
-- À exécuter dans Supabase : SQL Editor > New query > coller > Run
-- ============================================================

-- Décompte une génération Studio pour l'utilisateur connecté.
-- Le plafond vit ICI (pas côté client) : changez v_max pour l'ajuster.
create or replace function public.consume_studio_generation()
returns jsonb
language plpgsql
security definer set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_month text := to_char(now() at time zone 'utc', 'YYYY-MM');
  v_max constant integer := 20;  -- ← plafond bêta : générations / utilisateur / mois
  v_used integer;
begin
  if v_user is null then
    return jsonb_build_object('allowed', false, 'reason', 'unauthenticated');
  end if;

  insert into public.usage (user_id, month_key, studio)
  values (v_user, v_month, 0)
  on conflict (user_id, month_key) do nothing;

  select studio into v_used
  from public.usage
  where user_id = v_user and month_key = v_month
  for update;

  if v_used >= v_max then
    return jsonb_build_object(
      'allowed', false, 'reason', 'quota', 'used', v_used, 'max', v_max
    );
  end if;

  update public.usage
  set studio = studio + 1
  where user_id = v_user and month_key = v_month;

  return jsonb_build_object('allowed', true, 'used', v_used + 1, 'max', v_max);
end;
$$;

revoke all on function public.consume_studio_generation() from public;
grant execute on function public.consume_studio_generation() to authenticated;
