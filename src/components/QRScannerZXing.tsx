"use client";
import { useState, useEffect, useRef } from 'react';
import { BrowserQRCodeReader } from '@zxing/browser';

interface QRScannerZXingProps {
  onQRCodeDetected: (qrData: string) => void;
  onError?: (error: string) => void;
}

export default function QRScannerZXing({ onQRCodeDetected, onError }: QRScannerZXingProps) {
  const [error, setError] = useState<string>('');
  const [isScanning, setIsScanning] = useState(true);
  const [lastQRCode, setLastQRCode] = useState<string>('');
  const [scanCount, setScanCount] = useState(0);
  const [deviceId, setDeviceId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const codeReader = useRef<BrowserQRCodeReader | null>(null);

  // Inicializar o scanner
  useEffect(() => {
    console.log('📱 🎬 QRScanner (ZXing) montado!');
    initializeScanner();
    
    return () => {
      console.log('📱 🧹 QRScanner desmontado');
      cleanup();
    };
  }, []);

  const initializeScanner = async () => {
    try {
      setIsLoading(true);
      codeReader.current = new BrowserQRCodeReader();
      
      // Listar câmeras disponíveis
      const videoDevices = await BrowserQRCodeReader.listVideoInputDevices();
      console.log('📱 📹 Câmeras encontradas:', videoDevices.length);
      
      if (videoDevices.length === 0) {
        throw new Error('Nenhuma câmera encontrada');
      }
      
      // Tentar usar câmera traseira primeiro
      let selectedDevice = videoDevices.find((device: any) => 
        device.label.toLowerCase().includes('back') || 
        device.label.toLowerCase().includes('traseira') ||
        device.label.toLowerCase().includes('environment')
      );
      
      // Se não encontrar câmera traseira, usar a primeira disponível
      if (!selectedDevice) {
        selectedDevice = videoDevices[0];
      }
      
      setDeviceId(selectedDevice.deviceId);
      console.log('📱 🎯 Câmera selecionada:', selectedDevice.label);
      
      await startScanning(selectedDevice.deviceId);
      
    } catch (err: any) {
      console.error('📱 ❌ Erro ao inicializar scanner:', err);
      const errorMsg = `Erro ao inicializar câmera: ${err.message}`;
      setError(errorMsg);
      onError?.(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const startScanning = async (deviceId: string) => {
    if (!codeReader.current || !videoRef.current) return;
    
    try {
      console.log('📱 🎥 Iniciando scanning...');
      
      await codeReader.current.decodeFromVideoDevice(
        deviceId,
        videoRef.current,
        (result, error) => {
          if (result) {
            const qrData = result.getText();
            console.log('📱 ✅ QR Code detectado (ZXing):', qrData);
            handleQRCodeDetected(qrData);
          }
          
          if (error && !(error instanceof Error && error.name === 'NotFoundException')) {
            console.warn('📱 ⚠️ Erro de scanning (não crítico):', error.message);
          }
        }
      );
      
      setError('');
      console.log('📱 🟢 Scanner ativo');
      
    } catch (err: any) {
      console.error('📱 ❌ Erro ao iniciar scanning:', err);
      const errorMsg = `Erro ao iniciar scanner: ${err.message}`;
      setError(errorMsg);
      onError?.(errorMsg);
    }
  };

  const handleQRCodeDetected = (qrData: string) => {
    if (!qrData || qrData === lastQRCode) return;
    
    console.log('📱 🎯 Novo QR Code:', qrData);
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
  };

  const cleanup = () => {
    if (codeReader.current) {
      // O ZXing não tem método reset, vamos limpar de outra forma
      try {
        // Para o streaming se ainda estiver ativo
        if (videoRef.current && videoRef.current.srcObject) {
          const stream = videoRef.current.srcObject as MediaStream;
          stream.getTracks().forEach(track => track.stop());
          videoRef.current.srcObject = null;
        }
      } catch (error) {
        console.log('📱 ⚠️ Erro ao limpar stream:', error);
      }
      codeReader.current = null;
    }
  };

  const handleRetry = async () => {
    setError('');
    setIsLoading(true);
    cleanup();
    await initializeScanner();
  };

  if (isLoading) {
    return (
      <div className="w-full h-full bg-gray-100 rounded-xl flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <div className="text-gray-600 mb-2">🎥 Inicializando câmera...</div>
          <div className="text-gray-500 text-sm">Usando ZXing Scanner</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-full bg-red-50 rounded-xl flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-red-500 mb-2">❌ Erro na câmera</div>
          <div className="text-red-700 text-sm mb-4">{error}</div>
          <button
            onClick={handleRetry}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-black rounded-xl overflow-hidden relative">
      {/* Video element para o scanner */}
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        style={{ transform: 'scaleX(-1)' }} // Espelhar para melhor UX
        autoPlay
        playsInline
        muted
      />

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
              📱 Powered by ZXing
            </div>
          </div>
        </div>
      </div>

      {/* Status overlay */}
      <div className="absolute top-4 left-4 bg-green-600/80 text-white px-3 py-1 rounded-full text-sm z-10">
        📱 {isScanning ? 'Ativo' : 'Pausado'}
      </div>

      {/* Device info */}
      {deviceId && (
        <div className="absolute top-4 right-4 bg-blue-600/80 text-white px-3 py-1 rounded-full text-xs z-10">
          🎥 Câmera ativa
        </div>
      )}
    </div>
  );
}
