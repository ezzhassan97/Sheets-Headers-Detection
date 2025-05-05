export interface SheetData {
  name: string
  data: any[][]
}

export interface ExcelData {
  fileName: string
  sheets: SheetData[]
}

export interface ProcessedTable {
  startRow: number
  endRow: number
  data: any[][]
  headers: any[]
  summaryRows: number[] // Indices of summary rows within the table
}
