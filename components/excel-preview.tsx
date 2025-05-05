"use client"

import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table"
import { ScrollArea } from "@/components/ui/scroll-area"

interface ExcelPreviewProps {
  data: any[][]
  summaryRows?: number[]
  compact?: boolean
  ultraCompact?: boolean
  maxHeight?: number
}

export function ExcelPreview({
  data,
  summaryRows = [],
  compact = false,
  ultraCompact = false,
  maxHeight = 500,
}: ExcelPreviewProps) {
  if (!data || data.length === 0) {
    return <div className="text-center py-4">No data to display</div>
  }

  // Determine the maximum number of columns
  const maxColumns = Math.max(...data.map((row) => row.length))

  const rowClass = ultraCompact ? "h-5" : compact ? "h-6" : ""
  const cellClass = ultraCompact ? "px-1 py-0.5 text-xs" : compact ? "px-2 py-1 text-xs" : ""

  return (
    <div className="border rounded-md">
      <ScrollArea className={`h-[${maxHeight}px]`}>
        <div className="overflow-x-auto">
          <Table className={compact || ultraCompact ? "text-xs" : ""}>
            <TableHeader>
              <TableRow className={rowClass}>
                <TableCell className={`font-medium bg-muted sticky left-0 z-10 ${cellClass}`}>#</TableCell>
                {Array.from({ length: maxColumns }).map((_, index) => (
                  <TableCell key={index} className={`font-medium bg-muted ${cellClass}`}>
                    {String.fromCharCode(65 + index)}
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
                  <TableCell className={`font-medium bg-muted sticky left-0 z-10 ${cellClass}`}>
                    {rowIndex + 1}
                  </TableCell>
                  {Array.from({ length: maxColumns }).map((_, colIndex) => (
                    <TableCell key={colIndex} className={cellClass}>
                      {row[colIndex] !== null && row[colIndex] !== undefined ? String(row[colIndex]) : ""}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </ScrollArea>
    </div>
  )
}
