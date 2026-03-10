import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { createJob, getJobById, updateJob } from "../utils/jobStore";

const CATEGORIES = [
  "Lawn Care", "Snow Removal", "Groceries", "Cleaning",
  "Moving Help", "Handyman", "Plumbing", "Electrical",
  "Painting", "Carpentry", "Appliance Repair", "Roofing",
];

const Field = ({ label, required, error, children }) => (
  <div style={{ marginBottom: 20 }}>
    <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#94a3b8", marginBottom: 6 }}>
      {label} {required && <span style={{ color: "#f87171" }}>*</span>}
    </label>
    {children}
    {error && <p style={{ color: "#f87171", fontSize: 12, margin: "4px 0 0 2px" }}>{error}</p>}
  </div>
);

const inputStyle = (error) => ({
  width: "100%",
  padding: "12px 14px",
  borderRadius: 10,
  border: `1px solid ${error ? "rgba(248,113,113,0.5)" : "rgba(56,189,248,0.12)"}`,
  background: error ? "rgba(248,113,113,0.05)" : "#111827",
  color: "#e2e8f0",
  fontSize: 14,
  outline: "none",
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  boxSizing: "border-box",
  transition: "border-color 0.15s ease",
});

export default function PostJob() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("edit");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [budget, setBudget] = useState("");
  const [location, setLocation] = useState("");
  const [urgency, setUrgency] = useState("");
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);

  // Load existing job data when editing
  useEffect(() => {
    if (!editId) return;
    const job = getJobById(editId);
    if (job) {
      setTitle(job.title || "");
      setDescription(job.description || "");
      setCategory(job.category || "");
      setBudget(job.budget || "");
      setLocation(job.location || "");
      setUrgency(job.urgency || "");
    }
  }, [editId]);

  const validate = () => {
    const e = {};
    if (!title.trim()) e.title = "Job title is required";
    if (!description.trim()) e.description = "Description is required";
    else if (description.trim().length < 20) e.description = "Please provide at least 20 characters";
    if (!category) e.category = "Please select a category";
    if (!budget.trim()) e.budget = "Budget is required";
    if (!location.trim()) e.location = "Location is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    const jobData = {
      title,
      description,
      category,
      budget: budget.startsWith("$") ? budget : `$${budget}`,
      location,
      urgency: urgency || null,
      postedBy: "Demo User",
      postedByRating: 4.8,
      status: "open",
      time: "Just now",
    };

    if (editId) {
      updateJob(editId, jobData);
    } else {
      createJob(jobData);
    }

    setSubmitted(true);
  };

  const handleReset = () => {
    setTitle(""); setDescription(""); setCategory(""); setBudget("");
    setLocation(""); setUrgency(""); setErrors({});
    setSubmitted(false);
  };

  return (
    <div style={{
      minHeight: "100vh", background: "#0a0f1a", color: "#e2e8f0",
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    }}>
      {/* ===================== HEADER ===================== */}
      <header style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 40px", height: 64,
        background: "linear-gradient(180deg, #0d1526 0%, #0a1220 100%)",
        borderBottom: "1px solid rgba(56,189,248,0.08)",
        position: "sticky", top: 0, zIndex: 100, backdropFilter: "blur(12px)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
          <div
            onClick={() => navigate("/home")}
            style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.5px", cursor: "pointer" }}
          >
            <span style={{ color: "#e2e8f0" }}>Re</span>
            <span style={{ color: "#38bdf8" }}>Bu</span>
          </div>
          <nav style={{ display: "flex", gap: 4 }}>
            {[
              { label: "Home", path: "/home" },
              { label: "Job Board", path: "/job-board" },
              { label: "Post a Job", path: "/post-job" },
            ].map((item) => (
              <button
                key={item.label}
                onClick={() => navigate(item.path)}
                style={{
                  padding: "8px 16px", borderRadius: 8, border: "none",
                  background: item.label === "Post a Job" ? "rgba(56, 189, 248, 0.1)" : "transparent",
                  color: item.label === "Post a Job" ? "#38bdf8" : "#94a3b8",
                  fontSize: 14, fontWeight: 500, cursor: "pointer",
                  transition: "all 0.15s ease", fontFamily: "inherit",
                }}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <button style={{ padding: "8px 20px", borderRadius: 8, border: "1px solid rgba(56, 189, 248, 0.25)", background: "transparent", color: "#38bdf8", fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}>Log In</button>
          <button style={{ padding: "8px 20px", borderRadius: 8, border: "none", background: "linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%)", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Sign Up</button>
        </div>
      </header>

      {/* ===================== MAIN CONTENT ===================== */}
      <main style={{ maxWidth: 640, margin: "0 auto", padding: "32px 40px" }}>
        {/* Back button */}
        <button
          onClick={() => navigate("/job-board")}
          style={{
            display: "flex", alignItems: "center", gap: 6, marginBottom: 24,
            background: "none", border: "none", color: "#38bdf8",
            fontSize: 14, fontWeight: 500, cursor: "pointer", fontFamily: "inherit",
          }}
        >
          ← Back to Job Board
        </button>

        <h1 style={{ fontSize: 24, fontWeight: 700, color: "#f1f5f9", margin: "0 0 4px" }}>
          {editId ? "Edit Job" : "Post a Job"}
        </h1>
        <p style={{ color: "#64748b", fontSize: 14, margin: "0 0 28px" }}>
          {editId ? "Update the details for your job listing." : "Describe the work you need done and find the right person for the job."}
        </p>

        {submitted ? (
          <div style={{
            textAlign: "center", padding: "48px 24px", borderRadius: 16,
            background: "#111827", border: "1px solid rgba(56,189,248,0.08)",
          }}>
            <div style={{
              width: 64, height: 64, borderRadius: "50%",
              background: "rgba(52,211,153,0.1)", display: "flex",
              alignItems: "center", justifyContent: "center",
              margin: "0 auto 16px", fontSize: 32,
            }}>✓</div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: "#f1f5f9", margin: "0 0 8px" }}>
              {editId ? "Job Updated!" : "Job Posted!"}
            </h2>
            <p style={{ color: "#64748b", fontSize: 14, margin: "0 0 24px", lineHeight: 1.6 }}>
              Your job listing for <strong style={{ color: "#e2e8f0" }}>"{title}"</strong> has been {editId ? "updated" : "created"} and is now visible on the Job Board.
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              <button onClick={() => navigate("/job-board")} style={{
                padding: "10px 24px", borderRadius: 8, border: "none",
                background: "linear-gradient(135deg, #0ea5e9, #06b6d4)",
                color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
              }}>
                View Job Board
              </button>
              {!editId && (
                <button onClick={handleReset} style={{
                  padding: "10px 24px", borderRadius: 8,
                  border: "1px solid rgba(56,189,248,0.25)", background: "transparent",
                  color: "#38bdf8", fontSize: 14, fontWeight: 500, cursor: "pointer", fontFamily: "inherit",
                }}>
                  Post Another
                </button>
              )}
            </div>
          </div>
        ) : (
          <div style={{
            padding: 28, borderRadius: 16, background: "#111827",
            border: "1px solid rgba(56,189,248,0.08)",
          }}>
            {/* Job Title */}
            <Field label="Job Title" required error={errors.title}>
              <input
                type="text" value={title} onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Fix leaking kitchen faucet"
                style={inputStyle(errors.title)}
                onFocus={e => e.target.style.borderColor = "rgba(56,189,248,0.35)"}
                onBlur={e => e.target.style.borderColor = errors.title ? "rgba(248,113,113,0.5)" : "rgba(56,189,248,0.12)"}
              />
            </Field>

            {/* Description */}
            <Field label="Job Description" required error={errors.description}>
              <textarea
                value={description} onChange={e => setDescription(e.target.value)}
                placeholder="Describe the work needed, any specific requirements, tools provided, etc."
                rows={4}
                style={{ ...inputStyle(errors.description), resize: "vertical", minHeight: 100 }}
                onFocus={e => e.target.style.borderColor = "rgba(56,189,248,0.35)"}
                onBlur={e => e.target.style.borderColor = errors.description ? "rgba(248,113,113,0.5)" : "rgba(56,189,248,0.12)"}
              />
              <div style={{ textAlign: "right", fontSize: 11, color: "#475569", marginTop: 4 }}>
                {description.length} characters
              </div>
            </Field>

            {/* Category */}
            <Field label="Job Category" required error={errors.category}>
              <select
                value={category} onChange={e => setCategory(e.target.value)}
                style={{
                  ...inputStyle(errors.category),
                  appearance: "none", cursor: "pointer",
                  color: category ? "#e2e8f0" : "#475569",
                }}
              >
                <option value="" style={{ background: "#111827" }}>Select a category...</option>
                {CATEGORIES.map(c => (
                  <option key={c} value={c} style={{ background: "#111827", color: "#e2e8f0" }}>{c}</option>
                ))}
              </select>
            </Field>

            {/* Budget + Urgency row */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <Field label="Budget ($)" required error={errors.budget}>
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#475569", fontSize: 14, fontWeight: 600 }}>$</span>
                  <input
                    type="text" value={budget}
                    onChange={e => setBudget(e.target.value.replace(/[^0-9.]/g, ""))}
                    placeholder="0.00"
                    style={{ ...inputStyle(errors.budget), paddingLeft: 28 }}
                    onFocus={e => e.target.style.borderColor = "rgba(56,189,248,0.35)"}
                    onBlur={e => e.target.style.borderColor = errors.budget ? "rgba(248,113,113,0.5)" : "rgba(56,189,248,0.12)"}
                  />
                </div>
              </Field>

              <Field label="Urgency" error={null}>
                <select
                  value={urgency} onChange={e => setUrgency(e.target.value)}
                  style={{
                    ...inputStyle(false),
                    appearance: "none", cursor: "pointer",
                    color: urgency ? "#e2e8f0" : "#475569",
                  }}
                >
                  <option value="" style={{ background: "#111827" }}>None</option>
                  <option value="Urgent" style={{ background: "#111827", color: "#e2e8f0" }}>Urgent</option>
                  <option value="ASAP" style={{ background: "#111827", color: "#e2e8f0" }}>ASAP</option>
                </select>
              </Field>
            </div>

            {/* Location */}
            <Field label="Location" required error={errors.location}>
              <input
                type="text" value={location} onChange={e => setLocation(e.target.value)}
                placeholder="e.g. 123 Main St, Syracuse, NY"
                style={inputStyle(errors.location)}
                onFocus={e => e.target.style.borderColor = "rgba(56,189,248,0.35)"}
                onBlur={e => e.target.style.borderColor = errors.location ? "rgba(248,113,113,0.5)" : "rgba(56,189,248,0.12)"}
              />
            </Field>

            {/* Submit */}
            <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
              <button
                onClick={handleSubmit}
                style={{
                  flex: 1, padding: "14px 0", borderRadius: 10, border: "none",
                  background: "linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%)",
                  color: "#fff", fontSize: 15, fontWeight: 700,
                  cursor: "pointer", fontFamily: "inherit", transition: "opacity 0.15s",
                }}
                onMouseEnter={e => e.target.style.opacity = "0.9"}
                onMouseLeave={e => e.target.style.opacity = "1"}
              >
                {editId ? "Save Changes" : "Submit Job Request"}
              </button>
              <button onClick={() => navigate("/job-board")} style={{
                padding: "14px 24px", borderRadius: 10,
                border: "1px solid rgba(56,189,248,0.2)", background: "transparent",
                color: "#94a3b8", fontSize: 14, fontWeight: 500, cursor: "pointer",
                fontFamily: "inherit",
              }}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}