// src/Components/Login.jsx
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [touched, setTouched] = useState({ email: false, password: false });
  const [loading, setLoading] = useState(false);
  const emailRef = useRef(null);

  const { login } = useAuth();
  const navigate = useNavigate();

  // Load remembered email on mount
  useEffect(() => {
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    if (rememberedEmail) {
      setEmail(rememberedEmail);
      setRememberMe(true);
    }
  }, []);

  const emailValid = useMemo(() => /\S+@\S+\.\S+/.test(email), [email]);
  const passwordValid = useMemo(() => password.length >= 6, [password]);
  const formValid = emailValid && passwordValid;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({ email: true, password: true });
    if (!formValid) return;

    try {
      setError('');
      setLoading(true);

      // Handle remember me
      if (rememberMe) {
        localStorage.setItem('rememberedEmail', email);
      } else {
        localStorage.removeItem('rememberedEmail');
      }

      await login(email, password);
      navigate('/organizer/dashboard');
    } catch (err) {
      console.error('Login error:', err);
      // More specific error messages
      const errorMessage = err?.code === 'auth/wrong-password' || err?.code === 'auth/user-not-found'
        ? 'Invalid email or password. Please try again.'
        : err?.code === 'auth/too-many-requests'
        ? 'Too many failed attempts. Please try again later.'
        : 'Failed to sign in. Please check your credentials.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-wrapper">
      <div className="auth-layout">
        {/* Left: Visual / Brand */}
        <aside className="auth-visual" aria-hidden="true">
          <div className="auth-image-container">
            <img
              src="https://res.cloudinary.com/dws3lnn4d/image/upload/v1762520570/pexels-pamanjoe-14669354_ntetl8.jpg"
              alt="Ask Freely community"
              className="auth-image"
            />
            <div className="auth-image-overlay">
              <div className="brand">
                <div className="logo auth-logo">
                  <span className="logo-icon"><i className="fas fa-comments"></i></span>
                  <span className="logo-text">Ask Freely</span>
                </div>
                <p className="brand-tagline">Real-time Q&amp;A for engaging events</p>
              </div>
              <div className="visual-caption">
                <p>"Create safe spaces where people can ask real questions."</p>
              </div>
            </div>
          </div>
        </aside>

        {/* Right: Form */}
        <main className="auth-panel">
          <div className="auth-container">
            <div className="auth-card">
              <header className="auth-header">
                <h1>Organizer Login</h1>
                <p className="subtitle">Manage your events</p>
              </header>

              {error && <div className="error-banner" role="alert">{error}</div>}

              <form onSubmit={handleSubmit} className="auth-form" noValidate>
                <div className="form-group">
                  <label htmlFor="email">Email</label>
                  <input
                    ref={emailRef}
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                    required
                    autoComplete="email"
                    placeholder="you@organization.com"
                    aria-invalid={touched.email && !emailValid}
                    aria-describedby={!emailValid && touched.email ? 'email-error' : undefined}
                    autoFocus
                  />
                  {touched.email && !emailValid && (
                    <small id="email-error" className="input-error">Enter a valid email address.</small>
                  )}
                </div>

                <div className="form-group password-field">
                  <label htmlFor="password">Password</label>
                  <div className="password-input-wrap">
                    <input
                      type={showPw ? 'text' : 'password'}
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onBlur={() => setTouched((t) => ({ ...t, password: true }))}
                      required
                      autoComplete="current-password"
                      placeholder="••••••••"
                      aria-invalid={touched.password && !passwordValid}
                      aria-describedby={!passwordValid && touched.password ? 'password-error' : undefined}
                    />
                    <button
                      type="button"
                      className="toggle-password"
                      onClick={() => setShowPw((s) => !s)}
                      aria-label={showPw ? 'Hide password' : 'Show password'}
                    >
                      <i className={`fa-solid ${showPw ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                    </button>
                  </div>
                  {touched.password && !passwordValid && (
                    <small id="password-error" className="input-error">Minimum 6 characters.</small>
                  )}
                </div>

                {/* Remember Me & Forgot Password Row */}
                <div className="remember-forgot-row">
                  <label className="remember-me-checkbox">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      aria-label="Remember my email"
                    />
                    <span>Remember me</span>
                  </label>
                  <Link to="/forgot-password" className="forgot-password-link">
                    Forgot Password?
                  </Link>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading || !formValid}
                >
                  {loading ? 'Signing in...' : 'Sign In'}
                </button>
              </form>

              <div className="auth-divider"><span>or</span></div>

              {/* Social (optional; wire up later) */}
              <button
                type="button"
                className="btn btn-google"
                onClick={() => console.log('TODO: Google sign-in')}
              >
                <span className="g-icon"><i class="fa-brands fa-google"></i></span> Continue with Google
              </button>

              <div className="auth-links">
                <p>Don't have an account? <Link to="/signup">Sign Up</Link></p>
                <p><Link to="/">← Back to Home</Link></p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default Login;
