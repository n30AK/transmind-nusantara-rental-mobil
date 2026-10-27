# 11 — Deployment

## Environments
- Development — pekerjaan dan eksperimen
- Staging — validasi release candidate
- Production — `main` + GitHub Pages + domain resmi

## Rules
Jangan mengubah publishing source GitHub Pages untuk menjadikan staging sebagai production. Release dilakukan melalui branch/PR dan acceptance gate.
