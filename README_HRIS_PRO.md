# MoonHR HRIS PRO

Ini adalah upgrade lanjutan dari MoonHR HRIS Complete.

## Yang ditambahkan
- Edit karyawan melalui drawer profesional.
- CRUD master karyawan tetap kompatibel dengan tabel lama.
- Export CSV.
- Service layer `src/lib/hris.ts`.
- Struktur database untuk:
  - Departemen
  - Shift
  - Jadwal
  - Hari Libur
  - Cuti
  - Saldo Cuti
  - KPI
  - Kandidat/Recruitment
  - Payroll
  - Audit Log
  - Company Settings
- RLS untuk tabel baru.

## Upload GitHub
Upload isi folder `moon-absensi-main` ke root repository.
Jangan membuat `components-admin`.

## Supabase
Jalankan SQL secara berurutan:
1. SQL lama/upgrade yang sudah digunakan sebelumnya jika diperlukan.
2. `supabase/002_hris_pro.sql`

Jangan menjalankan SQL yang membuat foreign key `payroll.karyawan_id BIGINT` jika tipe `karyawan.id` belum diverifikasi.

## Jalankan
npm install
npm run dev

## Production
Autentikasi produksi menggunakan Supabase Auth. Jalankan `supabase/001_production_security.sql` dan ikuti `README_PRODUCTION.md`; PIN plaintext/akun demo tidak digunakan.
