# AI Customer Care + Price + CRM — 2026-09-24

## Capability
Asisten AI membaca price master aktif Transmind, mengenali kendaraan/l layanan/durasi, menghitung estimasi, menjelaskan persyaratan, membuat WhatsApp deep-link, dan bila nama + WhatsApp diberikan membuat CRM follow-up task.

## Price source of truth
- Booking RPC memakai `public.vehicle_prices` aktif.
- AI quote memakai sumber yang sama agar angka tidak berbeda dari alur booking.
- Formula dasar: harga harian × jumlah hari.
- Untuk layanan dengan pengemudi/pariwisata, BBM/tol/parkir atau biaya khusus tujuan dapat dihitung terpisah.
- Ketersediaan final tetap mengikuti pemeriksaan operasional.

## Verification information
Fungsi verifikasi customer yang ada meminta data identitas dan mengarahkan unggah KTP, SIM A, serta selfie. AI harus menyebutnya sebagai bagian dari alur verifikasi bila relevan, bukan mengklaim semua layanan memiliki persyaratan identik.

## Lead follow-up
Saat lead memberikan nama + WhatsApp:
1. customer dibuat/dicari melalui `get_or_create_customer`.
2. `crm_tasks` dibuat dengan pipeline `qualified_lead`.
3. follow-up berikutnya dijadwalkan 30 menit.
4. pesan dimasukkan ke `nexus_communications` dengan status `queued`.

## WhatsApp constraint
Outbound automation belum dianggap aktif hanya karena queue terbentuk. Pengiriman proaktif membutuhkan WhatsApp Business Platform/provider dan aturan template. Selama provider belum dikonfigurasi, sistem menggunakan queue + WhatsApp deep-link agar customer tetap dapat melanjutkan percakapan secara eksplisit.