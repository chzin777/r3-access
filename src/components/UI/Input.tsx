import React from 'react';

interface InputProps {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
  icon?: React.ReactNode;
  helpText?: string;
}

export default function Input({
  label,
  name,
  type = 'text',
  placeholder,
  required = false,
  value,
  onChange,
  className = '',
  icon,
  helpText
}: InputProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      <label className="block text-sm font-semibold text-gray-700 mb-2">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <div className="text-gray-400">
              {icon}
            </div>
          </div>
        )}
        
        <input
          type={type}
          name={name}
          placeholder={placeholder}
          required={required}
          value={value}
          onChange={onChange}
          className={`
            w-full px-4 py-3 border border-gray-200 rounded-xl 
            focus:ring-2 focus:ring-blue-500 focus:border-transparent 
            transition-all duration-200 text-gray-900 placeholder-gray-400
            bg-white bg-opacity-70 backdrop-blur-sm
            hover:bg-opacity-100 focus:bg-opacity-100
            ${icon ? 'pl-10' : ''}
          `}
        />
      </div>
      
      {helpText && (
        <p className="text-xs text-gray-500 mt-1">{helpText}</p>
      )}
    </div>
  );
}
