"use client";
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import BaseLayout from '@/components/Layout/BaseLayout';
import Card from '@/components/UI/Card';
import Button from '@/components/UI/Button';
import { useAuth } from '@/hooks/useAuth';

const qrcodeIcon = (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
  </svg>
);

const visitorIcon = (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
);

const allowedTypes = ['colaborador'];

export default function ColaboradorPortalPage() {
  const { user } = useAuth();
  
  return (
    <ProtectedRoute allowedTypes={allowedTypes}>
      <BaseLayout
        title="Portal do Colaborador"
        description="Acesse seu QR Code pessoal e gere códigos para visitantes."
        icon={
          <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        }
        bgColor="from-emerald-50 to-green-100"
        maxWidth="md"
        backUrl="/"
        backText="Sair do Sistema"
      >
        <Card className="mb-8">
          <div className="flex flex-col items-center gap-2">
            <div className="text-lg font-semibold text-gray-800">Bem-vindo, {user?.nome} {user?.sobrenome}</div>
            <div className="text-emerald-700 text-sm font-medium">Colaborador</div>
            <div className="text-gray-500 text-xs">Login: {user?.login}</div>
          </div>
        </Card>
        
        <Card>
          <div className="flex flex-col gap-4">
            <Link href="/qrcode?userType=colaborador">
              <Button variant="primary" size="lg" fullWidth icon={qrcodeIcon}>
                Meu QRCode de Acesso
              </Button>
            </Link>
            
            <Link href="/gerar-qrcode-visitante">
              <Button variant="warning" size="lg" fullWidth icon={visitorIcon}>
                QRCode para Visitante (30s)
              </Button>
            </Link>
          </div>
        </Card>

        {/* Information card */}
        <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
          <div className="flex items-start space-x-3">
            <svg className="w-6 h-6 text-blue-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h4 className="font-semibold text-blue-800 mb-2">Informações importantes:</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li className="flex items-center">
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></span>
                  Seu QRCode pessoal renova automaticamente a cada 30 segundos
                </li>
                <li className="flex items-center">
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></span>
                  QRCodes de visitante expiram em 30 segundos e são de uso único
                </li>
                <li className="flex items-center">
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></span>
                  Visitantes recebem automaticamente o cargo "Visitante"
                </li>
              </ul>
            </div>
          </div>
        </div>
      </BaseLayout>
    </ProtectedRoute>
  );
}
