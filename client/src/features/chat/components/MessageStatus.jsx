import { useRef } from "react";

/**
 * Receipt state of a message you sent:
 *   sending   -> clock            (not acknowledged by the server yet)
 *   sent      -> one grey tick    (saved on the server)
 *   delivered -> two grey ticks   (receiver's device got it)
 *   read      -> two blue ticks   (receiver opened the chat = "seen")
 *   failed    -> red "!"          (tap to retry)
 */
export function getMessageStatus({ pending, failed, delivered_at, read_at }) {
  if (failed) return "failed";
  if (pending) return "sending";
  if (read_at) return "read";
  if (delivered_at) return "delivered";
  return "sent";
}

const LABELS = {
  sending: "Sending",
  sent: "Sent",
  delivered: "Delivered",
  read: "Seen",
  failed: "Not sent",
};

export default function MessageStatus({ status, detail, onRetry }) {
  // Animate only when the status *changes* while on screen, not for every
  // tick when a conversation first renders.
  const initialStatus = useRef(status);
  const animate = initialStatus.current !== status;

  if (status === "failed") {
    return (
      <button
        type="button"
        className="tick tick-failed"
        onClick={onRetry}
        title="Not sent. Tap to retry"
        aria-label="Message not sent. Retry"
      >
        <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
          <circle cx="8" cy="8" r="6.4" />
          <path d="M8 4.6v4M8 11.2v.1" />
        </svg>
      </button>
    );
  }

  const label = detail || LABELS[status];

  return (
    <span
      className={`tick tick-${status}${animate ? " tick-animate" : ""}`}
      role="img"
      aria-label={label}
      title={label}
    >
      {status === "sending" ? (
        <svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="8" cy="8" r="6" />
          <path d="M8 4.8V8l2.2 1.4" />
        </svg>
      ) : (
        <svg viewBox="0 0 17 11" width="17" height="11" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          {status !== "sent" && <path className="tick-first" d="M1 5.8 4.4 9.1 11 1.7" />}
          <path d="M5.6 5.8 9 9.1 15.6 1.7" />
        </svg>
      )}
    </span>
  );
}
