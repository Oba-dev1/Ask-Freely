// src/App.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useNavigate,
  Navigate,
} from "react-router-dom";
import { ref, onValue } from "firebase/database";
import { database } from "./Firebase/config";

import { AuthProvider } from "./context/AuthContext";
import ParticipantForm from "./Components/ParticipantForm";
import HostDashboard from "./Components/HostDashboard";
import Login from "./Components/Login";
import Signup from "./Components/Signup";
import OrganizerDashboard from "./Components/OrganizerDashboard";
import OrganizerAnalytics from "./Components/OrganizerAnalytics";
import CreateEvent from "./Components/CreateEvent";
import EventManagement from "./Components/EventManagement";

import "./App.css";
import "./LandingPage.css";
import "@fortawesome/fontawesome-free/css/all.min.css";

// LandingPage.jsx (inline in App.jsx or as a separate component)
function LandingPage() {
  const navigate = useNavigate();

  // --- Live stats from Firebase ---
  const [eventsCount, setEventsCount] = useState(0);
  const [questionsCount, setQuestionsCount] = useState(0);
  const [participantsCount, setParticipantsCount] = useState(0);

  // simple count-up animation
  function useCountUp(target, duration = 650) {
    const [val, setVal] = useState(0);
    const fromRef = useRef(0);
    const startRef = useRef(0);
    const targetRef = useRef(target);
    useEffect(() => {
      targetRef.current = target;
    }, [target]);
    useEffect(() => {
      let raf;
      const step = (ts) => {
        if (!startRef.current) {
          startRef.current = ts;
          fromRef.current = val;
        }
        const p = Math.min((ts - startRef.current) / duration, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        const next = Math.round(
          fromRef.current + (targetRef.current - fromRef.current) * eased
        );
        setVal(next);
        if (p < 1) raf = requestAnimationFrame(step);
        else startRef.current = 0;
      };
      raf = requestAnimationFrame(step);
      return () => cancelAnimationFrame(raf);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [target]);
    return val;
  }

  const liveEvents = useCountUp(eventsCount);
  const liveQuestions = useCountUp(questionsCount);
  const liveParticipants = useCountUp(participantsCount);

  useEffect(() => {
    const evRef = ref(database, "events");
    const unSubEvents = onValue(evRef, (snap) => {
      const data = snap.val() || {};
      setEventsCount(Object.keys(data).length);
    });

    const qRef = ref(database, "questions");
    const unSubQuestions = onValue(qRef, (snap) => {
      const data = snap.val() || {};
      let total = 0;
      const authors = new Set();
      for (const eid of Object.keys(data)) {
        const perEvent = data[eid] || {};
        for (const qid of Object.keys(perEvent)) {
          const q = perEvent[qid];
          total += 1;
          if (q?.source === "audience" || q?.source === "anonymous") {
            const a = (q?.author || "anon").toString().trim() || "anon";
            authors.add(a);
          }
        }
      }
      setQuestionsCount(total);
      setParticipantsCount(authors.size);
    });

    return () => {
      unSubEvents();
      unSubQuestions();
    };
  }, []);

  const fmt = useMemo(
    () => (n) =>
      n >= 1_000_000
        ? `${(n / 1_000_000).toFixed(1)}M`
        : n >= 1_000
        ? `${(n / 1_000).toFixed(1)}k`
        : `${n}`,
    []
  );

  return (
    <div className="landing-page">
      {/* Nav */}
      <nav className="navbar lp">
        <div className="nav-container">
          <div className="logo">
            <span className="logo-icon">
              <i className="fas fa-comments" />
            </span>
            <span className="logo-text">Ask Freely</span>
          </div>
          <div className="nav-links">
            <button onClick={() => navigate("/login")} className="nav-link">
              Sign In
            </button>
            <button
              onClick={() => navigate("/signup")}
              className="btn-primary-nav"
            >
              Get Started Free
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="hero-section refined">
        <div className="hero-container">
          <div className="hero-left">
            <div className="eyebrow">
              <span className="dot" />
              Built for community-first conversations
            </div>
            <h1 className="hero-title">
              Run <span className="gradient-text">braver Q&A</span> at every
              event
            </h1>
            <p className="hero-subtitle">
              Live question collection, smooth moderation, and analytics that
              celebrate your community’s voice. Perfect for churches,
              conferences, town halls, and teams.
            </p>
            <div className="hero-cta">
              <button
                onClick={() => navigate("/signup")}
                className="btn-hero-primary"
              >
                Start Free
                <span className="btn-arrow">
                  <i className="fas fa-arrow-right" />
                </span>
              </button>
              <button
                onClick={() => navigate("/participate")}
                className="btn-hero-secondary"
              >
                Try the Demo
              </button>
            </div>

            <div className="hero-stats live">
              <div className="stat">
                <i className="fa-solid fa-square-poll-horizontal stat-ico" />
                <div className="stat-number" aria-live="polite">
                  {fmt(liveQuestions)}
                </div>
                <div className="stat-label">Questions Managed</div>
              </div>
              <div className="stat">
                <i className="fa-solid fa-calendar-check stat-ico" />
                <div className="stat-number" aria-live="polite">
                  {fmt(liveEvents)}
                </div>
                <div className="stat-label">Events Hosted</div>
              </div>
              <div className="stat">
                <i className="fa-solid fa-user-group stat-ico" />
                <div className="stat-number" aria-live="polite">
                  {fmt(liveParticipants)}
                </div>
                <div className="stat-label">Unique Participants</div>
              </div>
            </div>

            <div className="trust-row">
              <span className="trust-text">Trusted by growing communities</span>
              <div className="logo-strip">
                {/* Swap these placeholders with real logos */}
                <img src="/images/logo-1.svg" alt="Org 1" />
                <img src="/images/logo-2.svg" alt="Org 2" />
                <img src="/images/logo-3.svg" alt="Org 3" />
                <img src="/images/logo-4.svg" alt="Org 4" />
              </div>
            </div>
          </div>

          <div className="hero-right">
            {/* Replace with your screenshots/hero images */}
            <div className="phone-mock">
              <img src="/images/phone-participant.png" alt="Participant view" />
            </div>
            <div className="panel-mock">
              <img src="/images/host-dashboard.png" alt="MC/Host dashboard" />
            </div>
          </div>
        </div>
      </section>

      {/* Use-cases (like Pigeonhole’s clarity) */}
      <section className="usecases-section">
        <div className="usecases-container">
          <h2 className="section-title">Built for the moments that matter</h2>
          <p className="section-subtitle">Ask Freely adapts to your format.</p>

          <div className="usecases-grid">
            <div className="use-card">
              <i className="fa-solid fa-church use-ico" />
              <h3>Church Q&amp;A</h3>
              <p>Safe, anonymous, and spirit-led conversations.</p>
            </div>
            <div className="use-card">
              <i className="fa-solid fa-people-roof use-ico" />
              <h3>Community Forums</h3>
              <p>Surface real concerns and create buy-in.</p>
            </div>
            <div className="use-card">
              <i className="fa-solid fa-briefcase use-ico" />
              <h3>All-hands &amp; Town Halls</h3>
              <p>Transparent dialogue that builds trust.</p>
            </div>
            <div className="use-card">
              <i className="fa-solid fa-graduation-cap use-ico" />
              <h3>Campus Events</h3>
              <p>Amplify student voices with ease.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features (including Customization) */}
      <section className="features-section refined" id="features">
        <div className="features-container">
          <div className="section-header">
            <h2 className="section-title">
              Everything you need for seamless Q&amp;A
            </h2>
            <p className="section-subtitle">
              Crafted for organizers, MCs, and participants.
            </p>
          </div>

          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <i className="fas fa-bullseye" />
              </div>
              <h3>Strategic Questions</h3>
              <p>Guide conversations with pre-loaded prompts and categories.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <i className="fas fa-user-secret" />
              </div>
              <h3>Anonymous Submissions</h3>
              <p>Psychological safety encourages honest, braver questions.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <i className="fa-solid fa-bolt" />
              </div>
              <h3>Real-Time Updates</h3>
              <p>Questions stream in live—no refresh, no friction.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <i className="fas fa-chart-bar" />
              </div>
              <h3>Smart Analytics</h3>
              <p>Track participation, export insights, celebrate engagement.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <i className="fas fa-microphone" />
              </div>
              <h3>MC Dashboard</h3>
              <p>Clear filters and focus modes for confident moderation.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <i className="fa-solid fa-sliders" />
              </div>
              <h3>Customization</h3>
              <p>
                Branding, themes, and share links that feel like <em>your</em>{" "}
                community.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Community mosaic */}
      <section className="mosaic-section">
        <div className="mosaic">
          <img src="/images/mosaic-1.jpg" alt="Audience asking questions" />
          <img src="/images/mosaic-2.jpg" alt="MC guiding session" />
          <img src="/images/mosaic-3.jpg" alt="Volunteer team" />
          <img src="/images/mosaic-4.jpg" alt="Community breakout" />
          <img src="/images/mosaic-5.jpg" alt="Church Q&A" />
          <img src="/images/mosaic-6.jpg" alt="Conference panel" />
        </div>
        <p className="mosaic-caption">
          Built with communities. Powered by your stories.
        </p>
      </section>

      {/* CTA */}
      <section className="cta-section refined">
        <div className="cta-container">
          <h2 className="cta-title">Ready to make every voice heard?</h2>
          <p className="cta-subtitle">
            Join communities creating braver conversations.
          </p>
          <button onClick={() => navigate("/signup")} className="btn-cta">
            Get Started Free
            <span className="btn-arrow">
              <i className="fas fa-arrow-right" />
            </span>
          </button>
          <p className="cta-note">
            No credit card required • Free forever plan
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-container">
          <div className="footer-brand">
            <div className="logo">
              <span className="logo-icon">
                <i className="fas fa-comments" />
              </span>
              <span className="logo-text">Ask Freely</span>
            </div>
            <p>Empowering conversations, one question at a time.</p>
          </div>

          <div className="footer-links">
            <div className="footer-column">
              <h4>Product</h4>
              <a href="#features">Features</a>
              <a href="#pricing">Pricing</a>
              <a href="#demo">Demo</a>
            </div>
            <div className="footer-column">
              <h4>Company</h4>
              <a href="#about">About</a>
              <a href="#contact">Contact</a>
              <a href="#careers">Careers</a>
            </div>
            <div className="footer-column">
              <h4>Support</h4>
              <a href="#help">Help Center</a>
              <a href="#docs">Documentation</a>
              <a href="#status">Status</a>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p>© 2025 Ask Freely. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

// ----------------- App -----------------
function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="app">
          <Routes>
            {/* Landing Page */}
            <Route path="/" element={<LandingPage />} />
            {/* Participant Routes */}
            <Route path="/p/:slug" element={<ParticipantForm />} />
            <Route path="/event/:slug" element={<ParticipantForm />} />{" "}
            {/* alias */}
            <Route path="/participate" element={<ParticipantForm />} />
            <Route path="/question" element={<ParticipantForm />} />
            {/* Host/MC Routes */}
            <Route path="/host" element={<HostDashboard />} />
            <Route path="/host/:eventId" element={<HostDashboard />} />
            <Route
              path="/host/response"
              element={<Navigate to="/host" replace />}
            />
            <Route path="/response" element={<Navigate to="/host" replace />} />
            {/* Organizer Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route
              path="/organizer/dashboard"
              element={<OrganizerDashboard />}
            />
            <Route
              path="/organizer/analytics"
              element={<OrganizerAnalytics />}
            />
            <Route path="/organizer/create-event" element={<CreateEvent />} />
            <Route
              path="/organizer/event/:eventId"
              element={<EventManagement />}
            />
            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
