import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";

const API = "";  // proxy handles it

export default function Messages({ user }) {
  const { conversationId } = useParams();
  const navigate = useNavigate();

  const [convos, setConvos] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef(null);
  const pollRef = useRef(null);

  const token = user?.token;
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  // ── fetch conversation list ──
  const fetchConvos = async () => {
    try {
      const res = await fetch(`${API}/api/conversations/`, { headers });
      if (res.ok) {
        const data = await res.json();
        setConvos(data);
      }
    } catch (err) {
      console.error("Failed to load conversations:", err);
    } finally {
      setLoading(false);
    }
  };

  // ── fetch messages for active conversation ──
  const fetchMessages = async () => {
    if (!conversationId) return;
    try {
      const res = await fetch(`${API}/api/conversations/${conversationId}/messages/`, { headers });
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch (err) {
      console.error("Failed to load messages:", err);
    }
  };

  // ── send a message ──
  const sendMessage = async () => {
    if (!newMsg.trim() || !conversationId) return;
    try {
      const res = await fetch(`${API}/api/conversations/${conversationId}/messages/`, {
        method: "POST",
        headers,
        body: JSON.stringify({ text: newMsg.trim() }),
      });
      if (res.ok) {
        setNewMsg("");
        fetchMessages();
        fetchConvos();  // update sidebar preview
      }
    } catch (err) {
      console.error("Failed to send message:", err);
    }
  };

  // ── initial load ──
  useEffect(() => {
    fetchConvos();
  }, []);

  // ── load messages when conversation changes ──
  useEffect(() => {
    if (conversationId) {
      fetchMessages();
    } else {
      setMessages([]);
    }
  }, [conversationId]);

  // ── poll for new messages every 5s ──
  useEffect(() => {
    if (conversationId) {
      pollRef.current = setInterval(() => {
        fetchMessages();
        fetchConvos();
      }, 5000);
    }
    return () => clearInterval(pollRef.current);
  }, [conversationId]);

  // ── auto-scroll to bottom on new messages ──
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── handle enter key ──
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const activeConvo = convos.find((c) => String(c.id) === String(conversationId));

  // ── styles ──
  const styles = {
    container: {
      display: "flex",
      height: "calc(100vh - 70px)",
      background: "#0a0f1a",
      color: "#e2e8f0",
      fontFamily: "'Inter', sans-serif",
    },
    sidebar: {
      width: "320px",
      minWidth: "320px",
      borderRight: "1px solid #1e293b",
      display: "flex",
      flexDirection: "column",
      background: "#0f1629",
    },
    sidebarHeader: {
      padding: "20px",
      fontSize: "18px",
      fontWeight: 600,
      borderBottom: "1px solid #1e293b",
      color: "#f1f5f9",
    },
    convoList: {
      flex: 1,
      overflowY: "auto",
    },
    convoItem: (isActive) => ({
      padding: "14px 20px",
      cursor: "pointer",
      borderBottom: "1px solid #1e293b",
      background: isActive ? "#1e293b" : "transparent",
      transition: "background 0.15s",
    }),
    convoName: {
      fontWeight: 600,
      fontSize: "14px",
      color: "#f1f5f9",
      marginBottom: "4px",
    },
    convoPreview: {
      fontSize: "12px",
      color: "#64748b",
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
      maxWidth: "260px",
    },
    convoTime: {
      fontSize: "11px",
      color: "#475569",
      marginTop: "4px",
    },
    chatArea: {
      flex: 1,
      display: "flex",
      flexDirection: "column",
    },
    chatHeader: {
      padding: "16px 24px",
      borderBottom: "1px solid #1e293b",
      fontWeight: 600,
      fontSize: "16px",
      color: "#f1f5f9",
      background: "#0f1629",
    },
    messageList: {
      flex: 1,
      overflowY: "auto",
      padding: "20px 24px",
      display: "flex",
      flexDirection: "column",
      gap: "8px",
    },
    messageBubble: (isMine) => ({
      maxWidth: "65%",
      padding: "10px 14px",
      borderRadius: "12px",
      fontSize: "14px",
      lineHeight: "1.5",
      alignSelf: isMine ? "flex-end" : "flex-start",
      background: isMine ? "#38bdf8" : "#1e293b",
      color: isMine ? "#0a0f1a" : "#e2e8f0",
      borderBottomRightRadius: isMine ? "4px" : "12px",
      borderBottomLeftRadius: isMine ? "12px" : "4px",
    }),
    messageTime: (isMine) => ({
      fontSize: "10px",
      color: isMine ? "rgba(10,15,26,0.6)" : "#475569",
      marginTop: "4px",
    }),
    inputArea: {
      padding: "16px 24px",
      borderTop: "1px solid #1e293b",
      display: "flex",
      gap: "12px",
      alignItems: "center",
      background: "#0f1629",
    },
    input: {
      flex: 1,
      padding: "12px 16px",
      borderRadius: "8px",
      border: "1px solid #1e293b",
      background: "#0a0f1a",
      color: "#e2e8f0",
      fontSize: "14px",
      fontFamily: "'Inter', sans-serif",
      outline: "none",
      resize: "none",
    },
    sendBtn: {
      padding: "10px 20px",
      borderRadius: "8px",
      border: "none",
      background: "#38bdf8",
      color: "#0a0f1a",
      fontWeight: 600,
      fontSize: "14px",
      cursor: "pointer",
      fontFamily: "'Inter', sans-serif",
      transition: "opacity 0.15s",
    },
    emptyState: {
      flex: 1,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "#475569",
      fontSize: "15px",
      fontStyle: "italic",
    },
  };

  const formatTime = (dateStr) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now - d;
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffDays === 0) {
      return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    } else if (diffDays === 1) {
      return "Yesterday";
    } else if (diffDays < 7) {
      return d.toLocaleDateString([], { weekday: "short" });
    }
    return d.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  if (loading) {
    return (
      <div style={{ ...styles.container, alignItems: "center", justifyContent: "center" }}>
        Loading conversations...
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* ── Sidebar: conversation list ── */}
      <div style={styles.sidebar}>
        <div style={styles.sidebarHeader}>Messages</div>
        <div style={styles.convoList}>
          {convos.length === 0 ? (
            <div style={{ padding: "20px", color: "#475569", fontSize: "13px" }}>
              No conversations yet. Accept or post a job to start chatting!
            </div>
          ) : (
            convos.map((c) => (
              <div
                key={c.id}
                style={styles.convoItem(String(c.id) === String(conversationId))}
                onClick={() => navigate(`/messages/${c.id}`)}
                onMouseEnter={(e) => {
                  if (String(c.id) !== String(conversationId))
                    e.currentTarget.style.background = "#151d30";
                }}
                onMouseLeave={(e) => {
                  if (String(c.id) !== String(conversationId))
                    e.currentTarget.style.background = "transparent";
                }}
              >
                <div style={styles.convoName}>{c.other_user_name}</div>
                <div style={styles.convoPreview}>
                  {c.last_message || "No messages yet"}
                </div>
                <div style={styles.convoTime}>{formatTime(c.last_message_at)}</div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── Chat area ── */}
      <div style={styles.chatArea}>
        {!conversationId ? (
          <div style={styles.emptyState}>
            Select a conversation to start chatting
          </div>
        ) : (
          <>
            <div style={styles.chatHeader}>
              {activeConvo?.other_user_name || "Chat"}
            </div>

            <div style={styles.messageList}>
              {messages.length === 0 ? (
                <div style={styles.emptyState}>
                  No messages yet — say hello!
                </div>
              ) : (
                messages.map((m) => {
                  const isMine = m.sender_id === user.id;
                  return (
                    <div key={m.id} style={{ alignSelf: isMine ? "flex-end" : "flex-start", maxWidth: "65%" }}>
                      <div style={styles.messageBubble(isMine)}>{m.text}</div>
                      <div style={styles.messageTime(isMine)}>{formatTime(m.created_at)}</div>
                    </div>
                  );
                })
              )}
              <div ref={bottomRef} />
            </div>

            <div style={styles.inputArea}>
              <textarea
                style={styles.input}
                rows={1}
                placeholder="Type a message..."
                value={newMsg}
                onChange={(e) => setNewMsg(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <button
                style={{
                  ...styles.sendBtn,
                  opacity: newMsg.trim() ? 1 : 0.5,
                  cursor: newMsg.trim() ? "pointer" : "not-allowed",
                }}
                onClick={sendMessage}
                disabled={!newMsg.trim()}
              >
                Send
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}