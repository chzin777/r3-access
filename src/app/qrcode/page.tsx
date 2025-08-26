"use client";
import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import ProtectedRoute from '@/components/ProtectedRoute';
import BaseLayout from '@/components/Layout/BaseLayout';
import Card from '@/components/UI/Card';
import { createUserToken, getUserActiveToken, TokenData } from '@/lib/tokenUtils';
import QRCode from 'qrcode';

function QRCodeContent() {
  const [timeLeft, setTimeLeft] = useState(30);
  const [tokenData, setTokenData] = useState<TokenData | null>(null);
  const [qrCodeImage, setQrCodeImage] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  
  const userType = user?.tipo || null;
  const userName = user ? `${user.nome} ${user.sobrenome}` : '';
  const userId = user?.id || '';
  
  // Função para gerar novo token
  const generateNewToken = async () => {
    if (!userId) return;
    
    setIsLoading(true);
    try {
      const newToken = await createUserToken(userId, 0.5); // 0.5 minutos = 30 segundos
      if (newToken) {
        setTokenData(newToken);
        
        // Gerar QRCode visual
        const qrImage = await QRCode.toDataURL(newToken.qrCodeData, {
          width: 400,
          margin: 2,
          color: {
            dark: '#1f2937',
            light: '#ffffff'
          }
        });
        setQrCodeImage(qrImage);
        
        // Calcular tempo restante
        const secondsLeft = Math.floor((newToken.expiresAt.getTime() - Date.now()) / 1000);
        setTimeLeft(Math.max(0, secondsLeft));
      }
    } catch (error) {
      console.error('Erro ao gerar token:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Buscar token existente ou gerar novo
    const initializeToken = async () => {
      if (userId) {
        const existingToken = await getUserActiveToken(userId);
        if (existingToken && existingToken.expiresAt > new Date()) {
          setTokenData(existingToken);
          
          // Gerar QRCode visual
          const qrImage = await QRCode.toDataURL(existingToken.qrCodeData);
          setQrCodeImage(qrImage);
          
          // Calcular tempo restante
          const secondsLeft = Math.floor((existingToken.expiresAt.getTime() - Date.now()) / 1000);
          setTimeLeft(Math.max(0, secondsLeft));
        } else {
          await generateNewToken();
        }
      }
      setIsLoading(false);
    };

    if (user && userId) {
      initializeToken();
    }
  }, [user, userId]);

  useEffect(() => {
    if (!tokenData || isLoading) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Gerar novo token quando expirar
          generateNewToken();
          return 30;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [tokenData, userId, isLoading]);

  const getBackLink = () => {
    if (userType === 'admin') {
      return '/admin-portal';
    } else if (userType === 'porteiro') {
      return '/porteiro-portal';
    } else {
      return '/'; // Colaborador sai do sistema
    }
  };

  const getBackText = () => {
    if (userType === 'admin') {
      return 'Voltar ao Portal';
    } else if (userType === 'porteiro') {
      return 'Voltar ao Portal';
    } else {
      return 'Sair do Sistema';
    }
  };

  const qrCodeIcon = (
    <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
    </svg>
  );

  return (
    <ProtectedRoute>
      <BaseLayout
        title="Seu QRCode"
        description="Token de acesso temporário e seguro"
        icon={qrCodeIcon}
      bgColor="from-blue-50 via-indigo-50 to-purple-50"
      backUrl={getBackLink()}
      backText={getBackText()}
      maxWidth="lg"
    >
      <Card className="text-center">
        {/* User info */}
        {userName && (
          <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
            <div className="flex items-center justify-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-blue-800">{userName}</p>
                <p className="text-sm text-blue-600 capitalize">{userType}</p>
              </div>
            </div>
          </div>
        )}

        {/* QRCode Container */}
        <div className="mb-8">
          <div className="relative w-72 h-72 mx-auto">
            {/* Main QR container */}
            <div className="w-full h-full bg-gradient-to-br from-white to-gray-50 rounded-3xl flex items-center justify-center border-4 border-blue-200 shadow-2xl relative overflow-hidden">
              {/* Animated border */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 rounded-3xl opacity-20 animate-pulse"></div>
              
              {/* QR Code ou loading */}
              <div className="relative z-10 text-center">
                {isLoading ? (
                  <div className="w-48 h-48 mx-auto bg-white rounded-2xl shadow-lg border-2 border-dashed border-gray-300 flex items-center justify-center mb-4">
                    <div className="text-center">
                      <svg className="w-16 h-16 text-gray-400 mx-auto mb-2 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      <p className="text-gray-500 text-sm font-medium">Gerando...</p>
                    </div>
                  </div>
                ) : qrCodeImage ? (
                  <div className="w-48 h-48 mx-auto bg-white rounded-2xl shadow-lg border-2 border-gray-200 overflow-hidden mb-4">
                    <img 
                      src={qrCodeImage} 
                      alt="QR Code de Acesso" 
                      className="w-full h-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="w-48 h-48 mx-auto bg-white rounded-2xl shadow-lg border-2 border-dashed border-red-300 flex items-center justify-center mb-4">
                    <div className="text-center">
                      <svg className="w-16 h-16 text-red-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                      <p className="text-red-500 text-sm font-medium">Erro ao gerar</p>
                    </div>
                  </div>
                )}
                
                {/* Security badge */}
                <div className="inline-flex items-center space-x-2 px-3 py-1 bg-green-100 rounded-full">
                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <span className="text-green-700 text-xs font-medium">
                    {tokenData ? 'Ativo' : 'Carregando...'}
                  </span>
                </div>
              </div>
            </div>

            {/* Corner decorations */}
            <div className="absolute top-4 left-4 w-6 h-6 border-l-4 border-t-4 border-blue-400 rounded-tl-lg"></div>
            <div className="absolute top-4 right-4 w-6 h-6 border-r-4 border-t-4 border-blue-400 rounded-tr-lg"></div>
            <div className="absolute bottom-4 left-4 w-6 h-6 border-l-4 border-b-4 border-blue-400 rounded-bl-lg"></div>
            <div className="absolute bottom-4 right-4 w-6 h-6 border-r-4 border-b-4 border-blue-400 rounded-br-lg"></div>
          </div>
        </div>
        
        {/* Timer Section */}
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full mb-4 shadow-lg border-4 border-white">
            <div className="text-center">
              <span className="text-3xl font-bold text-blue-600">{timeLeft}</span>
              <div className="text-xs text-blue-500 font-medium">seg</div>
            </div>
          </div>
          
          <p className="text-gray-600 mb-4">
            Renovação automática em <span className="font-bold text-blue-600">{timeLeft} segundos</span>
          </p>
          
          {/* Progress bar */}
          <div className="w-full max-w-xs mx-auto bg-gray-200 rounded-full h-3 overflow-hidden shadow-inner">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-1000 ease-out shadow-sm"
              style={{ width: `${(timeLeft / 30) * 100}%` }}
            ></div>
          </div>
        </div>
        
        {/* Token Info */}
        <div className="mb-8">
          <Card className="bg-gradient-to-r from-gray-50 to-blue-50 border border-gray-200">
            <div className="text-center">
              <p className="text-sm font-medium text-gray-600 mb-3">Token Atual</p>
              <div className="font-mono text-lg bg-white px-4 py-3 rounded-xl border-2 border-dashed border-gray-300 text-gray-800 shadow-inner">
                {isLoading ? 'Carregando...' : (tokenData?.token.substring(0, 20) + '...' || 'Token não encontrado')}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                🔒 Criptografado e único por sessão
              </p>
              {tokenData && (
                <p className="text-xs text-blue-600 mt-1">
                  Expira em: {tokenData.expiresAt.toLocaleTimeString('pt-BR')}
                </p>
              )}
            </div>
          </Card>
        </div>
        
        {/* Instructions */}
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <svg className="w-8 h-8 text-blue-500 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="text-left">
              <h4 className="text-blue-800 font-semibold mb-3">Como usar seu QRCode:</h4>
              <div className="space-y-2 text-sm text-blue-700">
                <div className="flex items-center">
                  <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold mr-3">1</span>
                  Apresente este QRCode ao porteiro
                </div>
                <div className="flex items-center">
                  <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold mr-3">2</span>
                  Aguarde a validação automática
                </div>
                <div className="flex items-center">
                  <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold mr-3">3</span>
                  Token renovado a cada 30 segundos
                </div>
              </div>
              
              <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <p className="text-yellow-800 text-xs font-medium">
                  ⚠️ Cada token só pode ser usado uma vez para garantir máxima segurança
                </p>
              </div>
            </div>
          </div>
        </Card>
      </Card>
    </BaseLayout>
    </ProtectedRoute>
  );
}

export default function QRCodePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    }>
      <QRCodeContent />
    </Suspense>
  );
}
