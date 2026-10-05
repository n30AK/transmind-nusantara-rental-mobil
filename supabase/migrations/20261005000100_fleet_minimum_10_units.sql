-- TransMind Nexus fleet inventory: minimum 10 physical units per vehicle type
-- Safe/idempotent migration. It does not invent license plates.
begin;

alter table if exists public.vehicles
  add column if not exists total_units integer not null default 10;

update public.vehicles
set total_units = greatest(coalesce(total_units, 0), 10)
where total_units is null or total_units < 10;

do $$
begin
  if to_regclass('public.vehicles') is not null then
    if not exists (
      select 1 from pg_constraint
      where conrelid = 'public.vehicles'::regclass
        and conname = 'vehicles_total_units_min_10'
    ) then
      alter table public.vehicles
        add constraint vehicles_total_units_min_10 check (total_units >= 10);
    end if;
  end if;
end $$;

create or replace function public.sync_vehicle_unit_inventory()
returns trigger
language plpgsql
as $$
declare
  existing_count integer;
  target_count integer;
  n integer;
  base_code text;
begin
  if to_regclass('public.vehicle_units') is null then
    return new;
  end if;

  target_count := greatest(coalesce(new.total_units, 10), 10);
  select count(*) into existing_count
  from public.vehicle_units
  where vehicle_id = new.id;

  base_code := lower(regexp_replace(coalesce(nullif(new.slug,''), new.name, 'vehicle'), '[^a-zA-Z0-9]+', '-', 'g'));
  base_code := trim(both '-' from base_code);

  if existing_count < target_count then
    for n in (existing_count + 1)..target_count loop
      insert into public.vehicle_units (vehicle_id, unit_code, status, notes)
      select new.id,
             upper(base_code || '-' || lpad(n::text, 3, '0')),
             'AVAILABLE',
             'Auto-provisioned by fleet inventory baseline'
      where not exists (
        select 1 from public.vehicle_units u
        where u.vehicle_id = new.id
          and u.unit_code = upper(base_code || '-' || lpad(n::text, 3, '0'))
      );
    end loop;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_sync_vehicle_unit_inventory on public.vehicles;
create trigger trg_sync_vehicle_unit_inventory
after insert or update of total_units, slug, name
on public.vehicles
for each row
execute function public.sync_vehicle_unit_inventory();

-- Backfill physical unit records for every existing vehicle type.
insert into public.vehicle_units (vehicle_id, unit_code, status, notes)
select
  v.id,
  upper(trim(both '-' from lower(regexp_replace(coalesce(nullif(v.slug,''), v.name, 'vehicle'), '[^a-zA-Z0-9]+', '-', 'g')))
    || '-' || lpad(gs.n::text, 3, '0')),
  'AVAILABLE',
  'Auto-provisioned by fleet inventory baseline'
from public.vehicles v
cross join lateral generate_series(
  (select count(*)::integer from public.vehicle_units u where u.vehicle_id = v.id) + 1,
  greatest(coalesce(v.total_units, 10), 10)
) gs(n)
where not exists (
  select 1
  from public.vehicle_units u
  where u.vehicle_id = v.id
    and u.unit_code = upper(trim(both '-' from lower(regexp_replace(coalesce(nullif(v.slug,''), v.name, 'vehicle'), '[^a-zA-Z0-9]+', '-', 'g')))
      || '-' || lpad(gs.n::text, 3, '0'))
);

create index if not exists idx_vehicle_units_vehicle_status
  on public.vehicle_units(vehicle_id, status);

commit;
