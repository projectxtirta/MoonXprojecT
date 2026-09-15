import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { supabase } from '../../supabaseClient';
import { signIn, signOut } from '../../lib/auth';
import { rupiah } from '../../lib/hris';
import './admin.css';
import MasterData from './MasterData';

type Karyawan = {
  id: string; id_karyawan?: string; nama: string; jabatan?: string; email?: string;
  no_telp?: string; alamat_rumah?: string; gaji_pokok?: number; nik_ktp?: string;
  departemen?: string; status_aktif?: boolean; tanggal_masuk?: string;
  status_karyawan?: string; role?: string;
};
type Absensi = {
  id: string; karyawan_id?: string; id_karyawan?: string; nama?: string; jabatan?: string;
  tanggal?: string; jam_masuk?: string; jam_pulang?: string; total_jam?: string;
  status?: string; lokasi?: string; foto?: string; selfie_masuk?: string;
  keterlambatan_menit?: number; lembur_menit?: number; lokasi_masuk?: string;
};
type MenuKey =
 | 'overview'|'employees'|'employee-add'|'organization'|'attendance'|'attendance-today'|'late'|'leave'|'overtime'|'selfie'
 | 'schedule'|'shift'|'holiday'|'leave-request'|'leave-balance'|'payroll'|'payroll-components'|'payroll-overtime'|'payslip'
 | 'performance'|'kpi'|'recruitment'|'candidates'|'reports'|'settings'|'roles'|'audit';

const money=(n:number)=>rupiah(n);
const isoToday=()=>new Date().toISOString().slice(0,10);
const menuGroups: {title:string;items: readonly [MenuKey,string,string][]}[] = [
 {title:'UTAMA',items:[['overview','Overview','⌂']]},
 {title:'PEOPLE',items:[['employees','Semua Karyawan','♙'],['employee-add','Tambah Karyawan','+'],['organization','Organisasi','▦']]},
 {title:'ATTENDANCE',items:[['attendance','Rekap Absensi','◷'],['attendance-today','Absensi Hari Ini','✓'],['late','Keterlambatan','!'],['leave','Izin & Sakit','○'],['overtime','Lembur','↗'],['selfie','Monitoring Selfie','▣']]},
 {title:'SCHEDULE',items:[['schedule','Jadwal Kerja','▤'],['shift','Shift','◫'],['holiday','Hari Libur','☆']]},
 {title:'LEAVE',items:[['leave-request','Pengajuan Cuti','◉'],['leave-balance','Saldo Cuti','◌']]},
 {title:'PAYROLL',items:[['payroll','Payroll Bulanan','Rp'],['payroll-components','Komponen Gaji','≡'],['payroll-overtime','Payroll Lembur','↗'],['payslip','Slip Gaji','▤']]},
 {title:'TALENT',items:[['performance','Performance','↗'],['kpi','KPI & Target','◎'],['recruitment','Recruitment','♧'],['candidates','Kandidat','♙']]},
 {title:'REPORTING',items:[['reports','Laporan','▥']]},
 {title:'SYSTEM',items:[['settings','Pengaturan','⚙'],['roles','Role & Permission','♙'],['audit','Audit Log','◉']]}
] as const;

const rolePermissions: Record<string,string[]> = {'Super Admin':['*'],'Admin':['people','attendance','schedule','leave','payroll','talent','reports'],'HRD':['people','attendance','schedule','leave','talent','reports'],'Payroll':['people.read','attendance.read','payroll','reports.payroll'],'Supervisor':['people.read','attendance.read','schedule.read','leave.read','leave.approve','reports.attendance'],'Karyawan':[]};
const menuPermissionForRole=(key:MenuKey,role:string)=>{if(role==='Super Admin')return true;if(role==='Karyawan')return false;if(['settings','roles','audit'].includes(key))return false;const group=['employees','employee-add','organization'].includes(key)?'people':['attendance','attendance-today','late','leave','overtime','selfie'].includes(key)?'attendance':['schedule','shift','holiday'].includes(key)?'schedule':['leave-request','leave-balance'].includes(key)?'leave':['payroll','payroll-components','payroll-overtime','payslip'].includes(key)?'payroll':['performance','kpi','recruitment','candidates'].includes(key)?'talent':key==='reports'?'reports':'overview';const perms=rolePermissions[role]||[];if(perms.includes(group))return true;if(key==='employee-add')return perms.includes('people.write');if(key==='reports')return perms.includes('reports')||perms.some(x=>x.startsWith('reports.'));if(group==='people')return perms.includes('people.read');if(group==='attendance')return perms.includes('attendance.read');if(group==='schedule')return perms.includes('schedule.read');if(group==='leave')return perms.includes('leave.read');return false;};

