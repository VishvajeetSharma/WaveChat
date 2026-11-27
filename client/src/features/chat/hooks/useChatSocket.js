import { useCallback, useEffect, useRef, useState } from "react";
import { getSocket } from "../../../lib/socketClient.js";
import chatApi from "../api/chat.api.js";

const tabIsVisible = () => document.visibilityState === "visible";

function newClientId() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/**
 * Insert or update a message. Matches by server id, or by clientId so the
 * optimistic bubble is replaced in place (no duplicate, no remount).
 * Receipt timestamps never go backwards: a late, older copy cannot erase a tick.
 */
function upsertMessage(list, message) {
  const idx = list.findIndex(
    (m) => m.id === message.id || (message.clientId && m.clientId === message.clientId)
  );
  if (idx === -1) return [...list, message];

  const prev = list[idx];
  const merged = {
    ...prev,
    ...message,
    delivered_at: message.delivered_at || prev.delivered_at || null,
    read_at: message.read_at || prev.read_at || null,
    pending: false,
    failed: false,
  };

  const next = [];
  list.forEach((m, i) => {
    if (i === idx) next.push(merged);
    else if (!(message.clientId && m.clientId === message.clientId)) next.push(m);
  });
  return next;
}

export function useChatSocket(currentUserId) {
  const [contacts, setContacts] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [messagesByUser, setMessagesByUser] = useState({});
  const [onlineIds, setOnlineIds] = useState(new Set());
  const [typingFrom, setTypingFrom] = useState(null);
  const [loadingContacts, setLoadingContacts] = useState(true);

  const activeIdRef = useRef(activeId);
  activeIdRef.current = activeId;
  const messagesRef = useRef(messagesByUser);
  messagesRef.current = messagesByUser;

  /* ---------- small state helpers (all stable) ---------- */

  const patchConversation = useCallback((userId, patchFn) => {
    setMessagesByUser((prev) =>
      prev[userId] ? { ...prev, [userId]: prev[userId].map(patchFn) } : prev
    );
  }, []);

  const upsertInConversation = useCallback((userId, message) => {
    setMessagesByUser((prev) => ({
      ...prev,
      [userId]: upsertMessage(prev[userId] || [], message),
    }));
  }, []);

  /** Update the sidebar row (preview, time, ticks) and move it to the top. */
  const applyToContacts = useCallback((otherId, message, { countUnread }) => {
    setContacts((prev) => {
      const idx = prev.findIndex((c) => c.id === otherId);
      if (idx === -1) return prev;
      const updated = {
        ...prev[idx],
        last_message_id: message.id,
        last_message_body: message.body,
        last_message_at: message.created_at,
        last_message_sender_id: message.sender_id,
        last_message_delivered_at: message.delivered_at || null,
        last_message_read_at: message.read_at || null,
      };
      if (countUnread) updated.unread_count = (updated.unread_count || 0) + 1;
      return [updated, ...prev.filter((c) => c.id !== otherId)];
    });
  }, []);

  const clearUnread = useCallback((userId) => {
    setContacts((prev) =>
      prev.map((c) => (c.id === userId && c.unread_count ? { ...c, unread_count: 0 } : c))
    );
  }, []);

  /* ---------- contacts ---------- */

  const loadContacts = useCallback(async () => {
    try {
      const users = await chatApi.getContacts();
      setContacts(users);
    } finally {
      setLoadingContacts(false);
    }
  }, []);

  useEffect(() => {
    loadContacts();
  }, [loadContacts]);

  /* ---------- history for the open conversation ---------- */

  useEffect(() => {
    if (!activeId) return;
    let cancelled = false;

    chatApi.getConversation(activeId).then((fetched) => {
      if (cancelled) return;

      setMessagesByUser((prev) => {
        const current = prev[activeId] || [];
        const currentById = new Map(current.map((m) => [m.id, m]));
        const fetchedIds = new Set(fetched.map((m) => m.id));

        // Server copy is the base; keep any receipt/clientId we already learned live.
        const merged = fetched.map((m) => {
          const live = currentById.get(m.id);
          return live
            ? {
                ...m,
                clientId: live.clientId,
                delivered_at: m.delivered_at || live.delivered_at || null,
                read_at: m.read_at || live.read_at || null,
              }
            : m;
        });

        // Keep unsent (optimistic/failed) and brand-new messages the fetch didn't include.
        const extras = current.filter((m) => !fetchedIds.has(m.id));
        return { ...prev, [activeId]: [...merged, ...extras] };
      });

      clearUnread(activeId);
    });

    // Opening the chat = seen (only if the tab is actually in front of the user).
    if (tabIsVisible()) getSocket()?.emit("message:read", { senderId: activeId });

    return () => {
      cancelled = true;
    };
  }, [activeId, clearUnread]);

  /* ---------- live socket events ---------- */

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleNewMessage = (message) => {
      const mine = message.sender_id === currentUserId;
      const otherId = mine ? message.receiver_id : message.sender_id;

      upsertInConversation(otherId, message);

      const viewing = activeIdRef.current === otherId && tabIsVisible();
      applyToContacts(otherId, message, { countUnread: !mine && !viewing });

      // Incoming message while the chat is open and visible -> seen right away.
      if (!mine && viewing) socket.emit("message:read", { senderId: otherId });
    };

    const handleDelivered = ({ by, ids, deliveredAt }) => {
      if (!Array.isArray(ids)) return;
      const hit = new Set(ids);
      patchConversation(by, (m) =>
        hit.has(m.id) && !m.delivered_at ? { ...m, delivered_at: deliveredAt } : m
      );
      setContacts((prev) =>
        prev.map((c) =>
          c.id === by && hit.has(c.last_message_id) && !c.last_message_delivered_at
            ? { ...c, last_message_delivered_at: deliveredAt }
            : c
        )
      );
    };

    const handleRead = ({ by, ids, readAt }) => {
      if (!Array.isArray(ids)) return;
      const hit = new Set(ids);
      patchConversation(by, (m) =>
        hit.has(m.id)
          ? { ...m, read_at: readAt, delivered_at: m.delivered_at || readAt }
          : m
      );
      setContacts((prev) =>
        prev.map((c) =>
          c.id === by && hit.has(c.last_message_id)
            ? {
                ...c,
                last_message_read_at: readAt,
                last_message_delivered_at: c.last_message_delivered_at || readAt,
              }
            : c
        )
      );
    };

    const handlePresence = ({ userId, online }) => {
      setOnlineIds((prev) => {
        const next = new Set(prev);
        if (online) next.add(userId);
        else next.delete(userId);
        return next;
      });
    };

    const handlePresenceSnapshot = ({ userIds }) => {
      if (!Array.isArray(userIds)) return;
      setOnlineIds(new Set(userIds));
    };

    const handleTyping = ({ userId, isTyping }) => {
      if (activeIdRef.current !== userId) return;
      setTypingFrom(isTyping ? userId : null);
    };

    const handleConnect = () => {
      socket.emit("presence:get");
    };

    socket.on("message:new", handleNewMessage);
    socket.on("message:delivered", handleDelivered);
    socket.on("message:read", handleRead);
    socket.on("presence:update", handlePresence);
    socket.on("presence:snapshot", handlePresenceSnapshot);
    socket.on("message:typing", handleTyping);
    socket.on("connect", handleConnect);

    if (socket.connected) handleConnect();

    return () => {
      socket.off("message:new", handleNewMessage);
      socket.off("message:delivered", handleDelivered);
      socket.off("message:read", handleRead);
      socket.off("presence:update", handlePresence);
      socket.off("presence:snapshot", handlePresenceSnapshot);
      socket.off("message:typing", handleTyping);
      socket.off("connect", handleConnect);
    };
  }, [currentUserId, upsertInConversation, applyToContacts, patchConversation]);

  /* ---------- coming back to the tab = seen ---------- */

  useEffect(() => {
    const markActiveSeen = () => {
      const id = activeIdRef.current;
      if (!id || !tabIsVisible()) return;
      getSocket()?.emit("message:read", { senderId: id });
      clearUnread(id);
    };
    document.addEventListener("visibilitychange", markActiveSeen);
    window.addEventListener("focus", markActiveSeen);
    return () => {
      document.removeEventListener("visibilitychange", markActiveSeen);
      window.removeEventListener("focus", markActiveSeen);
    };
  }, [clearUnread]);

  /* ---------- sending ---------- */

  const emitSend = useCallback(
    (draft) => {
      const receiverId = draft.receiver_id;
      getSocket()?.emit(
        "message:send",
        { receiverId, body: draft.body, clientId: draft.clientId },
        (res) => {
          if (res?.error || !res?.message) {
            console.error("Send failed:", res?.error);
            patchConversation(receiverId, (m) =>
              m.clientId === draft.clientId ? { ...m, pending: false, failed: true } : m
            );
            return;
          }
          upsertInConversation(receiverId, res.message);
          applyToContacts(receiverId, res.message, { countUnread: false });
        }
      );
    },
    [patchConversation, upsertInConversation, applyToContacts]
  );

  const sendMessage = useCallback(
    (body) => {
      if (!getSocket() || !activeId) return;

      const clientId = newClientId();
      const draft = {
        id: `tmp-${clientId}`,
        clientId,
        sender_id: currentUserId,
        receiver_id: activeId,
        body,
        created_at: new Date().toISOString(),
        delivered_at: null,
        read_at: null,
        pending: true,
      };

      upsertInConversation(activeId, draft);
      applyToContacts(activeId, draft, { countUnread: false });
      emitSend(draft);
    },
    [activeId, currentUserId, upsertInConversation, applyToContacts, emitSend]
  );

  const retryMessage = useCallback(
    (clientId) => {
      const userId = activeIdRef.current;
      const failed = (messagesRef.current[userId] || []).find(
        (m) => m.clientId === clientId && m.failed
      );
      if (!failed) return;
      patchConversation(userId, (m) =>
        m.clientId === clientId ? { ...m, failed: false, pending: true } : m
      );
      emitSend(failed);
    },
    [patchConversation, emitSend]
  );

  const setTyping = useCallback(
    (isTyping) => {
      const socket = getSocket();
      if (!socket || !activeId) return;
      socket.emit("message:typing", { receiverId: activeId, isTyping });
    },
    [activeId]
  );

  return {
    contacts,
    loadingContacts,
    activeId,
    setActiveId,
    messages: messagesByUser[activeId] || [],
    onlineIds,
    isTypingFromActive: typingFrom === activeId,
    sendMessage,
    retryMessage,
    setTyping,
  };
}

export default useChatSocket;
