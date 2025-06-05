"use client";

import React from 'react';
import { useTheme } from 'next-themes';
import { Moon, Sun, PanelLeft, X, BarChart3, Users, Handshake, Wallet, Settings } from 'lucide-react';
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

      {/* Sidebar */}
      <aside 
        ref={sidebarRef}
        className={`bg-gray-800 text-white transition-all duration-300 ${
          sidebarOpen ? 'w-64' : 'w-0'
        } overflow-hidden`}
      >
        <div className="flex h-16 items-center justify-end px-4 border-b border-gray-700 min-w-64">
          {/* Close sidebar button - ChatGPT style */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors text-white/70 hover:text-white"
            aria-label="Close sidebar"
          >
            <X size={18} />
          </button>
        </div>
        
        <nav className="px-4 py-4 space-y-2 min-w-64">
          <a href="/dashboard" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/10 transition-colors text-white/80 hover:text-white">
            <BarChart3 size={20} />
            <span>Dashboard</span>
          </a>
          <a href="/dashboard/contacts" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/10 transition-colors text-white/80 hover:text-white">
            <Users size={20} />
            <span>Contacts</span>
          </a>
          <a href="/dashboard/deals" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/10 transition-colors text-white/80 hover:text-white">
            <Handshake size={20} />
            <span>Deals</span>
          </a>
          <a href="#" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/10 transition-colors text-white/80 hover:text-white">
            <Wallet size={20} />
            <span>Billing</span>
          </a>
          <a href="#" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/10 transition-colors text-white/80 hover:text-white">
            <Settings size={20} />
            <span>Settings</span>
          </a>
          
          {/* Logout button at bottom of sidebar */}
          <div className="pt-4 mt-4 border-t border-gray-700">
            <button
              onClick={async () => {
                const { signOut } = await import('next-auth/react');
                signOut({ callbackUrl: '/' });
              }}
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-red-500/10 hover:text-red-400 transition-colors text-white/60 w-full text-left"
              type="button"
            >
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-log-out">
                <path d="M9 16l-4-4 4-4"/>
                <path d="M5 12h12"/>
                <path d="M17 16v1a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v1"/>
              </svg>
              <span>Logout</span>
            </button>
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col transition-all duration-300">
        {/* Header */}
        <header className="h-16 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Open sidebar button - Professional style, only shown when sidebar is closed */}
            {!sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                aria-label="Open sidebar"
              >
                <PanelLeft size={18} />
              </button>
            )}
            {/* KLOZR Logo - now in main header */}
            <div className="flex items-center gap-2">
              <span className="text-2xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600">KLOZR</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="w-9 h-9"
            >
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>
          </div>
        </header>

        {/* Main Content Area - Responsive to sidebar state */}
        <main className="flex-1 overflow-auto p-6 bg-gradient-to-b from-transparent to-gray-50 dark:to-gray-900 transition-colors duration-300">
          {children}
        </main>
      </div>
    </div>
  );
}
