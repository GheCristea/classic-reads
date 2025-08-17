import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getSuggestedSearchTerms } from "@/lib/gutendx"
import { ArrowRight, BookOpen, Download, Globe, Star } from "lucide-react"
import Link from "next/link"
import { PopularBooksSection } from "./_components/PopularBooksSection"
import { RecentBooksSection } from "./_components/RecentBooksSection"

export default async function Home() {
  const searchTerms = getSuggestedSearchTerms()
const isMobile = true;
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="py-20 px-2 bg-gradient-to-br from-primary/10 via-background to-muted/50">
        <div className="container mx-auto max-w-full text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Classic Reads
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto">
              Discover over 70,000 free classic books from Project Gutenberg. 
              Read timeless literature, poetry, philosophy, and more.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg">
              <Link href="/books">
                <BookOpen className="mr-2 h-5 w-5" />
                Browse Books
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/search">
                <Globe className="mr-2 h-5 w-5" />
                Search Collection
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Recent Books Section */}
      <RecentBooksSection />

      {/* Features Section */}
      {
        !isMobile ? <section className="py-16 px-2">
        <div className="container mx-auto max-w-full">
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-3xl font-bold">Why Choose Classic Reads?</h2>
            <p className="text-muted-foreground">
              Your gateway to the world&rsquo;s greatest literature
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 w-full">
            <Card>
              <CardHeader>
                <BookOpen className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Vast Collection</CardTitle>
                <CardDescription>
                  Access over 70,000 books from Project Gutenberg&apos;s extensive digital library
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card>
              <CardHeader>
                <Download className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Multiple Formats</CardTitle>
                <CardDescription>
                  Download books in EPUB, PDF, TXT, and HTML formats for any device
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card>
              <CardHeader>
                <Globe className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Completely Free</CardTitle>
                <CardDescription>
                  All books are in the public domain and completely free to read and download
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section> : null }

      {/* Popular Books Section */}
      <section className="pb-16 bg-muted/30 lg:px-6">
        <div className="container mx-auto max-w-full">
          <PopularBooksSection />
        </div>
      </section>

      {/* Browse by Genre Section */}
      <section className="py-16 px-2 bg-background">
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
      <section className="py-16 px-2 bg-primary/5">
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