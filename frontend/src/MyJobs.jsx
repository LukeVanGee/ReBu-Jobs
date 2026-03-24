import { useState, useEffect } from "react";

// ============================================================
// BACKEND ENDPOINTS NEEDED (add to views.py + urls.py):
//
// PATCH /api/jobs/<id>/complete/   → mark job status='done'
//   views.py: change job.status = 'done'; job.save()
//   Model: add 'done' to STATUS_CHOICES
//
// PATCH /api/jobs/<id>/drop/       → worker drops job
//   views.py: job.assigned_to = None; job.status = 'open'; job.save()
//
// POST  /api/messages/             → send message to client
//   body: { job_id, recipient_id, content }
//   (requires a Message model — stub below)
//
// GET   /api/jobs/mine/            → jobs where assigned_to = request.user
//   views.py: Job.objects.filter(assigned_to=request.user)
// ============================================================

const API_BASE = "http://localhost:8000/api";

const statusColors = {
  taken:  { bg: "rgba(56,189,248,0.12)",  color: "#38bdf8",  label: "In Progress" },
  done:   { bg: "rgba(52,211,153,0.12)",  color: "#34d399",  label: "Complete"    },
  open:   { bg: "rgba(251,191,36,0.12)",  color: "#fbbf24",  label: "Dropped"     },
};

