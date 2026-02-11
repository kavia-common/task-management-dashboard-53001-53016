import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

function getRedirectTo(location) {
  const params = new URLSearchParams(location.search);
  return params.get("next") || "/app";
}

// PUBLIC_INTERFACE
export default function LoginPage() {
  /** Login screen. */
  const { login, loading } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <div className="authShell">
      <div className="authCard">
        <div className="authHeader">
          <div className="brandMark" aria-hidden="true" />
          <div>
            <h1>Sign in</h1>
            <p>Welcome back — manage tasks and get real-time updates.</p>
          </div>
        </div>

        <div className="divider" />

        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const res = await login({ email, password });
            if (!res.ok) {
              toast.push({ title: "Sign in failed", message: res.error || "Please try again.", variant: "error" });
              return;
            }
            if (res.demo) {
              toast.push({
                title: "Demo mode",
                message: "Backend auth endpoints not available; continuing with demo session.",
                variant: "warn",
              });
            } else {
              toast.push({ title: "Signed in", message: "Welcome back!", variant: "success" });
            }
            navigate(getRedirectTo(location), { replace: true });
          }}
        >
          <div className="inputRow">
            <input
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              autoComplete="email"
              aria-label="Email"
              required
            />
            <input
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              type="password"
              autoComplete="current-password"
              aria-label="Password"
              required
            />

            <button className="btn btnPrimary" type="submit" disabled={loading}>
              {loading ? "Signing in…" : "Sign in"}
            </button>

            <div className="helpText">
              Don’t have an account?{" "}
              <Link className="btnLink" to="/register">
                Create one
              </Link>
              .
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
