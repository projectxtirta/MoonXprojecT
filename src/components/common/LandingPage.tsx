interface LandingPageProps {
  onMulai: () => void;
  namaPerusahaan: string;
}

export default function LandingPage({ onMulai, namaPerusahaan }: LandingPageProps) {
  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
      <div style={{ maxWidth: '800px', textAlign: 'center', background: '#fff', padding: '50px 30px', borderRadius: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
        <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '6px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: 'bold' }}>Platform HRIS Enterprise Berstandar Tinggi</span>
        <h1 style={{ fontSize: '36px', color: '#0f172a', marginTop: '20px', fontWeight: '900' }}>Sistem Manajemen {namaPerusahaan}</h1>
        <p style={{ color: '#64748b', fontSize: '15px', lineHeight: '1.6', margin: '20px 0 30px 0' }}>Solusi enterprise mutakhir dengan geofencing GPS, verifikasi wajah (*Vermuk*), perhitungan jam kerja real-time, manajemen gaji proaktif, hingga unduh laporan resmi.</p>
        <button onClick={onMulai} style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)', color: '#d4af37', border: '1px solid #d4af37', padding: '14px 32px', borderRadius: '12px', fontSize: '15px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 10px 15px -3px rgba(15, 23, 42, 0.3)' }}>
          Masuk Portal Eksekutif →
        </button>
      </div>
    </div>
  );
}
