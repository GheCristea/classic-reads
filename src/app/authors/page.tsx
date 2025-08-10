import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AuthorSearch } from "./_components/AuthorSearch"

export const dynamic = 'force-static'
export const revalidate = 300

const popularAuthors = Array.from(new Set([
  "William Shakespeare",
  "Jane Austen",
  "Charles Dickens",
  "Mark Twain",
  "Leo Tolstoy",
  "Fyodor Dostoevsky",
  "H. G. Wells",
  "Mary Shelley",
  "Edgar Allan Poe",
  "Arthur Conan Doyle",
  "Friedrich Nietzsche",
  "Ernest Hemingway",
  "J. R. R. Tolkien",
  "Harper Lee",
  "Herman Melville",
  "Virginia Woolf",
  "George Orwell",
  "Oscar Wilde",
  "Virginia Woolf",
  "George Orwell",
  "Oscar Wilde",
  "Virginia Woolf",
  "George Orwell",
  "Oscar Wilde",
  "Virginia Woolf",
  "George Orwell",
  "Oscar Wilde",
]))

export default function AuthorsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-10 text-center space-y-3">
        <h1 className="text-3xl md:text-4xl font-bold">Browse by Author</h1>
        <p className="text-muted-foreground">Search or pick from popular authors</p>
        <div className="max-w-xl mx-auto mt-4">
          <AuthorSearch />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {popularAuthors.map((name) => (
          <Card key={name} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="text-lg">{name}</CardTitle>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full">
                <a href={`/search?author=${encodeURIComponent(name)}`}>View books</a>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}


