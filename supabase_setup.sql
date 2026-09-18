-- Normalize Lab: Datenbankstruktur für Nickname-Login und Fortschritt
create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  nickname text not null,
  role text not null default 'student' check (role in ('student','teacher')),
  created_at timestamptz not null default now()
);
create unique index if not exists profiles_nickname_lower_idx on public.profiles (lower(nickname));

create table if not exists public.progress (
  user_id uuid primary key references public.profiles(user_id) on delete cascade,
  state jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.progress enable row level security;

drop policy if exists "profile own select" on public.profiles;
create policy "profile own select" on public.profiles for select using (auth.uid() = user_id);

drop policy if exists "progress own select" on public.progress;
create policy "progress own select" on public.progress for select using (auth.uid() = user_id);
drop policy if exists "progress own insert" on public.progress;
create policy "progress own insert" on public.progress for insert with check (auth.uid() = user_id);
drop policy if exists "progress own update" on public.progress;
create policy "progress own update" on public.progress for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "progress own delete" on public.progress;
create policy "progress own delete" on public.progress for delete using (auth.uid() = user_id);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles(user_id,nickname,role)
  values(new.id, coalesce(new.raw_user_meta_data->>'nickname','Lernender'), 'student');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users for each row execute procedure public.handle_new_user();

-- Lehrer einmalig einrichten:
-- 1. Lehrer registriert sich über die Kursoberfläche.
-- 2. Danach im SQL Editor ausführen (Nickname anpassen):
-- update public.profiles set role='teacher' where lower(nickname)=lower('LEHRER_NICKNAME');