export default function DashboardAdmin(){
 const [logged,setLogged]=useState(false),[email,setEmail]=useState(''),[pin,setPin]=useState('');
 const [menu,setMenu]=useState<MenuKey>('overview'),[sidebar,setSidebar]=useState(true);
 const [open,setOpen]=useState<Record<string,boolean>>(Object.fromEntries(menuGroups.map(g=>[g.title,true])));
 const [employees,setEmployees]=useState<Karyawan[]>([]),[attendance,setAttendance]=useState<Absensi[]>([]);
 const [search,setSearch]=useState(''),[loading,setLoading]=useState(false),[error,setError]=useState(''),[toast,setToast]=useState('');
 const [editing,setEditing]=useState<Karyawan|null>(null),[userRole,setUserRole]=useState('');

 useEffect(()=>{supabase.auth.getUser().then(async({data})=>{if(data.user){const {data:p}=await supabase.from('hris_users').select('role,status').eq('email',data.user.email||'').maybeSingle();if(p&&p.status==='Aktif'&&rolePermissions[p.role]){setUserRole(p.role);setLogged(true)}}})},[]);
 useEffect(()=>{if(logged)refresh()},[logged]);
 async function refresh(){
  setLoading(true); setError('');
  const [k,a]=await Promise.all([
   supabase.from('karyawan').select('*').order('nama'),
   supabase.from('absensi').select('*').order('created_at',{ascending:false}).limit(2000)
  ]);
  if(k.error)setError(`Karyawan: ${k.error.message}`); else setEmployees(k.data||[]);
  if(a.error)setError(v=>v?`${v}\nAbsensi: ${a.error.message}`:`Absensi: ${a.error.message}`); else setAttendance(a.data||[]);
  setLoading(false);
 }
 async function login(e:FormEvent){
  e.preventDefault(); setLoading(true); setError('');
  const {data,error:e2}=await signIn(email,pin);
  setLoading(false);
  if(e2 || !data.user){ setError(e2?.message || 'Email atau password tidak valid.'); return; }
  const {data:profile,error:pe}=await supabase.from('hris_users').select('role,status').eq('email',data.user.email||'').maybeSingle();
  if(pe || !profile || profile.status!=='Aktif' || !rolePermissions[profile.role]){
    await signOut(); setError('Akun tidak memiliki akses Dashboard HR.'); return;
  }
  setUserRole(profile.role);
  setLogged(true);
 }
 async function removeEmployee(k:Karyawan){
  if(!confirm(`Hapus ${k.nama}?`))return;
  const {error:e}=await supabase.from('karyawan').delete().eq('id',k.id);
  if(e)setError(e.message);else{setToast('Karyawan dihapus.');refresh()}
 }
 async function saveEdit(payload:Record<string,unknown>){
  if(!editing)return;
  const {error:e}=await supabase.from('karyawan').update(payload).eq('id',editing.id);
  if(e)setError(e.message);else{setEditing(null);setToast('Data karyawan tersimpan.');refresh()}
 }
 const filtered=useMemo(()=>employees.filter(k=>`${k.nama} ${k.id_karyawan||''} ${k.jabatan||''} ${k.departemen||''}`.toLowerCase().includes(search.toLowerCase())),[employees,search]);
 const filteredA=useMemo(()=>attendance.filter(a=>`${a.nama||''} ${a.id_karyawan||''} ${a.status||''}`.toLowerCase().includes(search.toLowerCase())),[attendance,search]);
 const today=attendance.filter(a=>a.tanggal===isoToday());
 const present=today.filter(a=>['Hadir','Tepat Waktu','Terlambat'].includes(a.status||'')).length;
 const late=today.filter(a=>(a.status||'').toLowerCase().includes('terlambat')||Number(a.keterlambatan_menit)>0).length;
 const payroll=employees.reduce((s,k)=>s+Number(k.gaji_pokok||0),0);
 const activeLabel=menuGroups.flatMap(g=>g.items).find((x) => x[0] === menu)?.[1] || 'Overview';
 const exportCsv=(rows:Record<string,unknown>[],filename:string)=>{
  if(!rows.length){setToast('Tidak ada data untuk diekspor.');return}
  const keys=Object.keys(rows[0]);const esc=(v:unknown)=>`"${String(v??'').replace(/"/g,'""')}"`;
  const csv=[keys.join(';'),...rows.map(r=>keys.map(k=>esc(r[k])).join(';'))].join('\n');
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8'}));a.download=filename;a.click();URL.revokeObjectURL(a.href);
 };
 if(!logged)return <Login email={email} pin={pin} setEmail={setEmail} setPin={setPin} onSubmit={login} loading={loading} error={error}/>;
 return <div className="talenta-shell">
  <aside className={`talenta-sidebar ${sidebar?'':'collapsed'}`}>
 <div className="brand">
  <div className="brand-mark">☾</div>
  {sidebar && (
    <div>
      <b>MoonXprojectT</b>
      <small>Human Resources Platform</small>
    </div>
  )}
</div>

{sidebar && (
  <div className="workspace">
    <span>WORKSPACE</span>
    <b>MoonXprojecT</b>
    <small>HR Management</small>
  </div>
)}

<nav className="sidebar-nav">
  {menuGroups.map(g => (
    <div className="nav-group" key={g.title}>
      {g.items.some(([key]) => menuPermissionForRole(key, userRole)) && sidebar && (
        <button className="group-title" onClick={() => setOpen(v => ({ ...v, [g.title]: !v[g.title] }))}>
          <span>{g.title}</span>
          <span>{open[g.title] ? '⌄' : '›'}</span>
        </button>
      )}
      {(sidebar ? open[g.title] : true) && g.items.filter(([key]) => menuPermissionForRole(key, userRole)).map(([key, label, icon]) => (
        <button 
          key={key} 
          className={`nav-item ${menu === key ? 'active' : ''}`} 
          onClick={() => setMenu(key as MenuKey)} 
          title={label}
        >
          <span className="nav-icon">{icon}</span>
          {sidebar && <span>{label}</span>}
          {key === 'employees' && sidebar && <em>{employees.length}</em>}
        </button>
      ))}
    </div>
  ))}
</nav>
   <div className="sidebar-bottom"><div className="admin-mini"><div className="avatar">HR</div>{sidebar&&<div><b>{userRole||'User'}</b><small>MoonXprojecT Access</small></div>}</div><button className="logout" onClick={async()=>{await signOut();setLogged(false)}}>↪ {sidebar&&'Keluar'}</button></div>
  </aside>
  <main className="talenta-main"><header className="topbar"><button className="icon-btn" onClick={()=>setSidebar(v=>!v)}>☰</button><div className="crumb"><span>MoonXprojecT</span><b>/</b>{activeLabel}</div><div className="top-actions"><div className="search-global"><span>⌕</span><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Cari data..."/></div><button className="icon-btn" onClick={()=>refresh()}>↻</button><div className="avatar">HR</div></div></header>
   <section className="page">{loading&&<div className="loading">Memuat data…</div>}{error&&<div className="alert">{error}</div>}
    {menu==='overview'&&<Overview employees={employees} attendance={attendance} present={present} late={late} payroll={payroll} setMenu={setMenu}/>}
    {menu==='employees'&&<Employees data={filtered} onDelete={removeEmployee} onEdit={setEditing} onExport={()=>exportCsv(employees as any,'database-karyawan.csv')} onAdd={()=>setMenu('employee-add')}/>}
    {menu==='employee-add'&&<AddEmployee refresh={refresh} onDone={()=>setMenu('employees')}/>}
    {menu==='organization'&&<MasterData initialTab="cabang"/>}
    {['attendance','attendance-today','late','leave','overtime','selfie'].includes(menu)&&<AttendanceModule type={menu} data={filteredA} onRefresh={refresh} onExport={()=>exportCsv(attendance as any,'laporan-absensi.csv')}/>}
    {menu==='schedule'&&<MasterData initialTab="jadwal"/>}{menu==='shift'&&<MasterData initialTab="shift"/>}
    {menu==='holiday'&&<HolidayModule/>}
    {['leave-request','leave-balance'].includes(menu)&&<LeaveModule initial={menu}/>}
    {['payroll','payroll-components','payroll-overtime','payslip'].includes(menu)&&<PayrollModule initial={menu} employees={employees} attendance={attendance}/>}
    {['performance','kpi','recruitment','candidates'].includes(menu)&&<TalentModule initial={menu} employees={employees}/>}
    {menu==='reports'&&<Reports employees={employees} attendance={attendance} onExport={exportCsv}/>}
    {menu==='settings'&&<Settings/>}{menu==='roles'&&<Roles/>}{menu==='audit'&&<Audit/>}
    {editing&&<EmployeeEditor employee={editing} onClose={()=>setEditing(null)} onSave={saveEdit}/>}
    {toast&&<button className="toast" onClick={()=>setToast('')}>{toast} ×</button>}
   </section></main>
 </div>
}

