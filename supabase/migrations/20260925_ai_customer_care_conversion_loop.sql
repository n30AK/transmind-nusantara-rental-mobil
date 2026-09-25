-- TransMind AI Customer Service conversion + relationship loop
-- Database foundation for consented lead follow-up, human handoff and learning.
create table if not exists public.customer_care_leads (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references public.customers(id) on delete set null,
  session_id text,
  name text not null,
  phone text not null,
  consent_status text not null default 'granted' check (consent_status in ('granted','revoked','unknown')),
  source text not null default 'website_ai',
  stage text not null default 'new',
  intent text,
  quote_value numeric,
  status text not null default 'open' check (status in ('open','booked','lost','paused','do_not_contact')),
  human_required boolean not null default false,
  human_reason text,
  last_activity_at timestamptz not null default now(),
  next_followup_at timestamptz,
  followup_stage text not null default '30m',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists customer_care_leads_phone_idx on public.customer_care_leads(phone);
create index if not exists customer_care_leads_next_idx on public.customer_care_leads(next_followup_at) where status='open';

create table if not exists public.customer_care_followup_queue (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.customer_care_leads(id) on delete cascade,
  stage text not null,
  scheduled_at timestamptz not null,
  channel text not null default 'whatsapp',
  message_body text not null,
  status text not null default 'queued' check (status in ('queued','admin_ready','sent','delivered','read','failed','cancelled')),
  requires_human boolean not null default false,
  attempted_at timestamptz,
  outcome text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique(lead_id,stage)
);
create index if not exists customer_care_followup_due_idx on public.customer_care_followup_queue(status,scheduled_at);

create table if not exists public.customer_care_learning (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references public.customer_care_leads(id) on delete set null,
  session_id text,
  signal_type text not null,
  signal_value jsonb not null default '{}'::jsonb,
  outcome text,
  created_at timestamptz not null default now()
);
create index if not exists customer_care_learning_type_idx on public.customer_care_learning(signal_type,created_at desc);

alter table public.customer_care_leads enable row level security;
alter table public.customer_care_followup_queue enable row level security;
alter table public.customer_care_learning enable row level security;
drop policy if exists customer_care_leads_authenticated on public.customer_care_leads;
create policy customer_care_leads_authenticated on public.customer_care_leads for all to authenticated using (true) with check (true);
drop policy if exists customer_care_followup_authenticated on public.customer_care_followup_queue;
create policy customer_care_followup_authenticated on public.customer_care_followup_queue for all to authenticated using (true) with check (true);
drop policy if exists customer_care_learning_authenticated on public.customer_care_learning;
create policy customer_care_learning_authenticated on public.customer_care_learning for all to authenticated using (true) with check (true);

create or replace function public.process_customer_care_followups()
returns integer
language plpgsql
security invoker
as $$
declare n integer := 0;
begin
  with due as (
    select q.id,q.lead_id,q.stage
    from public.customer_care_followup_queue q
    join public.customer_care_leads l on l.id=q.lead_id
    where q.status='queued' and q.scheduled_at <= now() and l.status='open'
    order by q.scheduled_at
    for update of q skip locked
    limit 25
  ), marked as (
    update public.customer_care_followup_queue q
    set status='admin_ready', attempted_at=now(), outcome='due_followup_requires_provider_or_admin_send'
    from due where q.id=due.id
    returning q.id,q.lead_id,q.stage
  )
  insert into public.crm_tasks(customer_id,task_type,priority,status,title,notes,pipeline_stage,next_followup_at,quote_value,metadata)
  select l.customer_id,'AI_CUSTOMER_CARE_FOLLOWUP',
    case when l.human_required then 'high' else 'normal' end,'open',
    'Peluang follow-up AI Customer Service · '||l.name,
    'Calon pelanggan perlu ditindaklanjuti. Tahap: '||m.stage||'. Buka AI Customer Service untuk konteks dan pesan siap kirim.',
    'qualified_lead',now(),l.quote_value,
    jsonb_build_object('lead_id',l.id,'followup_stage',m.stage,'phone',l.phone,'requires_human',l.human_required,'source','customer_care_scheduler')
  from marked m join public.customer_care_leads l on l.id=m.lead_id
  where not exists (
    select 1 from public.crm_tasks t
    where t.task_type='AI_CUSTOMER_CARE_FOLLOWUP' and t.status='open'
      and t.metadata->>'lead_id'=l.id::text and t.metadata->>'followup_stage'=m.stage
  );
  get diagnostics n = row_count;
  return n;
end;
$$;

do $$
begin
  if not exists (select 1 from cron.job where jobname='transmind-customer-care-followups') then
    perform cron.schedule('transmind-customer-care-followups','*/5 * * * *','select public.process_customer_care_followups()');
  else
    perform cron.alter_job((select jobid from cron.job where jobname='transmind-customer-care-followups'),'*/5 * * * *');
  end if;
end $$;