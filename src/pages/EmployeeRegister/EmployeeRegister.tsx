import RegistrasiKaryawan from '../../components/karyawan/RegistrasiKaryawan';

interface EmployeeRegisterProps {
  onBack: () => void;
}

export default function EmployeeRegister({ onBack }: EmployeeRegisterProps) {
  return <div className="public-page"><RegistrasiKaryawan onBack={onBack} /></div>;
}
