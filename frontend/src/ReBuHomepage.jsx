import { useState } from "react";
import CreateJobRequest from "./CreateJobRequest";
import JobBoard from "./JobBoard";

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

// ============================================================
// PROFILE MODAL
// TODO: Replace mock stats with GET /api/profile/:userId
// Expected shape: { jobsCompleted, qualityRating, avgPay, reviewCount, accountRating }
// ============================================================
const ProfileModal = ({ user, onClose }) => {
  const profileStats = {
    jobsCompleted: 0,
    qualityRating: null,
    avgPay: null,
    reviewCount: 0,
    accountRating: null,
  };

  const isWorker = user?.role === "worker";

  const StarRow = ({ rating }) => (
    <div style={{ display: "flex", gap: 3, marginTop: 4 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <span key={i} style={{ fontSize: 16, color: rating && i <= Math.round(rating) ? "#f59e0b" : "#334155" }}>★</span>
      ))}
    </div>
  );

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
          width: "100%", maxWidth: 400,
          background: "#0d1526",
          border: "1px solid rgba(56,189,248,0.12)",
          borderRadius: 20, padding: 28, position: "relative",
          boxShadow: "0 24px 64px rgba(0,0,0,0.5)",
        }}
      >
        <button onClick={onClose} style={{
          position: "absolute", top: 16, right: 16,
          width: 32, height: 32, borderRadius: "50%",
          border: "1px solid rgba(56,189,248,0.15)",
          background: "rgba(56,189,248,0.06)",
          color: "#94a3b8", fontSize: 16, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>×</button>

        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
          <div style={{
            width: 64, height: 64, borderRadius: "50%",
            background: "linear-gradient(135deg, #0ea5e9, #06b6d4)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 26, fontWeight: 700, color: "#fff", flexShrink: 0,
          }}>
            {user?.name?.[0]?.toUpperCase() || "U"}
          </div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 700, color: "#f1f5f9", marginBottom: 6 }}>
              {user?.name || "User"}
            </div>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 5,
              padding: "4px 10px", borderRadius: 20,
              background: isWorker ? "rgba(16,185,129,0.12)" : "rgba(56,189,248,0.1)",
              color: isWorker ? "#34d399" : "#38bdf8",
              fontSize: 13, fontWeight: 600,
            }}>
              {isWorker ? "🔧" : "🏠"} {isWorker ? "Worker" : "Customer"}
            </div>
          </div>
        </div>

        <div style={{
          padding: "16px 18px", borderRadius: 12,
          background: "#111827", border: "1px solid rgba(56,189,248,0.07)",
          marginBottom: 20,
        }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "#475569", letterSpacing: "0.8px", textTransform: "uppercase", marginBottom: 4 }}>
            Account Rating
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: 26, fontWeight: 700, color: "#f59e0b" }}>
                {profileStats.accountRating ?? "N/A"}
              </div>
              <StarRow rating={profileStats.accountRating} />
            </div>
            <div style={{ fontSize: 13, color: "#475569", marginTop: 4 }}>
              {profileStats.reviewCount} review{profileStats.reviewCount !== 1 ? "s" : ""}
            </div>
          </div>
        </div>

        {isWorker && (
          <>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#475569", letterSpacing: "0.8px", textTransform: "uppercase", marginBottom: 12 }}>
              Worker Stats
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
              {[
                { icon: "✅", value: profileStats.jobsCompleted, label: "Jobs Completed" },
                { icon: "🏆", value: profileStats.qualityRating ?? "N/A", label: "Quality Rating" },
              ].map(s => (
                <div key={s.label} style={{
                  padding: "18px 12px", borderRadius: 12, textAlign: "center",
                  background: "#111827", border: "1px solid rgba(56,189,248,0.07)",
                }}>
                  <div style={{ fontSize: 28, marginBottom: 6 }}>{s.icon}</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: "#f1f5f9", marginBottom: 2 }}>{s.value}</div>
                  <div style={{ fontSize: 11, color: "#475569", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>{s.label}</div>
                </div>
              ))}
            </div>
            <div style={{
              padding: "18px 12px", borderRadius: 12, textAlign: "center",
              background: "#111827", border: "1px solid rgba(56,189,248,0.07)",
              marginBottom: 20,
            }}>
              <div style={{ fontSize: 28, marginBottom: 6 }}>💰</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: "#f1f5f9", marginBottom: 2 }}>
                {profileStats.avgPay ? `$${profileStats.avgPay}` : "N/A"}
              </div>
              <div style={{ fontSize: 11, color: "#475569", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>Avg. Pay</div>
            </div>
          </>
        )}

        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "13px 16px", borderRadius: 10,
          background: "#111827", border: "1px solid rgba(56,189,248,0.07)",
          fontSize: 13, color: "#94a3b8",
        }}>
          <span style={{ fontSize: 14 }}>✉</span>
          {user?.email || "No email on file"}
        </div>
      </div>
    </div>
  );
};

