import pool from "../../config/db.js";

export const usersRepository = {
  async findByUsername(username) {
    const { rows } = await pool.query(
      "SELECT id, username, password_hash, created_at FROM users WHERE username = $1",
      [username]
    );
    return rows[0] || null;
  },

  async findById(id) {
    const { rows } = await pool.query(
      "SELECT id, username, created_at, last_seen_at FROM users WHERE id = $1",
      [id]
    );
    return rows[0] || null;
  },

  async create({ username, passwordHash }) {
    const { rows } = await pool.query(
      `INSERT INTO users (username, password_hash)
       VALUES ($1, $2)
       RETURNING id, username, created_at`,
      [username, passwordHash]
    );
    return rows[0];
  },

  async touchLastSeen(id) {
    await pool.query("UPDATE users SET last_seen_at = now() WHERE id = $1", [id]);
  },

  /**
   * All users except `excludeId`, each enriched with their most recent
   * message with the current user and an unread count — everything the
   * sidebar contact list needs in one query.
   */
  async listForSidebar(excludeId) {
    const { rows } = await pool.query(
      `SELECT
         u.id,
         u.username,
         u.last_seen_at,
         lm.id           AS last_message_id,
         lm.body         AS last_message_body,
         lm.created_at   AS last_message_at,
         lm.sender_id    AS last_message_sender_id,
         lm.delivered_at AS last_message_delivered_at,
         lm.read_at      AS last_message_read_at,
         COALESCE(unread.count, 0) AS unread_count
       FROM users u
       LEFT JOIN LATERAL (
         SELECT id, body, created_at, sender_id, delivered_at, read_at
         FROM messages
         WHERE (sender_id = u.id AND receiver_id = $1)
            OR (sender_id = $1 AND receiver_id = u.id)
         ORDER BY created_at DESC
         LIMIT 1
       ) lm ON true
       LEFT JOIN LATERAL (
         SELECT COUNT(*)::int AS count
         FROM messages
         WHERE sender_id = u.id AND receiver_id = $1 AND read_at IS NULL
       ) unread ON true
       WHERE u.id != $1
       ORDER BY lm.created_at DESC NULLS LAST, u.username ASC`,
      [excludeId]
    );
    return rows;
  },
};

export default usersRepository;
