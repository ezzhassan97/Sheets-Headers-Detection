"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ExcelPreview } from "./excel-preview"
import type { ProcessedTable } from "@/lib/types"
import { Check, X, AlertTriangle } from "lucide-react"

interface TableSplitterProps {
  sheetName: string
  tables: ProcessedTable[]
  onAccept: (tables: ProcessedTable[]) => void
}

export function TableSplitter({ sheetName, tables, onAccept }: TableSplitterProps) {
  const [selectedTables, setSelectedTables] = useState<ProcessedTable[]>(tables)
  const [accepted, setAccepted] = useState(false)

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
      }

      return newTables
    })
  }

  const handleAccept = () => {
    onAccept(selectedTables)
    setAccepted(true)
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
                  Table {index + 1} (Rows {table.startRow + 1}-{table.endRow + 1})
                  <Badge variant="secondary" className="ml-2">
                    {table.data.length} rows
                  </Badge>
                </CardTitle>
                {table.summaryRows.length > 0 && (
                  <CardDescription className="flex items-center mt-1">
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
                  </CardDescription>
                )}
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
