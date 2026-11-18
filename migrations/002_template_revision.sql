-- PostgreSQL: additive optimistic concurrency revision for all template mutations.
ALTER TABLE card_templates ADD COLUMN IF NOT EXISTS revision INTEGER NOT NULL DEFAULT 1;
