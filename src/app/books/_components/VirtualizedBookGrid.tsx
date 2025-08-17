"use client"

import { BookCard } from '@/app/books/_components/BookCard'
import type { Book } from '@/lib/gutendx'

interface VirtualizedBookGridProps {
  books: Book[]
  columnCount?: number
  rowHeight?: number
  gap?: number
  showFullDetails?: boolean
}

export function VirtualizedBookGrid({
  books,
  showFullDetails = false,
}: VirtualizedBookGridProps) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {books.map((book) => (
        <BookCard key={book.id} book={book} showFullDetails={showFullDetails} />
      ))}
    </div>
  )
}

export default VirtualizedBookGrid


