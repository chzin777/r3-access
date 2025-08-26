"use client";
import { useState, useRef, useEffect } from 'react';

interface SimpleCameraV2Props {
  isActive: boolean;
  onError?: (error: string) => void;
}

export default function SimpleCameraV2({ isActive, onError }: SimpleCameraV2Props) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [stream, setStream] = useState<MediaStream | null>(null);
  
  // Usando useRef tradicional mas com verificações mais robustas
  const videoRef = useRef<HTMLVideoElement>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    console.log('📱 SimpleCameraV2 - isActive:', isActive, 'videoRef exists:', !!videoRef.current);
    
    if (isActive && !stream) {
      console.log('📱 Condições atendidas, iniciando câmera...');
      startCamera();
    } else if (!isActive && stream) {
      console.log('📱 Parando câmera...');
      stopCamera();
    }
  }, [isActive, stream]);

  const waitForVideoElement = async (maxAttempts = 20) => {
    return new Promise<HTMLVideoElement>((resolve, reject) => {
      let attempts = 0;
      
      const checkElement = () => {
        if (!mountedRef.current) {
          reject(new Error('Componente desmontado'));
          return;
        }
        
        attempts++;
        const element = videoRef.current;
        
        if (element && element.parentNode && element.offsetParent !== null) {
          console.log('📱 Elemento video pronto na tentativa:', attempts);
          resolve(element);
        } else if (attempts < maxAttempts) {
          console.log('📱 Tentativa', attempts, '- aguardando elemento...');
          setTimeout(checkElement, 50);
        } else {
          reject(new Error(`Elemento video não encontrado após ${maxAttempts} tentativas`));
        }
      };
      
      // Começar verificação imediatamente
      checkElement();
    });
  };

  const startCamera = async () => {
    try {
      console.log('📱 Iniciando câmera v2...');
      setIsLoading(true);
      setError('');

      if (!navigator.mediaDevices) {
        throw new Error('MediaDevices não suportado');
      }

      // Aguardar elemento estar pronto PRIMEIRO
      console.log('📱 Aguardando elemento video estar pronto...');
      const videoElement = await waitForVideoElement();

      if (!mountedRef.current) {
        console.log('📱 Componente desmontado, cancelando');
        return;
      }

      console.log('📱 Elemento pronto! Solicitando getUserMedia...');
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });

      if (!mountedRef.current) {
        mediaStream.getTracks().forEach(track => track.stop());
        return;
      }

      console.log('📱 Stream obtido:', mediaStream);
      setStream(mediaStream);

      console.log('📱 Configurando vídeo no elemento...');
      videoElement.srcObject = mediaStream;
      videoElement.playsInline = true;
      videoElement.muted = true;
      
      // Aguardar carregamento dos metadados
      await new Promise<void>((resolve, reject) => {
        const handleLoadedMetadata = () => {
          console.log('📱 Metadados carregados!');
          videoElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
          videoElement.removeEventListener('error', handleError);
          resolve();
        };
        
        const handleError = (e: Event) => {
          console.error('📱 Erro no elemento video:', e);
          videoElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
          videoElement.removeEventListener('error', handleError);
          reject(e);
        };
        
        videoElement.addEventListener('loadedmetadata', handleLoadedMetadata);
        videoElement.addEventListener('error', handleError);
      });
      
      if (!mountedRef.current) {
        return;
      }

      // Iniciar reprodução
      try {
        await videoElement.play();
        console.log('📱 Vídeo iniciado com sucesso!');
        setIsLoading(false);
      } catch (playError) {
        console.error('📱 Erro ao iniciar vídeo:', playError);
        throw playError;
      }
    } catch (err: any) {
      console.error('📱 Erro na câmera:', err);
      const errorMsg = `Erro: ${err.name} - ${err.message}`;
      setError(errorMsg);
      setIsLoading(false);
      onError?.(errorMsg);
      
      // Limpar stream em caso de erro
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
      }
    }
  };

  const stopCamera = () => {
    console.log('📱 Parando câmera v2...');
    if (stream) {
      stream.getTracks().forEach(track => {
        console.log('📱 Parando track:', track.kind, track.readyState);
        track.stop();
      });
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsLoading(false);
  };

  if (error) {
    return (
      <div className="w-full h-full bg-red-50 rounded-xl flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-red-500 mb-2">❌ Erro na câmera</div>
          <div className="text-red-700 text-sm">{error}</div>
          <button
            onClick={() => {
              setError('');
              startCamera();
            }}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="w-full h-full bg-gray-50 rounded-xl flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4 mx-auto"></div>
          <div className="text-gray-600">Carregando câmera...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-black rounded-xl overflow-hidden relative">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover"
      />
      
      {/* Overlay de teste */}
      <div className="absolute top-4 left-4 bg-black/50 text-white px-2 py-1 rounded text-sm">
        📱 Câmera V2 {stream ? 'Ativa' : 'Inativa'}
      </div>
    </div>
  );
}
