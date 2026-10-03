create or replace function nexus_private.nexus_runtime_health()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  r jsonb;
begin
  if not exists (
    select 1
    from public.user_profiles
    where id = (select auth.uid())
      and active = true
      and role in ('owner','admin','director','manager','sales','marketing')
  ) then
    raise exception 'Forbidden';
  end if;

  select jsonb_build_object(
    'runtime',
      coalesce((
        select jsonb_build_object(
          'run_id', rr.run_id,
          'status', rr.status,
          'trigger', rr.trigger,
          'started_at', rr.started_at,
          'finished_at', rr.finished_at,
          'duration_ms', rr.duration_ms,
          'summary', rr.summary
        )
        from public.nexus_runtime_runs rr
        order by rr.started_at desc
        limit 1
      ), jsonb_build_object('status','UNKNOWN')),
    'measurements',
      coalesce((
        select jsonb_object_agg(
          m.metric,
          jsonb_build_object(
            'source',m.source,
            'value_numeric',m.value_numeric,
            'value_text',m.value_text,
            'state',m.state,
            'observed_at',m.observed_at,
            'metadata',m.metadata
          )
        )
        from (
          select distinct on (nm.source,nm.metric)
            nm.source,nm.metric,nm.value_numeric,nm.value_text,nm.state,nm.observed_at,nm.metadata
          from public.nexus_measurements nm
          order by nm.source,nm.metric,nm.observed_at desc
        ) m
      ), '{}'::jsonb)
  ) into r;

  return r;
end
$$;

revoke all on function nexus_private.nexus_runtime_health() from public;
grant usage on schema nexus_private to authenticated;
grant execute on function nexus_private.nexus_runtime_health() to authenticated;

create or replace function public.nexus_runtime_health()
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  select nexus_private.nexus_runtime_health()
$$;

revoke all on function public.nexus_runtime_health() from public;
grant execute on function public.nexus_runtime_health() to authenticated;
