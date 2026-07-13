import pool from "../../config/db.js";

export const messagesRepository = {
  async findConversation({ userAId, userBId, before, limit }) {
    const params = [userAId, userBId];
    let query = `
      SELECT id, sender_id, receiver_id, body, read_at, created_at
      FROM messages
      WHERE (sender_id = $1 AND receiver_id = $2)
         OR (sender_id = $2 AND receiver_id = $1)`;

    if (before) {
      params.push(before);
      query += ` AND created_at < $${params.length}`;
    }

    params.push(limit);
    query += ` ORDER BY created_at DESC LIMIT $${params.length}`;

    const { rows } = await pool.query(query, params);
    return rows.reverse();
  },

  async markRead({ senderId, receiverId }) {
    await pool.query(
      `UPDATE messages SET read_at = now()
       WHERE sender_id = $1 AND receiver_id = $2 AND read_at IS NULL`,
      [senderId, receiverId]
    );
  },

  async create({ senderId, receiverId, body }) {
    const { rows } = await pool.query(
      `INSERT INTO messages (sender_id, receiver_id, body)
       VALUES ($1, $2, $3)
       RETURNING id, sender_id, receiver_id, body, read_at, created_at`,
      [senderId, receiverId, body]
    );
    return rows[0];
  },
};

export default messagesRepository;