function Login(p:{email:string;pin:string;setEmail:(v:string)=>void;setPin:(v:string)=>void;onSubmit:(e:FormEvent)=>void;error:string;loading:boolean}){
 return <div className="login-wrap"><div className="login-card"><div className="brand center"><div className="brand-mark">☾</div><div><b>MoonXprojecT</b><small>People Platform</small></div></div><h1>Selamat datang kembali</h1><p>Masuk ke dashboard HR & payroll.</p><form onSubmit={p.onSubmit}><label>Email / Username<input value={p.email} onChange={e=>p.setEmail(e.target.value)} required/></label><label>PIN / Password<input type="password" value={p.pin} onChange={e=>p.setPin(e.target.value)} required/></label>{p.error&&<div className="form-error">{p.error}</div>}<button className="primary full" disabled={p.loading}>{p.loading?'Memeriksa…':'Masuk ke Dashboard'}</button></form><small className="security-note">Gunakan email dan password Supabase Auth yang diberikan HR.</small></div></div>
}
function Heading({title,desc,action,onAction}:{title:string;desc:string;action?:string;onAction?:()=>void}){return <div className="page-heading"><div><h1>{title}</h1><p>{desc}</p></div>{action&&<button className="primary" onClick={onAction}>{action}</button>}</div>}
function Overview({employees,attendance,present,late,payroll,setMenu}:{employees:Karyawan[];attendance:Absensi[];present:number;late:number;payroll:number;setMenu:(m:MenuKey)=>void}){
 return <><Heading title="HR Command Center" desc="Semua data operasional HR dalam satu pusat kendali." action="＋ Tambah Karyawan" onAction={()=>setMenu('employee-add')}/><div className="stat-grid"><Stat title="Total Karyawan" value={String(employees.length)} hint={`${employees.filter(k=>k.status_aktif!==false).length} aktif`} icon="♙"/><Stat title="Hadir Hari Ini" value={String(present)} hint={`${late} terlambat`} icon="✓"/><Stat title="Total Absensi" value={String(attendance.length)} hint="Record tersimpan" icon="◷"/><Stat title="Payroll" value={money(payroll)} hint="Gaji pokok" icon="Rp"/></div><div className="content-grid"><div className="panel"><div className="panel-head"><div><h2>Absensi terbaru</h2><p>Data yang benar-benar berasal dari database.</p></div><button className="link-btn" onClick={()=>setMenu('attendance')}>Lihat semua →</button></div><AttendanceMini rows={attendance.slice(0,8)}/></div><div className="panel quick"><h2>Akses cepat</h2><p>Semua tombol membuka modul nyata.</p><Quick label="Tambah karyawan" icon="♙" onClick={()=>setMenu('employee-add')}/><Quick label="Jadwal kerja" icon="▤" onClick={()=>setMenu('schedule')}/><Quick label="Payroll" icon="Rp" onClick={()=>setMenu('payroll')}/><Quick label="Pengajuan cuti" icon="◉" onClick={()=>setMenu('leave-request')}/></div></div></>
}
function Stat({title,value,hint,icon}:{title:string;value:string;hint:string;icon:string}){return <div className="stat-card"><div className="stat-icon">{icon}</div><div><span>{title}</span><strong>{value}</strong><small>{hint}</small></div></div>}
function Quick({label,icon,onClick}:{label:string;icon:string;onClick:()=>void}){return <button className="quick-action" onClick={onClick}><span className="quick-icon">{icon}</span>{label}<span>→</span></button>}
function AttendanceMini({rows}:{rows:Absensi[]}){return <div className="table-wrap"><table><thead><tr><th>Karyawan</th><th>Tanggal</th><th>Masuk</th><th>Pulang</th><th>Status</th></tr></thead><tbody>{rows.length?rows.map((a,i)=><tr key={a.id||i}><td><b>{a.nama||'-'}</b><small>{a.id_karyawan||''}</small></td><td>{a.tanggal||'-'}</td><td className="green">{a.jam_masuk||'-'}</td><td>{a.jam_pulang||'-'}</td><td><Status value={a.status||'Hadir'}/></td></tr>):<Empty cols={5}/>}</tbody></table></div>}

function Employees({data,onDelete,onEdit,onExport,onAdd}:{data:Karyawan[];onDelete:(k:Karyawan)=>void;onEdit:(k:Karyawan)=>void;onExport:()=>void;onAdd:()=>void}){
 return <><Heading title="Semua Karyawan" desc="Master data workforce yang tersimpan di Supabase." action="＋ Tambah Karyawan" onAction={onAdd}/><div className="toolbar"><b>{data.length} karyawan</b><button className="secondary" onClick={onExport}>⇩ Export CSV</button></div><div className="panel table-panel"><div className="table-wrap"><table><thead><tr><th>Nama</th><th>ID</th><th>Jabatan</th><th>Departemen</th><th>Status</th><th>Gaji Pokok</th><th>Aksi</th></tr></thead><tbody>{data.length?data.map(k=><tr key={k.id}><td><div className="person"><div className="mini-avatar">{k.nama?.[0]||'K'}</div><b>{k.nama}</b></div></td><td>{k.id_karyawan||'-'}</td><td>{k.jabatan||'-'}</td><td>{k.departemen||'-'}</td><td><Status value={k.status_aktif===false?'Nonaktif':'Aktif'}/></td><td>{money(Number(k.gaji_pokok||0))}</td><td><div className="row-actions"><button className="link-btn" onClick={()=>onEdit(k)}>Edit</button><button className="danger-text" onClick={()=>onDelete(k)}>Hapus</button></div></td></tr>):<Empty cols={7}/>}</tbody></table></div></div></>
}
function AddEmployee({onDone,refresh}:{onDone:()=>void;refresh:()=>void}){
 const [f,setF]=useState({id_karyawan:'',nama:'',jabatan:'',email:'',no_telp:'',departemen:'',tanggal_masuk:'',gaji_pokok:''}),[saving,setSaving]=useState(false),[msg,setMsg]=useState('');
 async function save(e:FormEvent){e.preventDefault();setSaving(true);setMsg('');const payload={...f,gaji_pokok:Number(f.gaji_pokok||0),status_aktif:true};const {error:e2}=await supabase.from('karyawan').insert(payload);setSaving(false);if(e2)setMsg(e2.message);else{refresh();onDone()}}
 return <><Heading title="Tambah Karyawan" desc="Simpan profil baru langsung ke tabel karyawan."/><div className="panel form-panel"><form className="form-grid" onSubmit={save}>{Object.entries(f).map(([k,v])=><label key={k}>{fieldLabel(k)}<input required={['id_karyawan','nama'].includes(k)} type={k==='gaji_pokok'?'number':k==='tanggal_masuk'?'date':'text'} value={String(v ?? '')} onChange={e=>setF({...f,[k]:e.target.value})}/></label>)}{msg&&<div className="form-error full-span">{msg}</div>}<div className="full-span form-actions"><button type="button" className="secondary" onClick={onDone}>Batal</button><button className="primary" disabled={saving}>{saving?'Menyimpan…':'Simpan Karyawan'}</button></div></form></div></>
}
function EmployeeEditor({employee,onClose,onSave}:{employee:Karyawan;onClose:()=>void;onSave:(p:Record<string,unknown>)=>void}){
 const [f,setF]=useState({nama:employee.nama||'',jabatan:employee.jabatan||'',email:employee.email||'',no_telp:employee.no_telp||'',departemen:employee.departemen||'',tanggal_masuk:employee.tanggal_masuk||'',gaji_pokok:String(employee.gaji_pokok||0),status_aktif:employee.status_aktif!==false});
 return <div className="drawer-backdrop" onMouseDown={e=>{if(e.currentTarget===e.target)onClose()}}><aside className="edit-drawer"><div className="drawer-head"><div><span>EMPLOYEE PROFILE</span><h2>Edit Karyawan</h2></div><button className="icon-btn" onClick={onClose}>×</button></div><div className="drawer-body">{Object.entries(f).filter(([k])=>k!=='status_aktif').map(([k,v])=><label key={k}>{fieldLabel(k)}<input type={k==='gaji_pokok'?'number':k==='tanggal_masuk'?'date':'text'} value={String(v ?? '')} onChange={e=>setF({...f,[k]:e.target.value})}/></label>)}<label className="switch-row"><span>Status Aktif</span><input type="checkbox" checked={f.status_aktif} onChange={e=>setF({...f,status_aktif:e.target.checked})}/></label></div><div className="drawer-foot"><button className="secondary" onClick={onClose}>Batal</button><button className="primary" onClick={()=>onSave({...f,gaji_pokok:Number(f.gaji_pokok||0)})}>Simpan Perubahan</button></div></aside></div>
}

