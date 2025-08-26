import React from 'react';
import Link from 'next/link';

interface ActionLinkProps {
  href: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'indigo';
  className?: string;
}

export default function ActionLink({ 
  href, 
  title, 
  description, 
  icon, 
  color = 'blue',
  className = '' 
}: ActionLinkProps) {
  const colorClasses = {
    blue: "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500",
    green: "bg-green-600 hover:bg-green-700 focus:ring-green-500",
    yellow: "bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500",
    red: "bg-red-600 hover:bg-red-700 focus:ring-red-500",
    purple: "bg-purple-600 hover:bg-purple-700 focus:ring-purple-500",
    indigo: "bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500"
  };

  return (
    <Link 
      href={href} 
      className={`
        group block w-full ${colorClasses[color]} text-white font-semibold 
        py-4 px-6 rounded-xl transition-all duration-200 transform 
        hover:scale-[1.02] hover:shadow-lg active:scale-[0.98]
        focus:outline-none focus:ring-2 focus:ring-offset-2 
        ${className}
      `}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex-shrink-0 text-white group-hover:scale-110 transition-transform duration-200">
            {icon}
          </div>
          <div className="text-left">
            <div className="font-semibold text-base">{title}</div>
            <div className="text-sm opacity-90 font-normal">{description}</div>
          </div>
        </div>
        <svg 
          className="w-5 h-5 text-white opacity-70 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-200" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </Link>
  );
}
