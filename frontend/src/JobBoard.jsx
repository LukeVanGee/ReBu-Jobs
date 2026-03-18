import { useState, useEffect } from "react";

const API_URL = "http://localhost:8000/api";

const CATEGORIES = [
  "All", "Plumbing", "Electrical", "Painting", "Carpentry", "Cleaning",
  "Landscaping", "Moving", "Appliance Repair", "Roofing", "General Handyman",
];

const URGENCY_DAYS = 2; // jobs needed within this many days are flagged urgent

function daysUntil(dateStr) {
  if (!dateStr) return null;
  const diff = (new Date(dateStr) - new Date()) / (1000 * 60 * 60 * 24);
  return Math.ceil(diff);
}

// ── tiny shared styles ──────────────────────────────────────────────────────
const pill = (bg, color) => ({
  display: "inline-flex", alignItems: "center",
  padding: "2px 8px", borderRadius: 20,
  background: bg, color, fontSize: 11, fontWeight: 600,
});

const cardBase = (hovered) => ({
  padding: "18px 20px", borderRadius: 12,
  background: hovered ? "rgba(56,189,248,0.04)" : "#111827",
  border: hovered ? "1px solid rgba(56,189,248,0.18)" : "1px solid rgba(56,189,248,0.06)",
  cursor: "pointer", transition: "all 0.15s ease",
  display: "flex", flexDirection: "column", gap: 10,
});

// ── Accept-job confirmation modal ───────────────────────────────────────────
const AcceptModal = ({ job, user, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  const confirm = async () => {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch(`${API_URL}/jobs/${job.id}/accept/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user?.token}`,
          "X-User-Name": user?.name || "",
          "X-User-Email": user?.email || "",
          "X-User-Role": user?.role || "", // added if backend is tracking who accepted, needs worker info
        },
      });
      const data = await res.json();
      if (res.ok) {
  onSuccess(data.job || { ...job, status: "accepted" }); // frontend should update the whole job record when accepted
} else {
  setErr(data.error || "Something went wrong.");
}
    } catch {
      setErr("Could not reach the server.");
    }
    setLoading(false);
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 200,
        background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 420, background: "#0d1526",
          border: "1px solid rgba(56,189,248,0.12)", borderRadius: 20,
          padding: 28, boxShadow: "0 24px 64px rgba(0,0,0,0.5)",
        }}
      >
        <div style={{ fontSize: 20, fontWeight: 700, color: "#f1f5f9", marginBottom: 8 }}>
          Accept this job?
        </div>
        <div style={{ fontSize: 14, color: "#94a3b8", marginBottom: 20, lineHeight: 1.6 }}>
          You're about to accept <strong style={{ color: "#e2e8f0" }}>"{job.title}"</strong>.
          The customer will be notified and you'll appear as the assigned worker.
        </div>

        {/* job summary */}
        <div style={{
          padding: "14px 16px", borderRadius: 10,
          background: "#111827", border: "1px solid rgba(56,189,248,0.07)",
          marginBottom: 20, display: "flex", flexDirection: "column", gap: 6,
        }}>
          {[
            ["📍", "Location", job.location],
            ["📅", "Date needed", job.date_needed],
            ["💰", "Pay", job.rate != null ? `$${job.rate}` : "—"],
          ].map(([icon, label, val]) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
              <span style={{ fontSize: 14 }}>{icon}</span>
              <span style={{ color: "#475569", minWidth: 90 }}>{label}</span>
              <span style={{ color: "#e2e8f0" }}>{val || "—"}</span>
            </div>
          ))}
        </div>

        {err && (
          <div style={{
            padding: "10px 14px", borderRadius: 8, marginBottom: 16,
            background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.25)",
            color: "#f87171", fontSize: 13,
          }}>✕ {err}</div>
        )}

        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={confirm}
            disabled={loading}
            style={{
              flex: 1, padding: "12px 0", borderRadius: 10, border: "none",
              background: "linear-gradient(135deg, #0ea5e9, #06b6d4)",
              color: "#fff", fontSize: 14, fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1, fontFamily: "inherit",
            }}
          >
            {loading ? "Accepting…" : "Confirm"}
          </button>
          <button
            onClick={onClose}
            style={{
              padding: "12px 20px", borderRadius: 10,
              border: "1px solid rgba(56,189,248,0.2)", background: "transparent",
              color: "#94a3b8", fontSize: 14, cursor: "pointer", fontFamily: "inherit",
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Main component ──────────────────────────────────────────────────────────
export default function JobBoard({ user }) {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("All");
  const [sortBy, setSortBy] = useState("newest"); // newest | pay_high | pay_low | soonest

  const [hoveredJob, setHoveredJob] = useState(null);
  const [acceptTarget, setAcceptTarget] = useState(null); // job being confirmed
  const [actionError, setActionError] = useState(null);
  const [completingId, setCompletingId] = useState(null); // removes old acceptedIds approach and gives state for errors

  const isWorker = user?.role === "worker";

  // ── fetch ──────────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      setLoading(true);
      setFetchError(null);
      try {
        const res = await fetch(`${API_URL}/jobs/`, {
          headers: { Authorization: `Bearer ${user?.token}` },
        });
        const data = await res.json();
        if (res.ok) setJobs(Array.isArray(data) ? data : data.results ?? []);
        else setFetchError(data.error || "Failed to load jobs.");
      } catch {
        setFetchError("Could not reach the server. Make sure Django is running.");
      }
      setLoading(false);
    })();
  }, [user?.token]);

  // ── filter + sort ──────────────────────────────────────────────────────
  const visible = jobs
    .filter(j => {
      const q = search.toLowerCase();
      const matchesSearch =
        j.title?.toLowerCase().includes(q) ||
        j.description?.toLowerCase().includes(q) ||
        j.location?.toLowerCase().includes(q);
      const matchesCat = catFilter === "All" || j.category === catFilter;
      return matchesSearch && matchesCat;
    })
    .sort((a, b) => {
      if (sortBy === "pay_high") return (b.rate ?? 0) - (a.rate ?? 0);
      if (sortBy === "pay_low")  return (a.rate ?? 0) - (b.rate ?? 0);
      if (sortBy === "soonest") return new Date(a.date_needed) - new Date(b.date_needed);
      // newest: fall back to id desc
      return b.id - a.id;
    });

