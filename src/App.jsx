import React, { useEffect, useRef, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useNavigate,
  Navigate,
} from "react-router-dom";
import * as Sentry from "@sentry/react";
import { ref, onValue } from "firebase/database";
import { database } from "./Firebase/config";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./Components/ProtectedRoute";
import ParticipantForm from "./Components/ParticipantForm";
import HostDashboard from "./Components/HostDashboard";
import Login from "./Components/Login";
import Signup from "./Components/Signup";
import ForgotPassword from "./Components/ForgotPassword";
import ProfileSetup from "./Components/ProfileSetup";
import OrganizerAnalytics from "./Components/OrganizerAnalytics";
import EventSetup from "./Components/EventSetup";
import EventManagement from "./Components/EventManagement";
import TermsOfService from "./Components/TermsOfService";
import PrivacyPolicy from "./Components/PrivacyPolicy";
import Help from "./Components/Help";
import DashboardLayout from "./Components/DashboardLayout";
import DashboardOverview from "./Components/DashboardOverview";
import EventsAllView from "./Components/EventsAllView";
import EventsActiveView from "./Components/EventsActiveView";
import EventsDraftView from "./Components/EventsDraftView";
import EventsArchivedView from "./Components/EventsArchivedView";
import OrganizerSettings from "./Components/OrganizerSettings";
import usePageTracking from "./hooks/usePageTracking";
import { initializeSecurity } from "./utils/security";

import "./App.css";
import "./LandingPage.css";
import "@fortawesome/fontawesome-free/css/all.min.css";

// Create Sentry-enhanced Router
const SentryRoutes = Sentry.withSentryRouting(Routes);

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
          <a href="#values" onClick={(e) => handleNavClick(e, 'values')}>Why Ask Freely</a>
          <a href="#how-it-works" onClick={(e) => handleNavClick(e, 'how-it-works')}>How It Works</a>
          <a href="#why" onClick={(e) => handleNavClick(e, 'why')}>Features</a>
          <a href="#stories" onClick={(e) => handleNavClick(e, 'stories')}>Reviews</a>
        </nav>

        <div className="actions">
          <button className="ghost" onClick={() => navigate("/login")}>
            Log In
          </button>
          <button className="solid" onClick={() => navigate("/signup")}>
            Get Started Free
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
            <span className="dot" /> Trusted by organizers worldwide
          </div>
          <h1 id="hero-heading">Turn Tough Questions Into Breakthrough Conversations</h1>
          <p className="lede">
            The anonymous Q&amp;A platform that helps event organizers create psychologically safe spaces where every voice matters. Collect, prioritize, and address questions with confidence—no awkward silences, just honest dialogue.
          </p>

          <div className="hero-actions">
            <button className="solid" onClick={() => navigate("/signup")}>
              Start Free - Create Your Event{" "}
              <i className="fas fa-arrow-right" aria-hidden="true" />
            </button>
            <button className="ghost" onClick={() => navigate("/participate")}>
              See How It Works
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
    <section className="lp-live-stats" aria-labelledby="stats-heading">
      <div className="lp-container">
        <div className="stats-header">
          <h3 id="stats-heading" className="stats-title">Join Thousands Making Every Voice Count</h3>
          <p className="stats-subtitle">Real conversations happening right now in communities worldwide</p>
        </div>
        <div className="stats-row">
          <StatItem
            icon="fa-solid fa-circle-question"
            num={formatNumber(liveQuestions)}
            label="Questions Answered"
          />
          <StatItem
            icon="fa-solid fa-calendar-days"
            num={formatNumber(liveEvents)}
            label="Events Hosted"
          />
          <StatItem
            icon="fa-solid fa-user-group"
            num={formatNumber(liveParticipants)}
            label="People Heard"
          />
        </div>
      </div>
    </section>
  );
}

