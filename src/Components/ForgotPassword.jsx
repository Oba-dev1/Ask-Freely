// src/Components/ForgotPassword.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../Firebase/config';

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
    <div className="min-h-screen bg-white text-ink font-sans">
      <div className="flex items-center justify-center min-h-screen p-6">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-lg shadow-black/5 p-8">
            <header className="text-center mb-6">
              <div className="text-2xl text-primary mb-4 inline-block">
                <i className="fas fa-key"></i>
              </div>
              <h1 className="text-xl md:text-2xl font-bold text-ink mb-2 tracking-tight leading-tight">
                Forgot Password?
              </h1>
              <p className="text-neutral-500 text-sm font-normal leading-relaxed">
                No worries! Enter your email and we'll send you reset instructions
              </p>
            </header>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-3 py-2.5 rounded-lg mb-4 text-sm font-medium flex items-center gap-2" role="alert">
                <i className="fas fa-exclamation-circle"></i>
                {error}
              </div>
            )}

            {success ? (
              <div className="text-center py-6 px-4">
                <div className="text-5xl text-emerald-500 mb-5">
                  <i className="fas fa-check-circle"></i>
                </div>
                <h3 className="text-lg font-bold text-ink mb-3">
                  Check Your Email
                </h3>
                <p className="text-neutral-500 mb-3 leading-relaxed text-sm">
                  We've sent password reset instructions to <strong className="text-ink">{email}</strong>
                </p>
                <p className="text-sm text-neutral-400 mt-5 pt-5 border-t border-neutral-200">
                  Didn't receive the email? Check your spam folder or{' '}
                  <button
                    onClick={() => setSuccess(false)}
                    className="text-primary hover:text-primary/80 underline font-semibold bg-transparent border-none cursor-pointer p-0"
                  >
                    try again
                  </button>
                </p>
                <div className="mt-5">
                  <Link
                    to="/login"
                    className="text-primary font-semibold hover:text-primary/80 hover:underline transition-all inline-flex items-center gap-2 text-sm"
                  >
                    <i className="fas fa-arrow-left"></i>
                    Back to Login
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-6">
                <div className="mb-4">
                  <label htmlFor="email" className="block mb-1.5 font-medium text-neutral-700 text-sm">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    disabled={loading}
                    autoFocus
                    required
                    className="w-full px-3 py-2.5 rounded-lg border-[1.5px] border-neutral-200 bg-neutral-50 text-ink text-sm transition-all placeholder:text-neutral-400 hover:border-neutral-300 hover:bg-white focus:border-primary focus:outline-none focus:bg-white focus:ring-[3px] focus:ring-primary/10 disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-2.5 px-4 rounded-lg text-sm mt-2 shadow-md shadow-primary/20 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/30 active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none inline-flex items-center justify-center gap-2"
                  disabled={loading || !email.trim()}
                >
                  {loading ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i>
                      Sending...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-paper-plane"></i>
                      Send Reset Link
                    </>
                  )}
                </button>

                <div className="mt-5 text-center">
                  <p className="text-neutral-500 text-sm">
                    Remember your password?{' '}
                    <Link to="/login" className="text-primary font-semibold hover:text-primary/80 hover:underline transition-all">
                      Sign in
                    </Link>
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
