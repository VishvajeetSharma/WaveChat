import { formatContactTimestamp } from "../../../shared/utils/date.js";
import Avatar from "../../../shared/components/Avatar.jsx";
import MessageStatus, { getMessageStatus } from "./MessageStatus.jsx";

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
        const hasMessage = Boolean(c.last_message_body);
        const lastIsMine = hasMessage && c.last_message_sender_id !== c.id;
        const unread = c.unread_count > 0;

        return (
          <div
            key={c.id}
            className={`contact${activeId === c.id ? " active" : ""}${unread ? " has-unread" : ""}`}
            onClick={() => onSelect(c.id)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelect(c.id);
              }
            }}
          >
            <Avatar name={c.username} online={online} />
            <div className="contact-info">
              <div className="contact-name-row">
                <span className="contact-name">{c.username}</span>
                <span className="contact-time">
                  {formatContactTimestamp(c.last_message_at)}
                </span>
              </div>
              <div className="contact-preview-row">
                {lastIsMine && (
                  <MessageStatus
                    status={getMessageStatus({
                      delivered_at: c.last_message_delivered_at,
                      read_at: c.last_message_read_at,
                    })}
                  />
                )}
                <span className="contact-preview">
                  {hasMessage ? c.last_message_body : "No messages yet"}
                </span>
                {unread && <span className="unread-badge">{c.unread_count}</span>}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
