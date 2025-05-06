import React from "react"

interface TableData {
  data: any[]
  emptyColumns?: string[]
}

interface ResultPageProps {
  searchParams: {
    tables: string
  }
}

const ExcelPreview = React.lazy(() =>
  import("@/components/excel-preview").then((module) => ({ default: module.ExcelPreview })),
)

const ResultPage: React.FC<ResultPageProps> = ({ searchParams }) => {
  let tablesData: TableData[] = []

  try {
    if (searchParams?.tables) {
      tablesData = JSON.parse(searchParams.tables) as TableData[]
    }
  } catch (error) {
    console.error("Error parsing tables data:", error)
    return <div>Error: Could not parse table data.</div>
  }

  if (!tablesData || tablesData.length === 0) {
    return <div>No data to display.</div>
  }

  return (
    <div>
      {tablesData.map((table, index) => (
        <div key={index}>
          {table.data && table.data.length > 0 ? (
            <React.Suspense fallback={<div>Loading Table...</div>}>
              <ExcelPreview
                data={table.data}
                compact={true}
                ultraCompact={true}
                maxHeight={300}
                emptyColumns={table.emptyColumns || []}
              />
            </React.Suspense>
          ) : (
            <div>No data in this table.</div>
          )}
        </div>
      ))}
    </div>
  )
}

export default ResultPage
