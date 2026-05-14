-- installed_apps table
create table public.installed_apps (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique,
  version      text not null,
  status       text not null check (status in ('installing', 'active', 'error', 'uninstalling')),
  visibility   text not null default 'public' check (visibility in ('public', 'private')),
  error        text,
  config       jsonb not null default '{}',
  installed_at timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

alter table public.installed_apps enable row level security;

-- SELECT: any authenticated user can read installed apps
create policy "installed_apps_select" on public.installed_apps
  for select to authenticated using (true);

-- updated_at trigger (reutiliza función existente)
create trigger installed_apps_updated_at
  before update on public.installed_apps
  for each row execute function set_updated_at();

-- exec_sql: SECURITY DEFINER, only service_role
create or replace function public.exec_sql(sql text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  execute sql;
end;
$$;

revoke all on function public.exec_sql(text) from public;
grant execute on function public.exec_sql(text) to service_role;
