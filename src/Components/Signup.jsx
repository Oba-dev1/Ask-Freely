// src/Components/Signup.jsx
import React, { useMemo, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import useRecaptcha from '../hooks/useRecaptcha';
import { RECAPTCHA_SITE_KEY } from '../Firebase/config';
import './Auth.css';

function Signup() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPw, setShowPw] = useState(false);
  const [showPw2, setShowPw2] = useState(false);
  const [touched, setTouched] = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);
  const { signup, signInWithGoogle, currentUser, userProfile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { executeRecaptcha } = useRecaptcha(RECAPTCHA_SITE_KEY);

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && currentUser && userProfile) {
      if (userProfile.profileCompleted) {
        navigate('/organizer/dashboard');
      } else {
        navigate('/profile-setup');
      }
    }
  }, [currentUser, userProfile, authLoading, navigate]);

  const emailValid = useMemo(() => /\S+@\S+\.\S+/.test(formData.email), [formData.email]);
  const passwordValid = useMemo(() => formData.password.length >= 6, [formData.password]);
  const confirmValid = useMemo(() => formData.confirmPassword === formData.password && formData.confirmPassword.length > 0, [formData.confirmPassword, formData.password]);

  const formValid = emailValid && passwordValid && confirmValid;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
  };

  // Password strength calculation
  const getPasswordStrength = (password) => {
    if (password.length === 0) return { strength: 0, label: '', color: '' };
    if (password.length < 6) return { strength: 1, label: 'Weak', color: '#EF4444' };

    let score = 0;
    if (password.length >= 8) score++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[@$!%*?&#]/.test(password)) score++;

    if (score <= 1) return { strength: 2, label: 'Fair', color: '#F59E0B' };
    if (score === 2) return { strength: 3, label: 'Good', color: '#10B981' };
    return { strength: 4, label: 'Strong', color: '#059669' };
  };

  const passwordStrength = useMemo(() => getPasswordStrength(formData.password), [formData.password]);

  const handleGoogleSignUp = async () => {
    try {
      setError('');
      setLoading(true);

      // Execute reCAPTCHA verification
      const recaptchaToken = await executeRecaptcha('google_signup');

      if (!recaptchaToken) {
        setError('reCAPTCHA verification failed. Please try again.');
        setLoading(false);
        return;
      }

      console.log('✅ reCAPTCHA verified for Google sign-up');
      console.log('🔵 Starting Google Sign-Up (redirect)...');
      await signInWithGoogle();
      // User will be redirected to Google sign-in page
      // After authentication, they'll be redirected back
    } catch (err) {
      console.error('❌ Google sign-up error:', err);
      console.error('Error code:', err.code);
      console.error('Error message:', err.message);

      if (err.code === 'auth/unauthorized-domain') {
        setError('This domain is not authorized. Please add it to Firebase authorized domains.');
      } else {
        setError(`Failed to sign up with Google: ${err.message}`);
      }
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({ email: true, password: true, confirmPassword: true });
    if (!formValid) return;

    try {
      setError('');
      setLoading(true);

      // Execute reCAPTCHA verification
      const recaptchaToken = await executeRecaptcha('signup');

      if (!recaptchaToken) {
        setError('reCAPTCHA verification failed. Please try again.');
        setLoading(false);
        return;
      }

      console.log('✅ reCAPTCHA verified for signup');

      // Signup without organization name - will be collected in profile setup
      await signup(formData.email, formData.password, '');
      // Show success message instead of redirecting
      setSignupSuccess(true);
    } catch (err) {
      console.error(err);
      // More specific error messages
      const errorMessage = err?.code === 'auth/email-already-in-use'
        ? 'This email is already registered. Please sign in instead.'
        : err?.code === 'auth/weak-password'
        ? 'Password is too weak. Please use a stronger password.'
        : err?.code === 'auth/invalid-email'
        ? 'Invalid email address format.'
        : 'Failed to create account. ' + (err?.message || 'Please try again.');
      setError(errorMessage);
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
                <span className="logo-icon"><i className="fas fa-comments"></i></span>
                <h1>Create an account</h1>
                <p className="subtitle">Access your tasks, notes, and projects anytime, anywhere - and keep everything flowing in one place.</p>
              </header>

              {error && <div className="error-banner" role="alert">{error}</div>}

              {signupSuccess ? (
                <div className="success-message">
                  <div className="success-icon">
                    <i className="fas fa-envelope-circle-check"></i>
                  </div>
                  <h3>Check Your Email!</h3>
                  <p>
                    We've sent a verification link to <strong>{formData.email}</strong>
                  </p>
                  <p>
                    Please check your inbox and click the verification link to activate your account.
                  </p>
                  <p className="help-text">
                    Didn't receive the email? Check your spam folder.
                  </p>
                  <div className="auth-links" style={{ marginTop: '2rem' }}>
                    <Link to="/login" className="btn btn-primary" style={{ display: 'inline-block', textDecoration: 'none' }}>
                      Go to Login
                    </Link>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="auth-form" noValidate>
                <div className="form-group">
                  <label htmlFor="email">Your email</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                    required
                    autoComplete="email"
                    placeholder="farazshahid9@gmail.com"
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
                  {formData.password.length > 0 && (
                    <div className="password-strength-indicator">
                      <div className="strength-bar">
                        <div
                          className="strength-bar-fill"
                          style={{
                            width: `${(passwordStrength.strength / 4) * 100}%`,
                            backgroundColor: passwordStrength.color
                          }}
                        ></div>
                      </div>
                      <span className="strength-label" style={{ color: passwordStrength.color }}>
                        {passwordStrength.label}
                      </span>
                    </div>
                  )}
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
                  {loading ? 'Creating Account...' : 'Get Started'}
                </button>
              </form>
              )}

              {!signupSuccess && (
                <>
                  <div className="auth-divider"><span>Or continue with</span></div>

              {/* Google Sign-Up */}
                  <button
                    type="button"
                    className="btn btn-google"
                    onClick={handleGoogleSignUp}
                    disabled={loading}
                  >
                    <span className="g-icon"><i className="fa-brands fa-google"></i></span>
                  </button>

                  <div className="auth-links">
                    <p>Already have an account? <Link to="/login">Sign in</Link></p>
                  </div>
                </>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default Signup;
