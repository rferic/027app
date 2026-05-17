-- Sprint 6: Grupos Multitenant
-- 1. Tabla group_app_access (reemplaza app_permissions para acceso por grupo)
create table public.group_app_access (
  id         uuid primary key default gen_random_uuid(),
  group_id   uuid not null references public.groups(id) on delete cascade,
  app_slug   text not null,
  created_at timestamptz not null default now(),
  unique (group_id, app_slug)
);

alter table public.group_app_access enable row level security;

-- SELECT: solo miembros del grupo específico pueden ver
create policy "group_app_access_select" on public.group_app_access
  for select to authenticated using (
    exists (
      select 1 from public.group_members gm
      where gm.user_id = auth.uid() and gm.group_id = group_app_access.group_id
    )
  );

-- INSERT/DELETE: solo service_role (via admin client)
create policy "group_app_access_admin" on public.group_app_access
  for all to service_role using (true);

-- 2. Eliminar app_permissions (sustituida por group_app_access)
drop table if exists public.app_permissions cascade;

-- 3. group_id en todo_items
alter table public.todo_items
  add column if not exists group_id uuid references public.groups(id) on delete cascade;

-- Si hay datos existentes y la columna acaba de crearse con NULLs, asignarlos al primer grupo
-- (esto es seguro en dev; en prod se necesitaría migración manual)
do $$
declare
  first_group_id uuid;
begin
  select id into first_group_id from public.groups order by created_at asc limit 1;
  if first_group_id is not null then
    update public.todo_items set group_id = first_group_id where group_id is null;
  end if;
end $$;

alter table public.todo_items alter column group_id set not null;

-- 4. visibility y assigned_to en todo_items
alter table public.todo_items
  add column if not exists visibility text not null default 'private'
    check (visibility in ('private', 'public'));

alter table public.todo_items
  add column if not exists assigned_to uuid references auth.users(id) on delete set null;

-- 5. Reemplazar RLS de todo_items (eliminar políticas viejas y crear nuevas)
drop policy if exists "Users can read own todos" on public.todo_items;
drop policy if exists "Users can insert own todos" on public.todo_items;
drop policy if exists "Users can update own todos" on public.todo_items;
drop policy if exists "Users can delete own todos" on public.todo_items;
drop policy if exists "todo_items_select" on public.todo_items;

-- SELECT:
--   private: solo user_id (creador)
--   public: cualquier miembro del grupo
create policy "todo_items_select" on public.todo_items
  for select to authenticated using (
    user_id = auth.uid()
    or (
      visibility = 'public'
      and exists (
        select 1 from public.group_members gm
        where gm.user_id = auth.uid() and gm.group_id = todo_items.group_id
      )
    )
  );

-- INSERT: el user_id debe ser el usuario actual
create policy "todo_items_insert" on public.todo_items
  for insert to authenticated
  with check (user_id = auth.uid());

-- UPDATE:
--   private: solo user_id
--   public sin assigned_to: cualquier miembro del grupo
--   public con assigned_to: solo user_id o assigned_to
create policy "todo_items_update" on public.todo_items
  for update to authenticated
  using (
    user_id = auth.uid()
    or (
      visibility = 'public'
      and exists (
        select 1 from public.group_members gm
        where gm.user_id = auth.uid() and gm.group_id = todo_items.group_id
      )
      and (assigned_to is null or assigned_to = auth.uid())
    )
  );

-- DELETE: solo user_id (creador)
create policy "todo_items_delete" on public.todo_items
  for delete to authenticated
  using (user_id = auth.uid());

-- 6. group_ids en invitations
alter table public.invitations
  add column if not exists group_ids uuid[] not null default '{}';
