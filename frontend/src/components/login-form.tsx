"use client";

import { useState } from "react";
import { useAuth } from "./auth-provider";
import { API_URL } from "@/lib/config";

const DEMO_USERS = [
  { label: "Admin", email: "admin@obliq.app", password: "Admin123!" },
  { label: "Manager", email: "manager@obliq.app", password: "Manager123!" },
  { label: "Agent", email: "agent@obliq.app", password: "Agent123!" },
  { label: "Customer", email: "customer@obliq.app", password: "Customer123!" },
];

export function LoginForm() {
  const { login } = useAuth();
  const [mode, setMode] = useState<"login" | "signup" | "forgot" | "reset">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("admin@obliq.app");
  const [password, setPassword] = useState("Admin123!");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setInfo(null);
    try {
      if (mode === "login") {
        await login(email, password);
      } else if (mode === "signup") {
        const response = await fetch(`${API_URL}/auth/signup`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password }),
        });
        const data = (await response.json()) as { message?: string };
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
        const data = (await response.json()) as { message?: string; resetToken?: string };
        if (!response.ok) {
          throw new Error(data.message ?? "Request failed");
        }
        setResetToken(data.resetToken ?? "");
        setInfo(
          data.resetToken
            ? `Reset token generated: ${data.resetToken}`
            : data.message ?? "If the account exists, a reset token has been generated.",
        );
        setMode("reset");
      } else if (mode === "reset") {
        const response = await fetch(`${API_URL}/auth/reset-password`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, token: resetToken, newPassword }),
        });
        const data = (await response.json()) as { message?: string };
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
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="login-shell">
      <div className="brand">
        <div className="brand-mark" />
        <span>Obliq</span>
      </div>

      <div className="login-stage">
        <section className="login-card">
          <div className="auth-mode-switch">
            <button className={mode === "login" ? "mode-chip active" : "mode-chip"} type="button" onClick={() => setMode("login")}>
              Login
            </button>
            <button className={mode === "signup" ? "mode-chip active" : "mode-chip"} type="button" onClick={() => setMode("signup")}>
              Sign up
            </button>
            <button className={mode === "forgot" || mode === "reset" ? "mode-chip active" : "mode-chip"} type="button" onClick={() => setMode("forgot")}>
              Reset password
            </button>
          </div>
          <h1>Login</h1>
          <p>
            {mode === "login" && "Enter your details to continue"}
            {mode === "signup" && "Create a customer account"}
            {mode === "forgot" && "Generate a password reset token"}
            {mode === "reset" && "Use the token to set a new password"}
          </p>

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
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Enter your password"
                  />
                  <span className="password-eye" aria-hidden="true">
                    o
                  </span>
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
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    placeholder="Enter a new password"
                  />
                </label>
              </>
            ) : null}

            {mode === "login" ? (
              <div className="login-row">
                <label className="checkbox">
                  <input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} />
                  <span>Remember me</span>
                </label>
                <button type="button" className="text-link" onClick={() => setMode("forgot")}>
                  Forgot password?
                </button>
              </div>
            ) : null}

            {error ? <div className="error-banner">{error}</div> : null}
            {info ? <div className="info-banner">{info}</div> : null}

            <button className="primary-button" type="submit" disabled={submitting}>
              {submitting && mode === "login" ? "Signing in..." : null}
              {submitting && mode === "signup" ? "Creating account..." : null}
              {submitting && mode === "forgot" ? "Generating token..." : null}
              {submitting && mode === "reset" ? "Resetting password..." : null}
              {!submitting && mode === "login" ? "Log in" : null}
              {!submitting && mode === "signup" ? "Sign up" : null}
              {!submitting && mode === "forgot" ? "Generate reset token" : null}
              {!submitting && mode === "reset" ? "Update password" : null}
            </button>
          </form>

          <div className="login-footer">
            {mode !== "signup" ? (
              <>
                <span>Don’t have an account?</span>
                <button type="button" className="footer-link" onClick={() => setMode("signup")}>
                  Sign up
                </button>
              </>
            ) : (
              <>
                <span>Already have an account?</span>
                <button type="button" className="footer-link" onClick={() => setMode("login")}>
                  Log in
                </button>
              </>
            )}
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
                }}
              >
                {demoUser.label}
              </button>
            ))}
          </div>
        </section>

        <aside className="preview-panel">
          <div className="preview-waves" />
          <div className="preview-window">
            <div className="workspace-header">
              <div className="workspace-avatar">W</div>
              <div>
                <strong>John’s workspace</strong>
                <span>#WID12446875</span>
              </div>
            </div>

            <nav className="preview-nav">
              <span>Dashboard</span>
              <span>Leads</span>
              <span>Opportunities</span>
              <span className="active">Tasks</span>
              <span>Reports</span>
              <span>Contacts</span>
              <span>Messages</span>
              <span>Configuration</span>
              <span>Invoice</span>
              <span>Settings</span>
            </nav>

            <div className="preview-content">
              <div className="preview-list">
                <div className="preview-toolbar">
                  <span>Search table</span>
                  <strong>List</strong>
                  <span>Kanban</span>
                  <span>Calendar</span>
                </div>
                <div className="preview-table">
                  <div><span>Call about proposal</span><em>Urgent</em></div>
                  <div><span>Send onboarding docs</span><em>High</em></div>
                  <div><span>Follow up with Mira</span><em>Low</em></div>
                  <div><span>Prepare pitch deck</span><em>Medium</em></div>
                </div>
              </div>

              <div className="preview-kanban">
                <article>
                  <strong>Backlog</strong>
                  <p>Call about proposal</p>
                </article>
                <article>
                  <strong>In progress</strong>
                  <p>Send onboarding docs</p>
                </article>
                <article>
                  <strong>Review</strong>
                  <p>Prepare pitch deck</p>
                </article>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
