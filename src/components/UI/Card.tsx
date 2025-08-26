import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'sm' | 'md' | 'lg';
  shadow?: 'sm' | 'md' | 'lg' | 'xl';
  hover?: boolean;
}

export default function Card({ 
  children, 
  className = '', 
  padding = 'md',
  shadow = 'lg',
  hover = true
}: CardProps) {
  const paddingClasses = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  };

  const shadowClasses = {
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg',
    xl: 'shadow-xl'
  };

  return (
    <div 
      className={`
        bg-white bg-opacity-95 backdrop-blur-sm rounded-2xl border border-white border-opacity-20 
        ${paddingClasses[padding]} 
        ${shadowClasses[shadow]} 
        ${hover ? 'transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] hover:bg-opacity-100' : ''} 
        ${className}
      `}
    >
      {children}
    </div>
  );
}