function ActivityTicker({ recentEvents }) {
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [isAutoScrolling, setIsAutoScrolling] = React.useState(true);
  const cardsPerView = 4; // Show 4 cards at a time on desktop

  // Auto-scroll every 5 seconds
  React.useEffect(() => {
    if (!isAutoScrolling || recentEvents.length <= cardsPerView) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => {
        const maxIndex = recentEvents.length - cardsPerView;
        return prev >= maxIndex ? 0 : prev + 1;
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoScrolling, recentEvents.length]);

  // Calculate how many questions for each event (mock data for now)
  const getQuestionCount = (event) => {
    // You can replace this with actual question count from your data
    return Math.floor(Math.random() * 50) + 5;
  };

  const handleNext = () => {
    const maxIndex = recentEvents.length - cardsPerView;
    setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
    setIsAutoScrolling(false);
    setTimeout(() => setIsAutoScrolling(true), 8000);
  };

  const handlePrev = () => {
    const maxIndex = recentEvents.length - cardsPerView;
    setCurrentIndex((prev) => (prev <= 0 ? maxIndex : prev - 1));
    setIsAutoScrolling(false);
    setTimeout(() => setIsAutoScrolling(true), 8000);
  };

  if (recentEvents.length === 0) {
    return (
      <section id="happening" className="lp-events" aria-labelledby="events-heading">
        <div className="lp-container">
          <h3 id="events-heading" className="events-heading">
            <i className="fa-solid fa-bolt" /> Live Events
          </h3>
          <div className="events-empty">
            <p>Your community event could be featured here. Create one today!</p>
          </div>
        </div>
      </section>
    );
  }

  const showNavigation = recentEvents.length > cardsPerView;

  return (
    <section id="happening" className="lp-events" aria-labelledby="events-heading">
      <div className="lp-container">
        <h3 id="events-heading" className="events-heading">
          <i className="fa-solid fa-bolt" /> Live Events
        </h3>

        <div className="events-carousel-wrapper">
          {showNavigation && (
            <button
              className="carousel-nav carousel-nav-prev"
              onClick={handlePrev}
              aria-label="Previous events"
            >
              <i className="fa-solid fa-chevron-left"></i>
            </button>
          )}

          <div className="events-carousel">
            <div
              className="events-track"
              style={{
                transform: `translateX(-${currentIndex * (100 / cardsPerView)}%)`,
              }}
              onMouseEnter={() => setIsAutoScrolling(false)}
              onMouseLeave={() => setIsAutoScrolling(true)}
            >
              {recentEvents.map((event) => {
                const questionCount = getQuestionCount(event);

                return (
                  <div
                    key={event.id}
                    className="event-card"
                  >
                    <div className="event-card-header">
                      <span className="event-status">
                        <i className="fa-solid fa-circle"></i> Live now
                      </span>
                      <span className="event-activity">
                        <i className="fa-solid fa-fire"></i> {questionCount} questions
                      </span>
                    </div>

                    <h4 className="event-card-title">{event.title}</h4>

                    {event.org && (
                      <p className="event-card-org">
                        <i className="fa-solid fa-building"></i> {event.org}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {showNavigation && (
            <button
              className="carousel-nav carousel-nav-next"
              onClick={handleNext}
              aria-label="Next events"
            >
              <i className="fa-solid fa-chevron-right"></i>
            </button>
          )}
        </div>

        {/* Carousel dots */}
        {showNavigation && (
          <div className="carousel-dots">
            {Array.from({ length: recentEvents.length - cardsPerView + 1 }).map((_, index) => (
              <button
                key={index}
                className={`dot ${index === currentIndex ? 'active' : ''}`}
                onClick={() => {
                  setCurrentIndex(index);
                  setIsAutoScrolling(false);
                  setTimeout(() => setIsAutoScrolling(true), 8000);
                }}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function ValuesSection() {
  return (
    <section id="values" className="lp-values">
      <div className="lp-container values-grid">
        <h3 className="section-heading">Built on Values That Matter</h3>
      </div>
      <div className="lp-container values-grid">
        <div className="val">
          <div className="val-icon">
            <i className="fa-solid fa-hand-holding-heart" aria-hidden="true" />
          </div>
          <h3>Safety First, Always</h3>
          <p>
            Optional anonymity with built-in moderation tools. Create spaces where the toughest questions can finally be asked—without fear or judgment.
          </p>
        </div>

        <div className="val">
          <div className="val-icon">
            <i className="fa-solid fa-people-arrows" aria-hidden="true" />
          </div>
          <h3>Community-Driven Prioritization</h3>
          <p>
            Let your audience upvote what truly matters to them. Stop guessing what people care about—let them show you through democratic engagement.
          </p>
        </div>

        <div className="val">
          <div className="val-icon">
            <i className="fa-solid fa-palette" aria-hidden="true" />
          </div>
          <h3>Your Brand, Your Voice</h3>
          <p>
            Full white-label customization. Add your logo, colors, and messaging so participants feel right at home—not on a generic platform.
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
          Hear From Organizers Like You
        </h3>

        <div className="stories-grid">
          <Story
            quote="Ask Freely transformed our Q&A from an awkward silence to the most engaging part of our event. For the first time, people actually felt heard."
            avatar="https://res.cloudinary.com/dws3lnn4d/image/upload/v1718105160/pexels-emmy-e-1252107-2381069_ncpcqb.jpg"
            name="Ada"
            role="Youth Leader, Wuye"
          />
          <Story
            quote="We used it at our campus town hall and finally got the tough questions we needed. Anonymity changed everything—highest participation we've ever seen."
            avatar="https://res.cloudinary.com/dws3lnn4d/image/upload/v1706346802/AjoVault%20App/pexels-christina-morillo-1181686_irzuti.jpg"
            name="Seyi"
            role="Campus Coordinator"
          />
          <Story
            quote="The facilitator dashboard is incredibly clean and intuitive. But what impressed me most is how well it respects our cultural context and community values."
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
        <h3 className="section-heading">Simple to Start, Powerful in Practice</h3>
        <p className="how-subtitle">Go from idea to engagement in under 3 minutes</p>

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
              <h4>Create Your Event in Seconds</h4>
              <p>No credit card required. Set up your Q&amp;A session, customize your branding, add strategic prompts, and get a shareable link instantly.</p>
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
              <h4>Share & Watch Engagement Soar</h4>
              <p>One link, zero friction. Participants ask and upvote questions anonymously—no account creation, no downloads, no barriers to participation.</p>
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
              <h4>Facilitate Like a Pro</h4>
              <p>See top questions ranked by community votes in real-time. Moderate with empathy, respond with confidence, and export insights for follow-up.</p>
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
        <h3 className="section-heading">Everything You Need to Host Meaningful Conversations</h3>

        <div className="why-cards-wrapper">
          <div className="why-card">
            <div className="why-icon">
              <i className="fa-solid fa-bullseye" />
            </div>
            <h4>Strategic Question Seeding</h4>
            <p>Pre-populate thoughtful prompts to guide the conversation and ensure important topics get covered—even if the room is shy at first.</p>
          </div>

          <div className="why-card">
            <div className="why-icon">
              <i className="fa-solid fa-user-shield" />
            </div>
            <h4>Privacy-First by Design</h4>
            <p>Optional anonymity, robust moderation controls, and respectful boundaries. Build trust so people share what they actually think.</p>
          </div>

          <div className="why-card">
            <div className="why-icon">
              <i className="fa-solid fa-chart-line" />
            </div>
            <h4>Actionable Insights & Analytics</h4>
            <p>Track participation patterns, identify trending themes, and export data to share with stakeholders. Turn feedback into action plans.</p>
          </div>

          <div className="why-card">
            <div className="why-icon">
              <i className="fa-solid fa-sliders" />
            </div>
            <h4>Complete White-Label Control</h4>
            <p>Custom branding, personalized messaging, and your own domain. Deliver a seamless experience that reinforces your organization's identity.</p>
          </div>
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
        <h3 id="cta-heading">Ready to Transform Your Next Q&amp;A Session?</h3>
        <p>Join organizers creating safer, more engaging conversations. Set up your first event free—no credit card required.</p>
        <div className="cta-actions">
          <button className="solid" onClick={() => navigate("/signup")}>
            Start Free - Create Your Event{" "}
            <i className="fas fa-arrow-right" aria-hidden="true" />
          </button>
          <button className="ghost" onClick={() => navigate("/participate")}>
            Try the Demo First
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
        <div className="foot-legal">
          <button onClick={() => navigate("/help")} className="foot-legal-link">
            Help
          </button>
          <span className="foot-separator">·</span>
          <button onClick={() => navigate("/terms-of-service")} className="foot-legal-link">
            Terms of Service
          </button>
          <span className="foot-separator">·</span>
          <button onClick={() => navigate("/privacy-policy")} className="foot-legal-link">
            Privacy Policy
          </button>
        </div>
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

// Component to track page views
function AnalyticsWrapper({ children }) {
  usePageTracking();
  return children;
}

function App() {
  // Initialize security features on app mount
  useEffect(() => {
    initializeSecurity();
  }, []);

  return (
    <Sentry.ErrorBoundary
      fallback={({ error, resetError }) => (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          padding: '2rem',
          textAlign: 'center'
        }}>
          <h1 style={{ fontSize: '2rem', marginBottom: '1rem', color: '#DC2626' }}>
            Oops! Something went wrong
          </h1>
          <p style={{ marginBottom: '1.5rem', color: '#6B7280' }}>
            We've been notified and will fix this soon.
          </p>
          <button
            onClick={resetError}
            style={{
              padding: '0.75rem 1.5rem',
              background: '#FF6B35',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: '600'
            }}
          >
            Try Again
          </button>
        </div>
      )}
      showDialog
    >
      <AuthProvider>
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <AnalyticsWrapper>
            <div className="app">
              <SentryRoutes>
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
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/terms-of-service" element={<TermsOfService />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/help" element={<Help />} />
            <Route path="/profile-setup" element={
              <ProtectedRoute requireProfileComplete={false}>
                <ProfileSetup />
              </ProtectedRoute>
            } />
            {/* Organizer Dashboard - Nested Routes with Sidebar */}
            <Route path="/organizer" element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }>
              <Route path="dashboard" element={<DashboardOverview />} />
              <Route path="events/all" element={<EventsAllView />} />
              <Route path="events/active" element={<EventsActiveView />} />
              <Route path="events/draft" element={<EventsDraftView />} />
              <Route path="events/archived" element={<EventsArchivedView />} />
              <Route path="analytics" element={<OrganizerAnalytics />} />
              <Route path="settings" element={<OrganizerSettings />} />
              <Route path="event/:eventId/setup" element={<EventSetup />} />
              <Route path="event/:eventId" element={<EventManagement />} />
              {/* Redirect /organizer to /organizer/dashboard */}
              <Route index element={<Navigate to="/organizer/dashboard" replace />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </SentryRoutes>
        </div>
        </AnalyticsWrapper>
      </Router>
    </AuthProvider>
    </Sentry.ErrorBoundary>
  );
}

export default App;