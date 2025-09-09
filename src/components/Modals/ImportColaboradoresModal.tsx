"use client";
import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import bcrypt from 'bcryptjs';
import Button from '@/components/UI/Button';
import Alert from '@/components/UI/Alert';

interface ImportColaboradoresModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (importedCount: number) => void;
}

interface ColaboradorCSV {
  nome: string;
  departamento: string;
  cargo: string;
  dataAdmissao: string;
}

interface ColaboradorProcessado {
  nome: string;
  sobrenome: string;
  login: string;
  cargo: string;
  tipo: 'colaborador' | 'vendedor';
  departamento: string;
  dataAdmissao: string;
}

export default function ImportColaboradoresModal({ isOpen, onClose, onSuccess }: ImportColaboradoresModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewData, setPreviewData] = useState<ColaboradorProcessado[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [step, setStep] = useState<'upload' | 'preview' | 'processing'>('upload');
  const [sobrescreverExistentes, setSobrescreverExistentes] = useState(true);

  const closeModal = useCallback(() => {
    try {
      setFile(null);
      setPreviewData([]);
      setError(null);
      setSuccess(null);
      setStep('upload');
      setSobrescreverExistentes(true);
      onClose();
    } catch (err) {
      console.error('Erro ao fechar modal:', err);
      onClose();
    }
  }, [onClose]);

  const processarNome = (nomeCompleto: string): { nome: string; sobrenome: string; login: string } => {
    const nomes = nomeCompleto.trim().split(' ').filter(n => n.length > 0);
    
    if (nomes.length === 0) {
      throw new Error('Nome inválido');
    }
    
    const nome = nomes[0];
    const sobrenome = nomes[nomes.length - 1];
    
    // Criar login no formato nome.sobrenome (em minúsculas e sem acentos)
    const login = `${nome}.${sobrenome}`
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .replace(/[^a-z0-9.]/g, ''); // Remove caracteres especiais
    
    return { nome, sobrenome, login };
  };

  const determinarTipo = (cargo: string): 'colaborador' | 'vendedor' => {
    const cargoLower = cargo.toLowerCase();
    const termosVendas = [
      'vendas', 'vendedor', 'vendedora', 'comercial', 'representante', 
      'consultor de vendas', 'supervisor externo', 'coordenador comercial'
    ];
    
    return termosVendas.some(termo => cargoLower.includes(termo)) ? 'vendedor' : 'colaborador';
  };

  // Função melhorada para ler arquivo com tratamento de erro para mobile
  const readFileWithEncoding = useCallback((file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      try {
        if (!file) {
          reject(new Error('Arquivo não encontrado'));
          return;
        }
        
        // Verificar suporte a FileReader
        if (typeof FileReader === 'undefined') {
          reject(new Error('FileReader não suportado neste dispositivo'));
          return;
        }
        
        const reader = new FileReader();
        
        reader.onload = (event) => {
          try {
            const result = event.target?.result as string;
            if (!result) {
              reject(new Error('Não foi possível ler o arquivo'));
              return;
            }
            
            // Função para corrigir caracteres mal codificados
            const fixEncoding = (text: string): string => {
              return text
                // Corrigir TÉCNICO e variações
                .replace(/T[ÃĂÉe][CĂÉ]NICO/gi, 'TÉCNICO')
                .replace(/TĂCNICO/gi, 'TÉCNICO')
                .replace(/TăCNICO/gi, 'TÉCNICO')
                .replace(/TĂCNICO/gi, 'TÉCNICO')
                .replace(/TÃCNICO/gi, 'TÉCNICO')
                
                // Corrigir outras palavras comuns
                .replace(/ANÃLISE/gi, 'ANÁLISE')
                .replace(/AN[ÃĂ]LISE/gi, 'ANÁLISE')
                .replace(/GESTÃ[Ão]/gi, 'GESTÃO')
                .replace(/GEST[ÃĂ]O/gi, 'GESTÃO')
                .replace(/OPERA[ÃĂÇ][ÃĂÃƒO]/gi, 'OPERAÇÃO')
                
                // Remover caracteres de substituição
                .replace(/Ă/g, '')
                .replace(/\uFFFD/g, '');
            };
            
            const correctedContent = fixEncoding(result);
            resolve(correctedContent);
          } catch (err) {
            reject(new Error(`Erro ao processar: ${err instanceof Error ? err.message : 'Erro desconhecido'}`));
          }
        };
        
        reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
        
        // Tentar ler como Latin1 primeiro
        try {
          reader.readAsText(file, 'ISO-8859-1');
        } catch (err) {
          // Fallback para UTF-8
          try {
            reader.readAsText(file, 'UTF-8');
          } catch (fallbackErr) {
            reject(new Error('Erro ao iniciar leitura'));
          }
        }
      } catch (err) {
        reject(new Error(`Erro na configuração: ${err instanceof Error ? err.message : 'Erro desconhecido'}`));
      }
    });
  }, []);

  const parseCSV = (content: string): ColaboradorCSV[] => {
    const lines = content.split('\n').filter(line => line.trim().length > 0);
    
    if (lines.length < 2) {
      throw new Error('Arquivo deve conter cabeçalho e dados');
    }

    const data: ColaboradorCSV[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(';');
      if (values.length >= 4) {
        data.push({
          nome: values[0]?.trim() || '',
          departamento: values[1]?.trim() || '',
          cargo: values[2]?.trim() || '',
          dataAdmissao: values[3]?.trim() || ''
        });
      }
    }
    
    return data;
  };

  const processarCSV = async () => {
    if (!file) {
      setError('Nenhum arquivo selecionado');
      return;
    }

    try {
      setError(null);
      setIsProcessing(true);

      let content = '';
      try {
        content = await file.text();
      } catch (error) {
        content = await readFileWithEncoding(file);
      }
      
      const csvData = parseCSV(content);
      const colaboradoresProcessados: ColaboradorProcessado[] = [];

      for (const colaborador of csvData) {
        try {
          if (!colaborador.nome?.trim()) continue;

          const { nome, sobrenome, login } = processarNome(colaborador.nome);
          const tipo = determinarTipo(colaborador.cargo);

          colaboradoresProcessados.push({
            nome,
            sobrenome,
            login,
            cargo: colaborador.cargo,
            tipo,
            departamento: colaborador.departamento,
            dataAdmissao: colaborador.dataAdmissao
          });
        } catch (err) {
          console.error('Erro ao processar colaborador:', err);
        }
      }

      setPreviewData(colaboradoresProcessados);
      setStep('preview');
    } catch (err) {
      setError(`Erro: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const importarColaboradores = async () => {
    if (previewData.length === 0) {
      setError('Nenhum colaborador para importar');
      return;
    }

    try {
      setError(null);
      setSuccess(null);
      setIsProcessing(true);
      setStep('processing');

      const senhaHash = bcrypt.hashSync('r3sup@123', 10);
      let totalInseridos = 0;
      const errosInsercao: string[] = [];

      // Processar um por um para melhor controle
      for (const colaborador of previewData) {
        try {
          const dadosColaborador = {
            nome: colaborador.nome,
            sobrenome: colaborador.sobrenome,
            login: colaborador.login,
            password: senhaHash,
            cargo: colaborador.cargo,
            tipo: colaborador.tipo,
            primeiro_acesso: true
          };

          if (sobrescreverExistentes) {
            const { error } = await supabase
              .from('users')
              .upsert([dadosColaborador], { onConflict: 'login' });

            if (error) {
              errosInsercao.push(`${colaborador.login}: ${error.message}`);
            } else {
              totalInseridos++;
            }
          } else {
            const { error } = await supabase
              .from('users')
              .insert([dadosColaborador]);

            if (error) {
              if (error.code === '23505') {
                errosInsercao.push(`${colaborador.login}: já existe`);
              } else {
                errosInsercao.push(`${colaborador.login}: ${error.message}`);
              }
            } else {
              totalInseridos++;
            }
          }
        } catch (err) {
          errosInsercao.push(`${colaborador.login}: erro desconhecido`);
        }
      }

      if (totalInseridos > 0) {
        setSuccess(`${totalInseridos} colaborador(es) importado(s)!`);
        onSuccess(totalInseridos);
        
        setTimeout(() => {
          closeModal();
        }, 2000);
      }

      if (errosInsercao.length > 0) {
        setError(`${errosInsercao.length} erros:\n${errosInsercao.slice(0, 5).join('\n')}`);
      }

    } catch (err) {
      setError(`Erro: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <div>
                <h2 className="text-xl font-bold text-gray-800">Importar Colaboradores</h2>
                <p className="text-sm text-gray-600">Importe via arquivo CSV</p>
              </div>
            </div>
            <button
              onClick={closeModal}
              className="text-gray-400 hover:text-gray-600"
              disabled={isProcessing}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {step === 'upload' && (
            <div className="space-y-6">
              {/* Instructions */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">Formato CSV:</h3>
                <ul className="text-sm text-gray-800 space-y-1">
                  <li>• Separador: ponto e vírgula (;)</li>
                  <li>• Cabeçalho: Nome;Departamento;Cargo;Data de Admissão</li>
                  <li>• Login automático: nome.sobrenome</li>
                  <li>• Senha padrão: <strong>r3sup@123</strong></li>
                </ul>
              </div>

              {/* File Upload */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="hidden"
                  id="csv-upload"
                  disabled={isProcessing}
                />
                <label htmlFor="csv-upload" className="cursor-pointer">
                  <div className="text-lg font-medium text-gray-900 mb-2">
                    {file ? file.name : 'Selecionar arquivo CSV'}
                  </div>
                  <div className="text-sm text-gray-600">
                    Toque para escolher arquivo
                  </div>
                </label>
              </div>

              {/* Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
                <Button
                  variant="secondary"
                  onClick={closeModal}
                  disabled={isProcessing}
                  fullWidth
                >
                  Cancelar
                </Button>
                <Button
                  variant="primary"
                  onClick={processarCSV}
                  disabled={!file || isProcessing}
                  fullWidth
                >
                  {isProcessing ? 'Processando...' : 'Processar'}
                </Button>
              </div>
            </div>
          )}

          {step === 'preview' && (
            <div className="space-y-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-1">
                  {previewData.length} colaboradores encontrados
                </h3>
                <p className="text-sm text-gray-800">Revise antes de confirmar</p>
              </div>

              {/* Options */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <label className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sobrescreverExistentes}
                    onChange={(e) => setSobrescreverExistentes(e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded mt-1"
                  />
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      Atualizar existentes
                    </div>
                    <div className="text-xs text-gray-600">
                      {sobrescreverExistentes ? "✅ Atualizará dados" : "❌ Ignorará duplicados"}
                    </div>
                  </div>
                </label>
              </div>

              {/* Preview - Mobile friendly */}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="max-h-60 overflow-y-auto">
                  {previewData.slice(0, 10).map((colaborador, index) => (
                    <div key={index} className="p-3 border-b border-gray-100 last:border-b-0">
                      <div className="font-medium text-gray-900">
                        {colaborador.nome} {colaborador.sobrenome}
                      </div>
                      <div className="text-sm text-gray-600">
                        {colaborador.login} • {colaborador.cargo}
                      </div>
                      <span className={`inline-block px-2 py-1 rounded text-xs font-medium mt-1 ${
                        colaborador.tipo === 'vendedor' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {colaborador.tipo}
                      </span>
                    </div>
                  ))}
                  {previewData.length > 10 && (
                    <div className="p-3 text-center text-gray-500 text-sm">
                      ... e mais {previewData.length - 10} colaboradores
                    </div>
                  )}
                </div>
              </div>

              {/* Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
                <Button
                  variant="secondary"
                  onClick={() => setStep('upload')}
                  disabled={isProcessing}
                  fullWidth
                >
                  Voltar
                </Button>
                <Button
                  variant="success"
                  onClick={importarColaboradores}
                  disabled={isProcessing}
                  fullWidth
                >
                  Importar
                </Button>
              </div>
            </div>
          )}

          {step === 'processing' && (
            <div className="text-center py-12">
              <div className="animate-spin h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Importando...
              </h3>
              <p className="text-gray-600">
                {previewData.length} registros
              </p>
            </div>
          )}

          {/* Messages */}
          {error && (
            <div className="mt-6">
              <Alert type="error" message={error} />
            </div>
          )}

          {success && (
            <div className="mt-6">
              <Alert type="success" message={success} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
