import { formatClockTime } from "../../../shared/utils/date.js";
import MessageStatus, { getMessageStatus } from "./MessageStatus.jsx";

export default function MessageBubble({ message, mine, startsGroup, onRetry }) {
  const status = mine ? getMessageStatus(message) : null;

  let detail;
  if (status === "read") detail = `Seen ${formatClockTime(message.read_at)}`;
  else if (status === "delivered") detail = `Delivered ${formatClockTime(message.delivered_at)}`;

  return (
    <div
      className={`message-row ${mine ? "mine" : "theirs"}${startsGroup ? " group-start" : ""}`}
    >
      <div className={`bubble${startsGroup ? " has-tail" : ""}`}>
        {message.body}
        <span className="bubble-meta">
          <time className="bubble-time" dateTime={message.created_at}>
            {formatClockTime(message.created_at)}
          </time>
          {mine && (
            <MessageStatus
              status={status}
              detail={detail}
              onRetry={() => onRetry?.(message.clientId)}
            />
          )}
        </span>
      </div>
    </div>
  );
}
