"use client";
import { useState } from 'react';
import DirectCamera from '@/components/DirectCamera';

export default function TestDirectCameraPage() {
  const [isActive, setIsActive] = useState(false);

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">Teste Câmera Direct DOM</h1>
        
        <div className="bg-white rounded-xl p-6 shadow-lg mb-6">
          <div className="flex gap-4 mb-6">
            <button
              onClick={() => setIsActive(!isActive)}
              className={`px-6 py-3 rounded-xl font-semibold transition-colors ${
                isActive
                  ? 'bg-red-500 hover:bg-red-600 text-white'
                  : 'bg-green-500 hover:bg-green-600 text-white'
              }`}
            >
              {isActive ? '🛑 Parar Câmera' : '▶️ Iniciar Câmera'}
            </button>
            
            <div className="flex items-center">
              <span className={`inline-block w-3 h-3 rounded-full mr-2 ${
                isActive ? 'bg-green-500 animate-pulse' : 'bg-gray-300'
              }`}></span>
              Status: {isActive ? 'Ativa' : 'Inativa'}
            </div>
          </div>

          <div className="w-full h-96 border border-gray-200 rounded-xl overflow-hidden">
            <DirectCamera 
              isActive={isActive}
              onError={(error) => console.error('Erro DirectCamera:', error)}
            />
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg">
          <h3 className="font-semibold text-green-800 mb-4">🚀 DirectCamera v2 - Com Seletor de Câmera</h3>
          <ul className="text-gray-700 text-sm space-y-2">
            <li>• ✅ Detecta automaticamente todas as câmeras disponíveis</li>
            <li>• ✅ Evita OBS Virtual Camera por padrão</li>
            <li>• ✅ Seletor no canto superior direito para trocar câmeras</li>
            <li>• ✅ Manipulação direta do DOM (sem React refs)</li>
            <li>• ✅ Controle total sobre o elemento de vídeo</li>
            <li>• ✅ Debug detalhado de câmeras e estado</li>
          </ul>
          
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded">
            <p className="text-blue-800 text-sm">
              <strong>🎯 Agora com detecção de câmeras!</strong> O componente vai automaticamente 
              evitar o OBS Virtual Camera e usar sua câmera real. Se não funcionar, use o seletor 
              no canto superior direito para trocar entre as câmeras disponíveis.
            </p>
          </div>
          
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
            <p className="text-yellow-800 text-sm">
              <strong>📋 Como testar:</strong>
              <br />1. Clique em "Iniciar Câmera"
              <br />2. Observe o overlay azul mostrando quantas câmeras foram detectadas
              <br />3. Se a tela ficar preta, use o seletor no canto superior direito
              <br />4. Teste diferentes câmeras até encontrar a que funciona
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
