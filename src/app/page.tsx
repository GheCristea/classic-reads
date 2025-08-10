import { BookCard } from "@/app/books/_components/BookCard"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Book, getPopularBooks, getSuggestedSearchTerms } from "@/lib/gutendx"
import { ArrowRight, BookOpen, Download, Globe, Star } from "lucide-react"
import Link from "next/link"

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
    download_count: 15432
  },
  {
    id: 1661,
    title: "The Adventures of Sherlock Holmes",
    authors: [{ name: "Doyle, Arthur Conan", birth_year: 1859, death_year: 1930 }],
    translators: [],
    subjects: ["Detective and mystery stories", "Holmes, Sherlock (Fictitious character) -- Fiction"],
    bookshelves: ["Detective Fiction"],
    languages: ["en"],
    copyright: false,
    media_type: "Text",
    formats: {
      "text/html": "https://www.gutenberg.org/ebooks/1661.html.images",
      "application/epub+zip": "https://www.gutenberg.org/ebooks/1661.epub3.images"
    },
    download_count: 14287
  }
]

export default async function Home() {
  // Try to fetch popular books, but provide fallback if API fails
  let popularBooks: Book[] = []
  let isApiAvailable = true
  
  try {
    popularBooks = await getPopularBooks(8)
  } catch (error) {
    console.warn("API unavailable, using fallback content:", error)
    popularBooks = fallbackBooks
    isApiAvailable = false
  }

  const searchTerms = getSuggestedSearchTerms()

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-muted/50 to-background py-20 px-4">
        <div className="container mx-auto max-w-full text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
              Discover Timeless
              <span className="text-primary block">Classic Literature</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Explore over 70,000 free books from Project Gutenberg&apos;s vast collection. 
              From Shakespeare to Dickens, find your next great read.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="text-lg">
              <Link href="/books">
                Browse All Books
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/search">
                Search Books
              </Link>
            </Button>
          </div>

          {/* API Status Notice */}
          {!isApiAvailable && (
            <div className="mt-6 p-4 bg-muted/50 rounded-lg border">
              <p className="text-sm text-muted-foreground">
                📡 Showing sample books. Full catalog will be available when connected to the internet.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 bg-background">
        <div className="container mx-auto max-w-full">
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-3xl font-bold">Why Choose Classic Reads?</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Your gateway to the world&apos;s greatest literature, completely free and accessible.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 w-full">
            <Card className="text-center">
              <CardHeader>
                <div className="mx-auto w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <BookOpen className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>70,000+ Books</CardTitle>
                <CardDescription>
                  Access the entire Project Gutenberg collection of public domain books
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card className="text-center">
              <CardHeader>
                <div className="mx-auto w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Download className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Multiple Formats</CardTitle>
                <CardDescription>
                  Download books in EPUB, PDF, HTML, and plain text formats
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card className="text-center">
              <CardHeader>
                <div className="mx-auto w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Globe className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Multiple Languages</CardTitle>
                <CardDescription>
                  Books available in dozens of languages from around the world
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Popular Books Section */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto max-w-full">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold mb-2">
                {isApiAvailable ? "Popular Books" : "Featured Classic Books"}
              </h2>
              <p className="text-muted-foreground">
                {isApiAvailable 
                  ? "Most downloaded classics from our collection" 
                  : "A sample of beloved classics from our collection"}
              </p>
            </div>
            <Button asChild variant="outline">
              <Link href="/books?sort=popular">
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
            {popularBooks.map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        </div>
      </section>

      {/* Browse by Genre Section */}
      <section className="py-16 px-4 bg-background">
        <div className="container mx-auto max-w-full">
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-3xl font-bold">Browse by Interest</h2>
            <p className="text-muted-foreground">
              Find books that match your interests and discover new genres
            </p>
          </div>
          
          <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 w-full">
            {searchTerms.map((term) => (
              <Card key={term} className="hover:shadow-md transition-shadow cursor-pointer group">
                <CardContent className="p-6 text-center">
                  <Link 
                    href={`/search?q=${encodeURIComponent(term)}`}
                    className="block group-hover:text-primary transition-colors"
                  >
                    <Star className="h-6 w-6 mx-auto mb-2 text-primary" />
                    <h3 className="font-semibold">{term}</h3>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-primary/5">
        <div className="container mx-auto max-w-full text-center space-y-6">
          <h2 className="text-3xl font-bold">Start Your Literary Journey</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Join thousands of readers who have discovered the joy of classic literature. 
            All books are free, legal, and available for immediate download.
          </p>
          <Button asChild size="lg">
            <Link href="/books">
              Explore the Collection
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  )
}
