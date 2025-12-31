// src/Components/Login.jsx
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { sendEmailVerification } from 'firebase/auth';
import { useAuth } from '../context/AuthContext';
// reCAPTCHA temporarily disabled - will be implemented later
// import useRecaptcha from '../hooks/useRecaptcha';
// import { RECAPTCHA_SITE_KEY } from '../Firebase/config';
import { getFriendlyErrorMessage } from '../utils/errorHandler';
import OfflineBanner from './OfflineBanner';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [touched, setTouched] = useState({ email: false, password: false });
  const [loading, setLoading] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const emailRef = useRef(null);

  const { login, signInWithGoogle, currentUser, userProfile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  // reCAPTCHA temporarily disabled
  // const { executeRecaptcha } = useRecaptcha(RECAPTCHA_SITE_KEY);

  // Redirect if already logged in
  useEffect(() => {
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

    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('verified') === 'true') {
      setError('');
      setSuccessMessage('Email verified successfully! You can now sign in.');
      window.history.replaceState({}, '', '/login');
      setTimeout(() => setSuccessMessage(''), 5000);
    }

    if (urlParams.get('resetSuccess') === 'true') {
      setError('');
      setSuccessMessage('Password reset successfully! You can now sign in with your new password.');
      window.history.replaceState({}, '', '/login');
      setTimeout(() => setSuccessMessage(''), 5000);
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

      // reCAPTCHA temporarily disabled - will be implemented later
      // const recaptchaToken = await retryWithBackoff(
      //   () => executeRecaptcha('google_login'),
      //   2
      // );

      // if (!recaptchaToken) {
      //   setError('reCAPTCHA verification failed. Please try again.');
      //   setLoading(false);
      //   return;
      // }

      // console.log('✅ reCAPTCHA verified for Google login');
      console.log('🔵 Starting Google Sign-In (redirect)...');
      await signInWithGoogle();
    } catch (err) {
      console.error('❌ Google sign-in error:', err);
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

      // reCAPTCHA temporarily disabled - will be implemented later
      // const recaptchaToken = await executeRecaptcha('login');

      // if (!recaptchaToken) {
      //   setError('reCAPTCHA verification failed. Please try again.');
      //   setLoading(false);
      //   return;
      // }

      // console.log('✅ reCAPTCHA verified for login');

      if (rememberMe) {
        localStorage.setItem('rememberedEmail', email);
      } else {
        localStorage.removeItem('rememberedEmail');
      }

      const userCredential = await login(email, password);

      if (!userCredential.user.emailVerified) {
        setError('Please verify your email before logging in. Check your inbox for the verification link.');
        return;
      }

      navigate('/organizer/dashboard');
    } catch (err) {
      console.error('Login error:', err);
      setError(getFriendlyErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-ink font-sans">
      <OfflineBanner />
      <div className="grid lg:grid-cols-[1fr_1.1fr] min-h-screen">
        {/* Left: Visual / Brand */}
        <aside className="relative bg-neutral-50 overflow-hidden hidden lg:block" aria-hidden="true">
          <div className="relative w-full h-full min-h-screen">
            <img
              src="https://res.cloudinary.com/dws3lnn4d/image/upload/v1762520570/pexels-pamanjoe-14669354_ntetl8.jpg"
              alt="Ask Freely community"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 z-10 p-8 lg:p-12 flex flex-col items-center justify-between bg-black/40">
              <div className="flex flex-col items-center gap-3 text-center">
                <div className="inline-flex items-center gap-3 font-extrabold tracking-tight text-white">
                  <span className="text-2xl bg-white/20 w-12 h-12 rounded-xl inline-flex items-center justify-center backdrop-blur-sm text-primary">
                    <i className="fas fa-comments"></i>
                  </span>
                  <span className="text-2xl">Ask Freely</span>
                </div>
                <p className="text-white/90 text-base font-medium max-w-xs leading-relaxed">
                  Real-time Q&amp;A for engaging events
                </p>
              </div>
              <div className="text-white/95 text-base leading-relaxed max-w-md italic font-medium p-5 border-l-[3px] border-white/30 bg-white/10 rounded-xl backdrop-blur-sm text-center">
                <p>"Create safe spaces where people can ask real questions."</p>
              </div>
            </div>
          </div>
        </aside>

        {/* Right: Form */}
        <main className="flex justify-center items-center p-6 md:p-10 lg:p-12 bg-white">
          <div className="w-full max-w-md">
            <div className="w-full">
              <header className="text-center mb-6">
                <span className="text-2xl text-primary mb-4 inline-block">
                  <i className="fas fa-comments"></i>
                </span>
                <h1 className="text-xl md:text-2xl font-bold text-ink mb-2 tracking-tight leading-tight">
                  Welcome back
                </h1>
                <p className="text-neutral-500 text-sm font-normal leading-relaxed">
                  Enter your credentials to access your account and manage your events.
                </p>
              </header>

              {successMessage && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-3 py-2.5 rounded-lg mb-4 text-sm font-medium flex items-center gap-2" role="status">
                  <i className="fas fa-check-circle"></i>
                  {successMessage}
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-3 py-2.5 rounded-lg mb-4 text-sm font-medium flex items-start gap-2" role="alert">
                  <span className="mt-0.5">⚠️</span>
                  <div>
                    {error}
                    {error.includes('verify your email') && currentUser && (
                      <div className="mt-2">
                        <button
                          type="button"
                          onClick={handleResendVerification}
                          className="text-primary hover:text-primary/80 underline text-sm font-semibold bg-transparent border-none cursor-pointer p-0"
                        >
                          {verificationSent ? '✓ Verification email sent!' : 'Resend verification email'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="mt-6" noValidate>
                <div className="mb-4">
                  <label htmlFor="email" className="block mb-1.5 font-medium text-neutral-700 text-sm">
                    Your email
                  </label>
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
                    className={`w-full px-3 py-2.5 rounded-lg border-[1.5px] bg-neutral-50 text-ink text-sm transition-all placeholder:text-neutral-400 hover:border-neutral-300 hover:bg-white focus:border-primary focus:outline-none focus:bg-white focus:ring-[3px] focus:ring-primary/10 disabled:opacity-60 disabled:cursor-not-allowed ${
                      touched.email && !emailValid ? 'border-red-500 bg-red-50 focus:ring-red-500/10' : 'border-neutral-200'
                    }`}
                  />
                  {touched.email && !emailValid && (
                    <small id="email-error" className="block mt-1.5 text-xs text-red-600 font-medium">
                      Enter a valid email address.
                    </small>
                  )}
                </div>

                <div className="mb-4 relative">
                  <label htmlFor="password" className="block mb-1.5 font-medium text-neutral-700 text-sm">
                    Password
                  </label>
                  <div className="relative flex items-center">
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
                      className={`w-full px-3 py-2.5 pr-10 rounded-lg border-[1.5px] bg-neutral-50 text-ink text-sm transition-all placeholder:text-neutral-400 hover:border-neutral-300 hover:bg-white focus:border-primary focus:outline-none focus:bg-white focus:ring-[3px] focus:ring-primary/10 disabled:opacity-60 disabled:cursor-not-allowed ${
                        touched.password && !passwordValid ? 'border-red-500 bg-red-50 focus:ring-red-500/10' : 'border-neutral-200'
                      }`}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-primary bg-transparent border-none cursor-pointer p-1 rounded transition-colors"
                      onClick={() => setShowPw((s) => !s)}
                      aria-label={showPw ? 'Hide password' : 'Show password'}
                    >
                      <i className={`fa-solid ${showPw ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                    </button>
                  </div>
                  {touched.password && !passwordValid && (
                    <small id="password-error" className="block mt-1.5 text-xs text-red-600 font-medium">
                      Minimum 6 characters.
                    </small>
                  )}
                </div>

                {/* Remember Me & Forgot Password Row */}
                <div className="flex justify-between items-center my-4">
                  <label className="flex items-center gap-2 cursor-pointer text-sm text-neutral-700 font-normal select-none hover:text-primary">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      aria-label="Remember my email"
                      className="w-4 h-4 cursor-pointer accent-primary rounded"
                    />
                    <span>Remember me</span>
                  </label>
                  <Link
                    to="/forgot-password"
                    className="text-primary text-sm font-medium hover:text-primary/80 hover:underline transition-all"
                  >
                    Forgot Password?
                  </Link>
                </div>

                <button
                  type="submit"
                  className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-2.5 px-4 rounded-lg text-sm mt-2 shadow-md shadow-primary/20 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/30 active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none inline-flex items-center justify-center gap-2"
                  disabled={loading || !formValid}
                >
                  {loading ? 'Signing in...' : 'Sign In'}
                </button>
              </form>

              <div className="flex items-center gap-3 text-neutral-400 text-sm my-5">
                <span className="h-px flex-1 bg-neutral-200"></span>
                <span className="opacity-80">Or continue with</span>
                <span className="h-px flex-1 bg-neutral-200"></span>
              </div>

              {/* Google Sign-In */}
              <button
                type="button"
                className="w-full mb-3 bg-white border-[1.5px] border-neutral-200 text-neutral-700 rounded-lg py-2.5 px-4 font-medium text-sm hover:bg-neutral-50 hover:border-neutral-300 transition-all inline-flex items-center justify-center gap-2"
                onClick={handleGoogleSignIn}
                disabled={loading}
              >
                <span className="text-lg"><i className="fa-brands fa-google"></i></span>
              </button>

              <div className="mt-5 text-center">
                <p className="text-neutral-500 text-sm">
                  Don't have an account?{' '}
                  <Link to="/signup" className="text-primary font-semibold hover:text-primary/80 hover:underline transition-all">
                    Sign up
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default Login;