export default function MyJobs({ user, onNavigate }) {
  const [jobs, setJobs]             = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [activeTab, setActiveTab]   = useState("in_progress"); // "in_progress" | "completed"
  const [actionJob, setActionJob]   = useState(null);          // id of job with pending action
  const [msgModal, setMsgModal]     = useState(null);          // job object for message modal
  const [msgText, setMsgText]       = useState("");
  const [msgSending, setMsgSending] = useState(false);
  const [confirmDrop, setConfirmDrop] = useState(null);        // job id awaiting drop confirm

  const authHeaders = { "Content-Type": "application/json", Authorization: `Bearer ${user?.token}` };

  // ── Fetch worker's accepted jobs ──────────────────────────────────────────
  // TODO: swap to GET /api/jobs/mine/ once that endpoint exists.
  // For now we filter the full list client-side by assigned_to_id matching
  // the logged-in user's id (stored in localStorage as "userId").
  useEffect(() => {
    const fetchMyJobs = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_BASE}/jobs/`, { headers: authHeaders });
        if (!res.ok) throw new Error(`Server error: ${res.status}`);
        const data = await res.json();
        setJobs(data.filter(j => j.assigned_to_id === user?.id));
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchMyJobs();
  }, []);

  // ── Mark Complete ─────────────────────────────────────────────────────────
  const handleComplete = async (jobId) => {
    setActionJob(jobId);
    try {
      // TODO: PATCH /api/jobs/<id>/complete/  (endpoint not yet in views.py)
      const res = await fetch(`${API_BASE}/jobs/${jobId}/complete/`, {
        method: "PATCH",
        headers: authHeaders,
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed to mark complete");
      }
      setJobs(prev => prev.map(j => j.id === jobId ? { ...j, status: "done" } : j));
    } catch (err) {
      alert(err.message);
    } finally {
      setActionJob(null);
    }
  };

  // ── Drop Job ──────────────────────────────────────────────────────────────
  const handleDrop = async (jobId) => {
    setConfirmDrop(null);
    setActionJob(jobId);
    try {
      // TODO: PATCH /api/jobs/<id>/drop/  (endpoint not yet in views.py)
      const res = await fetch(`${API_BASE}/jobs/${jobId}/drop/`, {
        method: "PATCH",
        headers: authHeaders,
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed to drop job");
      }
      // Remove from list — job is open again on the board
      setJobs(prev => prev.filter(j => j.id !== jobId));
    } catch (err) {
      alert(err.message);
    } finally {
      setActionJob(null);
    }
  };

  // ── Send Message ─────────────────────────────────────────────────────────
  const handleSendMessage = async () => {
    if (!msgText.trim() || !msgModal) return;
    setMsgSending(true);
    try {
      // TODO: POST /api/messages/  (Message model + endpoint not yet created)
      const res = await fetch(`${API_BASE}/messages/`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
          job_id: msgModal.id,
          recipient_id: msgModal.posted_by_id,
          content: msgText.trim(),
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed to send message");
      }
      setMsgText("");
      setMsgModal(null);
    } catch (err) {
      alert(err.message);
    } finally {
      setMsgSending(false);
    }
  };

  const inProgress = jobs.filter(j => j.status === "taken");
  const completed  = jobs.filter(j => j.status === "done");
  const displayed  = activeTab === "in_progress" ? inProgress : completed;

  return (
    <div style={{ minHeight: "100vh", background: "#0a0f1a", color: "#e2e8f0", fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>

      {/* ── MAIN ───────────────────────────────────────────────────────────── */}
      <main style={{ maxWidth: "1120px", margin: "0 auto", padding: "32px 40px" }}>

        {/* Page Title */}
        <div style={{ marginBottom: "28px" }}>
          <h1 style={{ fontSize: "26px", fontWeight: 700, color: "#f1f5f9", margin: "0 0 4px 0" }}>My Jobs</h1>
          <p style={{ color: "#64748b", fontSize: "14px", margin: 0 }}>Jobs you've accepted as a worker</p>
        </div>

        {/* Stats Strip */}
        <div style={{ display: "flex", gap: "12px", marginBottom: "28px" }}>
          {[
            { label: "In Progress", value: inProgress.length, color: "#38bdf8" },
            { label: "Completed",   value: completed.length,  color: "#34d399" },
            { label: "Total Earned", value: completed.reduce((s, j) => s + (j.rate || 0), 0).toFixed(2), prefix: "$", color: "#a78bfa" },
          ].map(s => (
            <div key={s.label} style={{ flex: 1, padding: "16px 20px", borderRadius: "12px", background: "#111827", border: "1px solid rgba(56,189,248,0.06)" }}>
              <div style={{ fontSize: "12px", color: "#64748b", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px" }}>{s.label}</div>
              <div style={{ fontSize: "22px", fontWeight: 700, color: s.color }}>{s.prefix || ""}{s.value}</div>
            </div>
          ))}
        </div>

        {/* Tab Switch */}
        <div style={{ display: "flex", gap: "4px", background: "#111827", borderRadius: "10px", padding: "4px", border: "1px solid rgba(56,189,248,0.08)", width: "fit-content", marginBottom: "20px" }}>
          {[["in_progress", "🔧 In Progress"], ["completed", "✅ Completed"]].map(([key, label]) => (
            <button key={key} onClick={() => setActiveTab(key)} style={{ padding: "8px 22px", borderRadius: "8px", border: "none", background: activeTab === key ? "rgba(56,189,248,0.12)" : "transparent", color: activeTab === key ? "#38bdf8" : "#64748b", fontSize: "13px", fontWeight: 600, cursor: "pointer", transition: "all 0.15s ease", fontFamily: "inherit" }}>
              {label} {activeTab === key && <span style={{ marginLeft: "6px", background: "rgba(56,189,248,0.2)", borderRadius: "10px", padding: "1px 7px", fontSize: "11px" }}>{(key === "in_progress" ? inProgress : completed).length}</span>}
            </button>
          ))}
        </div>

        {/* ── JOB CARDS ──────────────────────────────────────────────────── */}
        {loading ? (
          <div style={{ padding: "60px 24px", borderRadius: "12px", background: "#111827", border: "1px solid rgba(56,189,248,0.06)", textAlign: "center", color: "#475569", fontSize: "14px" }}>Loading your jobs…</div>
        ) : error ? (
          <div style={{ padding: "60px 24px", borderRadius: "12px", background: "#111827", border: "1px solid rgba(239,68,68,0.1)", textAlign: "center", color: "#f87171", fontSize: "14px" }}>⚠️ {error}</div>
        ) : displayed.length === 0 ? (
          <div style={{ padding: "60px 24px", borderRadius: "12px", background: "#111827", border: "1px solid rgba(56,189,248,0.06)", textAlign: "center" }}>
            <div style={{ fontSize: "40px", marginBottom: "12px" }}>{activeTab === "in_progress" ? "🔧" : "✅"}</div>
            <p style={{ color: "#64748b", fontSize: "15px", margin: "0 0 8px 0" }}>No {activeTab === "in_progress" ? "active" : "completed"} jobs yet.</p>
            {activeTab === "in_progress" && (
              <button onClick={() => onNavigate("jobBoard")} style={{ padding: "10px 24px", borderRadius: "8px", border: "none", background: "linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%)", color: "#fff", fontSize: "13px", fontWeight: 600, cursor: "pointer", fontFamily: "inherit", marginTop: "8px" }}>
                Browse Job Board →
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {displayed.map(job => {
              const sc = statusColors[job.status] || statusColors.taken;
              return (
                <div key={job.id} style={{ padding: "20px 24px", borderRadius: "12px", background: "#111827", border: "1px solid rgba(56,189,248,0.06)", transition: "all 0.15s ease" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
                        <span style={{ fontSize: "16px", fontWeight: 600, color: "#f1f5f9" }}>{job.title}</span>
                        <span style={{ padding: "2px 10px", borderRadius: "12px", background: sc.bg, color: sc.color, fontSize: "11px", fontWeight: 600 }}>{sc.label}</span>
                      </div>
                      <p style={{ fontSize: "13px", color: "#94a3b8", margin: "0 0 10px 0", lineHeight: "1.4" }}>{job.description}</p>
                      <div style={{ display: "flex", gap: "16px", fontSize: "12px", color: "#64748b" }}>
                        <span>📂 {job.category}</span>
                        <span>📍 {job.location}</span>
                        <span>👤 {job.posted_by_name}</span>
                        <span>📅 {job.date_needed}</span>
                      </div>
                    </div>

                    <div style={{ textAlign: "right", marginLeft: "24px", minWidth: "120px" }}>
                      <div style={{ fontSize: "18px", fontWeight: 700, color: "#34d399", marginBottom: "12px" }}>${job.rate}/hr</div>

                      {/* ── ACTIONS (only for in-progress jobs) ── */}
                      {job.status === "taken" && (
                        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                          {/* View Details */}
                          <button onClick={() => onNavigate("jobBoard")} style={{ padding: "7px 14px", borderRadius: "7px", border: "1px solid rgba(56,189,248,0.2)", background: "transparent", color: "#38bdf8", fontSize: "12px", fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}>
                            View Details
                          </button>
                          {/* Message Client */}
                          <button onClick={() => setMsgModal(job)} style={{ padding: "7px 14px", borderRadius: "7px", border: "1px solid rgba(167,139,250,0.2)", background: "transparent", color: "#a78bfa", fontSize: "12px", fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}>
                            Message Client
                          </button>
                          {/* Mark Complete */}
                          <button onClick={() => handleComplete(job.id)} disabled={actionJob === job.id} style={{ padding: "7px 14px", borderRadius: "7px", border: "none", background: actionJob === job.id ? "#1e293b" : "linear-gradient(135deg,#10b981 0%,#06b6d4 100%)", color: actionJob === job.id ? "#475569" : "#fff", fontSize: "12px", fontWeight: 600, cursor: actionJob === job.id ? "not-allowed" : "pointer", fontFamily: "inherit" }}>
                            {actionJob === job.id ? "Saving…" : "Mark Complete"}
                          </button>
                          {/* Drop Job */}
                          <button onClick={() => setConfirmDrop(job.id)} style={{ padding: "7px 14px", borderRadius: "7px", border: "1px solid rgba(239,68,68,0.2)", background: "transparent", color: "#f87171", fontSize: "12px", fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}>
                            Drop Job
                          </button>
                        </div>
                      )}
                      {/* Completed — view only */}
                      {job.status === "done" && (
                        <button onClick={() => navigate(`/job/${job.id}`)} style={{ padding: "7px 14px", borderRadius: "7px", border: "1px solid rgba(56,189,248,0.2)", background: "transparent", color: "#38bdf8", fontSize: "12px", fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}>
                          View Details
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* ── DROP CONFIRM MODAL ─────────────────────────────────────────────── */}
      {confirmDrop && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, backdropFilter: "blur(4px)" }}>
          <div style={{ background: "#111827", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "14px", padding: "28px 32px", maxWidth: "380px", width: "90%" }}>
            <h3 style={{ color: "#f1f5f9", margin: "0 0 8px 0", fontSize: "17px", fontWeight: 600 }}>Drop this job?</h3>
            <p style={{ color: "#94a3b8", fontSize: "13px", margin: "0 0 24px 0", lineHeight: "1.5" }}>
              The job will be returned to the board and marked as open again. This can't be undone.
            </p>
            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button onClick={() => setConfirmDrop(null)} style={{ padding: "9px 20px", borderRadius: "8px", border: "1px solid rgba(56,189,248,0.15)", background: "transparent", color: "#94a3b8", fontSize: "13px", fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
              <button onClick={() => handleDrop(confirmDrop)} style={{ padding: "9px 20px", borderRadius: "8px", border: "none", background: "linear-gradient(135deg,#ef4444 0%,#dc2626 100%)", color: "#fff", fontSize: "13px", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Drop Job</button>
            </div>
          </div>
        </div>
      )}

      {/* ── MESSAGE MODAL ──────────────────────────────────────────────────── */}
      {msgModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, backdropFilter: "blur(4px)" }}>
          <div style={{ background: "#111827", border: "1px solid rgba(167,139,250,0.2)", borderRadius: "14px", padding: "28px 32px", maxWidth: "420px", width: "90%" }}>
            <h3 style={{ color: "#f1f5f9", margin: "0 0 4px 0", fontSize: "17px", fontWeight: 600 }}>Message Client</h3>
            <p style={{ color: "#64748b", fontSize: "13px", margin: "0 0 16px 0" }}>To: {msgModal.posted_by_name} · Re: {msgModal.title}</p>
            <textarea
              value={msgText}
              onChange={e => setMsgText(e.target.value)}
              placeholder="Write your message…"
              rows={4}
              style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid rgba(167,139,250,0.2)", background: "#0d1321", color: "#e2e8f0", fontSize: "13px", fontFamily: "inherit", resize: "vertical", outline: "none", boxSizing: "border-box" }}
            />
            <p style={{ color: "#475569", fontSize: "11px", margin: "6px 0 20px 0" }}>
              ⚠️ Messaging requires the <code style={{ color: "#a78bfa" }}>/api/messages/</code> endpoint — see TODO at top of file.
            </p>
            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button onClick={() => { setMsgModal(null); setMsgText(""); }} style={{ padding: "9px 20px", borderRadius: "8px", border: "1px solid rgba(56,189,248,0.15)", background: "transparent", color: "#94a3b8", fontSize: "13px", fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
              <button onClick={handleSendMessage} disabled={msgSending || !msgText.trim()} style={{ padding: "9px 20px", borderRadius: "8px", border: "none", background: msgSending || !msgText.trim() ? "#1e293b" : "linear-gradient(135deg,#7c3aed 0%,#6366f1 100%)", color: msgSending || !msgText.trim() ? "#475569" : "#fff", fontSize: "13px", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                {msgSending ? "Sending…" : "Send Message"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}