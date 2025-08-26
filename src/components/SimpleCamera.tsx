"use client";
import { useEffect, useRef, useState } from 'react';

interface SimpleCameraProps {
  isActive: boolean;
  onError?: (error: string) => void;
}

export default function SimpleCamera({ isActive, onError }: SimpleCameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [stream, setStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    console.log('📱 SimpleCamera - isActive:', isActive);
    
    const initCamera = async () => {
      if (isActive && !stream) {
        // Aguardar um tick para garantir renderização
        await new Promise(resolve => setTimeout(resolve, 0));
        console.log('📱 Iniciando nova câmera...');
        startCamera();
      } else if (!isActive && stream) {
        console.log('📱 Parando câmera existente...');
        stopCamera();
      }
    };
    
    initCamera();

    return () => {
      // Cleanup apenas se o componente for desmontado
      if (!isActive) {
        stopCamera();
      }
    };
  }, [isActive]); // Remove 'stream' das dependências para evitar loops

  const startCamera = async () => {
    try {
      console.log('📱 Iniciando câmera simples...');
      setIsLoading(true);
      setError('');

      if (!navigator.mediaDevices) {
        throw new Error('MediaDevices não suportado');
      }

      console.log('📱 Solicitando getUserMedia...');
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false
      });

      console.log('📱 Stream obtido:', mediaStream);
      setStream(mediaStream);

      // Aguardar um pouco para garantir que o elemento video foi renderizado
      await new Promise(resolve => setTimeout(resolve, 100));

      if (!videoRef.current) {
        console.error('📱 videoRef.current ainda é null após aguardar!');
        throw new Error('Elemento de vídeo não encontrado');
      }

      console.log('📱 Configurando vídeo...');
      videoRef.current.srcObject = mediaStream;
      
      videoRef.current.onloadedmetadata = () => {
        console.log('📱 Metadados carregados!');
        setIsLoading(false);
      };
      
      videoRef.current.onerror = (e) => {
        console.error('📱 Erro no elemento video:', e);
      };
      
      try {
        await videoRef.current.play();
        console.log('📱 Vídeo iniciado com sucesso!');
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
    }
  };

  const stopCamera = () => {
    console.log('📱 Parando câmera...');
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
        📱 Câmera Ativa
      </div>
    </div>
  );
}
