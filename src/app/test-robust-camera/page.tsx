"use client";
import { useState } from 'react';
import RobustCamera from '@/components/RobustCamera';

export default function TestRobustCameraPage() {
  const [isActive, setIsActive] = useState(false);
  const [errorLog, setErrorLog] = useState<string[]>([]);

  const handleError = (error: string) => {
    console.error('Erro da câmera robusta:', error);
    setErrorLog(prev => [...prev, `${new Date().toLocaleTimeString()}: ${error}`]);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">Teste Câmera Robusta</h1>
        
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
            
            <button
              onClick={() => setErrorLog([])}
              className="px-4 py-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded-xl"
            >
              🗑️ Limpar Log
            </button>
            
            <div className="flex items-center">
              <span className={`inline-block w-3 h-3 rounded-full mr-2 ${
                isActive ? 'bg-green-500 animate-pulse' : 'bg-gray-300'
              }`}></span>
              Status: {isActive ? 'Ativa' : 'Inativa'}
            </div>
          </div>

          <div className="w-full h-96 border border-gray-200 rounded-xl overflow-hidden">
            <RobustCamera 
              isActive={isActive}
              onError={handleError}
            />
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg">
          <h3 className="font-semibold text-gray-800 mb-4">🔧 Melhorias da Versão Robusta</h3>
          <ul className="text-gray-700 text-sm space-y-2 mb-4">
            <li>• ✅ Aguarda elemento DOM estar completamente pronto</li>
            <li>• ✅ Verifica se componente ainda está montado antes de cada operação</li>
            <li>• ✅ Sistema de retry com múltiplas tentativas</li>
            <li>• ✅ Limpeza automática de resources ao desmontar</li>
            <li>• ✅ Estados de controle para evitar inicialização dupla</li>
            <li>• ✅ Logs detalhados para debugging</li>
          </ul>

          {errorLog.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded p-4">
              <h4 className="font-medium text-red-800 mb-2">📝 Log de Erros:</h4>
              <div className="text-red-700 text-xs space-y-1 max-h-32 overflow-y-auto">
                {errorLog.map((error, index) => (
                  <div key={index} className="font-mono">{error}</div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
          <h3 className="font-semibold text-blue-800 mb-2">ℹ️ Como Testar</h3>
          <ol className="text-blue-700 text-sm space-y-1">
            <li>1. Abra o console do navegador (F12) para ver logs detalhados</li>
            <li>2. Clique em "▶️ Iniciar Câmera" e aguarde a permissão</li>
            <li>3. Observe os status e informações no overlay do vídeo</li>
            <li>4. Teste parar e reiniciar a câmera várias vezes</li>
            <li>5. Verifique se não há mais erros de videoRef null</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
