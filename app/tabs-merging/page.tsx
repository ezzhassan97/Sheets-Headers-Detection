"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileUploader } from "@/components/file-uploader"
import { ExcelPreview } from "@/components/excel-preview"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Download, Eye, EyeOff } from "lucide-react"
import { processExcelFile } from "@/lib/excel-processor"
import { mergeSheets, generateMergedExcelFile } from "@/lib/tab-merger"
import type { ExcelData } from "@/lib/types"
import { Switch } from "@/components/ui/switch"

// Mock data for real estate projects in Egypt
const MOCK_PROJECTS = [
  { id: "madinaty", name: "Madinaty" },
  { id: "new_cairo", name: "New Cairo" },
  { id: "october", name: "6th of October" },
  { id: "zayed", name: "Sheikh Zayed" },
  { id: "alamein", name: "New Alamein" },
  { id: "sokhna", name: "Ain Sokhna" },
  { id: "north_coast", name: "North Coast" },
  { id: "katameya", name: "Katameya" },
  { id: "mostakbal", name: "Mostakbal City" },
  { id: "rehab", name: "El Rehab" },
]

export default function TabsMerging() {
  const [excelData, setExcelData] = useState<ExcelData | null>(null)
  const [activeSheet, setActiveSheet] = useState<string>("")
  const [selectedProjects, setSelectedProjects] = useState<string[]>([])
  const [tabAssignments, setTabAssignments] = useState<Record<string, string>>({})
  const [includedTabs, setIncludedTabs] = useState<Record<string, boolean>>({})
  const [mergedData, setMergedData] = useState<any[][] | null>(null)
  const [step, setStep] = useState<"upload" | "assign" | "result">("upload")
  const [isProcessing, setIsProcessing] = useState(false)

  const handleFileUpload = async (file: File) => {
    setIsProcessing(true)
    try {
      const data = await processExcelFile(file)
      setExcelData(data)
      if (data.sheets.length > 0) {
        setActiveSheet(data.sheets[0].name)

        // Initialize tab assignments with first project (if any are selected)
        const initialAssignments: Record<string, string> = {}
        const initialIncluded: Record<string, boolean> = {}

        data.sheets.forEach((sheet) => {
          if (selectedProjects.length > 0) {
            initialAssignments[sheet.name] = selectedProjects[0]
          }
          initialIncluded[sheet.name] = true // Default to including all tabs
        })

        setTabAssignments(initialAssignments)
        setIncludedTabs(initialIncluded)
      }
      setStep("assign")
    } catch (error) {
      console.error("Error processing file:", error)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleProjectSelection = (projectId: string) => {
    setSelectedProjects((prev) => {
      if (prev.includes(projectId)) {
        return prev.filter((id) => id !== projectId)
      } else {
        return [...prev, projectId]
      }
    })
  }

  const handleTabAssignment = (tabName: string, projectId: string) => {
    setTabAssignments((prev) => ({
      ...prev,
      [tabName]: projectId,
    }))
  }

  const handleTabInclusion = (tabName: string, included: boolean) => {
    setIncludedTabs((prev) => ({
      ...prev,
      [tabName]: included,
    }))
  }

  const handleMergeTabs = () => {
    if (!excelData) return

    setIsProcessing(true)
    try {
      // Filter sheets to only include the ones that are marked as included
      const includedSheets = excelData.sheets.filter((sheet) => includedTabs[sheet.name])

      const merged = mergeSheets(includedSheets, tabAssignments, selectedProjects)
      setMergedData(merged)
      setStep("result")
    } catch (error) {
      console.error("Error merging tabs:", error)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDownload = async () => {
    if (!excelData || !mergedData) return

    setIsProcessing(true)
    try {
      const blob = await generateMergedExcelFile(excelData.fileName, mergedData)

      // Create a download link
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `merged_${excelData.fileName}`
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

  // Count how many tabs are included
  const includedTabCount = excelData ? excelData.sheets.filter((sheet) => includedTabs[sheet.name]).length : 0

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>Tabs Merging</CardTitle>
        <CardDescription>Merge multiple Excel tabs into a single consolidated view</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4 mb-6">
          <div className={`flex items-center gap-2 ${step === "upload" ? "text-primary" : "text-muted-foreground"}`}>
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">1</div>
            <span>Upload</span>
          </div>
          <div className="flex-1 h-px bg-border"></div>
          <div className={`flex items-center gap-2 ${step === "assign" ? "text-primary" : "text-muted-foreground"}`}>
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">2</div>
            <span>Assign</span>
          </div>
          <div className="flex-1 h-px bg-border"></div>
          <div className={`flex items-center gap-2 ${step === "result" ? "text-primary" : "text-muted-foreground"}`}>
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">3</div>
            <span>Result</span>
          </div>
        </div>

        {step === "upload" && (
          <div className="space-y-6">
            <div className="border rounded-md p-4 bg-gray-50">
              <h3 className="text-lg font-medium mb-2">Select Projects</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Choose the projects you want to assign tabs to. You can select multiple projects.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {MOCK_PROJECTS.map((project) => (
                  <div key={project.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`project-${project.id}`}
                      checked={selectedProjects.includes(project.id)}
                      onCheckedChange={() => handleProjectSelection(project.id)}
                    />
                    <Label htmlFor={`project-${project.id}`}>{project.name}</Label>
                  </div>
                ))}
              </div>
            </div>

            <FileUploader onFileUpload={handleFileUpload} isLoading={isProcessing} />
          </div>
        )}

        {step === "assign" && excelData && (
          <div className="space-y-6">
            <Alert>
              <AlertDescription>
                Assign each tab to a project. You can also exclude tabs you don't want to include in the merge.
                {selectedProjects.length > 1 && (
                  <p className="mt-2 text-sm">
                    <strong>Note:</strong> Since you've selected multiple projects, a "Project" column will be added to
                    the merged data.
                  </p>
                )}
              </AlertDescription>
            </Alert>

            <div className="border rounded-md p-4">
              <h3 className="text-lg font-medium mb-4">Tab Assignments</h3>
              <div className="space-y-4">
                {excelData.sheets.map((sheet) => (
                  <div
                    key={sheet.name}
                    className={`flex flex-col md:flex-row md:items-center gap-2 md:gap-4 p-2 border rounded-md ${
                      !includedTabs[sheet.name] ? "bg-gray-100 opacity-70" : ""
                    }`}
                  >
                    <div className="font-medium min-w-[150px] flex items-center gap-2">
                      <Switch
                        checked={includedTabs[sheet.name]}
                        onCheckedChange={(checked) => handleTabInclusion(sheet.name, checked)}
                        id={`include-${sheet.name}`}
                      />
                      <Label htmlFor={`include-${sheet.name}`} className="cursor-pointer">
                        {sheet.name}
                      </Label>
                      {includedTabs[sheet.name] ? (
                        <Eye className="h-4 w-4 text-green-500" />
                      ) : (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-grow">
                      <Select
                        value={tabAssignments[sheet.name] || ""}
                        onValueChange={(value) => handleTabAssignment(sheet.name, value)}
                        disabled={selectedProjects.length === 0 || !includedTabs[sheet.name]}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a project" />
                        </SelectTrigger>
                        <SelectContent>
                          {selectedProjects.map((projectId) => {
                            const project = MOCK_PROJECTS.find((p) => p.id === projectId)
                            return project ? (
                              <SelectItem key={project.id} value={project.id}>
                                {project.name}
                              </SelectItem>
                            ) : null
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 text-sm text-muted-foreground">
                {includedTabCount} of {excelData.sheets.length} tabs will be included in the merge.
              </div>
            </div>

            <Tabs value={activeSheet} onValueChange={setActiveSheet}>
              <TabsList className="mb-4">
                {excelData.sheets.map((sheet) => (
                  <TabsTrigger key={sheet.name} value={sheet.name}>
                    {sheet.name}
                    {!includedTabs[sheet.name] && <EyeOff className="ml-1 h-3 w-3 text-gray-400" />}
                  </TabsTrigger>
                ))}
              </TabsList>

              {excelData.sheets.map((sheet) => (
                <TabsContent key={sheet.name} value={sheet.name}>
                  {!includedTabs[sheet.name] && (
                    <div className="mb-2 p-2 bg-yellow-50 border border-yellow-200 rounded-md text-sm flex items-center">
                      <EyeOff className="h-4 w-4 text-yellow-500 mr-2" />
                      This tab is excluded from the merge. Toggle the switch above to include it.
                    </div>
                  )}
                  <ExcelPreview data={sheet.data} compact={true} ultraCompact={true} />
                </TabsContent>
              ))}
            </Tabs>

            <div className="flex justify-end">
              <Button
                onClick={handleMergeTabs}
                disabled={
                  isProcessing ||
                  selectedProjects.length === 0 ||
                  Object.keys(tabAssignments).length === 0 ||
                  includedTabCount === 0
                }
              >
                {isProcessing ? "Processing..." : `Merge ${includedTabCount} Tabs`}
              </Button>
            </div>
          </div>
        )}

        {step === "result" && mergedData && (
          <div className="space-y-6">
            <Alert>
              <AlertDescription>
                Your tabs have been merged. Preview the results below before downloading.
                <p className="mt-2 text-sm">
                  <strong>Note:</strong> Similar columns have been aligned using fuzzy matching.
                </p>
              </AlertDescription>
            </Alert>

            <div className="border rounded-md p-4">
              <h3 className="text-lg font-medium mb-2">Merged Data Preview</h3>
              <ExcelPreview data={mergedData} compact={true} ultraCompact={true} maxHeight={400} />
            </div>

            <div className="flex justify-end">
              <Button onClick={handleDownload} disabled={isProcessing}>
                {isProcessing ? (
                  "Generating..."
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Download Merged Excel
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
