INSERT INTO app.users (email, password_hash, display_name, role, is_active)
SELECT 'demo@example.com', 'dev-password-placeholder', 'Demo User', 'USER', TRUE
WHERE NOT EXISTS (
    SELECT 1 FROM app.users WHERE LOWER(email) = LOWER('demo@example.com')
);
