"use client"

import * as React from "react"

interface TooltipProps {
  children: React.ReactNode;
  content: string;
}

// Simple CSS-based tooltip component
export function Tooltip({ children, content }: TooltipProps) {
  return (
    <div className="relative inline-block [&:hover>div:last-child]:opacity-100">
      {children}
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1.5 text-xs text-white bg-gray-900/95 rounded-md shadow-lg opacity-0 transition-opacity duration-100 pointer-events-none whitespace-nowrap z-50 dark:bg-gray-700/95">
        {content}
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900/95 dark:border-t-gray-700/95"></div>
      </div>
    </div>
  );
}

// Export compatible components for the EntityTypeDropdown
export const TooltipProvider = ({ children }: { children: React.ReactNode }) => <>{children}</>;
export const TooltipTrigger = ({ children }: { children: React.ReactNode }) => <>{children}</>;
export const TooltipContent = ({ children }: { children: React.ReactNode }) => <>{children}</>; 