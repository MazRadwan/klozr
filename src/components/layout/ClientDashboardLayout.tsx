"use client";

import React from 'react';
// KLOZR: Use redesigned DashboardLayout with ChatGPT-style sidebar
import { DashboardLayout } from './DashboardLayout';

/**
 * ClientDashboardLayout is a client-side wrapper for DashboardLayout to ensure proper rendering in Next.js App Router.
 * @param children - The content to be rendered within the dashboard layout
 */
export function ClientDashboardLayout({ children }: { children: React.ReactNode }) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
