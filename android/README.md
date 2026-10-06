# Transmind Rental Mobil — Android

Android client for the public Transmind booking experience.

Primary entry point:
https://transmindnusantararentalmobil.co.id/#booking

The first release reuses the existing production booking engine instead of duplicating booking logic in Android. Vehicle availability, validation, Supabase writes and customer flow therefore remain aligned with the website.

Security:
- HTTPS-only first-party navigation.
- JavaScript and DOM storage enabled because the existing booking experience requires them.
- File/content access disabled.
- Mixed content disabled.
- WhatsApp, tel, mailto and geo links are opened through Android intents.
- First-party Transmind pages stay inside the app.
- Public website source and booking engine are not modified by this Android layer.

Deep links:
- Transmind HTTPS URLs are accepted by the app.
- Verified Android App Links will be enabled after a production signing certificate fingerprint is available and assetlinks.json can be published.

Build:
- GitHub Actions builds a debug APK automatically.
- Release signing must use protected GitHub secrets; signing keys must never be committed.
