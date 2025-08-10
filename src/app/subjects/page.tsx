import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export const dynamic = 'force-static'
export const revalidate = 300

const subjects: string[] = [
  "Fiction",
  "Philosophy",
  "Poetry",
  "History",
  "Science",
  "Romance",
  "Adventure",
  "Mystery",
  "Children's Literature",
  "Biography",
  "Autobiography",
  "Cookbooks",
  "Travel",
]

export default function SubjectsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-10 text-center space-y-2">
        <h1 className="text-3xl md:text-4xl font-bold">Browse by Subject</h1>
        <p className="text-muted-foreground">Quickly jump into popular topics from Project Gutenberg</p>
      </div>

      <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {subjects.map((subject) => (
          <Card key={subject} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="text-lg">{subject}</CardTitle>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full">
                <a href={`/search?topic=${encodeURIComponent(subject)}`}>View books</a>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}


