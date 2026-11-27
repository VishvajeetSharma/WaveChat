import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import WaveMark from "../../../shared/components/WaveMark.jsx";
import ThemeToggle from "../../../shared/components/ThemeToggle.jsx";
import PasswordInput from "../../../shared/components/PasswordInput.jsx";

export default function SignupPage() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const result = await signup(username.trim(), password);
    setLoading(false);
    if (result.ok) navigate("/");
    else setError(result.error);
  };

  return (
    <div className="auth-shell">
      <ThemeToggle className="theme-toggle-floating" />
      <div className="auth-card">
        <div className="brand brand-lg">
          <WaveMark full size={260} />
        </div>
        <p className="auth-tagline">Private messaging, line by line</p>

        {error && <div className="form-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              autoFocus
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="letters, numbers, underscores"
              required
            />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <PasswordInput
              id="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="8+ characters"
            />
          </div>
          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? "Creating account…" : "Create account"}
          </button>
        </form>

        <div className="auth-switch">
          Already have an account? <Link to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
