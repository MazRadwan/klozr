import { useState, useCallback, useMemo, useEffect } from 'react'

export interface TableColumn {
  key: string
  label: string
  sortable: boolean
  visible: boolean
  width?: string
  minWidth?: string
  maxWidth?: string
  resizable?: boolean
  sticky?: 'left' | 'right' | 'none'
}

interface ColumnManagerOptions {
  storageKey?: string
  defaultColumns: TableColumn[]
}

export function useColumnManager({ storageKey, defaultColumns }: ColumnManagerOptions) {
  // Initialize columns from localStorage or defaults
  const [columns, setColumns] = useState<TableColumn[]>(() => {
    if (typeof window !== 'undefined' && storageKey) {
      try {
        const stored = localStorage.getItem(storageKey)
        if (stored) {
          const parsedColumns = JSON.parse(stored)
          // Merge with default columns to ensure all columns exist and have proper structure
          return defaultColumns.map(defaultCol => {
            const storedCol = parsedColumns.find((col: TableColumn) => col.key === defaultCol.key)
            return storedCol ? { ...defaultCol, ...storedCol } : defaultCol
          })
        }
      } catch (error) {
        console.warn('Failed to load column configuration from localStorage:', error)
      }
    }
    return defaultColumns
  })

  // Save to localStorage whenever columns change
  useEffect(() => {
    if (typeof window !== 'undefined' && storageKey) {
      try {
        localStorage.setItem(storageKey, JSON.stringify(columns))
      } catch (error) {
        console.warn('Failed to save column configuration to localStorage:', error)
      }
    }
  }, [columns, storageKey])

  // Toggle column visibility
  const toggleColumnVisibility = useCallback((columnKey: string) => {
    setColumns(prev => 
      prev.map(col => 
        col.key === columnKey 
          ? { ...col, visible: !col.visible }
          : col
      )
    )
  }, [])

  // Update column width
  const updateColumnWidth = useCallback((columnKey: string, width: string) => {
    setColumns(prev =>
      prev.map(col =>
        col.key === columnKey
          ? { ...col, width }
          : col
      )
    )
  }, [])

  // Reorder columns
  const reorderColumns = useCallback((startIndex: number, endIndex: number) => {
    setColumns(prev => {
      const result = Array.from(prev)
      const [removed] = result.splice(startIndex, 1)
      result.splice(endIndex, 0, removed)
      return result
    })
  }, [])

  // Reset to defaults
  const resetColumns = useCallback(() => {
    setColumns(defaultColumns)
    if (typeof window !== 'undefined' && storageKey) {
      try {
        localStorage.removeItem(storageKey)
      } catch (error) {
        console.warn('Failed to clear column configuration from localStorage:', error)
      }
    }
  }, [defaultColumns, storageKey])

  // Update multiple columns at once
  const updateColumns = useCallback((updater: (columns: TableColumn[]) => TableColumn[]) => {
    setColumns(updater)
  }, [])

  // Get columns by visibility
  const visibleColumns = useMemo(() => 
    columns.filter(col => col.visible), 
    [columns]
  )

  const hiddenColumns = useMemo(() => 
    columns.filter(col => !col.visible), 
    [columns]
  )

  // Get sticky columns
  const leftStickyColumns = useMemo(() =>
    visibleColumns.filter(col => col.sticky === 'left'),
    [visibleColumns]
  )

  const rightStickyColumns = useMemo(() =>
    visibleColumns.filter(col => col.sticky === 'right'),
    [visibleColumns]
  )

  const regularColumns = useMemo(() =>
    visibleColumns.filter(col => col.sticky === 'none' || !col.sticky),
    [visibleColumns]
  )

  // Calculate sticky offsets
  const calculateStickyOffset = useCallback((columnKey: string, side: 'left' | 'right') => {
    const stickyColumns = side === 'left' ? leftStickyColumns : rightStickyColumns
    const columnIndex = stickyColumns.findIndex(col => col.key === columnKey)
    
    if (columnIndex === -1) return 0
    
    let offset = 0
    const columnsToSum = side === 'left' 
      ? stickyColumns.slice(0, columnIndex)
      : stickyColumns.slice(columnIndex + 1)
    
    columnsToSum.forEach(col => {
      const width = col.width || '120px'
      // Parse width value (assuming px units for simplicity)
      const numericWidth = parseInt(width.replace('px', '')) || 120
      offset += numericWidth
    })
    
    return offset
  }, [leftStickyColumns, rightStickyColumns])

  // Column presets
  const createPreset = useCallback((name: string) => {
    const preset = {
      name,
      columns: columns.map(col => ({
        key: col.key,
        visible: col.visible,
        width: col.width
      })),
      timestamp: Date.now()
    }
    
    if (typeof window !== 'undefined' && storageKey) {
      try {
        const presets = JSON.parse(localStorage.getItem(`${storageKey}_presets`) || '[]')
        presets.push(preset)
        localStorage.setItem(`${storageKey}_presets`, JSON.stringify(presets))
      } catch (error) {
        console.warn('Failed to save column preset:', error)
      }
    }
    
    return preset
  }, [columns, storageKey])

  const loadPreset = useCallback((presetName: string) => {
    if (typeof window !== 'undefined' && storageKey) {
      try {
        const presets = JSON.parse(localStorage.getItem(`${storageKey}_presets`) || '[]')
        const preset = presets.find((p: any) => p.name === presetName)
        
        if (preset) {
          setColumns(prev => 
            prev.map(col => {
              const presetCol = preset.columns.find((p: any) => p.key === col.key)
              return presetCol 
                ? { ...col, visible: presetCol.visible, width: presetCol.width }
                : col
            })
          )
          return true
        }
      } catch (error) {
        console.warn('Failed to load column preset:', error)
      }
    }
    return false
  }, [storageKey])

  const getPresets = useCallback(() => {
    if (typeof window !== 'undefined' && storageKey) {
      try {
        return JSON.parse(localStorage.getItem(`${storageKey}_presets`) || '[]')
      } catch (error) {
        console.warn('Failed to load column presets:', error)
      }
    }
    return []
  }, [storageKey])

  return {
    // Column data
    columns,
    visibleColumns,
    hiddenColumns,
    leftStickyColumns,
    rightStickyColumns,
    regularColumns,
    
    // Column operations
    toggleColumnVisibility,
    updateColumnWidth,
    reorderColumns,
    resetColumns,
    updateColumns,
    
    // Utility functions
    calculateStickyOffset,
    
    // Presets
    createPreset,
    loadPreset,
    getPresets,
  }
}