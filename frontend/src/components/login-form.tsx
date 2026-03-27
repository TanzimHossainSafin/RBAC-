"use client";

import { useState } from "react";
import { API_URL } from "@/lib/config";
import { useAuth } from "./auth-provider";

function EyeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

const DEMO_USERS = [
  { label: "Admin", email: "admin@obliq.app", password: "Admin123!" },
  { label: "Manager", email: "manager@obliq.app", password: "Manager123!" },
  { label: "Agent", email: "agent@obliq.app", password: "Agent123!" },
  { label: "Customer", email: "customer@obliq.app", password: "Customer123!" },
];

const MODE_COPY = {
  login: {
    title: "Login",
    subtitle: "Enter your details to continue",
    action: "Log in",
  },
  signup: {
    title: "Create Account",
    subtitle: "Set up a customer access profile in the shared workspace",
    action: "Sign up",
  },
  forgot: {
    title: "Forgot Password",
    subtitle: "Generate a secure reset token for an existing account",
    action: "Generate token",
  },
  reset: {
    title: "Reset Password",
    subtitle: "Apply the reset token and issue a new password",
    action: "Update password",
  },
} as const;

type AuthMode = keyof typeof MODE_COPY;

function PreviewScene() {
  return (
    <aside className="preview-panel">
      <div className="preview-waves" />
      <div className="preview-glow" />

      <div className="preview-browser">
        <div className="preview-browser-bar">
          <div className="preview-browser-dots">
            <span />
            <span />
            <span />
          </div>
          <span>Tasks workspace</span>
        </div>

        <div className="preview-browser-body">
          <div className="preview-sidebar">
            <div className="preview-sidebar-card">
              <div className="workspace-avatar">W</div>
              <div>
                <strong>John&apos;s workspace</strong>
                <span>#WID12446875</span>
              </div>
            </div>

            <nav className="preview-nav">
              <span>Dashboard</span>
              <span>Leads</span>
              <span>Opportunities</span>
              <span className="active">Tasks</span>
              <span>Assignments</span>
              <span>Reports</span>
              <span>Messages</span>
              <span>Settings</span>
            </nav>
          </div>

          <div className="preview-surface">
            <div className="preview-toolbar">
              <span>Search table</span>
              <strong>List</strong>
              <span>Kanban</span>
              <span>Calendar</span>
            </div>

            <div className="preview-task-list">
              <div className="preview-task-row">
                <strong>Call about proposal</strong>
                <em>Urgent</em>
              </div>
              <div className="preview-task-row">
                <strong>Send onboarding docs</strong>
                <em>High</em>
              </div>
              <div className="preview-task-row">
                <strong>Follow up with Mira</strong>
                <em>Low</em>
              </div>
              <div className="preview-task-row">
                <strong>Prepare pitch deck</strong>
                <em>Medium</em>
              </div>
            </div>

            <div className="preview-kanban">
              <article>
                <span>Backlog</span>
                <strong>Call about proposal</strong>
                <p>Client: Bluestone</p>
              </article>
              <article>
                <span>In progress</span>
                <strong>Send onboarding docs</strong>
                <p>Client: Tech Ltd.</p>
              </article>
              <article>
                <span>Review</span>
                <strong>Prepare pitch deck</strong>
                <p>Client: Jabed Ali</p>
              </article>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

export function LoginForm() {
  const { login } = useAuth();
  const [mode, setMode] = useState<AuthMode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("admin@obliq.app");
  const [password, setPassword] = useState("Admin123!");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const copy = MODE_COPY[mode];

  function switchMode(nextMode: AuthMode) {
    setMode(nextMode);
    setError(null);
    setInfo(null);
  }

  async function safeJson<T>(response: Response): Promise<T> {
    const text = await response.text();
    try {
      return JSON.parse(text) as T;
    } catch {
      throw new Error(response.ok ? "Unexpected server response" : `Server error (${response.status})`);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setInfo(null);

    try {
      if (mode === "login") {
        await login(email, password, remember);
      } else if (mode === "signup") {
        const response = await fetch(`${API_URL}/auth/signup`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password }),
        });
        const data = await safeJson<{ message?: string }>(response);
        if (!response.ok) {
          throw new Error(data.message ?? "Sign up failed");
        }
        setInfo(data.message ?? "Account created. You can now sign in.");
        setMode("login");
      } else if (mode === "forgot") {
        const response = await fetch(`${API_URL}/auth/forgot-password`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });
        const data = await safeJson<{ message?: string; resetToken?: string }>(response);
        if (!response.ok) {
          throw new Error(data.message ?? "Request failed");
        }
        setResetToken(data.resetToken ?? "");
        setInfo(data.resetToken ? `Reset token generated: ${data.resetToken}` : data.message ?? "Reset token generated.");
        setMode("reset");
      } else if (mode === "reset") {
        const response = await fetch(`${API_URL}/auth/reset-password`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, token: resetToken, newPassword }),
        });
        const data = await safeJson<{ message?: string }>(response);
        if (!response.ok) {
          throw new Error(data.message ?? "Reset failed");
        }
        setInfo(data.message ?? "Password updated. Please sign in again.");
        setPassword(newPassword);
        setNewPassword("");
        setResetToken("");
        setMode("login");
      }
    } catch (err) {
      if (err instanceof TypeError && err.message.toLowerCase().includes("fetch")) {
        setError("Cannot reach the server. Please try again.");
      } else {
        setError(err instanceof Error ? err.message : "Something went wrong");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="login-shell">
      <div className="brand brand-floating">
        <div className="brand-mark" />
        <span>Obliq</span>
      </div>

      <div className="login-stage">
        <section className="login-card">
          <div className="auth-mode-switch">
            <button className={mode === "login" ? "mode-chip active" : "mode-chip"} type="button" onClick={() => switchMode("login")}>
              Login
            </button>
            <button className={mode === "signup" ? "mode-chip active" : "mode-chip"} type="button" onClick={() => switchMode("signup")}>
              Sign up
            </button>
            <button
              className={mode === "forgot" || mode === "reset" ? "mode-chip active" : "mode-chip"}
              type="button"
              onClick={() => switchMode("forgot")}
            >
              Reset
            </button>
          </div>

          <div className="login-copy">
            <h1>{copy.title}</h1>
            <p>{copy.subtitle}</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            {mode === "signup" ? (
              <label>
                <span>Name</span>
                <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Your full name" />
              </label>
            ) : null}

            <label>
              <span>Email</span>
              <input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="example@email.com" />
            </label>

            {mode === "login" || mode === "signup" ? (
              <label>
                <span>Password</span>
                <div className="password-field">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    className="password-eye"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
              </label>
            ) : null}

            {mode === "reset" ? (
              <>
                <label>
                  <span>Reset token</span>
                  <input value={resetToken} onChange={(event) => setResetToken(event.target.value)} placeholder="Paste reset token" />
                </label>
                <label>
                  <span>New password</span>
                  <div className="password-field">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(event) => setNewPassword(event.target.value)}
                      placeholder="Enter a new password"
                    />
                    <button
                      type="button"
                      className="password-eye"
                      onClick={() => setShowNewPassword((prev) => !prev)}
                      aria-label={showNewPassword ? "Hide password" : "Show password"}
                    >
                      {showNewPassword ? <EyeOffIcon /> : <EyeIcon />}
                    </button>
                  </div>
                </label>
              </>
            ) : null}

            {mode === "login" ? (
              <div className="login-row">
                <label className="checkbox">
                  <input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} />
                  <span>Remember me</span>
                </label>
                <button type="button" className="text-link" onClick={() => switchMode("forgot")}>
                  Forgot password?
                </button>
              </div>
            ) : null}

            {error ? <div className="error-banner">{error}</div> : null}
            {info ? <div className="info-banner">{info}</div> : null}

            <button className="primary-button" type="submit" disabled={submitting}>
              {submitting ? "Working..." : copy.action}
            </button>
          </form>

          <div className="login-footer">
            {mode !== "signup" ? (
              <>
                <span>Don&apos;t have an account?</span>
                <button type="button" className="footer-link" onClick={() => switchMode("signup")}>
                  Sign up
                </button>
              </>
            ) : (
              <>
                <span>Already have an account?</span>
                <button type="button" className="footer-link" onClick={() => switchMode("login")}>
                  Log in
                </button>
              </>
            )}
          </div>

          <div className="demo-note">
            <span className="eyebrow">Demo Access</span>
            <p>Use one of the seeded accounts to inspect each RBAC level instantly.</p>
          </div>

          <div className="demo-users">
            {DEMO_USERS.map((demoUser) => (
              <button
                key={demoUser.email}
                type="button"
                className="demo-chip"
                onClick={() => {
                  setEmail(demoUser.email);
                  setPassword(demoUser.password);
                  switchMode("login");
                }}
              >
                {demoUser.label}
              </button>
            ))}
          </div>
        </section>

        <PreviewScene />
      </div>
    </div>
  );
}
