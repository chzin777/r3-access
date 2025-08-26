"use client";
import { useState } from 'react';
import SimpleCameraV2 from '@/components/SimpleCameraV2';

export default function TestCameraV2Page() {
  const [isActive, setIsActive] = useState(false);

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">Teste Câmera V2</h1>
        
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <div className="flex gap-4 mb-6">
            <button
              onClick={() => setIsActive(!isActive)}
              className={`px-6 py-3 rounded-xl font-semibold ${
                isActive
                  ? 'bg-red-500 hover:bg-red-600 text-white'
                  : 'bg-green-500 hover:bg-green-600 text-white'
              }`}
            >
              {isActive ? '🛑 Parar Câmera' : '▶️ Iniciar Câmera'}
            </button>
            
            <div className="flex items-center">
              <span className={`inline-block w-3 h-3 rounded-full mr-2 ${
                isActive ? 'bg-green-500' : 'bg-gray-300'
              }`}></span>
              Status: {isActive ? 'Ativa' : 'Inativa'}
            </div>
          </div>

          <div className="w-full h-80">
            <SimpleCameraV2 
              isActive={isActive}
              onError={(error) => console.error('Erro da câmera:', error)}
            />
          </div>
        </div>

        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <h3 className="font-semibold text-yellow-800 mb-2">ℹ️ Informações do Teste</h3>
          <ul className="text-yellow-700 text-sm space-y-1">
            <li>• Esta versão usa callback ref ao invés de useRef</li>
            <li>• O elemento video é capturado assim que renderizado</li>
            <li>• Evita problemas de timing com videoRef.current</li>
            <li>• Abra o console (F12) para ver os logs detalhados</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
