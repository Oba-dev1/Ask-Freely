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

// ----------------- LandingPage (refactored) -----------------
function LandingPage() {
  const navigate = useNavigate();

  // Live stats
  const [eventsCount, setEventsCount] = useState(0);
  const [questionsCount, setQuestionsCount] = useState(0);
  const [participantsCount, setParticipantsCount] = useState(0);

  // Simple count-up animation hook
  function useCountUp(target, duration = 600) {
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
        const eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
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
    }, [target]); // animate whenever target changes

  return val;
  }

  const liveEvents = useCountUp(eventsCount);
  const liveQuestions = useCountUp(questionsCount);
  const liveParticipants = useCountUp(participantsCount);

  // Subscribe to Firebase for live stats
  useEffect(() => {
    // Events count
    const evRef = ref(database, "events");
    const unSubEvents = onValue(evRef, (snap) => {
      const data = snap.val() || {};
      setEventsCount(Object.keys(data).length);
    });

    // Questions + unique participants
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

  // Compact formatter for big numbers
  const fmt = useMemo(
    () => (n) =>
      n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` :
      n >= 1_000 ? `${(n / 1_000).toFixed(1)}k` : `${n}`,
    []
  );

  return (
    <div className="landing-page">
      {/* Navigation */}
      <nav className="navbar">
        <div className="nav-container">
          <div className="logo">
            <span className="logo-icon">
              <i className="fas fa-comments" />
            </span>
            <span className="logo-text">Echo</span>
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
      <section className="hero-section">
        <div className="hero-container">
          {/* community avatars strip — replace with your images */}
          <div className="community-strip">
            <img src="/images/community-1.jpg" alt="Community event 1" />
            <img src="/images/community-2.jpg" alt="Community event 2" />
            <img src="/images/community-3.jpg" alt="Community event 3" />
            <img src="/images/community-4.jpg" alt="Community event 4" />
            <img src="/images/community-5.jpg" alt="Community event 5" />
          </div>

          <h1 className="hero-title">
            Where your <span className="gradient-text">community</span> takes the mic
          </h1>

          <p className="hero-subtitle">
            Real-time Q&amp;A that helps people ask bravely and connect deeply—
            at churches, conferences, town halls, and team meetings.
          </p>

          <div className="hero-cta">
            <button
              onClick={() => navigate("/signup")}
              className="btn-hero-primary"
            >
              Start Free Today
              <span className="btn-arrow">
                <i className="fas fa-arrow-right" />
              </span>
            </button>
            <button
              onClick={() => navigate("/participate")}
              className="btn-hero-secondary"
            >
              Try a Demo
            </button>
          </div>

          {/* live stats */}
          <div className="hero-stats live">
            <div className="stat">
              <div className="stat-number" aria-live="polite">
                {fmt(liveQuestions)}
              </div>
              <div className="stat-label">Questions Managed</div>
            </div>
            <div className="stat">
              <div className="stat-number" aria-live="polite">
                {fmt(liveEvents)}
              </div>
              <div className="stat-label">Events Hosted</div>
            </div>
            <div className="stat">
              <div className="stat-number" aria-live="polite">
                {fmt(liveParticipants)}
              </div>
              <div className="stat-label">Unique Participants</div>
            </div>
          </div>
        </div>
      </section>

      {/* Community mosaic (image-first) */}
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
          Built with communities, for communities. Your stories power our roadmap.
        </p>
      </section>

      {/* Features */}
      <section className="features-section" id="features">
        <div className="features-container">
          <div className="section-header">
            <h2 className="section-title">Everything you need for seamless Q&amp;A</h2>
            <p className="section-subtitle">Made for organizers, MCs, and participants</p>
          </div>

          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon"><i className="fas fa-bullseye" /></div>
              <h3>Strategic Questions</h3>
              <p>Pre-load prompts to guide conversation and cover what matters most.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon"><i className="fas fa-users" /></div>
              <h3>Anonymous Submissions</h3>
              <p>Psychological safety means better questions—and better answers.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon"><i className="fa-solid fa-bolt" /></div>
              <h3>Real-Time Updates</h3>
              <p>Zero refresh. Questions stream in instantly for smooth flow.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon"><i className="fas fa-chart-bar" /></div>
              <h3>Smart Analytics</h3>
              <p>Track engagement, export insights, and celebrate wins.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon"><i className="fas fa-microphone" /></div>
              <h3>MC Dashboard</h3>
              <p>Calm controls and clear filters—your host’s best friend.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon"><i className="fa-solid fa-mobile-screen-button" /></div>
              <h3>Mobile Friendly</h3>
              <p>Works beautifully on any device—no app required.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="how-it-works">
        <div className="how-container">
          <h2 className="section-title">How it works</h2>
          <p className="section-subtitle">3 quick steps</p>

          <div className="steps-grid">
            <div className="step">
              <div className="step-number">1</div>
              <h3>Create Your Event</h3>
              <p>Spin up an event and add a few guiding questions.</p>
            </div>

            <div className="step">
              <div className="step-number">2</div>
              <h3>Share the Link</h3>
              <p>Your community submits questions instantly on their phones.</p>
            </div>

            <div className="step">
              <div className="step-number">3</div>
              <h3>Manage Live</h3>
              <p>Your MC highlights, filters, and marks questions as answered.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section">
        <div className="cta-container">
          <h2 className="cta-title">Ready to transform your events?</h2>
          <p className="cta-subtitle">Join communities creating braver conversations</p>
          <button onClick={() => navigate("/signup")} className="btn-cta">
            Get Started Free
            <span className="btn-arrow">
              <i className="fas fa-arrow-right" />
            </span>
          </button>
          <p className="cta-note">No credit card required • Free forever plan available</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-container">
          <div className="footer-brand">
            <div className="logo">
              <span className="logo-icon"><i className="fas fa-comments" /></span>
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
            <Route path="/event/:slug" element={<ParticipantForm />} /> {/* alias */}
            <Route path="/participate" element={<ParticipantForm />} />
            <Route path="/question" element={<ParticipantForm />} />

            {/* Host/MC Routes */}
            <Route path="/host" element={<HostDashboard />} />
            <Route path="/host/:eventId" element={<HostDashboard />} />
            <Route path="/host/response" element={<Navigate to="/host" replace />} />
            <Route path="/response" element={<Navigate to="/host" replace />} />

            {/* Organizer Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/organizer/dashboard" element={<OrganizerDashboard />} />
            <Route path="/organizer/analytics" element={<OrganizerAnalytics />} />
            <Route path="/organizer/create-event" element={<CreateEvent />} />
            <Route path="/organizer/event/:eventId" element={<EventManagement />} />

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
