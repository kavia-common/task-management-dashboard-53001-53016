import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

// PUBLIC_INTERFACE
export default function RegisterPage() {
  /** Registration screen. */
  const { register, loading } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <div className="authShell">
      <div className="authCard">
        <div className="authHeader">
          <div className="brandMark" aria-hidden="true" />
          <div>
            <h1>Create account</h1>
            <p>Start tracking tasks with a clean dashboard and live updates.</p>
          </div>
        </div>

        <div className="divider" />

        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const res = await register({ name, email, password });
            if (!res.ok) {
              toast.push({
                title: "Registration failed",
                message: res.error || "Please try again.",
                variant: "error",
              });
              return;
            }
            if (res.demo) {
              toast.push({
                title: "Demo mode",
                message: "Backend register endpoint not available; continuing with demo session.",
                variant: "warn",
              });
            } else {
              toast.push({ title: "Account created", message: "Welcome!", variant: "success" });
            }
            navigate("/app", { replace: true });
          }}
        >
          <div className="inputRow">
            <input
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full name"
              autoComplete="name"
              aria-label="Full name"
              required
            />
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
              autoComplete="new-password"
              aria-label="Password"
              required
            />

            <button className="btn btnPrimary" type="submit" disabled={loading}>
              {loading ? "Creating…" : "Create account"}
            </button>

            <div className="helpText">
              Already have an account?{" "}
              <Link className="btnLink" to="/login">
                Sign in
              </Link>
              .
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
