-- =====================================================================
-- Aniversariantes RBR — modelo de dados
-- Rode no SQL Editor do Supabase, na ordem: 001, 002.
-- =====================================================================

-- ---------- Regiões ----------
create table public.regions (
  code        text primary key,           -- BA, PE, PB, AL, RN, CE, SE, MA, PI, IND
  name        text not null,
  sort_order  int  not null default 0
);
insert into public.regions (code, name, sort_order) values
  ('BA','Bahia',1), ('PE','Pernambuco',2), ('PB','Paraíba',3), ('AL','Alagoas',4),
  ('RN','Rio Grande do Norte',5), ('CE','Ceará',6), ('SE','Sergipe',7),
  ('MA','Maranhão',8), ('PI','Piauí',9), ('IND','Indústrias e Transportadoras',10);

-- ---------- Usuários e permissões ----------
create type public.app_role as enum ('admin', 'promoter');

create table public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  email      text,
  full_name  text,
  role       public.app_role not null default 'promoter',
  active     boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.user_regions (
  user_id     uuid not null references public.profiles(id) on delete cascade,
  region_code text not null references public.regions(code),
  primary key (user_id, region_code)
);

-- Todo usuário criado no Auth ganha um perfil SEM região e SEM poder admin.
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email,'@',1)));
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- Funções auxiliares de permissão ----------
create function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin' and p.active)
$$;

create function public.has_region(r text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.user_regions ur
    join public.profiles p on p.id = ur.user_id
    where ur.user_id = auth.uid() and ur.region_code = r and p.active
  )
$$;

-- ---------- Contatos ----------
create type public.registration_status as enum ('pending', 'active', 'inactive');
create type public.birthday_status     as enum ('pending', 'confirmed', 'corrected', 'unknown');

create table public.contacts (
  id               uuid primary key default gen_random_uuid(),
  region_code      text not null references public.regions(code),
  name             text not null,
  company          text,                         -- planilha: "Vínculo com"
  contact_type     text,                         -- CLIENTE, INDÚSTRIA, TRANSPORTADORA...
  email            text,
  mobile           text,
  company_phone    text,
  registered_at    timestamptz,                  -- planilha: "Dt. Cadastro"
  had_access_original text,                      -- planilha: "Tem Acesso?" (preservado, NÃO é situação do cadastro)
  department       text,
  job_title        text,
  region_criterion text,
  origin           text,
  birthday_day     smallint check (birthday_day   between 1 and 31),
  birthday_month   smallint check (birthday_month between 1 and 12),
  -- Conferência (campos independentes)
  registration_status public.registration_status not null default 'pending',
  registration_checked_at timestamptz,
  registration_checked_by uuid references public.profiles(id),
  birthday_status  public.birthday_status not null default 'pending',
  birthday_checked_at timestamptz,
  birthday_checked_by uuid references public.profiles(id),
  notes            text,
  source           text not null default 'planilha' check (source in ('planilha','promotor','admin')),
  created_by       uuid references public.profiles(id),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint birthday_both_or_none check ((birthday_day is null) = (birthday_month is null))
);
create index contacts_region_idx on public.contacts (region_code);
create index contacts_name_idx   on public.contacts (lower(name));

-- ---------- Histórico de alterações (preenchido só por trigger) ----------
create table public.contact_history (
  id          bigint generated always as identity primary key,
  contact_id  uuid not null,
  region_code text not null,
  action      text not null,                     -- insert | update
  changes     jsonb not null default '{}'::jsonb, -- {campo: {de: x, para: y}}
  actor_id    uuid,
  actor_name  text,
  created_at  timestamptz not null default now()
);
create index contact_history_contact_idx on public.contact_history (contact_id, created_at desc);
