"use client";
import { useRef, useState, useEffect } from 'react';

export default function TestCamera() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState<string>('Carregando câmeras disponíveis...');
  const [isActive, setIsActive] = useState(false);
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string>('');

  useEffect(() => {
    listCameras();
  }, []);

  const listCameras = async () => {
    try {
      // Primeiro solicita permissão para poder listar dispositivos
      await navigator.mediaDevices.getUserMedia({ video: true });
      
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      
      console.log('📹 Câmeras encontradas:', videoDevices);
      setCameras(videoDevices);
      
      if (videoDevices.length > 0) {
        // Procurar por uma câmera integrada primeiro
        const integratedCamera = videoDevices.find(device => 
          device.label.toLowerCase().includes('integrated') || 
          device.label.toLowerCase().includes('built-in') ||
          device.label.toLowerCase().includes('internal')
        );
        
        if (integratedCamera) {
          setSelectedCamera(integratedCamera.deviceId);
          setStatus(`✅ ${videoDevices.length} câmera(s) encontrada(s). Câmera integrada selecionada.`);
        } else {
          setSelectedCamera(videoDevices[0].deviceId);
          setStatus(`✅ ${videoDevices.length} câmera(s) encontrada(s). Primeira câmera selecionada.`);
        }
      } else {
        setStatus('❌ Nenhuma câmera encontrada');
      }
      
    } catch (error: any) {
      console.error('Erro ao listar câmeras:', error);
      setStatus(`❌ Erro ao listar câmeras: ${error.message}`);
    }
  };

  const testCamera = async () => {
    try {
      setStatus('🔄 Iniciando teste da câmera selecionada...');
      setIsActive(true);

      if (!navigator.mediaDevices) {
        throw new Error('navigator.mediaDevices não disponível');
      }

      if (!selectedCamera) {
        throw new Error('Nenhuma câmera selecionada');
      }

      setStatus(`🔄 Acessando câmera: ${cameras.find(c => c.deviceId === selectedCamera)?.label}`);
      console.log('Usando câmera:', selectedCamera);
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          deviceId: { exact: selectedCamera },
          width: 640,
          height: 480
        }
      });

      console.log('Stream obtido:', stream);
      setStatus('✅ Câmera acessada! Configurando vídeo...');

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        videoRef.current.onloadedmetadata = () => {
          console.log('Metadados carregados');
          setStatus('✅ Câmera funcionando!');
        };
        
        await videoRef.current.play();
        console.log('Vídeo iniciado');
      }

    } catch (error: any) {
      console.error('Erro completo:', error);
      setStatus(`❌ Erro: ${error.name} - ${error.message}`);
      setIsActive(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsActive(false);
    setStatus('🛑 Câmera parada');
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">🎥 Teste da Câmera</h1>
        
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4">Selecionar Câmera:</h2>
            <select 
              value={selectedCamera} 
              onChange={(e) => setSelectedCamera(e.target.value)}
              className="w-full p-3 border rounded-lg mb-4"
              disabled={isActive}
            >
              <option value="">Selecione uma câmera...</option>
              {cameras.map((camera) => (
                <option key={camera.deviceId} value={camera.deviceId}>
                  {camera.label || `Câmera ${camera.deviceId.substring(0, 8)}`}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4">Status:</h2>
            <div className="p-4 bg-gray-50 rounded-lg font-mono text-sm">
              {status}
            </div>
          </div>

          <div className="mb-6">
            <div className="aspect-video bg-black rounded-lg overflow-hidden">
              {isActive ? (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <div className="text-center">
                    <div className="text-4xl mb-2">📷</div>
                    <div>Câmera desligada</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-4 justify-center">
            <button
              onClick={testCamera}
              disabled={isActive || !selectedCamera}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
            >
              Testar Câmera Selecionada
            </button>
            
            <button
              onClick={stopCamera}
              disabled={!isActive}
              className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50"
            >
              Parar Câmera
            </button>
          </div>

          <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
            <h3 className="font-semibold mb-2">📋 Instruções:</h3>
            <ol className="text-sm space-y-1">
              <li>1. Selecione a câmera desejada (evite OBS Virtual Camera se possível)</li>
              <li>2. Clique em "Testar Câmera Selecionada"</li>
              <li>3. Permita o acesso quando solicitado</li>
              <li>4. Verifique se o vídeo aparece</li>
              <li>5. Abra Console (F12) para ver logs detalhados</li>
            </ol>
          </div>

          {cameras.length > 0 && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold mb-2">🎥 Câmeras Detectadas:</h3>
              <ul className="text-sm space-y-1">
                {cameras.map((camera, index) => (
                  <li key={camera.deviceId} className="flex items-center">
                    <span className="mr-2">{index + 1}.</span>
                    <strong>{camera.label || 'Câmera sem nome'}</strong>
                    {camera.label.toLowerCase().includes('obs') && (
                      <span className="ml-2 text-orange-600 text-xs">(Virtual - pode causar problemas)</span>
                    )}
                    {camera.label.toLowerCase().includes('integrated') && (
                      <span className="ml-2 text-green-600 text-xs">(Recomendada)</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
