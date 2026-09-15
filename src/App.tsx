import { useEffect, useState } from 'react';
import PortalKaryawan from './components/karyawan/PortalKaryawan';
import DashboardAdmin from './components/admin/DashboardAdmin';
import RegistrasiKaryawan from './components/karyawan/RegistrasiKaryawan';
import './index.css';

export default function App() {
  const [view, setView] = useState<'home'|'employee'|'admin'|'register'>('home');
  useEffect(()=>{ const fn=()=>setView('register'); window.addEventListener('moonhr:register',fn); return ()=>window.removeEventListener('moonhr:register',fn); },[]);
  return <div className="app-root">
    {view !== 'admin' && <header className="public-nav"><div className="public-brand"><span>☾</span><b>MoonHR</b></div><nav><button onClick={()=>setView('home')}>Beranda</button><button onClick={()=>setView('employee')}>Portal Karyawan</button><button onClick={()=>setView('register')}>Daftar Karyawan</button><button onClick={()=>setView('admin')}>Dashboard HR</button></nav></header>}
    {view==='home' && <section className="hero"><div className="hero-card"><span className="eyebrow">PEOPLE & WORKFORCE PLATFORM</span><h1>Kelola karyawan lebih rapi, cepat, dan terukur.</h1><p>MoonHR menghubungkan absensi, data karyawan, payroll, dan laporan dalam satu dashboard modern.</p><div><button className="hero-primary" onClick={()=>setView('admin')}>Buka Dashboard HR →</button><button className="hero-secondary" onClick={()=>setView('employee')}>Portal Karyawan</button></div></div></section>}
    {view==='employee' && <div className="public-page"><PortalKaryawan/></div>}
    {view==='register' && <div className="public-page"><RegistrasiKaryawan onBack={()=>setView('employee')} /></div>}
    {view==='admin' && <DashboardAdmin/>}
  </div>
}
