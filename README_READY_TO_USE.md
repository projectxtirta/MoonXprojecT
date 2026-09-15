# MoonHR — HRIS Operational Release

Versi ini memfokuskan aplikasi pada fungsi nyata, bukan kartu/demo kosong.

## Modul yang aktif
- Dashboard/Overview
- Master Karyawan: tambah, edit, hapus, pencarian, export
- Organisasi: Cabang, Departemen, Jabatan
- Shift dan Jadwal Kerja
- Absensi: rekap, hari ini, terlambat, izin/sakit, lembur, selfie, input manual, hapus, export
- Hari Libur: tambah dan hapus
- Cuti: pengajuan, approval, penolakan, riwayat, saldo cuti
- Payroll: generate per periode, proses, tandai dibayar, komponen gaji, lembur, slip
- Talent: performance, KPI, lowongan, kandidat, interview
- Laporan: karyawan, absensi, payroll
- Pengaturan perusahaan
- Role & Permission
- Audit Log

## Setup database
1. Buka Supabase SQL Editor.
2. Jalankan `supabase/000_hris_final_setup.sql` sampai selesai.
3. Pastikan tabel lama `karyawan` dan `absensi` sudah tersedia karena aplikasi mempertahankan tabel tersebut.
4. Refresh aplikasi.

## Catatan penting sebelum dipakai sebagai sistem perusahaan
Aplikasi ini sudah jauh lebih fungsional, tetapi deployment produksi tetap membutuhkan konfigurasi keamanan Supabase (RLS + authentication) sebelum dibuka ke publik. Jangan mengandalkan PIN demo untuk sistem payroll perusahaan tanpa konfigurasi authentication dan policy database.

## Production security
Use `README_PRODUCTION.md` and run `supabase/001_production_security.sql` after the base schema. The old PIN login/registration is intentionally removed; authentication is now handled by Supabase Auth and database access by RLS.
