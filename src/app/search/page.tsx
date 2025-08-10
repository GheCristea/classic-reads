import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { getSuggestedSearchTerms, searchBooks } from "@/lib/gutendx"
import { redirect } from "next/navigation"
import { Suspense } from "react"
import { ApiErrorCard } from "../books/_components/ApiErrorCard"
import { BookCard } from "../books/_components/BookCard"
import { SearchBar } from "./_components/SearchBar"

interface SearchPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

interface SearchResultsProps {
  searchParams: {
    q?: string
    page?: string
  }
}

function SearchSkeleton() {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="space-y-4">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      ))}
    </div>
  )
}

async function SearchResults({ searchParams }: SearchResultsProps) {
  const query = searchParams.q
  const page = parseInt(searchParams.page || "1")

  if (!query) {
    return null
  }

  try {
    const booksResponse = await searchBooks(query, { page })
    
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Search Results</h2>
            <p className="text-muted-foreground">
              Found {booksResponse.count.toLocaleString()} books for &quot;{query}&quot;
            </p>
          </div>
        </div>

        {booksResponse.results.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {booksResponse.results.map((book) => (
              <BookCard key={book.id} book={book} showFullDetails />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <h3 className="text-xl font-semibold mb-2">No books found</h3>
            <p className="text-muted-foreground mb-4">
              Try different keywords or browse our popular categories below.
            </p>
          </div>
        )}
      </div>
    )
  } catch (error) {
    console.error("Search error:", error)
    return (
      <div className="py-8">
        <ApiErrorCard 
          title="Search Unavailable"
          description="Unable to search the catalog right now. Please try again later or browse from the homepage."
        />
      </div>
    )
  }
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const resolved = await searchParams
  const query = (resolved.q as string | undefined) ?? (resolved.search as string | undefined)
  const suggestedTerms = getSuggestedSearchTerms()

  // If there's a query but we're not on the books page, redirect to books with search
  const topic = resolved.topic as string | undefined
  const languages = resolved.languages as string | undefined
  const sort = resolved.sort as string | undefined
  const copyright = resolved.copyright as string | undefined
  const page = resolved.page as string | undefined

  if (
    (query && query.trim()) ||
    topic !== undefined ||
    languages !== undefined ||
    sort !== undefined ||
    copyright !== undefined ||
    page !== undefined
  ) {
    const params = new URLSearchParams()
    if (query && query.trim()) params.set("search", query.trim())
    if (topic) params.set("topic", topic)
    if (languages) params.set("languages", languages)
    if (sort) params.set("sort", sort)
    if (copyright) params.set("copyright", copyright)
    if (page) params.set("page", page)
    redirect(`/books?${params.toString()}`)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Search Header */}
      <div className="text-center space-y-6 mb-12">
        <div className="space-y-4">
          <h1 className="text-3xl md:text-4xl font-bold">
            Search Classic Literature
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Discover books by title, author, subject, or any keyword. 
            Search through over 70,000 classic works.
          </p>
        </div>
        
        {/* Enhanced Search Bar */}
        <div className="max-w-2xl mx-auto">
          <SearchBar />
        </div>
      </div>

      {/* Search Results */}
      {query && (
        <Suspense fallback={<SearchSkeleton />}>
          <SearchResults searchParams={{ q: query, page: (resolved.page as string | undefined) }} />
        </Suspense>
      )}

      {/* Popular Search Terms */}
      {!query && (
        <div className="space-y-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Popular Searches</h2>
            <p className="text-muted-foreground">
              Not sure what to search for? Try these popular terms
            </p>
          </div>

          <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {suggestedTerms.map((term) => (
              <Card key={term} className="hover:shadow-md transition-shadow cursor-pointer group">
                <CardContent className="p-6">
                  <Button 
                    asChild 
                    variant="ghost" 
                    className="w-full h-auto p-0 group-hover:text-primary"
                  >
                    <a href={`/books?search=${encodeURIComponent(term)}`}>
                      <div className="text-center">
                        <h3 className="font-semibold">{term}</h3>
                      </div>
                    </a>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Search Tips */}
      {!query && (
        <div className="mt-16">
          <Card>
            <CardHeader>
              <CardTitle>Search Tips</CardTitle>
              <CardDescription>
                Get better results with these search strategies
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="font-semibold">Author Searches</h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• Use last name first: &quot;Dickens, Charles&quot;</li>
                    <li>• Or just the last name: &quot;Dickens&quot;</li>
                    <li>• Try common name variations</li>
                  </ul>
                </div>
                <div className="space-y-3">
                  <h4 className="font-semibold">Subject Searches</h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• Use broad categories: &quot;Fiction&quot;, &quot;Poetry&quot;</li>
                    <li>• Try specific topics: &quot;Adventure&quot;, &quot;Romance&quot;</li>
                    <li>• Search by time period: &quot;Victorian&quot;, &quot;Medieval&quot;</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
} 