import { useState, useEffect, useRef } from "react";

const API = "http://localhost:8000";

export default function Messages({ user }) {
  const [convos, setConvos]           = useState([]);
  const [activeId, setActiveId]       = useState(null);   // replaces useParams
  const [messages, setMessages]       = useState([]);
  const [newMsg, setNewMsg]           = useState("");
  const [loading, setLoading]         = useState(true);
  const [acting, setActing]           = useState(false);  // approve/decline in-flight
  const bottomRef                     = useRef(null);
  const pollRef                       = useRef(null);

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${user?.token}`,
  };

  // ── fetch conversation list ──────────────────────────────────────────────
  const fetchConvos = async () => {
    try {
      const res = await fetch(`${API}/api/conversations/`, { headers });
      if (res.ok) setConvos(await res.json());
    } catch (err) {
      console.error("Failed to load conversations:", err);
    } finally {
      setLoading(false);
    }
  };

  // ── fetch messages for active conversation ───────────────────────────────
  const fetchMessages = async () => {
    if (!activeId) return;
    try {
      const res = await fetch(`${API}/api/conversations/${activeId}/messages/`, { headers });
      if (res.ok) setMessages(await res.json());
    } catch (err) {
      console.error("Failed to load messages:", err);
    }
  };

  // ── send a plain text message ────────────────────────────────────────────
  const sendMessage = async () => {
    if (!newMsg.trim() || !activeId) return;
    try {
      const res = await fetch(`${API}/api/conversations/${activeId}/messages/`, {
        method: "POST", headers,
        body: JSON.stringify({ text: newMsg.trim() }),
      });
      if (res.ok) { setNewMsg(""); fetchMessages(); fetchConvos(); }
    } catch (err) {
      console.error("Failed to send message:", err);
    }
  };

  // ── approve worker (customer action) ────────────────────────────────────
  const handleApprove = async (jobId) => {
    setActing(true);
    try {
      const res = await fetch(`${API}/api/jobs/${jobId}/approve/`, {
        method: "POST", headers,
      });
      if (res.ok) { fetchMessages(); fetchConvos(); }
      else { const d = await res.json(); alert(d.error || "Failed to approve"); }
    } catch (err) {
      console.error(err);
    } finally {
      setActing(false);
    }
  };

  // ── decline worker (customer action) ────────────────────────────────────
  const handleDecline = async (jobId) => {
    setActing(true);
    try {
      const res = await fetch(`${API}/api/jobs/${jobId}/decline/`, {
        method: "POST", headers,
      });
      if (res.ok) { fetchMessages(); fetchConvos(); }
      else { const d = await res.json(); alert(d.error || "Failed to decline"); }
    } catch (err) {
      console.error(err);
    } finally {
      setActing(false);
    }
  };

  // ── lifecycle ────────────────────────────────────────────────────────────
  useEffect(() => { fetchConvos(); }, []);

  useEffect(() => {
    setMessages([]);
    if (activeId) fetchMessages();
  }, [activeId]);

  // poll every 5 s while a conversation is open
  useEffect(() => {
    clearInterval(pollRef.current);
    if (activeId) {
      pollRef.current = setInterval(() => { fetchMessages(); fetchConvos(); }, 5000);
    }
    return () => clearInterval(pollRef.current);
  }, [activeId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const activeConvo = convos.find(c => c.id === activeId);
  const isCustomer  = user?.role === "customer";

  // ── format timestamp ─────────────────────────────────────────────────────
  const fmt = (dateStr) => {
    const d = new Date(dateStr), now = new Date();
    const days = Math.floor((now - d) / 86400000);
    if (days === 0) return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    if (days === 1) return "Yesterday";
    if (days < 7)  return d.toLocaleDateString([], { weekday: "short" });
    return d.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  // ── render a single message bubble or action card ────────────────────────
  const renderMessage = (m) => {
    const isMine = m.sender_id === user?.id;

    // ── job_request card (only customer sees Accept/Decline) ──
    if (m.msg_type === "job_request") {
      return (
        <div key={m.id} style={{ alignSelf: "center", width: "100%", maxWidth: 420, margin: "4px 0" }}>
          <div style={{
            borderRadius: 12, overflow: "hidden",
            border: "1px solid rgba(251,191,36,0.25)",
            background: "rgba(251,191,36,0.05)",
          }}>
            {/* card header */}
            <div style={{
              padding: "10px 16px", display: "flex", alignItems: "center", gap: 8,
              borderBottom: "1px solid rgba(251,191,36,0.15)",
              background: "rgba(251,191,36,0.08)",
            }}>
              <span style={{ fontSize: 16 }}>🔧</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#fbbf24", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Job Request
              </span>
            </div>
            {/* card body */}
            <div style={{ padding: "12px 16px" }}>
              <p style={{ fontSize: 13, color: "#e2e8f0", margin: "0 0 12px 0", lineHeight: 1.5 }}>
                {m.text}
              </p>
              {/* Only the customer who owns the job sees the buttons */}
              {isCustomer && activeConvo?.job_id && (
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={() => handleApprove(activeConvo.job_id)}
                    disabled={acting}
                    style={{
                      flex: 1, padding: "8px 0", borderRadius: 8, border: "none",
                      background: acting ? "#1e293b" : "linear-gradient(135deg,#10b981,#06b6d4)",
                      color: acting ? "#475569" : "#fff",
                      fontSize: 13, fontWeight: 600, cursor: acting ? "not-allowed" : "pointer",
                      fontFamily: "inherit",
                    }}
                  >
                    {acting ? "Working…" : "✓ Accept Worker"}
                  </button>
                  <button
                    onClick={() => handleDecline(activeConvo.job_id)}
                    disabled={acting}
                    style={{
                      flex: 1, padding: "8px 0", borderRadius: 8,
                      border: "1px solid rgba(239,68,68,0.3)",
                      background: "transparent", color: acting ? "#475569" : "#f87171",
                      fontSize: 13, fontWeight: 600, cursor: acting ? "not-allowed" : "pointer",
                      fontFamily: "inherit",
                    }}
                  >
                    ✕ Decline
                  </button>
                </div>
              )}
            </div>
          </div>
          <div style={{ textAlign: "center", fontSize: 10, color: "#475569", marginTop: 4 }}>
            {fmt(m.created_at)}
          </div>
        </div>
      );
    }

    // ── job_accepted / job_declined / job_completed system notice ──
    if (["job_accepted", "job_declined", "job_completed"].includes(m.msg_type)) {
      const styles = {
        job_accepted:  { bg: "rgba(16,185,129,0.08)",  border: "rgba(16,185,129,0.2)",  color: "#34d399", icon: "✓" },
        job_declined:  { bg: "rgba(239,68,68,0.08)",   border: "rgba(239,68,68,0.2)",   color: "#f87171", icon: "✕" },
        job_completed: { bg: "rgba(167,139,250,0.08)", border: "rgba(167,139,250,0.2)", color: "#a78bfa", icon: "🏁" },
      }[m.msg_type];
      return (
        <div key={m.id} style={{ alignSelf: "center", width: "100%", maxWidth: 420, margin: "4px 0" }}>
          <div style={{
            padding: "10px 16px", borderRadius: 10, textAlign: "center",
            background: styles.bg, border: `1px solid ${styles.border}`,
            fontSize: 13, color: styles.color,
          }}>
            {styles.icon} {m.text}
          </div>
          <div style={{ textAlign: "center", fontSize: 10, color: "#475569", marginTop: 4 }}>
            {fmt(m.created_at)}
          </div>
        </div>
      );
    }

    // ── normal text bubble ──
    return (
      <div key={m.id} style={{ alignSelf: isMine ? "flex-end" : "flex-start", maxWidth: "65%" }}>
        <div style={{
          padding: "10px 14px", borderRadius: 12, fontSize: 14, lineHeight: 1.5,
          background: isMine ? "#38bdf8" : "#1e293b",
          color: isMine ? "#0a0f1a" : "#e2e8f0",
          borderBottomRightRadius: isMine ? 4 : 12,
          borderBottomLeftRadius:  isMine ? 12 : 4,
        }}>
          {m.text}
        </div>
        <div style={{
          fontSize: 10, marginTop: 4,
          color: isMine ? "rgba(10,15,26,0.5)" : "#475569",
          textAlign: isMine ? "right" : "left",
        }}>
          {fmt(m.created_at)}
        </div>
      </div>
    );
  };

  // ── layout ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ display: "flex", height: "calc(100vh - 64px)", alignItems: "center", justifyContent: "center", background: "#0a0f1a", color: "#475569" }}>
        Loading conversations…
      </div>
    );
  }

  return (
    <div style={{ display: "flex", height: "calc(100vh - 64px)", background: "#0a0f1a", color: "#e2e8f0", fontFamily: "'Inter', sans-serif" }}>

      {/* ── Sidebar ── */}
      <div style={{ width: 300, minWidth: 300, borderRight: "1px solid #1e293b", display: "flex", flexDirection: "column", background: "#0f1629" }}>
        <div style={{ padding: "20px", fontSize: 16, fontWeight: 600, borderBottom: "1px solid #1e293b", color: "#f1f5f9" }}>
          Messages
        </div>
        <div style={{ flex: 1, overflowY: "auto" }}>
          {convos.length === 0 ? (
            <div style={{ padding: 20, color: "#475569", fontSize: 13 }}>
              No conversations yet. Accept or post a job to start chatting!
            </div>
          ) : convos.map(c => (
            <div
              key={c.id}
              onClick={() => setActiveId(c.id)}
              style={{
                padding: "14px 20px", cursor: "pointer",
                borderBottom: "1px solid #1e293b",
                background: c.id === activeId ? "#1e293b" : "transparent",
                transition: "background 0.15s",
              }}
              onMouseEnter={e => { if (c.id !== activeId) e.currentTarget.style.background = "#151d30"; }}
              onMouseLeave={e => { if (c.id !== activeId) e.currentTarget.style.background = "transparent"; }}
            >
              <div style={{ fontWeight: 600, fontSize: 14, color: "#f1f5f9", marginBottom: 2 }}>
                {c.other_user_name}
              </div>
              {c.job_title && (
                <div style={{ fontSize: 11, color: "#38bdf8", marginBottom: 3, fontWeight: 500 }}>
                  📋 {c.job_title}
                </div>
              )}
              <div style={{ fontSize: 12, color: "#64748b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 240 }}>
                {c.last_message || "No messages yet"}
              </div>
              <div style={{ fontSize: 11, color: "#475569", marginTop: 3 }}>
                {fmt(c.last_message_at)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Chat area ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {!activeId ? (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "#475569", fontSize: 15, fontStyle: "italic" }}>
            Select a conversation to start chatting
          </div>
        ) : (
          <>
            {/* chat header */}
            <div style={{ padding: "16px 24px", borderBottom: "1px solid #1e293b", fontWeight: 600, fontSize: 16, color: "#f1f5f9", background: "#0f1629" }}>
              {activeConvo?.other_user_name || "Chat"}
              {activeConvo?.job_title && (
                <span style={{ marginLeft: 10, fontSize: 12, color: "#64748b", fontWeight: 400 }}>
                  · {activeConvo.job_title}
                </span>
              )}
            </div>

            {/* messages */}
            <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px", display: "flex", flexDirection: "column", gap: 8 }}>
              {messages.length === 0
                ? <div style={{ alignSelf: "center", color: "#475569", fontSize: 14, fontStyle: "italic" }}>No messages yet — say hello!</div>
                : messages.map(renderMessage)
              }
              <div ref={bottomRef} />
            </div>

            {/* input */}
            <div style={{ padding: "16px 24px", borderTop: "1px solid #1e293b", display: "flex", gap: 12, alignItems: "center", background: "#0f1629" }}>
              <textarea
                rows={1}
                placeholder="Type a message..."
                value={newMsg}
                onChange={e => setNewMsg(e.target.value)}
                onKeyDown={handleKeyDown}
                style={{ flex: 1, padding: "12px 16px", borderRadius: 8, border: "1px solid #1e293b", background: "#0a0f1a", color: "#e2e8f0", fontSize: 14, fontFamily: "inherit", outline: "none", resize: "none" }}
              />
              <button
                onClick={sendMessage}
                disabled={!newMsg.trim()}
                style={{
                  padding: "10px 20px", borderRadius: 8, border: "none",
                  background: "#38bdf8", color: "#0a0f1a",
                  fontWeight: 600, fontSize: 14, cursor: newMsg.trim() ? "pointer" : "not-allowed",
                  opacity: newMsg.trim() ? 1 : 0.5, fontFamily: "inherit",
                }}
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