// ============================================================
// SHARED HEADER
// Extracted so it can be reused across all page views
// ============================================================
const AppHeader = ({ activePage, user, onNavigate, onProfileOpen, profileOpen, onLogout, onProfileModalOpen }) => {
  const navItems = ["Home", "Job Board", "Post a Job"];

  return (
    <header style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "0 40px", height: 64,
      background: "linear-gradient(180deg, #0d1526 0%, #0a1220 100%)",
      borderBottom: "1px solid rgba(56,189,248,0.08)",
      position: "sticky", top: 0, zIndex: 100, backdropFilter: "blur(12px)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
        <div
          onClick={() => onNavigate("home")}
          style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.5px", cursor: "pointer" }}
        >
          <span style={{ color: "#e2e8f0" }}>Re</span>
          <span style={{ color: "#38bdf8" }}>Bu</span>
        </div>

        <nav style={{ display: "flex", gap: 4 }}>
          {navItems.map(item => {
            const isActive =
              (item === "Home" && activePage === "home") ||
              (item === "Job Board" && activePage === "jobBoard") ||
              (item === "Post a Job" && activePage === "createJob");
            return (
              <button
                key={item}
                onClick={() => {
                  if (item === "Post a Job") onNavigate("createJob");
                  else if (item === "Job Board") onNavigate("jobBoard");
                  else onNavigate("home");
                }}
                style={{
                  padding: "8px 16px", borderRadius: 8, border: "none",
                  background: isActive ? "rgba(56,189,248,0.1)" : "transparent",
                  color: isActive ? "#38bdf8" : "#94a3b8",
                  fontSize: 14, fontWeight: 500, cursor: "pointer",
                  transition: "all 0.15s ease", fontFamily: "inherit",
                }}
                onMouseEnter={e => { if (!isActive) e.target.style.color = "#cbd5e1"; }}
                onMouseLeave={e => { if (!isActive) e.target.style.color = "#94a3b8"; }}
              >
                {item}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Right side — profile dropdown */}
      <div style={{ position: "relative" }}>
        <button
          onClick={() => onProfileOpen(!profileOpen)}
          style={{
            width: 36, height: 36, borderRadius: "50%",
            border: profileOpen ? "2px solid #38bdf8" : "2px solid #1e293b",
            background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
            color: "#94a3b8", fontSize: 14, fontWeight: 600, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "all 0.15s ease", fontFamily: "inherit",
          }}
        >
          {user?.name?.[0]?.toUpperCase() || "U"}
        </button>

        {profileOpen && (
          <div style={{
            position: "absolute", top: 46, right: 0, width: 200,
            background: "#111827", border: "1px solid rgba(56,189,248,0.1)",
            borderRadius: 10, padding: 8,
            boxShadow: "0 16px 48px rgba(0,0,0,0.4)",
          }}>
            {user && (
              <div style={{ padding: "10px 14px", borderBottom: "1px solid rgba(56,189,248,0.08)", marginBottom: 4 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#e2e8f0" }}>{user.name}</div>
                <div style={{ fontSize: 12, color: "#64748b" }}>{user.email}</div>
              </div>
            )}
            {["My Profile", "My Jobs", "Ratings", "Settings"].map(item => (
              <button
                key={item}
                onClick={() => {
                  if (item === "My Profile") {
                    onProfileModalOpen(true);
                    onProfileOpen(false);
                  }
                }}
                style={{
                  display: "block", width: "100%", padding: "10px 14px",
                  border: "none", background: "transparent", color: "#cbd5e1",
                  fontSize: 13, textAlign: "left", borderRadius: 6,
                  cursor: "pointer", fontFamily: "inherit", transition: "all 0.1s ease",
                }}
                onMouseEnter={e => { e.target.style.background = "rgba(56,189,248,0.08)"; e.target.style.color = "#38bdf8"; }}
                onMouseLeave={e => { e.target.style.background = "transparent"; e.target.style.color = "#cbd5e1"; }}
              >
                {item}
              </button>
            ))}
            {onLogout && (
              <div style={{ borderTop: "1px solid rgba(56,189,248,0.08)", marginTop: 4, paddingTop: 4 }}>
                <button
                  onClick={onLogout}
                  style={{
                    display: "block", width: "100%", padding: "10px 14px",
                    border: "none", background: "transparent", color: "#f87171",
                    fontSize: 13, textAlign: "left", borderRadius: 6,
                    cursor: "pointer", fontFamily: "inherit",
                  }}
                  onMouseEnter={e => e.target.style.background = "rgba(239,68,68,0.08)"}
                  onMouseLeave={e => e.target.style.background = "transparent"}
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

// ============================================================
// ROOT COMPONENT
// ============================================================
export default function ReBuHomepage({ user, onLogout }) {
  const [page, setPage] = useState("home");
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [hoveredCategory, setHoveredCategory] = useState(null);
  const [hoveredJob, setHoveredJob] = useState(null);

  const navigate = (p) => {
    setPage(p);
    setProfileOpen(false);
  };

  const sharedHeaderProps = {
    activePage: page,
    user,
    onNavigate: navigate,
    onProfileOpen: setProfileOpen,
    profileOpen,
    onLogout,
    onProfileModalOpen: setProfileModalOpen,
  };

  // ── Create Job page ──────────────────────────────────────────────────────
  if (page === "createJob") {
    return (
      <CreateJobRequest
        user={user}
        onBack={() => navigate("home")}
      />
    );
  }

  // ── Job Board page ───────────────────────────────────────────────────────
  if (page === "jobBoard") {
    return (
      <div style={{
        minHeight: "100vh", background: "#0a0f1a", color: "#e2e8f0",
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}>
        {profileModalOpen && (
          <ProfileModal user={user} onClose={() => setProfileModalOpen(false)} />
        )}
        <AppHeader {...sharedHeaderProps} />
        <JobBoard user={user} />
      </div>
    );
  }

  // ── Home page ────────────────────────────────────────────────────────────
  return (
    <div style={{
      minHeight: "100vh", background: "#0a0f1a", color: "#e2e8f0",
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    }}>
      {profileModalOpen && (
        <ProfileModal user={user} onClose={() => setProfileModalOpen(false)} />
      )}

      <AppHeader {...sharedHeaderProps} />

      <main style={{ maxWidth: 1120, margin: "0 auto", padding: "32px 40px" }}>

        {/* Welcome & Search */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: "#f1f5f9", margin: "0 0 4px" }}>
            Welcome back{user ? `, ${user.name}` : ""}
          </h1>
          <p style={{ color: "#64748b", fontSize: 14, margin: "0 0 20px" }}>
            Find help or pick up a job nearby
          </p>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <div style={{ position: "relative", flex: 1, maxWidth: 480 }}>
              <input
                type="text"
                placeholder="Search for jobs, skills, or people..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  width: "100%", padding: "12px 16px 12px 42px", borderRadius: 10,
                  border: "1px solid rgba(56,189,248,0.12)", background: "#111827",
                  color: "#e2e8f0", fontSize: 14, outline: "none",
                  fontFamily: "inherit", boxSizing: "border-box", transition: "border-color 0.15s ease",
                }}
                onFocus={e => e.target.style.borderColor = "rgba(56,189,248,0.35)"}
                onBlur={e => e.target.style.borderColor = "rgba(56,189,248,0.12)"}
              />
              <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#475569", fontSize: 16 }}>⌕</span>
            </div>
            <button
              onClick={() => navigate("createJob")}
              style={{
                padding: "12px 20px", borderRadius: 10, border: "none",
                background: "linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%)",
                color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer",
                fontFamily: "inherit", whiteSpace: "nowrap", transition: "opacity 0.15s",
              }}
              onMouseEnter={e => e.target.style.opacity = "0.9"}
              onMouseLeave={e => e.target.style.opacity = "1"}
            >
              + Post a Job
            </button>
          </div>
        </div>

        {/* Stats Row */}
        {stats.length > 0 ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 36 }}>
            {stats.map(stat => (
              <div key={stat.label} style={{
                padding: 20, borderRadius: 12,
                background: "linear-gradient(135deg, #111827 0%, #0f172a 100%)",
                border: "1px solid rgba(56,189,248,0.06)",
              }}>
                <div style={{ fontSize: 12, color: "#64748b", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>{stat.label}</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: "#f1f5f9", marginBottom: 2 }}>{stat.value}</div>
                <div style={{ fontSize: 12, color: "#38bdf8" }}>{stat.trend}</div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ padding: 24, borderRadius: 12, background: "#111827", border: "1px solid rgba(56,189,248,0.06)", textAlign: "center", color: "#475569", fontSize: 14, marginBottom: 36 }}>
            Stats will appear here once connected to the backend.
          </div>
        )}

        {/* Job Categories */}
        <div style={{ marginBottom: 36 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h2 style={{ fontSize: 17, fontWeight: 600, color: "#f1f5f9", margin: 0 }}>Browse Categories</h2>
            <button
              onClick={() => navigate("jobBoard")}
              style={{ background: "none", border: "none", color: "#38bdf8", fontSize: 13, cursor: "pointer", fontFamily: "inherit", fontWeight: 500 }}
            >
              View all →
            </button>
          </div>
          {jobCategories.length > 0 ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
              {jobCategories.map(cat => (
                <div
                  key={cat.id}
                  onMouseEnter={() => setHoveredCategory(cat.id)}
                  onMouseLeave={() => setHoveredCategory(null)}
                  onClick={() => navigate("jobBoard")}
                  style={{
                    padding: "18px 20px", borderRadius: 12,
                    background: hoveredCategory === cat.id ? "rgba(56,189,248,0.05)" : "#111827",
                    border: hoveredCategory === cat.id ? "1px solid rgba(56,189,248,0.15)" : "1px solid rgba(56,189,248,0.04)",
                    cursor: "pointer", transition: "all 0.15s ease",
                    display: "flex", alignItems: "center", gap: 14,
                  }}
                >
                  <span style={{ fontSize: 28 }}>{cat.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#e2e8f0", marginBottom: 2 }}>{cat.name}</div>
                    <div style={{ fontSize: 12, color: "#64748b" }}>{cat.desc}</div>
                  </div>
                  <div style={{ padding: "4px 10px", borderRadius: 20, background: "rgba(56,189,248,0.08)", color: "#38bdf8", fontSize: 12, fontWeight: 600 }}>{cat.count}</div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: "40px 24px", borderRadius: 12, background: "#111827", border: "1px solid rgba(56,189,248,0.06)", textAlign: "center", color: "#475569", fontSize: 14 }}>
              Job categories will appear here once connected to the backend.
            </div>
          )}
        </div>

        {/* Recent Jobs */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h2 style={{ fontSize: 17, fontWeight: 600, color: "#f1f5f9", margin: 0 }}>Recent Jobs Near You</h2>
            <button
              onClick={() => navigate("jobBoard")}
              style={{ background: "none", border: "none", color: "#38bdf8", fontSize: 13, cursor: "pointer", fontFamily: "inherit", fontWeight: 500 }}
            >
              See all jobs →
            </button>
          </div>
          {recentJobs.length > 0 ? (
            <div style={{ borderRadius: 12, border: "1px solid rgba(56,189,248,0.06)", overflow: "hidden" }}>
              {recentJobs.map((job, i) => (
                <div
                  key={job.id}
                  onMouseEnter={() => setHoveredJob(job.id)}
                  onMouseLeave={() => setHoveredJob(null)}
                  onClick={() => navigate("jobBoard")}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px",
                    background: hoveredJob === job.id ? "rgba(56,189,248,0.03)" : i % 2 === 0 ? "#0d1321" : "#111827",
                    borderBottom: i < recentJobs.length - 1 ? "1px solid rgba(56,189,248,0.04)" : "none",
                    cursor: "pointer", transition: "all 0.1s ease",
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                      <span style={{ fontSize: 14, fontWeight: 500, color: "#e2e8f0" }}>{job.title}</span>
                      {job.urgency && (
                        <span style={{ padding: "2px 8px", borderRadius: 4, background: "rgba(239,68,68,0.12)", color: "#f87171", fontSize: 11, fontWeight: 600 }}>{job.urgency}</span>
                      )}
                    </div>
                    <div style={{ fontSize: 12, color: "#64748b" }}>
                      {job.category} · Posted by {job.postedBy} · {job.time}
                    </div>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#34d399", whiteSpace: "nowrap" }}>{job.budget}</div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: "40px 24px", borderRadius: 12, background: "#111827", border: "1px solid rgba(56,189,248,0.06)", textAlign: "center", color: "#475569", fontSize: 14 }}>
              Recent jobs will appear here once connected to the backend.
            </div>
          )}
        </div>

      </main>
    </div>
  );
}
