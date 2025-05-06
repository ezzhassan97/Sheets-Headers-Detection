"use client"

import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table"

interface ExcelPreviewProps {
  data: any[][]
  summaryRows?: number[]
  emptyColumns?: number[]
  compact?: boolean
  ultraCompact?: boolean
  maxHeight?: number
  startColumn?: number
}

export function ExcelPreview({
  data,
  summaryRows = [],
  emptyColumns = [],
  compact = false,
  ultraCompact = false,
  maxHeight = 500,
  startColumn = 0,
}: ExcelPreviewProps) {
  if (!data || data.length === 0) {
    return <div className="text-center py-4">No data to display</div>
  }

  // Determine the maximum number of columns
  const maxColumns = Math.max(...data.map((row) => row.length))

  const rowClass = ultraCompact ? "h-5" : compact ? "h-6" : ""
  const cellClass = ultraCompact ? "px-1 py-0.5 text-xs" : compact ? "px-2 py-1 text-xs" : ""

  // Helper function to convert column index to Excel column letter
  const getColumnLetter = (index: number): string => {
    let columnName = ""
    while (index >= 0) {
      columnName = String.fromCharCode((index % 26) + 65) + columnName
      index = Math.floor(index / 26) - 1
    }
    return columnName
  }

  return (
    <div className="border rounded-md">
      {/* Use a standard div with overflow-x: auto for horizontal scrolling */}
      <div
        style={{
          maxHeight: `${maxHeight}px`,
          overflowY: "auto",
          overflowX: "auto",
        }}
      >
        <Table className={compact || ultraCompact ? "text-xs" : ""}>
          <TableHeader>
            <TableRow className={rowClass}>
              <TableCell className={`font-medium bg-muted sticky left-0 z-10 ${cellClass}`}>#</TableCell>
              {Array.from({ length: maxColumns }).map((_, index) => (
                <TableCell
                  key={index}
                  className={`font-medium ${
                    emptyColumns.includes(index)
                      ? "bg-yellow-200 border-yellow-400 border-b-2 border-dashed"
                      : "bg-muted"
                  } ${cellClass}`}
                  style={{
                    backgroundColor: emptyColumns.includes(index) ? "#FFEB3B" : undefined,
                    borderLeft: emptyColumns.includes(index) ? "2px dashed #FFC107" : undefined,
                    borderRight: emptyColumns.includes(index) ? "2px dashed #FFC107" : undefined,
                  }}
                >
                  {getColumnLetter(startColumn + index)}
                  {emptyColumns.includes(index) && <span className="ml-1 text-yellow-600 font-bold">•</span>}
                </TableCell>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row, rowIndex) => (
              <TableRow
                key={rowIndex}
                className={`
                  ${rowClass}
                  ${summaryRows.includes(rowIndex) ? "bg-red-100" : ""}
                `}
              >
                <TableCell className={`font-medium bg-muted sticky left-0 z-10 ${cellClass}`}>{rowIndex + 1}</TableCell>
                {Array.from({ length: maxColumns }).map((_, colIndex) => (
                  <TableCell
                    key={colIndex}
                    className={`${cellClass} ${
                      emptyColumns.includes(colIndex) ? "bg-yellow-100 border-yellow-200 border-dashed border-x" : ""
                    }`}
                  >
                    {row[colIndex] !== null && row[colIndex] !== undefined ? String(row[colIndex]) : ""}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {(summaryRows.length > 0 || emptyColumns.length > 0) && (
        <div className="p-2 border-t text-xs flex gap-4 bg-gray-50">
          {summaryRows.length > 0 && (
            <div className="flex items-center">
              <div className="w-3 h-3 bg-red-100 border border-red-200 mr-1"></div>
              <span>Summary Rows</span>
            </div>
          )}
          {emptyColumns.length > 0 && (
            <div className="flex items-center">
              <div className="w-3 h-3 bg-yellow-100 border border-yellow-200 mr-1"></div>
              <span>Empty Columns</span>
            </div>
          )}
        </div>
      )}

      {/* Debug information */}
      <div className="p-2 text-xs text-gray-500 border-t">
        <div>
          Table has {data.length} rows and {maxColumns} columns
        </div>
        <div>
          Empty columns:{" "}
          {emptyColumns && emptyColumns.length > 0
            ? emptyColumns.map((col) => getColumnLetter(col)).join(", ")
            : "None"}
        </div>
      </div>
    </div>
  )
}
