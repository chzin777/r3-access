"use client";
import { useState } from 'react';
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

  const closeModal = () => {
    setFile(null);
    setPreviewData([]);
    setError(null);
    setSuccess(null);
    setStep('upload');
    setSobrescreverExistentes(true);
    onClose();
  };

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

  // Função para tentar ler arquivo com diferentes codificações
  const readFileWithEncoding = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        const result = event.target?.result as string;
        
        // Função para corrigir caracteres mal codificados
        const fixEncoding = (text: string): string => {
          return text
            // Corrigir TÉCNICO
            .replace(/T[Ã�][C�É]NICO/gi, 'TÉCNICO')
            .replace(/TÃ‰CNICO/gi, 'TÉCNICO')
            .replace(/TÃ©CNICO/gi, 'TÉCNICO')
            .replace(/T�CNICO/gi, 'TÉCNICO')
            .replace(/TÃCNICO/gi, 'TÉCNICO')
            
            // Corrigir outras palavras comuns
            .replace(/ANÃLISE/gi, 'ANÁLISE')
            .replace(/AN[Ã�]LISE/gi, 'ANÁLISE')
            .replace(/GESTÃ[Ã£O]/gi, 'GESTÃO')
            .replace(/GEST[Ã�]O/gi, 'GESTÃO')
            .replace(/OPERA[Ã�Ç][Ã�ÃƒO]/gi, 'OPERAÇÃO')
            
            // Corrigir caracteres individuais mais comuns
            .replace(/Ã¡/g, 'á').replace(/Ã /g, 'à').replace(/Ã¢/g, 'â').replace(/Ã£/g, 'ã')
            .replace(/Ã©/g, 'é').replace(/Ãª/g, 'ê').replace(/Ã¨/g, 'è')
            .replace(/Ã­/g, 'í').replace(/Ã®/g, 'î').replace(/Ã¬/g, 'ì')
            .replace(/Ã³/g, 'ó').replace(/Ã´/g, 'ô').replace(/Ã²/g, 'ò').replace(/Ãµ/g, 'õ')
            .replace(/Ãº/g, 'ú').replace(/Ã»/g, 'û').replace(/Ã¹/g, 'ù')
            .replace(/Ã§/g, 'ç').replace(/Ã±/g, 'ñ')
            
            // Maiúsculas
            .replace(/Ã\u0081/g, 'Á').replace(/Ã\u0080/g, 'À').replace(/Ã\u0082/g, 'Â').replace(/Ã\u0083/g, 'Ã')
            .replace(/Ã\u0089/g, 'É').replace(/Ã\u008A/g, 'Ê').replace(/Ã\u0088/g, 'È')
            .replace(/Ã\u008D/g, 'Í').replace(/Ã\u008E/g, 'Î').replace(/Ã\u008C/g, 'Ì')
            .replace(/Ã\u0093/g, 'Ó').replace(/Ã\u0094/g, 'Ô').replace(/Ã\u0092/g, 'Ò').replace(/Ã\u0095/g, 'Õ')
            .replace(/Ã\u009A/g, 'Ú').replace(/Ã\u009B/g, 'Û').replace(/Ã\u0099/g, 'Ù')
            .replace(/Ã\u0087/g, 'Ç').replace(/Ã\u0091/g, 'Ñ')
            
            // Remover caracteres de substituição
            .replace(/�/g, '')
            .replace(/\uFFFD/g, '');
        };
        
        const correctedContent = fixEncoding(result);
        resolve(correctedContent);
      };
      
      reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
      
      // Tentar ler como Latin1 primeiro (mais comum para CSVs brasileiros)
      reader.readAsText(file, 'ISO-8859-1');
    });
  };

  const parseCSV = (content: string): ColaboradorCSV[] => {
    const lines = content.split('\n').filter(line => line.trim().length > 0);
    
    if (lines.length < 2) {
      throw new Error('Arquivo CSV deve conter pelo menos uma linha de cabeçalho e uma linha de dados');
    }

    const header = lines[0].split(';');
    const expectedHeaders = ['Nome', 'Departamento', 'Cargo', 'Data de Admissão'];
    
    // Verificar se o cabeçalho está correto
    const normalizeHeader = (h: string) => h.trim().toLowerCase().replace(/[^\w]/g, '');
    const headerNormalized = header.map(normalizeHeader);
    const expectedNormalized = expectedHeaders.map(normalizeHeader);
    
    for (const expected of expectedNormalized) {
      if (!headerNormalized.includes(expected)) {
        throw new Error(`Cabeçalho esperado não encontrado: ${expected}. Cabeçalhos encontrados: ${header.join(', ')}`);
      }
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

      // Tentar diferentes codificações para ler o arquivo
      let content = '';
      try {
        // Primeiro tenta UTF-8
        content = await file.text();
      } catch (error) {
        // Se falhar, tenta com FileReader e diferentes codificações
        content = await readFileWithEncoding(file);
      }
      const csvData = parseCSV(content);
      
      const colaboradoresProcessados: ColaboradorProcessado[] = [];
      const erros: string[] = [];

      for (let i = 0; i < csvData.length; i++) {
        const colaborador = csvData[i];
        
        try {
          if (!colaborador.nome || colaborador.nome.trim().length === 0) {
            erros.push(`Linha ${i + 2}: Nome é obrigatório`);
            continue;
          }

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
          erros.push(`Linha ${i + 2}: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
        }
      }

      if (erros.length > 0) {
        setError(`Erros encontrados:\n${erros.join('\n')}`);
        setIsProcessing(false);
        return;
      }

      setPreviewData(colaboradoresProcessados);
      setStep('preview');
    } catch (err) {
      setError(`Erro ao processar arquivo: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
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
      const colaboradoresParaInserir = previewData.map(colaborador => ({
        nome: colaborador.nome,
        sobrenome: colaborador.sobrenome,
        login: colaborador.login,
        password: senhaHash,
        cargo: colaborador.cargo,
        tipo: colaborador.tipo,
        primeiro_acesso: true
      }));

      // Inserir em lotes para evitar timeouts
      const batchSize = 50;
      let totalInseridos = 0;
      const errosInsercao: string[] = [];

      for (let i = 0; i < colaboradoresParaInserir.length; i += batchSize) {
        const batch = colaboradoresParaInserir.slice(i, i + batchSize);
        
        // Usar upsert se sobrescrever estiver habilitado
        let data, error;
        
        if (sobrescreverExistentes) {
          const result = await supabase
            .from('users')
            .upsert(batch, { 
              onConflict: 'login',
              ignoreDuplicates: false 
            })
            .select('id, login');
          data = result.data;
          error = result.error;
        } else {
          const result = await supabase
            .from('users')
            .insert(batch)
            .select('id, login');
          data = result.data;
          error = result.error;
        }

        if (error) {
          // Se der erro, tentar inserir um por um para identificar problemas específicos
          for (const colaborador of batch) {
            let { error: singleError } = await supabase
              .from('users')
              .insert([colaborador]);

            // Se erro da coluna 'ativo', tentar sem essa coluna
            if (singleError?.message?.includes("'ativo'")) {
              const colaboradorSemAtivo = {
                nome: colaborador.nome,
                sobrenome: colaborador.sobrenome,
                login: colaborador.login,
                password: colaborador.password,
                cargo: colaborador.cargo,
                tipo: colaborador.tipo,
                primeiro_acesso: colaborador.primeiro_acesso
              };
              
              const result = await supabase
                .from('users')
                .insert([colaboradorSemAtivo]);
              
              singleError = result.error;
            }

            // Se erro do tipo 'vendedor' não permitido, usar 'colaborador'
            if (singleError?.message?.includes('violates check constraint') && colaborador.tipo === 'vendedor') {
              const colaboradorComoColaborador = {
                nome: colaborador.nome,
                sobrenome: colaborador.sobrenome,
                login: colaborador.login,
                password: colaborador.password,
                cargo: colaborador.cargo,
                tipo: 'colaborador' as const,
                primeiro_acesso: colaborador.primeiro_acesso
              };
              
              const result = await supabase
                .from('users')
                .insert([colaboradorComoColaborador]);
              
              singleError = result.error;
            }

            if (singleError) {
              if (singleError.code === '23505') { // Unique constraint violation - login já existe
                if (sobrescreverExistentes) {
                  // Tentar atualizar o usuário existente
                  const { error: updateError } = await supabase
                    .from('users')
                    .update({
                      nome: colaborador.nome,
                      sobrenome: colaborador.sobrenome,
                      cargo: colaborador.cargo,
                      tipo: colaborador.tipo === 'vendedor' && singleError?.message?.includes('violates check constraint') ? 'colaborador' : colaborador.tipo
                    })
                    .eq('login', colaborador.login);

                  if (updateError) {
                    errosInsercao.push(`Erro ao atualizar ${colaborador.login}: ${updateError.message}`);
                  } else {
                    errosInsercao.push(`✅ Login ${colaborador.login} já existia - dados atualizados com sucesso`);
                    totalInseridos++;
                  }
                } else {
                  errosInsercao.push(`❌ Login ${colaborador.login} já existe no sistema (não sobrescrito)`);
                }
              } else {
                errosInsercao.push(`Erro ao inserir ${colaborador.login}: ${singleError.message}`);
              }
            } else {
              totalInseridos++;
            }
          }
        } else {
          totalInseridos += data?.length || 0;
        }
      }

      if (errosInsercao.length > 0) {
        setError(`Alguns colaboradores não puderam ser importados:\n${errosInsercao.join('\n')}`);
      }

      if (totalInseridos > 0) {
        setSuccess(`${totalInseridos} colaborador(es) importado(s) com sucesso!`);
        onSuccess(totalInseridos);
        
        // Fechar modal após 2 segundos em caso de sucesso
        setTimeout(() => {
          closeModal();
        }, 2000);
      }

    } catch (err) {
      setError(`Erro durante importação: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
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
                <p className="text-sm text-gray-600">Importe colaboradores através de arquivo CSV</p>
              </div>
            </div>
            <button
              onClick={closeModal}
              className="text-gray-400 hover:text-gray-600 transition-colors"
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
                <h3 className="font-semibold text-gray-900 mb-2">Instruções do arquivo CSV:</h3>
                <ul className="text-sm text-gray-800 space-y-1">
                  <li>• Arquivo deve ter extensão .csv</li>
                  <li>• Separador deve ser ponto e vírgula (;)</li>
                  <li>• Cabeçalho obrigatório: Nome;Departamento;Cargo;Data de Admissão</li>
                  <li>• Login será criado automaticamente no formato: nome.sobrenome</li>
                  <li>• Senha padrão para todos: <strong>r3sup@123</strong></li>
                  <li>• Cargos com "vendas", "vendedor", "comercial" serão marcados como vendedor</li>
                </ul>
                
                <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded">
                  <p className="text-xs text-gray-700">
                    <strong>💡 Dica para acentos:</strong> O sistema corrige automaticamente caracteres mal codificados como "TÉCNICO", mas se houver problemas, salve o CSV com codificação UTF-8.
                  </p>
                </div>
              </div>

              {/* File Upload */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="hidden"
                  id="csv-upload"
                  disabled={isProcessing}
                />
                <label htmlFor="csv-upload" className="cursor-pointer">
                  <span className="text-lg font-medium text-gray-900">
                    {file ? file.name : 'Clique para selecionar arquivo CSV'}
                  </span>
                  <br />
                  <span className="text-sm text-gray-700">ou arraste e solte aqui</span>
                </label>
              </div>

              {/* Process Button */}
              <div className="flex justify-end space-x-3">
                <Button
                  variant="secondary"
                  onClick={closeModal}
                  disabled={isProcessing}
                >
                  Cancelar
                </Button>
                <Button
                  variant="primary"
                  onClick={processarCSV}
                  disabled={!file || isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processando...
                    </>
                  ) : (
                    'Processar Arquivo'
                  )}
                </Button>
              </div>
            </div>
          )}

          {step === 'preview' && (
            <div className="space-y-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">
                  Preview dos {previewData.length} colaboradores a serem importados:
                </h3>
                <p className="text-sm text-gray-800">
                  Revise os dados antes de confirmar a importação
                </p>
              </div>

              {/* Preview Table */}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="max-h-96 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium text-gray-900">Nome</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-900">Login</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-900">Cargo</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-900">Tipo</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-900">Departamento</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {previewData.map((colaborador, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-gray-900">{colaborador.nome} {colaborador.sobrenome}</td>
                          <td className="px-4 py-3 font-mono text-gray-900">{colaborador.login}</td>
                          <td className="px-4 py-3 text-gray-900">{colaborador.cargo}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              colaborador.tipo === 'vendedor' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {colaborador.tipo}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-900">{colaborador.departamento}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Options */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3">Opções de Importação:</h4>
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sobrescreverExistentes}
                    onChange={(e) => setSobrescreverExistentes(e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-900">
                      Atualizar colaboradores existentes
                    </span>
                    <p className="text-xs text-gray-600">
                      {sobrescreverExistentes 
                        ? "✅ Logins existentes serão atualizados com novos dados (nome, cargo, tipo)" 
                        : "❌ Logins existentes serão ignorados e reportados como erro"
                      }
                    </p>
                  </div>
                </label>
              </div>

              {/* Confirm Button */}
              <div className="flex justify-end space-x-3">
                <Button
                  variant="secondary"
                  onClick={() => setStep('upload')}
                  disabled={isProcessing}
                >
                  Voltar
                </Button>
                <Button
                  variant="success"
                  onClick={importarColaboradores}
                  disabled={isProcessing}
                >
                  Confirmar Importação
                </Button>
              </div>
            </div>
          )}

          {step === 'processing' && (
            <div className="text-center py-12">
              <svg className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Importando colaboradores...</h3>
              <p className="text-gray-600">Aguarde enquanto processamos {previewData.length} registros</p>
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
