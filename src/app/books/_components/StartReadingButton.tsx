"use client"

import { Button } from '@/components/ui/button'
import { Book as BookIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface StartReadingButtonProps {
  epubUrl: string
  bookId: number
  className?: string
}

export function StartReadingButton({ epubUrl, bookId, className }: StartReadingButtonProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleClick = async () => {
    if (isLoading) return
    setIsLoading(true)
    try {
      const response = await fetch('/api/epub-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ epubUrl }),
      })
      if (!response.ok) throw new Error('Failed to create session')
      const data = await response.json()
      document.cookie = `epub-session-id=${data.sessionId}; path=/; max-age=7200`
      router.push(`/read/${data.sessionId}?b=${encodeURIComponent(String(bookId))}`)
    } catch (e) {
      console.error('Error starting reading session:', e)
      alert('Could not start reading. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button onClick={handleClick} size="sm" className={className} disabled={isLoading}>
      <BookIcon className="h-3 w-3 mr-1" />
      {isLoading ? 'Starting…' : 'Read'}
    </Button>
  )
}

export default StartReadingButton


