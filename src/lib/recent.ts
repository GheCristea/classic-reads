// Utilities for storing and retrieving recently viewed books on a device

export interface RecentBook {
  id: number
  title: string
  author: string
  coverUrl: string | null
  viewedAt: number
}

const STORAGE_KEY = "recent_books_v1"
const MAX_ITEMS = 5

function safeParse(json: string | null): RecentBook[] {
  if (!json) return []
  try {
    const parsed = JSON.parse(json) as RecentBook[]
    if (!Array.isArray(parsed)) return []
    return parsed.filter((b) => typeof b?.id === "number" && typeof b?.title === "string")
  } catch {
    return []
  }
}

export function getRecentBooks(): RecentBook[] {
  if (typeof window === "undefined") return []
  const raw = window.localStorage.getItem(STORAGE_KEY)
  return safeParse(raw)
}

export function addRecentBook(book: { id: number; title: string; author: string; coverUrl: string | null }): void {
  if (typeof window === "undefined") return
  const existing = getRecentBooks()
  const withoutDup = existing.filter((b) => b.id !== book.id)
  const updated: RecentBook[] = [
    { ...book, viewedAt: Date.now() },
    ...withoutDup,
  ].slice(0, MAX_ITEMS)
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  // Notify other listeners on the page to refresh if needed
  window.dispatchEvent(new StorageEvent("storage", { key: STORAGE_KEY, newValue: JSON.stringify(updated) }))
}


