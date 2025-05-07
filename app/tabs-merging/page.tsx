"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileUploader } from "@/components/file-uploader"
import { ExcelPreview } from "@/components/excel-preview"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Download, Eye, EyeOff, Loader2 } from "lucide-react"
import { processExcelFile } from "@/lib/excel-processor"
import { mergeSheets, generateMergedExcelFile } from "@/lib/tab-merger"
import { fetchProjectsData, getProjectsByDevelopers, type Developer, type Project } from "@/lib/fetch-projects"
import { MultiSelectDropdown, type Option } from "@/components/multi-select-dropdown"
import { Switch } from "@/components/ui/switch"
import type { ExcelData } from "@/lib/types"

export default function TabsMerging() {
  const [excelData, setExcelData] = useState<ExcelData | null>(null)
  const [activeSheet, setActiveSheet] = useState<string>("")
  const [selectedDevelopers, setSelectedDevelopers] = useState<string[]>([])
  const [selectedProjects, setSelectedProjects] = useState<string[]>([])
  const [tabAssignments, setTabAssignments] = useState<Record<string, string>>({})
  const [includedTabs, setIncludedTabs] = useState<Record<string, boolean>>({})
  const [mergedData, setMergedData] = useState<any[][] | null>(null)
  const [step, setStep] = useState<"upload" | "assign" | "result">("upload")
  const [isProcessing, setIsProcessing] = useState(false)
  const [developers, setDevelopers] = useState<Developer[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)

  // Fetch developers and projects on component mount
  useEffect(() => {
    const loadData = async () => {
      setIsLoadingData(true)
      setFetchError(null)
      try {
        const data = await fetchProjectsData()
        if (data.developers.length === 0 || data.projects.length === 0) {
          setFetchError("Failed to load developers and projects data. Please try again.")
        } else {
          setDevelopers(data.developers)
          setProjects(data.projects)
          console.log(`Loaded ${data.developers.length} developers and ${data.projects.length} projects`)
        }
      } catch (error) {
        console.error("Error loading projects data:", error)
        setFetchError("An error occurred while loading data. Please try again.")
      } finally {
        setIsLoadingData(false)
      }
    }

    loadData()
  }, [])

  // Convert developers to options for the multi-select dropdown
  const developerOptions: Option[] = useMemo(
    () =>
      developers.map((developer) => ({
        value: developer.id,
        label: developer.name,
      })),
    [developers],
  )

  // Filter projects based on selected developers
  const filteredProjects = useMemo(
    () => getProjectsByDevelopers(projects, selectedDevelopers),
    [projects, selectedDevelopers],
  )

  // Convert filtered projects to options for the multi-select dropdown
  const projectOptions: Option[] = useMemo(
    () =>
      filteredProjects.map((project) => ({
        value: project.id,
        label: project.name,
        tag: project.isSuper ? "Main" : "Sub",
        tagColor: project.isSuper ? "green" : "blue",
      })),
    [filteredProjects],
  )

  // When developers selection changes, reset projects selection
  useEffect(() => {
    setSelectedProjects([])
  }, [selectedDevelopers])

  const handleFileUpload = async (file: File) => {
    setIsProcessing(true)
    try {
      const data = await processExcelFile(file)
      setExcelData(data)
      if (data.sheets.length > 0) {
        setActiveSheet(data.sheets[0].name)

        // Initialize tab assignments and inclusion
        const initialAssignments: Record<string, string> = {}
        const initialIncluded: Record<string, boolean> = {}

        data.sheets.forEach((sheet) => {
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

  const handleDeveloperSelection = (selected: string[]) => {
    setSelectedDevelopers(selected)
  }

  const handleProjectSelection = (selected: string[]) => {
    setSelectedProjects(selected)
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

      // Pass the projects array to mergeSheets
      const merged = mergeSheets(includedSheets, tabAssignments, selectedProjects, projects)
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

  // Project selection section - now a separate component to reuse
  const ProjectSelectionSection = () => (
    <div className="border rounded-md p-4 bg-gray-50 mb-6">
      <h3 className="text-lg font-medium mb-2">Select Projects</h3>
      <p className="text-sm text-muted-foreground mb-4">
        First select developers, then choose projects from those developers.
      </p>

      {isLoadingData ? (
        <div className="flex items-center justify-center h-20">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="ml-2">Loading data...</span>
        </div>
      ) : fetchError ? (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-700 mb-4">
          <p className="font-medium">Error loading data</p>
          <p className="text-sm mt-1">{fetchError}</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-2"
            onClick={() => {
              setIsLoadingData(true)
              setFetchError(null)
              fetchProjectsData()
                .then((data) => {
                  setDevelopers(data.developers)
                  setProjects(data.projects)
                })
                .catch((err) => {
                  setFetchError("Failed to reload data. Please try again.")
                })
                .finally(() => {
                  setIsLoadingData(false)
                })
            }}
          >
            Try Again
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Developers Dropdown */}
          <div>
            <Label htmlFor="developers" className="block mb-2">
              1. Select Developers ({developers.length} available)
            </Label>
            <div className="relative" id="developers">
              <MultiSelectDropdown
                options={developerOptions}
                selected={selectedDevelopers}
                onChange={handleDeveloperSelection}
                placeholder="Select developers..."
                emptyMessage="No developers found."
              />
              {developerOptions.length === 0 && !isLoadingData && (
                <p className="text-sm text-red-500 mt-2">
                  No developers loaded. Please refresh the page and try again.
                </p>
              )}
            </div>
          </div>

          {/* Projects Dropdown */}
          <div>
            <Label htmlFor="projects" className="block mb-2">
              2. Select Projects ({filteredProjects.length} available)
            </Label>
            <div className="relative" id="projects">
              <MultiSelectDropdown
                options={projectOptions}
                selected={selectedProjects}
                onChange={handleProjectSelection}
                placeholder={selectedDevelopers.length > 0 ? "Select projects..." : "Please select developers first"}
                emptyMessage={
                  selectedDevelopers.length > 0
                    ? "No projects found for selected developers."
                    : "Please select developers first."
                }
                disabled={selectedDevelopers.length === 0}
              />
              {selectedDevelopers.length > 0 && projectOptions.length === 0 && (
                <p className="text-sm text-amber-500 mt-2">No projects found for the selected developers.</p>
              )}
            </div>
          </div>

          {/* Selection Summary */}
          <div className="mt-4 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Selected Developers: {selectedDevelopers.length}</span>
              <span>Selected Projects: {selectedProjects.length}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )

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

        {/* Project Selection - Always visible */}
        <ProjectSelectionSection />

        {step === "upload" && (
          <div className="space-y-6">
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
                    className={`flex flex-col md:flex-row md:items-center gap-2 md:gap-4 p-2 border rounded-md ${!includedTabs[sheet.name] ? "bg-gray-100 opacity-70" : ""}`}
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
                      <MultiSelectDropdown
                        options={projectOptions.filter((option) => selectedProjects.includes(option.value))}
                        selected={tabAssignments[sheet.name] ? [tabAssignments[sheet.name]] : []}
                        onChange={(selected) => {
                          if (selected.length > 0) {
                            handleTabAssignment(sheet.name, selected[0])
                          } else {
                            // If all are deselected, clear the assignment
                            handleTabAssignment(sheet.name, "")
                          }
                        }}
                        placeholder="Select a project"
                        emptyMessage="No projects selected"
                        disabled={!includedTabs[sheet.name] || selectedProjects.length === 0}
                      />
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
                  Object.values(tabAssignments).filter(Boolean).length === 0 ||
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
