-- TransMind Nexus CRM reset + customer-care lifecycle foundation
-- Purpose: remove the legacy CRM task queue shown in Nexus and start a clean sales cycle.
-- This intentionally does NOT delete customers, bookings, vehicles, analytics, or financial records.

begin;

delete from public.crm_tasks;

-- Keep the customer-care memory model extensible for the learning loop.
alter table if exists public.customer_care_memory
  add column if not exists last_used_at timestamptz;

alter table if exists public.nexus_communications
  add column if not exists followup_stage text;

alter table if exists public.nexus_communications
  add column if not exists requires_human boolean not null default false;

commit;
