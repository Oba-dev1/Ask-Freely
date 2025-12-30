// src/Components/Signup.jsx
import React, { useMemo, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import useRecaptcha from '../hooks/useRecaptcha';
import { RECAPTCHA_SITE_KEY } from '../Firebase/config';
import { getFriendlyErrorMessage, retryWithBackoff } from '../utils/errorHandler';
import OfflineBanner from './OfflineBanner';

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

  // Handle already logged in users
  useEffect(() => {
    if (authLoading) return;

    if (currentUser && userProfile) {
      if (signupSuccess) {
        if (userProfile.profileCompleted) {
          navigate('/organizer/dashboard');
        } else {
          navigate('/profile-setup');
        }
      } else {
        if (userProfile.profileCompleted) {
          navigate('/organizer/dashboard', { replace: true });
        } else {
          navigate('/profile-setup', { replace: true });
        }
      }
    }
  }, [currentUser, userProfile, authLoading, navigate, signupSuccess]);

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

      const recaptchaToken = await retryWithBackoff(
        () => executeRecaptcha('google_signup'),
        2
      );

      if (!recaptchaToken) {
        setError('reCAPTCHA verification failed. Please try again.');
        setLoading(false);
        return;
      }

      console.log('✅ reCAPTCHA verified for Google sign-up');
      console.log('🔵 Starting Google Sign-Up (redirect)...');
      await signInWithGoogle();
    } catch (err) {
      console.error('❌ Google sign-up error:', err);
      setError(getFriendlyErrorMessage(err));
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

      const recaptchaToken = await executeRecaptcha('signup');

      if (!recaptchaToken) {
        setError('reCAPTCHA verification failed. Please try again.');
        setLoading(false);
        return;
      }

      console.log('✅ reCAPTCHA verified for signup');

      await signup(formData.email, formData.password, '');
      setSignupSuccess(true);
    } catch (err) {
      console.error(err);
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
              src="https://res.cloudinary.com/dws3lnn4d/image/upload/v1764865450/male-business-executive-giving-speech_h4qxrj.jpg"
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
                  Create Safe Spaces for Honest Conversations
                </p>
              </div>
              <div className="text-white/95 text-base leading-relaxed max-w-md italic font-medium p-5 border-l-[3px] border-white/30 bg-white/10 rounded-xl backdrop-blur-sm text-center">
                <p>"Transform your Q&amp;A sessions from awkward silences to meaningful dialogue."</p>
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
                  Start Hosting Better Conversations
                </h1>
                <p className="text-neutral-500 text-sm font-normal leading-relaxed">
                  Create your free account and launch your first anonymous Q&amp;A session in under 3 minutes. No credit card required.
                </p>
              </header>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-3 py-2.5 rounded-lg mb-4 text-sm font-medium flex items-center gap-2" role="alert">
                  <span>⚠️</span>
                  {error}
                </div>
              )}

              {signupSuccess ? (
                <div className="text-center py-6 px-4">
                  <div className="text-5xl text-emerald-500 mb-5">
                    <i className="fas fa-envelope-circle-check"></i>
                  </div>
                  <h3 className="text-lg font-bold text-ink mb-3">
                    Verify Your Email to Get Started
                  </h3>
                  <p className="text-neutral-500 mb-3 leading-relaxed text-sm">
                    We've sent a verification link to <strong className="text-ink">{formData.email}</strong>
                  </p>
                  <p className="text-neutral-500 mb-3 leading-relaxed text-sm">
                    Click the link in the email to activate your account and start creating your first Q&amp;A session.
                  </p>
                  <p className="text-sm text-neutral-400 mt-5 pt-5 border-t border-neutral-200">
                    Can't find the email? Check your spam/junk folder or promotions tab.
                  </p>
                  <div className="mt-6">
                    <Link
                      to="/login"
                      className="inline-block bg-primary hover:bg-primary/90 text-white font-semibold py-2.5 px-6 rounded-lg text-sm shadow-md shadow-primary/20 transition-all hover:-translate-y-0.5"
                    >
                      Return to Login
                    </Link>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="mt-6" noValidate>
                  <div className="mb-4">
                    <label htmlFor="email" className="block mb-1.5 font-medium text-neutral-700 text-sm">
                      Work Email Address
                    </label>
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
                      className={`w-full px-3 py-2.5 rounded-lg border-[1.5px] bg-neutral-50 text-ink text-sm transition-all placeholder:text-neutral-400 hover:border-neutral-300 hover:bg-white focus:border-primary focus:outline-none focus:bg-white focus:ring-[3px] focus:ring-primary/10 disabled:opacity-60 disabled:cursor-not-allowed ${
                        touched.email && !emailValid ? 'border-red-500 bg-red-50 focus:ring-red-500/10' : 'border-neutral-200'
                      }`}
                    />
                    {touched.email && !emailValid && (
                      <small id="email-error" className="block mt-1.5 text-xs text-red-600 font-medium">
                        Please enter a valid email address
                      </small>
                    )}
                  </div>

                  <div className="mb-4 relative">
                    <label htmlFor="password" className="block mb-1.5 font-medium text-neutral-700 text-sm">
                      Create Password
                    </label>
                    <div className="relative flex items-center">
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
                        placeholder="At least 6 characters"
                        aria-invalid={touched.password && !passwordValid}
                        aria-describedby={touched.password && !passwordValid ? 'password-error' : undefined}
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
                    {formData.password.length > 0 && (
                      <div className="mt-2 flex items-center gap-2">
                        <div className="flex-1 h-1 bg-neutral-200 rounded overflow-hidden">
                          <div
                            className="h-full transition-all duration-300 rounded"
                            style={{
                              width: `${(passwordStrength.strength / 4) * 100}%`,
                              backgroundColor: passwordStrength.color
                            }}
                          ></div>
                        </div>
                        <span
                          className="text-xs font-semibold min-w-[50px]"
                          style={{ color: passwordStrength.color }}
                        >
                          {passwordStrength.label}
                        </span>
                      </div>
                    )}
                    {touched.password && !passwordValid && (
                      <small id="password-error" className="block mt-1.5 text-xs text-red-600 font-medium">
                        Password must be at least 6 characters long
                      </small>
                    )}
                  </div>

                  <div className="mb-4 relative">
                    <label htmlFor="confirmPassword" className="block mb-1.5 font-medium text-neutral-700 text-sm">
                      Confirm Password
                    </label>
                    <div className="relative flex items-center">
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
                        className={`w-full px-3 py-2.5 pr-10 rounded-lg border-[1.5px] bg-neutral-50 text-ink text-sm transition-all placeholder:text-neutral-400 hover:border-neutral-300 hover:bg-white focus:border-primary focus:outline-none focus:bg-white focus:ring-[3px] focus:ring-primary/10 disabled:opacity-60 disabled:cursor-not-allowed ${
                          touched.confirmPassword && !confirmValid ? 'border-red-500 bg-red-50 focus:ring-red-500/10' : 'border-neutral-200'
                        }`}
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-primary bg-transparent border-none cursor-pointer p-1 rounded transition-colors"
                        onClick={() => setShowPw2((s) => !s)}
                        aria-label={showPw2 ? 'Hide password' : 'Show password'}
                      >
                        <i className={`fa-solid ${showPw2 ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                      </button>
                    </div>
                    {touched.confirmPassword && !confirmValid && (
                      <small id="confirm-error" className="block mt-1.5 text-xs text-red-600 font-medium">
                        Passwords must match
                      </small>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-2.5 px-4 rounded-lg text-sm mt-2 shadow-md shadow-primary/20 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/30 active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none inline-flex items-center justify-center gap-2"
                    disabled={loading || !formValid}
                  >
                    {loading ? 'Creating Your Account...' : 'Create Free Account'}
                  </button>
                </form>
              )}

              {!signupSuccess && (
                <>
                  <div className="flex items-center gap-3 text-neutral-400 text-sm my-5">
                    <span className="h-px flex-1 bg-neutral-200"></span>
                    <span className="opacity-80">Or sign up with</span>
                    <span className="h-px flex-1 bg-neutral-200"></span>
                  </div>

                  {/* Google Sign-Up */}
                  <button
                    type="button"
                    className="w-full mb-3 bg-white border-[1.5px] border-neutral-200 text-neutral-700 rounded-lg py-2.5 px-4 font-medium text-sm hover:bg-neutral-50 hover:border-neutral-300 transition-all inline-flex items-center justify-center gap-2"
                    onClick={handleGoogleSignUp}
                    disabled={loading}
                  >
                    <span className="text-lg"><i className="fa-brands fa-google"></i></span>
                    Continue with Google
                  </button>

                  <div className="mt-5 text-center">
                    <p className="text-neutral-500 text-sm">
                      Already have an account?{' '}
                      <Link to="/login" className="text-primary font-semibold hover:text-primary/80 hover:underline transition-all">
                        Log in
                      </Link>
                    </p>
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
