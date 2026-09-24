# Project Charter

## Project
TransMind Nusantara Rental Mobil

## Tujuan
Membangun platform rental mobil dan mobility service yang premium, mudah digunakan, terukur, terintegrasi dengan booking, WhatsApp, AI, analytics, SEO, dan Nexus.

## Prinsip utama
- Production aman dan terkendali.
- Staging digunakan untuk validasi.
- Core business functionality tidak boleh rusak akibat perubahan visual.
- Infrastruktur diprioritaskan pada layanan yang sudah tersedia dan biaya awal Rp0.
- Setiap perubahan besar terdokumentasi.

## Baseline arsitektur saat ini
- Repository: `n30AK/transmind-nusantara-rental-mobil`
- Production branch: `main`
- Hosting: GitHub Pages
- Domain: `transmindnusantararentalmobil.co.id`
- Visual direction: Apex Drive-inspired Liquid Glass
- Vercel: tidak digunakan
- Cloudflare: tidak menjadi dependency inti

## Acceptance gate
Perubahan production hanya dilakukan setelah build/QA/release checks dan persetujuan eksplisit pemilik proyek.
