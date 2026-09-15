import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import './portal.css';

type Employee = {
  id: string;
  id_karyawan: string;
  nama: string;
  email: string;
  jabatan?: string | null;
  departemen?: string | null;
  status_karyawan?: string | null;
  status_aktif?: boolean | null;
};

const PortalKaryawan: React.FC<{ onLogout?: () => void }> = ({ onLogout }) => {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadEmployee();
  }, []);

  const loadEmployee = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('karyawan')
        .select(
          'id,id_karyawan,nama,email,jabatan,departemen,status_karyawan,status_aktif'
        )
        .eq('auth_user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setEmployee(data);
      }
    } catch (error: any) {
      setMessage(error?.message || 'Gagal memuat data karyawan.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();

    if (onLogout) {
      onLogout();
    }

    window.location.reload();
  };

  if (loading) {
    return (
      <div className="portal-page">
        <div className="portal-loading">
          <div className="portal-spinner" />
          <p>Memuat portal karyawan...</p>
        </div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="portal-page">
        <div className="portal-empty">
          <h2>Data Karyawan Tidak Ditemukan</h2>
          <p>
            Akun Anda belum terhubung dengan data karyawan. Silakan hubungi
            HR/Admin.
          </p>
          <button onClick={handleLogout}>Keluar</button>
        </div>
      </div>
    );
  }

  const waiting =
    employee.status_aktif === false ||
    employee.status_karyawan === 'Menunggu Verifikasi';

  if (waiting) {
    return (
      <div className="portal-page">
        <div className="portal-empty">
          <div className="portal-logo">M</div>

          <h1>MoonHR</h1>

          <h2>Menunggu Verifikasi</h2>

          <p>
            Pendaftaran Anda berhasil diterima. Data Anda sedang diperiksa
            oleh HR/Admin.
          </p>

          <div className="portal-status">
            Status: <strong>Menunggu Verifikasi</strong>
          </div>

          <button onClick={handleLogout}>Keluar</button>
        </div>
      </div>
    );
  }

  return (
    <div className="portal-page">
      <header className="portal-header">
        <div className="portal-brand">
          <div className="portal-logo">M</div>
          <div>
            <strong>MoonHR</strong>
            <span>Employee Portal</span>
          </div>
        </div>

        <button className="portal-logout" onClick={handleLogout}>
          Keluar
        </button>
      </header>

      <main className="portal-container">
        <section className="portal-welcome">
          <div>
            <span className="portal-eyebrow">EMPLOYEE PORTAL</span>
            <h1>
              Halo, {employee.nama}
            </h1>
            <p>
              Selamat datang di portal karyawan MoonHR.
            </p>
          </div>

          <div className="portal-id-card">
            <span>ID Karyawan</span>
            <strong>{employee.id_karyawan}</strong>
          </div>
        </section>

        {message && (
          <div className="portal-alert">
            {message}
          </div>
        )}

        <section className="portal-grid">
          <div className="portal-card">
            <div className="portal-card-title">
              <span>Profil Saya</span>
            </div>

            <div className="portal-profile">
              <div className="portal-avatar">
                {employee.nama?.charAt(0)?.toUpperCase() || 'K'}
              </div>

              <div>
                <h3>{employee.nama}</h3>
                <p>{employee.jabatan || 'Karyawan'}</p>
              </div>
            </div>

            <div className="portal-details">
              <div>
                <span>Email</span>
                <strong>{employee.email || '-'}</strong>
              </div>

              <div>
                <span>ID Karyawan</span>
                <strong>{employee.id_karyawan || '-'}</strong>
              </div>

              <div>
                <span>Departemen</span>
                <strong>{employee.departemen || '-'}</strong>
              </div>

              <div>
                <span>Jabatan</span>
                <strong>{employee.jabatan || '-'}</strong>
              </div>
            </div>
          </div>

          <div className="portal-card">
            <div className="portal-card-title">
              <span>Status Kepegawaian</span>
            </div>

            <div className="portal-status-large">
              <span className="status-dot" />
              <div>
                <strong>{employee.status_karyawan || 'Aktif'}</strong>
                <p>Status akun Anda saat ini</p>
              </div>
            </div>

            <div className="portal-info">
              <p>
                Untuk perubahan data pribadi, jadwal, cuti, absensi, atau
                informasi payroll, silakan hubungi HR/Admin perusahaan.
              </p>
            </div>
          </div>
        </section>

        <section className="portal-card portal-notice">
          <div>
            <span className="portal-eyebrow">INFORMASI</span>
            <h2>Portal Karyawan MoonHR</h2>
            <p>
              Portal ini digunakan untuk mengakses informasi kepegawaian Anda
              secara terpusat.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
};

export default PortalKaryawan;
