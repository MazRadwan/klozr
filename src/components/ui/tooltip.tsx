"use client"

import * as React from "react"

interface TooltipProps {
  children: React.ReactNode;
  content: string;
}

// State-based tooltip component for better isolation
export function Tooltip({ children, content }: TooltipProps) {
  const [isVisible, setIsVisible] = React.useState(false);
  
  const handleMouseEnter = () => {
    setIsVisible(true);
  };
  
  const handleMouseLeave = () => {
    setIsVisible(false);
  };
  
  return (
    <div 
      className="relative inline-block" 
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{ isolation: 'isolate' }}
    >
      {children}
      {/* Tooltip container with state-controlled visibility */}
      <div className={`absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 transition-opacity duration-200 pointer-events-none z-[9999] ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
        {/* Tooltip content */}
        <div className="px-3 py-1.5 text-xs text-white bg-gray-900 rounded-md shadow-lg whitespace-nowrap dark:bg-gray-700 relative">
          {content}
          {/* Arrow positioned within the tooltip content */}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900 dark:border-t-gray-700"></div>
        </div>
      </div>
    </div>
  );
}

// Export compatible components for the EntityTypeDropdown
export const TooltipProvider = ({ children }: { children: React.ReactNode }) => <>{children}</>;
export const TooltipTrigger = ({ children }: { children: React.ReactNode }) => <>{children}</>;
export const TooltipContent = ({ children }: { children: React.ReactNode }) => <>{children}</>; 