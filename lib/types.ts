export interface SheetData {
  name: string
  data: any[][]
}

export interface ExcelData {
  fileName: string
  sheets: SheetData[]
}

export interface TableRegion {
  startRow: number
  endRow: number
  startCol: number
  endCol: number
}

export interface ProcessedTable {
  startRow: number
  endRow: number
  startCol?: number
  endCol?: number
  data: any[][]
  headers: any[]
  summaryRows: number[] // Indices of summary rows within the table
  emptyColumns: number[] // Indices of completely empty columns
}
