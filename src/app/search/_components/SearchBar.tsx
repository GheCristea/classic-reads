"use client"

import { SearchField } from "@/components/common/SearchField"

export function SearchBar() {
  return (
    <SearchField 
      placeholder="Search for books, authors, or subjects..."
      size="lg"
      showButton
      className="w-full"
    />
  )
}