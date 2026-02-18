import { useState } from "react";
import { useNavigate } from "react-router-dom";

// ============================================================
// API INTEGRATION POINTS
// Replace this empty array with an API call to your Django backend.
// GET /api/jobs/ (or equivalent Supabase query)
// Expected shape per item:
// {
//   id: number,
//   title: string,
//   description: string,
//   category: string,
//   budget: string,
//   postedBy: string,
//   postedByRating: number,
//   time: string,
//   urgency: string | null,
//   status: "open" | "accepted" | "in_progress" | "completed",
//   location: string
// }
// ============================================================
const jobs = [];

const categoryFilters = ["All", "Lawn Care", "Snow Removal", "Groceries", "Cleaning", "Moving Help", "Handyman"];

const statusColors = {
  open: { bg: "rgba(52, 211, 153, 0.12)", color: "#34d399" },
  accepted: { bg: "rgba(56, 189, 248, 0.12)", color: "#38bdf8" },
  in_progress: { bg: "rgba(251, 191, 36, 0.12)", color: "#fbbf24" },
  completed: { bg: "rgba(148, 163, 184, 0.12)", color: "#94a3b8" },
};

const statusLabels = {
  open: "Open",
  accepted: "Accepted",
  in_progress: "In Progress",
  completed: "Completed",
};

