-- ============================================================
--  TRUE OREGONIAN MAJORS POOL — DATABASE SETUP
--  Run this once in Supabase: SQL Editor → paste → Run
-- ============================================================

create table if not exists tournaments (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  espn_id    text,
  purse      numeric not null default 21000000,
  status     text not null default 'setup',
  created_at timestamptz default now()
);

create table if not exists participants (
  id            uuid primary key default gen_random_uuid(),
  tournament_id uuid references tournaments(id) on delete cascade,
  name          text not null,
  draft_order   int,
  created_at    timestamptz default now()
);

create table if not exists picks (
  id             uuid primary key default gen_random_uuid(),
  tournament_id  uuid references tournaments(id) on delete cascade,
  participant_id uuid references participants(id) on delete cascade,
  golfer_name    text not null,
  pick_number    int not null,
  round          int not null,
  created_at     timestamptz default now(),
  unique(tournament_id, participant_id, golfer_name)
);

alter table tournaments  enable row level security;
alter table participants enable row level security;
alter table picks        enable row level security;

create policy "public_all" on tournaments  for all using (true) with check (true);
create policy "public_all" on participants for all using (true) with check (true);
create policy "public_all" on picks        for all using (true) with check (true);
