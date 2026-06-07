-- =============================================
-- analysis_cache（分析結果キャッシュ）
-- =============================================
create table analysis_cache (
  id uuid primary key default gen_random_uuid(),
  stock_code text not null,
  analysis_result jsonb not null,
  score int not null,
  created_at timestamptz not null default now()
);

create index analysis_cache_code_created on analysis_cache(stock_code, created_at desc);

-- =============================================
-- RLS有効化（認証なしでも読み書き可能）
-- =============================================
alter table analysis_cache enable row level security;

create policy "analysis_cache_select" on analysis_cache
  for select using (true);

create policy "analysis_cache_insert" on analysis_cache
  for insert with check (true);
