-- =====================================================================
-- Aniversariantes RBR — triggers de integridade/histórico + políticas RLS
-- =====================================================================

-- ---------- BEFORE INSERT: carimba origem e autoria ----------
create function public.contacts_before_insert() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null and not public.is_admin() then
    -- Promotor: não escolhe origem nem status de conferência
    new.source := 'promotor';
    new.created_by := auth.uid();
    new.created_at := now();
    new.registration_status := 'active';
    new.registration_checked_at := now();
    new.registration_checked_by := auth.uid();
    new.birthday_status := case when new.birthday_day is null then 'unknown' else 'confirmed' end;
    new.birthday_checked_at := now();
    new.birthday_checked_by := auth.uid();
  elsif auth.uid() is not null then
    new.created_by := coalesce(new.created_by, auth.uid());
  end if;
  new.name := btrim(new.name);
  return new;
end $$;
create trigger contacts_before_insert before insert on public.contacts
  for each row execute function public.contacts_before_insert();

-- ---------- BEFORE UPDATE: promotor só mexe em campos de conferência ----------
create function public.contacts_before_update() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null and not public.is_admin() then
    if row(new.region_code, new.name, new.company, new.contact_type, new.email, new.mobile,
           new.company_phone, new.registered_at, new.had_access_original, new.department,
           new.job_title, new.region_criterion, new.origin, new.source, new.created_by, new.created_at)
       is distinct from
       row(old.region_code, old.name, old.company, old.contact_type, old.email, old.mobile,
           old.company_phone, old.registered_at, old.had_access_original, old.department,
           old.job_title, old.region_criterion, old.origin, old.source, old.created_by, old.created_at)
    then
      raise exception 'Promotores só podem alterar a conferência do cadastro (situação, aniversário e observação).'
        using errcode = '42501';
    end if;
  end if;

  if new.registration_status is distinct from old.registration_status then
    new.registration_checked_at := now();
    new.registration_checked_by := auth.uid();
  end if;
  if new.birthday_status is distinct from old.birthday_status
     or new.birthday_day is distinct from old.birthday_day
     or new.birthday_month is distinct from old.birthday_month then
    new.birthday_checked_at := now();
    new.birthday_checked_by := auth.uid();
  end if;
  new.updated_at := now();
  return new;
end $$;
create trigger contacts_before_update before update on public.contacts
  for each row execute function public.contacts_before_update();

-- ---------- AFTER INSERT/UPDATE: histórico de alterações ----------
create function public.log_contact_change() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  diff jsonb := '{}'::jsonb; k text; o jsonb; n jsonb; nm text;
begin
  select coalesce(full_name, email) into nm from public.profiles where id = auth.uid();
  nm := coalesce(nm, 'Importação / sistema');

  if tg_op = 'INSERT' then
    insert into public.contact_history (contact_id, region_code, action, changes, actor_id, actor_name)
    values (new.id, new.region_code, 'insert',
            jsonb_build_object('name', jsonb_build_object('para', new.name),
                               'company', jsonb_build_object('para', new.company),
                               'source', jsonb_build_object('para', new.source)),
            auth.uid(), nm);
  else
    o := to_jsonb(old); n := to_jsonb(new);
    for k in select jsonb_object_keys(n) loop
      if k not in ('updated_at','registration_checked_at','registration_checked_by',
                   'birthday_checked_at','birthday_checked_by')
         and (o -> k) is distinct from (n -> k) then
        diff := diff || jsonb_build_object(k, jsonb_build_object('de', o -> k, 'para', n -> k));
      end if;
    end loop;
    if diff <> '{}'::jsonb then
      insert into public.contact_history (contact_id, region_code, action, changes, actor_id, actor_name)
      values (new.id, new.region_code, 'update', diff, auth.uid(), nm);
    end if;
  end if;
  return null;
end $$;
create trigger contacts_log after insert or update on public.contacts
  for each row execute function public.log_contact_change();

-- ---------- RLS ----------
alter table public.regions         enable row level security;
alter table public.profiles        enable row level security;
alter table public.user_regions    enable row level security;
alter table public.contacts        enable row level security;
alter table public.contact_history enable row level security;

revoke all on all tables in schema public from anon;   -- visitante sem login não lê nada

create policy regions_read on public.regions for select to authenticated using (true);

create policy profiles_read   on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_admin());
create policy profiles_update on public.profiles for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy user_regions_read  on public.user_regions for select to authenticated
  using (user_id = auth.uid() or public.is_admin());
create policy user_regions_write on public.user_regions for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy contacts_read   on public.contacts for select to authenticated
  using (public.is_admin() or public.has_region(region_code));
create policy contacts_insert on public.contacts for insert to authenticated
  with check (public.is_admin() or public.has_region(region_code));
create policy contacts_update on public.contacts for update to authenticated
  using (public.is_admin() or public.has_region(region_code))
  with check (public.is_admin() or public.has_region(region_code));
create policy contacts_delete on public.contacts for delete to authenticated
  using (public.is_admin());

create policy history_read on public.contact_history for select to authenticated
  using (public.is_admin());
-- (sem policy de INSERT/UPDATE/DELETE no histórico: só os triggers escrevem)

-- ---------- Bootstrap do primeiro administrador (rode UMA vez, com o seu e-mail) ----------
-- update public.profiles set role = 'admin' where email = 'seu.email@rbr.com.br';
--
-- ---------- Exemplo: liberar regiões para um promotor ----------
-- insert into public.user_regions (user_id, region_code)
--   select id, unnest(array['BA','SE']) from public.profiles where email = 'promotor@rbr.com.br';
