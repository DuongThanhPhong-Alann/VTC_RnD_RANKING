# VTC_RnD_RANKING

## Supabase auth + profiles (ghi chu)

Muc tieu:
- Dang nhap bang Supabase Auth.
- Chua dang nhap thi chi o trang login, dang nhap moi xem duoc noi dung.
- Co the doi mat khau sau khi dang nhap.

SQL tao CSDL (chay trong Supabase SQL Editor):

```sql
-- =========================
-- PROFILES
-- =========================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  display_name text,
  avatar_url text,
  phone text,
  gender text, -- optional: 'male'/'female'/'other'
  birth_date date,
  bio text,
  address text,
  company text,
  job_title text,
  website text,
  locale text,
  timezone text,
  status text default 'active', -- active / blocked / pending
  is_active boolean default true,
  last_login_at timestamptz,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists profiles_email_idx on public.profiles(email);
create index if not exists profiles_status_idx on public.profiles(status);

alter table public.profiles enable row level security;

create policy "profiles_select_own"
on public.profiles
for select
using (auth.uid() = id);

create policy "profiles_update_own"
on public.profiles
for update
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "profiles_insert_own"
on public.profiles
for insert
with check (auth.uid() = id);

-- =========================
-- ROLES & PERMISSIONS
-- =========================
create table if not exists public.roles (
  id bigserial primary key,
  name text unique not null,
  description text,
  created_at timestamptz default now()
);

create table if not exists public.permissions (
  id bigserial primary key,
  name text unique not null,
  description text,
  created_at timestamptz default now()
);

create table if not exists public.role_permissions (
  role_id bigint references public.roles(id) on delete cascade,
  permission_id bigint references public.permissions(id) on delete cascade,
  primary key (role_id, permission_id)
);

create table if not exists public.user_roles (
  user_id uuid references public.profiles(id) on delete cascade,
  role_id bigint references public.roles(id) on delete cascade,
  primary key (user_id, role_id),
  created_at timestamptz default now()
);

alter table public.roles enable row level security;
alter table public.permissions enable row level security;
alter table public.role_permissions enable row level security;
alter table public.user_roles enable row level security;

-- Chi cho authenticated doc roles/permissions
create policy "roles_select_all"
on public.roles
for select
using (auth.role() = 'authenticated');

create policy "permissions_select_all"
on public.permissions
for select
using (auth.role() = 'authenticated');

create policy "role_permissions_select_all"
on public.role_permissions
for select
using (auth.role() = 'authenticated');

-- user_roles: user chi xem role cua chinh minh
create policy "user_roles_select_own"
on public.user_roles
for select
using (auth.uid() = user_id);

-- =========================
-- TRIGGERS
-- =========================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute procedure public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id, email, full_name, display_name, avatar_url, phone, metadata
  )
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    coalesce(new.raw_user_meta_data->>'display_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url',
    new.raw_user_meta_data->>'phone',
    coalesce(new.raw_user_meta_data, '{}'::jsonb)
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();
```
