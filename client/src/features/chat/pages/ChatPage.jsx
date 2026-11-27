import { useAuth } from "../../auth/context/AuthContext.jsx";
import useChatSocket from "../hooks/useChatSocket.js";
import ContactList from "../components/ContactList.jsx";
import Conversation from "../components/Conversation.jsx";
import Avatar from "../../../shared/components/Avatar.jsx";
import WaveMark from "../../../shared/components/WaveMark.jsx";
import ThemeToggle from "../../../shared/components/ThemeToggle.jsx";
import Footer from "../../../shared/components/Footer.jsx";

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
    retryMessage,
    setTyping,
  } = useChatSocket(user.id);

  const activeContact = contacts.find((c) => c.id === activeId) || null;

  return (
    // On narrow screens only one pane shows at a time: `in-chat` swaps the list for the chat.
    <div className={`app-shell${activeContact ? " in-chat" : ""}`}>
      <div className="sidebar">
        <div className="sidebar-header">
          <div className="brand">
            <WaveMark full size={170} />
          </div>
          <ThemeToggle />
        </div>

        {!loadingContacts && (
          <ContactList
            contacts={contacts}
            activeId={activeId}
            onSelect={setActiveId}
            onlineIds={onlineIds}
          />
        )}
        <div className="sidebar-bottom">
          <div className="me-row">
            <Avatar name={user.username} size="sm" />
            <div className="me-details">
              <span className="me-label">Signed in as</span>
              <span className="me-username">{user.username}</span>
            </div>
            <button className="logout-btn" onClick={logout}>
              Sign out
            </button>
          </div>
          <Footer />
        </div>
      </div>

      <Conversation
        contact={activeContact}
        messages={messages}
        currentUserId={user.id}
        online={onlineIds.has(activeId)}
        typing={isTypingFromActive}
        onSend={sendMessage}
        onRetry={retryMessage}
        onTyping={setTyping}
        onBack={() => setActiveId(null)}
      />
    </div>
  );
}
