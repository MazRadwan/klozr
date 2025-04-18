"use client";

import React from 'react';
import { useTheme } from 'next-themes';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Link from 'next/link';

/**
 * DashboardLayout component provides the main structure for the CRM dashboard
 * with a fixed sidebar, header with theme toggle, and main content area.
 * @param children - The content to be rendered within the dashboard layout
 */
import { useState, useRef, useEffect } from 'react';

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { theme, setTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Close sidebar when clicking outside (mobile)
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
      {/* Hamburger for mobile */}
      <button
        className="fixed top-4 left-4 z-40 flex md:hidden items-center justify-center w-10 h-10 rounded-full bg-white/80 dark:bg-slate-900/80 shadow-lg backdrop-blur-md border border-white/20 dark:border-slate-800/30"
        aria-label="Open sidebar"
        onClick={() => setSidebarOpen(true)}
      >
        <span className="block w-6 h-0.5 bg-gradient-to-r from-indigo-400 via-sky-400 to-blue-600 rounded-full mb-1" />
        <span className="block w-6 h-0.5 bg-gradient-to-r from-indigo-400 via-sky-400 to-blue-600 rounded-full mb-1" />
        <span className="block w-6 h-0.5 bg-gradient-to-r from-indigo-400 via-sky-400 to-blue-600 rounded-full" />
      </button>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-black/40 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside
  ref={sidebarRef}
  className={cn(
    // Vibrant vertical gradient for sidebar
    "fixed inset-y-0 left-0 z-40 flex flex-col h-screen bg-gradient-to-b from-indigo-500 via-sky-400 to-blue-600 shadow-xl border-r-4 border-blue-400/60 dark:border-indigo-900/60 backdrop-blur-lg transition-all duration-300 overflow-hidden",
    "group/sidebar",
    sidebarOpen ? "w-64" : "w-16 md:w-20 hover:w-64 focus-within:w-64",
    sidebarOpen ? "md:w-64" : ""
  )}
  onMouseEnter={() => !sidebarOpen && window.innerWidth >= 768 && setSidebarOpen(true)}
  onMouseLeave={() => sidebarOpen && window.innerWidth >= 768 && setSidebarOpen(false)}
  tabIndex={-1}
  aria-label="Sidebar navigation"
>
  <div className="flex h-16 items-center px-4 border-b border-blue-100/40 dark:border-indigo-900/40 transition-all duration-300">
    <div className="flex items-center gap-2">
      {/* Collapsed: show circular K icon; Expanded: show KLOZR logo */}
      {sidebarOpen ? (
  <span className="text-2xl font-extrabold bg-gradient-to-r from-indigo-400 via-sky-400 to-blue-600 bg-clip-text text-transparent animate-gradient-x">KLOZR</span>
) : (
  <span className="w-10 h-10 flex items-center justify-center rounded-full bg-gradient-to-r from-indigo-400 via-sky-400 to-blue-600 text-white font-extrabold text-lg">K</span>
)}
      <span className="hidden md:inline-block text-xs font-bold tracking-widest text-white/80 dark:text-slate-300/60 ml-1 px-2 py-1 rounded-full bg-gradient-to-r from-indigo-500/30 to-blue-600/30 backdrop-blur-md">CRM</span>
    </div>
  </div>
        <nav className="flex flex-col gap-1 px-2 py-6">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 rounded-lg px-3 py-2 my-1 text-white/90 dark:text-blue-100 hover:bg-white/90 hover:text-indigo-900 dark:hover:bg-blue-100/80 dark:hover:text-indigo-900 transition-colors font-semibold shadow-sm"
          >
            <span className="inline-block w-6 text-white/90 dark:text-blue-100"><svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-layout-dashboard"><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/></svg></span>
            <span className={sidebarOpen ? "opacity-100 ml-2" : "opacity-0 ml-0 w-0 overflow-hidden transition-all duration-300"}>Dashboard</span>
          </Link>
          <Link
            href="/customers"
            className="flex items-center gap-3 rounded-lg px-3 py-2 my-1 text-white/90 dark:text-blue-100 hover:bg-white/90 hover:text-indigo-900 dark:hover:bg-blue-100/80 dark:hover:text-indigo-900 transition-colors font-semibold shadow-sm"
          >
            <span className="inline-block w-6 text-white/90 dark:text-blue-100"><svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-users"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></span>
            <span className={sidebarOpen ? "opacity-100 ml-2" : "opacity-0 ml-0 w-0 overflow-hidden transition-all duration-300"}>Customers</span>
          </Link>
          <Link
            href="/pipeline"
            className="flex items-center gap-3 rounded-lg px-3 py-2 my-1 text-white/90 dark:text-blue-100 hover:bg-white/90 hover:text-indigo-900 dark:hover:bg-blue-100/80 dark:hover:text-indigo-900 transition-colors font-semibold shadow-sm"
          >
            <span className="inline-block w-6 text-white/90 dark:text-blue-100"><svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-kanban"><rect x="2" y="2" width="20" height="20" rx="2.18"/><path d="M6 6v8"/><path d="M12 6v4"/><path d="M18 6v12"/></svg></span>
            <span className={sidebarOpen ? "opacity-100 ml-2" : "opacity-0 ml-0 w-0 overflow-hidden transition-all duration-300"}>Sales Pipeline</span>
          </Link>
          <div className="flex-1" />
          <Link
            href="/api/auth/signout"
            className="flex items-center gap-3 rounded-lg px-3 py-2 my-1 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-red-600 dark:hover:text-red-400 transition-colors"
          >
            <span className="inline-block w-6 text-white/90 dark:text-blue-100"><svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-log-out"><path d="M9 16l-4-4 4-4"/><path d="M5 12h12"/><path d="M17 16v1a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v1"/></svg></span>
            <span className={sidebarOpen ? "opacity-100 ml-2" : "opacity-0 ml-0 w-0 overflow-hidden transition-all duration-300"}>Logout</span>
          </Link>
        </nav>
      </aside>

      {/* Main Content */}
      <div className={cn("flex-1 transition-all duration-300", sidebarOpen ? "ml-64" : "ml-16 md:ml-20")}>  
        {/* Header */}
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between px-6 bg-white/95 dark:bg-gray-950/95 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 transition-colors duration-300">
          <h1 className="text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-indigo-600">Dashboard</h1>
          <Button
            variant="outline"
            size="icon"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="rounded-full border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            {theme === 'dark' ? (
              <Sun className="h-5 w-5 text-yellow-500" />
            ) : (
              <Moon className="h-5 w-5 text-indigo-600" />
            )}
          </Button>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-auto p-6 bg-gradient-to-b from-transparent to-gray-50 dark:to-gray-900 transition-colors duration-300">
          {children}
        </main>
      </div>
    </div>
  );
}
