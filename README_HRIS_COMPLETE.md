# MoonHR HRIS Complete

Versi lengkap dashboard admin MoonHR dengan struktur HRIS bercabang dan expandable.

## Menu
- Overview
- People: Karyawan, Tambah Karyawan, Organisasi
- Attendance: Rekap, Hari Ini, Keterlambatan, Izin/Sakit, Lembur, Monitoring Selfie
- Schedule: Jadwal, Shift, Hari Libur
- Leave: Pengajuan, Saldo
- Payroll: Payroll Bulanan, Komponen, Lembur, Slip Gaji
- Talent: Performance, KPI, Recruitment, Kandidat
- Reporting: Laporan & Export
- System: Pengaturan, Role & Permission, Audit Log

## Upload ke GitHub
Upload seluruh ISI folder `moon-absensi-main` ke root repository.
Jangan membuat `components-admin`.
Struktur harus:
`src/components/admin/`
`src/components/karyawan/`
`src/components/common/`

## Menjalankan
```bash
npm install
npm run dev
```

## Supabase
Jalankan:
`supabase/001_hris_upgrade.sql`

Catatan:
- Login demo lama: `admin` / `admin123`.
- Untuk production, migrasikan login ke Supabase Auth + Row Level Security.
- Beberapa menu HRIS (cuti, performance, recruitment, role) sudah memiliki UI dan navigasi; tabel transaksi Supabase dapat ditambahkan bertahap tanpa mengubah sidebar.
