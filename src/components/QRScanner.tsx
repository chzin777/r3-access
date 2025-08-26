"use client";
import { useState, useRef, useCallback, useEffect } from 'react';
import Webcam from 'react-webcam';
import jsQR from 'jsqr';

interface QRScannerProps {
  onQRCodeDetected: (qrData: string) => void;
  onError?: (error: string) => void;
}

export default function QRScanner({ onQRCodeDetected, onError }: QRScannerProps) {
  const [isScanning, setIsScanning] = useState(false); // Começa false, vai ser ativado quando câmera estiver pronta
  const [error, setError] = useState<string>('');
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [isReady, setIsReady] = useState(false);
  const [lastQRCode, setLastQRCode] = useState<string>('');
  const [scanCount, setScanCount] = useState(0);
  const [frameCount, setFrameCount] = useState(0); // Contador de frames processados
  
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Carregar lista de câmeras
  useEffect(() => {
    loadCameras();
  }, []);

  // Cleanup
  useEffect(() => {
    console.log('📱 🎬 QRScanner montado! Estados iniciais:', {
      isReady,
      isScanning,
      cameras: cameras.length,
      selectedCameraId
    });
    
    return () => {
      console.log('📱 🧹 QRScanner desmontado - limpando recursos');
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current);
      }
    };
  }, []);

  const loadCameras = async () => {
    try {
      // Solicitar permissão primeiro
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(track => track.stop());
      
      // Carregar dispositivos
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      
      console.log('📱 QRScanner - Câmeras encontradas:', videoDevices);
      setCameras(videoDevices);
      
      // Selecionar câmera traseira ou não virtual
      const rearCamera = videoDevices.find(device => 
        device.label.toLowerCase().includes('back') ||
        device.label.toLowerCase().includes('rear') ||
        device.label.toLowerCase().includes('environment')
      );
      
      const nonVirtualCamera = videoDevices.find(device => 
        !device.label.toLowerCase().includes('obs') && 
        !device.label.toLowerCase().includes('virtual')
      );
      
      if (rearCamera) {
        setSelectedCameraId(rearCamera.deviceId);
        console.log('📱 Câmera traseira selecionada:', rearCamera.label);
      } else if (nonVirtualCamera) {
        setSelectedCameraId(nonVirtualCamera.deviceId);
        console.log('📱 Câmera não virtual selecionada:', nonVirtualCamera.label);
      } else if (videoDevices.length > 0) {
        setSelectedCameraId(videoDevices[0].deviceId);
        console.log('📱 Primeira câmera selecionada:', videoDevices[0].label);
      }
      
    } catch (err) {
      console.error('📱 Erro ao carregar câmeras:', err);
      const errorMsg = `Erro ao carregar câmeras: ${err}`;
      setError(errorMsg);
      onError?.(errorMsg);
    }
  };

  const handleUserMedia = useCallback(() => {
    console.log('📱 ✅ QRScanner - Webcam pronta! Iniciando scanner automaticamente...');
    setIsReady(true);
    setError('');
    
    // Iniciar o scanner automaticamente quando a câmera estiver pronta
    setTimeout(() => {
      console.log('📱 🎬 Auto-iniciando scanner após 500ms...');
      setIsScanning(true);
      setLastQRCode('');
      setScanCount(0);
      setFrameCount(0);
    }, 500);
  }, []);

  const handleUserMediaError = useCallback((error: string | DOMException) => {
    console.error('📱 Erro da webcam:', error);
    const errorMsg = `Erro da webcam: ${error}`;
    setError(errorMsg);
    setIsReady(false);
    onError?.(errorMsg);
  }, [onError]);

  const scanForQRCode = useCallback(() => {
    console.log('📱 🔄 scanForQRCode chamado!', { isReady, isScanning, hasWebcam: !!webcamRef.current, hasCanvas: !!canvasRef.current });
    
    if (!webcamRef.current || !canvasRef.current || !isReady || !isScanning) {
      console.log('📱 ❌ Condições não atendidas para scan');
      return;
    }

    const video = webcamRef.current.video;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    console.log('📱 🎥 Estado do vídeo:', {
      hasVideo: !!video,
      hasContext: !!ctx,
      readyState: video?.readyState,
      HAVE_ENOUGH_DATA: video?.HAVE_ENOUGH_DATA,
      videoWidth: video?.videoWidth,
      videoHeight: video?.videoHeight
    });

    if (video && ctx && video.readyState === video.HAVE_ENOUGH_DATA) {
      console.log('📱 ✅ Vídeo está pronto! Iniciando processamento...');
      try {
        // Garantir que o canvas tenha o tamanho correto
        const videoWidth = video.videoWidth;
        const videoHeight = video.videoHeight;
        
        if (videoWidth === 0 || videoHeight === 0) {
          console.log('📱 ⚠️ Vídeo ainda sem dimensões válidas');
          return;
        }

        canvas.width = videoWidth;
        canvas.height = videoHeight;

        // Limpar canvas
        ctx.clearRect(0, 0, videoWidth, videoHeight);

        // Desenhar frame atual
        ctx.drawImage(video, 0, 0, videoWidth, videoHeight);

        // Aplicar melhorias na imagem para melhor detecção
        const processFrame = (flipHorizontal = false) => {
          if (flipHorizontal) {
            // Espelhar horizontalmente
            ctx.save();
            ctx.scale(-1, 1);
            ctx.drawImage(video, -videoWidth, 0, videoWidth, videoHeight);
            ctx.restore();
          } else {
            // Frame normal
            ctx.drawImage(video, 0, 0, videoWidth, videoHeight);
          }

          // Aplicar filtros para melhorar contraste
          const imageData = ctx.getImageData(0, 0, videoWidth, videoHeight);
          const data = imageData.data;

          // Aumentar contraste para melhor detecção de QR codes
          const contrast = 1.5;
          const brightness = 10;
          
          for (let i = 0; i < data.length; i += 4) {
            // RGB channels
            data[i] = Math.min(255, Math.max(0, contrast * (data[i] - 128) + 128 + brightness));     // Red
            data[i + 1] = Math.min(255, Math.max(0, contrast * (data[i + 1] - 128) + 128 + brightness)); // Green  
            data[i + 2] = Math.min(255, Math.max(0, contrast * (data[i + 2] - 128) + 128 + brightness)); // Blue
          }

          ctx.putImageData(imageData, 0, 0);
          return imageData;
        };

        // Tentar detectar QR code com diferentes processamentos
        const tryDetectQR = (imageData: ImageData, label: string) => {
          console.log(`📱 🔍 Tentando detectar QR (${label})...`);
          
          // Configurações mais agressivas para detecção
          const qrCodeOptions: Array<{ inversionAttempts: "dontInvert" | "onlyInvert" | "attemptBoth" | "invertFirst" }> = [
            { inversionAttempts: "dontInvert" },
            { inversionAttempts: "onlyInvert" }, 
            { inversionAttempts: "attemptBoth" },
            { inversionAttempts: "invertFirst" }
          ];

          for (let i = 0; i < qrCodeOptions.length; i++) {
            try {
              const qr = jsQR(imageData.data, imageData.width, imageData.height, qrCodeOptions[i]);
              if (qr && qr.data) {
                console.log(`📱 ✅ QR Code encontrado (${label}, tentativa ${i + 1}):`, qr.data);
                return qr;
              }
            } catch (err) {
              console.log(`📱 ⚠️ Erro na tentativa ${i + 1}:`, err);
            }
          }
          return null;
        };

        // Primeira tentativa: frame normal processado
        let processedImageData = processFrame(false);
        let qrCode = tryDetectQR(processedImageData, 'normal');

        // Segunda tentativa: frame espelhado processado
        if (!qrCode) {
          processedImageData = processFrame(true);
          qrCode = tryDetectQR(processedImageData, 'espelhado');
        }

        // Terceira tentativa: frame original sem processamento
        if (!qrCode) {
          ctx.drawImage(video, 0, 0, videoWidth, videoHeight);
          const rawImageData = ctx.getImageData(0, 0, videoWidth, videoHeight);
          qrCode = tryDetectQR(rawImageData, 'raw');
        }

        // Log de debug ocasional
        if (Math.random() < 0.01) {
          console.log('📱 🎬 Processando frames:', {
            dimensoes: `${videoWidth}x${videoHeight}`,
            tentativas: 'normal + espelhado + raw',
            fps: '~10fps',
            framesProcessados: frameCount
          });
        }

        // Incrementar contador de frames
        setFrameCount(prev => prev + 1);

        if (qrCode && qrCode.data) {
          // Evitar detecções duplicadas
          if (qrCode.data !== lastQRCode) {
            console.log('📱 🎯 QR Code DETECTADO:', qrCode.data);
            console.log('📱 📍 Posição do QR:', qrCode.location);
            
            setLastQRCode(qrCode.data);
            setScanCount(prev => prev + 1);
            
            // Parar o scanning temporariamente para processar
            setIsScanning(false);
            if (scanIntervalRef.current) {
              clearInterval(scanIntervalRef.current);
            }
            
            // Enviar para processamento
            onQRCodeDetected(qrCode.data);
          }
        }

      } catch (error) {
        console.error('📱 ❌ Erro no processamento do frame:', error);
      }
    } else {
      if (Math.random() < 0.001) {
        console.log('📱 ⏳ Aguardando vídeo ficar pronto...', {
          hasVideo: !!video,
          hasContext: !!ctx,
          readyState: video?.readyState,
          expected: video?.HAVE_ENOUGH_DATA
        });
      }
    }
  }, [isReady, isScanning, lastQRCode, onQRCodeDetected]);

  // Effect para iniciar scanning quando isScanning mudar para true
  useEffect(() => {
    if (isScanning && isReady && !scanIntervalRef.current) {
      console.log('📱 ⏰ Configurando interval de scan (100ms)');
      scanIntervalRef.current = setInterval(scanForQRCode, 100);
    } else if (!isScanning && scanIntervalRef.current) {
      console.log('📱 🛑 Parando interval de scan');
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
  }, [isScanning, isReady, scanForQRCode]);

  const startScanning = () => {
    console.log('📱 🚀 Iniciando scan de QR Code...');
    setIsScanning(true);
    setLastQRCode('');
    setScanCount(0);
    setFrameCount(0); // Reset contador de frames
    
    // Iniciar loop de scan
    console.log('📱 ⏰ Configurando interval de scan (100ms)');
    scanIntervalRef.current = setInterval(scanForQRCode, 100); // 10 FPS
  };

  const stopScanning = () => {
    console.log('📱 Parando scan de QR Code...');
    setIsScanning(false);
    
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
    }
  };

  // Função para reiniciar o scanning (pode ser chamada externamente)
  const restartScanning = useCallback(() => {
    console.log('📱 🔄 Reiniciando scan de QR Code...');
    setLastQRCode('');
    setTimeout(() => {
      if (isReady) {
        startScanning();
      }
    }, 2000); // Aguarda 2 segundos antes de reiniciar
  }, [isReady]);

  // Auto-reiniciar scanning após processar um QR code
  useEffect(() => {
    if (!isScanning && isReady && lastQRCode) {
      console.log('📱 ⏰ Agendando reinicialização automática...');
      const timer = setTimeout(() => {
        restartScanning();
      }, 3000); // Reinicia após 3 segundos
      
      return () => clearTimeout(timer);
    }
  }, [isScanning, isReady, lastQRCode, restartScanning]);

  if (error) {
    return (
      <div className="w-full h-full bg-red-50 rounded-xl flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-red-500 mb-2">❌ Erro na câmera</div>
          <div className="text-red-700 text-sm mb-4">{error}</div>
          <button
            onClick={() => {
              setError('');
              setIsReady(false);
              loadCameras();
            }}
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
      {/* Canvas oculto para processamento */}
      <canvas
        ref={canvasRef}
        style={{ display: 'none' }}
      />

      {/* Seletor de câmera - removido para interface mais limpa */}

      {/* Webcam */}
      {selectedCameraId && (
        <Webcam
          ref={webcamRef}
          audio={false}
          videoConstraints={{
            deviceId: selectedCameraId,
            width: 1280,
            height: 720,
            facingMode: undefined
          }}
          onUserMedia={handleUserMedia}
          onUserMediaError={handleUserMediaError}
          className="w-full h-full object-cover"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover'
          }}
        />
      )}

      {/* Loading overlay */}
      {!isReady && !error && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
          <div className="text-center text-white">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4 mx-auto"></div>
            <div>Inicializando câmera...</div>
          </div>
        </div>
      )}

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
            {isScanning ? `Analisando frames... (${frameCount} processados)` : 'Preparando scanner...'}
            {isScanning && (
              <div className="text-xs mt-1 opacity-75">
                🔍 Buscando QR codes nos pixels da imagem | Debug: F12
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Controles - removido o botão */}

      {/* Status overlay - removido para interface mais limpa */}

      {/* Debug info - removido para interface mais limpa */}
    </div>
  );
}
