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

const userPlusIcon = (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7zM20 8v6m3-3h-6" />
  </svg>
);

const allowedTypes = ['vendedor'];

export default function VendedorPortalPage() {
  const { user } = useAuth();
  return (
    <ProtectedRoute allowedTypes={allowedTypes}>
      <BaseLayout
        title="Portal do Vendedor"
        description="Acesse suas funções de vendedor e gere QR Codes para clientes."
        icon={
          <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        }
        bgColor="from-blue-50 to-indigo-100"
        maxWidth="md"
        backUrl="/"
        backText="Sair do Sistema"
      >
        <Card className="mb-8">
          <div className="flex flex-col items-center gap-2">
            <div className="text-lg font-semibold text-gray-800">Bem-vindo, {user?.nome} {user?.sobrenome}</div>
            <div className="text-blue-700 text-sm font-medium">Vendedor</div>
            <div className="text-gray-500 text-xs">Login: {user?.login}</div>
          </div>
        </Card>
        <Card>
          <div className="flex flex-col gap-4">
            <Link href="/qrcode?userType=vendedor">
              <Button variant="primary" size="lg" fullWidth icon={qrcodeIcon}>
                Acessar meu QRCode
              </Button>
            </Link>
            <Link href="/vendedor-portal/gerar-qrcode-cliente">
              <Button variant="secondary" size="lg" fullWidth icon={userPlusIcon}>
                Gerar QRCode para Cliente
              </Button>
            </Link>
            <Link href="/gerar-qrcode-visitante">
              <Button variant="warning" size="lg" fullWidth icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              }>
                QRCode para Visitante (30s)
              </Button>
            </Link>
          </div>
        </Card>
      </BaseLayout>
    </ProtectedRoute>
  );
}
