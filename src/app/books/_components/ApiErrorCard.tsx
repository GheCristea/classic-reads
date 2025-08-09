"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { RefreshCw, WifiOff } from "lucide-react"
import Link from "next/link"

interface ApiErrorCardProps {
  title?: string
  description?: string
  showRetry?: boolean
}

export function ApiErrorCard({ 
  title = "Connection Issue",
  description = "Unable to connect to the books catalog. Please check your internet connection and try again.",
  showRetry = true
}: ApiErrorCardProps) {
  const handleRetry = () => {
    window.location.reload()
  }

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-4">
          <WifiOff className="h-6 w-6 text-muted-foreground" />
        </div>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="text-center space-y-4">
        {showRetry && (
          <Button onClick={handleRetry} className="w-full">
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
        )}
        <p className="text-sm text-muted-foreground">
          You can also try browsing from the{" "}
          <Link href="/" className="text-primary hover:underline">homepage</Link> or{" "}
          <Link href="/search" className="text-primary hover:underline">search page</Link>
        </p>
      </CardContent>
    </Card>
  )
} 