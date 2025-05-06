"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { FileUploader } from "@/components/file-uploader"
import { ExcelPreview } from "@/components/excel-preview"
import { TableSplitter } from "@/components/table-splitter"
import { processExcelFile, generateExcelFile } from "@/lib/excel-processor"
import type { ExcelData, ProcessedTable } from "@/lib/types"
import { Download } from "lucide-react"

export default function HeadersDetection() {
  const [excelData, setExcelData] = useState<ExcelData | null>(null)
  const [activeSheet, setActiveSheet] = useState<string>("")
  const [detectedTables, setDetectedTables] = useState<Record<string, ProcessedTable[]>>({})
  const [processedData, setProcessedData] = useState<Record<string, ProcessedTable[]>>({})
  const [step, setStep] = useState<"upload" | "preview" | "detect" | "result">("upload")
  const [isProcessing, setIsProcessing] = useState(false)

  const handleFileUpload = async (file: File) => {
    setIsProcessing(true)
    try {
      const data = await processExcelFile(file)
      setExcelData(data)
      if (data.sheets.length > 0) {
        setActiveSheet(data.sheets[0].name)
      }
      setStep("preview")
    } catch (error) {
      console.error("Error processing file:", error)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDetectTables = async () => {
    if (!excelData) return

    setIsProcessing(true)
    try {
      // This would normally be a server action, but we'll simulate it client-side
      const tables: Record<string, ProcessedTable[]> = {}

      excelData.sheets.forEach((sheet) => {
        const detectedTablesInSheet = detectTablesInSheet(sheet.data)
        if (detectedTablesInSheet.length > 0) {
          tables[sheet.name] = detectedTablesInSheet
        }
      })

      setDetectedTables(tables)
      setStep("detect")
    } catch (error) {
      console.error("Error detecting tables:", error)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleAcceptTables = (sheetName: string, tables: ProcessedTable[]) => {
    setProcessedData((prev) => ({
      ...prev,
      [sheetName]: tables,
    }))
  }

  const handleFinalize = () => {
    setStep("result")
  }

  const handleDownload = async () => {
    if (!excelData || !processedData) return

    setIsProcessing(true)
    try {
      // Generate the Excel file
      const blob = await generateExcelFile(excelData.fileName, processedData)

      // Create a download link
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `processed_${excelData.fileName}`
      document.body.appendChild(a)
      a.click()

      // Clean up
      URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error("Error generating Excel file:", error)
      alert("An error occurred while generating the Excel file")
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>Headers Detection</CardTitle>
        <CardDescription>
          Upload an Excel file, preview it, detect tables, and split them into separate sheets
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4 mb-6">
          <div className={`flex items-center gap-2 ${step === "upload" ? "text-primary" : "text-muted-foreground"}`}>
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">1</div>
            <span>Upload</span>
          </div>
          <div className="flex-1 h-px bg-border"></div>
          <div className={`flex items-center gap-2 ${step === "preview" ? "text-primary" : "text-muted-foreground"}`}>
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">2</div>
            <span>Preview</span>
          </div>
          <div className="flex-1 h-px bg-border"></div>
          <div className={`flex items-center gap-2 ${step === "detect" ? "text-primary" : "text-muted-foreground"}`}>
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">3</div>
            <span>Detect</span>
          </div>
          <div className="flex-1 h-px bg-border"></div>
          <div className={`flex items-center gap-2 ${step === "result" ? "text-primary" : "text-muted-foreground"}`}>
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">4</div>
            <span>Result</span>
          </div>
        </div>

        {step === "upload" && <FileUploader onFileUpload={handleFileUpload} isLoading={isProcessing} />}

        {step === "preview" && excelData && (
          <div className="space-y-4">
            <Tabs value={activeSheet} onValueChange={setActiveSheet}>
              <TabsList className="mb-4">
                {excelData.sheets.map((sheet) => (
                  <TabsTrigger key={sheet.name} value={sheet.name}>
                    {sheet.name}
                  </TabsTrigger>
                ))}
              </TabsList>

              {excelData.sheets.map((sheet) => (
                <TabsContent key={sheet.name} value={sheet.name}>
                  <ExcelPreview data={sheet.data} compact={true} ultraCompact={true} />
                </TabsContent>
              ))}
            </Tabs>

            <div className="flex justify-end">
              <Button onClick={handleDetectTables} disabled={isProcessing}>
                {isProcessing ? "Processing..." : "Detect Tables"}
              </Button>
            </div>
          </div>
        )}

        {step === "detect" && detectedTables && Object.keys(detectedTables).length > 0 && (
          <div className="space-y-6">
            <Alert>
              <AlertDescription>
                Tables have been detected in the following sheets. Review and accept or modify them.
              </AlertDescription>
            </Alert>

            <Tabs defaultValue={Object.keys(detectedTables)[0]}>
              <TabsList className="mb-4">
                {Object.keys(detectedTables).map((sheetName) => (
                  <TabsTrigger key={sheetName} value={sheetName}>
                    {sheetName}
                  </TabsTrigger>
                ))}
              </TabsList>

              {Object.entries(detectedTables).map(([sheetName, tables]) => (
                <TabsContent key={sheetName} value={sheetName}>
                  <TableSplitter
                    sheetName={sheetName}
                    tables={tables}
                    onAccept={(tables) => handleAcceptTables(sheetName, tables)}
                  />
                </TabsContent>
              ))}
            </Tabs>

            <div className="flex justify-end">
              <Button onClick={handleFinalize}>Finalize and Preview Result</Button>
            </div>
          </div>
        )}

        {step === "result" && processedData && Object.keys(processedData).length > 0 && (
          <div className="space-y-6">
            <Alert>
              <AlertDescription>
                Your Excel file has been processed. Preview the results below before downloading.
                {Object.values(processedData).some((tables) => tables.length > 1) && (
                  <p className="mt-2 text-sm">
                    <strong>Note:</strong> Multiple tables detected in some sheets will be exported to separate tabs in
                    the Excel file.
                  </p>
                )}
              </AlertDescription>
            </Alert>

            <Tabs defaultValue={Object.keys(processedData)[0]}>
              <TabsList className="mb-4">
                {Object.keys(processedData).map((sheetName) => (
                  <TabsTrigger key={sheetName} value={sheetName}>
                    {sheetName}
                  </TabsTrigger>
                ))}
              </TabsList>

              {Object.entries(processedData).map(([sheetName, tables]) => (
                <TabsContent key={sheetName} value={sheetName}>
                  <div className="space-y-6">
                    {tables.map((table, index) => (
                      <div key={index} className="border rounded-md p-4">
                        <h3 className="text-lg font-medium mb-2">
                          Table {index + 1} ({table.data.length} rows)
                          {tables.length > 1 && (
                            <span className="text-sm text-muted-foreground ml-2">
                              Will be exported as: {`${sheetName}_Table${index + 1}`}
                            </span>
                          )}
                        </h3>
                        <ExcelPreview data={table.data} compact={true} ultraCompact={true} maxHeight={300} />
                      </div>
                    ))}
                  </div>
                </TabsContent>
              ))}
            </Tabs>

            <div className="flex justify-end">
              <Button onClick={handleDownload} disabled={isProcessing}>
                {isProcessing ? (
                  "Generating..."
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Download Processed Excel
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Helper function to detect tables in a sheet with improved logic
function detectTablesInSheet(data: any[][]): ProcessedTable[] {
  const tables: ProcessedTable[] = []
  let currentTable: any[][] = []
  let startRow: number | null = null
  let summaryRowIndices: number[] = []

  // Minimum requirements for a "real" table
  const MIN_ROWS = 3
  const MIN_COLUMNS = 2
  const MIN_DATA_CELLS = 6 // Minimum number of non-empty cells

  for (let idx = 0; idx < data.length; idx++) {
    const row = data[idx]

    // Check if row is empty
    const isRowEmpty = row.every((cell) => cell === null || cell === undefined || String(cell).trim() === "")

    // Check if row is a summary row
    const isSummaryRow = row.some(
      (cell) =>
        typeof cell === "string" &&
        ["total", "sum", "subtotal", "average", "avg", "count"].includes(cell.toString().toLowerCase().trim()),
    )

    if (isRowEmpty) {
      if (currentTable.length > 0) {
        // Check if this is a "real" table or just metadata
        const isRealTable = isLikelyRealTable(currentTable)

        if (isRealTable) {
          const endRow = idx - 1

          // First create the table without empty columns detection
          const table: ProcessedTable = {
            startRow: startRow!,
            endRow,
            data: currentTable,
            headers: currentTable[0],
            summaryRows: summaryRowIndices.filter((i) => i >= startRow! && i <= endRow).map((i) => i - startRow!),
            emptyColumns: [], // Initialize with empty array - we'll detect these later
          }

          tables.push(table)
        }

        currentTable = []
        startRow = null
        summaryRowIndices = []
      }
    } else {
      if (startRow === null) {
        startRow = idx
      }

      // Mark summary rows but still include them in the data
      if (isSummaryRow) {
        summaryRowIndices.push(idx)
      }

      currentTable.push(row)
    }
  }

  // Add the last table if there is one
  if (currentTable.length > 0) {
    // Check if this is a "real" table or just metadata
    const isRealTable = isLikelyRealTable(currentTable)

    if (isRealTable) {
      // First create the table without empty columns detection
      const table: ProcessedTable = {
        startRow: startRow!,
        endRow: data.length - 1,
        data: currentTable,
        headers: currentTable[0],
        summaryRows: summaryRowIndices.filter((i) => i >= startRow!).map((i) => i - startRow!),
        emptyColumns: [], // Initialize with empty array - we'll detect these later
      }

      tables.push(table)
    }
  }

  return tables

  // Helper function to determine if a group of rows is likely a real data table
  function isLikelyRealTable(tableData: any[][]): boolean {
    // Check minimum row count
    if (tableData.length < MIN_ROWS) {
      return false
    }

    // Check for consistent column structure
    const columnCounts = tableData.map(
      (row) => row.filter((cell) => cell !== null && cell !== undefined && String(cell).trim() !== "").length,
    )

    // Calculate the most common column count (mode)
    const modeColumnCount = mode(columnCounts)

    // Check if most rows have a similar number of columns
    const consistentColumnRows = columnCounts.filter((count) => Math.abs(count - modeColumnCount) <= 1).length

    const columnConsistency = consistentColumnRows / tableData.length

    // Check minimum column count
    if (modeColumnCount < MIN_COLUMNS) {
      return false
    }

    // Count total non-empty cells
    let nonEmptyCells = 0
    for (const row of tableData) {
      for (const cell of row) {
        if (cell !== null && cell !== undefined && String(cell).trim() !== "") {
          nonEmptyCells++
        }
      }
    }

    // Check minimum data cells
    if (nonEmptyCells < MIN_DATA_CELLS) {
      return false
    }

    // Check column consistency
    if (columnConsistency < 0.7) {
      // At least 70% of rows should have consistent column count
      return false
    }

    return true
  }

  // Helper function to find the mode (most common value) in an array
  function mode(arr: number[]): number {
    const counts = new Map<number, number>()
    let maxCount = 0
    let maxValue = arr[0]

    for (const value of arr) {
      const count = (counts.get(value) || 0) + 1
      counts.set(value, count)

      if (count > maxCount) {
        maxCount = count
        maxValue = value
      }
    }

    return maxValue
  }
}
