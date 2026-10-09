import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { apiRequest } from "../api/client";
import "./Login.css";

function Login() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const data = await apiRequest(
        "/auth/login/",
        {
          method: "POST",
          body: JSON.stringify({
            username,
            password,
          }),
        }
      );

      localStorage.setItem(
        "access_token",
        data.access
      );

      localStorage.setItem(
        "refresh_token",
        data.refresh
      );

      localStorage.setItem(
        "user",
        JSON.stringify(data.user)
      );

      navigate("/dashboard");
    } catch (error) {
      setError(
        error.message ||
        "Invalid username or password."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">

      <div className="login-card">

        <div className="login-brand">
          <div className="login-logo">
            CM
          </div>

          <div>
            <h1>CMRS</h1>
            <p>
              Cash Management & Reconciliation
            </p>
          </div>
        </div>

        <div className="login-heading">
          <h2>Welcome back</h2>
          <p>
            Sign in to access your CMRS dashboard.
          </p>
        </div>

        <form
          className="login-form"
          onSubmit={handleSubmit}
        >

          <div className="login-field">
            <label htmlFor="username">
              Username
            </label>

            <input
              id="username"
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={(event) =>
                setUsername(event.target.value)
              }
              autoComplete="username"
              required
            />
          </div>

          <div className="login-field">
            <label htmlFor="password">
              Password
            </label>

            <div className="password-wrapper">

              <input
                id="password"
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                placeholder="Enter your password"
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                autoComplete="current-password"
                required
              />

              <button
                type="button"
                className="password-toggle"
                onClick={() =>
                  setShowPassword(
                    !showPassword
                  )
                }
              >
                {showPassword ? "Hide" : "Show"}
              </button>

            </div>
          </div>

          {error && (
            <div className="login-error">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="login-button"
            disabled={loading}
          >
            {loading
              ? "Signing in..."
              : "Sign in"}
          </button>

        </form>

        <div className="login-footer">
          <span>
            Secure access to CMRS
          </span>

          <span>
            v1.0
          </span>
        </div>

      </div>

    </div>
  );
}

export default Login;