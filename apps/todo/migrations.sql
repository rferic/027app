create table if not exists todo_items (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users on delete cascade,
  title        text not null,
  completed    boolean not null default false,
  created_at   timestamptz not null default now()
);

alter table todo_items enable row level security;

create policy "Users can read own todos"
  on todo_items for select
  using (auth.uid() = user_id);

create policy "Users can insert own todos"
  on todo_items for insert
  with check (auth.uid() = user_id);

create policy "Users can update own todos"
  on todo_items for update
  using (auth.uid() = user_id);

create policy "Users can delete own todos"
  on todo_items for delete
  using (auth.uid() = user_id);
