"use client"

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { Search } from 'lucide-react'
import { useRouter } from 'next/navigation'
import React from 'react'

interface SearchFieldProps {
  placeholder?: string
  size?: 'sm' | 'md' | 'lg'
  showButton?: boolean
  className?: string
  inputClassName?: string
  defaultQuery?: string
  autoFocus?: boolean
  buildHref?: (query: string) => string
  onSearchSubmit?: () => void
}

export function SearchField({
  placeholder = 'Search books, authors...',
  size = 'md',
  showButton = true,
  className,
  inputClassName,
  defaultQuery = '',
  autoFocus = false,
  buildHref,
  onSearchSubmit,
}: SearchFieldProps) {
  const [query, setQuery] = React.useState(defaultQuery)
  const router = useRouter()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = query.trim()
    if (!trimmed) return
    const href = buildHref ? buildHref(trimmed) : `/books?search=${encodeURIComponent(trimmed)}`
    router.push(href)
    onSearchSubmit?.()
  }

  const heightClass = size === 'lg' ? 'h-12 text-lg' : size === 'sm' ? 'h-9 text-sm' : 'h-10'
  const buttonSize = size === 'lg' ? 'lg' : size === 'sm' ? 'sm' : 'default'

  return (
    <form onSubmit={handleSubmit} className={cn('w-full', className)}>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className={cn('absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground', size === 'lg' ? 'h-5 w-5' : '')} />
          <Input
            type="text"
            placeholder={placeholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSubmit(e as unknown as React.FormEvent)
              }
            }}
            className={cn('pl-10', heightClass, inputClassName)}
            autoFocus={autoFocus}
          />
        </div>
        {showButton && (
          <Button type="submit" size={buttonSize} className={heightClass.replace('text-lg', '')}>
            Search
          </Button>
        )}
      </div>
    </form>
  )
}


