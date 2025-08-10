import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getAuthorPortraitUrl } from "@/lib/wikipedia"
import { AuthorSearch } from "./_components/AuthorSearch"

export const dynamic = 'force-static'
export const revalidate = 300

const popularAuthors = [
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
];

async function PopularAuthorsGrid() {
  const portraits = await Promise.all(
    popularAuthors.map(async (name) => ({
      name,
      portrait: await getAuthorPortraitUrl(name, 320),
    }))
  )

  return (
    <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {portraits.filter(p => p.portrait).map(({ name, portrait }) => (
        <Card key={name} className="hover:shadow-md transition-shadow overflow-hidden">
          {portrait ? (
            <div className="relative w-full h-48 bg-muted">
              <img
                src={portrait}
                alt={name}
                className="absolute inset-0 w-full h-full object-cover"
                loading="lazy"
              />
            </div>
          ) : (
            <div className="w-full h-48 bg-muted" />
          )}
          <CardHeader>
            <CardTitle className="text-lg">{name}</CardTitle>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <a href={`/search?q=${encodeURIComponent(name)}`}>View books</a>
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

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

      {/* Popular authors with portraits */}
      <PopularAuthorsGrid />
    </div>
  )
}


