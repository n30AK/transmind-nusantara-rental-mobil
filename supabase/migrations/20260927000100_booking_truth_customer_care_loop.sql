-- TransMind Nexus: booking truth + AI customer-care closure
-- Transaction-domain booking creation is the authoritative conversion signal.
create or replace function public.nexus_on_booking_created()
returns trigger
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  v_existing integer;
  v_lead record;
begin
  select count(*) into v_existing
  from public.website_analytics_events
  where event_type='booking_success' and booking_id=new.id;

  if v_existing=0 then
    insert into public.website_analytics_events(
      event_type, visitor_session_id, occurred_at, path, source, medium,
      campaign, content, term, booking_id, booking_code, metadata
    ) values (
      'booking_success',
      coalesce(nullif(new.attribution_code,''),'booking:'||new.id::text),
      coalesce(new.created_at,now()),
      coalesce(new.landing_page,'/'),
      coalesce(new.attribution_source,''),
      coalesce(new.attribution_medium,''),
      coalesce(new.attribution_campaign,''),
      coalesce(new.attribution_content,''),
      coalesce(new.attribution_term,''),
      new.id,
      new.booking_code,
      jsonb_build_object(
        'source','booking_transaction_domain',
        'vehicle_id',new.vehicle_id,
        'service',new.service,
        'area',new.area,
        'total_days',new.total_days,
        'total_price',new.total_price,
        'booking_status',new.status
      )
    );
  end if;

  for v_lead in
    select id, customer_id
    from public.customer_care_leads
    where regexp_replace(phone,'[^0-9]','','g') =
          regexp_replace(coalesce(new.customer_phone,new.phone,''),'[^0-9]','','g')
      and status in ('open','paused')
      and consent_status='granted'
    order by created_at desc
  loop
    update public.customer_care_leads
       set status='booked',
           stage='booked',
           last_activity_at=coalesce(new.created_at,now()),
           next_followup_at=null,
           updated_at=now(),
           metadata=metadata || jsonb_build_object(
             'booking_id',new.id,
             'booking_code',new.booking_code,
             'closed_by','booking_transaction_domain'
           )
     where id=v_lead.id;

    update public.customer_care_followup_queue
       set status='cancelled',
           outcome='booking_completed',
           attempted_at=now()
     where lead_id=v_lead.id
       and status in ('queued','admin_ready');

    insert into public.customer_care_learning(
      lead_id, signal_type, signal_value, outcome
    ) values (
      v_lead.id,
      'booking_converted',
      jsonb_build_object(
        'booking_id',new.id,
        'booking_code',new.booking_code,
        'total_price',new.total_price,
        'vehicle_id',new.vehicle_id,
        'service',new.service
      ),
      'booked'
    );
  end loop;

  return new;
end;
$$;

drop trigger if exists trg_nexus_on_booking_created on public.bookings;
create trigger trg_nexus_on_booking_created
after insert on public.bookings
for each row execute function public.nexus_on_booking_created();

revoke all on function public.nexus_on_booking_created() from public;

-- Backfill only genuine bookings that were previously missing conversion telemetry.
insert into public.website_analytics_events(
  event_type, visitor_session_id, occurred_at, path, source, medium,
  campaign, content, term, booking_id, booking_code, metadata
)
select
  'booking_success',
  'booking:'||b.id::text,
  b.created_at,
  coalesce(b.landing_page,'/'),
  'booking_backfill',
  coalesce(b.attribution_medium,''),
  coalesce(b.attribution_campaign,''),
  coalesce(b.attribution_content,''),
  coalesce(b.attribution_term,''),
  b.id,
  b.booking_code,
  jsonb_build_object(
    'source','booking_backfill',
    'vehicle_id',b.vehicle_id,
    'service',b.service,
    'area',b.area,
    'total_days',b.total_days,
    'total_price',b.total_price,
    'booking_status',b.status
  )
from public.bookings b
where b.created_at>=now()-interval '30 days'
  and not exists(
    select 1 from public.website_analytics_events e
    where e.event_type='booking_success' and e.booking_id=b.id
  );
