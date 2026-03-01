import { useState } from "react";
import { useNavigate } from "react-router-dom";

// ============================================================
// API INTEGRATION POINTS
// Replace these empty arrays with actual API calls to your
// Django backend / Supabase. Each section notes what shape
// the data should take.
// ============================================================

// GET /api/categories (or equivalent Supabase query)
// Expected shape per item:
// { id: number, name: string, icon: string, count: number, desc: string }
const jobCategories = [];

// GET /api/jobs/recent (or equivalent Supabase query)
// Expected shape per item:
// { id: number, title: string, category: string, budget: string,
//   postedBy: string, time: string, urgency: string | null }
const recentJobs = [];

// GET /api/stats (or equivalent Supabase query)
// Expected shape per item:
// { label: string, value: string, trend: string }
const stats = [];

export default function ReBuHomepage() {
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [hoveredCategory, setHoveredCategory] = useState(null);
  const [hoveredJob, setHoveredJob] = useState(null);

  const navItems = [
    { label: "Home", path: "/home" },
    { label: "Job Board", path: "/job-board" },
    { label: "Post a Job", path: "/post-job" },
  ];

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
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "32px" }}>
          <div
            onClick={() => navigate("/home")}
            style={{
              fontSize: "22px",
              fontWeight: 700,
              letterSpacing: "-0.5px",
              cursor: "pointer",
            }}
          >
            <span style={{ color: "#e2e8f0" }}>Re</span>
            <span style={{ color: "#38bdf8" }}>Bu</span>
          </div>

          {/* Nav Links — wired to React Router routes */}
          <nav style={{ display: "flex", gap: "4px" }}>
            {navItems.map((item) => (
              <button
                key={item.label}
                onClick={() => navigate(item.path)}
                style={{
                  padding: "8px 16px",
                  borderRadius: "8px",
                  border: "none",
                  background: item.label === "Home" ? "rgba(56, 189, 248, 0.1)" : "transparent",
                  color: item.label === "Home" ? "#38bdf8" : "#94a3b8",
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

        {/* Right Side — Auth Buttons & Profile */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          {/* Wire to your login route */}
          <button
            onClick={() => navigate("/login")}
            style={{
              padding: "8px 20px",
              borderRadius: "8px",
              border: "1px solid rgba(56, 189, 248, 0.25)",
              background: "transparent",
              color: "#38bdf8",
              fontSize: "13px",
              fontWeight: 500,
              cursor: "pointer",
              transition: "all 0.15s ease",
              fontFamily: "inherit",
            }}
            onMouseEnter={(e) => {
              e.target.style.background = "rgba(56, 189, 248, 0.08)";
            }}
            onMouseLeave={(e) => {
              e.target.style.background = "transparent";
            }}
          >
            Log In
          </button>
          {/* Wire to your signup route */}
          <button
            onClick={() => navigate("/login")}
            style={{
              padding: "8px 20px",
              borderRadius: "8px",
              border: "none",
              background: "linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%)",
              color: "#fff",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.15s ease",
              fontFamily: "inherit",
            }}
            onMouseEnter={(e) => {
              e.target.style.opacity = "0.9";
            }}
            onMouseLeave={(e) => {
              e.target.style.opacity = "1";
            }}
          >
            Sign Up
          </button>

          {/* Profile Dropdown */}
          {/* TODO: Replace "U" with user's initial from auth context */}
          <div style={{ position: "relative" }}>
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                border: profileOpen ? "2px solid #38bdf8" : "2px solid #1e293b",
                background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
                color: "#94a3b8",
                fontSize: "14px",
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.15s ease",
                fontFamily: "inherit",
              }}
            >
              U
            </button>
            {profileOpen && (
              <div style={{
                position: "absolute",
                top: "46px",
                right: 0,
                width: "200px",
                background: "#111827",
                border: "1px solid rgba(56, 189, 248, 0.1)",
                borderRadius: "10px",
                padding: "8px",
                boxShadow: "0 16px 48px rgba(0,0,0,0.4)",
              }}>
                {/* Wire each item to its respective route */}
                {["My Profile", "My Jobs", "Ratings", "Settings"].map((item) => (
                  <button
                    key={item}
                    style={{
                      display: "block",
                      width: "100%",
                      padding: "10px 14px",
                      border: "none",
                      background: "transparent",
                      color: "#cbd5e1",
                      fontSize: "13px",
                      textAlign: "left",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontFamily: "inherit",
                      transition: "all 0.1s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = "rgba(56, 189, 248, 0.08)";
                      e.target.style.color = "#38bdf8";
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = "transparent";
                      e.target.style.color = "#cbd5e1";
                    }}
                  >
                    {item}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ===================== MAIN CONTENT ===================== */}
      <main style={{ maxWidth: "1120px", margin: "0 auto", padding: "32px 40px" }}>

        {/* Welcome & Search */}
        {/* TODO: Replace "Welcome back" with user's name from auth context */}
        <div style={{ marginBottom: "32px" }}>
          <h1 style={{
            fontSize: "26px",
            fontWeight: 700,
            color: "#f1f5f9",
            margin: "0 0 4px 0",
          }}>
            Welcome back
          </h1>
          <p style={{ color: "#64748b", fontSize: "14px", margin: "0 0 20px 0" }}>
            Find help or pick up a job nearby
          </p>
          {/* TODO: Wire search to GET /api/jobs?q={searchQuery} */}
          <div style={{ position: "relative", maxWidth: "480px" }}>
            <input
              type="text"
              placeholder="Search for jobs, skills, or people..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                padding: "12px 16px 12px 42px",
                borderRadius: "10px",
                border: "1px solid rgba(56, 189, 248, 0.12)",
                background: "#111827",
                color: "#e2e8f0",
                fontSize: "14px",
                outline: "none",
                fontFamily: "inherit",
                boxSizing: "border-box",
                transition: "border-color 0.15s ease",
              }}
              onFocus={(e) => e.target.style.borderColor = "rgba(56, 189, 248, 0.35)"}
              onBlur={(e) => e.target.style.borderColor = "rgba(56, 189, 248, 0.12)"}
            />
            <span style={{
              position: "absolute",
              left: "14px",
              top: "50%",
              transform: "translateY(-50%)",
              color: "#475569",
              fontSize: "16px",
            }}>⌕</span>
          </div>
        </div>

        {/* ===================== STATS ROW ===================== */}
        {/* Populated from stats array — see API integration point above */}
        {stats.length > 0 ? (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "16px",
            marginBottom: "36px",
          }}>
            {stats.map((stat) => (
              <div key={stat.label} style={{
                padding: "20px",
                borderRadius: "12px",
                background: "linear-gradient(135deg, #111827 0%, #0f172a 100%)",
                border: "1px solid rgba(56, 189, 248, 0.06)",
              }}>
                <div style={{ fontSize: "12px", color: "#64748b", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px" }}>
                  {stat.label}
                </div>
                <div style={{ fontSize: "24px", fontWeight: 700, color: "#f1f5f9", marginBottom: "2px" }}>
                  {stat.value}
                </div>
                <div style={{ fontSize: "12px", color: "#38bdf8" }}>
                  {stat.trend}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{
            padding: "24px",
            borderRadius: "12px",
            background: "#111827",
            border: "1px solid rgba(56, 189, 248, 0.06)",
            textAlign: "center",
            color: "#475569",
            fontSize: "14px",
            marginBottom: "36px",
          }}>
            Stats will appear here once connected to the backend.
          </div>
        )}

        {/* ===================== JOB CATEGORIES ===================== */}
        {/* Populated from jobCategories array — see API integration point above */}
        <div style={{ marginBottom: "36px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h2 style={{ fontSize: "17px", fontWeight: 600, color: "#f1f5f9", margin: 0 }}>
              Browse Categories
            </h2>
            <button
              onClick={() => navigate("/job-board")}
              style={{
                background: "none",
                border: "none",
                color: "#38bdf8",
                fontSize: "13px",
                cursor: "pointer",
                fontFamily: "inherit",
                fontWeight: 500,
              }}
            >View all →</button>
          </div>
          {jobCategories.length > 0 ? (
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "12px",
            }}>
              {jobCategories.map((cat) => (
                <div
                  key={cat.id}
                  onMouseEnter={() => setHoveredCategory(cat.id)}
                  onMouseLeave={() => setHoveredCategory(null)}
                  style={{
                    padding: "18px 20px",
                    borderRadius: "12px",
                    background: hoveredCategory === cat.id ? "rgba(56, 189, 248, 0.05)" : "#111827",
                    border: hoveredCategory === cat.id ? "1px solid rgba(56, 189, 248, 0.15)" : "1px solid rgba(56, 189, 248, 0.04)",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                    display: "flex",
                    alignItems: "center",
                    gap: "14px",
                  }}
                >
                  <span style={{ fontSize: "28px" }}>{cat.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "14px", fontWeight: 600, color: "#e2e8f0", marginBottom: "2px" }}>
                      {cat.name}
                    </div>
                    <div style={{ fontSize: "12px", color: "#64748b" }}>{cat.desc}</div>
                  </div>
                  <div style={{
                    padding: "4px 10px",
                    borderRadius: "20px",
                    background: "rgba(56, 189, 248, 0.08)",
                    color: "#38bdf8",
                    fontSize: "12px",
                    fontWeight: 600,
                  }}>
                    {cat.count}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{
              padding: "40px 24px",
              borderRadius: "12px",
              background: "#111827",
              border: "1px solid rgba(56, 189, 248, 0.06)",
              textAlign: "center",
              color: "#475569",
              fontSize: "14px",
            }}>
              Job categories will appear here once connected to the backend.
            </div>
          )}
        </div>

        {/* ===================== RECENT JOBS ===================== */}
        {/* Populated from recentJobs array — see API integration point above */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h2 style={{ fontSize: "17px", fontWeight: 600, color: "#f1f5f9", margin: 0 }}>
              Recent Jobs Near You
            </h2>
            <button
              onClick={() => navigate("/job-board")}
              style={{
                background: "none",
                border: "none",
                color: "#38bdf8",
                fontSize: "13px",
                cursor: "pointer",
                fontFamily: "inherit",
                fontWeight: 500,
              }}
            >See all jobs →</button>
          </div>
          {recentJobs.length > 0 ? (
            <div style={{
              borderRadius: "12px",
              border: "1px solid rgba(56, 189, 248, 0.06)",
              overflow: "hidden",
            }}>
              {recentJobs.map((job, i) => (
                <div
                  key={job.id}
                  onMouseEnter={() => setHoveredJob(job.id)}
                  onMouseLeave={() => setHoveredJob(null)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "16px 20px",
                    background: hoveredJob === job.id ? "rgba(56, 189, 248, 0.03)" : i % 2 === 0 ? "#0d1321" : "#111827",
                    borderBottom: i < recentJobs.length - 1 ? "1px solid rgba(56, 189, 248, 0.04)" : "none",
                    cursor: "pointer",
                    transition: "all 0.1s ease",
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "3px" }}>
                      <span style={{ fontSize: "14px", fontWeight: 500, color: "#e2e8f0" }}>{job.title}</span>
                      {job.urgency && (
                        <span style={{
                          padding: "2px 8px",
                          borderRadius: "4px",
                          background: "rgba(239, 68, 68, 0.12)",
                          color: "#f87171",
                          fontSize: "11px",
                          fontWeight: 600,
                        }}>{job.urgency}</span>
                      )}
                    </div>
                    <div style={{ fontSize: "12px", color: "#64748b" }}>
                      {job.category} · Posted by {job.postedBy} · {job.time}
                    </div>
                  </div>
                  <div style={{
                    fontSize: "14px",
                    fontWeight: 600,
                    color: "#34d399",
                    whiteSpace: "nowrap",
                  }}>
                    {job.budget}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{
              padding: "40px 24px",
              borderRadius: "12px",
              background: "#111827",
              border: "1px solid rgba(56, 189, 248, 0.06)",
              textAlign: "center",
              color: "#475569",
              fontSize: "14px",
            }}>
              Recent jobs will appear here once connected to the backend.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}