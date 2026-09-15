# MoonHR — Final HRIS Upgrade

Versi final ini menggabungkan project `moon-absensi-main` dengan dashboard HR baru bergaya HRIS SaaS modern.

## Yang sudah digabung
- Dashboard HR profesional dengan sidebar, Overview, Karyawan, Absensi, Payroll, Laporan, Pengaturan.
- KPI: total karyawan, hadir hari ini, belum absen, dan estimasi payroll.
- Pencarian global.
- Monitoring absensi dan selfie.
- Export CSV karyawan dan absensi.
- Modul payroll dasar yang membaca gaji pokok dari data karyawan.
- Portal Karyawan lama tetap dipertahankan.
- Supabase client lama tetap dipertahankan.
- SQL upgrade yang tidak mengubah tipe kolom lama `karyawan`/`absensi`.

## Struktur penting
- `src/components/admin/DashboardAdmin.tsx` — dashboard HR.
- `src/components/admin/admin.css` — styling dashboard.
- `src/components/karyawan/PortalKaryawan.tsx` — portal karyawan lama, tidak dihapus.
- `src/supabaseClient.ts` — koneksi Supabase lama.
- `supabase/001_hris_upgrade.sql` — migration database.

## Cara pasang
1. Backup project GitHub lama.
2. Extract ZIP ini.
3. Upload seluruh isi folder project ke repository GitHub.
4. Di Supabase → SQL Editor, jalankan `supabase/001_hris_upgrade.sql`.
5. Jalankan `npm install`.
6. Jalankan `npm run dev` untuk lokal atau `npm run build` untuk production.

## Catatan login admin
Untuk kompatibilitas dengan project lama, dashboard masih mempertahankan login demo `admin` / `admin123` dan fallback email + PIN dari tabel `karyawan`.

**Jangan gunakan kredensial demo tersebut untuk production.** Migrasikan login admin ke Supabase Auth dan terapkan Row Level Security (RLS) sebelum aplikasi digunakan secara nyata.

## Catatan database
Migration final sengaja memakai `id_karyawan text` pada tabel payroll, bukan foreign key langsung ke `karyawan.id`, karena tipe asli primary key `karyawan.id` tidak boleh diasumsikan dari kode frontend saja. Ini mencegah migration gagal karena mismatch tipe.
