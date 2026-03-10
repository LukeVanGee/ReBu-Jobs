import { useState } from "react";

// ============================================================
// API INTEGRATION POINT
// Submit a rating for a completed job.
// POST /api/jobs/:id/rate
// Request body:
// {
//   jobId: number,
//   rating: number (1-5),
//   review: string,
//   ratedBy: string (client user ID),
//   ratedUser: string (worker user ID),
// }
// Expected response:
// { success: boolean, message: string }
// ============================================================

export default function RatingModal({ job, onClose, onSubmit }) {
  const [rating, setRating] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [review, setReview] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = () => {
    if (rating === 0) {
      setError("Please select a rating");
      return;
    }
    setError(null);

    // TODO: Replace with actual API call
    // POST /api/jobs/${job.id}/rate
    // { rating, review, ratedBy: currentUser.id, ratedUser: job.acceptedBy }
    if (onSubmit) {
      onSubmit({ jobId: job.id, rating, review });
    }

    setSubmitted(true);
  };

  const starLabels = ["", "Poor", "Fair", "Good", "Very Good", "Excellent"];

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000,
      display: "flex", alignItems: "center", justifyContent: "center",
      background: "rgba(0, 0, 0, 0.6)",
      backdropFilter: "blur(4px)",
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    }}>
      <div style={{
        width: "100%", maxWidth: 440,
        background: "#111827",
        borderRadius: 16,
        border: "1px solid rgba(56, 189, 248, 0.1)",
        boxShadow: "0 24px 64px rgba(0, 0, 0, 0.5)",
        padding: "32px 28px",
        position: "relative",
      }}>
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: "absolute", top: 16, right: 16,
            background: "none", border: "none",
            color: "#64748b", fontSize: 20, cursor: "pointer",
            width: 32, height: 32, borderRadius: 8,
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "all 0.15s ease",
          }}
          onMouseEnter={e => e.target.style.color = "#e2e8f0"}
          onMouseLeave={e => e.target.style.color = "#64748b"}
        >
          ✕
        </button>

        {submitted ? (
          /* ========== Success State ========== */
          <div style={{ textAlign: "center", padding: "16px 0" }}>
            <div style={{
              width: 64, height: 64, borderRadius: "50%",
              background: "rgba(52, 211, 153, 0.1)",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 16px", fontSize: 32,
            }}>
              ✓
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: "#f1f5f9", margin: "0 0 8px" }}>
              Rating Submitted!
            </h2>
            <p style={{ color: "#64748b", fontSize: 14, margin: "0 0 8px", lineHeight: 1.6 }}>
              You rated <strong style={{ color: "#e2e8f0" }}>{job.acceptedBy || "the worker"}</strong>
            </p>
            <div style={{ fontSize: 28, margin: "8px 0 20px", letterSpacing: 4 }}>
              {[1, 2, 3, 4, 5].map(i => (
                <span key={i} style={{ color: i <= rating ? "#fbbf24" : "#1e293b" }}>★</span>
              ))}
            </div>
            <button
              onClick={onClose}
              style={{
                padding: "10px 32px", borderRadius: 8, border: "none",
                background: "linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%)",
                color: "#fff", fontSize: 14, fontWeight: 600,
                cursor: "pointer", fontFamily: "inherit",
              }}
            >
              Done
            </button>
          </div>
        ) : (
          /* ========== Rating Form ========== */
          <>
            {/* Header */}
            <div style={{ textAlign: "center", marginBottom: 24 }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: "#f1f5f9", margin: "0 0 6px" }}>
                Rate Your Experience
              </h2>
              <p style={{ color: "#64748b", fontSize: 14, margin: 0 }}>
                How was the work on <strong style={{ color: "#94a3b8" }}>"{job.title}"</strong>?
              </p>
            </div>

            {/* Worker info */}
            {job.acceptedBy && (
              <div style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "14px 16px", borderRadius: 10,
                background: "rgba(56, 189, 248, 0.04)",
                border: "1px solid rgba(56, 189, 248, 0.06)",
                marginBottom: 24,
              }}>
                <div style={{
                  width: 40, height: 40, borderRadius: "50%",
                  background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
                  border: "2px solid #1e293b",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "#38bdf8", fontSize: 16, fontWeight: 700, flexShrink: 0,
                }}>
                  {job.acceptedBy[0]}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#e2e8f0" }}>
                    {job.acceptedBy}
                  </div>
                  <div style={{ fontSize: 12, color: "#64748b" }}>Worker</div>
                </div>
              </div>
            )}

            {/* Star Rating */}
            <div style={{ textAlign: "center", marginBottom: 24 }}>
              <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 8 }}>
                {[1, 2, 3, 4, 5].map(i => (
                  <button
                    key={i}
                    onClick={() => setRating(i)}
                    onMouseEnter={() => setHoveredStar(i)}
                    onMouseLeave={() => setHoveredStar(0)}
                    style={{
                      background: "none", border: "none", cursor: "pointer",
                      fontSize: 36, padding: 4, transition: "transform 0.15s ease",
                      transform: (hoveredStar === i || (hoveredStar === 0 && rating === i)) ? "scale(1.2)" : "scale(1)",
                      color: i <= (hoveredStar || rating) ? "#fbbf24" : "#1e293b",
                    }}
                  >
                    ★
                  </button>
                ))}
              </div>
              <div style={{
                fontSize: 13, fontWeight: 600, height: 20,
                color: hoveredStar ? "#fbbf24" : rating ? "#fbbf24" : "#475569",
              }}>
                {starLabels[hoveredStar || rating] || "Select a rating"}
              </div>
              {error && (
                <p style={{ color: "#f87171", fontSize: 12, margin: "8px 0 0" }}>{error}</p>
              )}
            </div>

            {/* Review text */}
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#94a3b8", marginBottom: 6 }}>
                Review <span style={{ color: "#475569", fontWeight: 400 }}>(optional)</span>
              </label>
              <textarea
                value={review}
                onChange={e => setReview(e.target.value)}
                placeholder="Tell others about your experience..."
                rows={3}
                style={{
                  width: "100%", padding: "12px 14px", borderRadius: 10,
                  border: "1px solid rgba(56, 189, 248, 0.12)",
                  background: "#0d1526", color: "#e2e8f0", fontSize: 14,
                  outline: "none", fontFamily: "inherit", boxSizing: "border-box",
                  resize: "vertical", minHeight: 80,
                  transition: "border-color 0.15s ease",
                }}
                onFocus={e => e.target.style.borderColor = "rgba(56, 189, 248, 0.35)"}
                onBlur={e => e.target.style.borderColor = "rgba(56, 189, 248, 0.12)"}
              />
              <div style={{ textAlign: "right", fontSize: 11, color: "#475569", marginTop: 4 }}>
                {review.length} / 500
              </div>
            </div>

            {/* Action buttons */}
            <div style={{ display: "flex", gap: 12 }}>
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
                Submit Rating
              </button>
              <button
                onClick={onClose}
                style={{
                  padding: "14px 24px", borderRadius: 10,
                  border: "1px solid rgba(56, 189, 248, 0.2)", background: "transparent",
                  color: "#94a3b8", fontSize: 14, fontWeight: 500,
                  cursor: "pointer", fontFamily: "inherit",
                }}
              >
                Skip
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}