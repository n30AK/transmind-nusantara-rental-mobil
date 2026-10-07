# Transmind Partner Android

Dedicated Android mini-office for Transmind rental partners.

## Purpose
This is NOT the customer rental website wrapper. It is the partner operational app.

Initial scope:
- Partner login through Supabase Auth
- Partner identity mapped by `partner_members`
- Partner dashboard
- Booking queue
- Accept / reject / acknowledge / start / complete / cancel booking actions
- Partner vehicle supply visibility
- Partner vehicle availability and rate management foundation
- Server-side RLS and governed booking action RPC

Backend migration:
`partner_android_identity_and_operations_v1`

The public customer Android wrapper under `android/` remains separate.
