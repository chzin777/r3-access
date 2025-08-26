"use client";
import ProtectedRoute from '@/components/ProtectedRoute';
import BaseLayout from '@/components/Layout/BaseLayout';
import Card from '@/components/UI/Card';
import ActionLink from '@/components/UI/ActionLink';

export default function PorteiroPortal() {
  const porteiroIcon = (
    <svg className="w-10 h-10 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  );

  const scannerIcon = (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
    </svg>
  );

  const qrCodeIcon = (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );

  return (
    <ProtectedRoute allowedTypes={['porteiro', 'admin']}>
      <BaseLayout
        title="Portaria"
        description="Controle de acesso e validação de colaboradores"
        icon={porteiroIcon}
        bgColor="from-yellow-50 via-orange-50 to-amber-50"
        backUrl="/"
        backText="Sair do Sistema"
        maxWidth="md"
      >
      <Card className="space-y-4">
        {/* Welcome message */}
        <div className="text-center mb-6 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl border border-yellow-100">
          <h3 className="text-lg font-semibold text-yellow-800 mb-1">
            Portal do Porteiro
          </h3>
          <p className="text-yellow-600 text-sm">
            Responsável pela segurança e controle de acesso
          </p>
        </div>

        {/* Primary action - Scanner */}
        <ActionLink
          href="/scan?userType=porteiro"
          title="Scanear QRCode"
          description="Validar acesso de colaboradores"
          icon={scannerIcon}
          color="yellow"
          className="mb-4 ring-2 ring-yellow-200 ring-opacity-50"
        />

        <ActionLink
          href="/qrcode?userType=porteiro"
          title="Meu QRCode"
          description="Meu acesso pessoal ao sistema"
          icon={qrCodeIcon}
          color="blue"
        />

        {/* Instructions card */}
        <div className="mt-8 p-5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
          <div className="flex items-start space-x-3">
            <svg className="w-6 h-6 text-blue-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h4 className="font-semibold text-blue-800 mb-2">Como usar o scanner:</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li className="flex items-center">
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></span>
                  Clique em &quot;Scanear QRCode&quot;
                </li>
                <li className="flex items-center">
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></span>
                  Posicione o QRCode na área de leitura
                </li>
                <li className="flex items-center">
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></span>
                  Aguarde a validação automática
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Quick stats */}
        <div className="mt-6 grid grid-cols-2 gap-4">
          <div className="text-center p-4 bg-green-50 rounded-xl border border-green-100">
            <div className="text-xl font-bold text-green-600">100%</div>
            <div className="text-xs text-green-600 font-medium">Taxa de Sucesso</div>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-xl border border-blue-100">
            <div className="text-xl font-bold text-blue-600">&lt; 2s</div>
            <div className="text-xs text-blue-600 font-medium">Tempo de Validação</div>
          </div>
        </div>

        {/* Status indicator */}
        <div className="mt-6 flex items-center justify-center space-x-2 p-3 bg-green-50 rounded-xl border border-green-100">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-green-700 font-medium text-sm">Sistema Online - Pronto para uso</span>
        </div>
      </Card>
    </BaseLayout>
    </ProtectedRoute>
  );
}
