"use client"

import { Skeleton } from "@/components/ui/skeleton"
import type { BooksResponse } from "@/lib/gutendx"
import { fetchBooks } from "@/lib/gutendx"
import { getLanguageInfo, useCurrentLanguage } from "@/lib/language"
import { Wifi } from "lucide-react"
import { useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { ApiErrorCard } from "./ApiErrorCard"
import { Pagination } from "./Pagination"
import VirtualizedBookGrid from "./VirtualizedBookGrid"

function BooksSkeleton() {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="space-y-4">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      ))}
    </div>
  )
}

export function BooksContentWrapper() {
  const currentLanguage = useCurrentLanguage()
  const selectedLanguage = getLanguageInfo(currentLanguage)
  const searchParams = useSearchParams()
  const [booksResponse, setBooksResponse] = useState<BooksResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const page = parseInt(searchParams.get("page") || "1")
  const search = searchParams.get("search") || undefined
  const copyright = searchParams.get("copyright") === "true" ? true : searchParams.get("copyright") === "false" ? false : undefined
  const sort = (searchParams.get("sort") as "popular" | "ascending" | "descending") || "popular"
  const topic = searchParams.get("topic") || undefined

  useEffect(() => {
    const loadBooks = async () => {
      setLoading(true)
      setError(null)
      
      try {
        const response = await fetchBooks({
          page,
          search,
          languages: currentLanguage !== "en" ? [currentLanguage] : undefined, // Only filter if not English
          copyright,
          sort,
          topic,
        })
        setBooksResponse(response)
      } catch (err) {
        console.error("Error fetching books:", err)
        setError("Failed to fetch books")
      } finally {
        setLoading(false)
      }
    }

    loadBooks()
  }, [currentLanguage, page, search, copyright, sort, topic])

  if (loading) {
    return <BooksSkeleton />
  }

  if (error) {
    return (
      <div className="py-12">
        <ApiErrorCard />
      </div>
    )
  }

  if (!booksResponse) {
    return null
  }

  const totalPages = Math.ceil(booksResponse.count / 32) // Assuming 32 books per page

  return (
    <>
      {/* Results header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Wifi className="h-5 w-5 text-green-500" />
          <div>
            <h1 className="text-2xl font-bold">
              {search ? `Search results for "${search}"` : "Browse Books"}
            </h1>
            <p className="text-muted-foreground">
              {booksResponse.count.toLocaleString()} books found
              {currentLanguage !== "en" && selectedLanguage && (
                <span className="ml-2 text-primary font-medium">
                  in {selectedLanguage.name}
                </span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Books grid */}
      {booksResponse.results.length > 0 ? (
        <>
          {/* Virtualized grid for large result sets */}
          <VirtualizedBookGrid books={booksResponse.results} />
          
          {/* Pagination */}
          <Pagination 
            currentPage={page}
            totalPages={totalPages}
            hasNext={!!booksResponse.next}
            hasPrevious={!!booksResponse.previous}
          />
        </>
      ) : (
        <div className="text-center py-12">
          <h3 className="text-xl font-semibold mb-2">No books found</h3>
          <p className="text-muted-foreground">
            Try adjusting your search criteria or browse our popular books instead.
            {currentLanguage !== "en" && selectedLanguage && (
              <span className="block mt-2">
                Consider switching to English for more results.
              </span>
            )}
          </p>
        </div>
      )}
    </>
  )
}
