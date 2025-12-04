// src/Components/Signup.jsx
import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

function Signup() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    organizationName: ''
  });
  const [showPw, setShowPw] = useState(false);
  const [showPw2, setShowPw2] = useState(false);
  const [touched, setTouched] = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  const emailValid = useMemo(() => /\S+@\S+\.\S+/.test(formData.email), [formData.email]);
  const passwordValid = useMemo(() => formData.password.length >= 6, [formData.password]);
  const orgValid = useMemo(() => formData.organizationName.trim().length > 1, [formData.organizationName]);
  const confirmValid = useMemo(() => formData.confirmPassword === formData.password && formData.confirmPassword.length > 0, [formData.confirmPassword, formData.password]);

  const formValid = emailValid && passwordValid && confirmValid && orgValid;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({ email: true, password: true, confirmPassword: true, organizationName: true });
    if (!formValid) return;

    try {
      setError('');
      setLoading(true);
      await signup(formData.email, formData.password, formData.organizationName);
      navigate('/organizer/dashboard');
    } catch (err) {
      console.error(err);
      setError('Failed to create account. ' + (err?.message || 'Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-wrapper">
      <div className="auth-layout">
        <aside className="auth-visual" aria-hidden="true">
          <div className="auth-image-container">
            <img
              src="https://res.cloudinary.com/dws3lnn4d/image/upload/v1764865450/male-business-executive-giving-speech_h4qxrj.jpg"
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
                <p>"Start better conversations with your audience."</p>
              </div>
            </div>
          </div>
        </aside>

        <main className="auth-panel">
          <div className="auth-container">
            <div className="auth-card">
              <header className="auth-header">
                <h1>Create Organizer Account</h1>
                <p className="subtitle">Start managing your events</p>
              </header>

              {error && <div className="error-banner" role="alert">{error}</div>}

              <form onSubmit={handleSubmit} className="auth-form" noValidate>
                <div className="form-group">
                  <label htmlFor="organizationName">Organization Name</label>
                  <input
                    type="text"
                    id="organizationName"
                    name="organizationName"
                    value={formData.organizationName}
                    onChange={handleChange}
                    onBlur={() => setTouched((t) => ({ ...t, organizationName: true }))}
                    required
                    placeholder="Your church, company, or organization"
                    aria-invalid={touched.organizationName && !orgValid}
                    aria-describedby={touched.organizationName && !orgValid ? 'org-error' : undefined}
                  />
                  {touched.organizationName && !orgValid && (
                    <small id="org-error" className="input-error">Please enter a valid organization name.</small>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="email">Email</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                    required
                    autoComplete="email"
                    placeholder="you@organization.com"
                    aria-invalid={touched.email && !emailValid}
                    aria-describedby={touched.email && !emailValid ? 'email-error' : undefined}
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
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      onBlur={() => setTouched((t) => ({ ...t, password: true }))}
                      required
                      autoComplete="new-password"
                      minLength="6"
                      placeholder="••••••••"
                      aria-invalid={touched.password && !passwordValid}
                      aria-describedby={touched.password && !passwordValid ? 'password-error' : undefined}
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

                <div className="form-group password-field">
                  <label htmlFor="confirmPassword">Confirm Password</label>
                  <div className="password-input-wrap">
                    <input
                      type={showPw2 ? 'text' : 'password'}
                      id="confirmPassword"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      onBlur={() => setTouched((t) => ({ ...t, confirmPassword: true }))}
                      required
                      autoComplete="new-password"
                      placeholder="••••••••"
                      aria-invalid={touched.confirmPassword && !confirmValid}
                      aria-describedby={touched.confirmPassword && !confirmValid ? 'confirm-error' : undefined}
                    />
                    <button
                      type="button"
                      className="toggle-password"
                      onClick={() => setShowPw2((s) => !s)}
                      aria-label={showPw2 ? 'Hide password' : 'Show password'}
                    >
                      <i className={`fa-solid ${showPw ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                    </button>
                  </div>
                  {touched.confirmPassword && !confirmValid && (
                    <small id="confirm-error" className="input-error">Passwords must match.</small>
                  )}
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading || !formValid}
                >
                  {loading ? 'Creating Account...' : 'Sign Up'}
                </button>
              </form>

              <div className="auth-divider"><span>or</span></div>

              {/* Social (optional; wire up later) */}
              <button
                type="button"
                className="btn btn-google"
                onClick={() => console.log('TODO: Google sign-up')}
              >
                <span className="g-icon"><i class="fa-brands fa-google"></i></span> Continue with Google
              </button>

              <div className="auth-links">
                <p>Already have an account? <Link to="/login">Sign In</Link></p>
                <p><Link to="/">← Back to Home</Link></p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default Signup;
