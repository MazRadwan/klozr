"use client";

import React from 'react';
import { ClientDashboardLayout } from '../../components/layout/ClientDashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { motion } from 'framer-motion';

/**
 * Dashboard page displaying key metrics and quick actions with a modern, gradient-based design.
 */
export default function DashboardPage() {
  // Animation variants for card entrance
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  return (
    <ClientDashboardLayout>
      <div className="relative space-y-8">
  {/* Floating Theme Toggle */}
  <div className="fixed top-6 right-6 z-50">
    {/* Place your ThemeToggle component here, or a styled button if not present */}
  </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Summary Card - Total Customers */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={cardVariants}
            className="relative overflow-hidden group hover:shadow-xl transition-shadow duration-300"
          >
            <Card className="border-0 bg-white dark:bg-gray-950 shadow-md dark:shadow-gray-700/50 overflow-hidden relative z-10">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-400 to-indigo-600 dark:from-purple-800 dark:to-indigo-900 opacity-0 group-hover:opacity-10 transition-opacity duration-500" />
              <CardHeader className="pb-2 relative z-20">
                <CardTitle className="text-lg font-semibold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-indigo-600 dark:from-purple-400 dark:to-indigo-400">Total Customers</CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">All active customers</CardDescription>
              </CardHeader>
              <CardContent className="relative z-20">
                <div className="text-3xl font-bold text-gray-900 dark:text-white">1,247</div>
              </CardContent>
            </Card>
            <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-gradient-to-br from-purple-500 to-indigo-600 dark:from-purple-700 dark:to-indigo-800 rounded-full opacity-5 blur-xl" />
          </motion.div>

          {/* Summary Card - Open Deals */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={cardVariants}
            className="relative overflow-hidden group hover:shadow-xl transition-shadow duration-300"
            transition={{ delay: 0.1 }}
          >
            <Card className="border-0 bg-white dark:bg-gray-950 shadow-md dark:shadow-gray-700/50 overflow-hidden relative z-10">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 to-teal-600 dark:from-emerald-800 dark:to-teal-900 opacity-0 group-hover:opacity-10 transition-opacity duration-500" />
              <CardHeader className="pb-2 relative z-20">
                <CardTitle className="text-lg font-semibold bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-400 dark:to-teal-400">Open Deals</CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">Deals in pipeline</CardDescription>
              </CardHeader>
              <CardContent className="relative z-20">
                <div className="text-3xl font-bold text-gray-900 dark:text-white">83</div>
              </CardContent>
            </Card>
            <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-gradient-to-br from-emerald-500 to-teal-600 dark:from-emerald-700 dark:to-teal-800 rounded-full opacity-5 blur-xl" />
          </motion.div>

          {/* Summary Card - Recent Activity */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={cardVariants}
            className="relative overflow-hidden group hover:shadow-xl transition-shadow duration-300"
            transition={{ delay: 0.2 }}
          >
            <Card className="border-0 bg-white dark:bg-gray-950 shadow-md dark:shadow-gray-700/50 overflow-hidden relative z-10">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-400 to-orange-600 dark:from-amber-800 dark:to-orange-900 opacity-0 group-hover:opacity-10 transition-opacity duration-500" />
              <CardHeader className="pb-2 relative z-20">
                <CardTitle className="text-lg font-semibold bg-clip-text text-transparent bg-gradient-to-r from-amber-600 to-orange-600 dark:from-amber-400 dark:to-orange-400">Recent Activity</CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">Last 7 days</CardDescription>
              </CardHeader>
              <CardContent className="relative z-20">
                <div className="text-3xl font-bold text-gray-900 dark:text-white">14</div>
              </CardContent>
            </Card>
            <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-gradient-to-br from-amber-500 to-orange-600 dark:from-amber-700 dark:to-orange-800 rounded-full opacity-5 blur-xl" />
          </motion.div>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <motion.button
  whileHover={{ scale: 1.01 }}
  whileTap={{ scale: 0.98 }}
  className="px-5 py-2.5 rounded-md font-semibold border-2 border-indigo-700 text-indigo-700 bg-transparent hover:bg-indigo-700 hover:text-white transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-indigo-400/70 focus:ring-offset-2"
>
  Add Customer
</motion.button>
<motion.button
  whileHover={{ scale: 1.01 }}
  whileTap={{ scale: 0.98 }}
  className="px-5 py-2.5 rounded-md font-semibold border-2 border-slate-700 text-slate-700 bg-transparent hover:bg-slate-700 hover:text-white transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-blue-400/70 focus:ring-offset-2"
>
  Create Deal
</motion.button>
        </div>
      </div>
    </ClientDashboardLayout>
  );
}
