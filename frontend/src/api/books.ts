import apiClient from './client'
import { enrichBookCovers } from './coverLookup'
import { searchGoogleBooks } from './googleBooks'
import { searchNdlBooks } from './ndlSearch'
import type {
  BookListResponse,
  BookStatus,
  CreateBookRequest,
  ExternalBookSearchCandidate,
  ExternalBookSearchResponse,
  ExternalBookSearchType,
  ImportByIsbnRequest,
  UpdateBookRequest,
  UpdateStatusRequest,
  UserBookDetail,
} from '../types/api'

// 本関連APIを呼ぶ関数をまとめたファイルです。
// Laravelでいうと、フロント側に置いた小さなAPIクライアント層です。

export interface SearchBooksParams {
  keyword?: string
  status?: BookStatus
  categoryId?: number
  uncategorized?: boolean
  favorite?: boolean
  sort?: string
  page?: number
  size?: number
}

export const searchBooks = (params: SearchBooksParams) =>
  // GET /books に検索条件をquery parameterとして渡します。
  apiClient.get<BookListResponse>('/books', { params }).then((r) => r.data)

export const searchExternalBooks = (query: string, type: ExternalBookSearchType, maxResults = 10, startIndex = 0) =>
  // まずブラウザから直接使える外部APIを試し、失敗したらバックエンド経由の検索へ fallback します。
  searchBrowserProviders(query, type, maxResults, startIndex)
    .then(async (browserCandidates) => {
      if (browserCandidates.length > 0) {
        return { query, type, candidates: browserCandidates }
      }
      return apiClient
        .get<ExternalBookSearchResponse>('/books/external-search', { params: { query, type, maxResults, startIndex } })
        .then(async (r) => ({ ...r.data, candidates: await enrichBookCovers(withQueryIsbnFallback(r.data.candidates, query)) }))
    })
    .catch(() =>
      apiClient
        .get<ExternalBookSearchResponse>('/books/external-search', { params: { query, type, maxResults, startIndex } })
        .then(async (r) => ({ ...r.data, candidates: await enrichBookCovers(withQueryIsbnFallback(r.data.candidates, query)) })),
    )

async function searchBrowserProviders(
  query: string,
  type: ExternalBookSearchType,
  maxResults: number,
  startIndex: number,
) {
  // NDL Searchを優先し、結果がなければGoogle Booksを試します。
  const ndlResults = await searchNdlBooks(query, type, maxResults, startIndex).catch(() => [])
  if (ndlResults.length > 0) return enrichBookCovers(withQueryIsbnFallback(ndlResults, query))
  return enrichBookCovers(
    withQueryIsbnFallback(await searchGoogleBooks(query, type, maxResults, startIndex).catch(() => []), query),
  )
}

function withQueryIsbnFallback<T extends ExternalBookSearchCandidate>(candidates: T[], query: string): T[] {
  // ISBNで検索した時、外部APIの結果にISBNが欠ける場合があるため、検索語から補完します。
  const fallback = normalizeIsbnParts(query)
  if (!fallback.isbn13 && !fallback.isbn10) return candidates
  return candidates.map((candidate) => ({
    ...candidate,
    isbn13: candidate.isbn13 ?? fallback.isbn13,
    isbn10: candidate.isbn10 ?? fallback.isbn10,
  }))
}

function normalizeIsbnParts(value: string) {
  // ハイフンや空白を取り除き、ISBN10/13として扱えるか判定します。
  const cleaned = value.replace(/[-\s]/g, '').toUpperCase()
  if (/^\d{13}$/.test(cleaned)) return { isbn13: cleaned, isbn10: null }
  if (/^\d{9}[\dX]$/.test(cleaned)) return { isbn13: isbn10To13(cleaned), isbn10: cleaned }
  return { isbn13: null, isbn10: null }
}

function isbn10To13(isbn10: string) {
  // ISBN10をISBN13に変換するためのチェックデジット計算です。
  const body = `978${isbn10.slice(0, 9)}`
  let sum = 0
  for (let i = 0; i < body.length; i += 1) {
    sum += Number(body[i]) * (i % 2 === 0 ? 1 : 3)
  }
  const checkDigit = (10 - (sum % 10)) % 10
  return `${body}${checkDigit}`
}

export const getBook = (id: number) =>
  // 本の詳細を1件取得します。
  apiClient.get<UserBookDetail>(`/books/${id}`).then((r) => r.data)

export const createBook = (data: CreateBookRequest) =>
  // 手入力で本を追加します。
  apiClient.post<UserBookDetail>('/books', data).then((r) => r.data)

export const importByIsbn = (data: ImportByIsbnRequest) =>
  // ISBNから本を検索して追加します。
  apiClient.post<UserBookDetail>('/books/import-by-isbn', data).then((r) => r.data)

export const updateBook = (id: number, data: UpdateBookRequest) =>
  // 本の詳細情報を更新します。
  apiClient.patch<UserBookDetail>(`/books/${id}`, data).then((r) => r.data)

export const updateStatus = (id: number, data: UpdateStatusRequest) =>
  // ステータスだけを更新します。
  apiClient.patch<UserBookDetail>(`/books/${id}/status`, data).then((r) => r.data)

export const deleteBook = (id: number) =>
  // 本棚から削除します。バックエンド側ではソフトデリートです。
  apiClient.delete(`/books/${id}`)
