"use client"

import { BookCard } from '@/app/books/_components/BookCard'
import type { Book } from '@/lib/gutendx'
import { useWindowVirtualizer, type VirtualItem } from '@tanstack/react-virtual'
import * as React from 'react'

interface VirtualizedBookGridProps {
  books: Book[]
  columnCount?: number
  rowHeight?: number
  gap?: number
  showFullDetails?: boolean
}

// Responsive virtualized grid using window scroll
export function VirtualizedBookGrid({
  books,
  columnCount = 3,
  rowHeight = 320,
  gap = 24,
  showFullDetails = false,
}: VirtualizedBookGridProps) {
  const containerRef = React.useRef<HTMLDivElement | null>(null)

  // Compute columns responsively based on container width
  const [cols, setCols] = React.useState<number>(columnCount)
  React.useEffect(() => {
    const update = () => {
      const w = (!containerRef.current ? window.innerWidth : containerRef.current.clientWidth) || 0
      if (w >= 1280) setCols(3)
      else if (w >= 1024) setCols(3)
      else if (w >= 640) setCols(2)
      else setCols(1)
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  const rowCount = Math.ceil(books.length / Math.max(1, cols))
  const estimateSize = React.useCallback(() => rowHeight + gap, [rowHeight, gap])

  const virtualizer = useWindowVirtualizer({
    count: rowCount,
    estimateSize,
    scrollMargin: 120,
    overscan: 6,
  })

  const totalHeight = virtualizer.getTotalSize()
  const items: VirtualItem[] = virtualizer.getVirtualItems()

  return (
    <div ref={containerRef} className="relative w-full">
      <div
        style={{
          height: totalHeight,
          position: 'relative',
        }}
      >
        {items.map((vi) => {
          const startIndex = vi.index * cols
          const slice = books.slice(startIndex, startIndex + cols)
          return (
            <div
              key={vi.key}
              style={{
                position: 'absolute',
                top: vi.start,
                left: 0,
                right: 0,
              }}
            >
              <div
                className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
                style={{ rowGap: gap, marginBottom: 0 }}
              >
                {slice.map((book) => (
                  <BookCard key={book.id} book={book} showFullDetails={showFullDetails} />
                ))}
                {/* Fillers to keep grid width consistent when last row not full */}
                {slice.length < cols && Array.from({ length: cols - slice.length }).map((_, i) => (
                  <div key={`f-${vi.index}-${i}`} />
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default VirtualizedBookGrid


