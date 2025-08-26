"use client";
import { useState } from 'react';
import WebcamCamera from '@/components/WebcamCamera';

export default function TestWebcamCameraPage() {
  const [isActive, setIsActive] = useState(false);

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">Teste react-webcam</h1>
        
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
            <WebcamCamera 
              isActive={isActive}
              onError={(error) => console.error('Erro WebcamCamera:', error)}
            />
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg">
          <h3 className="font-semibold text-green-800 mb-4">📚 react-webcam - Biblioteca Externa</h3>
          <ul className="text-gray-700 text-sm space-y-2">
            <li>• ✅ Biblioteca externa bem estabelecida (react-webcam)</li>
            <li>• ✅ Usado por milhares de projetos</li>
            <li>• ✅ Resolve automaticamente problemas de compatibilidade</li>
            <li>• ✅ Gerencia permissões e estados internamente</li>
            <li>• ✅ Suporte nativo para seleção de dispositivos</li>
            <li>• ✅ Funciona em todos os navegadores modernos</li>
          </ul>
          
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded">
            <p className="text-green-800 text-sm">
              <strong>🎯 Esta DEVE funcionar!</strong> A react-webcam é uma das bibliotecas mais 
              confiáveis para câmera em React. Se esta não funcionar, pode ser um problema 
              de drivers ou configuração do sistema.
            </p>
          </div>
          
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded">
            <p className="text-blue-800 text-sm">
              <strong>📦 Instalada:</strong> npm install react-webcam
              <br /><strong>📝 Documentação:</strong> github.com/mozmorris/react-webcam
              <br /><strong>⭐ Stars:</strong> 1.5k+ no GitHub
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
