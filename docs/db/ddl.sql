-- ============================================================
-- Books Memo / PostgreSQL DDL
-- Assumption: PostgreSQL 16+ / schema = app
-- ============================================================

CREATE SCHEMA IF NOT EXISTS app;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ------------------------------------------------------------
-- generic trigger for updated_at
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION app.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ------------------------------------------------------------
-- users
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS app.users (
    id               BIGSERIAL PRIMARY KEY,
    email            VARCHAR(255) NOT NULL,
    password_hash    VARCHAR(255) NOT NULL,
    display_name     VARCHAR(100) NOT NULL,
    role             VARCHAR(30)  NOT NULL DEFAULT 'USER'
                     CHECK (role IN ('USER', 'ADMIN')),
    is_active        BOOLEAN      NOT NULL DEFAULT TRUE,
    last_login_at    TIMESTAMPTZ  NULL,
    created_at       TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_users_email_lower
    ON app.users (LOWER(email));

CREATE TRIGGER trg_users_updated_at
BEFORE UPDATE ON app.users
FOR EACH ROW EXECUTE FUNCTION app.set_updated_at();

-- ------------------------------------------------------------
-- book_master
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS app.book_master (
    id                      BIGSERIAL PRIMARY KEY,
    isbn13                  CHAR(13) NULL
                            CHECK (isbn13 ~ '^[0-9]{13}$'),
    isbn10                  CHAR(10) NULL
                            CHECK (isbn10 ~ '^[0-9X]{10}$'),
    title                   VARCHAR(500) NOT NULL,
    subtitle                VARCHAR(500) NULL,
    authors_json            JSONB NULL,
    publisher               VARCHAR(255) NULL,
    published_date          DATE NULL,
    language_code           VARCHAR(10) NULL,
    page_count              INTEGER NULL CHECK (page_count IS NULL OR page_count >= 1),
    description             TEXT NULL,
    thumbnail_url           TEXT NULL,
    source_primary          VARCHAR(30) NOT NULL
                            CHECK (source_primary IN ('OPENBD', 'GOOGLE_BOOKS', 'MANUAL')),
    source_last_fetched_at  TIMESTAMPTZ NULL,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_book_master_isbn13
    ON app.book_master (isbn13)
    WHERE isbn13 IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_book_master_title_trgm
    ON app.book_master USING GIN (title gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_book_master_publisher_trgm
    ON app.book_master USING GIN (publisher gin_trgm_ops);

CREATE TRIGGER trg_book_master_updated_at
BEFORE UPDATE ON app.book_master
FOR EACH ROW EXECUTE FUNCTION app.set_updated_at();

-- ------------------------------------------------------------
-- categories
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS app.categories (
    id               BIGSERIAL PRIMARY KEY,
    user_id          BIGINT NOT NULL REFERENCES app.users(id),
    name             VARCHAR(50) NOT NULL,
    color_hex        CHAR(7) NULL CHECK (color_hex IS NULL OR color_hex ~ '^#[0-9A-Fa-f]{6}$'),
    sort_order       INTEGER NOT NULL DEFAULT 0,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_categories_user_name
    ON app.categories (user_id, name);

CREATE INDEX IF NOT EXISTS idx_categories_user_sort
    ON app.categories (user_id, sort_order, id);

CREATE TRIGGER trg_categories_updated_at
BEFORE UPDATE ON app.categories
FOR EACH ROW EXECUTE FUNCTION app.set_updated_at();

-- ------------------------------------------------------------
-- user_book
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS app.user_book (
    id               BIGSERIAL PRIMARY KEY,
    user_id          BIGINT NOT NULL REFERENCES app.users(id),
    book_master_id   BIGINT NOT NULL REFERENCES app.book_master(id),
    category_id      BIGINT NULL REFERENCES app.categories(id) ON DELETE SET NULL,
    status           VARCHAR(30) NOT NULL
                     CHECK (status IN ('WISHLIST', 'PURCHASED', 'READING', 'FINISHED', 'ON_HOLD', 'DROPPED', 'TSUNDOKU')),
    rating           NUMERIC(2,1) NULL
                     CHECK (rating IS NULL OR (rating >= 0.5 AND rating <= 5.0 AND MOD((rating * 10)::INTEGER, 5) = 0)),
    favorite_flag    BOOLEAN NOT NULL DEFAULT FALSE,
    purchase_date    DATE NULL,
    start_date       DATE NULL,
    finish_date      DATE NULL,
    memo             TEXT NULL,
    location_note    VARCHAR(255) NULL,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at       TIMESTAMPTZ NULL,
    CONSTRAINT chk_user_book_dates
        CHECK (finish_date IS NULL OR start_date IS NULL OR finish_date >= start_date)
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_user_book_active
    ON app.user_book (user_id, book_master_id)
    WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_user_book_user_status_updated
    ON app.user_book (user_id, status, updated_at DESC)
    WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_user_book_user_rating
    ON app.user_book (user_id, rating DESC)
    WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_user_book_user_dates
    ON app.user_book (user_id, start_date, finish_date)
    WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_user_book_category
    ON app.user_book (user_id, category_id, updated_at DESC)
    WHERE deleted_at IS NULL;

CREATE TRIGGER trg_user_book_updated_at
BEFORE UPDATE ON app.user_book
FOR EACH ROW EXECUTE FUNCTION app.set_updated_at();

-- ------------------------------------------------------------
-- isbn_lookup_cache
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS app.isbn_lookup_cache (
    id                        BIGSERIAL PRIMARY KEY,
    isbn13                    CHAR(13) NOT NULL CHECK (isbn13 ~ '^[0-9]{13}$'),
    source_name               VARCHAR(30) NOT NULL
                              CHECK (source_name IN ('OPENBD', 'GOOGLE_BOOKS', 'RAKUTEN')),
    http_status               INTEGER NOT NULL,
    response_json             JSONB NULL,
    normalized_payload_json   JSONB NULL,
    fetched_at                TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at                TIMESTAMPTZ NOT NULL,
    hit_count                 INTEGER NOT NULL DEFAULT 1
                              CHECK (hit_count >= 1)
);

CREATE INDEX IF NOT EXISTS idx_isbn_cache_lookup
    ON app.isbn_lookup_cache (isbn13, source_name, expires_at DESC);

CREATE INDEX IF NOT EXISTS idx_isbn_cache_fetched_at
    ON app.isbn_lookup_cache (fetched_at DESC);

-- ------------------------------------------------------------
-- activity_log
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS app.activity_log (
    id               BIGSERIAL PRIMARY KEY,
    user_id          BIGINT NULL REFERENCES app.users(id),
    action_type      VARCHAR(50) NOT NULL,
    target_type      VARCHAR(50) NOT NULL,
    target_id        BIGINT NULL,
    request_id       VARCHAR(64) NOT NULL,
    detail_json      JSONB NULL,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_activity_log_request_id
    ON app.activity_log (request_id);

CREATE INDEX IF NOT EXISTS idx_activity_log_user_created
    ON app.activity_log (user_id, created_at DESC);

-- ------------------------------------------------------------
-- optional seed example
-- ------------------------------------------------------------
-- INSERT INTO app.users(email, password_hash, display_name)
-- VALUES ('demo@example.com', '$2a$10$replace_me', 'Demo User');
