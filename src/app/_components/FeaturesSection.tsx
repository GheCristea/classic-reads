import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Download, Globe } from "lucide-react";

const FeaturesSection = () => <section className="py-16 px-2">
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
</section>

export default FeaturesSection;