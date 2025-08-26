"use client";
import { useState, useEffect, useRef, useCallback } from 'react';
import Webcam from 'react-webcam';
import { BrowserQRCodeReader } from '@zxing/browser';

interface QRScannerMobileProps {
  onQRCodeDetected: (qrData: string) => void;
  onError?: (error: string) => void;
}

export default function QRScannerMobile({ onQRCodeDetected, onError }: QRScannerMobileProps) {
  const [error, setError] = useState<string>('');
  const [isScanning, setIsScanning] = useState(true);
  const [lastQRCode, setLastQRCode] = useState<string>('');
  const [scanCount, setScanCount] = useState(0);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [deviceId, setDeviceId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const codeReader = useRef<BrowserQRCodeReader | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Configuração da webcam otimizada para mobile
  const videoConstraints = {
    width: { ideal: 1280 },
    height: { ideal: 720 },
    facingMode: { ideal: 'environment' } // Câmera traseira preferencialmente
  };

  // Inicializar câmeras
  const handleDevices = useCallback((mediaDevices: MediaDeviceInfo[]) => {
    console.log('📱 Câmeras encontradas:', mediaDevices.length);
    const videoDevices = mediaDevices.filter(({ kind }) => kind === 'videoinput');
    setDevices(videoDevices);
    
    // Tentar usar câmera traseira primeiro
    const backCamera = videoDevices.find(device => 
      device.label.toLowerCase().includes('back') ||
      device.label.toLowerCase().includes('traseira') ||
      device.label.toLowerCase().includes('environment') ||
      device.label.toLowerCase().includes('rear')
    );
    
    if (backCamera) {
      setDeviceId(backCamera.deviceId);
      console.log('📱 🎯 Usando câmera traseira:', backCamera.label);
    } else if (videoDevices.length > 0) {
      setDeviceId(videoDevices[0].deviceId);
      console.log('📱 📹 Usando primeira câmera:', videoDevices[0].label);
    }
  }, []);

  useEffect(() => {
    console.log('📱 🎬 QRScanner Mobile montado!');
    
    // Inicializar ZXing
    codeReader.current = new BrowserQRCodeReader();
    
    // Listar dispositivos
    navigator.mediaDevices.enumerateDevices().then(handleDevices);
    
    return () => {
      console.log('📱 🧹 QRScanner desmontado');
      cleanup();
    };
  }, [handleDevices]);

  // Iniciar scanning quando webcam estiver pronta
  useEffect(() => {
    if (deviceId && !isLoading) {
      startScanning();
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [deviceId, isLoading]);

  const startScanning = useCallback(() => {
    if (!isScanning || !codeReader.current) return;
    
    console.log('📱 🔍 Iniciando scanning...');
    
    // Limpar intervalo anterior
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    // Escanear a cada 500ms
    intervalRef.current = setInterval(() => {
      scanFrame();
    }, 500);
    
  }, [isScanning]);

  const scanFrame = useCallback(() => {
    if (!webcamRef.current || !canvasRef.current || !codeReader.current || !isScanning) {
      return;
    }

    try {
      const video = webcamRef.current.video;
      const canvas = canvasRef.current;
      
      if (!video || video.readyState !== 4) {
        return;
      }

      const context = canvas.getContext('2d');
      if (!context) return;

      // Definir tamanho do canvas
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Desenhar frame atual no canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Tentar decodificar QR code usando canvas como fonte
      // Criar URL da imagem do canvas
      canvas.toBlob((blob) => {
        if (blob && codeReader.current) {
          const url = URL.createObjectURL(blob);
          codeReader.current.decodeFromImageUrl(url)
            .then((result: any) => {
              if (result) {
                handleQRCodeDetected(result.getText());
              }
              URL.revokeObjectURL(url);
            })
            .catch((err: any) => {
              URL.revokeObjectURL(url);
              // Ignorar erros de "não encontrado" - são normais
              if (!err.message.includes('No QR code found')) {
                console.warn('📱 ⚠️ Erro de scanning:', err.message);
              }
            });
        }
      }, 'image/jpeg', 0.8);

    } catch (error) {
      console.warn('📱 ⚠️ Erro ao processar frame:', error);
    }
  }, [isScanning]);

  const handleQRCodeDetected = useCallback((qrData: string) => {
    if (!qrData || qrData === lastQRCode) return;
    
    console.log('📱 ✅ QR Code detectado:', qrData);
    setLastQRCode(qrData);
    setScanCount(prev => prev + 1);
    
    // Pausar scanning temporariamente
    setIsScanning(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    // Enviar para processamento
    onQRCodeDetected(qrData);
    
    // Reiniciar scanning após 3 segundos
    setTimeout(() => {
      console.log('📱 🔄 Reiniciando scanner...');
      setIsScanning(true);
      setLastQRCode('');
    }, 3000);
  }, [lastQRCode, onQRCodeDetected]);

  const cleanup = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    if (codeReader.current) {
      codeReader.current = null;
    }
  };

  const handleWebcamError = (error: string | DOMException) => {
    console.error('📱 ❌ Erro na webcam:', error);
    const errorMsg = typeof error === 'string' ? error : `Erro na câmera: ${error.message}`;
    setError(errorMsg);
    onError?.(errorMsg);
    setIsLoading(false);
  };

  const handleWebcamReady = () => {
    console.log('📱 ✅ Webcam pronta!');
    setIsLoading(false);
    setError('');
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
              setIsLoading(true);
              window.location.reload();
            }}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Recarregar página
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="w-full h-full bg-gray-100 rounded-xl flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <div className="text-gray-600 mb-2">🎥 Inicializando câmera...</div>
          <div className="text-gray-500 text-sm">Mobile Scanner</div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-black rounded-xl overflow-hidden relative">
      {/* Webcam component */}
      <Webcam
        ref={webcamRef}
        audio={false}
        videoConstraints={deviceId ? { ...videoConstraints, deviceId } : videoConstraints}
        onUserMedia={handleWebcamReady}
        onUserMediaError={handleWebcamError}
        className="w-full h-full object-cover"
        style={{ transform: 'scaleX(-1)' }} // Espelhar para melhor UX
        screenshotFormat="image/jpeg"
        screenshotQuality={0.8}
      />

      {/* Canvas oculto para processamento */}
      <canvas
        ref={canvasRef}
        className="hidden"
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
              📱 Mobile Scanner
            </div>
          </div>
        </div>
      </div>

      {/* Status overlay */}
      <div className="absolute top-4 left-4 bg-green-600/80 text-white px-3 py-1 rounded-full text-sm z-10">
        📱 {isScanning ? 'Ativo' : 'Pausado'}
      </div>

      {/* Câmera info */}
      <div className="absolute top-4 right-4 bg-blue-600/80 text-white px-3 py-1 rounded-full text-xs z-10">
        🎥 {devices.length} câmeras
      </div>

      {/* Switch camera button */}
      {devices.length > 1 && (
        <button
          onClick={() => {
            const currentIndex = devices.findIndex(device => device.deviceId === deviceId);
            const nextIndex = (currentIndex + 1) % devices.length;
            setDeviceId(devices[nextIndex].deviceId);
            console.log('📱 🔄 Trocando para:', devices[nextIndex].label);
          }}
          className="absolute bottom-4 right-4 bg-white/20 text-white p-3 rounded-full backdrop-blur-sm z-10"
        >
          🔄
        </button>
      )}
    </div>
  );
}
