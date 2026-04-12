# Book Management (Java / Spring Boot)

Excel/PDF の設計書をもとに、Books Memo のバックエンド土台を作成したリポジトリです。

## 1. 構成

- `src/main/resources/db/migration/V1__init_schema.sql`: 設計書準拠 DDL
- `docs/api/openapi.yaml`: 設計書準拠 OpenAPI
- `src/main/java/com/bookmanagement`: Spring Boot API 実装

主なAPI:

- `POST /api/v1/auth/login`
- `GET /api/v1/me`
- `GET /api/v1/books`
- `POST /api/v1/books`
- `POST /api/v1/books/import-by-isbn`
- `GET /api/v1/isbn/{isbn}`
- `GET/POST/PATCH/DELETE /api/v1/tags...`

## 2. 起動手順

1. PostgreSQL 起動

```bash
docker compose up -d
```

2. Java アプリ起動

```bash
mvn spring-boot:run
```

## 3. 環境変数

- `DB_URL` (default: `jdbc:postgresql://localhost:5432/book_management`)
- `DB_USER` (default: `book_user`)
- `DB_PASSWORD` (default: `book_pass`)
- `DEFAULT_USER_EMAIL` (default: `demo@example.com`)
- `OPENBD_URL` (default: `https://openbd.jp/get`)
- `GOOGLE_BOOKS_URL` (default: `https://www.googleapis.com/books/v1/volumes`)
- `ISBN_CACHE_TTL` (default: `P7D`)

## 4. 備考

- 本実装は MVP 開発開始用のベースです。
- 認証は開発向け簡易実装です（設計書どおりの JWT 本実装は次フェーズで拡張可能）。
- ISBN 取得は `openBD -> Google Books fallback` を実装済みです。
# Books_Management
