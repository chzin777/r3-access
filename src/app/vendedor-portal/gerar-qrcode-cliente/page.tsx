"use client";
import { useState } from "react";
import Card from "@/components/UI/Card";
import Button from "@/components/UI/Button";
import BaseLayout from "@/components/Layout/BaseLayout";
import QRCode from "qrcode";
import { createClientToken } from "@/lib/tokenUtils";
import { useAuth } from "@/hooks/useAuth";

export default function GerarQRCodeClientePage() {
  const [nome, setNome] = useState("");
  const [nf, setNf] = useState("");
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);
  const [qrCodeImage, setQrCodeImage] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  async function handleGerarQRCode(e: React.FormEvent) {
    e.preventDefault();
    if (!user?.id) return;
    
    setIsLoading(true);
    try {
      // Criar token de cliente no banco
      const tokenData = await createClientToken(nome, nf, user.id);
      if (tokenData) {
        setQrCodeData(tokenData.qrCodeData);
        
        // Gerar QRCode visual
        const qrImage = await QRCode.toDataURL(tokenData.qrCodeData, {
          width: 400,
          margin: 2,
          color: {
            dark: '#1f2937',
            light: '#ffffff'
          }
        });
        setQrCodeImage(qrImage);
      }
    } catch (error) {
      console.error('Erro ao gerar QRCode de cliente:', error);
      setQrCodeImage("");
    } finally {
      setIsLoading(false);
    }
  }

  const qrCodeIcon = (
    <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
    </svg>
  );

  return (
    <BaseLayout
      title="Gerar QRCode para Cliente"
      description="Crie um QRCode temporário para retirada de mercadoria pelo cliente."
      icon={qrCodeIcon}
      bgColor="from-blue-50 via-indigo-50 to-purple-50"
      maxWidth="md"
      backUrl="/vendedor-portal"
      backText="Voltar ao Portal"
    >
      <Card className="mb-8">
        <form onSubmit={handleGerarQRCode} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Cliente</label>
            <input
              type="text"
              value={nome}
              onChange={e => setNome(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 text-black"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nota Fiscal (NF)</label>
            <input
              type="text"
              value={nf}
              onChange={e => setNf(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 text-black"
              required
            />
          </div>
          <Button type="submit" variant="primary" fullWidth disabled={isLoading}>
            {isLoading ? "Gerando..." : "Gerar QRCode"}
          </Button>
        </form>
      </Card>
      {qrCodeImage && (
        <Card className="text-center">
          {/* QRCode Container */}
          <div className="mb-8">
            <div className="relative w-72 h-72 mx-auto">
              {/* Main QR container */}
              <div className="w-full h-full bg-gradient-to-br from-white to-gray-50 rounded-3xl flex items-center justify-center border-4 border-blue-200 shadow-2xl relative overflow-hidden">
                {/* Animated border */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 rounded-3xl opacity-20 animate-pulse"></div>
                
                {/* QR Code */}
                <div className="relative z-10 text-center">
                  <div className="w-48 h-48 mx-auto bg-white rounded-2xl shadow-lg border-2 border-gray-200 overflow-hidden mb-4">
                    <img 
                      src={qrCodeImage} 
                      alt="QR Code do Cliente" 
                      className="w-full h-full object-contain"
                    />
                  </div>
                  
                  {/* Security badge */}
                  <div className="inline-flex items-center space-x-2 px-3 py-1 bg-green-100 rounded-full">
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    <span className="text-green-700 text-xs font-medium">Uso Único</span>
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
          
          {/* Token Info */}
          <div className="mb-8">
            <Card className="bg-gradient-to-r from-gray-50 to-blue-50 border border-gray-200">
              <div className="text-center">
                <p className="text-sm font-medium text-gray-600 mb-3">Dados do QRCode</p>
                <div className="font-mono text-sm bg-white px-4 py-3 rounded-xl border-2 border-dashed border-gray-300 text-gray-800 shadow-inner break-all">
                  {qrCodeData}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  🔒 Cliente: {nome} | NF: {nf}
                </p>
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
                <h4 className="text-blue-800 font-semibold mb-3">Como usar este QRCode:</h4>
                <div className="space-y-2 text-sm text-blue-700">
                  <div className="flex items-center">
                    <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold mr-3">1</span>
                    Envie este QRCode ao cliente
                  </div>
                  <div className="flex items-center">
                    <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold mr-3">2</span>
                    Cliente apresenta ao porteiro na retirada
                  </div>
                  <div className="flex items-center">
                    <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold mr-3">3</span>
                    Válido para um único uso
                  </div>
                </div>
                
                <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <p className="text-yellow-800 text-xs font-medium">
                    ⚠️ Este QRCode é específico para a retirada da mercadoria e só pode ser usado uma vez
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </Card>
      )}
    </BaseLayout>
  );
}
