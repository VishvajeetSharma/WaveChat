import { useAuth } from "../../auth/context/AuthContext.jsx";
import useChatSocket from "../hooks/useChatSocket.js";
import ContactList from "../components/ContactList.jsx";
import Conversation from "../components/Conversation.jsx";

export default function ChatPage() {
  const { user, logout } = useAuth();
  const {
    contacts,
    loadingContacts,
    activeId,
    setActiveId,
    messages,
    onlineIds,
    isTypingFromActive,
    sendMessage,
    setTyping,
  } = useChatSocket(user.id);

  const activeContact = contacts.find((c) => c.id === activeId) || null;

  return (
    <div className="app-shell">
      <div className="sidebar">
        <div className="sidebar-header">
          <h1 className="auth-mark">Wire</h1>
          <div className="me-row">
            <span className="me-username">{user.username}</span>
            <button className="logout-btn" onClick={logout}>
              Sign out
            </button>
          </div>
        </div>
        {!loadingContacts && (
          <ContactList
            contacts={contacts}
            activeId={activeId}
            onSelect={setActiveId}
            onlineIds={onlineIds}
          />
        )}
      </div>

      <Conversation
        contact={activeContact}
        messages={messages}
        currentUserId={user.id}
        online={onlineIds.has(activeId)}
        typing={isTypingFromActive}
        onSend={sendMessage}
        onTyping={setTyping}
      />
    </div>
  );
}
