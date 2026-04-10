import { useState, useEffect } from "react";

const API_BASE = "http://localhost:8000/api";

const categoryFilters = ["All", "Lawn Care", "Snow Removal", "Groceries", "Cleaning", "Moving Help", "Handyman"];

const statusColors = {
  open:    { bg: "rgba(52, 211, 153, 0.12)",  color: "#34d399" },
  pending: { bg: "rgba(251, 191, 36, 0.12)",  color: "#fbbf24" },
  taken:   { bg: "rgba(239, 68, 68, 0.12)",   color: "#f87171" },
};
const statusLabels = {
  open:    "Open",
  pending: "Pending Approval",
  taken:   "Taken",
};

export default function JobBoard({ user, onNavigate }) {
  const [role, setRole]                         = useState("client");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery]           = useState("");
  const [hoveredJob, setHoveredJob]             = useState(null);
  const [jobs, setJobs]                         = useState([]);
  const [loading, setLoading]                   = useState(true);
  const [error, setError]                       = useState(null);
  const [requesting, setRequesting]             = useState(null);
  const [toast, setToast]                       = useState(null);
  const [workerAddress, setWorkerAddress]        = useState("");

  const authHeaders = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${user?.token}`,
  };

  // ── helpers ──────────────────────────────────────────────────────────────
  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  // ── fetch jobs ────────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchJobs = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_BASE}/jobs/`, { headers: authHeaders });
        if (!res.ok) throw new Error(`Server error: ${res.status}`);
        setJobs(await res.json());
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchJobs();
  }, []);

  // ── request job (worker) ──────────────────────────────────────────────────
  const handleRequest = async (e, jobId) => {
    e.stopPropagation();
    if (!workerAddress.trim()) {
      showToast("Please enter your address first.", "error");
      return;
    }
    setRequesting(jobId);
    try {
      const res = await fetch(`${API_BASE}/jobs/${jobId}/request/`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({ worker_address: workerAddress }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to request job");

      setJobs(prev =>
        prev.map(j => j.id === jobId ? { ...j, status: "pending" } : j)
      );
      showToast("Request sent! The customer will be notified.");
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setRequesting(null);
    }
  };

  // ── filters ───────────────────────────────────────────────────────────────
  const filteredJobs = jobs.filter(job => {
    if (job.status === "done") return false;
    const matchesCategory = selectedCategory === "All" || job.category === selectedCategory;
    const matchesSearch   = !searchQuery ||
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });


  return (
    <div style={{ minHeight: "100vh", background: "#0a0f1a", color: "#e2e8f0", fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>

      {/* ── TOAST ──────────────────────────────────────────────────────────── */}
      {toast && (
        <div style={{
          position: "fixed", bottom: 28, left: "50%", transform: "translateX(-50%)",
          zIndex: 300, padding: "12px 22px", borderRadius: 10, fontSize: 13, fontWeight: 500,
          background: toast.type === "error" ? "rgba(239,68,68,0.15)" : "rgba(52,211,153,0.15)",
          border: `1px solid ${toast.type === "error" ? "rgba(239,68,68,0.3)" : "rgba(52,211,153,0.3)"}`,
          color: toast.type === "error" ? "#f87171" : "#34d399",
          backdropFilter: "blur(8px)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
        }}>
          {toast.type === "error" ? "⚠️" : "✅"} {toast.msg}
        </div>
      )}

      {/* ── MAIN ───────────────────────────────────────────────────────────── */}
      <main style={{ maxWidth: "1120px", margin: "0 auto", padding: "32px 40px" }}>

        {/* Title + Role Toggle */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
          <div>
            <h1 style={{ fontSize: "26px", fontWeight: 700, color: "#f1f5f9", margin: "0 0 4px 0" }}>Job Board</h1>
            <p style={{ color: "#64748b", fontSize: "14px", margin: 0 }}>
              {role === "client" ? "Manage your posted jobs" : "Find jobs near you"}
            </p>
          </div>
          <div style={{ display: "flex", background: "#111827", borderRadius: "10px", padding: "4px", border: "1px solid rgba(56,189,248,0.08)" }}>
            {["client", "worker"].map(r => (
              <button key={r} onClick={() => setRole(r)} style={{ padding: "8px 20px", borderRadius: "8px", border: "none", background: role === r ? "rgba(56,189,248,0.12)" : "transparent", color: role === r ? "#38bdf8" : "#64748b", fontSize: "13px", fontWeight: 600, cursor: "pointer", transition: "all 0.15s ease", fontFamily: "inherit", textTransform: "capitalize" }}>
                {r === "client" ? "🏠 Client" : "🔧 Worker"}
              </button>
            ))}
          </div>
        </div>

        {/* ── WORKER ADDRESS INPUT ─────────────────────────────────────────── */}
        {role === "worker" && (
          <div style={{ marginBottom: "16px" }}>
            <input
              type="text"
              placeholder="Enter your address (e.g. 123 Main St, Syracuse, NY)"
              value={workerAddress}
              onChange={e => setWorkerAddress(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 16px",
                borderRadius: "10px",
                border: "1px solid rgba(56,189,248,0.12)",
                background: "#111827",
                color: "#e2e8f0",
                fontSize: "14px",
                outline: "none",
                fontFamily: "inherit",
                boxSizing: "border-box",
              }}
            />
          </div>
        )}

        {/* Search + Filters */}
        <div style={{ display: "flex", gap: "16px", marginBottom: "24px", alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ position: "relative", flex: "1", minWidth: "250px", maxWidth: "400px" }}>
            <input type="text" placeholder="Search jobs..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ width: "100%", padding: "10px 16px 10px 38px", borderRadius: "10px", border: "1px solid rgba(56,189,248,0.12)", background: "#111827", color: "#e2e8f0", fontSize: "14px", outline: "none", fontFamily: "inherit", boxSizing: "border-box" }} />
            <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#475569", fontSize: "15px" }}>⌕</span>
          </div>
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            {categoryFilters.map(cat => (
              <button key={cat} onClick={() => setSelectedCategory(cat)} style={{ padding: "7px 14px", borderRadius: "8px", border: selectedCategory === cat ? "1px solid rgba(56,189,248,0.3)" : "1px solid rgba(56,189,248,0.06)", background: selectedCategory === cat ? "rgba(56,189,248,0.1)" : "#111827", color: selectedCategory === cat ? "#38bdf8" : "#64748b", fontSize: "12px", fontWeight: 500, cursor: "pointer", transition: "all 0.15s ease", fontFamily: "inherit" }}>
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* ── JOB LIST ─────────────────────────────────────────────────────── */}
        {loading ? (
          <div style={{ padding: "60px 24px", borderRadius: "12px", background: "#111827", border: "1px solid rgba(56,189,248,0.06)", textAlign: "center", color: "#475569", fontSize: "14px" }}>
            Loading jobs…
          </div>
        ) : error ? (
          <div style={{ padding: "60px 24px", borderRadius: "12px", background: "#111827", border: "1px solid rgba(239,68,68,0.1)", textAlign: "center", color: "#f87171", fontSize: "14px" }}>
            ⚠️ {error}
          </div>
        ) : filteredJobs.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {filteredJobs.map(job => {
              const sc = statusColors[job.status] || statusColors.open;
              const isPending = job.status === "pending";
              const isMyRequest = isPending && job.assigned_to === user?.id;

              return (
                <div key={job.id}
                  onClick={() => console.log("View job", job.id)}
                  onMouseEnter={() => setHoveredJob(job.id)}
                  onMouseLeave={() => setHoveredJob(null)}
                  style={{
                    padding: "20px 24px", borderRadius: "12px",
                    background: hoveredJob === job.id ? "rgba(56,189,248,0.03)" : "#111827",
                    border: hoveredJob === job.id ? "1px solid rgba(56,189,248,0.12)" : "1px solid rgba(56,189,248,0.04)",
                    cursor: "pointer", transition: "all 0.15s ease",
                    opacity: isPending && !isMyRequest ? 0.55 : 1,
                  }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
                        <span style={{ fontSize: "16px", fontWeight: 600, color: "#f1f5f9" }}>{job.title}</span>
                        <span style={{ padding: "2px 10px", borderRadius: "12px", background: sc.bg, color: sc.color, fontSize: "11px", fontWeight: 600 }}>
                          {statusLabels[job.status] || job.status}
                        </span>
                        {isMyRequest && (
                          <span style={{ padding: "2px 10px", borderRadius: "12px", background: "rgba(167,139,250,0.12)", color: "#a78bfa", fontSize: "11px", fontWeight: 600 }}>
                            Your Request
                          </span>
                        )}
                      </div>
                      <p style={{ fontSize: "13px", color: "#94a3b8", margin: "0 0 8px 0", lineHeight: "1.4" }}>{job.description}</p>
                      <div style={{ display: "flex", gap: "16px", fontSize: "12px", color: "#64748b" }}>
                        <span>📂 {job.category}</span>
                        <span>📍 {job.location}</span>
                        <span>👤 {job.posted_by_name}</span>
                        <span>📅 {job.date_needed}</span>
                      </div>
                    </div>

                    <div style={{ textAlign: "right", marginLeft: "20px" }}>
                      <div style={{ fontSize: "18px", fontWeight: 700, color: "#34d399", marginBottom: "8px" }}>
                        ${job.rate}/hr
                      </div>

                      {/* ── CLIENT ACTIONS ── */}
                      {role === "client" ? (
                        <div style={{ display: "flex", gap: "6px" }}>
                          <button onClick={e => e.stopPropagation()} style={{ padding: "6px 14px", borderRadius: "6px", border: "1px solid rgba(56,189,248,0.2)", background: "transparent", color: "#38bdf8", fontSize: "12px", fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}>Edit</button>
                          <button onClick={e => e.stopPropagation()} style={{ padding: "6px 14px", borderRadius: "6px", border: "1px solid rgba(239,68,68,0.2)", background: "transparent", color: "#f87171", fontSize: "12px", fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}>Delete</button>
                        </div>
                      ) : (
                        /* ── WORKER ACTIONS ── */
                        <div>
                          {job.status === "open" && (
                            <button
                              onClick={e => handleRequest(e, job.id)}
                              disabled={requesting === job.id}
                              style={{
                                padding: "8px 18px", borderRadius: "8px", border: "none",
                                background: requesting === job.id ? "#1e293b" : "linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%)",
                                color: requesting === job.id ? "#64748b" : "#fff",
                                fontSize: "12px", fontWeight: 600,
                                cursor: requesting === job.id ? "not-allowed" : "pointer",
                                fontFamily: "inherit", transition: "all 0.15s ease",
                              }}
                            >
                              {requesting === job.id ? "Sending…" : "Request Job"}
                            </button>
                          )}

                          {isMyRequest && (
                            <button
                              onClick={e => { e.stopPropagation(); onNavigate("messages"); }}
                              style={{
                                padding: "8px 18px", borderRadius: "8px",
                                border: "1px solid rgba(167,139,250,0.3)",
                                background: "transparent", color: "#a78bfa",
                                fontSize: "12px", fontWeight: 600, cursor: "pointer",
                                fontFamily: "inherit",
                              }}
                            >
                              View in Messages →
                            </button>
                          )}

                          {isPending && !isMyRequest && (
                            <span style={{ fontSize: "12px", color: "#475569", fontStyle: "italic" }}>
                              Awaiting approval
                            </span>
                          )}

                          {job.status === "taken" && (
                            <button onClick={e => { e.stopPropagation(); onNavigate("myJobs"); }} style={{ padding: "8px 18px", borderRadius: "8px", border: "1px solid rgba(239,68,68,0.2)", background: "transparent", color: "#f87171", fontSize: "12px", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                              Taken
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ padding: "60px 24px", borderRadius: "12px", background: "#111827", border: "1px solid rgba(56,189,248,0.06)", textAlign: "center" }}>
            <div style={{ fontSize: "40px", marginBottom: "12px" }}>📋</div>
            <p style={{ color: "#64748b", fontSize: "15px", margin: "0 0 4px 0" }}>No jobs found.</p>
            <p style={{ color: "#475569", fontSize: "13px", margin: 0 }}>Try adjusting your filters or search query.</p>
          </div>
        )}
      </main>
    </div>
  );
}