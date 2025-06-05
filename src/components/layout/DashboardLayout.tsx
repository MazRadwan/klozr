"use client";

import React from 'react';
import { useTheme } from 'next-themes';
import { Moon, Sun, PanelLeft, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { ThemeToggle } from '@/components/ThemeToggle';
import { usePathname } from 'next/navigation';

function DynamicHeaderTitle() {
  const pathname = usePathname();
  let title = 'Dashboard';
  if (pathname.startsWith('/dashboard/contacts')) title = 'Contacts';
  else if (pathname.startsWith('/dashboard/deals')) title = 'Deals';
  else if (pathname.startsWith('/pipeline')) title = 'Sales Pipeline';
  return (
    <h1 className="text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-indigo-600">{title}</h1>
  );
}


/**
 * DashboardLayout component provides the main structure for the CRM dashboard
 * with a fixed sidebar, header with theme toggle, and main content area.
 * @param children - The content to be rendered within the dashboard layout
 */
import { useState, useRef, useEffect } from 'react';

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { theme, setTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false); // Default to closed for max real estate
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Close sidebar when clicking outside
  useEffect(() => {
    if (!sidebarOpen) return;
    function handleClick(e: MouseEvent) {
      if (sidebarRef.current && !sidebarRef.current.contains(e.target as Node)) {
        setSidebarOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [sidebarOpen]);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 transition-colors duration-300">

      {/* Sidebar - Takes up layout space when open */}
      <aside
        ref={sidebarRef}
        className={cn(
          "flex flex-col h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 shadow-2xl border-r border-gray-700 transition-all duration-300 ease-in-out overflow-hidden",
          sidebarOpen ? "w-64" : "w-0"
        )}
      >
        <div className="flex h-16 items-center justify-between px-4 border-b border-gray-700 min-w-64">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-sky-400 to-blue-600 whitespace-nowrap">KLOZR</span>
          </div>
          {/* Close sidebar button - ChatGPT style */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors text-white/70 hover:text-white"
            aria-label="Close sidebar"
          >
            <X size={18} />
          </button>
        </div>
        
        <nav className="flex flex-col gap-1 px-3 py-6 flex-1 min-w-64">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-white/90 hover:bg-white/10 transition-colors font-medium whitespace-nowrap"
            onClick={() => setSidebarOpen(false)}
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-layout-dashboard flex-shrink-0">
              <rect x="3" y="3" width="7" height="9" rx="1"/>
              <rect x="14" y="3" width="7" height="5" rx="1"/>
              <rect x="14" y="12" width="7" height="9" rx="1"/>
              <rect x="3" y="16" width="7" height="5" rx="1"/>
            </svg>
            <span>Dashboard</span>
          </Link>
          
          <Link
            href="/dashboard/contacts"
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-white/90 hover:bg-white/10 transition-colors font-medium whitespace-nowrap"
            onClick={() => setSidebarOpen(false)}
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-address-book flex-shrink-0">
              <rect width="18" height="20" x="3" y="2" rx="2"/>
              <path d="M7 7h10M7 11h10M7 15h10"/>
            </svg>
            <span>Contacts</span>
          </Link>
          
          <Link
            href="/dashboard/deals"
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-white/90 hover:bg-white/10 transition-colors font-medium whitespace-nowrap"
            onClick={() => setSidebarOpen(false)}
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-handshake flex-shrink-0">
              <path d="M11 17a4 4 0 0 1-8 0V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2z"/>
              <path d="m15 5 4-4v18l-4-4h-5"/>
            </svg>
            <span>Deals</span>
          </Link>
          
          <Link
            href="/pipeline"
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-white/90 hover:bg-white/10 transition-colors font-medium whitespace-nowrap"
            onClick={() => setSidebarOpen(false)}
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-kanban flex-shrink-0">
              <rect x="2" y="2" width="20" height="20" rx="2.18"/>
              <path d="M6 6v8"/>
              <path d="M12 6v4"/>
              <path d="M18 6v12"/>
            </svg>
            <span>Sales Pipeline</span>
          </Link>
          
          <div className="flex-1" />
          
          <button
            onClick={async () => {
              const { signOut } = await import('next-auth/react');
              signOut({ callbackUrl: '/' });
            }}
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-gray-400 hover:bg-red-500/10 hover:text-red-400 transition-colors font-medium w-full text-left whitespace-nowrap"
            type="button"
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-log-out flex-shrink-0">
              <path d="M9 16l-4-4 4-4"/>
              <path d="M5 12h12"/>
              <path d="M17 16v1a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v1"/>
            </svg>
            <span>Logout</span>
          </button>
        </nav>
      </aside>

      {/* Main Content - Shifts right when sidebar opens */}
      <div className="flex-1 flex flex-col transition-all duration-300">  
        {/* Header */}
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between px-6 bg-white/95 dark:bg-gray-950/95 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 transition-colors duration-300">
          <div className="flex items-center gap-4">
            {/* Open sidebar button - ChatGPT style, only shown when sidebar is closed */}
            {!sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                aria-label="Open sidebar"
              >
                <PanelLeft size={18} />
              </button>
            )}
            <DynamicHeaderTitle />
          </div>
          <ThemeToggle />
        </header>

        {/* Main Content Area - Responsive to sidebar state */}
        <main className="flex-1 overflow-auto p-6 bg-gradient-to-b from-transparent to-gray-50 dark:to-gray-900 transition-colors duration-300">
          {children}
        </main>
      </div>
    </div>
  );
}
