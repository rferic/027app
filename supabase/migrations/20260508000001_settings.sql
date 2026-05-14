-- Expand locale check constraint to support new locales
alter table public.profiles
  drop constraint if exists profiles_locale_check;

alter table public.profiles
  add constraint profiles_locale_check
  check (locale in ('es', 'en', 'it', 'ca', 'fr', 'de'));

-- Group settings table
create table public.group_settings (
  group_id        uuid primary key references public.groups(id) on delete cascade,
  active_locales  text[] not null default '{en,es,it}',
  default_locale  text not null default 'en',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

alter table public.group_settings enable row level security;

create policy "admins can manage group settings"
  on public.group_settings
  for all
  using (
    exists (
      select 1 from public.group_members
      where user_id = auth.uid() and role = 'admin'
    )
  );
