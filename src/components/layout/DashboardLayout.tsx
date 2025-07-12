"use client";

import React from 'react';
import { useTheme } from 'next-themes';
import { Moon, Sun, PanelLeft, PanelLeftClose, BarChart3, Users, Handshake, Wallet, Settings, Menu, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { ThemeToggle } from '@/components/ThemeToggle';
import { usePathname } from 'next/navigation';

function DynamicHeaderTitle() {
  const pathname = usePathname();
  let title = 'Dashboard';
  if (pathname.startsWith('/dashboard/contacts')) title = 'Contacts';
  else if (pathname.startsWith('/dashboard/companies')) title = 'Companies';
  else if (pathname.startsWith('/dashboard/deals')) title = 'Deals';
  else if (pathname.startsWith('/pipeline')) title = 'Sales Pipeline';
  return (
    <h1 className="text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-indigo-600">{title}</h1>
  );
}

/**
 * DashboardLayout component provides the main structure for the CRM dashboard
 * with a responsive sidebar, header with theme toggle, and main content area.
 * @param children - The content to be rendered within the dashboard layout
 */
import { useState, useRef, useEffect } from 'react';

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { theme, setTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Check if mobile screen
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Close sidebar when clicking outside (mobile only)
  useEffect(() => {
    if (!sidebarOpen || !isMobile) return;
    function handleClick(e: MouseEvent) {
      if (sidebarRef.current && !sidebarRef.current.contains(e.target as Node)) {
        setSidebarOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [sidebarOpen, isMobile]);

  // Close sidebar on mobile when route changes
  const pathname = usePathname();
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [pathname, isMobile]);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 transition-colors duration-300">

      {/* Mobile Backdrop */}
      {isMobile && sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden" 
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        ref={sidebarRef}
        className={cn(
          "bg-gray-800 text-white transition-all duration-300 z-50",
          // Mobile styles
          isMobile ? [
            "fixed top-0 left-0 h-full",
            sidebarOpen ? "w-64 translate-x-0" : "w-64 -translate-x-full"
          ] : [
            // Desktop styles
            "sticky top-0 h-screen",
            sidebarOpen ? "w-64" : "w-0"
          ],
          "overflow-hidden"
        )}
      >
        <div className="flex h-16 items-center justify-between px-4 border-b border-gray-700 min-w-64">
          {/* Logo on mobile sidebar */}
          {isMobile && (
            <div className="flex items-center gap-2">
              <img 
                src="/KLOZR_LOGO_RED.svg" 
                alt="KLOZR" 
                className="h-8 w-auto brightness-0 invert"
              />
            </div>
          )}
          
          {/* Close sidebar button */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors text-white/70 hover:text-white ml-auto"
            aria-label="Close sidebar"
          >
            <PanelLeftClose size={18} />
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
              <LogOut size={20} />
              <span>Logout</span>
            </button>
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col transition-all duration-300 min-w-0">
        {/* Header */}
        <header className="sticky top-0 z-40 h-16 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 flex items-center justify-between">
          <div className="flex items-center gap-3 md:gap-4 min-w-0 flex-1">
            {/* Hamburger menu button */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 md:hidden"
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>

            {/* Desktop sidebar toggle */}
            {!isMobile && !sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hidden md:block"
                aria-label="Open sidebar"
              >
                <PanelLeft size={18} />
              </button>
            )}

            {/* KLOZR Logo */}
            <div className="flex items-center gap-2 min-w-0">
              <img 
                src="/KLOZR_LOGO_RED.svg" 
                alt="KLOZR" 
                className="h-8 md:h-12 lg:h-16 w-auto flex-shrink-0"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-2 flex-shrink-0">
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

        {/* Main Content Area */}
        <main className="flex-1 overflow-auto p-3 md:p-6 bg-gradient-to-b from-transparent to-gray-50 dark:to-gray-900 transition-colors duration-300">
          {children}
        </main>
      </div>
    </div>
  );
}
