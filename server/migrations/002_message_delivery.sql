-- 002_message_delivery: WhatsApp-style delivery receipts
--   sent      -> row exists in messages            (single tick)
--   delivered -> delivered_at IS NOT NULL          (double tick)
--   seen      -> read_at IS NOT NULL               (double blue tick)

ALTER TABLE messages ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ;

-- Anything already read was obviously delivered. Unread legacy messages are
-- left NULL on purpose: they flip to "delivered" the next time the receiver
-- connects, which is the correct meaning.
UPDATE messages
   SET delivered_at = read_at
 WHERE delivered_at IS NULL AND read_at IS NOT NULL;

-- Fast lookup of "what is still waiting to be delivered to this user"
CREATE INDEX IF NOT EXISTS idx_messages_receiver_undelivered
  ON messages (receiver_id)
  WHERE delivered_at IS NULL;
