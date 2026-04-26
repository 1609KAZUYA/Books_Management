import type { ExternalBookSearchCandidate, ExternalBookSearchType, SourceName } from '../types/api'

export async function searchNdlBooks(
  query: string,
  type: ExternalBookSearchType = 'KEYWORD',
  maxResults = 10,
) {
  const urls = toNdlUrls(query, type, maxResults)
  const results = new Map<string, ExternalBookSearchCandidate>()
  const fallbackIsbn = type === 'ISBN' ? normalizeIsbnParts(query) : null

  for (const url of urls) {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`NDL Search returned HTTP ${response.status}`)
    }
    const xml = new DOMParser().parseFromString(await response.text(), 'application/xml')
    const items = Array.from(xml.querySelectorAll('item'))
    for (const item of items) {
      const candidate = toCandidate(item, fallbackIsbn)
      if (!candidate) continue
      results.set(candidateKey(candidate), candidate)
      if (results.size >= maxResults) break
    }
    if (results.size >= maxResults) break
  }

  return [...results.values()].slice(0, maxResults)
}

function toNdlUrls(query: string, type: ExternalBookSearchType, maxResults: number) {
  const trimmed = query.trim()
  const params = new URLSearchParams({ cnt: String(maxResults) })
  const urls: string[] = []
  const base = '/external/ndl/api/opensearch'

  if (type === 'ISBN') {
    params.set('isbn', trimmed.replace(/[-\s]/g, ''))
    return [`${base}?${params.toString()}`]
  }
  if (type === 'TITLE') {
    const titleParams = new URLSearchParams(params)
    titleParams.set('title', trimmed)
    urls.push(`${base}?${titleParams.toString()}`)
  } else if (type === 'AUTHOR') {
    const authorParams = new URLSearchParams(params)
    authorParams.set('creator', trimmed)
    urls.push(`${base}?${authorParams.toString()}`)
  }

  const anyParams = new URLSearchParams(params)
  anyParams.set('any', trimmed)
  urls.push(`${base}?${anyParams.toString()}`)
  return urls
}

function toCandidate(item: Element, fallbackIsbn: NormalizedIsbn | null): ExternalBookSearchCandidate | null {
  const title = text(item, 'dc\\:title') || text(item, 'title')
  if (!title) return null

  const creators = Array.from(item.querySelectorAll('dc\\:creator'))
    .map((node) => node.textContent?.trim())
    .filter((value): value is string => Boolean(value))
  const fallbackAuthors = text(item, 'author')
    ?.split(',')
    .map((value) => value.trim())
    .filter(Boolean) ?? []

  const publisher = Array.from(item.querySelectorAll('dc\\:publisher'))
    .map((node) => node.textContent?.trim())
    .filter(Boolean)
    .join(' / ') || null
  const issued = text(item, 'dcterms\\:issued') || text(item, 'dc\\:date')
  const isbn = Array.from(item.querySelectorAll('dc\\:identifier'))
    .map((node) => node.textContent?.trim() ?? '')
    .find((value) => value.replace(/[-\s]/g, '').match(/^(97[89])?\d{9}[\dX]$/i))
  const normalizedIsbn = normalizeIsbnParts(isbn)

  return {
    isbn13: normalizedIsbn.isbn13 ?? fallbackIsbn?.isbn13 ?? null,
    isbn10: normalizedIsbn.isbn10 ?? fallbackIsbn?.isbn10 ?? null,
    title,
    subtitle: null,
    authors: creators.length > 0 ? creators : fallbackAuthors,
    publisher,
    publishedDate: normalizePublishedDate(issued),
    description: stripHtml(text(item, 'description')),
    thumbnailUrl: null,
    sourceName: 'GOOGLE_BOOKS' as SourceName,
  }
}

function text(item: Element, selector: string) {
  return item.querySelector(selector)?.textContent?.trim() ?? null
}

interface NormalizedIsbn {
  isbn13: string | null
  isbn10: string | null
}

function normalizeIsbnParts(value?: string | null): NormalizedIsbn {
  if (!value) return { isbn13: null, isbn10: null }
  const cleaned = value.replace(/[-\s]/g, '').toUpperCase()
  if (/^\d{13}$/.test(cleaned)) return { isbn13: cleaned, isbn10: null }
  if (/^\d{9}[\dX]$/.test(cleaned)) return { isbn13: isbn10To13(cleaned), isbn10: cleaned }
  return { isbn13: null, isbn10: null }
}

function isbn10To13(isbn10: string) {
  const body = `978${isbn10.slice(0, 9)}`
  let sum = 0
  for (let i = 0; i < body.length; i += 1) {
    sum += Number(body[i]) * (i % 2 === 0 ? 1 : 3)
  }
  const checkDigit = (10 - (sum % 10)) % 10
  return `${body}${checkDigit}`
}

function normalizePublishedDate(value?: string | null) {
  if (!value) return null
  const match = value.match(/\d{4}/)
  return match ? `${match[0]}-01-01` : null
}

function stripHtml(value?: string | null) {
  if (!value) return null
  return value.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()
}

function candidateKey(candidate: ExternalBookSearchCandidate) {
  if (candidate.isbn13) return `isbn13:${candidate.isbn13}`
  return `title:${candidate.title.toLowerCase()}:${candidate.authors.join(',').toLowerCase()}`
}
