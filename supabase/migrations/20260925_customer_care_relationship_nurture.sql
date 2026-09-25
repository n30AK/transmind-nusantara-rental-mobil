-- Extend customer care into consented long-term relationship nurture.
create or replace function public.schedule_customer_care_relationship(p_lead_id uuid)
returns integer
language plpgsql
security invoker
set search_path = public, pg_catalog
as $$
declare n integer := 0;
declare l record;
begin
  select * into l from public.customer_care_leads where id=p_lead_id and status='lost' and consent_status='granted';
  if not found then return 0; end if;
  insert into public.customer_care_followup_queue(lead_id,stage,scheduled_at,channel,message_body,status,requires_human,metadata)
  values
   (l.id,'relationship_7d',now()+interval '7 days','whatsapp','Halo '||split_part(l.name,' ',1)||', semoga kabarnya baik. Saya dari Transmind. Waktu itu rencana rental Anda belum jadi—tidak apa-apa. Kalau kebutuhan perjalanan muncul lagi, kami siap membantu.','queued',false,jsonb_build_object('mode','relationship','reason','lost_lead','consent_status','granted')),
   (l.id,'relationship_30d',now()+interval '30 days','whatsapp','Selamat pagi '||split_part(l.name,' ',1)||'. Semoga aktivitasnya lancar. Saya menyapa dari Transmind. Kalau ada rencana perjalanan atau kebutuhan kendaraan dalam waktu dekat, kabari kami ya.','queued',false,jsonb_build_object('mode','relationship','reason','lost_lead','consent_status','granted')),
   (l.id,'relationship_60d',now()+interval '60 days','whatsapp','Halo '||split_part(l.name,' ',1)||', semoga semuanya baik. Transmind tetap siap membantu kapan pun Anda membutuhkan kendaraan. Tidak perlu membalas kalau belum ada kebutuhan.','queued',false,jsonb_build_object('mode','relationship','reason','lost_lead','consent_status','granted')),
   (l.id,'relationship_90d',now()+interval '90 days','whatsapp','Selamat pagi '||split_part(l.name,' ',1)||'. Semoga hari Anda lancar. Saya hanya ingin menyapa dari Transmind. Jika suatu saat membutuhkan rental mobil, kami siap membantu.','queued',false,jsonb_build_object('mode','relationship','reason','lost_lead','consent_status','granted'))
  on conflict (lead_id,stage) do nothing;
  get diagnostics n = row_count;
  return n;
end;
$$;

create or replace function public.process_customer_care_followups()
returns integer
language plpgsql
security invoker
set search_path = public, pg_catalog
as $$
declare n integer := 0;
begin
  with due as (
    select q.id,q.lead_id,q.stage
    from public.customer_care_followup_queue q
    join public.customer_care_leads l on l.id=q.lead_id
    where q.status='queued' and q.scheduled_at <= now()
      and (l.status='open' or (l.status='lost' and q.metadata->>'mode'='relationship' and l.consent_status='granted'))
    order by q.scheduled_at
    for update of q skip locked
    limit 25
  ), marked as (
    update public.customer_care_followup_queue q
    set status='admin_ready', attempted_at=now(),
        outcome=case when q.metadata->>'mode'='relationship' then 'relationship_followup_ready_for_admin_or_provider' else 'due_followup_requires_provider_or_admin_send' end
    from due where q.id=due.id
    returning q.id,q.lead_id,q.stage
  )
  insert into public.crm_tasks(customer_id,task_type,priority,status,title,notes,pipeline_stage,next_followup_at,quote_value,metadata)
  select l.customer_id,'AI_CUSTOMER_CARE_FOLLOWUP',case when l.human_required then 'high' else 'normal' end,'open',
    case when m.stage like 'relationship_%' then 'Relationship care · '||l.name else 'Peluang follow-up AI Customer Service · '||l.name end,
    case when m.stage like 'relationship_%' then 'Calon pelanggan sebelumnya belum jadi booking. Ada sapaan relationship care yang siap dikirim. AI menggunakan konteks yang tersimpan dengan izin pelanggan dan tidak memaksa booking.'
      else 'Calon pelanggan perlu ditindaklanjuti. Tahap: '||m.stage||'. Buka AI Customer Service untuk konteks dan pesan siap kirim.' end,
    case when m.stage like 'relationship_%' then 'customer_care' else 'qualified_lead' end,now(),l.quote_value,
    jsonb_build_object('lead_id',l.id,'followup_stage',m.stage,'phone',l.phone,'requires_human',l.human_required,'mode',case when m.stage like 'relationship_%' then 'relationship' else 'conversion' end,'source','customer_care_scheduler')
  from marked m join public.customer_care_leads l on l.id=m.lead_id
  where not exists (select 1 from public.crm_tasks t where t.task_type='AI_CUSTOMER_CARE_FOLLOWUP' and t.status='open' and t.metadata->>'lead_id'=l.id::text and t.metadata->>'followup_stage'=m.stage);
  get diagnostics n = row_count;
  return n;
end;
$$;
