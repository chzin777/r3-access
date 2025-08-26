"use client";
import { useState, useRef, useEffect } from 'react';

interface CanvasCameraProps {
  isActive: boolean;
  onError?: (error: string) => void;
}

export default function CanvasCamera({ isActive, onError }: CanvasCameraProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [debugInfo, setDebugInfo] = useState<string>('Não iniciado');
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationRef = useRef<number>(0);

  // Carregar lista de câmeras
  useEffect(() => {
    loadCameras();
  }, []);

  const loadCameras = async () => {
    try {
      // Primeiro, solicitar permissão básica
      const tempStream = await navigator.mediaDevices.getUserMedia({ video: true });
      tempStream.getTracks().forEach(track => track.stop()); // Parar stream temporário
      
      // Agora carregar dispositivos
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      
      console.log('📱 Câmeras encontradas:', videoDevices);
      setCameras(videoDevices);
      
      // Selecionar a primeira câmera que NÃO seja OBS Virtual Camera
      const nonVirtualCamera = videoDevices.find(device => 
        !device.label.toLowerCase().includes('obs') && 
        !device.label.toLowerCase().includes('virtual')
      );
      
      if (nonVirtualCamera) {
        setSelectedCameraId(nonVirtualCamera.deviceId);
        console.log('📱 Câmera selecionada automaticamente:', nonVirtualCamera.label);
      } else if (videoDevices.length > 0) {
        setSelectedCameraId(videoDevices[0].deviceId);
        console.log('📱 Usando primeira câmera disponível:', videoDevices[0].label);
      }
      
    } catch (err) {
      console.error('📱 Erro ao carregar câmeras:', err);
    }
  };

  useEffect(() => {
    return () => {
      // Limpeza ao desmontar
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    if (isActive && !streamRef.current && selectedCameraId) {
      startCamera();
    } else if (!isActive && streamRef.current) {
      stopCamera();
    }
  }, [isActive, selectedCameraId]);

  const drawVideoToCanvas = () => {
    if (!canvasRef.current || !videoRef.current || videoRef.current.readyState < 2) {
      animationRef.current = requestAnimationFrame(drawVideoToCanvas);
      return;
    }

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      // Ajustar tamanho do canvas para o vídeo
      if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      }

      // Desenhar o frame do vídeo no canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    }

    animationRef.current = requestAnimationFrame(drawVideoToCanvas);
  };

  const startCamera = async () => {
    try {
      console.log('📱 CanvasCamera - Iniciando com câmera:', selectedCameraId);
      setIsLoading(true);
      setError('');
      setDebugInfo('Solicitando permissão da câmera...');

      if (!selectedCameraId) {
        throw new Error('Nenhuma câmera selecionada');
      }

      // Obter stream da câmera selecionada
      const constraints = {
        video: { 
          deviceId: { exact: selectedCameraId },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);

      console.log('📱 Stream obtido:', mediaStream);
      const videoTrack = mediaStream.getVideoTracks()[0];
      console.log('📱 Câmera em uso:', videoTrack.label);
      
      streamRef.current = mediaStream;
      setDebugInfo(`Stream obtido de: ${videoTrack.label}`);

      // Configurar vídeo hidden
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.muted = true;
        videoRef.current.playsInline = true;
        
        // Aguardar vídeo carregar
        await new Promise<void>((resolve, reject) => {
          const handleLoadedData = () => {
            console.log('📱 Dados carregados!');
            videoRef.current!.removeEventListener('loadeddata', handleLoadedData);
            videoRef.current!.removeEventListener('error', handleError);
            resolve();
          };
          
          const handleError = (e: Event) => {
            console.error('📱 Erro no vídeo:', e);
            videoRef.current!.removeEventListener('loadeddata', handleLoadedData);
            videoRef.current!.removeEventListener('error', handleError);
            reject(new Error('Erro ao carregar vídeo'));
          };
          
          videoRef.current!.addEventListener('loadeddata', handleLoadedData);
          videoRef.current!.addEventListener('error', handleError);
        });

        // Iniciar reprodução
        await videoRef.current.play();
        console.log('📱 Vídeo iniciado!');

        // Iniciar loop de desenho no canvas
        drawVideoToCanvas();

        setDebugInfo(`Funcionando! ${videoRef.current.videoWidth}x${videoRef.current.videoHeight} - ${videoTrack.label}`);
        setIsLoading(false);
      }
      
    } catch (err: any) {
      console.error('📱 Erro:', err);
      const errorMsg = `Erro: ${err.message}`;
      setError(errorMsg);
      setDebugInfo(`Erro: ${errorMsg}`);
      setIsLoading(false);
      onError?.(errorMsg);
      
      // Limpar em caso de erro
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    }
  };

  const stopCamera = () => {
    console.log('📱 CanvasCamera - Parando...');
    
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = 0;
    }
    
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
    
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    }
    
    setDebugInfo('Parado');
    setIsLoading(false);
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
              if (isActive) startCamera();
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
          <div className="text-gray-500 text-sm mt-2">{debugInfo}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-black rounded-xl overflow-hidden relative">
      {/* Vídeo hidden - só para capturar frames */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{ 
          position: 'absolute', 
          top: '-9999px', 
          left: '-9999px',
          width: '1px',
          height: '1px'
        }}
      />

      {/* Canvas que vai mostrar o vídeo */}
      <canvas
        ref={canvasRef}
        className="w-full h-full object-cover"
        style={{ backgroundColor: 'black' }}
      />

      {/* Seletor de câmera */}
      {!isLoading && cameras.length > 1 && (
        <div className="absolute top-4 right-4 z-20">
          <select
            value={selectedCameraId}
            onChange={(e) => {
              setSelectedCameraId(e.target.value);
              if (isActive && streamRef.current) {
                stopCamera();
              }
            }}
            className="bg-black/80 text-white border border-white/20 rounded px-2 py-1 text-sm"
          >
            {cameras.map((camera) => (
              <option key={camera.deviceId} value={camera.deviceId}>
                {camera.label || `Câmera ${camera.deviceId.slice(0, 8)}`}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Status overlay */}
      <div className="absolute top-4 left-4 bg-purple-600/80 text-white px-3 py-1 rounded-full text-sm z-10">
        📱 CanvasCamera - {debugInfo}
      </div>

      {/* Camera info overlay */}
      {cameras.length > 0 && (
        <div className="absolute top-16 left-4 bg-blue-600/80 text-white p-2 rounded text-xs z-10">
          <div>🎥 {cameras.length} câmera(s) detectada(s)</div>
          {selectedCameraId && (
            <div>📹 Selecionada: {cameras.find(c => c.deviceId === selectedCameraId)?.label || 'Desconhecida'}</div>
          )}
        </div>
      )}

      {/* Info overlay */}
      <div className="absolute bottom-4 left-4 right-4 bg-black/70 text-white p-3 rounded text-sm z-10">
        <div>Status: {streamRef.current ? '✅ Stream Ativo' : '❌ Sem Stream'}</div>
        <div>Video: {videoRef.current ? '✅ Elemento OK' : '❌ Sem Video'}</div>
        <div>Canvas: {canvasRef.current ? '✅ Canvas OK' : '❌ Sem Canvas'}</div>
        <div>Animation: {animationRef.current ? '✅ Rodando' : '❌ Parado'}</div>
        <div>Câmeras: {cameras.length}</div>
      </div>
    </div>
  );
}
