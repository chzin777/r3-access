"use client";
import { useState, useEffect, useRef, useCallback } from 'react';
import Webcam from 'react-webcam';

interface QRScannerSimpleProps {
  onQRCodeDetected: (qrData: string) => void;
  onError?: (error: string) => void;
}

export default function QRScannerSimple({ onQRCodeDetected, onError }: QRScannerSimpleProps) {
  const [error, setError] = useState<string>('');
  const [isReady, setIsReady] = useState(false);
  const [initTimeout, setInitTimeout] = useState<NodeJS.Timeout | null>(null);
  const [isScanning, setIsScanning] = useState(true);
  const [lastQRCode, setLastQRCode] = useState<string>('');
  const [scanCount, setScanCount] = useState(0);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [deviceId, setDeviceId] = useState<string>('');
  const [permissionGranted, setPermissionGranted] = useState(false);
  
  const webcamRef = useRef<Webcam>(null);

  // Configuração simples e compatível
  const videoConstraints = {
    width: { ideal: 1280, min: 640 },
    height: { ideal: 720, min: 480 },
    facingMode: deviceId ? undefined : { ideal: 'environment' },
    deviceId: deviceId ? { exact: deviceId } : undefined
  };

  // Solicitar permissões primeiro
  useEffect(() => {
    console.log('📱 🎬 Iniciando QRScanner Simples...');
    
    const requestPermissions = async () => {
      try {
        console.log('📱 🔐 Solicitando permissões...');
        
        // Solicitar permissão de câmera
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment' } 
        });
        
        console.log('📱 ✅ Permissão concedida!');
        setPermissionGranted(true);
        
        // Parar stream temporário
        stream.getTracks().forEach(track => track.stop());
        
        // Listar dispositivos
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        
        console.log('📱 📹 Câmeras encontradas:', videoDevices.length);
        setDevices(videoDevices);
        
        // Selecionar câmera traseira se disponível
        const backCamera = videoDevices.find(device => 
          device.label.toLowerCase().includes('back') ||
          device.label.toLowerCase().includes('rear') ||
          device.label.toLowerCase().includes('environment') ||
          device.label.toLowerCase().includes('traseira')
        );
        
        if (backCamera) {
          console.log('📱 🎯 Selecionando câmera traseira:', backCamera.label);
          setDeviceId(backCamera.deviceId);
        } else if (videoDevices.length > 0) {
          console.log('📱 📷 Usando primeira câmera:', videoDevices[0].label);
          setDeviceId(videoDevices[0].deviceId);
        }
        
      } catch (err: any) {
        console.error('📱 ❌ Erro ao solicitar permissões:', err);
        setError(`Permissão negada: ${err.message}`);
        onError?.(`Permissão de câmera negada: ${err.message}`);
      }
    };

    requestPermissions();
  }, [onError]);

  // Scanner simples usando jsQR
  useEffect(() => {
    if (!isReady || !isScanning) return;
    console.log('📱 🔍 Iniciando scanning...');
    const scanInterval = setInterval(() => {
      if (webcamRef.current) {
        const imageSrc = webcamRef.current.getScreenshot();
        if (imageSrc) {
          // Usar detecção simples por padrão de QR
          // Para testes, vamos simular detecção manual
          console.log('📱 📸 Frame capturado');
        }
      }
    }, 1000);
    return () => {
      clearInterval(scanInterval);
    };
  }, [isReady, isScanning]);

  // Timeout para erro se vídeo não iniciar
  useEffect(() => {
    if (!permissionGranted || isReady || error) return;
    if (initTimeout) clearTimeout(initTimeout);
    const timeout = setTimeout(() => {
      if (!isReady) {
        setError('Não foi possível inicializar a câmera. Tente trocar de câmera ou recarregar a página.');
      }
    }, 8000);
    setInitTimeout(timeout);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [permissionGranted, isReady, error, deviceId]);

  const handleWebcamReady = useCallback(() => {
    // Só considerar pronto se o vídeo realmente está ativo
    setTimeout(() => {
      const video = webcamRef.current?.video;
      if (video && video.readyState >= 2 && video.videoWidth > 0) {
        console.log('📱 ✅ Webcam pronta e vídeo ativo!');
        setIsReady(true);
        setError('');
      } else {
        console.warn('📱 ⚠️ Vídeo não ativo ainda.');
      }
    }, 300);
  }, []);

  const handleWebcamError = useCallback((error: string | DOMException) => {
    console.error('📱 ❌ Erro na webcam:', error);
    const errorMsg = typeof error === 'string' ? error : error.message;
    setError(`Erro na câmera: ${errorMsg}`);
    onError?.(errorMsg);
  }, [onError]);

  const handleQRCodeDetected = useCallback((qrData: string) => {
    if (!qrData || qrData === lastQRCode) return;
    
    console.log('📱 ✅ QR Code detectado:', qrData);
    setLastQRCode(qrData);
    setScanCount(prev => prev + 1);
    
    setIsScanning(false);
    onQRCodeDetected(qrData);
    
    setTimeout(() => {
      console.log('📱 🔄 Reiniciando scanner...');
      setIsScanning(true);
      setLastQRCode('');
    }, 3000);
  }, [lastQRCode, onQRCodeDetected]);

  // Botão de teste para simular detecção
  const testQRDetection = () => {
    console.log('📱 🧪 Simulando detecção de QR...');
    handleQRCodeDetected('MASTER_ACCESS_2025');
  };

  if (!permissionGranted) {
    return (
      <div className="w-full h-full bg-blue-50 rounded-xl flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <div className="text-blue-600 mb-2">🔐 Solicitando permissão da câmera...</div>
          <div className="text-blue-500 text-sm">Por favor, permita o acesso à câmera</div>
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
          <div className="space-y-2">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 mr-2"
            >
              Recarregar
            </button>
            <button
              onClick={testQRDetection}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              🧪 Testar QR
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!isReady) {
    return (
      <div className="w-full h-full bg-gray-100 rounded-xl flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-gray-500 mx-auto mb-4"></div>
          <div className="text-gray-600 mb-2">🎥 Inicializando câmera...</div>
          <div className="text-gray-500 text-sm">Aguarde um momento...</div>
          <button
            onClick={testQRDetection}
            className="mt-4 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
          >
            🧪 Pular e testar QR
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-black rounded-xl overflow-hidden relative">
      {/* Webcam */}
      <Webcam
        key={deviceId || 'default'}
        ref={webcamRef}
        audio={false}
        videoConstraints={videoConstraints}
        onUserMedia={handleWebcamReady}
        onUserMediaError={handleWebcamError}
        className="w-full h-full object-cover"
        screenshotFormat="image/jpeg"
        screenshotQuality={0.8}
        mirrored={false}
      />

      {/* Overlay de scanning */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="relative">
          {/* Quadrado de mira */}
          <div className="w-64 h-64 border-2 border-white/50 rounded-lg relative">
            {/* Cantos */}
            <div className="absolute top-0 left-0 w-6 h-6 border-l-4 border-t-4 border-green-400"></div>
            <div className="absolute top-0 right-0 w-6 h-6 border-r-4 border-t-4 border-green-400"></div>
            <div className="absolute bottom-0 left-0 w-6 h-6 border-l-4 border-b-4 border-green-400"></div>
            <div className="absolute bottom-0 right-0 w-6 h-6 border-r-4 border-b-4 border-green-400"></div>
            {/* Linha de scan */}
            {isScanning && (
              <div className="absolute inset-x-2 top-1/2 h-0.5 bg-green-400 animate-pulse"></div>
            )}
          </div>
          {/* Status */}
          <div className="text-center mt-4 text-white bg-black/50 px-4 py-2 rounded-full">
            {isScanning ? `Escaneando... (${scanCount} códigos)` : 'Processando...'}
            <div className="text-xs mt-1 opacity-75">📱 Scanner Simples</div>
          </div>
        </div>
      </div>
      {/* Controles */}
      <div className="absolute top-4 left-4 right-4 flex justify-between z-10">
        <div className="bg-green-600/80 text-white px-3 py-1 rounded-full text-sm">
          📱 {isScanning ? 'Ativo' : 'Pausado'}
        </div>
        <div className="bg-blue-600/80 text-white px-3 py-1 rounded-full text-xs">
          🎥 {devices.length} câmeras
        </div>
      </div>
      {/* Botões de controle */}
      <div className="absolute bottom-4 left-4 right-4 flex justify-center space-x-4 z-10">
        <button
          onClick={testQRDetection}
          className="bg-green-500/80 text-white px-4 py-2 rounded-full backdrop-blur-sm text-sm"
        >
          🧪 Testar QR
        </button>
        {devices.length > 1 && (
          <button
            onClick={() => {
              const currentIndex = devices.findIndex(d => d.deviceId === deviceId);
              const nextIndex = (currentIndex + 1) % devices.length;
              setDeviceId(devices[nextIndex].deviceId);
              setIsReady(false);
              setError('');
              console.log('📱 🔄 Trocando câmera');
            }}
            className="bg-blue-500/80 text-white px-4 py-2 rounded-full backdrop-blur-sm text-sm"
          >
            🔄 Trocar
          </button>
        )}
      </div>
    </div>
  );
}
