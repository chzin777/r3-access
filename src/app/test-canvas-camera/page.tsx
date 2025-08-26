"use client";
import { useState } from 'react';
import CanvasCamera from '@/components/CanvasCamera';

export default function TestCanvasCameraPage() {
  const [isActive, setIsActive] = useState(false);

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">Teste Câmera Canvas</h1>
        
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
            <CanvasCamera 
              isActive={isActive}
              onError={(error) => console.error('Erro CanvasCamera:', error)}
            />
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg">
          <h3 className="font-semibold text-purple-800 mb-4">🎨 CanvasCamera - Última Tentativa!</h3>
          <ul className="text-gray-700 text-sm space-y-2">
            <li>• ✅ Usa elemento video HIDDEN para capturar frames</li>
            <li>• ✅ Desenha frames no Canvas usando drawImage()</li>
            <li>• ✅ Canvas é sempre visível (não depende do browser renderizar video)</li>
            <li>• ✅ Loop de animação com requestAnimationFrame</li>
            <li>• ✅ Seletor de câmeras funcional</li>
            <li>• ✅ Debug completo de todos os estados</li>
          </ul>
          
          <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded">
            <p className="text-purple-800 text-sm">
              <strong>🎯 Esta é nossa última cartada!</strong> Se ainda não funcionar, pode ser um problema 
              mais profundo com drivers da câmera ou política de segurança do browser. O Canvas força 
              a renderização de uma forma que sempre deveria funcionar.
            </p>
          </div>
          
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
            <p className="text-yellow-800 text-sm">
              <strong>🔍 Se ainda estiver preto:</strong>
              <br />1. Verifique se "Animation: ✅ Rodando" aparece no overlay
              <br />2. Abra as Ferramentas do Desenvolvedor (F12) e veja o console
              <br />3. Teste trocar de câmera no seletor
              <br />4. Reinicie o navegador se necessário
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
