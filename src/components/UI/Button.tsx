import React from 'react';

interface ButtonProps {
  children: React.ReactNode;
  type?: 'button' | 'submit' | 'reset';
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
  icon?: React.ReactNode;
}

export default function Button({
  children,
  type = 'button',
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled = false,
  onClick,
  className = '',
  icon
}: ButtonProps) {
  const baseClasses = "inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 active:scale-95";
  
  const variantClasses = {
    primary: "bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl focus:ring-blue-500",
    secondary: "bg-gray-600 hover:bg-gray-700 text-white shadow-lg hover:shadow-xl focus:ring-gray-500",
    success: "bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl focus:ring-green-500",
    warning: "bg-yellow-600 hover:bg-yellow-700 text-white shadow-lg hover:shadow-xl focus:ring-yellow-500",
    danger: "bg-red-600 hover:bg-red-700 text-white shadow-lg hover:shadow-xl focus:ring-red-500"
  };

  const sizeClasses = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3 text-base",
    lg: "px-8 py-4 text-lg"
  };

  const disabledClasses = disabled ? "opacity-50 cursor-not-allowed" : "hover:scale-[1.02] hover:cursor-pointer";
  const widthClasses = fullWidth ? "w-full" : "";

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        ${baseClasses}
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${disabledClasses}
        ${widthClasses}
        ${className}
      `}
    >
      {icon && <span className="mr-2">{icon}</span>}
      {children}
    </button>
  );
}
