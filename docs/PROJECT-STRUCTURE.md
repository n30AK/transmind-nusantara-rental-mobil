# TransMind Nusantara Rental Mobil — Struktur Proyek Profesional

## Prinsip
TASK → WORK → ARTIFACT → DOCUMENTATION → VERSION → STATUS.

## Struktur resmi
docs/
├── 00-MANAGEMENT/        # governance, charter, scope, roles
├── 01-PRODUCT/           # product scope, requirements, backlog
├── 02-BUSINESS/          # customer journey, business rules
├── 03-ARCHITECTURE/      # system architecture, data flow
├── 04-FRONTEND/          # UI/UX, Liquid Glass, responsive
├── 05-BACKEND/           # application logic, API contracts
├── 06-DATABASE/          # Supabase schema, RPC, policies
├── 07-INTEGRATION/       # WhatsApp, analytics, external services
├── 08-SEO-GROWTH/        # SEO, demand, attribution, omnichannel
├── 09-AI/                # Asisten AI, prompts, AI flow
├── 10-TESTING/           # QA, regression, acceptance
├── 11-DEPLOYMENT/        # development/staging/production
├── 12-OPERATIONS/        # runbooks, monitoring, incidents
├── 13-SECURITY/          # access, secrets, security controls
├── 14-CHANGELOG/         # chronological change history
├── 15-DECISIONS/         # ADR / decision records
├── 16-TASKS/             # task board and work evidence
├── 17-RELEASES/          # release evidence
└── 18-ARCHIVE/           # superseded documents

## Environment control
- Development: eksperimen dan development.
- Staging: release candidate dan QA.
- Production: main + GitHub Pages + domain resmi.

## Production safety
Struktur dokumentasi ini tidak mengubah runtime application. Penambahan dilakukan pada branch dokumentasi agar production tetap aman.
