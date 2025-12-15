// src/Components/ForgotPassword.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../Firebase/config';
import './Auth.css';

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }

    try {
      setLoading(true);
      // Configure action code settings for password reset redirect
      // Since localhost is now authorized in Firebase, we can use it directly
      const actionCodeSettings = {
        url: `${window.location.origin}/login?resetSuccess=true`,
        handleCodeInApp: false
      };
      await sendPasswordResetEmail(auth, email, actionCodeSettings);
      setSuccess(true);
    } catch (err) {
      console.error('Password reset error:', err);
      switch (err.code) {
        case 'auth/user-not-found':
          setError('No account found with this email address');
          break;
        case 'auth/invalid-email':
          setError('Invalid email address');
          break;
        case 'auth/too-many-requests':
          setError('Too many requests. Please try again later');
          break;
        default:
          setError('Failed to send reset email. Please try again');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-wrapper">
      <div className="auth-layout-centered">
        <div className="auth-container">
          <div className="auth-card">
              <header className="auth-header">
                <div className="logo-icon">
                  <i className="fas fa-key"></i>
                </div>
                <h1>Forgot Password?</h1>
                <p className="subtitle">
                  No worries! Enter your email and we'll send you reset instructions
                </p>
              </header>

              {error && (
                <div className="error-banner" role="alert">
                  <i className="fas fa-exclamation-circle"></i> {error}
                </div>
              )}

              {success ? (
                <div className="success-message">
                  <div className="success-icon">
                    <i className="fas fa-check-circle"></i>
                  </div>
                  <h3>Check Your Email</h3>
                  <p>
                    We've sent password reset instructions to <strong>{email}</strong>
                  </p>
                  <p className="help-text">
                    Didn't receive the email? Check your spam folder or{' '}
                    <button
                      onClick={() => setSuccess(false)}
                      className="link-button"
                    >
                      try again
                    </button>
                  </p>
                  <div className="auth-links">
                    <Link to="/login">
                      <i className="fas fa-arrow-left"></i> Back to Login
                    </Link>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="auth-form">
                  <div className="form-group">
                    <label htmlFor="email">Email Address</label>
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      disabled={loading}
                      autoFocus
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading || !email.trim()}
                  >
                    {loading ? (
                      <>
                        <i className="fas fa-spinner fa-spin"></i> Sending...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-paper-plane"></i> Send Reset Link
                      </>
                    )}
                  </button>

                  <div className="auth-links">
                    <p>
                      Remember your password?{' '}
                      <Link to="/login">Sign in</Link>
                    </p>
                  </div>
                </form>
              )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;
