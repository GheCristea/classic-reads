import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BookOpen, Home, Search } from "lucide-react"
import Link from "next/link"

export default function NotFound() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-2xl mx-auto text-center space-y-8">
        {/* Error illustration */}
        <div className="space-y-4">
          <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center">
            <BookOpen className="h-12 w-12 text-muted-foreground" />
          </div>
          <div className="space-y-2">
            <h1 className="text-4xl font-bold">Page Not Found</h1>
            <p className="text-xl text-muted-foreground">
              The page you're looking for doesn't exist in our library.
            </p>
          </div>
        </div>

        {/* Action cards */}
        <div className="grid md:grid-cols-3 gap-4">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="text-center">
              <div className="mx-auto w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mb-2">
                <Home className="h-5 w-5 text-primary" />
              </div>
              <CardTitle className="text-lg">Go Home</CardTitle>
              <CardDescription>
                Return to the homepage and discover featured books
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link href="/">
                  Take Me Home
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="text-center">
              <div className="mx-auto w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mb-2">
                <BookOpen className="h-5 w-5 text-primary" />
              </div>
              <CardTitle className="text-lg">Browse Books</CardTitle>
              <CardDescription>
                Explore our collection of classic literature
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full">
                <Link href="/books">
                  Browse Collection
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="text-center">
              <div className="mx-auto w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mb-2">
                <Search className="h-5 w-5 text-primary" />
              </div>
              <CardTitle className="text-lg">Search</CardTitle>
              <CardDescription>
                Find specific books, authors, or topics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full">
                <Link href="/search">
                  Start Searching
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Additional help */}
        <div className="text-sm text-muted-foreground">
          <p>
            If you believe this is an error, you can try refreshing the page or{" "}
            <Link href="/" className="text-primary hover:underline">
              contact support
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  )
} 