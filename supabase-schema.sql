create table if not exists public.mahjong_app_state (
  room_id text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.mahjong_app_state enable row level security;

drop policy if exists "mahjong app state public read" on public.mahjong_app_state;
drop policy if exists "mahjong app state public insert" on public.mahjong_app_state;
drop policy if exists "mahjong app state public update" on public.mahjong_app_state;

create policy "mahjong app state public read"
on public.mahjong_app_state
for select
to anon
using (true);

create policy "mahjong app state public insert"
on public.mahjong_app_state
for insert
to anon
with check (true);

create policy "mahjong app state public update"
on public.mahjong_app_state
for update
to anon
using (true)
with check (true);

create or replace function public.set_mahjong_app_state_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_mahjong_app_state_updated_at on public.mahjong_app_state;

create trigger set_mahjong_app_state_updated_at
before update on public.mahjong_app_state
for each row
execute function public.set_mahjong_app_state_updated_at();

-- Supabase Realtime needs this table added to the realtime publication.
-- If it is already added, Supabase may show a duplicate-object notice; that is safe to ignore.
alter publication supabase_realtime add table public.mahjong_app_state;
