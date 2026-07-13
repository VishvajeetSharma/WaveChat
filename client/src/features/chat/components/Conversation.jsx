import { useEffect, useRef, useState } from "react";
import { formatDayLabel, initials } from "../../../shared/utils/date.js";
import MessageBubble from "./MessageBubble.jsx";

export default function Conversation({
  contact,
  messages,
  currentUserId,
  online,
  typing,
  onSend,
  onTyping,
}) {
  const [draft, setDraft] = useState("");
  const listRef = useRef(null);
  const typingTimeout = useRef(null);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, typing]);

  useEffect(() => () => clearTimeout(typingTimeout.current), []);

  const handleChange = (e) => {
    setDraft(e.target.value);
    onTyping(true);
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => onTyping(false), 1200);
  };

  const handleSend = () => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setDraft("");
    onTyping(false);
    clearTimeout(typingTimeout.current);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!contact) {
    return (
      <div className="no-conversation">
        <h2 className="auth-mark">WaveChat</h2>
        <p>Pick someone from the list to start a conversation.</p>
      </div>
    );
  }

  let lastDay = null;

  return (
    <div className="conversation">
      <div className="conversation-header">
        <div className="avatar">{initials(contact.username)}</div>
        <div>
          <div className="conversation-title">{contact.username}</div>
          <div className={`conversation-status${online ? " online" : ""}`}>
            {online ? "Online" : "Offline"}
          </div>
        </div>
      </div>

      <div className="message-list" ref={listRef}>
        {messages.map((m) => {
          const day = formatDayLabel(m.created_at);
          const showDivider = day !== lastDay;
          lastDay = day;
          return (
            <div key={m.id}>
              {showDivider && <div className="day-divider">{day}</div>}
              <MessageBubble message={m} mine={m.sender_id === currentUserId} />
            </div>
          );
        })}
      </div>

      <div className="typing-indicator">
        {typing ? `${contact.username} is typing…` : ""}
      </div>

      <div className="composer">
        <textarea
          rows={1}
          placeholder={`Message ${contact.username}…`}
          value={draft}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
        />
        <button className="send-btn" onClick={handleSend} disabled={!draft.trim()}>
          Send
        </button>
      </div>
    </div>
  );
}