function Branch({title,desc,items,tab,setTab,action,onAction,children}:{title:string;desc:string;items:{key:string;label:string;icon:string}[];tab:string;setTab:(v:string)=>void;action?:string;onAction?:()=>void;children:ReactNode}){return <><Heading title={title} desc={desc} action={action} onAction={onAction}/><div className="branch-nav">{items.map(i=><button key={i.key} className={tab===i.key?'active':''} onClick={()=>setTab(i.key)}><span>{i.icon}</span>{i.label}</button>)}</div>{children}</>}
function AttendanceModule({type,data,onRefresh,onExport}:{type:MenuKey;data:Absensi[];onRefresh:()=>void;onExport:()=>void}){
 const initial=type==='attendance-today'?'today':type==='late'?'late':type==='leave'?'leave':type==='overtime'?'overtime':type==='selfie'?'selfie':'summary';
 const [tab,setTab]=useState(initial),[open,setOpen]=useState(false),[employees,setEmployees]=useState<Karyawan[]>([]);
 const [f,setF]=useState({id_karyawan:'',tanggal:isoToday(),jam_masuk:'07:00',jam_pulang:'16:00',status:'Hadir',lokasi:'Manual HR',keterangan:''});
 useEffect(()=>{supabase.from('karyawan').select('*').order('nama').then(({data})=>setEmployees(data||[]))},[]);
 const items=[['summary','Rekap','◷'],['today','Hari Ini','✓'],['late','Terlambat','!'],['leave','Izin & Sakit','○'],['overtime','Lembur','↗'],['selfie','Monitoring Selfie','▣']];
 let rows=data;if(tab==='today')rows=data.filter(a=>a.tanggal===isoToday());if(tab==='late')rows=data.filter(a=>Number(a.keterlambatan_menit||0)>0||(a.status||'').toLowerCase().includes('terlambat'));if(tab==='leave')rows=data.filter(a=>/izin|sakit/i.test(a.status||''));if(tab==='overtime')rows=data.filter(a=>Number(a.lembur_menit||0)>0);if(tab==='selfie')rows=data.filter(a=>!!a.foto||!!a.selfie_masuk);
 const save=async(e:FormEvent)=>{e.preventDefault();const emp=employees.find(x=>x.id_karyawan===f.id_karyawan);if(!emp)return alert('Pilih karyawan.');const {error}=await supabase.from('absensi').insert({...f,nama:emp.nama,jabatan:emp.jabatan||'',total_jam:'8:00'});if(error)alert(error.message);else{setOpen(false);onRefresh()}};
 const del=async(id:string)=>{if(confirm('Hapus record absensi ini?')){const {error}=await supabase.from('absensi').delete().eq('id',id);if(error)alert(error.message);else onRefresh()}};
 return <Branch title="Absensi" desc="Rekap, input manual, review keterlambatan, lembur, dan selfie." items={items.map(([key,label,icon])=>({key,label,icon}))} tab={tab} setTab={setTab} action={tab==='summary'?'＋ Input Absensi': '⇩ Export CSV'} onAction={tab==='summary'?()=>setOpen(true):onExport}>
  <div className="stat-grid three"><Stat title="Record" value={String(rows.length)} hint="Data ditampilkan" icon="▤"/><Stat title="Hadir" value={String(rows.filter(a=>/hadir|tepat|terlambat/i.test(a.status||'')).length)} hint="Kehadiran" icon="✓"/><Stat title="Perlu Review" value={String(rows.filter(a=>Number(a.lembur_menit||0)>0||Number(a.keterlambatan_menit||0)>0).length)} hint="Lembur / terlambat" icon="!"/></div>
  <div className="panel table-panel"><div className="table-wrap"><table><thead><tr><th>Foto</th><th>Karyawan</th><th>Tanggal</th><th>Masuk</th><th>Pulang</th><th>Total</th><th>Status</th><th>Lokasi</th><th>Aksi</th></tr></thead><tbody>{rows.length?rows.map((a,i)=><tr key={a.id||i}><td>{a.foto||a.selfie_masuk?<img className="selfie" src={a.foto||a.selfie_masuk}/>:<div className="selfie blank">—</div>}</td><td><b>{a.nama||'-'}</b><small>{a.id_karyawan||''}</small></td><td>{a.tanggal||'-'}</td><td>{a.jam_masuk||'-'}</td><td>{a.jam_pulang||'-'}</td><td>{a.total_jam||'-'}</td><td><Status value={a.status||'-'}/></td><td>{a.lokasi||a.lokasi_masuk||'-'}</td><td>{a.id&&<button className="danger-text" onClick={()=>del(a.id)}>Hapus</button>}</td></tr>):<Empty cols={9}/>}</tbody></table></div></div>
  {open&&<SimpleModal title="Input Absensi Manual" onClose={()=>setOpen(false)} onSave={save}><label>Karyawan<select required value={f.id_karyawan} onChange={e=>setF({...f,id_karyawan:e.target.value})}><option value="">Pilih karyawan</option>{employees.map(k=><option key={k.id_karyawan} value={k.id_karyawan}>{k.nama} — {k.id_karyawan}</option>)}</select></label><label>Tanggal<input type="date" value={f.tanggal} onChange={e=>setF({...f,tanggal:e.target.value})}/></label><label>Jam Masuk<input type="time" value={f.jam_masuk} onChange={e=>setF({...f,jam_masuk:e.target.value})}/></label><label>Jam Pulang<input type="time" value={f.jam_pulang} onChange={e=>setF({...f,jam_pulang:e.target.value})}/></label><label>Status<select value={f.status} onChange={e=>setF({...f,status:e.target.value})}><option>Hadir</option><option>Terlambat</option><option>Izin</option><option>Sakit</option><option>Alpa</option></select></label><label>Lokasi<input value={f.lokasi} onChange={e=>setF({...f,lokasi:e.target.value})}/></label><label>Keterangan<textarea value={f.keterangan} onChange={e=>setF({...f,keterangan:e.target.value})}/></label></SimpleModal>}
 </Branch>
}

