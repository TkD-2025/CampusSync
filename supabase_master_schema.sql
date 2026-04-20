-- CampusSync master Supabase schema
-- Run this entire file in the Supabase SQL Editor on a fresh project.
--
-- Important:
-- 1. After running this SQL, update `.env` with the new project URL and anon key.
-- 2. If you want users to be logged in immediately after signup, disable email confirmation
--    in Supabase Auth settings. If email confirmation stays enabled, signup works but the
--    user must verify their email before they can sign in.

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  name text not null default '',
  username text not null default '',
  college_name text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text not null default '',
  deadline date,
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high')),
  status text not null default 'pending' check (status in ('pending', 'completed')),
  group_id uuid,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  leader_id uuid not null references auth.users(id) on delete cascade,
  members text[] not null default '{}'::text[],
  invitees text[] not null default '{}'::text[],
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null default '',
  date date,
  description text not null default '',
  location text not null default '',
  city text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.resources (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  subject text not null,
  semester text not null,
  file_url text not null,
  uploaded_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.institutional_details (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  institution text not null default '',
  department text not null default '',
  semester text not null default '',
  student_id text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.quiz_decks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.quiz_cards (
  id uuid primary key default gen_random_uuid(),
  deck_id uuid not null references public.quiz_decks(id) on delete cascade,
  question text not null,
  answer text not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

do $$
begin
  if not exists (
    select 1
    from information_schema.table_constraints
    where table_schema = 'public'
      and table_name = 'tasks'
      and constraint_name = 'tasks_group_id_fkey'
  ) then
    alter table public.tasks
      add constraint tasks_group_id_fkey
      foreign key (group_id) references public.groups(id) on delete set null;
  end if;
end $$;

create index if not exists idx_users_college_name on public.users (college_name);
create index if not exists idx_tasks_user_id_deadline on public.tasks (user_id, deadline);
create index if not exists idx_tasks_group_id on public.tasks (group_id);
create index if not exists idx_groups_leader_id on public.groups (leader_id);
create index if not exists idx_events_date on public.events (date);
create index if not exists idx_resources_uploaded_by on public.resources (uploaded_by);
create index if not exists idx_quiz_decks_user_id on public.quiz_decks (user_id);
create index if not exists idx_quiz_cards_deck_id on public.quiz_cards (deck_id);

drop trigger if exists set_users_updated_at on public.users;
create trigger set_users_updated_at
before update on public.users
for each row execute function public.set_updated_at();

drop trigger if exists set_tasks_updated_at on public.tasks;
create trigger set_tasks_updated_at
before update on public.tasks
for each row execute function public.set_updated_at();

drop trigger if exists set_groups_updated_at on public.groups;
create trigger set_groups_updated_at
before update on public.groups
for each row execute function public.set_updated_at();

drop trigger if exists set_events_updated_at on public.events;
create trigger set_events_updated_at
before update on public.events
for each row execute function public.set_updated_at();

drop trigger if exists set_resources_updated_at on public.resources;
create trigger set_resources_updated_at
before update on public.resources
for each row execute function public.set_updated_at();

drop trigger if exists set_institutional_details_updated_at on public.institutional_details;
create trigger set_institutional_details_updated_at
before update on public.institutional_details
for each row execute function public.set_updated_at();

drop trigger if exists set_quiz_decks_updated_at on public.quiz_decks;
create trigger set_quiz_decks_updated_at
before update on public.quiz_decks
for each row execute function public.set_updated_at();

drop trigger if exists set_quiz_cards_updated_at on public.quiz_cards;
create trigger set_quiz_cards_updated_at
before update on public.quiz_cards
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, name, username, college_name)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', ''),
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', ''),
    ''
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

insert into public.users (id, email, name, username, college_name)
select
  au.id,
  coalesce(au.email, ''),
  coalesce(au.raw_user_meta_data ->> 'full_name', au.raw_user_meta_data ->> 'name', ''),
  coalesce(au.raw_user_meta_data ->> 'full_name', au.raw_user_meta_data ->> 'name', ''),
  ''
from auth.users au
left join public.users pu on pu.id = au.id
where pu.id is null
on conflict (id) do nothing;

grant usage on schema public to anon, authenticated, service_role;
grant execute on function public.set_updated_at() to authenticated, service_role;
grant execute on function public.handle_new_user() to service_role;
grant select, insert, update, delete on all tables in schema public to authenticated;

alter table public.users enable row level security;
alter table public.tasks enable row level security;
alter table public.groups enable row level security;
alter table public.events enable row level security;
alter table public.resources enable row level security;
alter table public.institutional_details enable row level security;
alter table public.quiz_decks enable row level security;
alter table public.quiz_cards enable row level security;

drop policy if exists "users_select_authenticated" on public.users;
create policy "users_select_authenticated"
on public.users
for select
to authenticated
using (true);

drop policy if exists "users_insert_self" on public.users;
create policy "users_insert_self"
on public.users
for insert
to authenticated
with check (auth.uid() = id);

drop policy if exists "users_update_self" on public.users;
create policy "users_update_self"
on public.users
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "tasks_select_own" on public.tasks;
create policy "tasks_select_own"
on public.tasks
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "tasks_insert_own" on public.tasks;
create policy "tasks_insert_own"
on public.tasks
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "tasks_update_own" on public.tasks;
create policy "tasks_update_own"
on public.tasks
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "tasks_delete_own" on public.tasks;
create policy "tasks_delete_own"
on public.tasks
for delete
to authenticated
using (auth.uid() = user_id);

drop policy if exists "groups_select_authenticated" on public.groups;
create policy "groups_select_authenticated"
on public.groups
for select
to authenticated
using (true);

drop policy if exists "groups_insert_authenticated" on public.groups;
create policy "groups_insert_authenticated"
on public.groups
for insert
to authenticated
with check (auth.uid() = leader_id);

drop policy if exists "groups_update_authenticated" on public.groups;
create policy "groups_update_authenticated"
on public.groups
for update
to authenticated
using (true)
with check (true);

drop policy if exists "groups_delete_authenticated" on public.groups;
create policy "groups_delete_authenticated"
on public.groups
for delete
to authenticated
using (true);

drop policy if exists "events_select_authenticated" on public.events;
create policy "events_select_authenticated"
on public.events
for select
to authenticated
using (true);

drop policy if exists "events_insert_authenticated" on public.events;
create policy "events_insert_authenticated"
on public.events
for insert
to authenticated
with check (true);

drop policy if exists "events_update_authenticated" on public.events;
create policy "events_update_authenticated"
on public.events
for update
to authenticated
using (true)
with check (true);

drop policy if exists "events_delete_authenticated" on public.events;
create policy "events_delete_authenticated"
on public.events
for delete
to authenticated
using (true);

drop policy if exists "resources_select_authenticated" on public.resources;
create policy "resources_select_authenticated"
on public.resources
for select
to authenticated
using (true);

drop policy if exists "resources_insert_authenticated" on public.resources;
create policy "resources_insert_authenticated"
on public.resources
for insert
to authenticated
with check (auth.uid() = uploaded_by);

drop policy if exists "resources_update_authenticated" on public.resources;
create policy "resources_update_authenticated"
on public.resources
for update
to authenticated
using (true)
with check (true);

drop policy if exists "resources_delete_authenticated" on public.resources;
create policy "resources_delete_authenticated"
on public.resources
for delete
to authenticated
using (true);

drop policy if exists "institutional_details_select_own" on public.institutional_details;
create policy "institutional_details_select_own"
on public.institutional_details
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "institutional_details_insert_own" on public.institutional_details;
create policy "institutional_details_insert_own"
on public.institutional_details
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "institutional_details_update_own" on public.institutional_details;
create policy "institutional_details_update_own"
on public.institutional_details
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "institutional_details_delete_own" on public.institutional_details;
create policy "institutional_details_delete_own"
on public.institutional_details
for delete
to authenticated
using (auth.uid() = user_id);

drop policy if exists "quiz_decks_select_own" on public.quiz_decks;
create policy "quiz_decks_select_own"
on public.quiz_decks
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "quiz_decks_insert_own" on public.quiz_decks;
create policy "quiz_decks_insert_own"
on public.quiz_decks
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "quiz_decks_update_own" on public.quiz_decks;
create policy "quiz_decks_update_own"
on public.quiz_decks
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "quiz_decks_delete_own" on public.quiz_decks;
create policy "quiz_decks_delete_own"
on public.quiz_decks
for delete
to authenticated
using (auth.uid() = user_id);

drop policy if exists "quiz_cards_select_owner" on public.quiz_cards;
create policy "quiz_cards_select_owner"
on public.quiz_cards
for select
to authenticated
using (
  exists (
    select 1
    from public.quiz_decks d
    where d.id = quiz_cards.deck_id
      and d.user_id = auth.uid()
  )
);

drop policy if exists "quiz_cards_insert_owner" on public.quiz_cards;
create policy "quiz_cards_insert_owner"
on public.quiz_cards
for insert
to authenticated
with check (
  exists (
    select 1
    from public.quiz_decks d
    where d.id = quiz_cards.deck_id
      and d.user_id = auth.uid()
  )
);

drop policy if exists "quiz_cards_update_owner" on public.quiz_cards;
create policy "quiz_cards_update_owner"
on public.quiz_cards
for update
to authenticated
using (
  exists (
    select 1
    from public.quiz_decks d
    where d.id = quiz_cards.deck_id
      and d.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.quiz_decks d
    where d.id = quiz_cards.deck_id
      and d.user_id = auth.uid()
  )
);

drop policy if exists "quiz_cards_delete_owner" on public.quiz_cards;
create policy "quiz_cards_delete_owner"
on public.quiz_cards
for delete
to authenticated
using (
  exists (
    select 1
    from public.quiz_decks d
    where d.id = quiz_cards.deck_id
      and d.user_id = auth.uid()
  )
);

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'users',
    'tasks',
    'groups',
    'events',
    'resources',
    'institutional_details',
    'quiz_decks',
    'quiz_cards'
  ]
  loop
    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = table_name
    ) then
      execute format('alter publication supabase_realtime add table public.%I', table_name);
    end if;
  end loop;
end $$;

insert into public.events (title, category, date, description, location, city)
select
  'Arise Hackathon',
  'Hackathon',
  date '2026-05-10',
  'An exciting hackathon at Scaler School of Technology. Build innovative solutions and compete with the best!',
  'Scaler School of Technology',
  'Bangalore'
where not exists (
  select 1
  from public.events
  where title = 'Arise Hackathon'
);
