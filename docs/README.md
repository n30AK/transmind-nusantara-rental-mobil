# TransMind Nusantara Rental Mobil — Project Documentation

Dokumentasi resmi proyek TransMind Nusantara Rental Mobil. Struktur ini memisahkan manajemen proyek, produk, arsitektur, engineering, testing, deployment, operasi, keamanan, SEO/growth, AI, keputusan, tugas, dan release.

## Aturan kerja
1. Production: `main` + GitHub Pages + domain resmi.
2. Development/staging: branch terpisah dan tidak boleh mengubah production secara langsung.
3. Perubahan production melalui pull request, pemeriksaan, dan persetujuan.
4. Setiap pekerjaan penting menghasilkan artifact dan dokumentasi.
5. Dokumen ini menjadi indeks awal; detail berada di subfolder masing-masing.

## Struktur
- `00-MANAGEMENT` — governance, scope, ownership
- `01-PRODUCT` — product vision, requirements, backlog
- `02-BUSINESS` — business context, customer journey, commercial rules
- `03-ARCHITECTURE` — system and integration architecture
- `04-FRONTEND` — UI/UX and Liquid Glass architecture
- `05-BACKEND` — application services and runtime logic
- `06-DATABASE` — Supabase/database contracts
- `07-INTEGRATION` — WhatsApp, analytics, APIs, external services
- `08-SEO-GROWTH` — SEO, demand generation, attribution
- `09-AI` — Asisten AI and AI-related flows
- `10-TESTING` — QA, regression, acceptance
- `11-DEPLOYMENT` — development/staging/production release controls
- `12-OPERATIONS` — runbooks and operational procedures
- `13-SECURITY` — security, secrets, access and incident procedures
- `14-CHANGELOG` — chronological changes
- `15-DECISIONS` — Architecture/Project Decision Records
- `16-TASKS` — controlled work queue
- `17-RELEASES` — release records
- `18-ARCHIVE` — superseded documentation


## Struktur kerja profesional

Dokumentasi dikelompokkan berdasarkan lifecycle proyek agar mudah diaudit dan diteruskan oleh tim lain:

- **00-MANAGEMENT** — governance, roles, charter, approval gate
- **01-PRODUCT** — vision, scope, requirements, backlog
- **02-BUSINESS** — customer journey dan aturan bisnis
- **03-ARCHITECTURE** — arsitektur sistem dan boundary integrasi
- **04-FRONTEND** — UI/UX, Liquid Glass, responsive dan component contract
- **05-BACKEND** — runtime, API dan service logic
- **06-DATABASE** — Supabase, schema, RLS dan migration
- **07-INTEGRATION** — WhatsApp, analytics dan external services
- **08-SEO-GROWTH** — SEO, demand generation dan attribution
- **09-AI** — Asisten AI dan travel intelligence
- **10-TESTING** — QA, smoke, regression dan release acceptance
- **11-DEPLOYMENT** — staging/production release control
- **12-OPERATIONS** — runbook dan incident procedure
- **13-SECURITY** — security/access/secret procedures
- **14-CHANGELOG** — perubahan kronologis
- **15-DECISIONS** — ADR/Project Decision Records
- **16-TASKS** — work queue terkontrol
- **17-RELEASES** — release evidence
- **18-ARCHIVE** — dokumentasi superseded

### Aturan penamaan dokumen
Gunakan nama yang jelas, stabil, dan dapat dicari. Dokumen keputusan memakai `ADR-NNNN`; task memakai `TASK-...`; release baseline memakai tanggal ISO `YYYY-MM-DD`.

### Status repository
Production tetap berada di `main`. Struktur dokumentasi ini dibangun di branch `docs/transmind-project-structure-20260924` dan belum mengubah production.
