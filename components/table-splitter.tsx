"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ExcelPreview } from "./excel-preview"
import type { ProcessedTable } from "@/lib/types"
import { Check, X, AlertTriangle, Search } from "lucide-react"

interface TableSplitterProps {
  sheetName: string
  tables: ProcessedTable[]
  onAccept: (tables: ProcessedTable[]) => void
}

export function TableSplitter({ sheetName, tables, onAccept }: TableSplitterProps) {
  const [selectedTables, setSelectedTables] = useState<ProcessedTable[]>(tables)
  const [accepted, setAccepted] = useState(false)
  // Track which tables have had summary rows removed
  const [summaryRowsRemoved, setSummaryRowsRemoved] = useState<Record<number, boolean>>({})

  const handleToggleTable = (index: number) => {
    setSelectedTables((prev) => {
      const newTables = [...prev]
      newTables.splice(index, 1)
      return newTables
    })
  }

  const handleRemoveSummaryRows = (tableIndex: number) => {
    setSelectedTables((prev) => {
      const newTables = [...prev]
      const table = { ...newTables[tableIndex] }

      // Create a new data array without the summary rows
      const newData = table.data.filter((_, rowIndex) => !table.summaryRows.includes(rowIndex))

      // Update the table
      newTables[tableIndex] = {
        ...table,
        data: newData,
        summaryRows: [], // Clear summary rows
        emptyColumns: [], // Reset empty columns after removing summary rows
      }

      return newTables
    })

    // Mark this table as having had summary rows removed
    setSummaryRowsRemoved((prev) => ({
      ...prev,
      [tableIndex]: true,
    }))
  }

  const handleDetectEmptyColumns = (tableIndex: number) => {
    setSelectedTables((prev) => {
      const newTables = [...prev]
      const table = { ...newTables[tableIndex] }

      // Detect empty columns
      const emptyColumns = detectEmptyColumns(table.data)
      console.log("Detected empty columns:", emptyColumns)

      // Update the table with the detected empty columns
      newTables[tableIndex] = {
        ...table,
        emptyColumns,
      }

      return newTables
    })
  }

  const handleRemoveEmptyColumns = (tableIndex: number) => {
    setSelectedTables((prev) => {
      const newTables = [...prev]
      const table = { ...newTables[tableIndex] }

      // Create a new data array without the empty columns
      const newData = table.data.map((row) => {
        return row.filter((_, colIndex) => !table.emptyColumns.includes(colIndex))
      })

      // Update the table
      newTables[tableIndex] = {
        ...table,
        data: newData,
        headers: newData[0],
        emptyColumns: [], // Clear empty columns
      }

      return newTables
    })
  }

  const handleAccept = () => {
    onAccept(selectedTables)
    setAccepted(true)
  }

  // Helper function to convert column index to Excel column letter
  const getColumnLetter = (index: number): string => {
    let columnName = ""
    while (index >= 0) {
      columnName = String.fromCharCode((index % 26) + 65) + columnName
      index = Math.floor(index / 26) - 1
    }
    return columnName
  }

  // Helper function to detect completely empty columns
  function detectEmptyColumns(tableData: any[][]): number[] {
    if (!tableData || tableData.length === 0) return []

    // Get the maximum number of columns in the table
    const maxCols = Math.max(...tableData.map((row) => (row ? row.length : 0)))
    console.log("Max columns in table:", maxCols)

    // Initialize an array to track empty columns
    const emptyColumns: number[] = []

    // Check each column
    for (let col = 0; col < maxCols; col++) {
      let isEmpty = true
      let hasData = false

      // Check each row for this column
      for (let row = 0; row < tableData.length; row++) {
        // Skip undefined rows
        if (!tableData[row]) continue

        // If the column index is beyond the row's length, it's considered empty for this row
        if (col >= tableData[row].length) continue

        hasData = true
        const cellValue = tableData[row][col]

        // If the cell has any content, the column is not empty
        if (cellValue !== null && cellValue !== undefined && String(cellValue).trim() !== "") {
          isEmpty = false
          break
        }
      }

      // If we went through all rows and didn't find any content, the column is empty
      // Only mark as empty if we actually found data rows to check
      if (isEmpty && hasData) {
        emptyColumns.push(col)
        console.log(`Column ${col} is empty`)
      }
    }

    // Log the first few rows of the table for debugging
    console.log("First 3 rows of table data:")
    for (let i = 0; i < Math.min(3, tableData.length); i++) {
      console.log(`Row ${i}:`, tableData[i])
    }

    console.log("Detected empty columns:", emptyColumns)
    return emptyColumns
  }

  if (tables.length === 0) {
    return <div className="text-center py-8">No tables detected in this sheet</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">
          {tables.length} table{tables.length !== 1 ? "s" : ""} detected in {sheetName}
        </h3>

        {!accepted && (
          <Button onClick={handleAccept}>
            <Check className="mr-2 h-4 w-4" />
            Accept Tables
          </Button>
        )}

        {accepted && (
          <div className="text-sm text-green-600 flex items-center">
            <Check className="mr-1 h-4 w-4" />
            Tables accepted
          </div>
        )}
      </div>

      <div className="space-y-6">
        {selectedTables.map((table, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-md flex items-center gap-2">
                  Table {index + 1} (Rows {table.startRow + 1}-{table.endRow + 1}, Columns {getColumnLetter(0)}-
                  {getColumnLetter(table.data[0].length - 1)})
                  <Badge variant="secondary" className="ml-2">
                    {table.data.length} rows
                  </Badge>
                </CardTitle>
                <CardDescription className="flex flex-col gap-1 mt-1">
                  {/* Step 1: Handle Summary Rows */}
                  {table.summaryRows.length > 0 && (
                    <div className="flex items-center">
                      <AlertTriangle className="h-4 w-4 text-amber-500 mr-1" />
                      <span>Contains {table.summaryRows.length} potential summary row(s)</span>
                      {!accepted && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="ml-2 h-6 text-xs"
                          onClick={() => handleRemoveSummaryRows(index)}
                        >
                          Remove Summary Rows
                        </Button>
                      )}
                    </div>
                  )}

                  {/* Step 2: Detect Empty Columns (only after summary rows are removed or if there were no summary rows) */}
                  {!accepted && (table.summaryRows.length === 0 || summaryRowsRemoved[index]) && (
                    <div className="flex items-center mt-2">
                      <Search className="h-4 w-4 text-blue-500 mr-1" />
                      <span>Detect empty columns in this table</span>
                      <Button
                        variant="outline"
                        size="sm"
                        className="ml-2 h-6 text-xs"
                        onClick={() => handleDetectEmptyColumns(index)}
                      >
                        Detect Empty Columns
                      </Button>
                    </div>
                  )}

                  {/* Step 3: Remove Empty Columns (only if empty columns were detected) */}
                  {table.emptyColumns && table.emptyColumns.length > 0 && (
                    <div className="flex items-center mt-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-500 mr-1" />
                      <span className="font-medium">
                        Contains {table.emptyColumns.length} empty column(s):{" "}
                        <span className="font-bold">
                          {table.emptyColumns.map((col) => getColumnLetter(col)).join(", ")}
                        </span>
                      </span>
                      {!accepted && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="ml-2 h-6 text-xs bg-yellow-100 hover:bg-yellow-200 text-yellow-800 border-yellow-300"
                          onClick={() => handleRemoveEmptyColumns(index)}
                        >
                          Remove Empty Columns
                        </Button>
                      )}
                    </div>
                  )}
                </CardDescription>
              </div>

              {!accepted && (
                <Button variant="ghost" size="icon" onClick={() => handleToggleTable(index)}>
                  <X className="h-4 w-4" />
                </Button>
              )}
            </CardHeader>
            <CardContent>
              <ExcelPreview
                data={table.data}
                summaryRows={table.summaryRows}
                emptyColumns={table.emptyColumns || []}
                compact={true}
                ultraCompact={true}
                maxHeight={300}
              />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
