"use client";
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import ProtectedRoute from '@/components/ProtectedRoute';
import BaseLayout from '@/components/Layout/BaseLayout';
import Card from '@/components/UI/Card';
import Button from '@/components/UI/Button';
import dynamic from 'next/dynamic';
import { BarcodeStringFormat } from '@/components/BarcodeStringFormat';
import { validateScannedToken, getTokenStats, TokenValidationResult } from '@/lib/tokenUtils';

const BarcodeScanner = dynamic(() => import('@/components/BarcodeScanner').then(mod => mod.BarcodeScanner), { ssr: false });

function ScanContent() {
  const [isScanning, setIsScanning] = useState(true);
  const [result, setResult] = useState<TokenValidationResult | null>(null);
  const [stats, setStats] = useState({ activeTokens: 0, todayScans: 0, successRate: 0 });
  const [scannerKey, setScannerKey] = useState(0);
  const searchParams = useSearchParams();
  const { user } = useAuth();
  
  const userType = user?.tipo || null;
  const userId = user?.id || '';
  
  useEffect(() => {
    // Carregar estatísticas
    loadStats();
  }, [user]);

  const loadStats = async () => {
    try {
      const tokenStats = await getTokenStats();
      setStats(tokenStats);
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  };

  const getBackLink = () => {
    if (userType === 'admin') {
      return '/admin-portal';
    } else {
      return '/porteiro-portal';
    }
  };

  const getBackText = () => {
    if (userType === 'admin') {
      return 'Voltar ao Portal Admin';
    } else {
      return 'Voltar ao Portal';
    }
  };
  
  const handleScanSuccess = async (qrData: string) => {
    if (!qrData) return;
    
    console.log('🔍 QR Code recebido:', qrData);
    
    try {
      // Validar token usando função real
      const validation = await validateScannedToken(qrData, userId);
      console.log('✅ Resultado da validação:', validation);
      setResult(validation);
      
      // Atualizar estatísticas
      await loadStats();
    } catch (error) {
      console.error('❌ Erro ao validar token:', error);
      setResult({
        isValid: false,
        errorMessage: 'Erro ao processar QRCode. Tente novamente.'
      });
    }
  };
  
  const handleScanError = (error: string) => {
    console.error('Erro no scanner:', error);
    setResult({
      isValid: false,
      errorMessage: error
    });
  };
  
  const startScanning = () => {
    setResult(null);
    // Forçar reinicialização do scanner
    setIsScanning(true);
    setScannerKey(prev => prev + 1);
  };
  
  const stopScanning = () => {
    setIsScanning(false);
  };

  const scannerIcon = (
    <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );

  return (
    <ProtectedRoute allowedTypes={['admin', 'porteiro']}>
      <BaseLayout
        title="Scanner QRCode"
        description="Valide o acesso dos colaboradores de forma rápida e segura"
        icon={scannerIcon}
        bgColor="from-yellow-50 via-orange-50 to-amber-50"
        backUrl={getBackLink()}
        backText={getBackText()}
        maxWidth="lg"
      >
        <Card className="text-center">
          {/* Scanner Area */}
          <div className="mb-8">
            <div className="relative w-full h-96 mx-auto bg-black rounded-xl overflow-hidden flex items-center justify-center">
              {/* BarcodeScanner com ZXing + react-webcam */}
              <BarcodeScanner
                onUpdate={(err, result) => {
                  if (err) {
                    if (typeof err === 'string') {
                      handleScanError(err);
                    } else if (err instanceof DOMException) {
                      handleScanError(err.message);
                    } else if (err && typeof err === 'object' && 'message' in err) {
                      handleScanError((err as any).message);
                    } else {
                      handleScanError('Erro desconhecido');
                    }
                  } else if (result && result.getText) {
                    handleScanSuccess(result.getText());
                  }
                }}
                onError={(err) => {
                  if (typeof err === 'string') {
                    handleScanError(err);
                  } else if (err instanceof DOMException) {
                    handleScanError(err.message);
                  } else {
                    handleScanError('Erro desconhecido');
                  }
                }}
                formats={[BarcodeStringFormat.QR_CODE]}
                width={"100%"}
                height={"100%"}
                delay={500}
                videoConstraints={{ facingMode: 'environment' }}
              />
            </div>
          </div>
          
          {/* Controls */}
          <div className="mb-8">
            <div className="space-y-4">
              <div className="inline-flex items-center px-6 py-3 bg-green-100 rounded-full">
                <svg className="animate-pulse -ml-1 mr-3 h-5 w-5 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="text-green-700 font-medium">Scanner Simples ativo - Posicione o QRCode na câmera</span>
              </div>
              
              {/* Botão de teste */}
              <div className="text-center">
                <Button
                  onClick={() => handleScanSuccess('MASTER_ACCESS_2025')}
                  variant="secondary"
                  size="sm"
                  className="text-xs"
                >
                  🧪 Testar com QR Mestre
                </Button>
              </div>
            </div>
          </div>
          
          {/* Result Display */}
          {result && (
            <Card className={`mb-8 ${result.isValid ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200' : 'bg-gradient-to-r from-red-50 to-pink-50 border-red-200'}`}>
              <div className="text-center">
                {/* Result icon */}
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${result.isValid ? 'bg-green-100' : 'bg-red-100'}`}>
                  {result.isValid ? (
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ) : (
                    <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                </div>

                {/* Result title */}
                <h3 className={`text-2xl font-bold mb-4 ${result.isValid ? 'text-green-800' : 'text-red-800'}`}>
                  {result.isValid ? 'Verificado ✅' : '❌ Acesso Negado'}
                </h3>
                
                {/* User info for valid access */}
                {result.isValid && result.userData && (
                  <div className="mb-6">
                    <div className="flex items-center justify-center space-x-4 mb-4">
                      <div className="w-20 h-20 bg-gray-200 rounded-full overflow-hidden shadow-lg">
                        {result.userData.foto_url ? (
                          <img src={result.userData.foto_url} alt="Foto do usuário" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-indigo-100">
                            <svg className="w-10 h-10 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <p className="text-green-800 font-bold text-xl">{result.userData.nome} {result.userData.sobrenome}</p>
                      <p className="text-green-600 font-medium text-lg">{result.userData.cargo}</p>
                      <div className="flex items-center justify-center space-x-4 text-sm text-green-600 mt-4">
                        <span>🕐 {new Date().toLocaleTimeString('pt-BR')}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Error info for invalid access */}
                {!result.isValid && (
                  <div className="mb-6">
                    <p className="text-red-700 font-bold text-lg mb-2">
                      {result.errorMessage === 'Token expirado' ? 'QR Code expirado' :
                       result.errorMessage === 'Token inválido ou expirado' ? 'QR Code inválido' :
                       result.errorMessage === 'Formato de QRCode inválido' ? 'QR Code inválido' :
                       result.errorMessage?.includes('já utilizado') ? 'QR Code já utilizado' :
                       'QR Code inválido'}
                    </p>
                    <p className="text-red-600 text-sm">Horário: {new Date().toLocaleTimeString('pt-BR')}</p>
                  </div>
                )}
                
                {/* Action button */}
                <Button
                  onClick={() => {
                    setResult(null);
                    startScanning();
                  }}
                  variant={result.isValid ? "success" : "danger"}
                  size="md"
                  icon={
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  }
                >
                  Escanear Próximo QR Code
                </Button>
              </div>
            </Card>
          )}

          {/* Instructions */}
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 text-left">
            <div className="flex items-start space-x-3">
              <svg className="w-6 h-6 text-blue-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h4 className="text-blue-800 font-semibold mb-3">Instruções de uso:</h4>
                <div className="space-y-2 text-sm text-blue-700">
                  <div className="flex items-center">
                    <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold mr-3">1</span>
                    A câmera inicia automaticamente ao carregar a página
                  </div>
                  <div className="flex items-center">
                    <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold mr-3">2</span>
                    Posicione o QRCode na área de escaneamento
                  </div>
                  <div className="flex items-center">
                    <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold mr-3">3</span>
                    Aguarde a validação automática e resultado
                  </div>
                  <div className="flex items-center">
                    <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold mr-3">4</span>
                    Use o botão "Testar com QR Mestre" para testar o sistema
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </Card>
      </BaseLayout>
    </ProtectedRoute>
  );
}

export default function ScanPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-orange-50 to-amber-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-yellow-500"></div>
      </div>
    }>
      <ScanContent />
    </Suspense>
  );
}
