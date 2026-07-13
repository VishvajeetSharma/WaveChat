-- 001_init: users + 1-on-1 messages

CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  username      VARCHAR(32) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS messages (
  id          SERIAL PRIMARY KEY,
  sender_id   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  receiver_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body        TEXT NOT NULL,
  read_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Speeds up "conversation between A and B" lookups
CREATE INDEX IF NOT EXISTS idx_messages_pair
  ON messages (LEAST(sender_id, receiver_id), GREATEST(sender_id, receiver_id), created_at);

CREATE INDEX IF NOT EXISTS idx_messages_receiver_unread
  ON messages (receiver_id, read_at);
