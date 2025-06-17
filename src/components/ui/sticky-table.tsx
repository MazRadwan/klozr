"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface StickyTableProps extends React.ComponentProps<"div"> {
  height?: string | number
  stickyHeader?: boolean
  stickyFirstColumn?: boolean
  stickyLastColumn?: boolean
}

interface StickyTableContextType {
  stickyHeader: boolean
  stickyFirstColumn: boolean
  stickyLastColumn: boolean
}

const StickyTableContext = React.createContext<StickyTableContextType>({
  stickyHeader: false,
  stickyFirstColumn: false,
  stickyLastColumn: false,
})

export function StickyTable({ 
  className, 
  height = "600px", 
  stickyHeader = true,
  stickyFirstColumn = true,
  stickyLastColumn = true,
  children,
  ...props 
}: StickyTableProps) {
  const contextValue = React.useMemo(() => ({
    stickyHeader,
    stickyFirstColumn,
    stickyLastColumn,
  }), [stickyHeader, stickyFirstColumn, stickyLastColumn])

  return (
    <StickyTableContext.Provider value={contextValue}>
      <div
        className={cn(
          "relative w-full border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden bg-white dark:bg-gray-950",
          className
        )}
        style={{ height }}
        {...props}
      >
        <div className="h-full overflow-auto">
          {children}
        </div>
      </div>
    </StickyTableContext.Provider>
  )
}

function StickyTableContent({ className, ...props }: React.ComponentProps<"table">) {
  return (
    <table
      className={cn("w-full caption-bottom text-sm relative", className)}
      {...props}
    />
  )
}

function StickyTableHeader({ className, ...props }: React.ComponentProps<"thead">) {
  const { stickyHeader } = React.useContext(StickyTableContext)
  
  return (
    <thead
      className={cn(
        "[&_tr]:border-b",
        stickyHeader && "sticky top-0 z-20 bg-gray-50 dark:bg-gray-900/90 backdrop-blur-sm",
        className
      )}
      {...props}
    />
  )
}

function StickyTableBody({ className, ...props }: React.ComponentProps<"tbody">) {
  return (
    <tbody
      className={cn("[&_tr:last-child]:border-0", className)}
      {...props}
    />
  )
}

function StickyTableRow({ className, ...props }: React.ComponentProps<"tr">) {
  return (
    <tr
      className={cn(
        "hover:bg-gray-50 dark:hover:bg-gray-900/50 data-[state=selected]:bg-blue-50 dark:data-[state=selected]:bg-blue-950/20 border-b transition-colors",
        className
      )}
      {...props}
    />
  )
}

interface StickyTableHeadProps extends React.ComponentProps<"th"> {
  sticky?: "left" | "right" | "none"
  stickyOffset?: string | number
}

function StickyTableHead({ 
  className, 
  sticky = "none",
  stickyOffset = 0,
  ...props 
}: StickyTableHeadProps) {
  const { stickyHeader, stickyFirstColumn, stickyLastColumn } = React.useContext(StickyTableContext)
  
  const getStickyStyles = () => {
    const baseStyles: React.CSSProperties = {}
    
    if (sticky === "left" && stickyFirstColumn) {
      baseStyles.position = "sticky"
      baseStyles.left = stickyOffset
      baseStyles.zIndex = stickyHeader ? 30 : 10
    } else if (sticky === "right" && stickyLastColumn) {
      baseStyles.position = "sticky"
      baseStyles.right = stickyOffset
      baseStyles.zIndex = stickyHeader ? 30 : 10
    }
    
    return baseStyles
  }

  const getStickyClasses = () => {
    if (sticky === "left" && stickyFirstColumn) {
      return "bg-white dark:bg-gray-950 shadow-[8px_0_8px_-8px_rgba(0,0,0,0.1)] dark:shadow-[8px_0_8px_-8px_rgba(0,0,0,0.3)]"
    } else if (sticky === "right" && stickyLastColumn) {
      return "bg-white dark:bg-gray-950 shadow-[-8px_0_8px_-8px_rgba(0,0,0,0.1)] dark:shadow-[-8px_0_8px_-8px_rgba(0,0,0,0.3)]"
    }
    return "bg-gray-50 dark:bg-gray-900/90"
  }

  return (
    <th
      className={cn(
        "text-foreground h-12 px-4 text-left align-middle font-semibold whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
        getStickyClasses(),
        className
      )}
      style={getStickyStyles()}
      {...props}
    />
  )
}

