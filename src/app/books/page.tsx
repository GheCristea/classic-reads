import { BookFilters } from "./_components/BookFilters"
import { BooksContentWrapper } from "./_components/BooksContentWrapper"

export default function BooksPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Filters Sidebar */}
        <aside className="lg:w-72 space-y-6">
          <BookFilters />
        </aside>

        {/* Main Content */}
        <main className="flex-1">
          <BooksContentWrapper />
        </main>
      </div>
    </div>
  )
} 

// Client component is imported directly; Next will bundle-split automatically