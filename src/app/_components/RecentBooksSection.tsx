"use client"

import { Card, CardContent } from "@/components/ui/card"
import { getRecentBooks, type RecentBook } from "@/lib/recent"
import { Book as BookIcon } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"

export function RecentBooksSection() {
  const [recent, setRecent] = useState<RecentBook[]>([])

  useEffect(() => {
    setRecent(getRecentBooks())
    const handler = () => setRecent(getRecentBooks())
    window.addEventListener("storage", handler)
    return () => window.removeEventListener("storage", handler)
  }, [])

  if (recent.length === 0) return null

  return (
    <section className="py-8 px-4 bg-background">
      <div className="container mx-auto max-w-full">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Recently viewed</h2>
        </div>
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-5">
          {recent.map((b) => (
            <Link key={b.id} href={`/books/${b.id}`} className="group">
              <Card className="overflow-hidden hover:shadow-sm transition-shadow h-full">
                <div className="aspect-[3/4] bg-muted flex items-center justify-center overflow-hidden">
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
                </div>
                <CardContent className="p-3 space-y-1">
                  <div className="text-sm font-medium line-clamp-2">{b.title}</div>
                  <div className="text-xs text-muted-foreground line-clamp-1">{b.author}</div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}


