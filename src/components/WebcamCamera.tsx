"use client";
import { useState, useRef, useCallback, useEffect } from 'react';
import Webcam from 'react-webcam';

interface WebcamCameraProps {
  isActive: boolean;
  onError?: (error: string) => void;
}

export default function WebcamCamera({ isActive, onError }: WebcamCameraProps) {
  const [error, setError] = useState<string>('');
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [isReady, setIsReady] = useState(false);
  
  const webcamRef = useRef<Webcam>(null);

  // Carregar lista de câmeras
  useEffect(() => {
    loadCameras();
  }, []);

  const loadCameras = async () => {
    try {
      // Solicitar permissão primeiro
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(track => track.stop());
      
      // Carregar dispositivos
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      
      console.log('📱 Câmeras encontradas:', videoDevices);
      setCameras(videoDevices);
      
      // Selecionar câmera não virtual
      const nonVirtualCamera = videoDevices.find(device => 
        !device.label.toLowerCase().includes('obs') && 
        !device.label.toLowerCase().includes('virtual')
      );
      
      if (nonVirtualCamera) {
        setSelectedCameraId(nonVirtualCamera.deviceId);
        console.log('📱 Câmera selecionada:', nonVirtualCamera.label);
      } else if (videoDevices.length > 0) {
        setSelectedCameraId(videoDevices[0].deviceId);
      }
      
    } catch (err) {
      console.error('📱 Erro ao carregar câmeras:', err);
      const errorMsg = `Erro ao carregar câmeras: ${err}`;
      setError(errorMsg);
      onError?.(errorMsg);
    }
  };

  const handleUserMedia = useCallback(() => {
    console.log('📱 Webcam pronta!');
    setIsReady(true);
    setError('');
  }, []);

  const handleUserMediaError = useCallback((error: string | DOMException) => {
    console.error('📱 Erro da webcam:', error);
    const errorMsg = `Erro da webcam: ${error}`;
    setError(errorMsg);
    setIsReady(false);
    onError?.(errorMsg);
  }, [onError]);

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

  if (!isActive) {
    return (
      <div className="w-full h-full bg-gray-50 rounded-xl flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-500 text-lg mb-2">📷</div>
          <div className="text-gray-600">Câmera desativada</div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-black rounded-xl overflow-hidden relative">
      {/* Seletor de câmera */}
      {cameras.length > 1 && (
        <div className="absolute top-4 right-4 z-20">
          <select
            value={selectedCameraId}
            onChange={(e) => setSelectedCameraId(e.target.value)}
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

      {/* Webcam usando react-webcam */}
      {selectedCameraId && (
        <Webcam
          ref={webcamRef}
          audio={false}
          videoConstraints={{
            deviceId: selectedCameraId,
            width: 1280,
            height: 720,
            facingMode: undefined // Remove facingMode quando usar deviceId específico
          }}
          onUserMedia={handleUserMedia}
          onUserMediaError={handleUserMediaError}
          screenshotFormat="image/jpeg"
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
            <div>Carregando câmera...</div>
          </div>
        </div>
      )}

      {/* Status overlay */}
      <div className="absolute top-4 left-4 bg-green-600/80 text-white px-3 py-1 rounded-full text-sm z-10">
        📱 react-webcam {isReady ? 'Funcionando' : 'Carregando...'}
      </div>

      {/* Camera info overlay */}
      <div className="absolute top-16 left-4 bg-blue-600/80 text-white p-2 rounded text-xs z-10">
        <div>🎥 {cameras.length} câmera(s) detectada(s)</div>
        {selectedCameraId && (
          <div>📹 Selecionada: {cameras.find(c => c.deviceId === selectedCameraId)?.label || 'Desconhecida'}</div>
        )}
        <div>Status: {isReady ? '✅ Pronta' : '⏳ Carregando'}</div>
      </div>

      {/* Info overlay */}
      <div className="absolute bottom-4 left-4 right-4 bg-black/70 text-white p-3 rounded text-sm z-10">
        <div>Biblioteca: react-webcam (externa)</div>
        <div>Câmeras detectadas: {cameras.length}</div>
        <div>Status: {isReady ? '✅ Funcionando' : '❌ Não pronta'}</div>
      </div>
    </div>
  );
}
