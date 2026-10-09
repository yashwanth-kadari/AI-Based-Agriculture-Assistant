import React from 'react';

const Card = ({ children, className = '', title, icon: Icon, action }) => {
  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-200 hover:shadow-md ${className}`}>
      {(title || Icon || action) && (
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div className="flex items-center space-x-3">
            {Icon && (
              <div className="p-2 bg-eco-100 text-eco-600 rounded-lg">
                <Icon className="h-5 w-5" />
              </div>
            )}
            {title && <h3 className="text-lg font-semibold text-gray-800">{title}</h3>}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      <div className="p-6">
        {children}
      </div>
    </div>
  );
};

export default Card;
