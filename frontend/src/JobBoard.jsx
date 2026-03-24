import { useState, useEffect } from "react";

const API_BASE = "http://localhost:8000/api";

const categoryFilters = ["All", "Lawn Care", "Snow Removal", "Groceries", "Cleaning", "Moving Help", "Handyman"];

const statusColors = {
  open:   { bg: "rgba(52, 211, 153, 0.12)",  color: "#34d399" },
  taken:  { bg: "rgba(251, 191, 36, 0.12)",  color: "#fbbf24" },
};
const statusLabels = { open: "Open", taken: "Taken" };

export default function JobBoard({ user, onNavigate }) {
  const [role, setRole]                     = useState("client");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery]       = useState("");
  const [hoveredJob, setHoveredJob]         = useState(null);
  const [jobs, setJobs]                     = useState([]);
  const [loading, setLoading]               = useState(true);
  const [error, setError]                   = useState(null);
  const [accepting, setAccepting]           = useState(null); // job id currently being accepted

  const authHeaders = { "Content-Type": "application/json", Authorization: `Bearer ${user?.token}` };

  // ── Fetch jobs ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchJobs = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_BASE}/jobs/`, { headers: authHeaders });
        if (!res.ok) throw new Error(`Server error: ${res.status}`);
        const data = await res.json();
        setJobs(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchJobs();
  }, []);

  // ── Accept job ──────────────────────────────────────────────────────────────
  const handleAccept = async (e, jobId) => {
    e.stopPropagation();
    setAccepting(jobId);
    try {
      const res = await fetch(`${API_BASE}/jobs/${jobId}/accept/`, {
        method: "POST",
        headers: authHeaders,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to accept job");
      // Optimistically update status in local state
      setJobs(prev =>
        prev.map(j => j.id === jobId ? { ...j, status: "taken" } : j)
      );
    } catch (err) {
      alert(err.message);
    } finally {
      setAccepting(null);
    }
  };

  // ── Filters ─────────────────────────────────────────────────────────────────
  const filteredJobs = jobs.filter(job => {
    const matchesCategory = selectedCategory === "All" || job.category === selectedCategory;
    const matchesSearch   = !searchQuery ||
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div style={{ minHeight: "100vh", background: "#0a0f1a", color: "#e2e8f0", fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>

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
            {filteredJobs.map(job => (
              <div key={job.id} onClick={() => navigate(`/job/${job.id}`)} onMouseEnter={() => setHoveredJob(job.id)} onMouseLeave={() => setHoveredJob(null)} style={{ padding: "20px 24px", borderRadius: "12px", background: hoveredJob === job.id ? "rgba(56,189,248,0.03)" : "#111827", border: hoveredJob === job.id ? "1px solid rgba(56,189,248,0.12)" : "1px solid rgba(56,189,248,0.04)", cursor: "pointer", transition: "all 0.15s ease" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
                      <span style={{ fontSize: "16px", fontWeight: 600, color: "#f1f5f9" }}>{job.title}</span>
                      <span style={{ padding: "2px 10px", borderRadius: "12px", background: (statusColors[job.status] || statusColors.open).bg, color: (statusColors[job.status] || statusColors.open).color, fontSize: "11px", fontWeight: 600 }}>
                        {statusLabels[job.status] || job.status}
                      </span>
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
                        {/* TODO: Wire to PUT /api/jobs/<id>/ */}
                        <button onClick={e => { e.stopPropagation(); }} style={{ padding: "6px 14px", borderRadius: "6px", border: "1px solid rgba(56,189,248,0.2)", background: "transparent", color: "#38bdf8", fontSize: "12px", fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}>Edit</button>
                        {/* TODO: Wire to DELETE /api/jobs/<id>/ */}
                        <button onClick={e => { e.stopPropagation(); }} style={{ padding: "6px 14px", borderRadius: "6px", border: "1px solid rgba(239,68,68,0.2)", background: "transparent", color: "#f87171", fontSize: "12px", fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}>Delete</button>
                      </div>
                    ) : (
                      /* ── WORKER ACTIONS ── */
                      <div>
                        {job.status === "open" && (
                          <button
                            onClick={e => handleAccept(e, job.id)}
                            disabled={accepting === job.id}
                            style={{ padding: "8px 18px", borderRadius: "8px", border: "none", background: accepting === job.id ? "#1e293b" : "linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%)", color: accepting === job.id ? "#64748b" : "#fff", fontSize: "12px", fontWeight: 600, cursor: accepting === job.id ? "not-allowed" : "pointer", fontFamily: "inherit", transition: "all 0.15s ease" }}
                          >
                            {accepting === job.id ? "Accepting…" : "Accept Job"}
                          </button>
                        )}
                        {job.status === "taken" && (
                          <button onClick={e => { e.stopPropagation(); onNavigate("myJobs"); }} style={{ padding: "8px 18px", borderRadius: "8px", border: "1px solid rgba(251,191,36,0.2)", background: "transparent", color: "#fbbf24", fontSize: "12px", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                            View in My Jobs →
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
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
