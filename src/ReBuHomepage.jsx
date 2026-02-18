import { useState } from "react";
import CreateJobRequest from "./CreateJobRequest";

// ============================================================
// API INTEGRATION POINTS
// Replace these empty arrays with actual API calls to your
// Django backend / Supabase. Each section notes what shape
// the data should take.
// ============================================================

// GET /api/categories
// { id: number, name: string, icon: string, count: number, desc: string }
const jobCategories = [];

// GET /api/jobs/recent
// { id: number, title: string, category: string, budget: string,
//   postedBy: string, time: string, urgency: string | null }
const recentJobs = [];

// GET /api/stats
// { label: string, value: string, trend: string }
const stats = [];

export default function ReBuHomepage({ user, onLogout }) {
  const [page, setPage] = useState("home");
  const [activeNav, setActiveNav] = useState("Home");
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [hoveredCategory, setHoveredCategory] = useState(null);
  const [hoveredJob, setHoveredJob] = useState(null);

  const navItems = ["Home", "Job Board", "Post a Job"];

  // Render Create Job page
  if (page === "createJob") {
    return <CreateJobRequest user={user} onBack={() => { setPage("home"); setActiveNav("Home"); }} />;
  }

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
          <div style={{
            fontSize: "22px",
            fontWeight: 700,
            letterSpacing: "-0.5px",
            cursor: "pointer",
          }}>
            <span style={{ color: "#e2e8f0" }}>Re</span>
            <span style={{ color: "#38bdf8" }}>Bu</span>
          </div>

          {/* Nav Links */}
          <nav style={{ display: "flex", gap: "4px" }}>
            {navItems.map((item) => (
              <button
                key={item}
                onClick={() => {
                  if (item === "Post a Job") {
                    setPage("createJob");
                  } else {
                    setActiveNav(item);
                  }
                }}
                style={{
                  padding: "8px 16px",
                  borderRadius: "8px",
                  border: "none",
                  background: activeNav === item ? "rgba(56, 189, 248, 0.1)" : "transparent",
                  color: activeNav === item ? "#38bdf8" : "#94a3b8",
                  fontSize: "14px",
                  fontWeight: 500,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  fontFamily: "inherit",
                }}
                onMouseEnter={(e) => {
                  if (activeNav !== item) e.target.style.color = "#cbd5e1";
                }}
                onMouseLeave={(e) => {
                  if (activeNav !== item) e.target.style.color = "#94a3b8";
                }}
              >
                {item}
              </button>
            ))}
          </nav>
        </div>

        {/* Right Side */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          {/* Profile Dropdown */}
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
              {user?.name?.[0]?.toUpperCase() || "U"}
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
                {user && (
                  <div style={{ padding: "10px 14px", borderBottom: "1px solid rgba(56,189,248,0.08)", marginBottom: 4 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#e2e8f0" }}>{user.name}</div>
                    <div style={{ fontSize: 12, color: "#64748b" }}>{user.email}</div>
                  </div>
                )}
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
                {onLogout && (
                  <div style={{ borderTop: "1px solid rgba(56,189,248,0.08)", marginTop: 4, paddingTop: 4 }}>
                    <button
                      onClick={onLogout}
                      style={{
                        display: "block",
                        width: "100%",
                        padding: "10px 14px",
                        border: "none",
                        background: "transparent",
                        color: "#f87171",
                        fontSize: "13px",
                        textAlign: "left",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontFamily: "inherit",
                      }}
                      onMouseEnter={(e) => e.target.style.background = "rgba(239,68,68,0.08)"}
                      onMouseLeave={(e) => e.target.style.background = "transparent"}
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ===================== MAIN CONTENT ===================== */}
      <main style={{ maxWidth: "1120px", margin: "0 auto", padding: "32px 40px" }}>

        {/* Welcome & Search */}
        <div style={{ marginBottom: "32px" }}>
          <h1 style={{
            fontSize: "26px",
            fontWeight: 700,
            color: "#f1f5f9",
            margin: "0 0 4px 0",
          }}>
            Welcome back{user ? `, ${user.name}` : ""}
          </h1>
          <p style={{ color: "#64748b", fontSize: "14px", margin: "0 0 20px 0" }}>
            Find help or pick up a job nearby
          </p>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <div style={{ position: "relative", flex: 1, maxWidth: "480px" }}>
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
            <button
              onClick={() => setPage("createJob")}
              style={{
                padding: "12px 20px",
                borderRadius: "10px",
                border: "none",
                background: "linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%)",
                color: "#fff",
                fontSize: "14px",
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "inherit",
                whiteSpace: "nowrap",
                transition: "opacity 0.15s",
              }}
              onMouseEnter={(e) => e.target.style.opacity = "0.9"}
              onMouseLeave={(e) => e.target.style.opacity = "1"}
            >
              + Post a Job
            </button>
          </div>
        </div>

        {/* ===================== STATS ROW ===================== */}
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
        <div style={{ marginBottom: "36px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h2 style={{ fontSize: "17px", fontWeight: 600, color: "#f1f5f9", margin: 0 }}>
              Browse Categories
            </h2>
            <button style={{
              background: "none",
              border: "none",
              color: "#38bdf8",
              fontSize: "13px",
              cursor: "pointer",
              fontFamily: "inherit",
              fontWeight: 500,
            }}>View all →</button>
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
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h2 style={{ fontSize: "17px", fontWeight: 600, color: "#f1f5f9", margin: 0 }}>
              Recent Jobs Near You
            </h2>
            <button style={{
              background: "none",
              border: "none",
              color: "#38bdf8",
              fontSize: "13px",
              cursor: "pointer",
              fontFamily: "inherit",
              fontWeight: 500,
            }}>See all jobs →</button>
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