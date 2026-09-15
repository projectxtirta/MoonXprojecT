# MoonHR HRIS — FINAL SETUP

## GitHub / Netlify
Replace the project files in your GitHub repository with this project, then push/commit. Netlify should redeploy automatically.

## Supabase
1. Open Supabase → SQL Editor.
2. Open `supabase/000_hris_final_setup.sql` from this project.
3. Copy the entire SQL and click Run.
4. Refresh the Netlify site after the SQL finishes.

The migration is designed to be idempotent and does not change the existing `karyawan.id` or `absensi` column types. It adds the HRIS fields/tables needed by the admin modules.

## Admin menu
The admin dashboard uses expandable branch groups. Click the main group to open its submenu, then click a submenu item to load the module.
