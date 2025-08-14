"use client"

import { BookCard } from "@/app/books/_components/BookCard"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Book, fetchBooks } from "@/lib/gutendx"
import { getLanguageInfo, useCurrentLanguage } from "@/lib/language"
import { ArrowRight, Star } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"

const fallbackBooks: Book[] = [
  {
    id: 1342,
    title: "Pride and Prejudice",
    authors: [{ name: "Austen, Jane", birth_year: 1775, death_year: 1817 }],
    translators: [],
    subjects: ["England -- Social life and customs -- 19th century -- Fiction"],
    bookshelves: ["Best Books Ever Listings"],
    languages: ["en"],
    copyright: false,
    media_type: "Text",
    formats: {
      "text/html": "https://www.gutenberg.org/ebooks/1342.html.images",
      "application/epub+zip": "https://www.gutenberg.org/ebooks/1342.epub3.images"
    },
    download_count: 25432
  },
  {
    id: 11,
    title: "Alice's Adventures in Wonderland",
    authors: [{ name: "Carroll, Lewis", birth_year: 1832, death_year: 1898 }],
    translators: [],
    subjects: ["Children's stories", "Fantasy fiction"],
    bookshelves: ["Children's Literature"],
    languages: ["en"],
    copyright: false,
    media_type: "Text",
    formats: {
      "text/html": "https://www.gutenberg.org/ebooks/11.html.images",
      "application/epub+zip": "https://www.gutenberg.org/ebooks/11.epub3.images"
    },
    download_count: 18956
  },
  {
    id: 74,
    title: "The Adventures of Tom Sawyer",
    authors: [{ name: "Twain, Mark", birth_year: 1835, death_year: 1910 }],
    translators: [],
    subjects: ["Adventure stories", "Boys -- Fiction"],
    bookshelves: ["Children's Literature"],
    languages: ["en"],
    copyright: false,
    media_type: "Text",
    formats: {
      "text/html": "https://www.gutenberg.org/ebooks/74.html.images",
      "application/epub+zip": "https://www.gutenberg.org/ebooks/74.epub3.images"
    },
    download_count: 15234
  },
  {
    id: 2701,
    title: "Moby Dick; Or, The Whale",
    authors: [{ name: "Melville, Herman", birth_year: 1819, death_year: 1891 }],
    translators: [],
    subjects: ["Adventure stories", "Whaling -- Fiction"],
    bookshelves: ["Best Books Ever Listings"],
    languages: ["en"],
    copyright: false,
    media_type: "Text",
    formats: {
      "text/html": "https://www.gutenberg.org/ebooks/2701.html.images",
      "application/epub+zip": "https://www.gutenberg.org/ebooks/2701.epub3.images"
    },
    download_count: 14567
  }
]

function BooksSkeleton() {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
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

export function PopularBooksSection() {
  const currentLanguage = useCurrentLanguage()
  const selectedLanguage = getLanguageInfo(currentLanguage)
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadPopularBooks = async () => {
      setLoading(true)
      try {
        const response = await fetchBooks({
          sort: "popular",
          languages: currentLanguage !== "en" ? [currentLanguage] : undefined,
        })
        setBooks(response.results.slice(0, 8))
      } catch (error) {
        console.error("Error fetching popular books:", error)
        // Use fallback books if API fails and language is English
        if (currentLanguage === "en") {
          setBooks(fallbackBooks)
        } else {
          setBooks([])
        }
      } finally {
        setLoading(false)
      }
    }

    loadPopularBooks()
  }, [currentLanguage])

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            <CardTitle>
              Popular Books
              {selectedLanguage && currentLanguage !== "en" && (
                <span className="ml-2 text-primary font-normal">
                  in {selectedLanguage.name}
                </span>
              )}
            </CardTitle>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href={currentLanguage === "en" ? "/books" : `/books?lang=${currentLanguage}`}>
              View All <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
        <CardDescription>
          Discover the most downloaded books from Project Gutenberg
          {currentLanguage !== "en" && books.length === 0 && !loading && selectedLanguage && (
            <span className="block mt-2 text-amber-600">
              No popular books available in {selectedLanguage.name}. Try switching to English for more options.
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <BooksSkeleton />
        ) : books.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {books.map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <p>No popular books available in the selected language.</p>
            <Button asChild variant="outline" className="mt-4">
              <Link href={currentLanguage === "en" ? "/books" : `/books?lang=${currentLanguage}`}>
                Browse All Books
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
