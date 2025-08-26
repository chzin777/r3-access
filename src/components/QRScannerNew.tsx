"use client";
import { useState, useEffect } from 'react';
import QrScanner from 'react-qr-scanner';

interface QRScannerNewProps {
  onQRCodeDetected: (qrData: string) => void;
  onError?: (error: string) => void;
}

export default function QRScannerNew({ onQRCodeDetected, onError }: QRScannerNewProps) {
  const [error, setError] = useState<string>('');
  const [isScanning, setIsScanning] = useState(true);
  const [lastQRCode, setLastQRCode] = useState<string>('');
  const [scanCount, setScanCount] = useState(0);

  // Cleanup
  useEffect(() => {
    console.log('📱 🎬 QRScanner (react-qr-scanner) montado!');
    
    return () => {
      console.log('📱 🧹 QRScanner desmontado');
    };
  }, []);

  const handleScan = (result: any) => {
    if (result && result.text) {
      const qrData = result.text;
      console.log('📱 ✅ QR Code detectado (react-qr-scanner):', qrData);
      
      // Evitar detecções duplicadas
      if (qrData !== lastQRCode) {
        setLastQRCode(qrData);
        setScanCount(prev => prev + 1);
        
        // Pausar scanning temporariamente
        setIsScanning(false);
        
        // Enviar para processamento
        onQRCodeDetected(qrData);
        
        // Reiniciar scanning após 3 segundos
        setTimeout(() => {
          console.log('📱 🔄 Reiniciando scanner...');
          setIsScanning(true);
          setLastQRCode('');
        }, 3000);
      }
    }
  };

  const handleError = (error: any) => {
    console.error('📱 ❌ Erro no scanner:', error);
    const errorMsg = `Erro na câmera: ${error?.message || error}`;
    setError(errorMsg);
    onError?.(errorMsg);
  };

  if (error) {
    return (
      <div className="w-full h-full bg-red-50 rounded-xl flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-red-500 mb-2">❌ Erro na câmera</div>
          <div className="text-red-700 text-sm mb-4">{error}</div>
          <button
            onClick={() => {
              setError('');
              setIsScanning(true);
            }}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  const previewStyle = {
    height: '100%',
    width: '100%',
    objectFit: 'cover' as const,
  };

  const qrScannerProps = {
    delay: 300, // 300ms entre scans para melhor performance
    style: previewStyle,
    onError: handleError,
    onScan: isScanning ? handleScan : null, // Só scaneia se estiver ativo
    constraints: {
      video: {
        facingMode: 'environment', // Câmera traseira preferencialmente
        width: { ideal: 1280 },
        height: { ideal: 720 },
      }
    }
  };

  return (
    <div className="w-full h-full bg-black rounded-xl overflow-hidden relative">
      {/* QR Scanner usando react-qr-scanner */}
      <QrScanner {...qrScannerProps} />

      {/* QR Code target overlay */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="relative">
          {/* Quadrado de mira */}
          <div className="w-64 h-64 border-2 border-white/50 rounded-lg relative">
            {/* Cantos do scanner */}
            <div className="absolute top-0 left-0 w-6 h-6 border-l-4 border-t-4 border-green-400"></div>
            <div className="absolute top-0 right-0 w-6 h-6 border-r-4 border-t-4 border-green-400"></div>
            <div className="absolute bottom-0 left-0 w-6 h-6 border-l-4 border-b-4 border-green-400"></div>
            <div className="absolute bottom-0 right-0 w-6 h-6 border-r-4 border-b-4 border-green-400"></div>
            
            {/* Linha de scan animada */}
            {isScanning && (
              <div className="absolute inset-x-2 top-1/2 h-0.5 bg-green-400 animate-pulse"></div>
            )}
          </div>
          
          {/* Instrução */}
          <div className="text-center mt-4 text-white bg-black/50 px-4 py-2 rounded-full">
            {isScanning ? `Escaneando... (${scanCount} detectados)` : 'Processando QR Code...'}
            <div className="text-xs mt-1 opacity-75">
              📱 Powered by react-qr-scanner
            </div>
          </div>
        </div>
      </div>

      {/* Status overlay */}
      <div className="absolute top-4 left-4 bg-green-600/80 text-white px-3 py-1 rounded-full text-sm z-10">
        📱 {isScanning ? 'Ativo' : 'Pausado'}
      </div>
    </div>
  );
}
