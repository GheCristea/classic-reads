"use client"

import { BookCard } from "@/app/books/_components/BookCard"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Book } from "@/lib/gutendx"
import { getLanguageInfo, useCurrentLanguage } from "@/lib/language"
import { ArrowRight, Star } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import popularBooksData from "./popular-books.json"

function convertToBook(bookData: { friendlyName: string; author: string; bookId: number }): Book {
  return {
    id: bookData.bookId,
    title: bookData.friendlyName,
    authors: [{ name: bookData.author, birth_year: null, death_year: null }],
    translators: [],
    subjects: [],
    bookshelves: [],
    languages: ["en"],
    copyright: false,
    media_type: "Text",
    formats: {
      "text/html": `https://www.gutenberg.org/ebooks/${bookData.bookId}.html.images`,
      "application/epub+zip": `https://www.gutenberg.org/ebooks/${bookData.bookId}.epub3.images`
    },
    download_count: 0
  }
}

export function PopularBooksSection() {
  const currentLanguage = useCurrentLanguage()
  const selectedLanguage = getLanguageInfo(currentLanguage)
  const [selectedCategory, setSelectedCategory] = useState<string>("Gateway Classics")

  if (currentLanguage !== "en") {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              <CardTitle>
                Popular Books
                {selectedLanguage && (
                  <span className="ml-2 text-primary font-normal">
                    in {selectedLanguage.name}
                  </span>
                )}
              </CardTitle>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href={`/books?lang=${currentLanguage}`}>
                View All <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <CardDescription>
            <span className="block text-amber-600">
              Curated books are only available in English. Switch to English for our book recommendations or browse all books in {selectedLanguage?.name || "this language"}.
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Button asChild variant="outline">
              <Link href={`/books?lang=${currentLanguage}`}>
                Browse All Books in {selectedLanguage?.name || "This Language"}
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  const categories = Object.keys(popularBooksData)
  const selectedBooks = popularBooksData[selectedCategory as keyof typeof popularBooksData]

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            <CardTitle>Curated Book Collections</CardTitle>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href="/books">
              View All <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
        <CardDescription>
          Handpicked classic books organized by themes and reading preferences
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </Button>
            ))}
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
            {selectedBooks.map((bookData) => {
              const book = convertToBook(bookData)
              return <BookCard key={book.id} book={book} showDownloadCount={false} />
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
