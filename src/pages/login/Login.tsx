import { useState, type SubmitEvent } from "react";
import { useNavigate } from "react-router";
import "./Login.css";

const EMAIL_RE = /.+@.+\..+/;

// No backend is wired up yet — this is the only account accepted until one exists.
const VALID_EMAIL = "nishant.bhargava@outlook.in";
const VALID_PASSWORD = "admin12345";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [reveal, setReveal] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [touched, setTouched] = useState(false);

  const emailInvalid = touched && !EMAIL_RE.test(email);
  const passwordInvalid = touched && password.length === 0;

  function onSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!EMAIL_RE.test(email)) {
      setTouched(true);
      setError("Enter your work email address.");
      return;
    }
    if (password.length === 0) {
      setTouched(true);
      setError("Enter your password.");
      return;
    }

    setError("");
    setBusy(true);
    setTimeout(() => {
      if (email === VALID_EMAIL && password === VALID_PASSWORD) {
        navigate("/overview", { replace: true });
        return;
      }
      setBusy(false);
      setError("Invalid email or password.");
    }, 900);
  }

  function onSso() {
    setError("SSO isn't configured in this environment yet.");
  }

  function onPasskey() {
    setError("Passkeys aren't configured in this environment yet.");
  }

  return (
    <div className="login-container">
      <section className="login-panel">
        <div className="login-panel-inner">
          <div className="brand">
            <span className="brand-mark">
              <i />
            </span>
            <span className="brand-name">OpsBoard</span>
          </div>

          <h1>Sign in</h1>
          <p className="login-subtitle">Use your work account. Access to production incidents is logged.</p>

          {error && (
            <div className="login-alert" role="alert">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="12" cy="12" r="9" />
                <line x1="12" y1="8" x2="12" y2="13" />
                <line x1="12" y1="16" x2="12" y2="16.01" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={onSubmit} noValidate>
            <div className="login-field">
              <label htmlFor="ops-email">Work email</label>
              <input
                id="ops-email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError("");
                }}
                placeholder="you@company.com"
                autoComplete="username"
                aria-invalid={emailInvalid}
              />
            </div>

            <div className="login-field">
              <div className="field-label-row">
                <label htmlFor="ops-pass">Password</label>
                <a href="#reset" onClick={(e) => e.preventDefault()}>
                  Forgot password?
                </a>
              </div>
              <div className="password-wrap">
                <input
                  id="ops-pass"
                  type={reveal ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError("");
                  }}
                  placeholder="••••••••••"
                  autoComplete="current-password"
                  aria-invalid={passwordInvalid}
                />
                <button
                  type="button"
                  className="reveal-btn"
                  onClick={() => setReveal((r) => !r)}
                  aria-pressed={reveal}
                >
                  {reveal ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <label className="trust-row">
              <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
              <span>Trust this device for 30 days</span>
            </label>

            <button type="submit" className="submit-btn" disabled={busy}>
              {busy && (
                <svg className="spinner" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12a9 9 0 1 1-3.2-6.9" />
                </svg>
              )}
              {busy ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <div className="divider" aria-hidden>
            <span className="divider-line" />
            <span className="divider-label">or</span>
            <span className="divider-line" />
          </div>

          <div className="oauth-group">
            <button type="button" className="oauth-btn" onClick={onSso}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.5">
                <rect x="4" y="10" width="16" height="10" />
                <path d="M8 10V7.5a4 4 0 0 1 8 0V10" />
              </svg>
              Continue with SSO
            </button>
            <button type="button" className="oauth-btn" onClick={onPasskey}>
              Continue with a passkey
            </button>
          </div>

          <p className="login-footer">
            Trouble signing in? Ask in <span className="mono">#ops-help</span> or page the platform on-call.
          </p>
        </div>
      </section>

      <aside className="login-aside">
        <div className="aside-eyebrow">
          <i /> Incident management
        </div>

        <div className="aside-main">
          <h2>One board for every production incident.</h2>
          <p>
            Triage, assign and resolve across services and environments — with the filters, timelines and
            ownership your on-call rotation already relies on.
          </p>
        </div>

        <div className="aside-status">
          <div className="status-row">
            <i />
            <span>All regions operational</span>
            <a href="#status" onClick={(e) => e.preventDefault()}>
              Status page
            </a>
          </div>
          <div className="mono status-note">SSO enforced · sessions expire after 12h</div>
        </div>
      </aside>
    </div>
  );
}
