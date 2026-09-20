-- TransMind Nexus transaction domain schema
-- Production schema was applied before this source record was committed.

alter table public.payments
  add column if not exists payment_type text,
  add column if not exists payment_channel text,
  add column if not exists provider_name text,
  add column if not exists provider_reference text,
  add column if not exists gateway_transaction_id text,
  add column if not exists gateway_status text,
  add column if not exists verification_status text default 'Belum Diverifikasi',
  add column if not exists verified_at timestamptz,
  add column if not exists verified_by uuid,
  add column if not exists verification_notes text,
  add column if not exists proof_url text,
  add column if not exists allocation_type text,
  add column if not exists allocation_notes text,
  add column if not exists fee_amount numeric default 0,
  add column if not exists tax_amount numeric default 0,
  add column if not exists net_amount numeric,
  add column if not exists accounting_reference text,
  add column if not exists approved_at timestamptz,
  add column if not exists approved_by uuid,
  add column if not exists cancelled_at timestamptz,
  add column if not exists cancellation_reason text,
  add column if not exists updated_at timestamptz default now();

create table if not exists public.booking_cancellations (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  transaction_id uuid references public.transactions(id) on delete set null,
  cancellation_reference text unique default ('CNL-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,8))),
  cancellation_date timestamptz not null default now(),
  requested_by uuid,
  approved_by uuid,
  cancellation_status text not null default 'pending',
  cancellation_reason text,
  cancellation_category text,
  fee_amount numeric not null default 0,
  refund_amount numeric not null default 0,
  refund_id uuid references public.refunds(id) on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.booking_cancellations enable row level security;
create index if not exists idx_booking_cancellations_booking_id on public.booking_cancellations(booking_id);
create index if not exists idx_booking_cancellations_status on public.booking_cancellations(cancellation_status);
create index if not exists idx_payments_transaction_id on public.payments(transaction_id);
create index if not exists idx_payments_status on public.payments(payment_status);
