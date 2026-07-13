import { initials, formatContactTimestamp } from "../../../shared/utils/date.js";

export default function ContactList({ contacts, activeId, onSelect, onlineIds }) {
  if (contacts.length === 0) {
    return (
      <div className="empty-contacts">
        No other users yet. Once someone else creates an account, they'll show up
        here.
      </div>
    );
  }

  return (
    <div className="contact-list">
      {contacts.map((c) => {
        const online = onlineIds.has(c.id);
        const preview = c.last_message_body
          ? `${c.last_message_sender_id !== c.id ? "You: " : ""}${c.last_message_body}`
          : "No messages yet";
        return (
          <div
            key={c.id}
            className={`contact${activeId === c.id ? " active" : ""}`}
            onClick={() => onSelect(c.id)}
          >
            <div className="avatar">
              {initials(c.username)}
              <span className={`seal${online ? " online" : ""}`} />
            </div>
            <div className="contact-info">
              <div className="contact-name-row">
                <span className="contact-name">{c.username}</span>
                <span className="contact-time">
                  {formatContactTimestamp(c.last_message_at)}
                </span>
              </div>
              <div className="contact-preview">{preview}</div>
            </div>
            {c.unread_count > 0 && (
              <span className="unread-badge">{c.unread_count}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
