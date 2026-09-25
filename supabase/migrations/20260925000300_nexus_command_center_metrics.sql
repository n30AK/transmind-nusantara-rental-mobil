-- TransMind Nexus command-center data contracts
-- Protected aggregate RPCs prevent RLS on raw analytics tables from rendering empty dashboards.
create or replace function public.nexus_seo_command_center(p_days integer default 7)
returns jsonb
language plpgsql
security definer
set search_path=public,pg_catalog
as $$
declare d integer:=greatest(1,least(coalesce(p_days,7),90)); s timestamptz:=now()-make_interval(days=>d); r jsonb;
begin
 if not exists(select 1 from public.user_profiles where id=auth.uid() and active=true and role in ('owner','admin','director','manager','sales','marketing')) then raise exception 'Forbidden'; end if;
 with ev as (select * from public.website_analytics_events where occurred_at>=s),
 stats as (
   select count(*) filter(where event_type='page_view') page_views,count(distinct visitor_session_id) unique_visitors,
   count(distinct visitor_session_id) filter(where occurred_at>=now()-interval '5 minutes') active_visitors_5m,
   count(distinct visitor_session_id) filter(where lower(coalesce(source,''))='organic') organic_visitors,
   count(*) filter(where event_type='whatsapp_click') whatsapp_clicks,count(*) filter(where event_type='booking_cta_click') booking_cta_clicks,
   count(*) filter(where event_type='booking_start') booking_starts,count(*) filter(where event_type in ('booking_success','booking_created')) booking_events from ev
 ), bk as (
   select count(*) filter(where lower(coalesce(status,'')) not in ('dibatalkan','cancelled','canceled','rejected')) bookings,
   coalesce(sum(total_price) filter(where lower(coalesce(status,'')) not in ('dibatalkan','cancelled','canceled','rejected')),0) revenue
   from public.bookings where created_at>=s
 ), pages as (select coalesce(path,'/') path,count(distinct visitor_session_id)::int visitors from ev where event_type='page_view' group by 1 order by 2 desc limit 12),
 sources as (select coalesce(nullif(source,''),'direct') source,count(distinct visitor_session_id)::int visitors from ev group by 1 order by 2 desc limit 10),
 geo as (select lower(coalesce(nullif(metadata->>'city',''),nullif(metadata->>'area',''),nullif(metadata->>'location',''),'')) geo,count(*)::int events from ev where coalesce(metadata->>'city',metadata->>'area',metadata->>'location','')<>'' group by 1 order by 2 desc limit 10),
 daily as (select jsonb_agg(jsonb_build_object('day',x.day_value,'visitors',x.visitors) order by x.day_value) data from (select occurred_at::date day_value,count(distinct visitor_session_id)::int visitors from ev group by 1 order by 1) x)
 select jsonb_build_object('days',d,'page_views',st.page_views,'unique_visitors',st.unique_visitors,'active_visitors_5m',st.active_visitors_5m,'organic_visitors',st.organic_visitors,'whatsapp_clicks',st.whatsapp_clicks,'booking_cta_clicks',st.booking_cta_clicks,'booking_starts',st.booking_starts,'booking_events',st.booking_events,'bookings',bk.bookings,'booking_revenue',bk.revenue,'target_bookings_per_day',50,'target_period_bookings',50*d,'booking_gap',greatest(0,50*d-bk.bookings),'cta_to_start_pct',case when st.booking_cta_clicks>0 then round(st.booking_starts*100.0/st.booking_cta_clicks,1) else 0 end,'start_to_booking_pct',case when st.booking_starts>0 then round(bk.bookings*100.0/st.booking_starts,1) else 0 end,'wa_to_booking_pct',case when st.whatsapp_clicks>0 then round(bk.bookings*100.0/st.whatsapp_clicks,1) else 0 end,'daily',coalesce(daily.data,'[]'::jsonb),'pages',coalesce((select jsonb_agg(to_jsonb(p) order by p.visitors desc) from pages p),'[]'::jsonb),'sources',coalesce((select jsonb_agg(to_jsonb(x) order by x.visitors desc) from sources x),'[]'::jsonb),'geo',coalesce((select jsonb_agg(to_jsonb(g) order by g.events desc) from geo g),'[]'::jsonb)) into r from stats st,bk,daily;
 return r;
end $$;
revoke all on function public.nexus_seo_command_center(integer) from public;
grant execute on function public.nexus_seo_command_center(integer) to authenticated;

create or replace function public.nexus_customer_care_dashboard(p_days integer default 1)
returns jsonb
language plpgsql
security definer
set search_path=public,pg_catalog
as $$
declare d integer:=greatest(1,least(coalesce(p_days,1),30)); s timestamptz:=now()-make_interval(days=>d); r jsonb;
begin
 if not exists(select 1 from public.user_profiles where id=auth.uid() and active=true and role in ('owner','admin','director','manager','sales','marketing')) then raise exception 'Forbidden'; end if;
 select jsonb_build_object('days',d,'cta',count(*) filter(where event_type='booking_cta_click'),'whatsapp',count(*) filter(where event_type='whatsapp_click'),'booking_start',count(*) filter(where event_type='booking_start'),'booking_success_events',count(*) filter(where event_type in ('booking_success','booking_created'))) into r from public.website_analytics_events where occurred_at>=s;
 r:=r||jsonb_build_object('bookings',(select count(*) from public.bookings where created_at>=s and lower(coalesce(status,'')) not in ('dibatalkan','cancelled','canceled','rejected')),'leads',(select count(distinct phone) from public.customer_care_leads where created_at>=s and consent_status='granted'),'open_tasks',(select count(*) from public.crm_tasks where status in ('open','OPEN','IN_PROGRESS') and created_at>=s and task_type='AI_CUSTOMER_CARE_FOLLOWUP'),'due_followups',(select count(*) from public.customer_care_followup_queue q join public.customer_care_leads l on l.id=q.lead_id where q.status='admin_ready' and l.status in ('open','lost') and q.scheduled_at<=now()),'queued_followups',(select count(*) from public.customer_care_followup_queue q join public.customer_care_leads l on l.id=q.lead_id where q.status='queued' and l.status in ('open','lost')),'target_bookings_per_day',50,'gap_to_50',greatest(0,50-(select count(*) from public.bookings where created_at>=s and lower(coalesce(status,'')) not in ('dibatalkan','cancelled','canceled','rejected'))),'due_items',coalesce((select jsonb_agg(jsonb_build_object('id',q.id,'name',l.name,'phone',l.phone,'stage',q.stage,'scheduled_at',q.scheduled_at,'message_body',q.message_body,'priority',case when l.human_required then 'high' else 'normal' end) order by q.scheduled_at) from public.customer_care_followup_queue q join public.customer_care_leads l on l.id=q.lead_id where q.status='admin_ready' and l.status in ('open','lost') and q.scheduled_at<=now() limit 30),'[]'::jsonb),'lead_items',coalesce((select jsonb_agg(jsonb_build_object('id',l.id,'name',l.name,'phone',l.phone,'intent',l.intent,'status',l.status,'next_followup_at',l.next_followup_at,'quote_value',l.quote_value,'human_required',l.human_required) order by l.last_activity_at desc) from public.customer_care_leads l where l.consent_status='granted' and l.status in ('open','lost','booked') limit 30),'[]'::jsonb));
 return r;
end $$;
revoke all on function public.nexus_customer_care_dashboard(integer) from public;
grant execute on function public.nexus_customer_care_dashboard(integer) to authenticated;