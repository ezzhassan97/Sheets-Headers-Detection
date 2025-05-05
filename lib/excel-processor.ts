import * as XLSX from "xlsx"
import type { ExcelData } from "./types"

export async function processExcelFile(file: File): Promise<ExcelData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: "array" })

        const sheets = workbook.SheetNames.map((sheetName) => {
          const worksheet = workbook.Sheets[sheetName]
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: null })
          return {
            name: sheetName,
            data: jsonData,
          }
        })

        resolve({
          fileName: file.name,
          sheets,
        })
      } catch (error) {
        reject(error)
      }
    }

    reader.onerror = (error) => {
      reject(error)
    }

    reader.readAsArrayBuffer(file)
  })
}

export async function generateExcelFile(fileName: string, processedData: Record<string, any[][]>): Promise<Blob> {
  const workbook = XLSX.utils.book_new()

  Object.entries(processedData).forEach(([sheetName, tables], sheetIndex) => {
    tables.forEach((table, tableIndex) => {
      const worksheet = XLSX.utils.aoa_to_sheet(table)
      XLSX.utils.book_append_sheet(workbook, worksheet, `${sheetName}.${tableIndex + 1}`)
    })
  })

  const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" })
  return new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })
}