const handleAcceptSuccess = (updatedJob) => {
  setJobs((prevJobs) =>
    prevJobs.map((job) => {
      if (job.id === updatedJob.id) {
        return {
          ...job,
          ...updatedJob,
          status: updatedJob.status || "accepted",
          assigned_worker_name:
            updatedJob.assigned_worker_name || user?.name || "",
          assigned_worker_email:
            updatedJob.assigned_worker_email || user?.email || "", // turns "accepted" into a real udpate on job card instead of only tracking id in a set
        };
      }

      return job;
    })
  );

  setAcceptTarget(null);
  setActionError(null);
};

const handleCompleteJob = async (jobId) => { // new fe feature for completing jobs
  setCompletingId(jobId);
  setActionError(null);

  try {
    const res = await fetch(`${API_URL}/jobs/${jobId}/complete/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${user?.token}`,
        "X-User-Name": user?.name || "",
        "X-User-Email": user?.email || "",
        "X-User-Role": user?.role || "",
      },
    });

    const data = await res.json();

    if (res.ok) {
      setJobs((prevJobs) =>
        prevJobs.map((job) => {
          if (job.id === jobId) {
            return {
              ...job,
              ...data.job,
              status: data.job?.status || "completed",
            };
          }

          return job;
        })
      );
    } else {
      setActionError(data.error || "Could not complete the job.");
    }
  } catch {
    setActionError("Could not reach the server.");
  }

  setCompletingId(null);
};
  
  // ── render ─────────────────────────────────────────────────────────────
  return (
    <div style={{ maxWidth: 1120, margin: "0 auto", padding: "32px 40px" }}>
      {acceptTarget && (
        <AcceptModal
          job={acceptTarget}
          user={user}
          onClose={() => setAcceptTarget(null)}
          onSuccess={handleAcceptSuccess}
        />
      )}

      {/* Page header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: "#f1f5f9", margin: "0 0 4px" }}>
          Job Board
        </h1>
        <p style={{ color: "#64748b", fontSize: 14, margin: 0 }}>
          {isWorker ? "Browse open requests and pick up work near you." : "All posted jobs — yours are highlighted."}
        </p>
      </div>

      {/* Filters row */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 20, alignItems: "center" }}>
        {/* Search */}
        <div style={{ position: "relative", flex: "1 1 240px", maxWidth: 360 }}>
          <input
            type="text"
            placeholder="Search jobs…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: "100%", padding: "10px 14px 10px 38px", borderRadius: 10,
              border: "1px solid rgba(56,189,248,0.12)", background: "#111827",
              color: "#e2e8f0", fontSize: 14, outline: "none",
              fontFamily: "inherit", boxSizing: "border-box",
            }}
            onFocus={e => e.target.style.borderColor = "rgba(56,189,248,0.35)"}
            onBlur={e => e.target.style.borderColor = "rgba(56,189,248,0.12)"}
          />
          <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#475569", fontSize: 16 }}>⌕</span>
        </div>

        {/* Category */}
        <select
          value={catFilter}
          onChange={e => setCatFilter(e.target.value)}
          style={{
            padding: "10px 14px", borderRadius: 10,
            border: "1px solid rgba(56,189,248,0.12)", background: "#111827",
            color: catFilter === "All" ? "#94a3b8" : "#e2e8f0",
            fontSize: 14, fontFamily: "inherit", cursor: "pointer", outline: "none",
          }}
        >
          {CATEGORIES.map(c => (
            <option key={c} value={c} style={{ background: "#111827", color: "#e2e8f0" }}>{c}</option>
          ))}
        </select>

        {/* Sort */}
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value)}
          style={{
            padding: "10px 14px", borderRadius: 10,
            border: "1px solid rgba(56,189,248,0.12)", background: "#111827",
            color: "#e2e8f0", fontSize: 14, fontFamily: "inherit",
            cursor: "pointer", outline: "none",
          }}
        >
          <option value="newest">Newest first</option>
          <option value="pay_high">Highest pay</option>
          <option value="pay_low">Lowest pay</option>
          <option value="soonest">Soonest needed</option>
        </select>

        {/* Result count */}
        <span style={{ fontSize: 13, color: "#475569", marginLeft: "auto" }}>
          {loading ? "Loading…" : `${visible.length} job${visible.length !== 1 ? "s" : ""}`}
        </span>
      </div>

      {/* States */}
      {loading && (
        <div style={{ textAlign: "center", padding: "60px 0", color: "#475569", fontSize: 14 }}>
          Loading jobs…
        </div>
      )}

      {!loading && fetchError && (
        <div style={{
          padding: "16px 20px", borderRadius: 10, marginBottom: 24,
          background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)",
          color: "#f87171", fontSize: 14,
        }}>
          ✕ {fetchError}
        </div>
      )}

      {!loading && !fetchError && visible.length === 0 && (
        <div style={{
          padding: "48px 24px", borderRadius: 12, textAlign: "center",
          background: "#111827", border: "1px solid rgba(56,189,248,0.06)",
          color: "#475569", fontSize: 14,
        }}>
          {jobs.length === 0 ? "No jobs posted yet." : "No jobs match your filters."}
        </div>
      )}

      {/* Job cards */}
      {!loading && !fetchError && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {visible.map(job => {
            const isOwn     = job.posted_by_id === user?.id || job.posted_by === user?.email;
            const isAssignedWorker = job.assigned_worker_email === user?.email; // stopped using accepted ids
            const days      = daysUntil(job.date_needed);
            const urgent    = days != null && days <= URGENCY_DAYS && days >= 0;

            return (
              <div
                key={job.id}
                onMouseEnter={() => setHoveredJob(job.id)}
                onMouseLeave={() => setHoveredJob(null)}
                style={cardBase(hoveredJob === job.id)}
              >
                {/* Top row */}
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}> 
                <span style={{ fontSize: 15, fontWeight: 600, color: "#f1f5f9" }}>{job.title}</span>
                {urgent && (
                  <span style={pill("rgba(239,68,68,0.12)", "#f87171")}>URGENT</span>
                )}
                {isOwn && (
                  <span style={pill("rgba(56,189,248,0.1)", "#38bdf8")}>Mine</span>
                )}
                {job.status === "available" && (
                  <span style={pill("rgba(52,211,153,0.12)", "#34d399")}>Available</span>
                )}
                {job.status === "accepted" && (
                  <span style={pill("rgba(56,189,248,0.12)", "#38bdf8")}>Accepted</span>
                )}
                {job.status === "completed" && (
                  <span style={pill("rgba(168,85,247,0.12)", "#c084fc")}>Completed</span>
                )}
                {job.status === "taken" && (
                  <span style={pill("rgba(56,189,248,0.12)", "#38bdf8")}>Accepted</span>
                )}
                  </div>
                  <span style={{ fontSize: 15, fontWeight: 700, color: "#34d399", whiteSpace: "nowrap" }}>
                    {job.rate != null ? `$${job.rate}` : "Negotiable"}
                  </span>
                </div>

                {/* Description */}
                {job.description && (
                  <p style={{
                    margin: 0, fontSize: 13, color: "#94a3b8", lineHeight: 1.55,
                    display: "-webkit-box", WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical", overflow: "hidden",
                  }}>
                    {job.description}
                  </p>
                )}

                {/* Meta row */}
                <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                  {[
                    job.category && { icon: "🏷", text: job.category },
                    job.location  && { icon: "📍", text: job.location },
                    job.date_needed && { icon: "📅", text: job.date_needed },
                  ].filter(Boolean).map(({ icon, text }) => (
                    <span key={text} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "#475569" }}>
                      <span style={{ fontSize: 13 }}>{icon}</span>{text}
                    </span>
                  ))}
                  {job.posted_by_name && (
                  <span style={{ fontSize: 12, color: "#475569", marginLeft: "auto" }}>
                    Posted by {job.posted_by_name}
                  </span>
                )}
                
                {job.assigned_worker_name && (
                  <span style={{ fontSize: 12, color: "#475569" }}>
                    Assigned to {job.assigned_worker_name}
                  </span>
                )}
                </div>

                {/* Action: workers only, open jobs */}
                {isWorker &&
                !isOwn &&
                (job.status === "available" || !job.status) && ( //removes dependence on deleted accepte dvariable and makes accept show for available jobs 
                  <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <button
                      onClick={e => { e.stopPropagation(); setAcceptTarget(job); }}
                      style={{
                        padding: "8px 18px", borderRadius: 8, border: "none",
                        background: "linear-gradient(135deg, #0ea5e9, #06b6d4)",
                        color: "#fff", fontSize: 13, fontWeight: 600,
                        cursor: "pointer", fontFamily: "inherit",
                      }}
                    >
                      Accept Job
                    </button>
                  </div>
                )}

{isWorker &&
  isAssignedWorker &&
  (job.status === "accepted" || job.status === "taken") && (
    <div style={{ display: "flex", justifyContent: "flex-end" }}>
      <button
        onClick={e => { e.stopPropagation(); handleCompleteJob(job.id); }}
        style={{
          padding: "8px 18px",
          borderRadius: 8,
          border: "none",
          background: "linear-gradient(135deg, #22c55e, #16a34a)",
          color: "#fff",
          fontSize: 13,
          fontWeight: 600,
          cursor: "pointer",
          fontFamily: "inherit",
        }}
      >
        {completingId === job.id ? "Completing..." : "Complete Job"}
      </button>
    </div>
)}
                
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
