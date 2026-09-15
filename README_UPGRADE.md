# MoonHR Admin Upgrade

Versi ini mempertahankan PortalKaryawan lama tetapi mengganti halaman Admin menjadi dashboard HR modern dengan pola navigasi sidebar/topbar seperti aplikasi HRIS SaaS (bukan menyalin UI proprietary Talenta).

## Yang ditambahkan
- Overview dashboard + KPI.
- Sidebar: Overview, Karyawan, Absensi, Payroll, Laporan, Pengaturan.
- Global search untuk karyawan/absensi.
- Tabel karyawan responsif + hapus + export CSV.
- Monitoring absensi + selfie + status + lokasi + export CSV.
- Ringkasan payroll dari gaji_pokok.
- Halaman laporan dan export CSV.
- Halaman pengaturan yang menandai pekerjaan keamanan yang masih harus dilakukan.
- SQL awal untuk tabel payroll, audit_logs, role/status_aktif dan index.

## Cara mengganti
1. Backup project lama.
2. Salin isi folder `src/` dari paket ini ke project lama, terutama `App.tsx`, `index.css`, dan folder `components/admin/`.
3. Jangan mengganti `PortalKaryawan.tsx` jika tidak ingin mengubah portal karyawan.
4. Salin folder `supabase/` dan jalankan SQL setelah mem-backup database.
5. `npm install` lalu `npm run build`.

## Catatan keamanan
Login `admin/admin123` sengaja dipertahankan sebagai fallback kompatibilitas dengan project lama. Jangan gunakan kredensial itu di production. Migrasikan admin ke Supabase Auth, hapus PIN plaintext dari tabel karyawan, dan aktifkan RLS/policy berdasarkan role.
