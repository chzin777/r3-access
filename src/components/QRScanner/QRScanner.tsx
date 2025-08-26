"use client";
import { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';

interface QRScannerProps {
  onScanSuccess: (data: string) => void;
  onScanError?: (error: string) => void;
  isActive: boolean;
  className?: string;
}

export default function QRScanner({ 
  onScanSuccess, 
  onScanError, 
  isActive,
  className = "" 
}: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  useEffect(() => {
    console.log('🔄 QRScanner useEffect - isActive:', isActive);
    if (isActive) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isActive]);

  const startCamera = async () => {
    try {
      console.log('🎥 Iniciando câmera...');
      setIsLoading(true);
      setError('');

      // Verificar se o navegador suporta getUserMedia
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Câmera não suportada neste navegador');
      }

      console.log('🎥 Listando câmeras disponíveis...');
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      console.log('📹 Câmeras encontradas:', videoDevices);

      // Preferir câmera integrada ao invés de virtual
      const integratedCamera = videoDevices.find(device => 
        device.label.toLowerCase().includes('integrated') || 
        device.label.toLowerCase().includes('built-in') ||
        device.label.toLowerCase().includes('internal')
      );

      const excludeVirtual = videoDevices.filter(device => 
        !device.label.toLowerCase().includes('obs') &&
        !device.label.toLowerCase().includes('virtual')
      );

      let constraints: MediaStreamConstraints = {
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 }
        }
      };

      // Se encontrou câmera integrada, usar ela
      if (integratedCamera) {
        console.log('🎥 Usando câmera integrada:', integratedCamera.label);
        constraints.video = {
          deviceId: { exact: integratedCamera.deviceId },
          width: { ideal: 640 },
          height: { ideal: 480 }
        };
      } 
      // Se não, usar primeira câmera não-virtual
      else if (excludeVirtual.length > 0) {
        console.log('🎥 Usando primeira câmera real:', excludeVirtual[0].label);
        constraints.video = {
          deviceId: { exact: excludeVirtual[0].deviceId },
          width: { ideal: 640 },
          height: { ideal: 480 }
        };
      }
      // Se só tem câmera virtual, usar facingMode
      else {
        console.log('🎥 Usando facingMode (câmeras virtuais detectadas)');
        constraints.video = {
          facingMode: 'environment',
          width: { ideal: 640 },
          height: { ideal: 480 }
        };
      }

      console.log('🎥 Solicitando acesso à câmera com constraints:', constraints);
      // Solicitar acesso à câmera
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);

      console.log('🎥 Câmera acessada com sucesso!');
      setStream(mediaStream);
      setHasPermission(true);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play();
        
        // Iniciar o processo de scan
        videoRef.current.onloadedmetadata = () => {
          console.log('🎥 Metadados do vídeo carregados, iniciando scan...');
          setIsLoading(false);
          scanQRCode();
        };
      }
    } catch (err: any) {
      console.error('Erro ao acessar câmera:', err);
      setHasPermission(false);
      setIsLoading(false);
      
      let errorMessage = 'Erro desconhecido ao acessar câmera';
      
      if (err.name === 'NotAllowedError') {
        errorMessage = 'Acesso à câmera negado. Por favor, permita o acesso à câmera.';
      } else if (err.name === 'NotFoundError') {
        errorMessage = 'Nenhuma câmera encontrada no dispositivo.';
      } else if (err.name === 'NotReadableError') {
        errorMessage = 'Câmera está sendo usada por outro aplicativo.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      onScanError?.(errorMessage);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const scanQRCode = () => {
    if (!videoRef.current || !canvasRef.current || !isActive) {
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context || video.readyState !== video.HAVE_ENOUGH_DATA) {
      requestAnimationFrame(scanQRCode);
      return;
    }

    // Definir tamanho do canvas igual ao vídeo
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Desenhar o frame atual do vídeo no canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Obter dados da imagem
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);

    // Tentar decodificar QR code
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: 'dontInvert',
    });

    if (code) {
      // QR Code encontrado!
      onScanSuccess(code.data);
      return;
    }

    // Continuar escaneando se não encontrou nada
    requestAnimationFrame(scanQRCode);
  };

  const retryCamera = () => {
    setError('');
    setHasPermission(null);
    startCamera();
  };

  if (isLoading) {
    return (
      <div className={`flex flex-col items-center justify-center p-8 bg-gray-50 rounded-xl ${className}`}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-gray-600">Iniciando câmera...</p>
      </div>
    );
  }

  if (error || hasPermission === false) {
    return (
      <div className={`flex flex-col items-center justify-center p-8 bg-red-50 rounded-xl ${className}`}>
        <svg className="w-12 h-12 text-red-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
        <p className="text-red-600 text-center mb-4">{error}</p>
        <button
          onClick={retryCamera}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div className={`relative bg-black rounded-xl overflow-hidden ${className}`}>
      {/* Vídeo da câmera */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover"
      />
      
      {/* Canvas oculto para processamento */}
      <canvas
        ref={canvasRef}
        className="hidden"
      />
      
      {/* Overlay com guias de scan */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Área de scan */}
        <div className="absolute inset-4 border-2 border-white/50 rounded-lg">
          {/* Cantos da área de scan */}
          <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-blue-500 rounded-tl-lg"></div>
          <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-blue-500 rounded-tr-lg"></div>
          <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-blue-500 rounded-bl-lg"></div>
          <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-blue-500 rounded-br-lg"></div>
        </div>
        
        {/* Texto de instrução */}
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2">
          <div className="bg-black/70 px-4 py-2 rounded-full">
            <p className="text-white text-sm text-center">
              Posicione o QRCode na área destacada
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
