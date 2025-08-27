"use client";

import { supabase } from '@/lib/supabaseClient';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import bcrypt from 'bcryptjs';
import { useAuth } from '@/hooks/useAuth';
import BaseLayout from '@/components/Layout/BaseLayout';
import Card from '@/components/UI/Card';
import Input from '@/components/UI/Input';
import Button from '@/components/UI/Button';
import Alert from '@/components/UI/Alert';
import FirstAccessModal from '@/components/Modals/FirstAccessModal';

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showFirstAccessModal, setShowFirstAccessModal] = useState(false);
  const [currentUser, setCurrentUser] = useState<{
    id: string;
    nome: string;
    sobrenome: string;
    cargo: string;
    tipo: 'admin' | 'porteiro';
    login: string;
  } | null>(null);
  const router = useRouter();
  const { login: authLogin, user, isLoading: authLoading } = useAuth();

  // Redirecionar se já estiver logado
  useEffect(() => {
    if (user && !authLoading) {
      if (user.tipo === 'admin') {
        router.push('/admin-portal');
      } else if (user.tipo === 'porteiro') {
        router.push('/porteiro-portal');
      } else if (user.tipo === 'vendedor') {
        router.push('/vendedor-portal');
      } else {
        router.push('/qrcode?userType=colaborador');
      }
    }
  }, [user, authLoading, router]);

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    
    const form = e.currentTarget;
    const login = (form.login as HTMLInputElement).value;
    const password = (form.password as HTMLInputElement).value;

    try {
      // Busca usuário na tabela users
      const { data, error: dbError } = await supabase
        .from('users')
        .select('*')
        .eq('login', login)
        .single();

      if (dbError || !data) {
        setError('Usuário ou senha inválidos');
        return;
      }

      // Comparação segura de senha usando bcrypt
      const senhaCorreta = bcrypt.compareSync(password, data.password);
      if (!senhaCorreta) {
        setError('Usuário ou senha inválidos');
        return;
      }

      // Verificar se é primeiro acesso
      if (data.primeiro_acesso === true) {
        setCurrentUser(data);
        setShowFirstAccessModal(true);
        setIsLoading(false);
        return;
      }

      // Login normal - redireciona conforme o tipo
      proceedToApp(data);

    } catch (error) {
      console.error('Erro no login:', error);
      setError('Erro interno do servidor. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  }

  const proceedToApp = (userData: {
    id: string;
    nome: string;
    sobrenome: string;
    cargo: string;
    tipo: 'admin' | 'porteiro';
    login: string;
  }) => {
    // Usar o método login do hook de autenticação
    authLogin({
      id: userData.id,
      nome: userData.nome,
      sobrenome: userData.sobrenome,
      tipo: userData.tipo,
      login: userData.login
    });

    // Redirecionar conforme o tipo
    if (userData.tipo === 'admin') {
      router.push('/admin-portal');
    } else if (userData.tipo === 'porteiro') {
      router.push('/porteiro-portal');
    } else if (userData.tipo === 'vendedor') {
      router.push('/vendedor-portal');
    } else {
      // Colaborador vai direto para o QRCode
      router.push('/qrcode?userType=colaborador');
    }
  };

  const handleFirstAccessSuccess = () => {
    setShowFirstAccessModal(false);
    if (currentUser) {
      proceedToApp(currentUser);
    }
  };

  const lockIcon = (
    <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  );

  // Mostrar loading enquanto verifica a autenticação
  if (authLoading) {
    return (
      <BaseLayout
        title="R3 Access"
        description="Sistema de controle de acesso inteligente"
        icon={lockIcon}
        showBackButton={false}
        bgColor="from-blue-50 via-indigo-50 to-purple-50"
      >
        <Card className="backdrop-blur-lg bg-white/80">
          <div className="text-center py-8">
            <svg className="animate-spin h-8 w-8 mx-auto mb-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-gray-600">Verificando autenticação...</p>
          </div>
        </Card>
      </BaseLayout>
    );
  }

  const userIcon = (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );

  const lockFieldIcon = (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  );

  return (
    <>
      <BaseLayout
        title="R3 Access"
        description="Sistema de controle de acesso inteligente"
        icon={lockIcon}
        showBackButton={false}
        bgColor="from-blue-50 via-indigo-50 to-purple-50"
      >
        <Card className="backdrop-blur-lg bg-white/80">
          <form className="space-y-6" onSubmit={handleLogin}>
            <div className="text-center mb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-2">
                Bem-vindo de volta!
              </h2>
              <p className="text-gray-600">
                Entre com suas credenciais para acessar o sistema
              </p>
            </div>

            <Input
              label="Login"
              name="login"
              type="text"
              placeholder="nome.sobrenome"
              required
              icon={userIcon}
              helpText="Use seu login no formato nome.sobrenome"
            />

            <Input
              label="Senha"
              name="password"
              type="password"
              placeholder="Digite sua senha"
              required
              icon={lockFieldIcon}
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              disabled={isLoading}
              className="mt-8"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Entrando...
                </>
              ) : (
                'Entrar no Sistema'
              )}
            </Button>
          </form>

          {error && (
            <div className="mt-6">
              <Alert type="error" message={error} />
            </div>
          )}

          {/* Footer info */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="text-center">
              <div className="flex justify-center space-x-6 text-xs text-gray-400">
                <span className="flex items-center">
                  <svg className="w-4 h-4 mr-1 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  Seguro
                </span>
                <span className="flex items-center">
                  <svg className="w-4 h-4 mr-1 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  Mobile
                </span>
                <span className="flex items-center">
                  <svg className="w-4 h-4 mr-1 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Rápido
                </span>
              </div>
            </div>
          </div>
        </Card>
      </BaseLayout>

      {/* Modal de primeiro acesso */}
      {currentUser && (
        <FirstAccessModal
          isOpen={showFirstAccessModal}
          onClose={() => setShowFirstAccessModal(false)}
          onSuccess={handleFirstAccessSuccess}
          userId={currentUser.id}
          userName={`${currentUser.nome} ${currentUser.sobrenome}`}
        />
      )}
    </>
  );
}
