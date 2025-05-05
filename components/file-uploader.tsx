"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Upload, FileSpreadsheet } from "lucide-react"

interface FileUploaderProps {
  onFileUpload: (file: File) => void
  isLoading: boolean
}

export function FileUploader({ onFileUpload, isLoading }: FileUploaderProps) {
  const [dragActive, setDragActive] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0]
      if (isExcelFile(file)) {
        onFileUpload(file)
      } else {
        alert("Please upload an Excel file (.xlsx, .xls)")
      }
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()

    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      if (isExcelFile(file)) {
        onFileUpload(file)
      } else {
        alert("Please upload an Excel file (.xlsx, .xls)")
      }
    }
  }

  const handleButtonClick = () => {
    inputRef.current?.click()
  }

  const isExcelFile = (file: File) => {
    return (
      file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
      file.type === "application/vnd.ms-excel"
    )
  }

  return (
    <div className="w-full">
      <input ref={inputRef} type="file" accept=".xlsx,.xls" onChange={handleChange} className="hidden" />

      <Card
        className={`border-2 border-dashed ${dragActive ? "border-primary" : "border-border"} hover:border-primary transition-colors`}
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
      >
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className="mb-4 rounded-full bg-primary/10 p-3">
            <FileSpreadsheet className="h-10 w-10 text-primary" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Upload Excel File</h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-sm">
            Drag and drop your Excel file here, or click the button below to select a file
          </p>
          <Button onClick={handleButtonClick} disabled={isLoading}>
            {isLoading ? (
              "Processing..."
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Select Excel File
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
