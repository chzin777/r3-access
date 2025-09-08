"use client";
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { createVisitorToken } from '@/lib/tokenUtils';
import ProtectedRoute from '@/components/ProtectedRoute';
import BaseLayout from '@/components/Layout/BaseLayout';
import Card from '@/components/UI/Card';
import Button from '@/components/UI/Button';
import Input from '@/components/UI/Input';
import Alert from '@/components/UI/Alert';
import QRCode from 'qrcode';

export default function GerarQRCodeVisitante() {
  const { user } = useAuth();
  const [visitorName, setVisitorName] = useState('');
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [timeLeft, setTimeLeft] = useState(0);
  const [tokenCreatedAt, setTokenCreatedAt] = useState<Date | null>(null);

  // Timer para mostrar tempo restante
  useEffect(() => {
    if (tokenCreatedAt && timeLeft > 0) {
      const timer = setInterval(() => {
        const elapsed = Math.floor((Date.now() - tokenCreatedAt.getTime()) / 1000);
        const remaining = Math.max(0, 30 - elapsed);
        setTimeLeft(remaining);
        
        if (remaining === 0) {
          setQrDataUrl('');
          setMessage('');
          setTokenCreatedAt(null);
        }
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [tokenCreatedAt, timeLeft]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!visitorName.trim()) {
      setError('Por favor, digite o nome do visitante');
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
      // Criar token para o visitante
      const result = await createVisitorToken(
        visitorName.trim(),
        user.id
      );

      if (result && result.qrCodeData) {
        // Gerar imagem do QRCode
        const dataUrl = await QRCode.toDataURL(result.qrCodeData, {
          width: 400,
          margin: 2,
          color: {
            dark: '#1f2937',
            light: '#ffffff'
          }
        });

        setQrDataUrl(dataUrl);
        setMessage(`QRCode gerado com sucesso para ${visitorName}!`);
        setTokenCreatedAt(new Date());
        setTimeLeft(30);
        
        // Limpar formulário
        setVisitorName('');
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

  const visitorIcon = (
    <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  );

  const userIcon = (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );

  const getBackUrl = () => {
    if (user?.tipo === 'admin') {
      return '/admin-portal';
    } else if (user?.tipo === 'porteiro') {
      return '/porteiro-portal';
    } else if (user?.tipo === 'vendedor') {
      return '/vendedor-portal';
    } else {
      return '/';
    }
  };

  const getBackText = () => {
    if (user?.tipo === 'admin' || user?.tipo === 'porteiro' || user?.tipo === 'vendedor') {
      return 'Voltar ao Portal';
    } else {
      return 'Sair do Sistema';
    }
  };

  return (
    <ProtectedRoute allowedTypes={['admin', 'porteiro', 'vendedor', 'colaborador']}>
      <BaseLayout
        title="QRCode para Visitante"
        description="Gere tokens de acesso temporário para visitantes (válido por 30 segundos)"
        icon={visitorIcon}
        bgColor="from-purple-50 via-violet-50 to-indigo-50"
        backUrl={getBackUrl()}
        backText={getBackText()}
        maxWidth="lg"
      >
        <Card>
          {/* Informações do usuário */}
          {user && (
            <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-violet-50 rounded-xl border border-purple-100">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-purple-900">
                    {user.nome} {user.sobrenome}
                  </h3>
                  <p className="text-purple-600 text-sm">{user.tipo}</p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Info card */}
            <div className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl border border-yellow-100">
              <div className="flex items-start space-x-3">
                <svg className="w-6 h-6 text-orange-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h4 className="font-semibold text-orange-800 mb-1">QRCode Temporário para Visitante</h4>
                  <p className="text-orange-700 text-sm">
                    Gere um token de acesso temporário para visitantes. O QRCode será válido por apenas 30 segundos 
                    e pode ser usado apenas uma vez. O visitante receberá automaticamente o cargo "Visitante".
                  </p>
                </div>
              </div>
            </div>

            {/* Campo do formulário */}
            <div>
              <Input
                label="Nome do Visitante"
                name="visitorName"
                type="text"
                value={visitorName}
                onChange={(e) => setVisitorName(e.target.value)}
                placeholder="Ex: João Silva"
                required
                icon={userIcon}
                helpText="Nome completo do visitante"
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
                    Gerar QRCode para Visitante
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
                  QRCode para Visitante Gerado
                </h3>
                
                {/* Timer */}
                {timeLeft > 0 && (
                  <div className="mb-4 p-4 bg-gradient-to-r from-red-50 to-orange-50 rounded-xl border border-red-100">
                    <div className="flex items-center justify-center space-x-2 mb-2">
                      <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-red-700 font-medium">Tempo restante:</span>
                      <span className="text-2xl font-bold text-red-600">{timeLeft}s</span>
                    </div>
                    <div className="w-full bg-red-200 rounded-full h-2">
                      <div 
                        className="bg-red-500 h-2 rounded-full transition-all duration-1000"
                        style={{ width: `${(timeLeft / 30) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                <div className="inline-block p-4 bg-white rounded-xl shadow-lg border border-gray-200">
                  <img 
                    src={qrDataUrl} 
                    alt="QRCode para Visitante" 
                    className="mx-auto"
                  />
                </div>
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">
                    <strong>Instruções:</strong> Mostre este QRCode para o visitante imediatamente. 
                    O código expira em 30 segundos e pode ser usado apenas uma vez.
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    💡 O visitante será automaticamente registrado com o cargo "Visitante"
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