export default function JobBoard() {
  const navigate = useNavigate();
  const [role, setRole] = useState("client"); // "client" or "worker"
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [hoveredJob, setHoveredJob] = useState(null);

  // Filter jobs by category and search query
  const filteredJobs = jobs.filter((job) => {
    const matchesCategory = selectedCategory === "All" || job.category === selectedCategory;
    const matchesSearch =
      !searchQuery ||
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0a0f1a",
      color: "#e2e8f0",
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    }}>
      {/* ===================== HEADER ===================== */}
      <header style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 40px",
        height: "64px",
        background: "linear-gradient(180deg, #0d1526 0%, #0a1220 100%)",
        borderBottom: "1px solid rgba(56, 189, 248, 0.08)",
        position: "sticky",
        top: 0,
        zIndex: 100,
        backdropFilter: "blur(12px)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "32px" }}>
          <div
            onClick={() => navigate("/home")}
            style={{ fontSize: "22px", fontWeight: 700, letterSpacing: "-0.5px", cursor: "pointer" }}
          >
            <span style={{ color: "#e2e8f0" }}>Re</span>
            <span style={{ color: "#38bdf8" }}>Bu</span>
          </div>
          <nav style={{ display: "flex", gap: "4px" }}>
            {[
              { label: "Home", path: "/home" },
              { label: "Job Board", path: "/job-board" },
              { label: "Post a Job", path: "/post-job" },
            ].map((item) => (
              <button
                key={item.label}
                onClick={() => navigate(item.path)}
                style={{
                  padding: "8px 16px",
                  borderRadius: "8px",
                  border: "none",
                  background: item.label === "Job Board" ? "rgba(56, 189, 248, 0.1)" : "transparent",
                  color: item.label === "Job Board" ? "#38bdf8" : "#94a3b8",
                  fontSize: "14px",
                  fontWeight: 500,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  fontFamily: "inherit",
                }}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <button style={{ padding: "8px 20px", borderRadius: "8px", border: "1px solid rgba(56, 189, 248, 0.25)", background: "transparent", color: "#38bdf8", fontSize: "13px", fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}>Log In</button>
          <button style={{ padding: "8px 20px", borderRadius: "8px", border: "none", background: "linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%)", color: "#fff", fontSize: "13px", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Sign Up</button>
        </div>
      </header>

      {/* ===================== MAIN CONTENT ===================== */}
      <main style={{ maxWidth: "1120px", margin: "0 auto", padding: "32px 40px" }}>

        {/* Page Title & Role Toggle */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
          <div>
            <h1 style={{ fontSize: "26px", fontWeight: 700, color: "#f1f5f9", margin: "0 0 4px 0" }}>
              Job Board
            </h1>
            <p style={{ color: "#64748b", fontSize: "14px", margin: 0 }}>
              {role === "client" ? "Manage your posted jobs" : "Find jobs near you"}
            </p>
          </div>

          {/* Client / Worker Toggle */}
          <div style={{
            display: "flex",
            background: "#111827",
            borderRadius: "10px",
            padding: "4px",
            border: "1px solid rgba(56, 189, 248, 0.08)",
          }}>
            {["client", "worker"].map((r) => (
              <button
                key={r}
                onClick={() => setRole(r)}
                style={{
                  padding: "8px 20px",
                  borderRadius: "8px",
                  border: "none",
                  background: role === r ? "rgba(56, 189, 248, 0.12)" : "transparent",
                  color: role === r ? "#38bdf8" : "#64748b",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  fontFamily: "inherit",
                  textTransform: "capitalize",
                }}
              >
                {r === "client" ? "🏠 Client" : "🔧 Worker"}
              </button>
            ))}
          </div>
        </div>

        {/* Search & Filters */}
        <div style={{ display: "flex", gap: "16px", marginBottom: "24px", alignItems: "center", flexWrap: "wrap" }}>
          {/* Search */}
          <div style={{ position: "relative", flex: "1", minWidth: "250px", maxWidth: "400px" }}>
            <input
              type="text"
              placeholder="Search jobs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 16px 10px 38px",
                borderRadius: "10px",
                border: "1px solid rgba(56, 189, 248, 0.12)",
                background: "#111827",
                color: "#e2e8f0",
                fontSize: "14px",
                outline: "none",
                fontFamily: "inherit",
                boxSizing: "border-box",
              }}
            />
            <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#475569", fontSize: "15px" }}>⌕</span>
          </div>

          {/* Category Filters */}
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            {categoryFilters.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                style={{
                  padding: "7px 14px",
                  borderRadius: "8px",
                  border: selectedCategory === cat ? "1px solid rgba(56, 189, 248, 0.3)" : "1px solid rgba(56, 189, 248, 0.06)",
                  background: selectedCategory === cat ? "rgba(56, 189, 248, 0.1)" : "#111827",
                  color: selectedCategory === cat ? "#38bdf8" : "#64748b",
                  fontSize: "12px",
                  fontWeight: 500,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  fontFamily: "inherit",
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* ===================== JOB LIST ===================== */}
        {filteredJobs.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {filteredJobs.map((job) => (
              <div
                key={job.id}
                onClick={() => navigate(`/job/${job.id}`)}
                onMouseEnter={() => setHoveredJob(job.id)}
                onMouseLeave={() => setHoveredJob(null)}
                style={{
                  padding: "20px 24px",
                  borderRadius: "12px",
                  background: hoveredJob === job.id ? "rgba(56, 189, 248, 0.03)" : "#111827",
                  border: hoveredJob === job.id ? "1px solid rgba(56, 189, 248, 0.12)" : "1px solid rgba(56, 189, 248, 0.04)",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
                      <span style={{ fontSize: "16px", fontWeight: 600, color: "#f1f5f9" }}>{job.title}</span>
                      {job.urgency && (
                        <span style={{
                          padding: "2px 8px", borderRadius: "4px",
                          background: "rgba(239, 68, 68, 0.12)", color: "#f87171",
                          fontSize: "11px", fontWeight: 600,
                        }}>{job.urgency}</span>
                      )}
                      <span style={{
                        padding: "2px 10px", borderRadius: "12px",
                        background: (statusColors[job.status] || statusColors.open).bg,
                        color: (statusColors[job.status] || statusColors.open).color,
                        fontSize: "11px", fontWeight: 600,
                      }}>
                        {statusLabels[job.status] || job.status}
                      </span>
                    </div>
                    <p style={{ fontSize: "13px", color: "#94a3b8", margin: "0 0 8px 0", lineHeight: "1.4" }}>
                      {job.description}
                    </p>
                    <div style={{ display: "flex", gap: "16px", fontSize: "12px", color: "#64748b" }}>
                      <span>📂 {job.category}</span>
                      <span>📍 {job.location}</span>
                      <span>👤 {job.postedBy} ({job.postedByRating}★)</span>
                      <span>🕐 {job.time}</span>
                    </div>
                  </div>
                  <div style={{ textAlign: "right", marginLeft: "20px" }}>
                    <div style={{ fontSize: "18px", fontWeight: 700, color: "#34d399", marginBottom: "8px" }}>
                      {job.budget}
                    </div>
                    {/* Different action buttons based on role */}
                    {role === "client" ? (
                      <div style={{ display: "flex", gap: "6px" }}>
                        {/* TODO: Wire to PUT /api/jobs/{job.id} */}
                        <button
                          onClick={(e) => { e.stopPropagation(); /* TODO: Edit job */ }}
                          style={{
                            padding: "6px 14px", borderRadius: "6px", border: "1px solid rgba(56, 189, 248, 0.2)",
                            background: "transparent", color: "#38bdf8", fontSize: "12px", fontWeight: 500,
                            cursor: "pointer", fontFamily: "inherit",
                          }}
                        >Edit</button>
                        {/* TODO: Wire to DELETE /api/jobs/{job.id} */}
                        <button
                          onClick={(e) => { e.stopPropagation(); /* TODO: Delete job */ }}
                          style={{
                            padding: "6px 14px", borderRadius: "6px", border: "1px solid rgba(239, 68, 68, 0.2)",
                            background: "transparent", color: "#f87171", fontSize: "12px", fontWeight: 500,
                            cursor: "pointer", fontFamily: "inherit",
                          }}
                        >Delete</button>
                      </div>
                    ) : (
                      <div>
                        {job.status === "open" && (
                          /* TODO: Wire to POST /api/jobs/{job.id}/accept */
                          <button
                            onClick={(e) => { e.stopPropagation(); /* TODO: Accept job */ }}
                            style={{
                              padding: "8px 18px", borderRadius: "8px", border: "none",
                              background: "linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%)",
                              color: "#fff", fontSize: "12px", fontWeight: 600,
                              cursor: "pointer", fontFamily: "inherit",
                            }}
                          >Accept Job</button>
                        )}
                        {job.status === "accepted" || job.status === "in_progress" ? (
                          <span style={{ fontSize: "12px", color: "#fbbf24", fontWeight: 500 }}>In Progress</span>
                        ) : null}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{
            padding: "60px 24px",
            borderRadius: "12px",
            background: "#111827",
            border: "1px solid rgba(56, 189, 248, 0.06)",
            textAlign: "center",
          }}>
            <div style={{ fontSize: "40px", marginBottom: "12px" }}>📋</div>
            <p style={{ color: "#64748b", fontSize: "15px", margin: "0 0 4px 0" }}>
              No jobs to display yet.
            </p>
            <p style={{ color: "#475569", fontSize: "13px", margin: 0 }}>
              Jobs will appear here once connected to the backend.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}