interface StickyTableCellProps extends React.ComponentProps<"td"> {
  sticky?: "left" | "right" | "none"
  stickyOffset?: string | number
}

function StickyTableCell({ 
  className, 
  sticky = "none",
  stickyOffset = 0,
  ...props 
}: StickyTableCellProps) {
  const { stickyFirstColumn, stickyLastColumn } = React.useContext(StickyTableContext)
  
  const getStickyStyles = () => {
    const baseStyles: React.CSSProperties = {}
    
    if (sticky === "left" && stickyFirstColumn) {
      baseStyles.position = "sticky"
      baseStyles.left = stickyOffset
      baseStyles.zIndex = 5
    } else if (sticky === "right" && stickyLastColumn) {
      baseStyles.position = "sticky"
      baseStyles.right = stickyOffset
      baseStyles.zIndex = 5
    }
    
    return baseStyles
  }

  const getStickyClasses = () => {
    if (sticky === "left" && stickyFirstColumn) {
      return "bg-white dark:bg-gray-950 shadow-[8px_0_8px_-8px_rgba(0,0,0,0.1)] dark:shadow-[8px_0_8px_-8px_rgba(0,0,0,0.3)] group-hover:bg-gray-50 dark:group-hover:bg-gray-900/50 group-data-[state=selected]:bg-blue-50 dark:group-data-[state=selected]:bg-blue-950/20"
    } else if (sticky === "right" && stickyLastColumn) {
      return "bg-white dark:bg-gray-950 shadow-[-8px_0_8px_-8px_rgba(0,0,0,0.1)] dark:shadow-[-8px_0_8px_-8px_rgba(0,0,0,0.3)] group-hover:bg-gray-50 dark:group-hover:bg-gray-900/50 group-data-[state=selected]:bg-blue-50 dark:group-data-[state=selected]:bg-blue-950/20"
    }
    return ""
  }

  return (
    <td
      className={cn(
        "p-4 align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
        getStickyClasses(),
        className
      )}
      style={getStickyStyles()}
      {...props}
    />
  )
}

function StickyTableCaption({
  className,
  ...props
}: React.ComponentProps<"caption">) {
  return (
    <caption
      className={cn("text-muted-foreground mt-4 text-sm", className)}
      {...props}
    />
  )
}

// Hook for managing column configurations
export function useColumnManager(initialColumns: any[]) {
  const [columns, setColumns] = React.useState(initialColumns)
  
  const toggleColumnVisibility = React.useCallback((columnKey: string) => {
    setColumns(prev => 
      prev.map(col => 
        col.key === columnKey 
          ? { ...col, visible: !col.visible }
          : col
      )
    )
  }, [])

  const updateColumnWidth = React.useCallback((columnKey: string, width: string) => {
    setColumns(prev =>
      prev.map(col =>
        col.key === columnKey
          ? { ...col, width }
          : col
      )
    )
  }, [])

  const reorderColumns = React.useCallback((startIndex: number, endIndex: number) => {
    setColumns(prev => {
      const result = Array.from(prev)
      const [removed] = result.splice(startIndex, 1)
      result.splice(endIndex, 0, removed)
      return result
    })
  }, [])

  const visibleColumns = React.useMemo(() => 
    columns.filter(col => col.visible), 
    [columns]
  )

  return {
    columns,
    visibleColumns,
    toggleColumnVisibility,
    updateColumnWidth,
    reorderColumns,
    setColumns
  }
}

export {
  StickyTableContent as StickyTableTable,
  StickyTableHeader,
  StickyTableBody,
  StickyTableRow,
  StickyTableHead,
  StickyTableCell,
  StickyTableCaption,
}