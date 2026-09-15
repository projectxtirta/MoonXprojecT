# MoonHR Functional Upgrade

Perbaikan utama:
- Semua menu utama Admin sekarang membuka branch/modul nyata, bukan kartu placeholder.
- Pengajuan cuti, hari libur, payroll, komponen payroll, KPI, performance, lowongan, kandidat, role, dan pengaturan terhubung ke tabel Supabase yang disediakan.
- Tombol Simpan pada modul-modul tersebut melakukan INSERT/UPDATE ke database dan menampilkan error database jika gagal.
- Payroll memiliki Generate Payroll dan Proses Payroll.
- Hari Libur memiliki tambah/hapus.
- Cuti memiliki tambah, approval, dan penolakan.
- Pengaturan perusahaan membaca dan menyimpan `hris_company_settings`.
- Ditambahkan tabel `hris_cabang` ke SQL setup karena UI Master Data sebelumnya memakainya tetapi schema SQL belum membuatnya.

## Penting
Jalankan `supabase/000_hris_final_setup.sql` di Supabase SQL Editor setelah backup database. Jika project sudah menjalankan versi lama, script menggunakan `IF NOT EXISTS` untuk tabel/kolom baru.

Login demo: `admin` / `admin123`.
