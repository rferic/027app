alter table public.profiles enable row level security;
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.app_permissions enable row level security;

create policy "profiles: self read"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles: self update"
  on public.profiles for update
  using (auth.uid() = id);

create policy "groups: member read"
  on public.groups for select
  using (
    exists (
      select 1 from public.group_members
      where group_members.group_id = groups.id
        and group_members.user_id = auth.uid()
    )
  );

create policy "groups: admin write"
  on public.groups for all
  using (
    exists (
      select 1 from public.group_members
      where group_members.group_id = groups.id
        and group_members.user_id = auth.uid()
        and group_members.role = 'admin'
    )
  );

create policy "group_members: member read"
  on public.group_members for select
  using (
    user_id = auth.uid()
    or exists (
      select 1 from public.group_members gm2
      where gm2.group_id = group_members.group_id
        and gm2.user_id = auth.uid()
    )
  );

create policy "group_members: admin write"
  on public.group_members for all
  using (
    exists (
      select 1 from public.group_members gm2
      where gm2.group_id = group_members.group_id
        and gm2.user_id = auth.uid()
        and gm2.role = 'admin'
    )
  );

create policy "app_permissions: self read"
  on public.app_permissions for select
  using (user_id = auth.uid());

create policy "app_permissions: admin write"
  on public.app_permissions for all
  using (
    exists (
      select 1 from public.group_members
      where group_members.group_id = app_permissions.group_id
        and group_members.user_id = auth.uid()
        and group_members.role = 'admin'
    )
  );
