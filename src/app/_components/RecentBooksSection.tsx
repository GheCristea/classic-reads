"use client"

import { Card, CardContent } from "@/components/ui/card"
import { getRecentBooks, type RecentBook } from "@/lib/recent"
import { Book as BookIcon } from "lucide-react"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Eye, Play } from "lucide-react"
import { useRouter } from "next/navigation"
import { useCallback } from "react"
import { fetchBookById, getEpubFormat } from "@/lib/gutendx"

export function RecentBooksSection() {
  const [activeOverlay, setActiveOverlay] = useState<string | null>(null)
  const [isStartingRead, setIsStartingRead] = useState<string | null>(null)
  const router = useRouter()

  const [recent, setRecent] = useState<RecentBook[]>([])

  useEffect(() => {
    setRecent(getRecentBooks())
    const handler = () => setRecent(getRecentBooks())
    window.addEventListener("storage", handler)
    return () => window.removeEventListener("storage", handler)
  }, [])

  const handleBookHover = useCallback((bookId: string) => {
    // Only show overlay on devices with hover capability (desktop)
    if (window.matchMedia('(hover: hover)').matches) {
      setActiveOverlay(bookId)
    }
  }, [])

  const handleBookLeave = useCallback(() => {
    setActiveOverlay(null)
  }, [])

  const handleBookClick = useCallback((bookId: string) => {
    // For touch devices, toggle overlay on tap
    if (!window.matchMedia('(hover: hover)').matches) {
      setActiveOverlay(current => current === bookId ? null : bookId)
    } else {
      // Fallback navigation for desktop if no overlay
      router.push(`/books/${bookId}`)
    }
  }, [router])

  const handleViewBook = useCallback((bookId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    router.push(`/books/${bookId}`)
  }, [router])

  const handleStartReading = useCallback(async (bookId: number, e: React.MouseEvent) => {
    e.stopPropagation()
    const bookIdStr = String(bookId)

    if (isStartingRead === bookIdStr) return
    setIsStartingRead(bookIdStr)

    try {
      const book = await fetchBookById(bookId)
      const epubFormat = getEpubFormat(book)

      if (!epubFormat) {
        alert('EPUB format not available for this book')
        return
      }

      const response = await fetch('/api/epub-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ epubUrl: epubFormat.url }),
      })

      if (!response.ok) throw new Error('Failed to create session')

      const data = await response.json()
      document.cookie = `epub-session-id=${data.sessionId}; path=/; max-age=7200`
      router.push(`/read/${data.sessionId}?b=${encodeURIComponent(String(bookId))}`)
    } catch (error) {
      console.error('Error starting reading session:', error)
      alert('Could not start reading. Please try again.')
    } finally {
      setIsStartingRead(null)
    }
  }, [router, isStartingRead])

  if (recent.length === 0) return null

  return (
    <section className="py-8 px-4 bg-background">
      <div className="container mx-auto max-w-full">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Recently viewed</h2>
        </div>
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-5">
          {recent.map((b) => {
            const bookIdStr = String(b.id)
            const showOverlay = activeOverlay === bookIdStr
            const isLoading = isStartingRead === bookIdStr

            return (
              <div
                key={b.id}
                className="group relative cursor-pointer"
                onMouseEnter={() => handleBookHover(bookIdStr)}
                onMouseLeave={handleBookLeave}
                onClick={() => handleBookClick(bookIdStr)}
              >
                <Card className="overflow-hidden hover:shadow-sm transition-shadow h-full">
                  <div className="aspect-[3/4] bg-muted flex items-center justify-center overflow-hidden relative">
                    {b.coverUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={b.coverUrl}
                        alt={b.title}
                        className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform"
                        loading="lazy"
                      />
                    ) : (
                      <BookIcon className="h-10 w-10 text-muted-foreground" />
                    )}

                    {/* Overlay */}
                    <div
                      className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-200 flex items-center justify-center gap-2 ${showOverlay ? 'opacity-100' : 'opacity-0 pointer-events-none'
                        }`}
                    >
                      <Button
                        size="sm"
                        variant="secondary"
                        className="text-xs"
                        onClick={(e) => handleViewBook(bookIdStr, e)}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </Button>
                      <Button
                        size="sm"
                        className="text-xs bg-green-600 hover:bg-green-700 text-white"
                        disabled={isLoading}
                        onClick={(e) => handleStartReading(b.id, e)}
                      >
                        <Play className="h-3 w-3 mr-1" />
                        {isLoading ? 'Starting...' : 'Read'}
                      </Button>
                    </div>
                  </div>
                  <CardContent className="p-3 space-y-1">
                    <div className="text-sm font-medium line-clamp-2">{b.title}</div>
                    <div className="text-xs text-muted-foreground line-clamp-1">{b.author}</div>
                  </CardContent>
                </Card>
              </div>
            )
          })}

        </div>
      </div>
    </section>
  )
}
