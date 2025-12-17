// src/Components/Login.jsx
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { sendEmailVerification } from 'firebase/auth';
import { useAuth } from '../context/AuthContext';
import useRecaptcha from '../hooks/useRecaptcha';
import { RECAPTCHA_SITE_KEY } from '../Firebase/config';
import { getFriendlyErrorMessage, retryWithBackoff } from '../utils/errorHandler';
import OfflineBanner from './OfflineBanner';
import './Auth.css';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [touched, setTouched] = useState({ email: false, password: false });
  const [loading, setLoading] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const emailRef = useRef(null);

  const { login, signInWithGoogle, currentUser, userProfile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { executeRecaptcha } = useRecaptcha(RECAPTCHA_SITE_KEY);

  // Redirect if already logged in
  useEffect(() => {
    // Only redirect if auth has finished loading
    if (authLoading) return;

    if (currentUser && userProfile) {
      if (userProfile.profileCompleted) {
        navigate('/organizer/dashboard');
      } else {
        navigate('/profile-setup');
      }
    }
  }, [currentUser, userProfile, authLoading, navigate]);

  // Load remembered email on mount and check for verification/reset success
  useEffect(() => {
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    if (rememberedEmail) {
      setEmail(rememberedEmail);
      setRememberMe(true);
    }

    // Check if user was redirected from email verification or password reset
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('verified') === 'true') {
      setError('');
      // Show success message temporarily
      const successDiv = document.createElement('div');
      successDiv.className = 'success-banner';
      successDiv.role = 'status';
      successDiv.innerHTML = '<i class="fas fa-check-circle"></i> Email verified successfully! You can now sign in.';
      const errorBanner = document.querySelector('.error-banner');
      if (errorBanner) {
        errorBanner.parentNode.insertBefore(successDiv, errorBanner);
      }
      // Remove verified param from URL
      window.history.replaceState({}, '', '/login');
      // Remove success message after 5 seconds
      setTimeout(() => successDiv.remove(), 5000);
    }

    if (urlParams.get('resetSuccess') === 'true') {
      setError('');
      // Show success message temporarily
      const successDiv = document.createElement('div');
      successDiv.className = 'success-banner';
      successDiv.role = 'status';
      successDiv.innerHTML = '<i class="fas fa-check-circle"></i> Password reset successfully! You can now sign in with your new password.';
      const errorBanner = document.querySelector('.error-banner');
      if (errorBanner) {
        errorBanner.parentNode.insertBefore(successDiv, errorBanner);
      }
      // Remove resetSuccess param from URL
      window.history.replaceState({}, '', '/login');
      // Remove success message after 5 seconds
      setTimeout(() => successDiv.remove(), 5000);
    }
  }, []);

  const emailValid = useMemo(() => /\S+@\S+\.\S+/.test(email), [email]);
  const passwordValid = useMemo(() => password.length >= 6, [password]);
  const formValid = emailValid && passwordValid;

  const handleResendVerification = async () => {
    if (!currentUser) return;
    try {
      await sendEmailVerification(currentUser);
      setVerificationSent(true);
      setTimeout(() => setVerificationSent(false), 5000);
    } catch (err) {
      console.error('Error sending verification:', err);
      setError('Failed to send verification email. Please try again.');
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setError('');
      setLoading(true);

      // Execute reCAPTCHA verification with retry
      const recaptchaToken = await retryWithBackoff(
        () => executeRecaptcha('google_login'),
        2 // Max 2 retries for reCAPTCHA
      );

      if (!recaptchaToken) {
        setError('reCAPTCHA verification failed. Please try again.');
        setLoading(false);
        return;
      }

      console.log('✅ reCAPTCHA verified for Google login');
      console.log('🔵 Starting Google Sign-In (redirect)...');
      await signInWithGoogle();
      // User will be redirected to Google sign-in page
      // After authentication, they'll be redirected back
    } catch (err) {
      console.error('❌ Google sign-in error:', err);
      // Use friendly error message utility
      setError(getFriendlyErrorMessage(err));
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({ email: true, password: true });
    if (!formValid) return;

    try {
      setError('');
      setLoading(true);

      // Execute reCAPTCHA verification
      const recaptchaToken = await executeRecaptcha('login');

      if (!recaptchaToken) {
        setError('reCAPTCHA verification failed. Please try again.');
        setLoading(false);
        return;
      }

      console.log('✅ reCAPTCHA verified for login');

      // Handle remember me
      if (rememberMe) {
        localStorage.setItem('rememberedEmail', email);
      } else {
        localStorage.removeItem('rememberedEmail');
      }

      const userCredential = await login(email, password);

      // Check if email is verified
      if (!userCredential.user.emailVerified) {
        setError('Please verify your email before logging in. Check your inbox for the verification link.');
        return;
      }

      navigate('/organizer/dashboard');
    } catch (err) {
      console.error('Login error:', err);
      // Use friendly error message utility
      setError(getFriendlyErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-wrapper">
      <OfflineBanner />
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
                <span className="logo-icon"><i className="fas fa-comments"></i></span>
                <h1>Welcome back</h1>
                <p className="subtitle">Enter your credentials to access your account and manage your events.</p>
              </header>

              {error && (
                <div className="error-banner" role="alert">
                  {error}
                  {error.includes('verify your email') && currentUser && (
                    <div style={{ marginTop: '0.75rem' }}>
                      <button
                        type="button"
                        onClick={handleResendVerification}
                        className="link-button"
                        style={{ fontSize: '0.9rem' }}
                      >
                        {verificationSent ? '✓ Verification email sent!' : 'Resend verification email'}
                      </button>
                    </div>
                  )}
                </div>
              )}

              <form onSubmit={handleSubmit} className="auth-form" noValidate>
                <div className="form-group">
                  <label htmlFor="email">Your email</label>
                  <input
                    ref={emailRef}
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                    required
                    autoComplete="email"
                    placeholder="farazshahid9@gmail.com"
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

              <div className="auth-divider"><span>Or continue with</span></div>

              {/* Google Sign-In */}
              <button
                type="button"
                className="btn btn-google"
                onClick={handleGoogleSignIn}
                disabled={loading}
              >
                <span className="g-icon"><i className="fa-brands fa-google"></i></span>
              </button>

              <div className="auth-links">
                <p>Don't have an account? <Link to="/signup">Sign up</Link></p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default Login;
