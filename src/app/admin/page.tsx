
"use client";
import { supabase } from '@/lib/supabaseClient';
import { useState } from 'react';
import bcrypt from 'bcryptjs';
import ProtectedRoute from '@/components/ProtectedRoute';
import BaseLayout from '@/components/Layout/BaseLayout';
import Card from '@/components/UI/Card';
import Input from '@/components/UI/Input';
import Button from '@/components/UI/Button';
import Alert from '@/components/UI/Alert';
import ImportColaboradoresModal from '@/components/Modals/ImportColaboradoresModal';

export default function AdminPage() {
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  async function handleRegister(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMsg(null);
    setError(null);
    setIsLoading(true);

    const form = e.currentTarget;
    const login = (form.login as HTMLInputElement).value;
    const password = (form.password as HTMLInputElement).value;
    const nome = (form.nome as HTMLInputElement).value;
    const sobrenome = (form.sobrenome as HTMLInputElement).value;
    const cargo = (form.cargo as HTMLInputElement).value;
    let tipo = 'colaborador';
    const cargoNorm = cargo.trim().toLowerCase();
    if (cargoNorm === 'porteiro') {
      tipo = 'porteiro';
    } else if (cargoNorm.includes('administrador') || cargoNorm.includes('admin')) {
      tipo = 'admin';
    } else if (cargoNorm.includes('vendas') || cargoNorm.includes('vendedor') || cargoNorm.includes('vendedora') || cargoNorm.includes('comercial') || cargoNorm.includes('representante')) {
      tipo = 'vendedor';
    }
    // Garante que tipo seja sempre um dos aceitos pelo banco
    if (!["admin", "porteiro", "colaborador", "vendedor"].includes(tipo)) {
      tipo = 'colaborador';
    }
    const foto_url = (form.foto_url as HTMLInputElement).value;

    try {
      // Gera hash da senha
      const hash = bcrypt.hashSync(password, 10);

      // Insere usuário
      const { error: insertError } = await supabase.from('users').insert({
        login,
        password: hash,
        nome,
        sobrenome,
        cargo,
        tipo,
        foto_url: foto_url || null,
      });

      if (insertError) {
        setError('Erro ao cadastrar usuário: ' + insertError.message);
      } else {
        setMsg(`Usuário ${nome} ${sobrenome} cadastrado com sucesso como ${tipo}!`);
        form.reset();
      }
    } catch (error) {
      console.error('Erro no cadastro:', error);
      setError('Erro interno do servidor. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  }

  const handleImportSuccess = (importedCount: number) => {
    setMsg(`${importedCount} colaborador(es) importado(s) com sucesso!`);
    setError(null);
  };

  const adminIcon = (
    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
    </svg>
  );

  const userIcon = (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );

  const lockIcon = (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  );

  const briefcaseIcon = (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0H8m8 0v2a2 2 0 01-2 2H10a2 2 0 01-2-2V6" />
    </svg>
  );

  const photoIcon = (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );

  return (
    <ProtectedRoute allowedTypes={['admin']}>
      <BaseLayout
        title="Cadastrar Usuário"
        description="Adicione colaboradores e porteiros ao sistema"
        icon={adminIcon}
        bgColor="from-green-50 via-emerald-50 to-teal-50"
        backUrl="/admin-portal"
        backText="Voltar ao Portal"
        maxWidth="lg"
      >
      {/* Import Button */}
      <div className="mb-6">
        <Card>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Importação em Lote</h3>
                <p className="text-sm text-gray-600">Importe múltiplos colaboradores através de arquivo CSV</p>
              </div>
            </div>
            <Button
              variant="primary"
              onClick={() => setIsImportModalOpen(true)}
              className="flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
              </svg>
              <span>Importar CSV</span>
            </Button>
          </div>
        </Card>
      </div>

      <Card>
        <form className="space-y-6" onSubmit={handleRegister}>
          {/* Info card */}
          <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-100">
            <div className="flex items-start space-x-3">
              <svg className="w-6 h-6 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h4 className="font-semibold text-green-800 mb-1">Tipos de acesso:</h4>
                <ul className="text-sm text-green-700 space-y-1">
                  <li className="flex items-center">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2"></span>
                    <strong>Administrador:  </strong> Acesso completo ao sistema
                  </li>
                  <li className="flex items-center">
                    <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full mr-2"></span>
                    <strong>Porteiro: </strong> Acesso ao scanner de validação
                  </li>
                  <li className="flex items-center">
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></span>
                    <strong>Colaborador: </strong> Gera QRCode para acesso
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Personal info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Nome"
              name="nome"
              type="text"
              placeholder="Ex: João"
              required
              icon={userIcon}
            />

            <Input
              label="Sobrenome"
              name="sobrenome"
              type="text"
              placeholder="Ex: Silva"
              required
              icon={userIcon}
            />
          </div>

          {/* Login credentials */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Login"
              name="login"
              type="text"
              placeholder="nome.sobrenome"
              required
              icon={userIcon}
              helpText="Será usado para fazer login no sistema"
            />

            <Input
              label="Senha"
              name="password"
              type="password"
              placeholder="Digite uma senha segura"
              required
              icon={lockIcon}
              helpText="Mínimo 6 caracteres recomendado"
            />
          </div>

          {/* Position */}
          <Input
            label="Cargo"
            name="cargo"
            type="text"
            placeholder="Ex: Analista, Porteiro, Administrador"
            required
            icon={briefcaseIcon}
            helpText="O tipo de acesso será definido automaticamente com base no cargo"
          />

          {/* Optional photo */}
          <Input
            label="Foto (URL)"
            name="foto_url"
            type="url"
            placeholder="https://exemplo.com/foto.jpg"
            icon={photoIcon}
            helpText="Opcional - URL de uma foto para identificação"
          />

          {/* Submit button */}
          <div className="pt-4">
            <Button
              type="submit"
              variant="success"
              size="lg"
              fullWidth
              disabled={isLoading}
              className="shadow-lg"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Cadastrando...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Cadastrar Usuário
                </>
              )}
            </Button>
          </div>
        </form>

        {/* Messages */}
        {msg && (
          <div className="mt-6">
            <Alert type="success" message={msg} />
          </div>
        )}

        {error && (
          <div className="mt-6">
            <Alert type="error" message={error} />
          </div>
        )}

        {/* Recent activity */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <h4 className="font-semibold text-gray-800 mb-4">Estatísticas de Cadastro</h4>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-lg font-bold text-blue-600">--</div>
              <div className="text-xs text-blue-600">Total</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-lg font-bold text-green-600">--</div>
              <div className="text-xs text-green-600">Hoje</div>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <div className="text-lg font-bold text-purple-600">--</div>
              <div className="text-xs text-purple-600">Ativos</div>
            </div>
          </div>
        </div>
      </Card>

      {/* Import Modal */}
      <ImportColaboradoresModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={handleImportSuccess}
      />
    </BaseLayout>
    </ProtectedRoute>
  );
}
