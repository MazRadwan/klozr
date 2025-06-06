"use client";

import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Users, Building2 } from "lucide-react";

export function EntityToggle() {
  const pathname = usePathname();
  const router = useRouter();
  const isCompanies = pathname.includes('/companies');

  return (
    <div className="flex rounded-full border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 p-1">
      <button
        onClick={() => router.push('/dashboard/contacts')}
        className={`rounded-full px-3 py-1 text-xs font-medium transition-all duration-200 flex items-center ${
          !isCompanies 
            ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm' 
            : 'bg-transparent text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100'
        }`}
      >
        <Users className="h-3 w-3 mr-1" />
        People
      </button>
      <button
        onClick={() => router.push('/dashboard/companies')}
        className={`rounded-full px-3 py-1 text-xs font-medium transition-all duration-200 flex items-center ${
          isCompanies 
            ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm' 
            : 'bg-transparent text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100'
        }`}
      >
        <Building2 className="h-3 w-3 mr-1" />
        Companies
      </button>
    </div>
  );
} 