function HolidayModule(){
 const [rows,setRows]=useState<any[]>([]),[modal,setModal]=useState(false),[f,setF]=useState({tanggal:isoToday(),nama:'',tipe:'Nasional'}),[msg,setMsg]=useState('');
 const load=async()=>{const {data,error}=await supabase.from('hris_hari_libur').select('*').order('tanggal');if(error)setMsg(error.message);else setRows(data||[])};useEffect(()=>{load()},[]);
 const save=async(e:FormEvent)=>{e.preventDefault();const {error}=await supabase.from('hris_hari_libur').insert(f);if(error)setMsg(error.message);else{setModal(false);setF({tanggal:isoToday(),nama:'',tipe:'Nasional'});load()}};
 const del=async(id:string)=>{if(confirm('Hapus hari libur?')){const {error}=await supabase.from('hris_hari_libur').delete().eq('id',id);if(error)setMsg(error.message);else load()}};
 return <><Heading title="Hari Libur" desc="Kelola tanggal non-working day di database." action="＋ Tambah Hari Libur" onAction={()=>setModal(true)}/>{msg&&<div className="alert">{msg}</div>}<div className="panel table-panel"><div className="table-wrap"><table><thead><tr><th>Tanggal</th><th>Nama</th><th>Tipe</th><th>Aksi</th></tr></thead><tbody>{rows.length?rows.map(r=><tr key={r.id}><td>{r.tanggal}</td><td><b>{r.nama}</b></td><td><Status value={r.tipe}/></td><td><button className="danger-text" onClick={()=>del(r.id)}>Hapus</button></td></tr>):<Empty cols={4}/>}</tbody></table></div></div>{modal&&<SimpleModal title="Tambah Hari Libur" onClose={()=>setModal(false)} onSave={save}><label>Tanggal<input type="date" value={f.tanggal} onChange={e=>setF({...f,tanggal:e.target.value})}/></label><label>Nama Hari Libur<input required value={f.nama} onChange={e=>setF({...f,nama:e.target.value})}/></label><label>Tipe<select value={f.tipe} onChange={e=>setF({...f,tipe:e.target.value})}><option>Nasional</option><option>Perusahaan</option></select></label></SimpleModal>}</>
}

function LeaveModule({initial}:{initial:MenuKey}){
 const [tab,setTab]=useState(initial==='leave-balance'?'balance':'requests'),[rows,setRows]=useState<any[]>([]),[balances,setBalances]=useState<any[]>([]),[modal,setModal]=useState(false),[employees,setEmployees]=useState<Karyawan[]>([]);
 const [f,setF]=useState({id_karyawan:'',jenis:'Tahunan',tanggal_mulai:isoToday(),tanggal_selesai:isoToday(),jumlah_hari:'1',alasan:'',status:'Menunggu'});
 const load=async()=>{const [a,b,c]=await Promise.all([supabase.from('hris_cuti').select('*').order('created_at',{ascending:false}),supabase.from('hris_saldo_cuti').select('*').eq('tahun',new Date().getFullYear()),supabase.from('karyawan').select('*').order('nama')]);if(!a.error)setRows(a.data||[]);if(!b.error)setBalances(b.data||[]);if(!c.error)setEmployees(c.data||[])};useEffect(()=>{load()},[]);
 const save=async(e:FormEvent)=>{e.preventDefault();const {error}=await supabase.from('hris_cuti').insert({...f,jumlah_hari:Number(f.jumlah_hari)});if(error)alert(error.message);else{setModal(false);load()}};
 const update=async(id:string,status:string)=>{const {error}=await supabase.from('hris_cuti').update({status,disetujui_oleh:'Administrator HR'}).eq('id',id);if(error)alert(error.message);else load()};
 const ensureBalance=async(k:string)=>{const found=balances.find(x=>x.id_karyawan===k);if(found)return found;const {data,error}=await supabase.from('hris_saldo_cuti').insert({id_karyawan:k,tahun:new Date().getFullYear(),jenis:'Tahunan',saldo:12,terpakai:0}).select().single();if(error) return null;return data};
 const items=[['inbox','Approval Inbox','◉'],['requests','Pengajuan Baru','＋'],['history','Riwayat','▤'],['balance','Saldo Cuti','◌']].map(([key,label,icon])=>({key,label,icon}));
 return <Branch title="Cuti" desc="Pengajuan, approval, dan saldo cuti tersimpan di database." items={items} tab={tab} setTab={setTab} action={tab==='requests'?'＋ Buat Pengajuan':undefined} onAction={()=>setModal(true)}>{tab==='balance'?<div className="panel table-panel"><div className="table-wrap"><table><thead><tr><th>Karyawan</th><th>Jenis</th><th>Jatah</th><th>Terpakai</th><th>Sisa</th><th>Aksi</th></tr></thead><tbody>{employees.map(k=>{const b=balances.find(x=>x.id_karyawan===k.id_karyawan);const used=rows.filter(r=>r.id_karyawan===k.id_karyawan&&r.status==='Disetujui').reduce((s,r)=>s+Number(r.jumlah_hari||0),0);const quota=Number(b?.saldo??12);return <tr key={k.id}><td><b>{k.nama}</b><small>{k.id_karyawan}</small></td><td>Tahunan</td><td>{quota}</td><td>{used}</td><td><Status value={String(Math.max(0,quota-used))}/></td><td><button className="link-btn" onClick={()=>k.id_karyawan && ensureBalance(k.id_karyawan).then(load)}>Inisialisasi</button></td></tr>})}</tbody></table></div></div>:<div className="panel table-panel"><div className="table-wrap"><table><thead><tr><th>Karyawan</th><th>Jenis</th><th>Tanggal</th><th>Alasan</th><th>Status</th><th>Aksi</th></tr></thead><tbody>{rows.length?rows.map(r=><tr key={r.id}><td>{r.id_karyawan}</td><td>{r.jenis}</td><td>{r.tanggal_mulai} s/d {r.tanggal_selesai}</td><td>{r.alasan||'-'}</td><td><Status value={r.status}/></td><td>{r.status==='Menunggu'&&<><button className="link-btn" onClick={()=>update(r.id,'Disetujui')}>Setujui</button> <button className="danger-text" onClick={()=>update(r.id,'Ditolak')}>Tolak</button></>}</td></tr>):<Empty cols={6}/>}</tbody></table></div></div>}{modal&&<SimpleModal title="Pengajuan Cuti" onClose={()=>setModal(false)} onSave={save}><label>Karyawan<select required value={f.id_karyawan} onChange={e=>setF({...f,id_karyawan:e.target.value})}><option value="">Pilih karyawan</option>{employees.map(k=><option key={k.id_karyawan} value={k.id_karyawan}>{k.nama} — {k.id_karyawan}</option>)}</select></label><label>Jenis<select value={f.jenis} onChange={e=>setF({...f,jenis:e.target.value})}><option>Tahunan</option><option>Sakit</option><option>Khusus</option></select></label><label>Mulai<input type="date" value={f.tanggal_mulai} onChange={e=>setF({...f,tanggal_mulai:e.target.value})}/></label><label>Selesai<input type="date" value={f.tanggal_selesai} onChange={e=>setF({...f,tanggal_selesai:e.target.value})}/></label><label>Jumlah Hari<input type="number" min="0.5" step="0.5" value={f.jumlah_hari} onChange={e=>setF({...f,jumlah_hari:e.target.value})}/></label><label>Alasan<textarea value={f.alasan} onChange={e=>setF({...f,alasan:e.target.value})}/></label></SimpleModal>}</Branch>
}

