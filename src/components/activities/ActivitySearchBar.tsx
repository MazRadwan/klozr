"use client";

import React, { useState, useCallback, useEffect } from "react";
import { Search, X, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface ActivitySearchBarProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  isLoading?: boolean;
  placeholder?: string;
  className?: string;
}

export function ActivitySearchBar({
  searchTerm,
  onSearchChange,
  isLoading = false,
  placeholder = "Search activities by title or content...",
  className = ""
}: ActivitySearchBarProps) {
  const [inputValue, setInputValue] = useState(searchTerm);
  
  // Initialize debounced search function
  const debouncedSearch = useCallback(
    debounce((term: string) => {
      onSearchChange(term);
    }, 300),
    [onSearchChange]
  );

  // Sync local state with prop changes (e.g., when cleared externally)
  useEffect(() => {
    setInputValue(searchTerm);
  }, [searchTerm]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    debouncedSearch(value);
  };

  const handleClear = () => {
    setInputValue("");
    onSearchChange("");
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
        <Input
          type="text"
          placeholder={placeholder}
          value={inputValue}
          onChange={handleInputChange}
          className="pl-10 pr-10 bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:border-blue-500 dark:focus:border-blue-400"
        />
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
          {isLoading && (
            <Loader2 className="h-4 w-4 animate-spin text-gray-400 dark:text-gray-500" />
          )}
          {inputValue && !isLoading && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="h-6 w-6 p-0 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <X className="h-3 w-3 text-gray-400 dark:text-gray-500" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// Debounce utility function
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}