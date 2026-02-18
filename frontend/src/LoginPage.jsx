import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const COLORS = {
  primary: "#2563EB",
  primaryDark: "#1D4ED8",
  primaryLight: "#DBEAFE",
  accent: "#10B981",
  bg: "#F8FAFC",
  card: "#FFFFFF",
  text: "#1E293B",
  textMuted: "#64748B",
  border: "#E2E8F0",
  error: "#EF4444",
  errorBg: "#FEF2F2",
};

const InputField = ({ icon, label, type = "text", value, onChange, placeholder, error }) => {
  const [show, setShow] = useState(false);
  const isPassword = type === "password";
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: COLORS.textMuted, marginBottom: 6 }}>{label}</label>
      <div style={{
        display: "flex", alignItems: "center", border: `1.5px solid ${error ? COLORS.error : COLORS.border}`,
        borderRadius: 10, padding: "0 12px", background: error ? COLORS.errorBg : "#F8FAFC", transition: "border .2s"
      }}>
        <span style={{ marginRight: 10, fontSize: 18, opacity: 0.5 }}>{icon}</span>
        <input
          type={isPassword && !show ? "password" : "text"}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          style={{
            flex: 1, border: "none", outline: "none", background: "transparent",
            padding: "13px 0", fontSize: 15, color: COLORS.text
          }}
        />
        {isPassword && (
          <span onClick={() => setShow(!show)} style={{ cursor: "pointer", fontSize: 14, color: COLORS.primary, fontWeight: 600, userSelect: "none" }}>
            {show ? "Hide" : "Show"}
          </span>
        )}
      </div>
      {error && <p style={{ color: COLORS.error, fontSize: 12, margin: "4px 0 0 4px" }}>{error}</p>}
    </div>
  );
};

const Button = ({ children, onClick, loading, variant = "primary", style: s = {} }) => {
  const isPrimary = variant === "primary";
  return (
    <button
      onClick={onClick}
      disabled={loading}
      style={{
        width: "100%", padding: "14px 0", borderRadius: 10, border: isPrimary ? "none" : `1.5px solid ${COLORS.border}`,
        background: isPrimary ? `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.primaryDark})` : COLORS.card,
        color: isPrimary ? "#fff" : COLORS.text, fontSize: 15, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer",
        opacity: loading ? 0.7 : 1, transition: "all .2s", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, ...s
      }}
    >
      {loading && <span style={{ display: "inline-block", width: 18, height: 18, border: "2.5px solid rgba(255,255,255,.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.6s linear infinite" }} />}
      {children}
    </button>
  );
};

const RolePill = ({ role, selected, onClick }) => (
  <button onClick={onClick} style={{
    flex: 1, padding: "12px 0", borderRadius: 10, border: `2px solid ${selected ? COLORS.primary : COLORS.border}`,
    background: selected ? COLORS.primaryLight : "#fff", color: selected ? COLORS.primary : COLORS.textMuted,
    fontWeight: 700, fontSize: 14, cursor: "pointer", transition: "all .2s"
  }}>
    {role === "customer" ? "🏠 Customer" : "🔧 Worker"}
  </button>
);