function PayrollModule({initial,employees,attendance}:{initial:MenuKey;employees:Karyawan[];attendance:Absensi[]}){
 const init=initial==='payroll-components'?'components':initial==='payroll-overtime'?'overtime':initial==='payslip'?'payslip':'register';const [tab,setTab]=useState(init),[rows,setRows]=useState<any[]>([]),[period,setPeriod]=useState(new Date().toISOString().slice(0,7));
 const load=async()=>{const {data,error}=await supabase.from('hris_payroll').select('*').eq('periode',period).order('created_at',{ascending:false});if(!error)setRows(data||[])};useEffect(()=>{load()},[period]);
 const generate=async()=>{if(!employees.length)return alert('Belum ada karyawan.');const payload=employees.map(k=>({id_karyawan:k.id_karyawan,periode:period,gaji_pokok:Number(k.gaji_pokok||0),status:'Draft',tanggal_bayar:null}));const {error}=await supabase.from('hris_payroll').upsert(payload,{onConflict:'id_karyawan,periode'});if(error)alert(error.message);else load()};
 const process=async()=>{const {error}=await supabase.from('hris_payroll').update({status:'Diproses',tanggal_proses:new Date().toISOString()}).eq('periode',period).eq('status','Draft');if(error)alert(error.message);else load()};
 const pay=async()=>{const {error}=await supabase.from('hris_payroll').update({status:'Dibayar',tanggal_bayar:isoToday()}).eq('periode',period).eq('status','Diproses');if(error)alert(error.message);else load()};
 const items=[['register','Payroll Register','▤'],['process','Proses Payroll','▶'],['components','Komponen Gaji','≡'],['overtime','Payroll Lembur','↗'],['payslip','Slip Gaji','▥']].map(([key,label,icon])=>({key,label,icon}));
 return <><Branch title="Payroll" desc="Perhitungan payroll per periode dengan status Draft → Diproses → Dibayar." items={items} tab={tab} setTab={setTab} action={tab==='register'?'＋ Generate Payroll':tab==='process'?'▶ Proses Payroll':tab==='payslip'?'✓ Tandai Dibayar':undefined} onAction={tab==='register'?generate:tab==='process'?process:tab==='payslip'?pay:undefined}><div className="filter-row"><label>Periode <input className="filter" type="month" value={period} onChange={e=>setPeriod(e.target.value)}/></label></div>{tab==='components'?<PayrollComponents/>:tab==='overtime'?<OvertimeData attendance={attendance}/>:tab==='payslip'?<Payslips rows={rows}/>:<div className="panel table-panel"><div className="table-wrap"><table><thead><tr><th>Karyawan</th><th>Periode</th><th>Gaji Pokok</th><th>Pendapatan</th><th>Potongan</th><th>Gaji Bersih</th><th>Status</th></tr></thead><tbody>{rows.length?rows.map(r=><tr key={r.id}><td>{r.id_karyawan}</td><td>{r.periode}</td><td>{money(Number(r.gaji_pokok||0))}</td><td>{money(Number(r.total_pendapatan||0))}</td><td>{money(Number(r.total_potongan||0))}</td><td><b>{money(Number(r.gaji_bersih||0))}</b></td><td><Status value={r.status}/></td></tr>):<Empty cols={7}/>}</tbody></table></div></div>}</Branch></>
}
function PayrollComponents(){
 const [rows,setRows]=useState<any[]>([]);
 const [nama,setNama]=useState('');
 const [tipe,setTipe]=useState('Tunjangan');
 const [nominal,setNominal]=useState('0');
 const [status,setStatus]=useState('Aktif');
 const load=async()=>{const {data}=await supabase.from('hris_payroll_komponen').select('*').order('nama');setRows(data||[])};
 useEffect(()=>{load()},[]);
 const save=async(e:FormEvent)=>{e.preventDefault();const {error}=await supabase.from('hris_payroll_komponen').insert({nama,tipe,nominal_default:Number(nominal||0),status});if(error)alert(error.message);else{setNama('');setNominal('0');load()}};
 return <div className="content-grid"><div className="panel form-panel"><h2>Tambah Komponen Gaji</h2><form className="form-grid" onSubmit={save}><label>Nama Komponen<input required value={nama} onChange={e=>setNama(e.target.value)} /></label><label>Tipe<select value={tipe} onChange={e=>setTipe(e.target.value)}><option>Tunjangan</option><option>Potongan</option></select></label><label>Nominal Default<input type="number" min="0" value={nominal} onChange={e=>setNominal(e.target.value)} /></label><label>Status<select value={status} onChange={e=>setStatus(e.target.value)}><option>Aktif</option><option>Nonaktif</option></select></label><div className="full-span"><button className="primary">Simpan Komponen</button></div></form></div><div className="panel table-panel"><div className="table-wrap"><table><thead><tr><th>Nama</th><th>Tipe</th><th>Nominal Default</th><th>Status</th></tr></thead><tbody>{rows.length?rows.map(r=><tr key={r.id}><td><b>{r.nama}</b></td><td>{r.tipe}</td><td>{money(Number(r.nominal_default||0))}</td><td><Status value={r.status}/></td></tr>):<Empty cols={4}/>}</tbody></table></div></div></div>
}
function OvertimeData({attendance}:{attendance:Absensi[]}){const rows=attendance.filter(a=>Number(a.lembur_menit||0)>0);return <div className="panel table-panel"><div className="table-wrap"><table><thead><tr><th>Karyawan</th><th>Tanggal</th><th>Menit Lembur</th><th>Status</th></tr></thead><tbody>{rows.length?rows.map((a,i)=><tr key={a.id||i}><td>{a.nama||a.id_karyawan}</td><td>{a.tanggal}</td><td>{a.lembur_menit}</td><td><Status value="Tercatat"/></td></tr>):<Empty cols={4}/>}</tbody></table></div></div>}
function Payslips({rows}:{rows:any[]}){return <div className="report-grid">{rows.length?rows.map(r=><div className="report-card" key={r.id}><span>SLIP GAJI</span><h3>{r.id_karyawan}</h3><b>{money(Number(r.gaji_bersih||0))}</b><p>Periode {r.periode}</p><button className="primary" onClick={()=>window.print()}>Cetak Slip</button></div>):<div className="panel"><div className="empty-module"><h3>Belum ada payroll</h3><p>Generate payroll terlebih dahulu.</p></div></div>}</div>}

