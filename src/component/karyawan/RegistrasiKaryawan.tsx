import { useState } from 'react';
import { supabase } from '../../supabaseClient';
import './registration.css';

type Props = { onBack?: () => void };

export default function RegistrasiKaryawan({ onBack }: Props) {
  const [form, setForm] = useState({ nama:'', email:'', no_telp:'', alamat_rumah:'', tanggal_lahir:'', password:'', konfirmasi:'' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  function change(key: keyof typeof form, value: string) { setForm(v => ({ ...v, [key]: value })); }

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setError(''); setSuccess('');
    if (form.password.length < 8) return setError('Password minimal 8 karakter.');
    if (form.password !== form.konfirmasi) return setError('Konfirmasi password tidak sama.');
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: form.email.trim().toLowerCase(),
      password: form.password,
      options: { data: { nama: form.nama.trim(), no_telp: form.no_telp.trim(), alamat_rumah: form.alamat_rumah.trim(), tanggal_lahir: form.tanggal_lahir || null } }
    });
    setLoading(false);
    if (error) return setError(error.message);
    setSuccess('Pendaftaran berhasil. Data Anda masuk sebagai Menunggu Verifikasi. HR/Admin akan memeriksa dan mengaktifkan akun Anda.');
    setForm({ nama:'', email:'', no_telp:'', alamat_rumah:'', tanggal_lahir:'', password:'', konfirmasi:'' });
  }

  return <div className="registration-page">
    <div className="registration-card">
      <div className="registration-brand"><span className="registration-logo">M</span><div><strong>MoonHR</strong><small>Employee Registration</small></div></div>
      <div className="registration-copy"><span>EMPLOYEE SELF REGISTRATION</span><h1>Buat akun karyawan</h1><p>Isi data diri Anda. Akun akan aktif setelah diverifikasi oleh HR/Admin.</p></div>
      <form onSubmit={submit} className="registration-form">
        <div className="registration-grid">
          <label>Nama lengkap<input value={form.nama} onChange={e=>change('nama',e.target.value)} placeholder="Nama lengkap" required /></label>
          <label>Email<input type="email" value={form.email} onChange={e=>change('email',e.target.value)} placeholder="nama@perusahaan.com" required /></label>
          <label>No. HP<input value={form.no_telp} onChange={e=>change('no_telp',e.target.value)} placeholder="08xxxxxxxxxx" required /></label>
          <label>Tanggal lahir<input type="date" value={form.tanggal_lahir} onChange={e=>change('tanggal_lahir',e.target.value)} /></label>
          <label className="full">Alamat<input value={form.alamat_rumah} onChange={e=>change('alamat_rumah',e.target.value)} placeholder="Alamat lengkap" /></label>
          <label>Password<input type="password" minLength={8} value={form.password} onChange={e=>change('password',e.target.value)} placeholder="Minimal 8 karakter" required /></label>
          <label>Konfirmasi password<input type="password" minLength={8} value={form.konfirmasi} onChange={e=>change('konfirmasi',e.target.value)} placeholder="Ulangi password" required /></label>
        </div>
        {error && <div className="registration-error">{error}</div>}
        {success && <div className="registration-success">✓ {success}</div>}
        <div className="registration-actions"><button type="button" className="registration-secondary" onClick={onBack}>Kembali ke Login</button><button className="registration-primary" disabled={loading}>{loading?'Mendaftarkan…':'Daftar sebagai Karyawan'}</button></div>
      </form>
      <p className="registration-note">Role otomatis <b>Karyawan</b>. Pengguna tidak dapat memilih Admin, HRD, Payroll, Supervisor, atau Super Admin.</p>
    </div>
  </div>;
}
