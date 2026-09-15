# MoonHR — Production Setup

## 1. Database
Run these files in Supabase SQL Editor in this order:

1. `supabase/000_hris_final_setup.sql`
2. `supabase/001_production_security.sql`

The second migration enables Row Level Security (RLS), connects accounts to Supabase Auth by email, removes the legacy plaintext `pin`, creates the missing interview table, seeds roles/permissions, and restricts employee records to the logged-in employee or HR.

## 2. Create the first HR account
In Supabase Dashboard → Authentication → Users, create the HR user with a real email/password.

Then in SQL Editor run:

```sql
update public.hris_users
set role = 'Super Admin', status = 'Aktif'
where lower(email) = lower('YOUR-HR-EMAIL');
```

The Auth email must exactly match the email in `hris_users`.

## 3. Create employees
HR creates employee records from **Dashboard HR → Karyawan**. For a portal account, create the corresponding user under Supabase Authentication with the same email as the employee record.

Do NOT put passwords or PINs into `karyawan`.

## 4. Environment variables
Copy `.env.example` to `.env` and set:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

The browser must only use the Supabase publishable/anon key. Never put a `service_role` key in this project.

## 5. Netlify / Vercel
Set the same two environment variables in the hosting provider, then redeploy.

## 6. Important behavior
- HR Dashboard: only Auth users whose `hris_users.role` is HR/Admin can access it.
- Employee Portal: employee sees only their own employee record, attendance, leave, KPI/performance and paid payroll records allowed by RLS.
- Cuti, payroll, master data and system settings are write-protected for HR.
- Logout clears the Supabase Auth session.
- Password recovery uses Supabase Auth email recovery.
