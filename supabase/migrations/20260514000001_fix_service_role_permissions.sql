-- Grant schema usage to all roles
grant usage on schema public to anon, authenticated, service_role;

-- Grant table permissions to all roles
grant all on public.profiles to anon, authenticated, service_role;
grant all on public.groups to anon, authenticated, service_role;
grant all on public.group_members to anon, authenticated, service_role;
grant all on public.app_permissions to anon, authenticated, service_role;
grant all on public.invitations to anon, authenticated, service_role;
grant all on public.installed_apps to anon, authenticated, service_role;
grant all on public.group_settings to anon, authenticated, service_role;
grant all on api_keys to anon, authenticated, service_role;

-- Grant sequence usage (for tables using serial/bigserial)
grant usage on all sequences in schema public to anon, authenticated, service_role;
