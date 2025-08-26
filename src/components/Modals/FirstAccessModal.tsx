import React, { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import bcrypt from 'bcryptjs';
import Button from '@/components/UI/Button';
import Input from '@/components/UI/Input';
import Alert from '@/components/UI/Alert';

interface FirstAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userId: string;
  userName: string;
}

export default function FirstAccessModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  userId, 
  userName 
}: FirstAccessModalProps) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    // Validações
    if (newPassword.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres');
      setIsLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('As senhas não coincidem');
      setIsLoading(false);
      return;
    }

    try {
      // Gerar hash da nova senha
      const hashedPassword = bcrypt.hashSync(newPassword, 10);

      // Atualizar senha no banco e marcar primeiro acesso como completo
      const { error: updateError } = await supabase
        .from('users')
        .update({
          password: hashedPassword,
          primeiro_acesso: false,
          data_primeiro_acesso: new Date().toISOString()
        })
        .eq('id', userId);

      if (updateError) {
        throw updateError;
      }

      onSuccess();
    } catch (error) {
      console.error('Erro ao alterar senha:', error);
      setError('Erro ao alterar senha. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const lockIcon = (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  );

  const keyIcon = (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
    </svg>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 animate-fade-in">
        <div className="p-6">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Primeiro Acesso
            </h2>
            <p className="text-gray-600">
              Olá, <strong>{userName}</strong>! Por segurança, você precisa definir uma nova senha.
            </p>
          </div>

          <form onSubmit={handlePasswordChange} className="space-y-4">
            <Input
              label="Nova Senha"
              name="newPassword"
              type="password"
              placeholder="Digite sua nova senha"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              icon={keyIcon}
              helpText="Mínimo de 6 caracteres"
            />

            <Input
              label="Confirmar Senha"
              name="confirmPassword"
              type="password"
              placeholder="Digite novamente a nova senha"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              icon={lockIcon}
            />

            {error && (
              <Alert type="error" message={error} />
            )}

            <div className="flex space-x-3 mt-6">
              <Button
                type="submit"
                variant="primary"
                fullWidth
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Alterando...
                  </>
                ) : (
                  'Confirmar Nova Senha'
                )}
              </Button>
            </div>
          </form>

          {/* Info */}
          <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
            <div className="flex items-start space-x-3">
              <svg className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h4 className="text-blue-800 font-medium mb-1">Dicas de segurança:</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Use pelo menos 6 caracteres</li>
                  <li>• Combine letras, números e símbolos</li>
                  <li>• Não use informações pessoais</li>
                  <li>• Mantenha sua senha em segredo</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
