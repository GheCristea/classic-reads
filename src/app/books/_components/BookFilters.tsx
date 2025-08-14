"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { SUBJECTS } from "@/lib/subjects"
import { Filter, Search, X } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { useState } from "react"

const sortOptions = [
  { value: "popular", label: "Most Popular" },
  { value: "ascending", label: "Title A-Z" },
  { value: "descending", label: "Title Z-A" },
]

// Using shared SUBJECTS list

export function BookFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "")

  const updateFilters = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString())
    
    if (value === null || value === "") {
      params.delete(key)
    } else {
      params.set(key, value)
    }
    
    // Reset to page 1 when filters change
    params.delete("page")
    
    router.push(`/books?${params.toString()}`)
  }



  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    updateFilters("search", searchQuery || null)
  }

  const clearAllFilters = () => {
    setSearchQuery("")
    router.push("/books")
  }

  const activeFilters = {
    search: searchParams.get("search"),
    copyright: searchParams.get("copyright"),
    sort: searchParams.get("sort"),
    topic: searchParams.get("topic"),
  }

  const hasActiveFilters = Object.values(activeFilters).some(value => 
    value !== null && value !== ""
  )

  return (
    <div className="space-y-6">
      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            Search Books
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSearch}>
            <div className="flex gap-2">
              <Input
                placeholder="Search titles, authors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Button type="submit" size="sm">
                Search
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Active Filters */}
      {hasActiveFilters && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Active Filters
              </CardTitle>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={clearAllFilters}
              >
                Clear All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {activeFilters.search && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Search: {activeFilters.search}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => updateFilters("search", null)}
                  />
                </Badge>
              )}

              {activeFilters.topic && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Topic: {activeFilters.topic}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => updateFilters("topic", null)}
                  />
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sort Options */}
      <Card>
        <CardHeader>
          <CardTitle>Sort By</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {sortOptions.map((option) => (
              <Button
                key={option.value}
                variant={activeFilters.sort === option.value ? "default" : "ghost"}
                className="w-full justify-start"
                onClick={() => updateFilters("sort", option.value)}
              >
                {option.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>



      {/* Subjects */}
      <Card>
        <CardHeader>
          <CardTitle>Popular Subjects</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {SUBJECTS.map((subject: string) => (
              <Button
                key={subject}
                variant={activeFilters.topic === subject ? "default" : "ghost"}
                className="w-full justify-start"
                onClick={() => updateFilters("topic", subject)}
              >
                {subject}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Copyright Status */}
      <Card>
        <CardHeader>
          <CardTitle>Copyright Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Button
              variant={activeFilters.copyright === "false" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => updateFilters("copyright", "false")}
            >
              Public Domain
            </Button>
            <Button
              variant={activeFilters.copyright === "true" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => updateFilters("copyright", "true")}
            >
              Copyrighted
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 