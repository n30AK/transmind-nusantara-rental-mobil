create table if not exists public.nexus_seo_targets (
  id uuid primary key default gen_random_uuid(),
  keyword text not null,
  location text,
  intent text not null default 'commercial',
  topic_cluster text,
  priority integer not null default 50 check (priority between 0 and 100),
  status text not null default 'planned',
  target_url text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.nexus_seo_signals (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  signal_type text not null,
  market text,
  keyword text,
  competitor_domain text,
  target_url text,
  signal_score numeric,
  evidence text,
  raw_data jsonb not null default '{}'::jsonb,
  observed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.nexus_seo_experiments (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  hypothesis text not null,
  target_url text,
  change_type text not null,
  baseline jsonb not null default '{}'::jsonb,
  variant jsonb not null default '{}'::jsonb,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  status text not null default 'running',
  outcome text,
  score numeric,
  created_at timestamptz not null default now()
);

alter table public.nexus_seo_targets enable row level security;
alter table public.nexus_seo_signals enable row level security;
alter table public.nexus_seo_experiments enable row level security;

drop policy if exists "nexus_seo_targets_select" on public.nexus_seo_targets;
create policy "nexus_seo_targets_select" on public.nexus_seo_targets
for select to authenticated
using (public.has_permission('marketing.manage') or public.has_permission('admin.manage'));

drop policy if exists "nexus_seo_targets_write" on public.nexus_seo_targets;
create policy "nexus_seo_targets_write" on public.nexus_seo_targets
for all to authenticated
using (public.has_permission('marketing.manage') or public.has_permission('admin.manage'))
with check (public.has_permission('marketing.manage') or public.has_permission('admin.manage'));

drop policy if exists "nexus_seo_signals_select" on public.nexus_seo_signals;
create policy "nexus_seo_signals_select" on public.nexus_seo_signals
for select to authenticated
using (public.has_permission('marketing.manage') or public.has_permission('admin.manage'));

drop policy if exists "nexus_seo_signals_write" on public.nexus_seo_signals;
create policy "nexus_seo_signals_write" on public.nexus_seo_signals
for all to authenticated
using (public.has_permission('marketing.manage') or public.has_permission('admin.manage'))
with check (public.has_permission('marketing.manage') or public.has_permission('admin.manage'));

drop policy if exists "nexus_seo_experiments_select" on public.nexus_seo_experiments;
create policy "nexus_seo_experiments_select" on public.nexus_seo_experiments
for select to authenticated
using (public.has_permission('marketing.manage') or public.has_permission('admin.manage'));

drop policy if exists "nexus_seo_experiments_write" on public.nexus_seo_experiments;
create policy "nexus_seo_experiments_write" on public.nexus_seo_experiments
for all to authenticated
using (public.has_permission('marketing.manage') or public.has_permission('admin.manage'))
with check (public.has_permission('marketing.manage') or public.has_permission('admin.manage'));

create index if not exists idx_nexus_seo_targets_priority on public.nexus_seo_targets(priority desc, status);
create index if not exists idx_nexus_seo_signals_observed on public.nexus_seo_signals(observed_at desc);
create index if not exists idx_nexus_seo_signals_keyword on public.nexus_seo_signals(keyword);
create index if not exists idx_nexus_seo_experiments_status on public.nexus_seo_experiments(status, started_at desc);

insert into public.nexus_seo_targets (keyword, location, intent, topic_cluster, priority, status, target_url, notes)
select * from (values
 ('rental mobil jakarta','Jakarta','commercial','rental mobil area',95,'active','/rental-mobil-jakarta.html','Core commercial query'),
 ('rental mobil bekasi','Bekasi','commercial','rental mobil area',94,'active','/rental-mobil-bekasi.html','Core local query'),
 ('rental mobil bogor','Bogor','commercial','rental mobil area',92,'active','/rental-mobil-bogor.html','Core local query'),
 ('rental mobil depok','Depok','commercial','rental mobil area',90,'active','/rental-mobil-depok.html','Core local query'),
 ('rental mobil tangerang','Tangerang','commercial','rental mobil area',90,'active','/rental-mobil-tangerang.html','Core local query'),
 ('rental mobil lepas kunci jabodetabek','Jabodetabek','commercial','service intent',96,'active','/rental-mobil-lepas-kunci-jabodetabek.html','Service intent'),
 ('rental mobil dengan driver jabodetabek','Jabodetabek','commercial','service intent',96,'active','/rental-mobil-dengan-driver-jabodetabek.html','Service intent'),
 ('rental mobil corporate jabodetabek','Jabodetabek','commercial','corporate mobility',88,'active','/rental-mobil-corporate-jabodetabek.html','B2B intent'),
 ('rental mobil wedding jabodetabek','Jabodetabek','commercial','event mobility',84,'active','/rental-mobil-wedding-jabodetabek.html','Event intent'),
 ('rental mobil pariwisata jabodetabek','Jabodetabek','commercial','travel mobility',86,'active','/rental-mobil-pariwisata-jabodetabek.html','Travel intent'),
 ('sewa mobil untuk perjalanan bisnis jakarta','Jakarta','informational-commercial','business mobility',78,'planned','/rental-mobil-jakarta.html','Content expansion candidate'),
 ('rental mobil keluarga jabodetabek','Jabodetabek','informational-commercial','family mobility',76,'planned','/rental-mobil-pariwisata-jabodetabek.html','Content expansion candidate')
) v(keyword,location,intent,topic_cluster,priority,status,target_url,notes)
where not exists (
 select 1 from public.nexus_seo_targets t where lower(t.keyword)=lower(v.keyword) and coalesce(t.location,'')=coalesce(v.location,'')
);