import { useState, useEffect } from 'react';
import Home from './pages/Home/Home';
import RegistrasiKaryawan from './components/karyawan/RegistrasiKaryawan';
import DashboardAdmin from './components/admin/DashboardAdmin';
import './index.css'; // Pastikan CSS utama/Tailwind tetap termuat

type View = 'home' | 'admin' | 'register';

export default function App() {
  const [view, setView] = useState<View>('home');

  useEffect(() => {
    const handleRegister = () => setView('register');

    window.addEventListener('moonhr:register', handleRegister);

    return () => {
      window.removeEventListener('moonhr:register', handleRegister);
    };
  }, []);

  return (
    <div className="app-root">

      {view !== 'admin' && (
        <header className="public-nav">
          <button
            className="public-brand"
            onClick={() => setView('home')}
            aria-label="MoonXprojecT Beranda"
          >
            <span className="brand-orbit">
              <span>☾</span>
            </span>

            <span>
              <b>MoonXprojecT</b>
              {/* Teks "Human Resources Platform" sudah dihapus di sini */}
            </span>
          </button>

          <nav>
            <button
              className={view === 'home' ? 'active' : ''}
              onClick={() => setView('home')}
            >
              Beranda
            </button>

            <button 
              className={view === 'register' ? 'active' : ''}
              onClick={() => setView('register')}
            >
              Daftar Karyawan
            </button>

            <button
              className="nav-login"
              onClick={() => setView('admin')}
            >
              Login HR
              <span>→</span>
            </button>
          </nav>
        </header>
      )}

      {view === 'home' && (
        <Home
          onAdminLogin={() => setView('admin')}
          onRegister={() => setView('register')}
        />
      )}

      {view === 'register' && (
        <div className="public-page">
          <RegistrasiKaryawan
            onBack={() => setView('home')}
          />
        </div>
      )}

      {view === 'admin' && (
        <DashboardAdmin />
      )}

    </div>
  );
}
