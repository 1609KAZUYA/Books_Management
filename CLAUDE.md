# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Start PostgreSQL (required before running the app)
docker compose up -d

# Run the application
mvn spring-boot:run

# Build
mvn clean install

# Run all tests
mvn test

# Run a single test class
mvn test -Dtest=ClassName

# Run a single test method
mvn test -Dtest=ClassName#methodName
```

The API is available at `http://localhost:8080/api/v1`. The OpenAPI spec is served at `http://localhost:8080/docs/api/openapi.yaml`.

## Architecture

**Spring Boot 3.4.4 / Java 21 / PostgreSQL 16** REST API backend for "Books Memo" — a personal reading tracker.

### Layered structure

```
controller/  → HTTP handlers, request validation
service/     → Business logic (book/, isbn/, auth/, tag/, user/)
repository/  → Spring Data JPA repositories
domain/      → JPA entities (entity/) and enums
dto/         → API request/response objects (separated by domain)
common/      → Exception hierarchy, filters, REST client config
```

### Authentication (current MVP)

Authentication is **header-based for development**: callers pass `X-User-Id`. JWT is planned for a future phase. `UserContextService` resolves the current user from this header.

### ISBN lookup flow

`IsbnLookupService` queries providers in order: **OpenBD → Google Books**. Both implement `IsbnProvider` and normalize to `BookMetadata`. Responses are cached in the `isbn_lookup_cache` table with a configurable TTL (`ISBN_CACHE_TTL`, default 7 days, ISO-8601 duration).

### Database schema

All tables live in the `app` schema. Flyway manages migrations (`src/main/resources/db/migration/`). Key tables:
- `book_master` — shared bibliographic catalog (denormalized, `authors_json` is JSONB)
- `user_book` — user's personal copy of a book with status, rating, memo, soft-delete via `deleted_at`
- `tags` / `user_book_tag` — user-defined tags (many-to-many)
- `isbn_lookup_cache` — API response cache
- `activity_log` — audit trail keyed by `request_id`

`BookStatus` enum: `WISHLIST, PURCHASED, READING, FINISHED, ON_HOLD, DROPPED, TSUNDOKU`

### Error handling

All exceptions extend `ApiException` (carries `HttpStatus`, error code, message, details). `GlobalExceptionHandler` converts them to a uniform `ApiErrorResponse`. Specialized subtypes: `NotFoundException`, `UnauthorizedException`, `ValidationException`, `DuplicateException`, `ExternalDependencyException`.

### Configuration

`AppProperties` is the centralized config bean. Key environment variables (all have defaults):

| Variable | Default | Purpose |
|---|---|---|
| `DB_URL` | localhost:5432/bookmanagement | PostgreSQL connection |
| `DB_USER` / `DB_PASSWORD` | `book_user` / `book_pass` | DB credentials |
| `DEFAULT_USER_EMAIL` | `demo@example.com` | Demo user for dev |
| `OPENBD_URL` | `https://api.openbd.jp` | Japanese book API |
| `GOOGLE_BOOKS_URL` | `https://www.googleapis.com` | Google Books API |
| `ISBN_CACHE_TTL` | `P7D` | Cache TTL (ISO-8601) |
| `SERVER_PORT` | `8080` | Server port |
