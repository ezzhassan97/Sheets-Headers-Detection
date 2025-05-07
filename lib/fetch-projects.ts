import Papa from "papaparse"

export interface Developer {
  id: string
  name: string
}

export interface Project {
  id: string
  name: string
  developerId: string
  developerName: string
  isSuper: boolean
  fake: boolean
  notLaunched: boolean
}

export interface ProjectsData {
  developers: Developer[]
  projects: Project[]
}

export async function fetchProjectsData(): Promise<ProjectsData> {
  try {
    console.log("Fetching projects from CSV...")
    const response = await fetch(
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/compounds_developers_list_final-hPrjHwy1d7p9LDKZcRoHHacIHU1ThQ.csv",
    )

    if (!response.ok) {
      console.error("Failed to fetch CSV:", response.status, response.statusText)
      throw new Error(`Failed to fetch CSV: ${response.status} ${response.statusText}`)
    }

    const csvText = await response.text()
    console.log("CSV text length:", csvText.length)

    if (!csvText || csvText.trim() === "") {
      console.error("Empty CSV response")
      throw new Error("Empty CSV response")
    }

    // Parse CSV with PapaParse
    const { data, errors } = Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => {
        // Clean up header names
        return header.trim().replace(/^"/, "").replace(/"$/, "")
      },
    })

    if (errors.length > 0) {
      console.error("CSV parsing errors:", errors)
    }

    console.log("Parsed CSV data count:", data.length)
    console.log("Sample row:", data[0])

    // Extract projects
    const projects: Project[] = data.map((row: any) => ({
      id: row.project_id || "",
      name: (row["Project Name"] || "").replace(/^"/, "").replace(/"$/, ""),
      developerId: row.developer_id || "",
      developerName: (row["Developer Name"] || "").replace(/^"/, "").replace(/"$/, ""),
      isSuper: row.is_super?.toUpperCase() === "TRUE",
      fake: row.fake?.toUpperCase() === "TRUE",
      notLaunched: row.not_launched?.toUpperCase() === "TRUE",
    }))

    // Extract unique developers
    const developersMap = new Map<string, Developer>()

    projects.forEach((project) => {
      if (project.developerId && !developersMap.has(project.developerId)) {
        developersMap.set(project.developerId, {
          id: project.developerId,
          name: project.developerName,
        })
      }
    })

    const developers = Array.from(developersMap.values())

    console.log(`Extracted ${developers.length} developers and ${projects.length} projects`)

    return { developers, projects }
  } catch (error) {
    console.error("Error fetching projects:", error)
    // Return empty data in case of error
    return { developers: [], projects: [] }
  }
}

// Helper function to get projects by developer IDs
export function getProjectsByDevelopers(projects: Project[], developerIds: string[]): Project[] {
  if (developerIds.length === 0) return []
  return projects.filter((project) => developerIds.includes(project.developerId))
}
