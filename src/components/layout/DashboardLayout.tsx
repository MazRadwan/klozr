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
export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 transition-colors duration-300">
      {/* Sidebar */}
      <aside className="group/sidebar fixed inset-y-0 left-0 z-30 flex flex-col h-screen w-16 md:w-20 lg:w-64 bg-white/20 dark:bg-slate-900/40 shadow-xl border-r border-white/10 dark:border-slate-800/30 backdrop-blur-lg transition-all duration-300 hover:w-64 focus-within:w-64 hover:shadow-2xl overflow-hidden">

        <div className="flex h-16 items-center px-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
  <span className="text-2xl font-extrabold bg-gradient-to-r from-indigo-400 via-sky-400 to-blue-600 bg-clip-text text-transparent animate-gradient-x">KLOZR</span>
  <span className="hidden md:inline-block text-xs font-bold tracking-widest text-white/80 dark:text-slate-300/60 ml-1 px-2 py-1 rounded-full bg-gradient-to-r from-indigo-500/30 to-blue-600/30 backdrop-blur-md">CRM</span>
</div>
        </div>
        <nav className="flex flex-col gap-1 px-4 py-6">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-purple-600 dark:hover:text-indigo-400 transition-colors"
          >
            <span className="font-medium">Dashboard</span>
          </Link>
          <Link
            href="/customers"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-purple-600 dark:hover:text-indigo-400 transition-colors"
          >
            <span className="font-medium">Customers</span>
          </Link>
          <Link
            href="/pipeline"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-purple-600 dark:hover:text-indigo-400 transition-colors"
          >
            <span className="font-medium">Sales Pipeline</span>
          </Link>
          <div className="flex-1" />
          <Link
            href="/api/auth/signout"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-red-600 dark:hover:text-red-400 transition-colors"
          >
            <span className="font-medium">Logout</span>
          </Link>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 ml-64 transition-all duration-300">
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
