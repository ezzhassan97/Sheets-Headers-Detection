"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function TabsMerging() {
  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>Tabs Merging</CardTitle>
        <CardDescription>Merge multiple Excel tabs into a single consolidated view</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-center h-64 border-2 border-dashed rounded-md">
          <p className="text-muted-foreground">This feature is coming soon</p>
        </div>
      </CardContent>
    </Card>
  )
}
