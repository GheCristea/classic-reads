import { Skeleton } from "@/components/ui/skeleton"
import { fetchBooks } from "@/lib/gutendx"
import { Wifi } from "lucide-react"
import { Suspense } from "react"
import { ApiErrorCard } from "./_components/ApiErrorCard"
import { BookFilters } from "./_components/BookFilters"
import { Pagination } from "./_components/Pagination"
import VirtualizedBookGrid from "./_components/VirtualizedBookGrid"

interface BooksPageProps {
  searchParams: Promise<{
    page?: string
    search?: string
    languages?: string
    copyright?: string
    sort?: string
    topic?: string
  }>
}

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

async function BooksContent({ searchParams }: BooksPageProps) {
  const params = await searchParams
  const page = parseInt(params.page || "1")
  const search = params.search
  const languages = params.languages?.split(",")
  const copyright = params.copyright === "true" ? true : params.copyright === "false" ? false : undefined
  const sort = params.sort as "popular" | "ascending" | "descending" | undefined
  const topic = params.topic

  try {
    const booksResponse = await fetchBooks({
      page,
      search,
      languages,
      copyright,
      sort: sort || "popular",
      topic,
    })

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
            </p>
          </div>
        )}
      </>
    )
  } catch (error) {
    console.error("Error fetching books:", error)
    return (
      <div className="py-12">
        <ApiErrorCard />
      </div>
    )
  }
}

export default function BooksPage({ searchParams }: BooksPageProps) {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Filters Sidebar */}
        <aside className="lg:w-72 space-y-6">
          <BookFilters />
        </aside>

        {/* Main Content */}
        <main className="flex-1">
          <Suspense fallback={<BooksSkeleton />}>
            <BooksContent searchParams={searchParams} />
          </Suspense>
        </main>
      </div>
    </div>
  )
} 

// Client component is imported directly; Next will bundle-split automatically