import { useState } from "react";
import {
  Eye,
  EyeOff,
  GraduationCap,
  LockKeyhole,
  Mail,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import "./login.css";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

function Login() {
  const { completeLogin } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] =
    useState(false);
  const [status, setStatus] =
    useState("idle");
  const [errorMessage, setErrorMessage] =
    useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail || !password) {
      setErrorMessage(
        "Please enter your email and password.",
      );
      return;
    }

    setStatus("loading");
    setErrorMessage("");

    try {
      const response = await fetch(
        `${API_BASE_URL}/auth/issuer/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: normalizedEmail,
            password,
          }),
        },
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.message ||
            data.error?.message ||
            "Incorrect email or password.",
        );
      }

      const loginData = data.data ?? data;
      const accessToken = loginData.accessToken;
      const user = loginData.user ?? {
        email: normalizedEmail,
      };

      localStorage.setItem("accessToken", accessToken);

      completeLogin(user);
      window.history.replaceState(null, "", "#/dashboard");
      window.dispatchEvent(new PopStateEvent("popstate"));

      setStatus("success");
    } catch (error) {
      setStatus("error");
      setErrorMessage(
        error.message ||
          "Unable to sign in. Please try again.",
      );
    }
  };

  return (
    <main className="login-page">
      <section className="login-panel">
        <div className="login-brand">
          <div className="login-brand-icon">
            <GraduationCap size={25} />
          </div>

          <div>
            <p>AU Wallet</p>
            <span>Issuer Portal</span>
          </div>
        </div>

        <div className="login-heading">
          <p className="login-eyebrow">
            Registrar Workspace
          </p>

          <h1>Welcome back</h1>

          <p>
            Sign in with your authorized Registrar
            account to continue.
          </p>
        </div>

        <form
          className="login-form"
          onSubmit={handleSubmit}
        >
          <div className="login-field">
            <label htmlFor="admin-email">
              Email
            </label>

            <div className="login-input-wrapper">
              <Mail size={17} />

              <input
                id="admin-email"
                type="email"
                value={email}
                placeholder="registrar@au.edu"
                autoComplete="username"
                onChange={(event) =>
                  setEmail(event.target.value)
                }
              />
            </div>
          </div>

          <div className="login-field">
            <label htmlFor="admin-password">
              Password
            </label>

            <div className="login-input-wrapper">
              <LockKeyhole size={17} />

              <input
                id="admin-password"
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                value={password}
                placeholder="Enter your password"
                autoComplete="current-password"
                onChange={(event) =>
                  setPassword(event.target.value)
                }
              />

              <button
                type="button"
                className="login-password-toggle"
                aria-label={
                  showPassword
                    ? "Hide password"
                    : "Show password"
                }
                onClick={() =>
                  setShowPassword(
                    (current) => !current,
                  )
                }
              >
                {showPassword ? (
                  <EyeOff size={17} />
                ) : (
                  <Eye size={17} />
                )}
              </button>
            </div>
          </div>

          {errorMessage && (
            <div
              className="login-error"
              role="alert"
            >
              {errorMessage}
            </div>
          )}

          <button
            type="submit"
            className="login-submit"
            disabled={status === "loading"}
          >
            {status === "loading"
              ? "Signing in..."
              : "Sign In"}
          </button>
        </form>

        <div className="login-footer">
          <p>
            Authorized Assumption University
            personnel only.
          </p>
        </div>
      </section>

      <aside className="login-information">
        <div>
          <p className="login-information-label">
            AU Digital Credentials
          </p>

          <h2>
            Official transcript issuance,
            managed by the Registrar.
          </h2>

          <p>
            Review student academic records,
            prepare digital transcripts and monitor
            credential activity from one workspace.
          </p>
        </div>

        <span>
          Assumption University
        </span>
      </aside>
    </main>
  );
}

export default Login;