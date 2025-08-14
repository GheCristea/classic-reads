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
  const measureRef = React.useRef<HTMLDivElement | null>(null)

  // Compute columns responsively based on container width
  const [cols, setCols] = React.useState<number>(columnCount)
  const [rowHeightPx, setRowHeightPx] = React.useState<number>(rowHeight)
  const [overscanRows, setOverscanRows] = React.useState<number>(6)
  React.useEffect(() => {
    const update = () => {
      const w = (!containerRef.current ? window.innerWidth : containerRef.current.clientWidth) || 0
      if (w >= 1280) setCols(3)
      else if (w >= 1024) setCols(3)
      else if (w >= 640) setCols(2)
      else setCols(1)

      // Recompute overscan based on viewport height and row height
      const rh = Math.max(1, rowHeightPx + gap)
      const rowsOnScreen = Math.max(1, Math.ceil(window.innerHeight / rh))
      setOverscanRows(Math.min(12, rowsOnScreen * 2))
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [rowHeightPx, gap])

  // Measure an example row height (first book) to better estimate
  React.useEffect(() => {
    if (!measureRef.current) return
    // Defer to next frame to ensure layout is settled
    const id = requestAnimationFrame(() => {
      try {
        const el = measureRef.current!
        const h = el.offsetHeight
        if (h && Math.abs(h - rowHeightPx) > 2) {
          setRowHeightPx(h)
        }
      } catch {}
    })
    return () => cancelAnimationFrame(id)
  }, [cols, books.length, showFullDetails, rowHeightPx])

  const rowCount = Math.ceil(books.length / Math.max(1, cols))
  const estimateSize = React.useCallback(() => rowHeightPx + gap, [rowHeightPx, gap])

  const virtualizer = useWindowVirtualizer({
    count: rowCount,
    estimateSize,
    scrollMargin: 120,
    overscan: overscanRows,
  })

  const totalHeight = virtualizer.getTotalSize()
  const items: VirtualItem[] = virtualizer.getVirtualItems()

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Hidden measurer to tune row height */}
      {books.length > 0 && (
        <div className="absolute invisible pointer-events-none" style={{ left: -9999, top: 0 }}>
        <div ref={measureRef} className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3" style={{ rowGap: gap }}>
          <BookCard book={books[0]} showFullDetails={showFullDetails} />
        </div>
      </div>
      )}
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
                className="grid gap-6 sm:grid-cols-2"
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


