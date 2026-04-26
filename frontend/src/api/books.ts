import apiClient from './client'
import { enrichBookCovers } from './coverLookup'
import { searchGoogleBooks } from './googleBooks'
import { searchNdlBooks } from './ndlSearch'
import type {
  BookListResponse,
  BookStatus,
  CreateBookRequest,
  ExternalBookSearchResponse,
  ExternalBookSearchType,
  ImportByIsbnRequest,
  UpdateBookRequest,
  UpdateStatusRequest,
  UserBookDetail,
} from '../types/api'

export interface SearchBooksParams {
  keyword?: string
  status?: BookStatus
  tagId?: number
  favorite?: boolean
  sort?: string
  page?: number
  size?: number
}

export const searchBooks = (params: SearchBooksParams) =>
  apiClient.get<BookListResponse>('/books', { params }).then((r) => r.data)

export const searchExternalBooks = (query: string, type: ExternalBookSearchType, maxResults = 10) =>
  apiClient
    .get<ExternalBookSearchResponse>('/books/external-search', { params: { query, type, maxResults } })
    .then(async (r) => {
      if (r.data.candidates.length > 0) {
        return { ...r.data, candidates: await enrichBookCovers(r.data.candidates) }
      }
      const candidates = await searchBrowserProviders(query, type, maxResults)
      return { ...r.data, candidates }
    })
    .catch(async () => ({
      query,
      type,
      candidates: await searchBrowserProviders(query, type, maxResults),
    }))

async function searchBrowserProviders(query: string, type: ExternalBookSearchType, maxResults: number) {
  const ndlResults = await searchNdlBooks(query, type, maxResults)
  if (ndlResults.length > 0) return enrichBookCovers(ndlResults)
  return enrichBookCovers(await searchGoogleBooks(query, type, maxResults))
}

export const getBook = (id: number) =>
  apiClient.get<UserBookDetail>(`/books/${id}`).then((r) => r.data)

export const createBook = (data: CreateBookRequest) =>
  apiClient.post<UserBookDetail>('/books', data).then((r) => r.data)

export const importByIsbn = (data: ImportByIsbnRequest) =>
  apiClient.post<UserBookDetail>('/books/import-by-isbn', data).then((r) => r.data)

export const updateBook = (id: number, data: UpdateBookRequest) =>
  apiClient.patch<UserBookDetail>(`/books/${id}`, data).then((r) => r.data)

export const updateStatus = (id: number, data: UpdateStatusRequest) =>
  apiClient.patch<UserBookDetail>(`/books/${id}/status`, data).then((r) => r.data)

export const deleteBook = (id: number) =>
  apiClient.delete(`/books/${id}`)