function TalentModule({initial,employees}:{initial:MenuKey;employees:Karyawan[]}){
 const [tab,setTab]=useState(initial==='kpi'?'kpi':initial==='recruitment'?'vacancies':initial==='candidates'?'candidates':'performance'),[rows,setRows]=useState<any[]>([]),[modal,setModal]=useState(false);
 const load=async()=>{const table=tab==='kpi'?'hris_kpi':tab==='vacancies'?'hris_lowongan':tab==='candidates'?'hris_kandidat':tab==='interviews'?'hris_interview':'hris_performance';const {data,error}=await supabase.from(table).select('*').order('created_at',{ascending:false});if(!error)setRows(data||[]);else setRows([])};useEffect(()=>{load()},[tab]);
 const items=[['performance','Performance','↗'],['kpi','KPI & Target','◎'],['vacancies','Lowongan','♧'],['candidates','Kandidat','♙'],['interviews','Interview','▤']];
 return <Branch title="Talent" desc="Performance, KPI, recruitment, kandidat, dan interview dengan data persisten." items={items.map(([key,label,icon])=>({key,label,icon}))} tab={tab} setTab={setTab} action="＋ Tambah" onAction={()=>setModal(true)}>{<TalentTable tab={tab} rows={rows}/>} {modal&&<TalentForm tab={tab} employees={employees} onClose={()=>setModal(false)} onSaved={()=>{setModal(false);load()}}/>}</Branch>
}
function TalentTable({tab,rows}:{tab:string;rows:any[]}){let cols:string[]=[];if(tab==='kpi')cols=['id_karyawan','periode','indikator','target','realisasi','skor','status'];else if(tab==='vacancies')cols=['posisi','departemen','jumlah_kebutuhan','status','tanggal_buka','tanggal_tutup'];else if(tab==='candidates')cols=['nama','email','no_telp','posisi','tahap','status'];else if(tab==='interviews')cols=['kandidat','tanggal','jam','interviewer','hasil','status'];else cols=['id_karyawan','periode','nilai','catatan','status'];return <div className="panel table-panel"><div className="table-wrap"><table><thead><tr>{cols.map(c=><th key={c}>{fieldLabel(c)}</th>)}</tr></thead><tbody>{rows.length?rows.map(r=><tr key={r.id}>{cols.map(c=><td key={c}>{c==='status'?<Status value={String(r[c]??'-')}/>:String(r[c]??'-')}</td>)}</tr>):<Empty cols={cols.length}/>}</tbody></table></div></div>}
function TalentForm({tab,employees,onClose,onSaved}:{tab:string;employees:Karyawan[];onClose:()=>void;onSaved:()=>void}){
 const [f,setF]=useState<any>(tab==='kpi'?{id_karyawan:'',periode:new Date().toISOString().slice(0,7),indikator:'',target:'',realisasi:'',bobot:'0',skor:'0',status:'Draft'}:tab==='vacancies'?{posisi:'',departemen:'',jumlah_kebutuhan:'1',status:'Open',tanggal_buka:isoToday(),tanggal_tutup:'',deskripsi:''}:tab==='candidates'?{nama:'',email:'',no_telp:'',posisi:'',sumber:'',tahap:'Screening',status:'Aktif',catatan:''}:tab==='interviews'?{kandidat:'',tanggal:isoToday(),jam:'09:00',interviewer:'',hasil:'',status:'Terjadwal'}:{id_karyawan:'',periode:new Date().toISOString().slice(0,7),nilai:'0',catatan:'',status:'Draft'});
 const table=tab==='kpi'?'hris_kpi':tab==='vacancies'?'hris_lowongan':tab==='candidates'?'hris_kandidat':tab==='interviews'?'hris_interview':'hris_performance';
 const save=async(e:FormEvent)=>{e.preventDefault();const numeric=['target','realisasi','bobot','skor','jumlah_kebutuhan','nilai'];const payload={...f};numeric.forEach(k=>{if(k in payload)payload[k]=Number(payload[k]||0)});const {error}=await supabase.from(table).insert(payload);if(error)alert(error.message);else onSaved()};
 return <SimpleModal title={`Tambah ${tab==='kpi'?'KPI':tab==='vacancies'?'Lowongan':tab==='candidates'?'Kandidat':tab==='interviews'?'Interview':'Performance'}`} onClose={onClose} onSave={save}>{Object.entries(f).map(([k,v])=><label key={k}>{fieldLabel(k)}{k==='id_karyawan'?<select required value={String(v)} onChange={e=>setF({...f,[k]:e.target.value})}><option value="">Pilih karyawan</option>{employees.map(x=><option key={x.id_karyawan} value={x.id_karyawan}>{x.nama} — {x.id_karyawan}</option>)}</select>:<input required={['nama','posisi','indikator','kandidat'].includes(k)} type={['target','realisasi','bobot','skor','jumlah_kebutuhan','nilai'].includes(k)?'number':k==='tanggal'||k.includes('tanggal')?'date':k==='jam'?'time':'text'} value={String(v??'')} onChange={e=>setF({...f,[k]:e.target.value})}/>}</label>)}</SimpleModal>
}
function Reports({employees,attendance,onExport}:{employees:Karyawan[];attendance:Absensi[];onExport:(r:any[],f:string)=>void}){const [tab,setTab]=useState('overview'),[payroll,setPayroll]=useState<any[]>([]);useEffect(()=>{if(tab==='payroll')supabase.from('hris_payroll').select('*').order('created_at',{ascending:false}).limit(2000).then(({data})=>setPayroll(data||[]))},[tab]);const items=[['overview','Analytics','▥'],['attendance','Laporan Absensi','◷'],['payroll','Laporan Payroll','Rp'],['people','Laporan Karyawan','♙']].map(([key,label,icon])=>({key,label,icon}));return <Branch title="Laporan" desc="Export data nyata dari database." items={items} tab={tab} setTab={setTab}>{tab==='overview'?<div className="report-grid"><ReportCard name="Master Karyawan" count={employees.length} onClick={()=>onExport(employees,'laporan-karyawan.csv')}/><ReportCard name="Absensi" count={attendance.length} onClick={()=>onExport(attendance,'laporan-absensi.csv')}/><ReportCard name="Payroll" count={payroll.length} onClick={()=>onExport(payroll,'laporan-payroll.csv')}/></div>:tab==='attendance'?<ReportCard name="Laporan Absensi" count={attendance.length} onClick={()=>onExport(attendance,'laporan-absensi.csv')}/>:tab==='people'?<ReportCard name="Laporan Karyawan" count={employees.length} onClick={()=>onExport(employees,'laporan-karyawan.csv')}/>:<ReportCard name="Laporan Payroll" count={payroll.length} onClick={()=>onExport(payroll,'laporan-payroll.csv')}/>}</Branch>}
function ReportCard({name,count,onClick}:{name:string;count:number;onClick:()=>void}){return <div className="report-card"><span>REPORT</span><h3>{name}</h3><b>{count}</b><p>record tersedia</p><button className="primary" onClick={onClick}>Export CSV</button></div>}
function Settings(){const [f,setF]=useState<any>({company_name:'MoonXprojecT',work_start:'07:00',work_end:'16:00',break_minutes:60,payday_day:'Jumat',currency:'IDR',timezone:'Asia/Jakarta',overtime_multiplier:2,late_tolerance_minutes:10,attendance_radius_meters:100,auto_approve_attendance:false,notify_late:true,notify_leave:true,maintenance_mode:false}),[tab,setTab]=useState('Perusahaan'),[msg,setMsg]=useState('');useEffect(()=>{supabase.from('hris_company_settings').select('*').eq('id',1).maybeSingle().then(({data})=>data&&setF(data))},[]);const save=async()=>{const {error}=await supabase.from('hris_company_settings').upsert({...f,id:1});setMsg(error?error.message:'Pengaturan tersimpan.');};const groups={Perusahaan:['company_name','currency','timezone'],'Jam Kerja':['work_start','work_end','break_minutes','late_tolerance_minutes'],Payroll:['payday_day','overtime_multiplier'],Absensi:['attendance_radius_meters','auto_approve_attendance'],Notifikasi:['notify_late','notify_leave'],Keamanan:['maintenance_mode']} as any;const labels:any={company_name:'Nama Perusahaan',currency:'Mata Uang',timezone:'Zona Waktu',work_start:'Jam Masuk',work_end:'Jam Pulang',break_minutes:'Istirahat (menit)',late_tolerance_minutes:'Toleransi Terlambat (menit)',payday_day:'Hari Gajian',overtime_multiplier:'Pengali Lembur',attendance_radius_meters:'Radius Absensi (meter)',auto_approve_attendance:'Auto Approve Absensi',notify_late:'Notifikasi Keterlambatan',notify_leave:'Notifikasi Cuti',maintenance_mode:'Mode Maintenance'};return <><Heading title="Pengaturan" desc="Konfigurasi perusahaan, jam kerja, payroll, absensi, notifikasi, dan keamanan." action="Simpan Perubahan" onAction={save}/>{msg&&<div className="alert">{msg}</div>}<div className="settings-tabs">{Object.keys(groups).map(x=><button key={x} className={tab===x?'active':''} onClick={()=>setTab(x)}>{x}</button>)}</div><div className="panel form-panel settings-content"><div className="form-grid">{groups[tab].map((k:string)=>{const v=f[k];const bool=['auto_approve_attendance','notify_late','notify_leave','maintenance_mode'].includes(k);return <label key={k}>{labels[k]}{bool?<input type="checkbox" checked={!!v} onChange={e=>setF({...f,[k]:e.target.checked})}/>:<input type={['break_minutes','late_tolerance_minutes','attendance_radius_meters','overtime_multiplier'].includes(k)?'number':k.includes('start')||k.includes('end')?'time':'text'} value={String(v??'')} onChange={e=>setF({...f,[k]:['break_minutes','late_tolerance_minutes','attendance_radius_meters','overtime_multiplier'].includes(k)?Number(e.target.value):e.target.value})}/>}</label>})}</div></div></>}

