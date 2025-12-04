import React, { useEffect, useRef, useState } from "react";
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

// ==================== HOOKS ====================

function useCountUp(target, duration = 700) {
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
      const elapsed = ts - startRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const next = Math.round(
        fromRef.current + (targetRef.current - fromRef.current) * eased
      );
      setVal(next);
      if (progress < 1) {
        raf = requestAnimationFrame(step);
      } else {
        startRef.current = 0;
      }
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, duration, val]);

  return val;
}

function useLiveStats() {
  const [eventsCount, setEventsCount] = useState(0);
  const [questionsCount, setQuestionsCount] = useState(0);
  const [participantsCount, setParticipantsCount] = useState(0);
  const [recentEvents, setRecentEvents] = useState([]);

  useEffect(() => {
    const evRef = ref(database, "events");
    const unSubEvents = onValue(evRef, (snap) => {
      const data = snap.val() || {};
      const keys = Object.keys(data);
      setEventsCount(keys.length);

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
            const author = (q?.author || "anon").toString().trim() || "anon";
            authors.add(author);
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

  return { eventsCount, questionsCount, participantsCount, recentEvents };
}

// ==================== UTILITIES ====================

const formatNumber = (n) =>
  n >= 1_000_000
    ? `${(n / 1_000_000).toFixed(1)}M`
    : n >= 1_000
    ? `${(n / 1_000).toFixed(1)}k`
    : `${n}`;

// ==================== COMPONENTS ====================

function StatItem({ icon, num, label }) {
  return (
    <div className="live-item" role="group" aria-label={label}>
      <i className={`stat-icon ${icon}`} aria-hidden="true" />
      <div className="n">{num}</div>
      <div className="l">{label}</div>
    </div>
  );
}

function Story({ quote, avatar, name, role }) {
  return (
    <article className="story" tabIndex={0}>
      <blockquote>{quote}</blockquote>
      <div className="byline">
        <img src={avatar} alt={`${name} avatar`} />
        <div>
          <strong>{name}</strong>
          <span>{role}</span>
        </div>
      </div>
    </article>
  );
}

function TopBar() {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const handleNavClick = (e, targetId) => {
    e.preventDefault();
    const element = document.getElementById(targetId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    setMobileMenuOpen(false); // Close menu after navigation
  };

  return (
    <header className="lp-topbar" role="banner">
      <div className="lp-container topbar-row">
        <button className="brand" onClick={() => navigate("/")}>
          <i className="fas fa-comments" aria-hidden="true" />
          <span>Ask Freely</span>
        </button>

        <button
          className="nav-toggle"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle navigation menu"
          aria-expanded={mobileMenuOpen}
        >
          <i className={mobileMenuOpen ? "fas fa-times" : "fas fa-bars"} />
        </button>

        <nav className={`main-nav ${mobileMenuOpen ? 'mobile-open' : ''}`} aria-label="Primary navigation">
          <a href="#values" onClick={(e) => handleNavClick(e, 'values')}>Community</a>
          <a href="#how-it-works" onClick={(e) => handleNavClick(e, 'how-it-works')}>How It Works</a>
          <a href="#why" onClick={(e) => handleNavClick(e, 'why')}>Features</a>
          <a href="#stories" onClick={(e) => handleNavClick(e, 'stories')}>Stories</a>
        </nav>

        <div className="actions">
          <button className="ghost" onClick={() => navigate("/login")}>
            Sign in
          </button>
          <button className="solid" onClick={() => navigate("/signup")}>
            Join the community
          </button>
        </div>
      </div>
    </header>
  );
}

function HeroSection() {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = React.useState(0);

  const slides = [
    {
      src: "https://res.cloudinary.com/dws3lnn4d/image/upload/v1764869145/group-international-business-people-raising-their-hands_hgysjg.jpg",
      alt: "Community moment"
    },
    {
      src: "https://res.cloudinary.com/dws3lnn4d/image/upload/v1764869722/happy-beautiful-black-african-american-girl-with-hat-gown-graduates-ceremony-graduated_vzc7qh.jpg",
      alt: "Volunteers"
    },
    {
      src: "https://res.cloudinary.com/dws3lnn4d/image/upload/v1764865359/group-business-women-participating-panel-discussion_m9n8ea.jpg",
      alt: "Audience"
    },
    {
      src: "https://res.cloudinary.com/dws3lnn4d/image/upload/v1764865450/male-business-executive-giving-speech_h4qxrj.jpg",
      alt: "Panel"
    }
  ];

  // Auto-advance carousel - alternating direction
  const [direction, setDirection] = React.useState(1); // 1 for forward, -1 for backward

  React.useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => {
        const next = prev + direction;

        // Change direction at boundaries
        if (next >= slides.length) {
          setDirection(-1);
          return prev - 1;
        }
        if (next < 0) {
          setDirection(1);
          return prev + 1;
        }

        return next;
      });
    }, 6000); // Change slide every 6 seconds (slower)

    return () => clearInterval(interval);
  }, [direction, slides.length]);

  const goToSlide = (index) => {
    setCurrentSlide(index);
  };

  return (
    <section id="hero" className="lp-hero" aria-labelledby="hero-heading">
      <div className="lp-container hero-grid">
        <div className="hero-copy">
          <div className="hero-chip">
            <span className="dot" /> Powered by real people
          </div>
          <h1 id="hero-heading">A community space for honest Q&amp;A.</h1>
          <p className="lede">
            Ask Freely helps gatherings collect questions safely, vote on what
            matters, and respond with care.
          </p>

          <div className="hero-actions">
            <button className="solid" onClick={() => navigate("/signup")}>
              Create an event{" "}
              <i className="fas fa-arrow-right" aria-hidden="true" />
            </button>
            <button className="ghost" onClick={() => navigate("/participate")}>
              Try the participant view
            </button>
          </div>
        </div>

        <aside className="hero-carousel" aria-hidden="true">
          <div className="carousel-container">
            <div
              className="carousel-track"
              style={{ transform: `translateX(-${currentSlide * 100}%)` }}
            >
              {slides.map((slide, index) => (
                <div key={index} className="carousel-slide">
                  <img src={slide.src} alt={slide.alt} />
                </div>
              ))}
            </div>
          </div>

          <div className="carousel-dots">
            {slides.map((_, index) => (
              <button
                key={index}
                className={`carousel-dot ${index === currentSlide ? 'active' : ''}`}
                onClick={() => goToSlide(index)}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </aside>
      </div>
    </section>
  );
}

function LiveStatsSection({ liveStats }) {
  const { liveEvents, liveQuestions, liveParticipants } = liveStats;

  return (
    <section className="lp-live-stats" aria-label="Live statistics">
      <div className="lp-container">
        <div className="stats-row">
          <StatItem
            icon="fa-solid fa-circle-question"
            num={formatNumber(liveQuestions)}
            label="Questions asked"
          />
          <StatItem
            icon="fa-solid fa-calendar-days"
            num={formatNumber(liveEvents)}
            label="Events created"
          />
          <StatItem
            icon="fa-solid fa-user-group"
            num={formatNumber(liveParticipants)}
            label="Voices represented"
          />
        </div>
      </div>
    </section>
  );
}

function ActivityTicker({ recentEvents }) {
  return (
    <section id="happening" className="lp-ticker" aria-labelledby="happening-heading">
      <div className="lp-container">
        <h3 id="happening-heading" className="section-heading">
          <i className="fa-solid fa-bolt" /> What's happening
        </h3>
        <div className="tick-track" role="list" aria-live="polite">
          <div className="tick-items">
            {recentEvents.length === 0 ? (
              <div className="tick-item">
                Your community is next. Create an event →
              </div>
            ) : (
              recentEvents.map((e) => (
                <div className="tick-item" key={e.id}>
                  <i
                    className={`tick-status ${
                      e.status === "active" ? "fa-circle-play" : "fa-clock"
                    }`}
                  />
                  <span className="t">{e.title}</span>
                  <span className="m">• {e.org}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function ValuesSection() {
  return (
    <section id="values" className="lp-values">
      <div className="lp-container values-grid">
        <h3 className="section-heading">Community values</h3>
      </div>
      <div className="lp-container values-grid">
        <div className="val">
          <div className="val-icon">
            <i className="fa-solid fa-hand-holding-heart" aria-hidden="true" />
          </div>
          <h3>Belonging first</h3>
          <p>
            Anonymous by choice, kind by default. We design for safety so
            harder questions can surface.
          </p>
        </div>

        <div className="val">
          <div className="val-icon">
            <i className="fa-solid fa-people-arrows" aria-hidden="true" />
          </div>
          <h3>Shared agency</h3>
          <p>
            Let the room vote on what matters. Hosts get clarity without
            losing compassion.
          </p>
        </div>

        <div className="val">
          <div className="val-icon">
            <i className="fa-solid fa-palette" aria-hidden="true" />
          </div>
          <h3>Make it yours</h3>
          <p>
            Customization for your context—branding, tone, and links that feel
            like home.
          </p>
        </div>
      </div>
    </section>
  );
}

function StoriesSection() {
  return (
    <section id="stories" className="lp-stories" aria-labelledby="stories-heading">
      <div className="lp-container stories-wrap">
        <h3 id="stories-heading" className="section-heading">
          Stories from the community
        </h3>

        <div className="stories-grid">
          <Story
            quote="Ask Freely turned our Q&A from a tense segment into the highlight. People felt heard."
            avatar="https://res.cloudinary.com/dws3lnn4d/image/upload/v1718105160/pexels-emmy-e-1252107-2381069_ncpcqb.jpg"
            name="Ada"
            role="Youth Leader, Wuye"
          />
          <Story
            quote="We used it at our campus forum—the tough questions finally came out. Best turnout yet."
            avatar="https://res.cloudinary.com/dws3lnn4d/image/upload/v1706346802/AjoVault%20App/pexels-christina-morillo-1181686_irzuti.jpg"
            name="Seyi"
            role="Campus Coordinator"
          />
          <Story
            quote="The MC dashboard is clean, and the community vibe is real. It respects our culture."
            avatar="https://res.cloudinary.com/dws3lnn4d/image/upload/v1719833077/IMG_2571_wsh2ef.jpg"
            name="Chidi"
            role="Community Organizer"
          />
        </div>
      </div>
    </section>
  );
}

function HowItWorksSection() {
  return (
    <section id="how-it-works" className="lp-how-it-works">
      <div className="lp-container">
        <h3 className="section-heading">How it works</h3>
        <p className="how-subtitle">Three simple steps to better conversations</p>

        <div className="how-timeline">
          <div className="timeline-line"></div>

          <div className="how-step" data-step="1">
            <div className="step-marker">
              <div className="step-number">1</div>
            </div>
            <div className="step-content">
              <div className="step-icon">
                <i className="fa-solid fa-calendar-plus" />
              </div>
              <h4>Create your event</h4>
              <p>Set up your Q&A session in seconds. Customize branding, add prompts, and get a shareable link.</p>
            </div>
          </div>

          <div className="how-step" data-step="2">
            <div className="step-marker">
              <div className="step-number">2</div>
            </div>
            <div className="step-content">
              <div className="step-icon">
                <i className="fa-solid fa-comments" />
              </div>
              <h4>Invite your people</h4>
              <p>Share the link. Participants submit and upvote questions anonymously—no sign-up needed.</p>
            </div>
          </div>

          <div className="how-step" data-step="3">
            <div className="step-marker">
              <div className="step-number">3</div>
            </div>
            <div className="step-content">
              <div className="step-icon">
                <i className="fa-solid fa-microphone"/>
              </div>
              <h4>Host with confidence</h4>
              <p>See top questions live, respond thoughtfully, and export insights for your team afterward.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function WhySection() {
  return (
    <section id="why" className="lp-why">
      <div className="lp-container why-grid">
        <h3 className="section-heading">Why people use Ask Freely</h3>
      </div>
      <div className="lp-container why-grid">
        <div className="why-card">
          <div className="why-icon">
            <i className="fa-solid fa-bullseye" />
          </div>
          <h4>Strategic prompts</h4>
          <p>Seed the conversation with questions that matter to your people.</p>
        </div>

        <div className="why-card">
          <div className="why-icon">
            <i className="fa-solid fa-user-shield" />
          </div>
          <h4>Privacy that protects</h4>
          <p>Keep identities safe. Moderate with empathy and clear boundaries.</p>
        </div>

        <div className="why-card">
          <div className="why-icon">
            <i className="fa-solid fa-chart-line" />
          </div>
          <h4>Community insights</h4>
          <p>See themes, participation trends, and share learnings with your team.</p>
        </div>

        <div className="why-card">
          <div className="why-icon">
            <i className="fa-solid fa-sliders" />
          </div>
          <h4>Customization</h4>
          <p>Match your brand and language. Make the space unmistakably yours.</p>
        </div>
      </div>
    </section>
  );
}

function CTASection() {
  const navigate = useNavigate();

  return (
    <section id="cta" className="lp-cta" aria-labelledby="cta-heading">
      <div className="lp-container cta-box">
        <h3 id="cta-heading">Ready to hold braver conversations?</h3>
        <p>Start with a free event. Invite your people. Listen together.</p>
        <div className="cta-actions">
          <button className="solid" onClick={() => navigate("/signup")}>
            Create a free event{" "}
            <i className="fas fa-arrow-right" aria-hidden="true" />
          </button>
          <button className="ghost" onClick={() => navigate("/participate")}>
            See a demo
          </button>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  const navigate = useNavigate();

  return (
    <footer className="lp-footer" role="contentinfo">
      <div className="lp-container foot-grid">
        <div className="foot-brand">
          <button className="brand" onClick={() => navigate("/")}>
            <i className="fas fa-comments" aria-hidden="true" />
            <span>Ask Freely</span>
          </button>
          <p className="foot-tagline">
            Built with communities. Powered by your stories.
          </p>
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
            <a href="#stories">Stories</a>
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
        <div className="foot-legal" />
      </div>
    </footer>
  );
}

// ==================== LANDING PAGE ====================

function LandingPage() {
  const { eventsCount, questionsCount, participantsCount, recentEvents } = useLiveStats();
  
  const liveStats = {
    liveEvents: useCountUp(eventsCount),
    liveQuestions: useCountUp(questionsCount),
    liveParticipants: useCountUp(participantsCount),
  };

  return (
    <div className="lp-wrapper">
      <TopBar />
      <HeroSection />
      <LiveStatsSection liveStats={liveStats} />
      <ActivityTicker recentEvents={recentEvents} />
      <ValuesSection />
      <HowItWorksSection />
      <WhySection />
      <StoriesSection />
      <CTASection />
      <Footer />
    </div>
  );
}

// ==================== APP ====================

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="app">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/p/:slug" element={<ParticipantForm />} />
            <Route path="/event/:slug" element={<ParticipantForm />} />
            <Route path="/participate" element={<ParticipantForm />} />
            <Route path="/question" element={<ParticipantForm />} />
            <Route path="/host" element={<HostDashboard />} />
            <Route path="/host/:eventId" element={<HostDashboard />} />
            <Route path="/host/response" element={<Navigate to="/host" replace />} />
            <Route path="/response" element={<Navigate to="/host" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/organizer/dashboard" element={<OrganizerDashboard />} />
            <Route path="/organizer/analytics" element={<OrganizerAnalytics />} />
            <Route path="/organizer/create-event" element={<CreateEvent />} />
            <Route path="/organizer/event/:eventId" element={<EventManagement />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;