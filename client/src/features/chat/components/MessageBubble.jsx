import { formatClockTime } from "../../../shared/utils/date.js";

export default function MessageBubble({ message, mine }) {
  return (
    <div className={`message-row ${mine ? "mine" : "theirs"}`}>
      <div className="bubble">
        {message.body}
        <span className="bubble-time">{formatClockTime(message.created_at)}</span>
      </div>
    </div>
  );
}
