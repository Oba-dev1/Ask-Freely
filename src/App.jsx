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
    <div className="text-center p-6" role="group" aria-label={label}>
      <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-primary/20 to-primary/10 rounded-2xl flex items-center justify-center">
        <i className={`${icon} text-3xl text-primary`} aria-hidden="true" />
      </div>
      <div className="text-4xl md:text-5xl font-bold text-ink mb-2 font-['Space_Grotesk']">
        {num}
      </div>
      <div className="text-neutral-600 font-medium text-sm md:text-base">
        {label}
      </div>
    </div>
  );
}

function Story({ quote, avatar, name, role }) {
  return (
    <article className="group p-8 bg-white rounded-2xl border border-neutral-200 hover:border-primary/30 hover:shadow-xl transition-all duration-300" tabIndex={0}>
      <div className="mb-6">
        <i className="fas fa-quote-left text-3xl text-primary/20 mb-4 block" aria-hidden="true" />
        <blockquote className="text-neutral-700 leading-relaxed text-base md:text-lg italic">
          {quote}
        </blockquote>
      </div>
      <div className="flex items-center gap-4 pt-4 border-t border-neutral-100">
        <img
          src={avatar}
          alt={`${name} avatar`}
          className="w-14 h-14 rounded-full object-cover border-2 border-primary/20"
        />
        <div>
          <strong className="block text-ink font-bold text-base">{name}</strong>
          <span className="text-neutral-600 text-sm">{role}</span>
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
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/98 backdrop-blur-lg border-b border-gray-200 shadow-sm" role="banner">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo/Brand */}
          <button
            className="inline-flex items-center gap-2.5 font-bold text-lg md:text-xl text-ink hover:opacity-80 transition-opacity bg-transparent border-0 cursor-pointer p-1"
            onClick={() => navigate("/")}
          >
            <i className="fas fa-comments text-primary text-xl md:text-2xl" aria-hidden="true" />
            <span className="font-['Space_Grotesk']">Ask Freely</span>
          </button>

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden inline-flex items-center justify-center p-2 rounded-lg text-ink hover:bg-primary/10 transition-all z-50 border-0 bg-transparent cursor-pointer text-xl"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
          >
            <i className={mobileMenuOpen ? "fas fa-times" : "fas fa-bars"} />
          </button>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6" aria-label="Primary navigation">
            <a
              href="#values"
              onClick={(e) => handleNavClick(e, 'values')}
              className="text-neutral-700 font-semibold hover:text-primary transition-colors px-3 py-2 rounded-lg hover:bg-primary/5"
            >
              Why Ask Freely
            </a>
            <a
              href="#how-it-works"
              onClick={(e) => handleNavClick(e, 'how-it-works')}
              className="text-neutral-700 font-semibold hover:text-primary transition-colors px-3 py-2 rounded-lg hover:bg-primary/5"
            >
              How It Works
            </a>
            <a
              href="#why"
              onClick={(e) => handleNavClick(e, 'why')}
              className="text-neutral-700 font-semibold hover:text-primary transition-colors px-3 py-2 rounded-lg hover:bg-primary/5"
            >
              Features
            </a>
            <a
              href="#stories"
              onClick={(e) => handleNavClick(e, 'stories')}
              className="text-neutral-700 font-semibold hover:text-primary transition-colors px-3 py-2 rounded-lg hover:bg-primary/5"
            >
              Reviews
            </a>
          </nav>

          {/* Desktop Action Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <button
              className="px-4 py-2.5 rounded-lg font-bold border border-gray-300 bg-white text-neutral-700 hover:bg-gray-50 hover:border-gray-400 transition-all cursor-pointer"
              onClick={() => navigate("/login")}
            >
              Log In
            </button>
            <button
              className="px-4 py-2.5 rounded-lg font-bold bg-primary text-white hover:bg-primary-dark hover:shadow-lg hover:-translate-y-0.5 transition-all cursor-pointer border-0"
              onClick={() => navigate("/signup")}
            >
              Get Started Free
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        <nav
          className={`md:hidden fixed top-16 left-0 right-0 bg-white border-t border-gray-200 shadow-lg transition-all duration-300 ${
            mobileMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0 overflow-hidden'
          }`}
          aria-label="Mobile navigation"
        >
          <div className="flex flex-col p-4">
            <a
              href="#values"
              onClick={(e) => handleNavClick(e, 'values')}
              className="text-neutral-700 font-semibold hover:text-primary hover:bg-primary/5 transition-colors px-4 py-3 rounded-lg border-b border-gray-100"
            >
              Why Ask Freely
            </a>
            <a
              href="#how-it-works"
              onClick={(e) => handleNavClick(e, 'how-it-works')}
              className="text-neutral-700 font-semibold hover:text-primary hover:bg-primary/5 transition-colors px-4 py-3 rounded-lg border-b border-gray-100"
            >
              How It Works
            </a>
            <a
              href="#why"
              onClick={(e) => handleNavClick(e, 'why')}
              className="text-neutral-700 font-semibold hover:text-primary hover:bg-primary/5 transition-colors px-4 py-3 rounded-lg border-b border-gray-100"
            >
              Features
            </a>
            <a
              href="#stories"
              onClick={(e) => handleNavClick(e, 'stories')}
              className="text-neutral-700 font-semibold hover:text-primary hover:bg-primary/5 transition-colors px-4 py-3 rounded-lg"
            >
              Reviews
            </a>
          </div>
        </nav>
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
    <section id="hero" className="pt-24 md:pt-32 pb-16 md:pb-24 bg-gradient-to-b from-white to-neutral-50" aria-labelledby="hero-heading">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-12">
          {/* Hero Copy - Centered */}
          <div className="text-center flex flex-col items-center max-w-4xl">
            {/* Trust Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-semibold mb-6 animate-fade-in">
              <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
              Trusted by organizers worldwide
            </div>

            {/* Headline */}
            <h1
              id="hero-heading"
              className="text-4xl sm:text-5xl lg:text-6xl font-bold text-ink leading-tight mb-6 font-['Space_Grotesk'] animate-slide-up"
            >
              Turn Tough Questions Into Breakthrough Conversations
            </h1>

            {/* Description */}
            <p className="text-lg sm:text-xl text-neutral-600 leading-relaxed mb-8 max-w-3xl">
              The anonymous Q&amp;A platform that helps event organizers create psychologically safe spaces where every voice matters. Collect, prioritize, and address questions with confidence—no awkward silences, just honest dialogue.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                className="inline-flex items-center justify-center gap-2 px-6 py-4 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 border-0 cursor-pointer"
                onClick={() => navigate("/signup")}
              >
                Start Free - Create Your Event
                <i className="fas fa-arrow-right" aria-hidden="true" />
              </button>
              <button
                className="inline-flex items-center justify-center px-6 py-4 bg-white text-neutral-700 font-bold rounded-xl border-2 border-neutral-300 hover:border-neutral-400 hover:bg-neutral-50 transition-all duration-200 cursor-pointer"
                onClick={() => navigate("/participate")}
              >
                See How It Works
              </button>
            </div>
          </div>

          {/* Hero Carousel - Below content */}
          <aside className="relative w-full max-w-5xl" aria-hidden="true">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl aspect-[4/3] bg-neutral-100">
              <div
                className="flex transition-transform duration-700 ease-in-out h-full"
                style={{ transform: `translateX(-${currentSlide * 100}%)` }}
              >
                {slides.map((slide, index) => (
                  <div key={index} className="min-w-full h-full">
                    <img
                      src={slide.src}
                      alt={slide.alt}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Carousel Dots */}
            <div className="flex justify-center gap-2 mt-6">
              {slides.map((_, index) => (
                <button
                  key={index}
                  className={`w-3 h-3 rounded-full transition-all duration-300 border-0 cursor-pointer ${
                    index === currentSlide
                      ? 'bg-primary w-8'
                      : 'bg-neutral-300 hover:bg-neutral-400'
                  }`}
                  onClick={() => goToSlide(index)}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}

function LiveStatsSection({ liveStats }) {
  const { liveEvents, liveQuestions, liveParticipants } = liveStats;

  return (
    <section className="py-20 md:py-28 bg-gradient-to-br from-primary/5 via-white to-primary/5" aria-labelledby="stats-heading">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Stats Header */}
        <div className="text-center mb-16">
          <h3 id="stats-heading" className="text-3xl md:text-4xl lg:text-5xl font-bold text-ink mb-4 font-['Space_Grotesk']">
            Join Thousands Making Every Voice Count
          </h3>
          <p className="text-lg md:text-xl text-neutral-600 max-w-3xl mx-auto">
            Real conversations happening right now in communities worldwide
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
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

  // Responsive cards per view
  const [cardsPerView, setCardsPerView] = React.useState(4);

  React.useEffect(() => {
    const updateCardsPerView = () => {
      if (window.innerWidth < 640) {
        setCardsPerView(1); // Mobile: 1 card
      } else if (window.innerWidth < 1024) {
        setCardsPerView(2); // Tablet: 2 cards
      } else {
        setCardsPerView(4); // Desktop: 4 cards
      }
    };

    updateCardsPerView();
    window.addEventListener('resize', updateCardsPerView);
    return () => window.removeEventListener('resize', updateCardsPerView);
  }, []);

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
  }, [isAutoScrolling, recentEvents.length, cardsPerView]);

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
      <section id="happening" className="py-20 md:py-28 bg-neutral-50" aria-labelledby="events-heading">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h3 id="events-heading" className="text-3xl md:text-4xl font-bold text-ink mb-8 flex items-center justify-center gap-3 font-['Space_Grotesk']">
            <i className="fa-solid fa-bolt text-primary" /> Live Events
          </h3>
          <div className="text-center p-12 bg-white rounded-2xl border-2 border-dashed border-neutral-300">
            <p className="text-neutral-600 text-lg">Your community event could be featured here. Create one today!</p>
          </div>
        </div>
      </section>
    );
  }

  const showNavigation = recentEvents.length > cardsPerView;

  return (
    <section id="happening" className="py-20 md:py-28 bg-neutral-50" aria-labelledby="events-heading">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h3 id="events-heading" className="text-3xl md:text-4xl font-bold text-ink mb-12 flex items-center justify-center gap-3 font-['Space_Grotesk']">
          <i className="fa-solid fa-bolt text-primary" /> Live Events
        </h3>

        <div className="relative px-12 sm:px-14 lg:px-0">
          {showNavigation && (
            <button
              className="hidden lg:flex absolute left-0 top-1/2 -translate-y-1/2 lg:-translate-x-4 z-10 w-12 h-12 bg-white rounded-full shadow-lg border border-neutral-200 hover:bg-primary hover:text-white hover:border-primary transition-all duration-200 items-center justify-center text-neutral-700"
              onClick={handlePrev}
              aria-label="Previous events"
            >
              <i className="fa-solid fa-chevron-left"></i>
            </button>
          )}

          {/* Mobile navigation buttons */}
          {showNavigation && (
            <button
              className="lg:hidden absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-full shadow-lg border border-neutral-200 hover:bg-primary hover:text-white hover:border-primary transition-all duration-200 flex items-center justify-center text-neutral-700"
              onClick={handlePrev}
              aria-label="Previous events"
            >
              <i className="fa-solid fa-chevron-left text-sm"></i>
            </button>
          )}

          <div className="overflow-hidden">
            <div
              className="flex transition-transform duration-500 ease-in-out"
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
                    className="flex-shrink-0 px-2 sm:px-3"
                    style={{ width: `${100 / cardsPerView}%` }}
                  >
                    <div className="bg-white rounded-xl border border-neutral-200 hover:border-primary/30 hover:shadow-lg transition-all duration-300 p-4 sm:p-6 h-full">
                      <div className="flex items-center justify-between mb-4 text-xs sm:text-sm flex-wrap gap-2">
                        <span className="inline-flex items-center gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 bg-green-100 text-green-700 rounded-full font-semibold">
                          <i className="fa-solid fa-circle text-xs"></i> <span className="hidden sm:inline">Live now</span><span className="sm:hidden">Live</span>
                        </span>
                        <span className="inline-flex items-center gap-1.5 text-primary font-semibold">
                          <i className="fa-solid fa-fire"></i> {questionCount}
                        </span>
                      </div>

                      <h4 className="text-base sm:text-lg font-bold text-ink mb-3 line-clamp-2">{event.title}</h4>

                      {event.org && (
                        <p className="text-neutral-600 text-xs sm:text-sm flex items-center gap-2 truncate">
                          <i className="fa-solid fa-building flex-shrink-0"></i>
                          <span className="truncate">{event.org}</span>
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {showNavigation && (
            <button
              className="hidden lg:flex absolute right-0 top-1/2 -translate-y-1/2 lg:translate-x-4 z-10 w-12 h-12 bg-white rounded-full shadow-lg border border-neutral-200 hover:bg-primary hover:text-white hover:border-primary transition-all duration-200 items-center justify-center text-neutral-700"
              onClick={handleNext}
              aria-label="Next events"
            >
              <i className="fa-solid fa-chevron-right"></i>
            </button>
          )}

          {/* Mobile navigation buttons */}
          {showNavigation && (
            <button
              className="lg:hidden absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-full shadow-lg border border-neutral-200 hover:bg-primary hover:text-white hover:border-primary transition-all duration-200 flex items-center justify-center text-neutral-700"
              onClick={handleNext}
              aria-label="Next events"
            >
              <i className="fa-solid fa-chevron-right text-sm"></i>
            </button>
          )}
        </div>

        {/* Carousel dots */}
        {showNavigation && (
          <div className="flex justify-center gap-2 mt-8">
            {Array.from({ length: recentEvents.length - cardsPerView + 1 }).map((_, index) => (
              <button
                key={index}
                className={`w-3 h-3 rounded-full transition-all duration-300 border-0 cursor-pointer ${
                  index === currentIndex
                    ? 'bg-primary w-8'
                    : 'bg-neutral-300 hover:bg-neutral-400'
                }`}
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
    <section id="values" className="py-20 md:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-center text-ink mb-16 font-['Space_Grotesk']">
          Built on Values That Matter
        </h2>

        {/* Values Grid */}
        <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
          {/* Value 1: Safety */}
          <div className="group text-center">
            <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-primary/20 to-primary/10 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:shadow-lg transition-all duration-300">
              <i className="fa-solid fa-hand-holding-heart text-3xl text-primary" aria-hidden="true" />
            </div>
            <h3 className="text-xl md:text-2xl font-bold text-ink mb-4">
              Safety First, Always
            </h3>
            <p className="text-neutral-600 leading-relaxed">
              Optional anonymity with built-in moderation tools. Create spaces where the toughest questions can finally be asked—without fear or judgment.
            </p>
          </div>

          {/* Value 2: Community-Driven */}
          <div className="group text-center">
            <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-blue-500/20 to-blue-500/10 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:shadow-lg transition-all duration-300">
              <i className="fa-solid fa-people-arrows text-3xl text-blue-500" aria-hidden="true" />
            </div>
            <h3 className="text-xl md:text-2xl font-bold text-ink mb-4">
              Community-Driven Prioritization
            </h3>
            <p className="text-neutral-600 leading-relaxed">
              Let your audience upvote what truly matters to them. Stop guessing what people care about—let them show you through democratic engagement.
            </p>
          </div>

          {/* Value 3: Customization */}
          <div className="group text-center">
            <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-purple-500/20 to-purple-500/10 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:shadow-lg transition-all duration-300">
              <i className="fa-solid fa-palette text-3xl text-purple-500" aria-hidden="true" />
            </div>
            <h3 className="text-xl md:text-2xl font-bold text-ink mb-4">
              Your Brand, Your Voice
            </h3>
            <p className="text-neutral-600 leading-relaxed">
              Full white-label customization. Add your logo, colors, and messaging so participants feel right at home—not on a generic platform.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function StoriesSection() {
  return (
    <section id="stories" className="py-20 md:py-28 bg-gradient-to-b from-white to-neutral-50" aria-labelledby="stories-heading">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <h3 id="stories-heading" className="text-3xl md:text-4xl lg:text-5xl font-bold text-center text-ink mb-16 font-['Space_Grotesk']">
          Hear From Organizers Like You
        </h3>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-3 gap-8">
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
    <section id="how-it-works" className="py-20 md:py-28 bg-gradient-to-b from-neutral-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <h3 className="text-3xl md:text-4xl lg:text-5xl font-bold text-center text-ink mb-4 font-['Space_Grotesk']">
          Simple to Start, Powerful in Practice
        </h3>
        <p className="text-lg md:text-xl text-neutral-600 text-center mb-16 max-w-3xl mx-auto">
          Go from idea to engagement in under 3 minutes
        </p>

        {/* Timeline */}
        <div className="relative max-w-4xl mx-auto">
          {/* Connecting Line */}
          <div className="hidden md:block absolute top-20 left-0 right-0 h-1 bg-gradient-to-r from-primary/20 via-primary/40 to-primary/20"
               style={{ top: '4rem' }} />

          <div className="space-y-12 md:space-y-0">
            {/* Step 1 */}
            <div className="relative md:grid md:grid-cols-3 md:gap-8 items-start">
              <div className="md:col-span-1 flex justify-center mb-6 md:mb-0">
                <div className="relative z-10">
                  <div className="w-16 h-16 md:w-20 md:h-20 bg-primary text-white rounded-full flex items-center justify-center text-2xl md:text-3xl font-bold shadow-lg">
                    1
                  </div>
                </div>
              </div>
              <div className="md:col-span-2 text-center md:text-left">
                <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl mb-4">
                  <i className="fa-solid fa-calendar-plus text-2xl text-primary" />
                </div>
                <h4 className="text-xl md:text-2xl font-bold text-ink mb-3">
                  Create Your Event in Seconds
                </h4>
                <p className="text-neutral-600 leading-relaxed">
                  No credit card required. Set up your Q&amp;A session, customize your branding, add strategic prompts, and get a shareable link instantly.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative md:grid md:grid-cols-3 md:gap-8 items-start">
              <div className="md:col-span-1 flex justify-center mb-6 md:mb-0">
                <div className="relative z-10">
                  <div className="w-16 h-16 md:w-20 md:h-20 bg-primary text-white rounded-full flex items-center justify-center text-2xl md:text-3xl font-bold shadow-lg">
                    2
                  </div>
                </div>
              </div>
              <div className="md:col-span-2 text-center md:text-left">
                <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-blue-500/20 to-blue-500/10 rounded-xl mb-4">
                  <i className="fa-solid fa-comments text-2xl text-blue-500" />
                </div>
                <h4 className="text-xl md:text-2xl font-bold text-ink mb-3">
                  Share & Watch Engagement Soar
                </h4>
                <p className="text-neutral-600 leading-relaxed">
                  One link, zero friction. Participants ask and upvote questions anonymously—no account creation, no downloads, no barriers to participation.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative md:grid md:grid-cols-3 md:gap-8 items-start">
              <div className="md:col-span-1 flex justify-center mb-6 md:mb-0">
                <div className="relative z-10">
                  <div className="w-16 h-16 md:w-20 md:h-20 bg-primary text-white rounded-full flex items-center justify-center text-2xl md:text-3xl font-bold shadow-lg">
                    3
                  </div>
                </div>
              </div>
              <div className="md:col-span-2 text-center md:text-left">
                <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-purple-500/20 to-purple-500/10 rounded-xl mb-4">
                  <i className="fa-solid fa-microphone text-2xl text-purple-500" />
                </div>
                <h4 className="text-xl md:text-2xl font-bold text-ink mb-3">
                  Facilitate Like a Pro
                </h4>
                <p className="text-neutral-600 leading-relaxed">
                  See top questions ranked by community votes in real-time. Moderate with empathy, respond with confidence, and export insights for follow-up.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function WhySection() {
  return (
    <section id="why" className="py-20 md:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <h3 className="text-3xl md:text-4xl lg:text-5xl font-bold text-center text-ink mb-16 font-['Space_Grotesk'] max-w-4xl mx-auto">
          Everything You Need to Host Meaningful Conversations
        </h3>

        {/* Features Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6">
          {/* Feature 1: Strategic Question Seeding */}
          <div className="group p-6 rounded-2xl bg-gradient-to-br from-neutral-50 to-white border border-neutral-200 hover:border-primary/30 hover:shadow-lg transition-all duration-300">
            <div className="w-14 h-14 mb-5 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <i className="fa-solid fa-bullseye text-2xl text-primary" />
            </div>
            <h4 className="text-lg md:text-xl font-bold text-ink mb-3">
              Strategic Question Seeding
            </h4>
            <p className="text-neutral-600 leading-relaxed text-sm">
              Pre-populate thoughtful prompts to guide the conversation and ensure important topics get covered—even if the room is shy at first.
            </p>
          </div>

          {/* Feature 2: Privacy-First by Design */}
          <div className="group p-6 rounded-2xl bg-gradient-to-br from-neutral-50 to-white border border-neutral-200 hover:border-blue-500/30 hover:shadow-lg transition-all duration-300">
            <div className="w-14 h-14 mb-5 bg-gradient-to-br from-blue-500/20 to-blue-500/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <i className="fa-solid fa-user-shield text-2xl text-blue-500" />
            </div>
            <h4 className="text-lg md:text-xl font-bold text-ink mb-3">
              Privacy-First by Design
            </h4>
            <p className="text-neutral-600 leading-relaxed text-sm">
              Optional anonymity, robust moderation controls, and respectful boundaries. Build trust so people share what they actually think.
            </p>
          </div>

          {/* Feature 3: Actionable Insights & Analytics */}
          <div className="group p-6 rounded-2xl bg-gradient-to-br from-neutral-50 to-white border border-neutral-200 hover:border-green-500/30 hover:shadow-lg transition-all duration-300">
            <div className="w-14 h-14 mb-5 bg-gradient-to-br from-green-500/20 to-green-500/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <i className="fa-solid fa-chart-line text-2xl text-green-500" />
            </div>
            <h4 className="text-lg md:text-xl font-bold text-ink mb-3">
              Actionable Insights & Analytics
            </h4>
            <p className="text-neutral-600 leading-relaxed text-sm">
              Track participation patterns, identify trending themes, and export data to share with stakeholders. Turn feedback into action plans.
            </p>
          </div>

          {/* Feature 4: Complete White-Label Control */}
          <div className="group p-6 rounded-2xl bg-gradient-to-br from-neutral-50 to-white border border-neutral-200 hover:border-purple-500/30 hover:shadow-lg transition-all duration-300">
            <div className="w-14 h-14 mb-5 bg-gradient-to-br from-purple-500/20 to-purple-500/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <i className="fa-solid fa-sliders text-2xl text-purple-500" />
            </div>
            <h4 className="text-lg md:text-xl font-bold text-ink mb-3">
              Complete White-Label Control
            </h4>
            <p className="text-neutral-600 leading-relaxed text-sm">
              Custom branding, personalized messaging, and your own domain. Deliver a seamless experience that reinforces your organization's identity.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function CTASection() {
  const navigate = useNavigate();

  return (
    <section id="cta" className="py-20 md:py-28 bg-gradient-to-br from-primary/10 via-white to-primary/10" aria-labelledby="cta-heading">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-primary to-primary-dark rounded-3xl p-8 md:p-12 lg:p-16 text-center shadow-2xl relative overflow-hidden">
          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />

          <div className="relative z-10">
            <h3 id="cta-heading" className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6 font-['Space_Grotesk']">
              Ready to Transform Your Next Q&amp;A Session?
            </h3>
            <p className="text-lg md:text-xl text-white/90 mb-10 max-w-3xl mx-auto leading-relaxed">
              Join organizers creating safer, more engaging conversations. Set up your first event free—no credit card required.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-primary font-bold rounded-xl hover:bg-neutral-50 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 text-lg border-0 cursor-pointer"
                onClick={() => navigate("/signup")}
              >
                Start Free - Create Your Event
                <i className="fas fa-arrow-right" aria-hidden="true" />
              </button>
              <button
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-transparent text-white font-bold rounded-xl border-2 border-white hover:bg-white hover:text-primary transition-all duration-200 text-lg cursor-pointer"
                onClick={() => navigate("/participate")}
              >
                Try the Demo First
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  const navigate = useNavigate();

  return (
    <footer className="bg-ink text-white py-16" role="contentinfo">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="grid md:grid-cols-4 gap-12 mb-12">
          {/* Brand Section */}
          <div className="md:col-span-1">
            <button
              className="inline-flex items-center gap-2.5 font-bold text-xl text-white hover:opacity-80 transition-opacity bg-transparent border-0 cursor-pointer p-0 mb-4"
              onClick={() => navigate("/")}
            >
              <i className="fas fa-comments text-primary text-2xl" aria-hidden="true" />
              <span className="font-['Space_Grotesk']">Ask Freely</span>
            </button>
            <p className="text-neutral-400 leading-relaxed">
              Built with communities. Powered by your stories.
            </p>
          </div>

          {/* Footer Links */}
          <div className="md:col-span-3 grid sm:grid-cols-3 gap-8">
            {/* Product Column */}
            <div>
              <h4 className="text-white font-bold mb-4 text-lg">Product</h4>
              <div className="flex flex-col gap-3">
                <a href="#features" className="text-neutral-400 hover:text-primary transition-colors">
                  Features
                </a>
                <a href="#pricing" className="text-neutral-400 hover:text-primary transition-colors">
                  Pricing
                </a>
                <a href="#demo" className="text-neutral-400 hover:text-primary transition-colors">
                  Demo
                </a>
              </div>
            </div>

            {/* Community Column */}
            <div>
              <h4 className="text-white font-bold mb-4 text-lg">Community</h4>
              <div className="flex flex-col gap-3">
                <a href="#stories" className="text-neutral-400 hover:text-primary transition-colors">
                  Stories
                </a>
                <a href="#events" className="text-neutral-400 hover:text-primary transition-colors">
                  Events
                </a>
                <a href="#guide" className="text-neutral-400 hover:text-primary transition-colors">
                  Community Guide
                </a>
              </div>
            </div>

            {/* Support Column */}
            <div>
              <h4 className="text-white font-bold mb-4 text-lg">Support</h4>
              <div className="flex flex-col gap-3">
                <a href="#help" className="text-neutral-400 hover:text-primary transition-colors">
                  Help Center
                </a>
                <a href="#docs" className="text-neutral-400 hover:text-primary transition-colors">
                  Documentation
                </a>
                <a href="#status" className="text-neutral-400 hover:text-primary transition-colors">
                  Status
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="pt-8 border-t border-neutral-700 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-neutral-400 text-sm">
            © {new Date().getFullYear()} Ask Freely
          </p>

          <div className="flex items-center gap-2 text-sm">
            <button
              onClick={() => navigate("/help")}
              className="text-neutral-400 hover:text-primary transition-colors bg-transparent border-0 cursor-pointer p-0"
            >
              Help
            </button>
            <span className="text-neutral-600">·</span>
            <button
              onClick={() => navigate("/terms-of-service")}
              className="text-neutral-400 hover:text-primary transition-colors bg-transparent border-0 cursor-pointer p-0"
            >
              Terms of Service
            </button>
            <span className="text-neutral-600">·</span>
            <button
              onClick={() => navigate("/privacy-policy")}
              className="text-neutral-400 hover:text-primary transition-colors bg-transparent border-0 cursor-pointer p-0"
            >
              Privacy Policy
            </button>
          </div>
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