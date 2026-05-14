create extension if not exists "uuid-ossp";

create table public.profiles (
  id             uuid primary key references auth.users(id) on delete cascade,
  display_name   text,
  locale         text not null default 'es' check (locale in ('es', 'en', 'it')),
  avatar_url     text,
  last_login_at  timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create table public.groups (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  slug        text not null unique,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create type public.group_role as enum ('admin', 'member');

create table public.group_members (
  id          uuid primary key default uuid_generate_v4(),
  group_id    uuid not null references public.groups(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  role        public.group_role not null default 'member',
  invited_by  uuid references auth.users(id),
  joined_at   timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (group_id, user_id)
);

create table public.app_permissions (
  id          uuid primary key default uuid_generate_v4(),
  group_id    uuid not null references public.groups(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  app_slug    text not null,
  enabled     boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (group_id, user_id, app_slug)
);
