# Transmind Nexus Dashboard

Standalone internal dashboard. It is intentionally isolated from the public rental website.

## Data
The dashboard reads the authenticated Supabase API through the Nexus-specific views created in migration 023.

## Security
Use only a Supabase publishable/anon key in the browser. Never place a service_role or secret key in this directory.

## Configuration
Create `nexus/config.js` from `config.example.js` in the deployment environment. The repository template does not contain credentials.
