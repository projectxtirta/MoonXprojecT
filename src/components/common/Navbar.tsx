export default function Navbar({ 
  namaPerusahaan = "MoonXprojecT", 
  onNavClick 
}: { 
  namaPerusahaan?: string; 
  onNavClick: (view: string) => void 
}) {
  return (
    <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 30px', background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(10px)', borderBottom: '1px solid #334155' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }} onClick={() => onNavClick('landing')}>
        {/* Logo Bulan Purnama */}
        <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'radial-gradient(circle, #f8fafc 30%, #cbd5e1 70%)', boxShadow: '0 0 12px rgba(248, 250, 252, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: '18px' }}>🌕</span>
        </div>
        <span style={{ fontWeight: 'bold', fontSize: '16px', color: '#fff' }}>{namaPerusahaan}</span>
      </div>

      <div style={{ display: 'flex', gap: '20px', fontSize: '14px', fontWeight: 'bold' }}>
        <span onClick={() => onNavClick('landing')} style={{ cursor: 'pointer', color: '#f8fafc' }}>Beranda</span>
        <span onClick={() => onNavClick('portal')} style={{ cursor: 'pointer', color: '#f8fafc' }}>Portal Karyawan</span>
        <span onClick={() => onNavClick('admin')} style={{ cursor: 'pointer', color: '#f8fafc' }}>Dashboard HR</span>
      </div>
    </nav>
  );
}