const Logo = () => (
  <div style={{ textAlign: "center", marginBottom: 8 }}>
    <div style={{
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      width: 56, height: 56, borderRadius: 16, background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.accent})`,
      marginBottom: 8
    }}>
      <span style={{ fontSize: 28, color: "#fff", fontWeight: 900 }}>R</span>
    </div>
    <h1 style={{ fontSize: 28, fontWeight: 800, color: COLORS.text, margin: 0 }}>ReBu</h1>
    <p style={{ color: COLORS.textMuted, fontSize: 14, margin: "4px 0 0" }}>Your neighborhood job marketplace</p>
  </div>
);

const Divider = () => (
  <div style={{ display: "flex", alignItems: "center", margin: "20px 0", gap: 12 }}>
    <div style={{ flex: 1, height: 1, background: COLORS.border }} />
    <span style={{ fontSize: 12, color: COLORS.textMuted, fontWeight: 600 }}>OR</span>
    <div style={{ flex: 1, height: 1, background: COLORS.border }} />
  </div>
);

const Toast = ({ message, type = "success" }) => (
  <div style={{
    position: "fixed", top: 24, left: "50%", transform: "translateX(-50%)",
    background: type === "success" ? COLORS.accent : COLORS.error, color: "#fff",
    padding: "12px 28px", borderRadius: 10, fontWeight: 600, fontSize: 14,
    boxShadow: "0 8px 30px rgba(0,0,0,.15)", zIndex: 999, animation: "slideDown .3s ease"
  }}>
    {type === "success" ? "✔" : "✕"} {message}
  </div>
);

export default function LoginPage() {
  const navigate = useNavigate();

  const [view, setView] = useState("login");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  // TODO: Replace this with real auth via your Django backend
  // For now, this stores users in memory for demo purposes
  const [users, setUsers] = useState([
    { email: "demo@rebu.com", password: "password123", name: "Demo User", role: "customer" }
  ]);

  // Login state
  const [lEmail, setLEmail] = useState("");
  const [lPass, setLPass] = useState("");
  const [lErrors, setLErrors] = useState({});

  // Signup state
  const [sName, setSName] = useState("");
  const [sEmail, setSEmail] = useState("");
  const [sPass, setSPass] = useState("");
  const [sConfirm, setSConfirm] = useState("");
  const [sRole, setSRole] = useState("customer");
  const [sErrors, setSErrors] = useState({});

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  const handleLogin = () => {
    const errs = {};
    if (!lEmail) errs.email = "Email is required";
    if (!lPass) errs.password = "Password is required";
    setLErrors(errs);
    if (Object.keys(errs).length) return;

    setLoading(true);

    // TODO: Replace this setTimeout with a real API call:
    // POST /api/auth/login/ { email: lEmail, password: lPass }
    // On success, store the auth token and navigate to /home
    setTimeout(() => {
      const found = users.find(u => u.email === lEmail && u.password === lPass);
      if (found) {
        setToast({ message: "Signed in successfully!", type: "success" });
        // Navigate to homepage after a brief delay so the toast is visible
        setTimeout(() => navigate("/home"), 800);
      } else {
        setLErrors({ email: "Invalid email or password" });
        setToast({ message: "Invalid credentials", type: "error" });
      }
      setLoading(false);
    }, 1200);
  };

  const handleSignup = () => {
    const errs = {};
    if (!sName.trim()) errs.name = "Name is required";
    if (!sEmail) errs.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(sEmail)) errs.email = "Enter a valid email";
    if (users.find(u => u.email === sEmail)) errs.email = "Email already registered";
    if (!sPass) errs.password = "Password is required";
    else if (sPass.length < 8) errs.password = "Must be at least 8 characters";
    if (sPass !== sConfirm) errs.confirm = "Passwords don't match";
    setSErrors(errs);
    if (Object.keys(errs).length) return;

    setLoading(true);

    // TODO: Replace this setTimeout with a real API call:
    // POST /api/auth/signup/ { name: sName, email: sEmail, password: sPass, role: sRole }
    // On success, store the auth token and navigate to /home
    setTimeout(() => {
      const newUser = { email: sEmail, password: sPass, name: sName.trim(), role: sRole };
      setUsers(prev => [...prev, newUser]);
      setToast({ message: "Account created!", type: "success" });
      setTimeout(() => navigate("/home"), 800);
      setLoading(false);
    }, 1500);
  };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #EFF6FF 0%, #F0FDF4 100%)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes slideDown { from { opacity:0; transform: translate(-50%,-20px) } to { opacity:1; transform: translate(-50%,0) } }
        input::placeholder { color: #94A3B8 }
      `}</style>
      {toast && <Toast message={toast.message} type={toast.type} />}
      <div style={{
        width: "100%", maxWidth: 420, background: COLORS.card, borderRadius: 20,
        boxShadow: "0 4px 40px rgba(0,0,0,.08)", padding: "36px 32px", position: "relative"
      }}>
        <Logo />

        {/* Tab Switcher */}
        <div style={{ display: "flex", background: "#F1F5F9", borderRadius: 10, padding: 4, marginBottom: 24, marginTop: 20 }}>
          {["login", "signup"].map(v => (
            <button key={v} onClick={() => { setView(v); setLErrors({}); setSErrors({}); }} style={{
              flex: 1, padding: "10px 0", borderRadius: 8, border: "none",
              background: view === v ? "#fff" : "transparent", color: view === v ? COLORS.text : COLORS.textMuted,
              fontWeight: 700, fontSize: 14, cursor: "pointer", transition: "all .2s",
              boxShadow: view === v ? "0 2px 8px rgba(0,0,0,.06)" : "none"
            }}>
              {v === "login" ? "Sign In" : "Sign Up"}
            </button>
          ))}
        </div>

        {view === "login" ? (
          <>
            <InputField icon="✉" label="Email" value={lEmail} onChange={setLEmail} placeholder="you@email.com" error={lErrors.email} />
            <InputField icon="🔑" label="Password" type="password" value={lPass} onChange={setLPass} placeholder="Enter password" error={lErrors.password} />
            <div style={{ textAlign: "right", marginBottom: 20 }}>
              <span style={{ fontSize: 13, color: COLORS.primary, fontWeight: 600, cursor: "pointer" }}>Forgot password?</span>
            </div>
            <Button onClick={handleLogin} loading={loading}>Sign In</Button>
            <Divider />
            <Button variant="outline" style={{ gap: 8 }}>
              <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.9 33.5 29.4 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 8 3l5.7-5.7C34 6 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.2-2.7-.4-3.9z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 15.5 18.8 12 24 12c3.1 0 5.8 1.2 8 3l5.7-5.7C34 6 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.4 0-9.9-3.5-11.3-8.3l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C36.7 39.5 44 34 44 24c0-1.3-.2-2.7-.4-3.9z"/></svg>
              Continue with Google
            </Button>
            <p style={{ textAlign: "center", fontSize: 13, color: COLORS.textMuted, marginTop: 16 }}>
              Demo: <strong>demo@rebu.com</strong> / <strong>password123</strong>
            </p>
          </>
        ) : (
          <>
            <InputField icon="👤" label="Full Name" value={sName} onChange={setSName} placeholder="John Doe" error={sErrors.name} />
            <InputField icon="✉" label="Email" value={sEmail} onChange={setSEmail} placeholder="you@email.com" error={sErrors.email} />
            <InputField icon="🔑" label="Password" type="password" value={sPass} onChange={setSPass} placeholder="Min 8 characters" error={sErrors.password} />
            <InputField icon="🔑" label="Confirm Password" type="password" value={sConfirm} onChange={setSConfirm} placeholder="Re-enter password" error={sErrors.confirm} />
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: COLORS.textMuted, marginBottom: 8 }}>I want to...</label>
              <div style={{ display: "flex", gap: 10 }}>
                <RolePill role="customer" selected={sRole === "customer"} onClick={() => setSRole("customer")} />
                <RolePill role="worker" selected={sRole === "worker"} onClick={() => setSRole("worker")} />
              </div>
            </div>
            <Button onClick={handleSignup} loading={loading}>Create Account</Button>
            <Divider />
            <Button variant="outline" style={{ gap: 8 }}>
              <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.9 33.5 29.4 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 8 3l5.7-5.7C34 6 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.2-2.7-.4-3.9z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 15.5 18.8 12 24 12c3.1 0 5.8 1.2 8 3l5.7-5.7C34 6 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.4 0-9.9-3.5-11.3-8.3l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C36.7 39.5 44 34 44 24c0-1.3-.2-2.7-.4-3.9z"/></svg>
              Sign up with Google
            </Button>
          </>
        )}
      </div>
    </div>
  );
}