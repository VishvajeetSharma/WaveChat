import { useCallback, useEffect, useRef, useState } from "react";
import { getSocket } from "../../../lib/socketClient.js";
import chatApi from "../api/chat.api.js";

export function useChatSocket(currentUserId) {
  const [contacts, setContacts] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [messagesByUser, setMessagesByUser] = useState({});
  const [onlineIds, setOnlineIds] = useState(new Set());
  const [typingFrom, setTypingFrom] = useState(null);
  const [loadingContacts, setLoadingContacts] = useState(true);

  const activeIdRef = useRef(activeId);
  activeIdRef.current = activeId;

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

  // Load message history whenever the active conversation changes.
  useEffect(() => {
    if (!activeId) return;
    let cancelled = false;

    chatApi.getConversation(activeId).then((messages) => {
      if (cancelled) return;
      setMessagesByUser((prev) => ({ ...prev, [activeId]: messages }));
      setContacts((prev) =>
        prev.map((c) => (c.id === activeId ? { ...c, unread_count: 0 } : c))
      );
    });

    getSocket()?.emit("message:read", { senderId: activeId });

    return () => {
      cancelled = true;
    };
  }, [activeId]);

  // Wire up live Socket.IO events once.
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleNewMessage = (message) => {
      const otherId =
        message.sender_id === currentUserId ? message.receiver_id : message.sender_id;

      setMessagesByUser((prev) => {
        const existing = prev[otherId] || [];
        return { ...prev, [otherId]: [...existing, message] };
      });

      setContacts((prev) => {
        const idx = prev.findIndex((c) => c.id === otherId);
        if (idx === -1) return prev;
        const updated = { ...prev[idx] };
        updated.last_message_body = message.body;
        updated.last_message_at = message.created_at;
        updated.last_message_sender_id = message.sender_id;
        if (message.sender_id !== currentUserId && activeIdRef.current !== otherId) {
          updated.unread_count = (updated.unread_count || 0) + 1;
        }
        const rest = prev.filter((c) => c.id !== otherId);
        return [updated, ...rest];
      });

      if (message.sender_id !== currentUserId && activeIdRef.current === otherId) {
        socket.emit("message:read", { senderId: otherId });
      }
    };

    const handlePresence = ({ userId, online }) => {
      setOnlineIds((prev) => {
        const next = new Set(prev);
        if (online) next.add(userId);
        else next.delete(userId);
        return next;
      });
    };

    const handleTyping = ({ userId, isTyping }) => {
      if (activeIdRef.current !== userId) return;
      setTypingFrom(isTyping ? userId : null);
    };

    socket.on("message:new", handleNewMessage);
    socket.on("presence:update", handlePresence);
    socket.on("message:typing", handleTyping);

    return () => {
      socket.off("message:new", handleNewMessage);
      socket.off("presence:update", handlePresence);
      socket.off("message:typing", handleTyping);
    };
  }, [currentUserId]);

  const sendMessage = useCallback(
    (body) => {
      const socket = getSocket();
      if (!socket || !activeId) return;
      socket.emit("message:send", { receiverId: activeId, body }, (res) => {
        if (res?.error) console.error("Send failed:", res.error);
      });
    },
    [activeId]
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
    setTyping,
  };
}

export default useChatSocket;
