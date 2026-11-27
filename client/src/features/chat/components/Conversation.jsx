import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { formatDayLabel } from "../../../shared/utils/date.js";
import Avatar from "../../../shared/components/Avatar.jsx";
import WaveMark from "../../../shared/components/WaveMark.jsx";
import MessageBubble from "./MessageBubble.jsx";

const GROUP_GAP_MS = 5 * 60 * 1000;

export default function Conversation({
  contact,
  messages,
  currentUserId,
  online,
  typing,
  onSend,
  onRetry,
  onTyping,
  onBack,
}) {
  const [draft, setDraft] = useState("");
  const listRef = useRef(null);
  const inputRef = useRef(null);
  const typingTimeout = useRef(null);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, typing]);

  useEffect(() => () => clearTimeout(typingTimeout.current), []);

  // Grow the textarea with its content (up to the CSS max-height).
  useLayoutEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [draft, contact?.id]);

  // Fresh draft per conversation.
  useEffect(() => {
    setDraft("");
  }, [contact?.id]);

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
        <WaveMark size={56} />
        <h2 className="wordmark wordmark-lg">WaveChat</h2>
        <p>Pick someone from the list to start a conversation.</p>
      </div>
    );
  }

  let lastDay = null;

  return (
    <div className="conversation">
      <div className="conversation-header">
        <button type="button" className="back-btn" onClick={onBack} aria-label="Back to chats">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 5-7 7 7 7" />
          </svg>
        </button>
        <Avatar name={contact.username} />
        <div className="conversation-who">
          <div className="conversation-title">{contact.username}</div>
          <div
            className={`conversation-status${typing ? " typing" : online ? " online" : ""}`}
            aria-live="polite"
          >
            {typing ? "typing…" : online ? "Online" : "Offline"}
          </div>
        </div>
      </div>

      <div className="message-list" ref={listRef}>
        {messages.map((m, i) => {
          const prev = messages[i - 1];
          const day = formatDayLabel(m.created_at);
          const showDivider = day !== lastDay;
          lastDay = day;

          const startsGroup =
            showDivider ||
            !prev ||
            prev.sender_id !== m.sender_id ||
            new Date(m.created_at) - new Date(prev.created_at) > GROUP_GAP_MS;

          return (
            <div key={m.clientId || m.id}>
              {showDivider && <div className="day-divider">{day}</div>}
              <MessageBubble
                message={m}
                mine={m.sender_id === currentUserId}
                startsGroup={startsGroup}
                onRetry={onRetry}
              />
            </div>
          );
        })}

        {typing && (
          <div className="message-row theirs group-start">
            <div className="bubble has-tail typing-bubble" aria-hidden="true">
              <span className="dot" />
              <span className="dot" />
              <span className="dot" />
            </div>
          </div>
        )}
      </div>

      <div className="composer">
        <textarea
          ref={inputRef}
          rows={1}
          placeholder={`Message ${contact.username}`}
          value={draft}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          aria-label={`Message ${contact.username}`}
        />
        <button
          type="button"
          className="send-btn"
          onClick={handleSend}
          disabled={!draft.trim()}
          aria-label="Send message"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
            <path d="M3.4 20.4 21.2 12.7a.8.8 0 0 0 0-1.4L3.4 3.6a.8.8 0 0 0-1.1.9L4 10.8l9 1.2-9 1.2-1.7 6.3a.8.8 0 0 0 1.1.9Z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
