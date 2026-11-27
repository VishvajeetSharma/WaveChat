import pool from "../../config/db.js";

const MESSAGE_COLUMNS = "id, sender_id, receiver_id, body, delivered_at, read_at, created_at";

export const messagesRepository = {
  async findConversation({ userAId, userBId, before, limit }) {
    const params = [userAId, userBId];
    // The pair condition is wrapped in its own parentheses so the optional
    // `created_at < before` filter applies to BOTH directions of the chat.
    let query = `
      SELECT ${MESSAGE_COLUMNS}
      FROM messages
      WHERE ((sender_id = $1 AND receiver_id = $2)
          OR (sender_id = $2 AND receiver_id = $1))`;

    if (before) {
      params.push(before);
      query += ` AND created_at < $${params.length}`;
    }

    params.push(limit);
    query += ` ORDER BY created_at DESC LIMIT $${params.length}`;

    const { rows } = await pool.query(query, params);
    return rows.reverse();
  },

  /**
   * Marks everything `senderId` sent to `receiverId` as seen.
   * Also back-fills delivered_at (you cannot see what was never delivered).
   * Returns the rows that actually changed so the caller can notify the sender.
   */
  async markRead({ senderId, receiverId }) {
    const { rows } = await pool.query(
      `UPDATE messages
          SET read_at = now(),
              delivered_at = COALESCE(delivered_at, now())
        WHERE sender_id = $1 AND receiver_id = $2 AND read_at IS NULL
        RETURNING id, read_at`,
      [senderId, receiverId]
    );
    return rows;
  },

  /** Marks one message delivered (receiver is online right now). */
  async markDelivered(id) {
    const { rows } = await pool.query(
      `UPDATE messages
          SET delivered_at = COALESCE(delivered_at, now())
        WHERE id = $1
        RETURNING ${MESSAGE_COLUMNS}`,
      [id]
    );
    return rows[0] || null;
  },

  /**
   * Called when a user connects: everything that was waiting for them is now
   * delivered. Returns { id, sender_id, delivered_at } for each changed row.
   */
  async markAllDelivered(receiverId) {
    const { rows } = await pool.query(
      `UPDATE messages
          SET delivered_at = now()
        WHERE receiver_id = $1 AND delivered_at IS NULL
        RETURNING id, sender_id, delivered_at`,
      [receiverId]
    );
    return rows;
  },

  async create({ senderId, receiverId, body }) {
    const { rows } = await pool.query(
      `INSERT INTO messages (sender_id, receiver_id, body)
       VALUES ($1, $2, $3)
       RETURNING ${MESSAGE_COLUMNS}`,
      [senderId, receiverId, body]
    );
    return rows[0];
  },
};

export default messagesRepository;
