"use client";
import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedTypes?: string[];
}

export default function ProtectedRoute({ children, allowedTypes }: ProtectedRouteProps) {
  const { user, isLoading, requireAuth } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      requireAuth(allowedTypes);
    }
  }, [user, isLoading, allowedTypes]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100">
        <div className="text-center">
          <p className="text-gray-600">Redirecionando para login...</p>
        </div>
      </div>
    );
  }

  if (allowedTypes && !allowedTypes.includes(user.tipo)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100">
        <div className="text-center">
          <p className="text-red-600">Acesso não autorizado!</p>
          <p className="text-gray-600">Redirecionando...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
