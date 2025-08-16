"use client"

import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"

interface PaginationProps {
  currentPage: number
  totalPages: number
  hasNext: boolean
  hasPrevious: boolean
}

export function Pagination({ currentPage, totalPages, hasNext, hasPrevious }: PaginationProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const goToPage = (page: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("page", page.toString())
    router.push(`/books?${params.toString()}`)
  }

  const getVisiblePages = () => {
    const pages: (number | string)[] = []
    const maxVisible = 5

    if (totalPages <= maxVisible) {
      return Array.from({ length: totalPages }, (_, i) => i + 1)
    }

    // Always show first page
    pages.push(1)

    if (currentPage <= 4) {
      // Show pages 2, 3, 4, 5, ..., last
      for (let i = 2; i <= Math.min(5, totalPages - 1); i++) {
        pages.push(i)
      }
      if (totalPages > 6) pages.push("...")
      pages.push(totalPages)
    } else if (currentPage >= totalPages - 3) {
      // Show 1, ..., pages near the end
      pages.push("...")
      for (let i = Math.max(totalPages - 4, 2); i <= totalPages - 1; i++) {
        pages.push(i)
      }
      pages.push(totalPages)
    } else {
      // Show 1, ..., current-1, current, current+1, ..., last
      pages.push("...")
      for (let i = currentPage - 1; i <= currentPage + 1; i++) {
        pages.push(i)
      }
      pages.push("...")
      pages.push(totalPages)
    }

    return pages
  }

  if (totalPages <= 1) return null

  const visiblePages = getVisiblePages()

  return (
    <div className="flex items-center justify-center space-x-2 w-full">
      {/* Previous button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => goToPage(currentPage - 1)}
        disabled={!hasPrevious}
        className="flex items-center gap-1"
      >
        <ChevronLeft className="h-4 w-4" />
        Previous
      </Button>

      {/* Page numbers */}
      <div className="flex items-center space-x-1">
        {visiblePages.slice(0, 5).map((page, index) => (
          <div key={index}>
            {page === "..." ? (
              <div className="flex items-center justify-center w-9 h-9">
                <MoreHorizontal className="h-4 w-4" />
              </div>
            ) : (
              <Button
                variant={currentPage === page ? "default" : "outline"}
                size="sm"
                className="w-9 h-9"
                onClick={() => goToPage(page as number)}
              >
                {page}
              </Button>
            )}
          </div>
        ))}
      </div>

      {/* Next button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => goToPage(currentPage + 1)}
        disabled={!hasNext}
        className="flex items-center gap-1"
      >
        Next
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  )
} 