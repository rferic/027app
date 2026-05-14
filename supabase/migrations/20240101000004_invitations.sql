create table public.invitations (
  id          uuid primary key default uuid_generate_v4(),
  token       uuid not null default uuid_generate_v4() unique,
  title       text not null,
  role        public.group_role not null default 'member',
  email       text,
  invited_by  uuid not null references auth.users(id),
  accepted_by uuid references auth.users(id),
  accepted_at timestamptz,
  revoked_at  timestamptz,
  expires_at  timestamptz,
  created_at  timestamptz not null default now()
);

alter table public.invitations enable row level security;

create policy "invitations: admin all"
  on public.invitations for all
  using (
    exists (
      select 1 from public.group_members
      where group_members.user_id = auth.uid()
        and group_members.role = 'admin'
    )
  );

create policy "invitations: anon read by token"
  on public.invitations for select
  to anon, authenticated
  using (true);
