create table api_keys (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references groups(id) on delete cascade,
  name text not null,
  key_prefix text not null,
  key_hash text not null unique,
  created_by uuid references auth.users(id) on delete set null,
  scope text not null default 'group' check (scope in ('group', 'user')),
  user_id uuid references auth.users(id) on delete cascade,
  last_used_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

alter table api_keys enable row level security;

-- Admins del grupo ven y gestionan todas las keys del grupo
create policy "admins manage group api keys"
  on api_keys
  for all
  using (
    exists (
      select 1 from group_members
      where group_members.group_id = api_keys.group_id
        and group_members.user_id = auth.uid()
        and group_members.role = 'admin'
    )
  );

-- Usuarios ven y gestionan sus propias PATs
create policy "users manage own api keys"
  on api_keys
  for all
  using (
    scope = 'user'
    and user_id = auth.uid()
  );

-- Índice para lookup rápido por group_id
create index api_keys_group_id_idx on api_keys(group_id);
