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

  // --- Live stats ---
  const [eventsCount, setEventsCount] = useState(0);
  const [questionsCount, setQuestionsCount] = useState(0);
  const [participantsCount, setParticipantsCount] = useState(0);

  // --- Activity ticker (recent events) ---
  const [recentEvents, setRecentEvents] = useState([]);

  // Count-up animation
  function useCountUp(target, duration = 700) {
    const [val, setVal] = useState(0);
    const fromRef = useRef(0);
    const startRef = useRef(0);
    const targetRef = useRef(target);
    useEffect(() => { targetRef.current = target; }, [target]);
    useEffect(() => {
      let raf;
      const step = (ts) => {
        if (!startRef.current) { startRef.current = ts; fromRef.current = val; }
        const p = Math.min((ts - startRef.current) / duration, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        const next = Math.round(fromRef.current + (targetRef.current - fromRef.current) * eased);
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

  // Firebase subscriptions
  useEffect(() => {
    // Events count + recent list
    const evRef = ref(database, "events");
    const unSubEvents = onValue(evRef, (snap) => {
      const data = snap.val() || {};
      const keys = Object.keys(data);
      setEventsCount(keys.length);

      // Build a small recents list
      const items = keys
        .map((id) => ({ id, ...data[id] }))
        .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
        .slice(0, 8)
        .map((e) => ({
          id: e.id,
          title: e.title || "Untitled Event",
          org: e.organizationName || e.organizerName || "Community",
          when: e.date || e.createdAt || null,
          status: e.status || "active",
        }));
      setRecentEvents(items);
    });

    // Questions + participants (unique authors)
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

    return () => { unSubEvents(); unSubQuestions(); };
  }, []);

  const fmt = useMemo(
    () => (n) =>
      n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` :
      n >= 1_000 ? `${(n / 1_000).toFixed(1)}k` : `${n}`,
    []
  );

  return (
    <div className="lp-wrapper">
      {/* Top bar (simple, not “SaaS-y”) */}
      <header className="lp-topbar">
  <div className="lp-container topbar-row">
    <button className="brand" onClick={() => navigate("/")}>
      <i className="fas fa-comments" aria-hidden="true" />
      <span>Ask Freely</span>
    </button>

    {/* <nav className="main-nav" aria-label="Primary">
      <a href="#community">Community</a>
      <a href="#features">Features</a>
      <a href="#support">Support</a>
      <a href="#pricing">Pricing</a>
    </nav> */}

    <div className="actions">
      <button className="ghost" onClick={() => navigate("/login")}>Sign in</button>
      <button className="solid" onClick={() => navigate("/signup")}>
        Join the community
      </button>
    </div>

    {/* Mobile menu button (optional) */}
    <button className="nav-toggle" aria-label="Open menu">
      <i className="fas fa-bars" aria-hidden="true" />
    </button>
  </div>
</header>

      {/* Hero: community-first */}
      <section className="lp-hero">
        <div className="lp-container hero-grid">
          <div className="hero-copy">
            <div className="hero-chip">
              <span className="dot" /> Powered by real people & real questions
            </div>
            <h1>
              A community space<br />
              for honest Q&amp;A.
            </h1>
            <p className="lede">
              Ask Freely helps gatherings—churches, neighborhoods, students, teams—
              collect questions safely, vote on what matters, and respond with care.
            </p>

            <div className="hero-actions">
              <button className="solid" onClick={() => navigate("/signup")}>
                Create an event
                <i className="fas fa-arrow-right" aria-hidden="true" />
              </button>
              <button className="ghost" onClick={() => navigate("/participate")}>
                Try the participant view
              </button>
            </div>

            <div className="live-stats">
              <div className="live-item">
                <i className="fa-solid fa-square-poll-horizontal" />
                <div className="n">{fmt(liveQuestions)}</div>
                <div className="l">Questions asked</div>
              </div>
              <div className="live-item">
                <i className="fa-solid fa-calendar-check" />
                <div className="n">{fmt(liveEvents)}</div>
                <div className="l">Events created</div>
              </div>
              <div className="live-item">
                <i className="fa-solid fa-user-group" />
                <div className="n">{fmt(liveParticipants)}</div>
                <div className="l">Voices represented</div>
              </div>
            </div>
          </div>

          {/* Photo mosaic strip (no device mockups) */}
          <div className="hero-mosaic">
            <div className="tile tall"><img src="https://res.cloudinary.com/dws3lnn4d/image/upload/v1762520570/pexels-pamanjoe-14669354_ntetl8.jpg" alt="Community moment" /></div>
            <div className="tile"><img src="https://res.cloudinary.com/dws3lnn4d/image/upload/v1720021892/group-young-african-friends-with-facemasks-using-their-phones-park_uuoeu2.jpg" alt="Volunteers" /></div>
            <div className="tile"><img src="/images/community-3.jpg" alt="Audience" /></div>
            <div className="tile wide"><img src="/images/community-4.jpg" alt="Panel" /></div>
          </div>
        </div>
      </section>

      {/* What’s happening (ticker) */}
      <section className="lp-ticker">
        <div className="lp-container">
          <span className="tick-label"><i className="fa-solid fa-bolt" /> What’s happening</span>
          <div className="tick-track">
            <div className="tick-items">
              {recentEvents.length === 0 ? (
                <div className="tick-item">Your community is next. Create an event →</div>
              ) : (
                recentEvents.map((e) => (
                  <div className="tick-item" key={e.id}>
                    <i className={`fa-solid ${e.status === "active" ? "fa-circle-play" : "fa-clock"}`} />
                    <span className="t">{e.title}</span>
                    <span className="m">• {e.org}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Values / Manifesto */}
      <section className="lp-values">
        <div className="lp-container values-grid">
          <div className="val">
            <i className="fa-solid fa-hand-holding-heart" />
            <h3>Belonging first</h3>
            <p>Anonymous by choice, kind by default. We design for safety so harder questions can surface.</p>
          </div>
          <div className="val">
            <i className="fa-solid fa-people-arrows" />
            <h3>Shared agency</h3>
            <p>Let the room vote on what matters. Hosts get clarity without losing compassion.</p>
          </div>
          <div className="val">
            <i className="fa-solid fa-palette" />
            <h3>Make it yours</h3>
            <p>Customization for your context—branding, tone, and links that feel like home.</p>
          </div>
        </div>
      </section>

      {/* Stories block (testimonials / quotes) */}
      <section className="lp-stories">
        <div className="lp-container stories-wrap">
          <article className="story">
            <blockquote>
              “Ask Freely turned our Q&amp;A from a tense segment into the highlight. People felt heard.”
            </blockquote>
            <div className="byline">
              <img src="/images/avatar-1.jpg" alt="Ada - Youth leader" />
              <div>
                <strong>Ada</strong>
                <span>Youth Leader, Wuye</span>
              </div>
            </div>
          </article>

          <article className="story">
            <blockquote>
              “We used it at our campus forum—the tough questions finally came out. Best turnout yet.”
            </blockquote>
            <div className="byline">
              <img src="/images/avatar-2.jpg" alt="Seyi - Campus Coordinator" />
              <div>
                <strong>Seyi</strong>
                <span>Campus Coordinator</span>
              </div>
            </div>
          </article>

          <article className="story">
            <blockquote>
              “The MC dashboard is clean, and the community vibe is real. It respects our culture.”
            </blockquote>
            <div className="byline">
              <img src="/images/avatar-3.jpg" alt="Chidi - Community Organizer" />
              <div>
                <strong>Chidi</strong>
                <span>Community Organizer</span>
              </div>
            </div>
          </article>
        </div>
      </section>

      {/* Gentle feature row (no corporate shine) */}
      <section className="lp-why">
        <div className="lp-container why-grid">
          <div className="why-card">
            <i className="fa-solid fa-bullseye" />
            <h4>Strategic prompts</h4>
            <p>Seed the conversation with questions that matter to your people.</p>
          </div>
          <div className="why-card">
            <i className="fa-solid fa-user-shield" />
            <h4>Privacy that protects</h4>
            <p>Keep identities safe. Moderate with empathy and clear boundaries.</p>
          </div>
          <div className="why-card">
            <i className="fa-solid fa-chart-line" />
            <h4>Community insights</h4>
            <p>See themes, participation trends, and share learnings with your team.</p>
          </div>
          <div className="why-card">
            <i className="fa-solid fa-sliders" />
            <h4>Customization</h4>
            <p>Match your brand and language. Make the space unmistakably yours.</p>
          </div>
        </div>
      </section>

      {/* Call to action */}
      <section className="lp-cta">
        <div className="lp-container cta-box">
          <h2>Ready to hold braver conversations?</h2>
          <p>Start with a free event. Invite your people. Listen together.</p>
          <div className="cta-actions">
            <button className="solid" onClick={() => navigate("/signup")}>
              Create a free event
              <i className="fas fa-arrow-right" aria-hidden="true" />
            </button>
            <button className="ghost" onClick={() => navigate("/participate")}>
              See a demo
            </button>
          </div>
        </div>
      </section>

      {/* Footer (lightweight) */}
      <footer className="lp-footer">
  <div className="lp-container foot-grid">
    <div className="foot-brand">
      <button className="brand" onClick={() => navigate("/")}>
        <i className="fas fa-comments" aria-hidden="true" />
        <span>Ask Freely</span>
      </button>
      <p className="foot-tagline">
        Built with communities. Powered by your stories.
      </p>

      <div className="socials" aria-label="Social links">
        {/* <a href="#" aria-label="Twitter"><i className="fab fa-x-twitter" /></a>
        <a href="#" aria-label="Instagram"><i className="fab fa-instagram" /></a>
        <a href="#" aria-label="YouTube"><i className="fab fa-youtube" /></a> */}
      </div>
    </div>

    <div className="foot-cols">
      <div className="foot-col">
        <h4>Product</h4>
        <a href="#features">Features</a>
        <a href="#pricing">Pricing</a>
        <a href="#demo">Demo</a>
      </div>
      <div className="foot-col">
        <h4>Community</h4>
        <a href="#community">Stories</a>
        <a href="#events">Events</a>
        <a href="#guide">Community Guide</a>
      </div>
      <div className="foot-col">
        <h4>Support</h4>
        <a href="#help">Help Center</a>
        <a href="#docs">Documentation</a>
        <a href="#status">Status</a>
      </div>
    </div>
  </div>

  <div className="lp-container foot-bottom">
    <p>© {new Date().getFullYear()} Ask Freely</p>
    <div className="foot-legal">
      {/* <a href="#privacy">Privacy</a>
      <span>•</span>
      <a href="#terms">Terms</a>
      <span>•</span>
      <a href="#contact">Contact</a> */}
    </div>
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
