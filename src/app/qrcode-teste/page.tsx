"use client";
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import ProtectedRoute from '@/components/ProtectedRoute';
import BaseLayout from '@/components/Layout/BaseLayout';
import Card from '@/components/UI/Card';
import Button from '@/components/UI/Button';
import { getMasterQRCodes, generateTestQRCode } from '@/lib/tokenUtils';

export default function QRTestPage() {
  const [selectedQR, setSelectedQR] = useState<string>('');
  const { user } = useAuth();

  const masterCodes = getMasterQRCodes();

  const generateQRCodeURL = (text: string) => {
    // Usando API do QR Server para gerar QR code
    const size = '300x300';
    const encodedText = encodeURIComponent(text);
    return `https://api.qrserver.com/v1/create-qr-code/?size=${size}&data=${encodedText}&format=png`;
  };

  const qrIcon = (
    <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
    </svg>
  );

  return (
    <ProtectedRoute allowedTypes={['admin']}>
      <BaseLayout
        title="QR Codes de Teste"
        description="Gere QR codes mestres para testes e emergências"
        icon={qrIcon}
        bgColor="from-purple-50 via-indigo-50 to-blue-50"
        backUrl="/admin-portal"
        backText="Voltar ao Portal Admin"
        maxWidth="xl"
      >
        <div className="space-y-8">
          {/* QR Code Selector */}
          <Card>
            <div className="text-center">
              <h3 className="text-xl font-bold text-gray-800 mb-4">
                🔑 Códigos QR Mestres Disponíveis
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {masterCodes.map((code, index) => (
                  <Button
                    key={code}
                    onClick={() => setSelectedQR(code)}
                    variant={selectedQR === code ? "primary" : "secondary"}
                    size="md"
                    className="h-auto py-4"
                  >
                    <div className="text-center">
                      <div className="font-bold text-sm mb-1">Mestre {index + 1}</div>
                      <div className="text-xs opacity-75 break-all">{code}</div>
                    </div>
                  </Button>
                ))}
              </div>

              {!selectedQR && (
                <div className="text-gray-500 text-sm">
                  Selecione um código acima para gerar o QR Code
                </div>
              )}
            </div>
          </Card>

          {/* QR Code Display */}
          {selectedQR && (
            <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
              <div className="text-center">
                <h3 className="text-xl font-bold text-green-800 mb-4">
                  📱 QR Code Gerado
                </h3>
                
                {/* QR Code Image */}
                <div className="mb-6">
                  <div className="inline-block p-4 bg-white rounded-xl shadow-lg">
                    <img
                      src={generateQRCodeURL(selectedQR)}
                      alt={`QR Code: ${selectedQR}`}
                      className="w-64 h-64 mx-auto"
                    />
                  </div>
                </div>

                {/* Code Info */}
                <div className="mb-6 p-4 bg-green-100 rounded-lg">
                  <div className="text-green-800 font-bold mb-2">Código Selecionado:</div>
                  <div className="text-green-700 font-mono text-sm break-all bg-white px-3 py-2 rounded">
                    {selectedQR}
                  </div>
                </div>

                {/* Instructions */}
                <div className="text-left bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-bold text-blue-800 mb-2">📋 Como usar:</h4>
                  <ul className="text-blue-700 text-sm space-y-1">
                    <li>• Este QR code funciona independente do banco de dados</li>
                    <li>• Pode ser usado para testes e situações de emergência</li>
                    <li>• Sempre retorna "ACESSO MESTRE - Administrador do Sistema"</li>
                    <li>• Registra o acesso no log como "master_access_granted"</li>
                  </ul>
                </div>

                {/* Actions */}
                <div className="mt-6 space-y-3">
                  <Button
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = generateQRCodeURL(selectedQR);
                      link.download = `qr-code-mestre-${selectedQR}.png`;
                      link.click();
                    }}
                    variant="success"
                    size="md"
                    icon={
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    }
                  >
                    Baixar QR Code
                  </Button>
                  
                  <Button
                    onClick={() => {
                      navigator.clipboard.writeText(selectedQR);
                      alert('Código copiado para a área de transferência!');
                    }}
                    variant="secondary"
                    size="md"
                    icon={
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    }
                  >
                    Copiar Código
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Warning */}
          <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
            <div className="flex items-start space-x-3">
              <svg className="w-6 h-6 text-yellow-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <div>
                <h4 className="text-yellow-800 font-semibold mb-2">⚠️ Aviso de Segurança:</h4>
                <div className="text-yellow-700 text-sm space-y-1">
                  <p>• Estes códigos devem ser usados apenas para testes e emergências</p>
                  <p>• Mantenha estes códigos em segurança e não os compartilhe desnecessariamente</p>
                  <p>• Todos os acessos com códigos mestres são registrados no log do sistema</p>
                  <p>• Em produção, considere desabilitar ou alterar estes códigos</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </BaseLayout>
    </ProtectedRoute>
  );
}
