import type { ExternalBookSearchCandidate } from '../types/api'

interface OpenBdResponse {
  summary?: {
    cover?: string
  }
}

interface OpenLibrarySearchResponse {
  docs?: {
    cover_i?: number
    isbn?: string[]
    title?: string
  }[]
}

interface GoogleBooksResponse {
  items?: {
    volumeInfo?: {
      imageLinks?: {
        thumbnail?: string
        smallThumbnail?: string
      }
    }
  }[]
}

export async function enrichBookCovers<T extends ExternalBookSearchCandidate>(candidates: T[]) {
  return Promise.all(candidates.map(enrichBookCover))
}

async function enrichBookCover<T extends ExternalBookSearchCandidate>(candidate: T): Promise<T> {
  if (candidate.thumbnailUrl) return candidate

  const isbn = candidate.isbn13 ?? candidate.isbn10
  const coverUrl = isbn
    ? await firstCover([
        () => lookupOpenBdCover(isbn),
        () => lookupBooksOrJpCover(isbn),
        () => lookupGoogleCover(`isbn:${isbn.replace(/[-\s]/g, '')}`),
        () => lookupOpenLibraryCoverByIsbn(isbn),
        () => lookupGoogleCover(candidate.title),
        () => lookupOpenLibraryCoverByTitle(candidate.title),
      ])
    : await firstCover([
        () => lookupGoogleCover(candidate.title),
        () => lookupOpenLibraryCoverByTitle(candidate.title),
      ])

  return coverUrl ? { ...candidate, thumbnailUrl: coverUrl } : candidate
}

async function firstCover(lookups: (() => Promise<string | null>)[]) {
  for (const lookup of lookups) {
    const value = await lookup()
    if (value) return value
  }
  return null
}

async function lookupOpenBdCover(isbn: string) {
  const response = await fetch(`/external/openbd/v1/get?isbn=${encodeURIComponent(isbn.replace(/[-\s]/g, ''))}`)
  if (!response.ok) return null
  const data = (await response.json()) as (OpenBdResponse | null)[]
  return data[0]?.summary?.cover || null
}

async function lookupBooksOrJpCover(isbn: string) {
  const cleaned = isbn.replace(/[-\s]/g, '')
  if (!/^\d{13}$/.test(cleaned)) return null

  const url = `/external/books-image/${encodeURIComponent(cleaned)}.jpg`
  return (await imageExists(url)) ? url : null
}

async function lookupOpenLibraryCoverByIsbn(isbn: string) {
  const cleaned = isbn.replace(/[-\s]/g, '')
  const url = `/external/openlibrary/covers/b/isbn/${encodeURIComponent(cleaned)}-M.jpg?default=false`
  return (await imageExists(url)) ? url : null
}

async function lookupOpenLibraryCoverByTitle(title: string) {
  const params = new URLSearchParams({ title, limit: '3' })
  const response = await fetch(`/external/openlibrary/search.json?${params.toString()}`)
  if (!response.ok) return null
  const data = (await response.json()) as OpenLibrarySearchResponse
  const coverId = data.docs?.find((doc) => doc.cover_i)?.cover_i
  return coverId ? `/external/openlibrary/covers/b/id/${coverId}-M.jpg` : null
}

async function lookupGoogleCover(query: string) {
  const params = new URLSearchParams({ q: query, maxResults: '1' })
  const response = await fetch(`/external/google/books/v1/volumes?${params.toString()}`)
  if (!response.ok) return null
  const data = (await response.json()) as GoogleBooksResponse
  const links = data.items?.[0]?.volumeInfo?.imageLinks
  return links?.thumbnail ?? links?.smallThumbnail ?? null
}

async function imageExists(url: string) {
  try {
    const response = await fetch(url, { method: 'HEAD' })
    return response.ok
  } catch {
    return false
  }
}
