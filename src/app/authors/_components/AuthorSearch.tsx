"use client"

import { SearchField } from "@/components/common/SearchField"

function toSlug(name: string): string {
  return encodeURIComponent(
    name
      .trim()
      .toLowerCase()
      .replace(/['’]/g, '')
      .replace(/\s+/g, '-')
  )
}

export function AuthorSearch() {
  return (
    <SearchField
      placeholder="Search authors..."
      size="lg"
      showButton
      buildHref={(q) => `/authors/${toSlug(q)}`}
    />
  )
}


