"use client";
import ProtectedRoute from '@/components/ProtectedRoute';
import BaseLayout from '@/components/Layout/BaseLayout';
import Card from '@/components/UI/Card';
import ActionLink from '@/components/UI/ActionLink';

export default function AdminPortal() {
  const adminIcon = (
    <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );

  const userPlusIcon = (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
    </svg>
  );

  const qrCodeIcon = (
    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
    </svg>
  );

  const scannerIcon = (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );

  const testIcon = (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
  );

  return (
    <ProtectedRoute allowedTypes={['admin']}>
      <BaseLayout
        title="Administração"
        description="Gerencie usuários e acesse todas as funcionalidades do sistema"
        icon={adminIcon}
        bgColor="from-green-50 via-emerald-50 to-teal-50"
        backUrl="/"
        backText="Sair do Sistema"
        maxWidth="md"
      >
      <Card className="space-y-4">
        {/* Welcome message */}
        <div className="text-center mb-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-100">
          <h3 className="text-lg font-semibold text-green-800 mb-1">
            Painel do Administrador
          </h3>
          <p className="text-green-600 text-sm">
            Acesso completo a todas as funcionalidades
          </p>
        </div>

        <ActionLink
          href="/admin"
          title="Cadastrar Usuários"
          description="Adicione colaboradores e porteiros"
          icon={userPlusIcon}
          color="green"
          className="mb-4"
        />

        <ActionLink
          href="/qrcode?userType=admin"
          title="Meu QRCode"
          description="Gere seu token de acesso pessoal"
          icon={qrCodeIcon}
          color="blue"
          className="mb-4"
        />

        <ActionLink
          href="/admin-portal/gerar-qrcode-cliente"
          title="QRCode para Cliente"
          description="Gere tokens de acesso para clientes"
          icon={qrCodeIcon}
          color="indigo"
          className="mb-4"
        />

        <ActionLink
          href="/gerar-qrcode-visitante"
          title="QRCode para Visitante"
          description="Gere tokens temporários de 30s para visitantes"
          icon={
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          }
          color="purple"
          className="mb-4"
        />

        <ActionLink
          href="/scan?userType=admin"
          title="Validar QRCodes"
          description="Scanner para validação de acessos"
          icon={scannerIcon}
          color="yellow"
          className="mb-4"
        />

        <ActionLink
          href="/qrcode-teste"
          title="QR Codes de Teste"
          description="Gere códigos mestres para testes"
          icon={testIcon}
          color="purple"
        />
        
        {/* System status */}
        <div className="mt-6 p-4 bg-gray-50 rounded-xl">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-gray-800">Status do Sistema</h4>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
              <span className="text-sm text-green-600 font-medium">Online</span>
            </div>
          </div>
        </div>
      </Card>
    </BaseLayout>
    </ProtectedRoute>
  );
}
