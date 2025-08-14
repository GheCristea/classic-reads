"use client"

import { addRecentBook } from "@/lib/recent"
import { useEffect } from "react"

interface RecentlyViewedTrackerProps {
  book: {
    id: number
    title: string
    author: string
    coverUrl: string | null
  }
}

export function RecentlyViewedTracker({ book }: RecentlyViewedTrackerProps) {
  useEffect(() => {
    addRecentBook(book)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [book.id])

  return null
}


