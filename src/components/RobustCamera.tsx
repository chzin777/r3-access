"use client";
import { useState, useRef, useEffect, useCallback } from 'react';

interface RobustCameraProps {
  isActive: boolean;
  onError?: (error: string) => void;
}

export default function RobustCamera({ isActive, onError }: RobustCameraProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [forceRender, setForceRender] = useState(0); // Para forçar re-render
  
  // Usando ref tradicional mas com verificações mais robustas
  const videoRef = useRef<HTMLVideoElement>(null);
  const mountedRef = useRef(true);
  const streamRef = useRef<MediaStream | null>(null);

  // Limpeza quando componente desmonta
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    };
  }, []);

  // Função para esperar o elemento estar pronto
  const waitForVideoElement = useCallback(async (maxAttempts = 10): Promise<HTMLVideoElement> => {
    return new Promise((resolve, reject) => {
      let attempts = 0;
      
      const checkElement = () => {
        if (!mountedRef.current) {
          reject(new Error('Componente desmontado'));
          return;
        }
        
        attempts++;
        const videoElement = videoRef.current;
        
        if (videoElement && videoElement.parentNode) {
          console.log('📱 Elemento video encontrado na tentativa:', attempts);
          resolve(videoElement);
        } else if (attempts < maxAttempts) {
          console.log('📱 Tentativa', attempts, '- elemento ainda não pronto, aguardando...');
          setTimeout(checkElement, 100);
        } else {
          reject(new Error(`Elemento video não encontrado após ${maxAttempts} tentativas`));
        }
      };
      
      checkElement();
    });
  }, []);

  const startCamera = useCallback(async () => {
    try {
      console.log('📱 RobustCamera - Iniciando câmera...');
      setIsLoading(true);
      setError('');

      // Verificar se componente ainda está montado
      if (!mountedRef.current) {
        console.log('📱 Componente desmontado, cancelando inicialização');
        return;
      }

      // Aguardar elemento estar pronto
      console.log('📱 Aguardando elemento video...');
      const videoElement = await waitForVideoElement();
      
      if (!mountedRef.current) {
        console.log('📱 Componente desmontado durante espera');
        return;
      }

      // Obter stream da câmera
      console.log('📱 Solicitando acesso à câmera...');
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });

      if (!mountedRef.current) {
        console.log('📱 Componente desmontado, parando stream');
        mediaStream.getTracks().forEach(track => track.stop());
        return;
      }

      console.log('📱 Stream obtido, configurando elemento video...');
      streamRef.current = mediaStream;
      setStream(mediaStream);

      // Configurar vídeo
      videoElement.srcObject = mediaStream;
      videoElement.playsInline = true;
      videoElement.muted = true;

      // Aguardar carregamento
      await new Promise<void>((resolve, reject) => {
        if (!mountedRef.current) {
          reject(new Error('Componente desmontado'));
          return;
        }

        const handleLoadedData = () => {
          console.log('📱 Dados do vídeo carregados');
          videoElement.removeEventListener('loadeddata', handleLoadedData);
          videoElement.removeEventListener('error', handleError);
          if (mountedRef.current) {
            resolve();
          }
        };

        const handleError = (e: Event) => {
          console.error('📱 Erro ao carregar vídeo:', e);
          videoElement.removeEventListener('loadeddata', handleLoadedData);
          videoElement.removeEventListener('error', handleError);
          reject(new Error('Erro ao carregar vídeo'));
        };

        videoElement.addEventListener('loadeddata', handleLoadedData);
        videoElement.addEventListener('error', handleError);
      });

      if (!mountedRef.current) {
        console.log('📱 Componente desmontado após carregamento');
        return;
      }

      // Iniciar reprodução
      console.log('📱 Iniciando reprodução...');
      await videoElement.play();
      
      // Forçar uma re-renderização do vídeo
      videoElement.style.display = 'none';
      videoElement.offsetHeight; // Force reflow
      videoElement.style.display = 'block';
      
      console.log('📱 Câmera iniciada com sucesso!');
      console.log('📱 Video dimensions:', videoElement.videoWidth, 'x', videoElement.videoHeight);
      console.log('📱 Video playing:', !videoElement.paused);
      console.log('📱 Video ready state:', videoElement.readyState);
      
      setIsLoading(false);
      setIsInitialized(true);
      
      // Forçar re-render do componente para atualizar os overlays
      setForceRender(prev => prev + 1);

    } catch (err: any) {
      console.error('📱 Erro na câmera:', err);
      const errorMsg = `Erro na câmera: ${err.message}`;
      setError(errorMsg);
      setIsLoading(false);
      setIsInitialized(false);
      onError?.(errorMsg);

      // Limpar stream em caso de erro
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      setStream(null);
    }
  }, [onError, waitForVideoElement]);

  const stopCamera = useCallback(() => {
    console.log('📱 RobustCamera - Parando câmera...');
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        console.log('📱 Parando track:', track.kind);
        track.stop();
      });
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setStream(null);
    setIsLoading(false);
    setIsInitialized(false);
    setForceRender(prev => prev + 1);
  }, []);

  // Efeito principal
  useEffect(() => {
    console.log('📱 RobustCamera - Effect: isActive =', isActive, ', isInitialized =', isInitialized);
    
    if (isActive && !isInitialized && !isLoading) {
      console.log('📱 Iniciando câmera...');
      startCamera();
    } else if (!isActive && (isInitialized || stream)) {
      console.log('📱 Parando câmera...');
      stopCamera();
    }
  }, [isActive, isInitialized, isLoading, startCamera, stopCamera, stream]);

  if (error) {
    return (
      <div className="w-full h-full bg-red-50 rounded-xl flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-red-500 mb-2">❌ Erro na câmera</div>
          <div className="text-red-700 text-sm mb-4">{error}</div>
          <button
            onClick={() => {
              setError('');
              setIsInitialized(false);
              if (isActive) {
                startCamera();
              }
            }}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
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
          <div className="text-gray-600">Iniciando câmera...</div>
          <div className="text-gray-500 text-sm mt-2">Aguardando permissão...</div>
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
        controls={false}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          backgroundColor: 'black'
        }}
        className="absolute inset-0"
      />
      
      {/* Status overlay */}
      <div className="absolute top-4 left-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm flex items-center gap-2 z-10">
        <div className={`w-2 h-2 rounded-full ${isInitialized ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
        📱 RobustCamera {isInitialized ? 'Ativa' : 'Carregando...'}
      </div>

      {/* Debug overlay */}
      <div className="absolute top-16 left-4 bg-blue-600/80 text-white p-2 rounded text-xs z-10">
        <div>🎥 Element: {videoRef.current ? 'OK' : 'NULL'}</div>
        <div>📺 SrcObject: {videoRef.current?.srcObject ? 'SET' : 'NOT_SET'}</div>
        <div>▶️ Playing: {videoRef.current?.paused === false ? 'YES' : 'NO'}</div>
        <div>📏 Size: {videoRef.current?.videoWidth}x{videoRef.current?.videoHeight}</div>
      </div>

      {/* Info overlay */}
      <div className="absolute bottom-4 left-4 right-4 bg-black/70 text-white p-3 rounded text-sm z-10">
        <div>Status: {isInitialized ? '✅ Funcionando' : '⏳ Carregando'}</div>
        {stream && (
          <div>Tracks: {stream.getTracks().length} | Video: {stream.getVideoTracks().length}</div>
        )}
        {videoRef.current && (
          <div>Ready State: {videoRef.current.readyState} | Network State: {videoRef.current.networkState}</div>
        )}
      </div>
    </div>
  );
}
