-- TRANSMIND AI CUSTOMER CARE MEMORY
-- Stores only relationship details voluntarily provided for service continuity.
create table if not exists public.customer_care_memory (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid null,
  phone text null,
  name text null,
  memory_type text not null check (memory_type in ('birthday','important_date','preference','family_context','travel_preference','relationship_note')),
  memory_value text not null,
  event_date date null,
  source text not null default 'ai_customer_care',
  consent_status text not null default 'granted' check (consent_status in ('granted','revoked','unknown')),
  active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists customer_care_memory_phone_idx on public.customer_care_memory(phone);
create index if not exists customer_care_memory_event_date_idx on public.customer_care_memory(event_date);
create index if not exists customer_care_memory_customer_idx on public.customer_care_memory(customer_id);

alter table public.customer_care_memory enable row level security;

drop policy if exists customer_care_memory_authenticated_select on public.customer_care_memory;
create policy customer_care_memory_authenticated_select
on public.customer_care_memory for select to authenticated
using (true);

drop policy if exists customer_care_memory_authenticated_write on public.customer_care_memory;
create policy customer_care_memory_authenticated_write
on public.customer_care_memory for all to authenticated
using (true) with check (true);

create or replace function public.customer_care_memory_touch()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists customer_care_memory_touch on public.customer_care_memory;
create trigger customer_care_memory_touch
before update on public.customer_care_memory
for each row execute function public.customer_care_memory_touch();
