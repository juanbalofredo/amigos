create table if not exists public.votes (
  id uuid primary key default gen_random_uuid(),
  voter_slug text not null,
  target_slug text not null,
  scores jsonb not null,
  updated_at timestamptz not null default now(),
  unique (voter_slug, target_slug)
);

alter table public.votes enable row level security;

create policy "votes_select" on public.votes for select using (true);
create policy "votes_insert" on public.votes for insert with check (true);
create policy "votes_update" on public.votes for update using (true);
create policy "votes_delete" on public.votes for delete using (true);
