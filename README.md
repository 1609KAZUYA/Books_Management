# Books Memo

個人向け読書トラッカーアプリ。Spring Boot (Java 21) バックエンド + Vite/React/TypeScript フロントエンドの構成。

## 構成

```
BookManagement/
├── src/                  # Spring Boot バックエンド (ポート 8080)
├── frontend/             # Vite + React + TypeScript (ポート 5173)
├── docker-compose.yml    # PostgreSQL 16
└── docs/api/openapi.yaml # OpenAPI 仕様
```

## 起動手順

### 前提

- Docker Desktop
- Java 21 + Maven
- Node.js 18-22

### 1. PostgreSQL 起動

```bash
docker compose up -d
```

### 2. バックエンド起動

```bash
mvn spring-boot:run
```

API: `http://localhost:8080/api/v1`

### 3. フロントエンド起動（別ターミナル）

```bash
cd frontend
npm install   # 初回のみ
npm run dev
```

UI: `http://localhost:5173`

### デモアカウント

| 項目 | 値 |
|---|---|
| メールアドレス | demo@example.com |
| パスワード | demo1234 |

> 初回起動時にデモユーザーのパスワードが自動でセットされます。

---

## 主な API エンドポイント

| Method | Path | 説明 |
|---|---|---|
| POST | `/api/v1/auth/login` | ログイン（JWT 発行） |
| POST | `/api/v1/auth/register` | ユーザー登録（JWT 発行） |
| GET | `/api/v1/me` | 現在のユーザー情報 |
| GET | `/api/v1/books` | 本一覧（検索・フィルター・ページング） |
| POST | `/api/v1/books` | 手動で本を追加 |
| POST | `/api/v1/books/import-by-isbn` | ISBN で本を追加 |
| GET | `/api/v1/isbn/{isbn}` | ISBN 検索（追加なし） |
| GET/POST | `/api/v1/categories` | カテゴリー一覧・追加 |
| PATCH/DELETE | `/api/v1/categories/{categoryId}` | カテゴリー更新・削除 |

## 環境変数（デフォルト値あり）

| 変数名 | デフォルト | 説明 |
|---|---|---|
| `DB_URL` | `jdbc:postgresql://localhost:5432/book_management` | PostgreSQL 接続先 |
| `DB_USER` | `book_user` | DB ユーザー |
| `DB_PASSWORD` | `book_pass` | DB パスワード |
| `JWT_SECRET` | （開発用デフォルト値） | JWT 署名キー（本番では必ず変更） |
| `JWT_EXPIRY_SECONDS` | `86400` | トークン有効期限（秒） |
| `OPENBD_URL` | `https://api.openbd.jp/v1/get` | OpenBD API |
| `GOOGLE_BOOKS_URL` | `https://www.googleapis.com/books/v1/volumes` | Google Books API |
| `ISBN_CACHE_TTL` | `P7D` | ISBN キャッシュ TTL |
