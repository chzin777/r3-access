"use client";
import React from 'react';
import { useAuth } from '@/hooks/useAuth';

interface BaseLayoutProps {
  children: React.ReactNode;
  title: string;
  description?: string;
  icon?: React.ReactNode;
  bgColor?: string;
  showBackButton?: boolean;
  backUrl?: string;
  backText?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export default function BaseLayout({
  children,
  title,
  description,
  icon,
  bgColor = "from-blue-50 to-indigo-100",
  showBackButton = true,
  backUrl = "/",
  backText = "Voltar",
  maxWidth = 'md',
  className = ""
}: BaseLayoutProps) {
  const { logout } = useAuth();
  
  const handleBackClick = (e: React.MouseEvent) => {
    // Se o texto do botão for "Sair do Sistema", fazer logout
    if (backText === "Sair do Sistema") {
      e.preventDefault();
      logout();
    }
  };
  
  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl'
  };

  return (
    <main className={`min-h-screen bg-gradient-to-br ${bgColor} ${className}`}>
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full" 
             style={{
               backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
               backgroundSize: '30px 30px'
             }}
        />
      </div>
      
      <div className="relative">
        {/* Mobile-first container */}
        <div className="container-mobile">
          <div className={`mx-auto ${maxWidthClasses[maxWidth]} pt-8 animate-fade-in`}>
            {/* Header */}
            <div className="text-center mb-8">
              {icon && (
                <div className="w-16 h-16 bg-white bg-opacity-20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg animate-bounce-subtle">
                  {icon}
                </div>
              )}
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3 tracking-tight">
                {title}
              </h1>
              {description && (
                <p className="text-gray-600 text-lg max-w-sm mx-auto leading-relaxed">
                  {description}
                </p>
              )}
            </div>
            
            {/* Content */}
            <div className="animate-slide-in-right">
              {children}
            </div>
            
            {/* Back Button */}
            {showBackButton && (
              <div className="text-center mt-8 animate-fade-in" style={{ animationDelay: '0.2s' }}>
                <a 
                  href={backUrl} 
                  onClick={handleBackClick}
                  className="inline-flex items-center px-6 py-3 text-gray-600 hover:text-gray-800 font-medium transition-all duration-200 hover:bg-white hover:bg-opacity-50 rounded-xl backdrop-blur-sm"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  {backText}
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
