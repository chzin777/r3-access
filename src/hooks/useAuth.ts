"use client";
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface User {
  id: string;
  nome: string;
  sobrenome: string;
  tipo: string;
  login: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = () => {
    try {
      const userId = localStorage.getItem('userId');
      const userName = localStorage.getItem('userName');
      const userType = localStorage.getItem('userType');
      const userLogin = localStorage.getItem('userLogin');
      
      if (userId && userName && userType) {
        const [nome, sobrenome] = userName.split(' ');
        // Normaliza para comparar sem acento, maiúsculo/minúsculo e com/sem (a)
        const typeNorm = userType.trim().toLowerCase();
        let tipoFinal = userType;
        if (
          ![
            'admin',
            'administrador',
            'porteiro',
            'vendedor',
            'vendedor(a)'
          ].includes(typeNorm)
        ) {
          tipoFinal = 'Colaborador';
        }
        setUser({
          id: userId,
          nome: nome || '',
          sobrenome: sobrenome || '',
          tipo: tipoFinal,
          login: userLogin || ''
        });
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Erro ao verificar autenticação:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = (userData: User) => {
    localStorage.setItem('userId', userData.id);
    localStorage.setItem('userName', `${userData.nome} ${userData.sobrenome}`);
    localStorage.setItem('userType', userData.tipo);
    localStorage.setItem('userLogin', userData.login);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('userId');
    localStorage.removeItem('userName');
    localStorage.removeItem('userType');
    localStorage.removeItem('userLogin');
    setUser(null);
    router.push('/');
  };

  const requireAuth = (allowedTypes?: string[]) => {
    if (!isLoading && !user) {
      router.push('/');
      return false;
    }

    if (user && allowedTypes && !allowedTypes.includes(user.tipo)) {
      router.push('/');
      return false;
    }

    return true;
  };

  return {
    user,
    isLoading,
    login,
    logout,
    requireAuth,
    isAuthenticated: !!user
  };
}
