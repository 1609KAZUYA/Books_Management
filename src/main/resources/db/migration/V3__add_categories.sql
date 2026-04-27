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

ALTER TABLE app.user_book
    ADD COLUMN IF NOT EXISTS category_id BIGINT NULL REFERENCES app.categories(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_user_book_category
    ON app.user_book (user_id, category_id, updated_at DESC)
    WHERE deleted_at IS NULL;
