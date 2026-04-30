// バックエンドAPIとやり取りするJSONの形をTypeScriptで定義したファイルです。
// Java側の DTO / Response と対応しています。
// Laravelでいうと、API Resourceの返却形式をフロント側でも型として持っているイメージです。

export type BookStatus =
  | 'WISHLIST'
  | 'PURCHASED'
  | 'READING'
  | 'FINISHED'
  | 'ON_HOLD'
  | 'DROPPED'
  | 'TSUNDOKU'

export type UserRole = 'USER' | 'ADMIN'

export type SourceName = 'OPENBD' | 'GOOGLE_BOOKS' | 'MANUAL'

export type ExternalBookSearchType = 'KEYWORD' | 'TITLE' | 'AUTHOR' | 'ISBN'

export const BOOK_STATUS_LABELS: Record<BookStatus, string> = {
  WISHLIST: '欲しい',
  PURCHASED: '購入済み',
  READING: '読書中',
  FINISHED: '読了',
  ON_HOLD: '保留',
  DROPPED: '中断',
  TSUNDOKU: '積読',
}

// ログイン中ユーザーの表示用情報です。
export interface MeResponse {
  id: number
  email: string
  displayName: string
  role: UserRole
}

// ログインAPIへ送るJSONです。
export interface LoginRequest {
  email: string
  password: string
}

// 新規登録APIへ送るJSONです。
export interface RegisterRequest {
  email: string
  password: string
  displayName: string
}

// ログイン・登録APIから返るJSONです。accessTokenがJWTです。
export interface LoginResponse {
  accessToken: string
  tokenType: string
  expiresIn: number
  user: MeResponse
}

// カテゴリ情報です。colorHexは #RRGGBB 形式の色です。
export interface Category {
  id: number
  name: string
  colorHex?: string | null
  sortOrder: number
}

// 本そのものの情報です。ユーザーごとの読書状態は含みません。
export interface BookMasterSummary {
  id?: number
  isbn13?: string | null
  isbn10?: string | null
  title: string
  subtitle?: string | null
  authors: string[]
  publisher?: string | null
  publishedDate?: string | null
  thumbnailUrl?: string | null
  sourcePrimary: SourceName
}

// 本一覧に表示する1冊分の情報です。
export interface BookListItem {
  id: number
  status: BookStatus
  rating?: number | null
  favoriteFlag: boolean
  purchaseDate?: string | null
  startDate?: string | null
  finishDate?: string | null
  updatedAt: string
  category?: Category | null
  bookMaster: BookMasterSummary
}

// 本詳細画面で使う情報です。一覧用情報にメモなどを足しています。
export interface UserBookDetail extends BookListItem {
  memo?: string | null
  locationNote?: string | null
  createdAt: string
  deletedAt?: string | null
}

export interface PaginationMeta {
  page: number
  size: number
  totalItems: number
  totalPages: number
}

export interface BookListResponse {
  items: BookListItem[]
  meta: PaginationMeta
}

export interface CreateBookRequest {
  isbn13?: string | null
  isbn10?: string | null
  title: string
  subtitle?: string | null
  authors?: string[]
  publisher?: string | null
  publishedDate?: string | null
  description?: string | null
  thumbnailUrl?: string | null
  status: BookStatus
  rating?: number | null
  favoriteFlag?: boolean
  memo?: string | null
  categoryId?: number | null
}

export interface ImportByIsbnRequest {
  isbn: string
  status: BookStatus
  memo?: string | null
  categoryId?: number | null
}

export interface UpdateBookRequest {
  status?: BookStatus
  rating?: number | null
  favoriteFlag?: boolean
  purchaseDate?: string | null
  startDate?: string | null
  finishDate?: string | null
  memo?: string | null
  locationNote?: string | null
  categoryId?: number | null
}

export interface UpdateStatusRequest {
  status: BookStatus
  startDate?: string | null
  finishDate?: string | null
}

export interface CreateCategoryRequest {
  name: string
  colorHex?: string | null
  sortOrder?: number
}

export interface UpdateCategoryRequest {
  name?: string
  colorHex?: string | null
  sortOrder?: number
}

export interface CategoryListResponse {
  items: Category[]
}

export interface IsbnLookupCandidate {
  isbn13: string
  isbn10?: string | null
  title: string
  subtitle?: string | null
  authors: string[]
  publisher?: string | null
  publishedDate?: string | null
  thumbnailUrl?: string | null
  description?: string | null
  sourceName: SourceName
  cacheHit: boolean
}

export interface IsbnLookupResponse {
  queryIsbn: string
  candidates: IsbnLookupCandidate[]
}

export interface ExternalBookSearchCandidate {
  isbn13?: string | null
  isbn10?: string | null
  title: string
  subtitle?: string | null
  authors: string[]
  publisher?: string | null
  publishedDate?: string | null
  thumbnailUrl?: string | null
  description?: string | null
  sourceName: SourceName
}

export interface ExternalBookSearchResponse {
  query: string
  type: ExternalBookSearchType
  candidates: ExternalBookSearchCandidate[]
}

export interface ApiError {
  code: string
  message: string
  requestId: string
  details?: string[]
}
