-- TransMind Nexus production access + customer care API grants
revoke execute on function public.nexus_my_access() from anon;
grant execute on function public.nexus_my_access() to authenticated;

grant select, insert, update on table public.customer_care_leads to authenticated;
grant select, insert, update on table public.customer_care_followup_queue to authenticated;
grant select, insert, update on table public.customer_care_learning to authenticated;
grant usage on schema public to authenticated;

-- Scheduler remains server-side; browsers do not need this function.
revoke execute on function public.process_customer_care_followups() from anon, authenticated;
