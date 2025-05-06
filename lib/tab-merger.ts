import * as XLSX from "xlsx"
import { similarityRatio } from "./fuzzy-match"
import type { SheetData } from "./types"

// Normalize column name (similar to Python function)
export function normalizeColumnName(name: string | number): string {
  return String(name)
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "")
}

// Build column mapping with fuzzy matching
export function buildColumnMapping(sheetColumnsList: string[][], threshold = 85): Record<string, string> {
  const allColumns = new Set<string>()
  const mapping: Record<string, string> = {}
  const canonicalMap: Record<string, string> = {}

  // Flatten and normalize all column names
  for (const cols of sheetColumnsList) {
    for (const col of cols) {
      const norm = normalizeColumnName(col)
      allColumns.add(norm)
    }
  }

  const allColumnsList = Array.from(allColumns)

  // Match each column to a "canonical" column
  for (const col of allColumnsList) {
    let matched = null
    for (const canon in canonicalMap) {
      const score = similarityRatio(col, canon)
      if (score >= threshold) {
        matched = canonicalMap[canon]
        break
      }
    }
    if (!matched) {
      canonicalMap[col] = col
    }
    mapping[col] = matched || canonicalMap[col]
  }

  return mapping
}

// Check if a row is empty (all cells are empty)
function isRowEmpty(row: any[]): boolean {
  return row.every((cell) => cell === null || cell === undefined || String(cell).trim() === "")
}

// Merge sheets with column alignment
export function mergeSheets(
  sheets: SheetData[],
  projectAssignments: Record<string, string>,
  selectedProjects: string[],
): any[][] {
  if (!sheets || sheets.length === 0) return []

  // Step 1: Gather all column sets
  const columnSets = sheets.map((sheet) => {
    // Get the first row as headers, or use empty array if no data
    return sheet.data && sheet.data.length > 0 ? sheet.data[0].map(String) : []
  })

  // Step 2: Create a unified column mapping
  const columnMapping = buildColumnMapping(columnSets)

  // Step 3: Process each sheet and align columns
  const allData: any[][] = []
  const allColumns = new Set<string>()

  // First pass: collect all unique normalized column names
  for (const sheet of sheets) {
    if (!sheet.data || sheet.data.length === 0) continue

    const headers = sheet.data[0].map((col) => columnMapping[normalizeColumnName(col)] || normalizeColumnName(col))
    headers.forEach((col) => allColumns.add(col))
  }

  // Add special columns
  allColumns.add("tab_name")
  if (selectedProjects.length > 1) {
    allColumns.add("project")
  }

  // Create final headers array
  const finalHeaders = Array.from(allColumns)

  // Add headers as first row
  allData.push(finalHeaders)

  // Second pass: align and add data
  for (const sheet of sheets) {
    if (!sheet.data || sheet.data.length === 0 || sheet.data.length === 1) continue

    const originalHeaders = sheet.data[0].map(String)
    const normalizedHeaders = originalHeaders.map(normalizeColumnName)

    // Map original headers to their positions
    const headerPositions: Record<string, number> = {}
    normalizedHeaders.forEach((header, index) => {
      const mappedHeader = columnMapping[header] || header
      headerPositions[mappedHeader] = index
    })

    // Process each data row (skip header row)
    for (let i = 1; i < sheet.data.length; i++) {
      const row = sheet.data[i]

      // Skip empty rows
      if (!row || isRowEmpty(row)) continue

      const newRow: any[] = Array(finalHeaders.length).fill("")

      // Fill in data for each column
      finalHeaders.forEach((header, colIndex) => {
        if (header === "tab_name") {
          newRow[colIndex] = sheet.name
        } else if (header === "project" && selectedProjects.length > 1) {
          newRow[colIndex] = projectAssignments[sheet.name] || ""
        } else if (headerPositions[header] !== undefined) {
          const originalIndex = headerPositions[header]
          newRow[colIndex] = row[originalIndex] !== undefined ? row[originalIndex] : ""
        }
      })

      // Only add the row if it has at least one non-empty value besides tab_name and project
      const hasData = newRow.some((cell, index) => {
        const header = finalHeaders[index]
        return cell !== "" && cell !== null && header !== "tab_name" && header !== "project"
      })

      if (hasData) {
        allData.push(newRow)
      }
    }
  }

  return allData
}

// Generate Excel file from merged data
export async function generateMergedExcelFile(fileName: string, mergedData: any[][]): Promise<Blob> {
  const workbook = XLSX.utils.book_new()
  const worksheet = XLSX.utils.aoa_to_sheet(mergedData)

  XLSX.utils.book_append_sheet(workbook, worksheet, "Merged")

  const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" })
  return new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })
}