function Roles(){const roleNames=['Super Admin','Admin','HRD','Payroll','Supervisor','Karyawan'];const modules=[['people','People'],['attendance','Attendance'],['schedule','Schedule'],['leave','Leave'],['payroll','Payroll'],['talent','Talent'],['reports','Reporting'],['settings','Settings'],['roles','Role & Permission'],['audit','Audit Log']];const [selected,setSelected]=useState('Super Admin');const perms=rolePermissions[selected]||[];return <><Heading title="Role & Permission" desc="Kontrol akses berbasis peran untuk setiap modul HRIS."/><div className="panel role-panel"><div className="role-select"><label>Pilih Role<select value={selected} onChange={e=>setSelected(e.target.value)}>{roleNames.map(r=><option key={r}>{r}</option>)}</select></label><div className="role-badge">{selected}</div></div><div className="permission-matrix"><div className="pm-head"><span>Modul</span><span>View</span><span>Write</span><span>Approve</span><span>Export</span></div>{modules.map(([code,name])=>{const enabled=selected==='Super Admin'||perms.includes(code)||perms.includes(code+'.read');return <div className="pm-row" key={code}><b>{name}</b><span className={enabled?'on':''}>✓</span><span className={enabled&&perms.includes(code+'.write')?'on':''}>✓</span><span className={enabled&&code==='leave'&&perms.includes('leave.approve')?'on':''}>✓</span><span className={enabled&&code==='reports'?'on':''}>✓</span></div>})}</div><div className="role-note">Super Admin memiliki akses penuh. Role lain mengikuti matriks akses yang ditetapkan sistem.</div></div></>}

function Audit(){const [rows,setRows]=useState<any[]>([]);useEffect(()=>{supabase.from('hris_audit_logs').select('*').order('created_at',{ascending:false}).limit(200).then(({data})=>setRows(data||[]))},[]);return <><Heading title="Audit Log" desc="Aktivitas yang benar-benar tercatat di database."/><div className="panel table-panel"><div className="table-wrap"><table><thead><tr><th>Waktu</th><th>Actor</th><th>Action</th><th>Module</th><th>Detail</th></tr></thead><tbody>{rows.length?rows.map(r=><tr key={r.id}><td>{r.created_at?.replace('T',' ').slice(0,19)}</td><td>{r.actor_email||'-'}</td><td>{r.action}</td><td>{r.module||'-'}</td><td>{JSON.stringify(r.details||{})}</td></tr>):<Empty cols={5}/>}</tbody></table></div></div></>}
function SimpleModal({title,onClose,onSave,children}:{title:string;onClose:()=>void;onSave:(e:FormEvent)=>void;children:ReactNode}){return <div className="drawer-backdrop"><aside className="edit-drawer"><div className="drawer-head"><h2>{title}</h2><button className="icon-btn" onClick={onClose}>×</button></div><form className="drawer-body" onSubmit={onSave}>{children}<div className="drawer-foot"><button type="button" className="secondary" onClick={onClose}>Batal</button><button className="primary">Simpan</button></div></form></aside></div>}
function Status({value}:{value:string}){const v=value.toLowerCase();const cls=v.includes('non')||v.includes('tolak')||v.includes('sakit')?'red':v.includes('terlambat')||v.includes('draft')||v.includes('menunggu')?'orange':v.includes('izin')?'blue':'green';return <span className={`status ${cls}`}>{value}</span>}
function Empty({cols}:{cols:number}){return <tr><td colSpan={cols} className="empty-cell">Belum ada data.</td></tr>}
function fieldLabel(k:string){return ({id_karyawan:'ID Karyawan',nama:'Nama Lengkap',jabatan:'Jabatan',email:'Email',no_telp:'No. Telepon',departemen:'Departemen',tanggal_masuk:'Tanggal Masuk',gaji_pokok:'Gaji Pokok',periode:'Periode',indikator:'Indikator',target:'Target',realisasi:'Realisasi',bobot:'Bobot',skor:'Skor',jumlah_kebutuhan:'Jumlah Kebutuhan',tanggal_buka:'Tanggal Buka',tanggal_tutup:'Tanggal Tutup',deskripsi:'Deskripsi',posisi:'Posisi',sumber:'Sumber',tahap:'Tahap',catatan:'Catatan',nilai:'Nilai',kandidat:'Kandidat',jam:'Jam',interviewer:'Interviewer',hasil:'Hasil',company_name:'Nama Perusahaan',work_start:'Jam Masuk',work_end:'Jam Pulang',break_minutes:'Istirahat (menit)',payday_day:'Hari Gajian',currency:'Mata Uang',timezone:'Timezone'})[k]||k}
