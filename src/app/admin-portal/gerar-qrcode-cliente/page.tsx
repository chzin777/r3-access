"use client";
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { createClientToken } from '@/lib/tokenUtils';
import ProtectedRoute from '@/components/ProtectedRoute';
import BaseLayout from '@/components/Layout/BaseLayout';
import Card from '@/components/UI/Card';
import Button from '@/components/UI/Button';
import Input from '@/components/UI/Input';
import Alert from '@/components/UI/Alert';
import QRCode from 'qrcode';

export default function AdminGerarQRCodeCliente() {
  const { user } = useAuth();
  const [clientName, setClientName] = useState('');
  const [nf, setNf] = useState('');
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!clientName.trim() || !nf.trim()) {
      setError('Por favor, preencha todos os campos');
      return;
    }

    if (!user?.id) {
      setError('Usuário não autenticado');
      return;
    }

    setIsLoading(true);
    setError('');
    setMessage('');
    setQrDataUrl('');

    try {
      // Criar token para o cliente
      const result = await createClientToken(
        clientName.trim(),
        nf.trim(),
        user.id
      );

      if (result && result.qrCodeData) {
        // Gerar imagem do QRCode
        const dataUrl = await QRCode.toDataURL(result.qrCodeData, {
          width: 300,
          margin: 2,
          color: {
            dark: '#1f2937',
            light: '#ffffff'
          }
        });

        setQrDataUrl(dataUrl);
        setMessage(`QRCode gerado com sucesso para ${clientName} (NF: ${nf})!`);
        
        // Limpar formulário
        setClientName('');
        setNf('');
      } else {
        setError('Erro ao gerar QRCode');
      }
    } catch (error) {
      console.error('Erro ao gerar QRCode:', error);
      setError('Erro interno ao gerar QRCode');
    } finally {
      setIsLoading(false);
    }
  };

  const adminIcon = (
    <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
    </svg>
  );

  const userIcon = (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );

  const documentIcon = (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );

  return (
    <ProtectedRoute allowedTypes={['admin']}>
      <BaseLayout
        title="QRCode para Cliente"
        description="Gere tokens de acesso para clientes retirarem mercadorias"
        icon={adminIcon}
        bgColor="from-indigo-50 via-purple-50 to-blue-50"
        backUrl="/admin-portal"
        backText="Voltar ao Portal Admin"
        maxWidth="lg"
      >
        <Card>
          {/* Informações do administrador */}
          {user && (
            <div className="mb-6 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-100">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-indigo-900">
                    {user.nome} {user.sobrenome}
                  </h3>
                  <p className="text-indigo-600 text-sm">{user.tipo}</p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Info card */}
            <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
              <div className="flex items-start space-x-3">
                <svg className="w-6 h-6 text-blue-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h4 className="font-semibold text-blue-800 mb-1">QRCode para Cliente</h4>
                  <p className="text-blue-700 text-sm">
                    Gere um token único para que o cliente possa retirar suas mercadorias. 
                    O QRCode será válido por 24 horas e pode ser usado apenas uma vez.
                  </p>
                </div>
              </div>
            </div>

            {/* Campos do formulário */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Nome do Cliente"
                name="clientName"
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Ex: Maria Silva"
                required
                icon={userIcon}
                helpText="Nome completo do cliente"
              />

              <Input
                label="Número da Nota Fiscal"
                name="nf"
                type="text"
                value={nf}
                onChange={(e) => setNf(e.target.value)}
                placeholder="Ex: 123456"
                required
                icon={documentIcon}
                helpText="Número da NF para identificação"
              />
            </div>

            {/* Botão de gerar */}
            <div className="pt-4">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                disabled={isLoading}
                className="shadow-lg"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Gerando QRCode...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                    </svg>
                    Gerar QRCode
                  </>
                )}
              </Button>
            </div>
          </form>

          {/* Messages */}
          {message && (
            <div className="mt-6">
              <Alert type="success" message={message} />
            </div>
          )}

          {error && (
            <div className="mt-6">
              <Alert type="error" message={error} />
            </div>
          )}

          {/* QRCode Display */}
          {qrDataUrl && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  QRCode Gerado
                </h3>
                <div className="inline-block p-4 bg-white rounded-xl shadow-lg border border-gray-200">
                  <img 
                    src={qrDataUrl} 
                    alt="QRCode para Cliente" 
                    className="mx-auto"
                  />
                </div>
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">
                    <strong>Instruções:</strong> Mostre este QRCode para o cliente ou envie por WhatsApp/Email. 
                    O código é válido por 24 horas e pode ser usado apenas uma vez.
                  </p>
                </div>
              </div>
            </div>
          )}
        </Card>
      </BaseLayout>
    </ProtectedRoute>
  );
}
