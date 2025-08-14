import { ApiErrorCard } from "@/app/books/_components/ApiErrorCard"
import { BookCard } from "@/app/books/_components/BookCard"
import { Pagination } from "@/app/books/_components/Pagination"
import { Skeleton } from "@/components/ui/skeleton"
import { getBooksByAuthor } from "@/lib/gutendx"
import { Suspense } from "react"

export const dynamic = "force-dynamic"

interface AuthorPageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ page?: string }>
}

function toName(slug: string): string {
  return decodeURIComponent(slug.replace(/-/g, ' '))
}

function AuthorSkeleton() {
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

async function AuthorBooks({ params, searchParams }: AuthorPageProps) {
  const { slug } = await params
  const { page: rawPage } = await searchParams
  const page = parseInt(rawPage || '1')
  const name = toName(slug)

  try {
    const booksResponse = await getBooksByAuthor(name, page)
    const totalPages = Math.ceil(booksResponse.count / 32)
    return (
      <>
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Books by {name}</h1>
          <p className="text-muted-foreground">{booksResponse.count.toLocaleString()} books found</p>
        </div>

        {booksResponse.results.length > 0 ? (
          <>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {booksResponse.results.map((book) => (
                <BookCard key={book.id} book={book} />
              ))}
            </div>
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
            <p className="text-muted-foreground">Try another spelling or search variation.</p>
          </div>
        )}
      </>
    )
  } catch (error) {
    console.error('Error fetching author books:', error)
    return (
      <div className="py-12">
        <ApiErrorCard />
      </div>
    )
  }
}

export default function AuthorPage(props: AuthorPageProps) {
  return (
    <div className="container mx-auto px-4 py-8">
      <Suspense fallback={<AuthorSkeleton />}> 
        <AuthorBooks {...props} />
      </Suspense>
    </div>
  )
}


