import React from 'react';
import { Loader2 } from 'lucide-react';

const Button = ({ 
  children, 
  onClick, 
  type = 'button', 
  variant = 'primary', 
  className = '', 
  disabled = false, 
  isLoading = false,
  icon: Icon
}) => {
  const baseClasses = 'inline-flex items-center justify-center px-4 py-2 font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const variants = {
    primary: 'bg-eco-600 text-white hover:bg-eco-700 focus:ring-eco-500 shadow-sm',
    secondary: 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 focus:ring-gray-500 shadow-sm',
    outline: 'bg-transparent text-eco-600 hover:bg-eco-50 border border-eco-600 focus:ring-eco-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 shadow-sm'
  };

  const classes = `${baseClasses} ${variants[variant]} ${disabled || isLoading ? 'opacity-70 cursor-not-allowed' : ''} ${className}`;

  return (
    <button
      type={type}
      className={classes}
      onClick={onClick}
      disabled={disabled || isLoading}
    >
      {isLoading ? (
        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
      ) : Icon ? (
        <Icon className="w-5 h-5 mr-2" />
      ) : null}
      {children}
    </button>
  );
};

export default Button;
