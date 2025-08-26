"use client";
import { useState, useRef, useEffect } from 'react';

interface DirectCameraProps {
  isActive: boolean;
  onError?: (error: string) => void;
}

export default function DirectCamera({ isActive, onError }: DirectCameraProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [debugInfo, setDebugInfo] = useState<string>('Não iniciado');
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  
  const containerRef = useRef<HTMLDivElement>(null);
  const videoElementRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Carregar lista de câmeras
  useEffect(() => {
    loadCameras();
  }, []);

  const loadCameras = async () => {
    try {
      // Primeiro, solicitar permissão básica
      await navigator.mediaDevices.getUserMedia({ video: true });
      
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

  const startCamera = async () => {
    try {
      console.log('📱 DirectCamera - Iniciando com câmera:', selectedCameraId);
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

      // Criar elemento de vídeo diretamente
      const videoElement = document.createElement('video');
      videoElement.autoplay = true;
      videoElement.playsInline = true;
      videoElement.muted = true;
      videoElement.controls = false;
      
      // Configurar estilos de forma mais agressiva
      videoElement.style.cssText = `
        width: 100% !important;
        height: 100% !important;
        object-fit: cover !important;
        background-color: black !important;
        position: absolute !important;
        top: 0 !important;
        left: 0 !important;
        z-index: 1 !important;
        display: block !important;
        visibility: visible !important;
      `;
      
      videoElementRef.current = videoElement;
      
      // Aguardar dados carregarem
      await new Promise<void>((resolve, reject) => {
        const handleLoadedData = () => {
          console.log('📱 Dados carregados!');
          setDebugInfo(`Dados carregados de: ${videoTrack.label}`);
          videoElement.removeEventListener('loadeddata', handleLoadedData);
          videoElement.removeEventListener('error', handleError);
          resolve();
        };
        
        const handleError = (e: Event) => {
          console.error('📱 Erro no vídeo:', e);
          videoElement.removeEventListener('loadeddata', handleLoadedData);
          videoElement.removeEventListener('error', handleError);
          reject(new Error('Erro ao carregar vídeo'));
        };
        
        videoElement.addEventListener('loadeddata', handleLoadedData);
        videoElement.addEventListener('error', handleError);
        
        // Configurar stream
        videoElement.srcObject = mediaStream;
      });
      
      // Iniciar reprodução
      await videoElement.play();
      console.log('📱 Vídeo reproduzindo!');
      
      // Log detalhado do estado
      console.log('📱 Video paused:', videoElement.paused);
      console.log('📱 Video muted:', videoElement.muted);
      console.log('📱 Video readyState:', videoElement.readyState);
      console.log('📱 Video networkState:', videoElement.networkState);
      console.log('📱 Video currentTime:', videoElement.currentTime);
      console.log('📱 Video duration:', videoElement.duration);
      
      // Adicionar ao container
      if (containerRef.current) {
        // Limpar container primeiro
        containerRef.current.innerHTML = '';
        
        // Configurar container
        containerRef.current.style.cssText = `
          position: relative !important;
          width: 100% !important;
          height: 100% !important;
          overflow: hidden !important;
          background-color: black !important;
        `;
        
        containerRef.current.appendChild(videoElement);
        console.log('📱 Elemento adicionado ao DOM');
        
        // Forçar um refresh do elemento
        setTimeout(() => {
          if (videoElement && containerRef.current?.contains(videoElement)) {
            videoElement.style.opacity = '0';
            videoElement.offsetHeight; // force reflow
            videoElement.style.opacity = '1';
            console.log('📱 Refresh forçado do vídeo');
          }
        }, 100);
      }
      
      setDebugInfo(`Funcionando! ${videoElement.videoWidth}x${videoElement.videoHeight} - ${videoTrack.label}`);
      setIsLoading(false);
      
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
    console.log('📱 DirectCamera - Parando...');
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (videoElementRef.current) {
      videoElementRef.current.srcObject = null;
      videoElementRef.current = null;
    }
    
    if (containerRef.current) {
      containerRef.current.innerHTML = '';
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
      {/* Seletor de câmera - só aparece quando não está carregando */}
      {!isLoading && cameras.length > 1 && (
        <div className="absolute top-4 right-4 z-20">
          <select
            value={selectedCameraId}
            onChange={(e) => {
              setSelectedCameraId(e.target.value);
              // Se já está ativo, reiniciar com nova câmera
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

      {/* Container onde o vídeo será inserido diretamente */}
      <div 
        ref={containerRef}
        className="w-full h-full"
        style={{ backgroundColor: 'black' }}
      />
      
      {/* Status overlay */}
      <div className="absolute top-4 left-4 bg-green-600/80 text-white px-3 py-1 rounded-full text-sm z-10">
        📱 DirectCamera - {debugInfo}
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
        <div>Element: {videoElementRef.current ? '✅ Criado' : '❌ Não Criado'}</div>
        <div>Container: {containerRef.current?.children.length || 0} elementos</div>
        <div>Câmeras: {cameras.length}</div>
      </div>
    </div>
  );
}
