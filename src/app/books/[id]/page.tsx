import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Book, fetchBookById, fetchBooks, formatAuthors, getBookFormats, getEpubFormat, normalizeLanguageCode } from "@/lib/gutendx"
import { truncateText } from "@/lib/utils"
import { Book as BookIcon, Download, ExternalLink, User } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { BackButton } from "../_components/BackButton"
import { BookCard } from "../_components/BookCard"
import { EpubReaderWrapper } from "../_components/EpubReaderWrapper"


interface BookDetailPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function BookDetailPage({ params }: BookDetailPageProps) {
  const { id } = await params
  const bookId = parseInt(id)
  
  if (isNaN(bookId)) {
    notFound()
  }

  try {
    // Fetch the book details
    const book = await fetchBookById(bookId)
    
    // Get related books by the same author or similar subjects
    let relatedBooks: Book[] = []
    try {
      if (book.authors.length > 0) {
        const authorBooks = await fetchBooks({
          search: book.authors[0].name,
        })
        relatedBooks = authorBooks.results.filter(b => b.id !== book.id).slice(0, 4)
      }
    } catch (error) {
      console.error("Error fetching related books:", error)
    }

    const formats = getBookFormats(book)
    const authorText = formatAuthors(book.authors)
    const language = normalizeLanguageCode(book.languages[0] || "en")
    
    // Get EPUB format for online reading
    const epubFormat = getEpubFormat(book)

    return (
      <div className="container mx-auto px-4 py-8">
        {/* Back button */}
        <div className="mb-6">
          <div className="mb-4">
            <BackButton />
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Book Header */}
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">{language}</Badge>
                {book.copyright !== null && (
                  <Badge variant={book.copyright ? "destructive" : "default"}>
                    {book.copyright ? "Copyrighted" : "Public Domain"}
                  </Badge>
                )}
                <Badge variant="outline">{book.media_type}</Badge>
                {epubFormat && (
                  <Badge className="bg-green-100 text-green-800 border-green-200">
                    <BookIcon className="h-3 w-3 mr-1" />
                    Read Online
                  </Badge>
                )}
              </div>
              
              <h1 className="text-3xl font-bold leading-tight">{book.title}</h1>
              
              <div className="flex items-center gap-4 text-muted-foreground">
                <div className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  <span>{authorText}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Download className="h-4 w-4" />
                  <span>{book.download_count.toLocaleString()} downloads</span>
                </div>
              </div>

              {/* Read Online Section */}
              {epubFormat && (
                <Card id="read-online" className="border-green-200 bg-green-50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-green-800">
                      <BookIcon className="h-5 w-5" />
                      Read Online
                    </CardTitle>
                    <CardDescription className="text-green-700">
                      Start reading this book immediately in your browser with our built-in EPUB reader.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <EpubReaderWrapper
                      epubUrl={epubFormat.url}
                      bookId={book.id}
                    />
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Author Information */}
            {book.authors.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>
                    {book.authors.length === 1 ? "Author" : "Authors"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {book.authors.map((author, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{author.name}</p>
                          {(author.birth_year || author.death_year) && (
                            <p className="text-sm text-muted-foreground">
                              {author.birth_year || "?"} - {author.death_year || "?"}
                            </p>
                          )}
                        </div>
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/search?q=${encodeURIComponent(author.name)}`}>
                            More Books
                          </Link>
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Subjects and Categories */}
            {book.subjects.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Subjects & Categories</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {book.subjects.map((subject, index) => (
                      <Badge key={index} variant="outline" className="text-sm">
                        {truncateText(subject, 50)}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Bookshelves */}
            {book.bookshelves.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Featured Collections</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {book.bookshelves.map((shelf, index) => (
                      <Badge key={index} variant="secondary" className="text-sm">
                        {shelf}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Translators */}
            {book.translators.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Translators</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {book.translators.map((translator, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{translator.name}</p>
                          {(translator.birth_year || translator.death_year) && (
                            <p className="text-sm text-muted-foreground">
                              {translator.birth_year || "?"} - {translator.death_year || "?"}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Download Options */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  Download Book
                </CardTitle>
                <CardDescription>
                  Choose your preferred format
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {formats.length > 0 ? (
                    formats.map((format, index) => (
                      <Button
                        key={index}
                        asChild
                        variant="outline"
                        className="w-full justify-between"
                      >
                        <a href={format.url} target="_blank" rel="noopener noreferrer">
                          <span>{format.formatName}</span>
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No download formats available
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Book Info */}
            <Card>
              <CardHeader>
                <CardTitle>Book Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Book ID:</span>
                  <span className="font-mono">{book.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Language:</span>
                  <span>{language}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Media Type:</span>
                  <span>{book.media_type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Downloads:</span>
                  <span>{book.download_count.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Copyright:</span>
                  <span>{book.copyright ? "Yes" : "Public Domain"}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Related Books */}
        {relatedBooks.length > 0 && (
          <section className="mt-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">More by {book.authors[0]?.name}</h2>
              <Button asChild variant="outline">
                <Link href={`/search?q=${encodeURIComponent(book.authors[0]?.name || "")}`}>
                  View All
                </Link>
              </Button>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
              {relatedBooks.map((relatedBook) => (
                <BookCard key={relatedBook.id} book={relatedBook} />
              ))}
            </div>
          </section>
        )}
      </div>
    )
  } catch (error) {
    console.error("Error fetching book:", error)
    notFound()
  }
} 