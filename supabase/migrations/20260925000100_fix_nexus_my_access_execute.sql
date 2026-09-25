-- TransMind Nexus RBAC repair
-- Keep authorization server-side. This migration only restores EXECUTE on the
-- existing access function; it does not grant dashboard access by itself.

revoke execute on function public.nexus_my_access() from anon;
grant execute on function public.nexus_my_access() to authenticated;

-- The legacy role lookup is intentionally not used by the Nexus browser boot
-- path anymore. Do not grant it broadly or create a bypass function here.
