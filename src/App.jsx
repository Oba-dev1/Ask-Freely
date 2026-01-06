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
import AdminProtectedRoute from "./Components/AdminProtectedRoute";
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
import AdminLayout from "./Components/AdminLayout";
import AdminDashboard from "./Components/AdminDashboard";
import AdminUsers from "./Components/AdminUsers";
import AdminEvents from "./Components/AdminEvents";
import AdminMessages from "./Components/AdminMessages";
import AdminActivity from "./Components/AdminActivity";
import NotificationsPage from "./Components/NotificationsPage";
import usePageTracking from "./hooks/usePageTracking";
import { initializeSecurity } from "./utils/security";

import "./App.css";
import "@fortawesome/fontawesome-free/css/all.min.css";

// Create Sentry-enhanced Router
const SentryRoutes = Sentry.withSentryRouting(Routes);

// ==================== HOOKS ====================

// Hook for scroll-triggered animations using Intersection Observer
function useScrollAnimation(options = {}) {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          // Once visible, stop observing (animation plays once)
          if (options.once !== false) {
            observer.unobserve(element);
          }
        } else if (options.once === false) {
          setIsVisible(false);
        }
      },
      {
        threshold: options.threshold || 0.1,
        rootMargin: options.rootMargin || '0px 0px -50px 0px',
      }
    );

    observer.observe(element);

    return () => {
      if (element) observer.unobserve(element);
    };
  }, [options.threshold, options.rootMargin, options.once]);

  return [ref, isVisible];
}

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
    <div className="group flex items-center gap-3 sm:gap-4 p-4 sm:p-6 bg-white rounded-xl border border-neutral-200 hover:border-primary/30 hover:shadow-lg transition-all duration-300" role="group" aria-label={label}>
      {/* Icon */}
      <div className="flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-primary to-primary-dark rounded-xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300">
        <i className={`${icon} text-lg sm:text-xl text-white`} aria-hidden="true" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="text-2xl sm:text-3xl font-bold text-ink mb-0.5 font-['Space_Grotesk'] leading-none">
          {num}
        </div>
        <div className="text-neutral-600 font-medium text-xs sm:text-sm">
          {label}
        </div>
      </div>
    </div>
  );
}

function Story({ quote, avatar, name, role }) {
  return (
    <article className="group p-6 bg-white rounded-xl border border-neutral-200 hover:border-primary/30 hover:shadow-xl transition-all duration-300" tabIndex={0}>
      <div className="mb-4">
        <i className="fas fa-quote-left text-xl text-primary/20 mb-3 block" aria-hidden="true" />
        <blockquote className="text-neutral-700 leading-relaxed text-sm italic">
          {quote}
        </blockquote>
      </div>
      <div className="flex items-center gap-3 pt-4 border-t border-neutral-100">
        <img
          src={avatar}
          alt={`${name} avatar`}
          className="w-10 h-10 rounded-full object-cover border-2 border-primary/20"
        />
        <div>
          <strong className="block text-ink font-semibold text-sm">{name}</strong>
          <span className="text-neutral-600 text-xs">{role}</span>
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
        <div className="flex items-center justify-between h-12 md:h-14">
          {/* Logo/Brand */}
          <button
            className="inline-flex items-center gap-2 font-bold text-sm md:text-base text-ink hover:opacity-80 transition-opacity bg-transparent border-0 cursor-pointer p-1"
            onClick={() => navigate("/")}
          >
            <i className="fas fa-comments text-primary text-base md:text-lg" aria-hidden="true" />
            <span className="font-['Space_Grotesk']">Ask Freely</span>
          </button>

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden inline-flex items-center justify-center p-1.5 rounded-md text-ink hover:bg-primary/10 transition-all z-50 border-0 bg-transparent cursor-pointer text-base"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
          >
            <i className={mobileMenuOpen ? "fas fa-times" : "fas fa-bars"} />
          </button>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-4" aria-label="Primary navigation">
            <a
              href="#values"
              onClick={(e) => handleNavClick(e, 'values')}
              className="text-neutral-700 font-medium text-sm hover:text-primary transition-colors px-2.5 py-1.5 rounded-md hover:bg-primary/5"
            >
              Why Ask Freely
            </a>
            <a
              href="#how-it-works"
              onClick={(e) => handleNavClick(e, 'how-it-works')}
              className="text-neutral-700 font-medium text-sm hover:text-primary transition-colors px-2.5 py-1.5 rounded-md hover:bg-primary/5"
            >
              How It Works
            </a>
            <a
              href="#why"
              onClick={(e) => handleNavClick(e, 'why')}
              className="text-neutral-700 font-medium text-sm hover:text-primary transition-colors px-2.5 py-1.5 rounded-md hover:bg-primary/5"
            >
              Features
            </a>
            <a
              href="#stories"
              onClick={(e) => handleNavClick(e, 'stories')}
              className="text-neutral-700 font-medium text-sm hover:text-primary transition-colors px-2.5 py-1.5 rounded-md hover:bg-primary/5"
            >
              Reviews
            </a>
          </nav>

          {/* Desktop Action Buttons */}
          <div className="hidden md:flex items-center gap-2">
            <button
              className="px-3 py-1.5 rounded-md font-medium text-sm border border-gray-300 bg-white text-neutral-700 hover:bg-gray-50 hover:border-gray-400 transition-all cursor-pointer"
              onClick={() => navigate("/login")}
            >
              Log In
            </button>
            <button
              className="px-3 py-1.5 rounded-md font-medium text-sm bg-primary text-white hover:bg-primary-dark hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer border-0"
              onClick={() => navigate("/signup")}
            >
              Get Started Free
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        <nav
          className={`md:hidden fixed top-12 left-0 right-0 bg-white border-t border-gray-200 shadow-lg transition-all duration-300 ${
            mobileMenuOpen ? 'max-h-80 opacity-100' : 'max-h-0 opacity-0 overflow-hidden'
          }`}
          aria-label="Mobile navigation"
        >
          <div className="flex flex-col p-3">
            <a
              href="#values"
              onClick={(e) => handleNavClick(e, 'values')}
              className="text-neutral-700 font-medium text-sm hover:text-primary hover:bg-primary/5 transition-colors px-3 py-2.5 rounded-md border-b border-gray-100"
            >
              Why Ask Freely
            </a>
            <a
              href="#how-it-works"
              onClick={(e) => handleNavClick(e, 'how-it-works')}
              className="text-neutral-700 font-medium text-sm hover:text-primary hover:bg-primary/5 transition-colors px-3 py-2.5 rounded-md border-b border-gray-100"
            >
              How It Works
            </a>
            <a
              href="#why"
              onClick={(e) => handleNavClick(e, 'why')}
              className="text-neutral-700 font-medium text-sm hover:text-primary hover:bg-primary/5 transition-colors px-3 py-2.5 rounded-md border-b border-gray-100"
            >
              Features
            </a>
            <a
              href="#stories"
              onClick={(e) => handleNavClick(e, 'stories')}
              className="text-neutral-700 font-medium text-sm hover:text-primary hover:bg-primary/5 transition-colors px-3 py-2.5 rounded-md"
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
  const [heroRef, heroVisible] = useScrollAnimation({ threshold: 0.2 });

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
    <section id="hero" className="pt-20 md:pt-24 pb-12 md:pb-16 bg-gradient-to-b from-white to-neutral-50" aria-labelledby="hero-heading" ref={heroRef}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-8">
          {/* Hero Copy - Centered */}
          <div className="text-center flex flex-col items-center max-w-3xl">
            {/* Trust Badge */}
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-xs font-semibold mb-4 transition-all duration-700 ${heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
              <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
              Trusted by organizers worldwide
            </div>

            {/* Headline */}
            <h1
              id="hero-heading"
              className={`text-2xl sm:text-3xl lg:text-4xl font-bold text-ink leading-tight mb-4 font-['Space_Grotesk'] transition-all duration-700 delay-100 ${heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
            >
              Turn Tough Questions Into Breakthrough Conversations
            </h1>

            {/* Description */}
            <p className={`text-sm sm:text-base text-neutral-600 leading-relaxed mb-6 max-w-2xl transition-all duration-700 delay-200 ${heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
              The anonymous Q&amp;A platform that helps event organizers create psychologically safe spaces where every voice matters. Collect, prioritize, and address questions with confidence—no awkward silences, just honest dialogue.
            </p>

            {/* CTA Buttons */}
            <div className={`flex flex-col sm:flex-row gap-3 justify-center transition-all duration-700 delay-300 ${heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
              <button
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-primary text-white font-semibold text-sm rounded-lg hover:bg-primary-dark hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 border-0 cursor-pointer animate-pulse-glow"
                onClick={() => navigate("/signup")}
              >
                Start Free - Create Your Event
                <i className="fas fa-arrow-right text-xs" aria-hidden="true" />
              </button>
              <button
                className="inline-flex items-center justify-center px-5 py-2.5 bg-white text-neutral-700 font-semibold text-sm rounded-lg border border-neutral-300 hover:border-neutral-400 hover:bg-neutral-50 transition-all duration-200 cursor-pointer"
                onClick={() => navigate("/participate")}
              >
                See How It Works
              </button>
            </div>
          </div>

          {/* Hero Carousel - Below content */}
          <aside className={`relative w-full max-w-4xl transition-all duration-1000 delay-500 ${heroVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-10 scale-95'}`} aria-hidden="true">
            <div className="relative rounded-xl overflow-hidden shadow-xl aspect-[16/9] bg-neutral-100">
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
            <div className="flex justify-center gap-1.5 mt-4">
              {slides.map((_, index) => (
                <button
                  key={index}
                  className={`w-2 h-2 rounded-full transition-all duration-300 border-0 cursor-pointer ${
                    index === currentSlide
                      ? 'bg-primary w-6'
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
  const [statsRef, statsVisible] = useScrollAnimation({ threshold: 0.2 });

  return (
    <section className="py-12 md:py-16 bg-white" aria-labelledby="stats-heading" ref={statsRef}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Stats Header */}
        <div className={`text-center mb-8 sm:mb-10 transition-all duration-700 ${statsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <h3 id="stats-heading" className="text-xl sm:text-2xl md:text-3xl font-bold text-ink mb-2 font-['Space_Grotesk']">
            Join Thousands Making Every Voice Count
          </h3>
          <p className="text-sm sm:text-base text-neutral-600 max-w-2xl mx-auto">
            Real conversations happening right now in communities worldwide
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 max-w-4xl mx-auto">
          <div className={`transition-all duration-700 delay-100 ${statsVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-95'}`}>
            <StatItem
              icon="fa-solid fa-circle-question"
              num={formatNumber(liveQuestions)}
              label="Questions Answered"
            />
          </div>
          <div className={`transition-all duration-700 delay-200 ${statsVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-95'}`}>
            <StatItem
              icon="fa-solid fa-calendar-days"
              num={formatNumber(liveEvents)}
              label="Events Hosted"
            />
          </div>
          <div className={`transition-all duration-700 delay-300 ${statsVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-95'}`}>
            <StatItem
              icon="fa-solid fa-user-group"
              num={formatNumber(liveParticipants)}
              label="People Heard"
            />
          </div>
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
      <section id="happening" className="py-12 md:py-16 bg-neutral-50" aria-labelledby="events-heading">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h3 id="events-heading" className="text-xl md:text-2xl font-bold text-ink mb-6 flex items-center justify-center gap-2 font-['Space_Grotesk']">
            <i className="fa-solid fa-bolt text-primary text-lg" /> Live Events
          </h3>
          <div className="text-center p-8 bg-white rounded-xl border-2 border-dashed border-neutral-300">
            <p className="text-neutral-600 text-sm">Your community event could be featured here. Create one today!</p>
          </div>
        </div>
      </section>
    );
  }

  const showNavigation = recentEvents.length > cardsPerView;

  return (
    <section id="happening" className="py-12 md:py-16 bg-neutral-50" aria-labelledby="events-heading">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h3 id="events-heading" className="text-xl md:text-2xl font-bold text-ink mb-8 flex items-center justify-center gap-2 font-['Space_Grotesk']">
          <i className="fa-solid fa-bolt text-primary text-lg" /> Live Events
        </h3>

        <div className="relative px-10 sm:px-12 lg:px-0">
          {showNavigation && (
            <button
              className="hidden lg:flex absolute left-0 top-1/2 -translate-y-1/2 lg:-translate-x-3 z-10 w-9 h-9 bg-white rounded-full shadow-md border border-neutral-200 hover:bg-primary hover:text-white hover:border-primary transition-all duration-200 items-center justify-center text-neutral-700 text-sm"
              onClick={handlePrev}
              aria-label="Previous events"
            >
              <i className="fa-solid fa-chevron-left"></i>
            </button>
          )}

          {/* Mobile navigation buttons */}
          {showNavigation && (
            <button
              className="lg:hidden absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 sm:w-9 sm:h-9 bg-white rounded-full shadow-md border border-neutral-200 hover:bg-primary hover:text-white hover:border-primary transition-all duration-200 flex items-center justify-center text-neutral-700"
              onClick={handlePrev}
              aria-label="Previous events"
            >
              <i className="fa-solid fa-chevron-left text-xs"></i>
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
                    className="flex-shrink-0 px-1.5 sm:px-2"
                    style={{ width: `${100 / cardsPerView}%` }}
                  >
                    <div className="bg-white rounded-lg border border-neutral-200 hover:border-primary/30 hover:shadow-md transition-all duration-300 p-3 sm:p-4 h-full">
                      <div className="flex items-center justify-between mb-3 text-xs flex-wrap gap-1.5">
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full font-medium">
                          <i className="fa-solid fa-circle text-[8px]"></i> <span className="hidden sm:inline">Live now</span><span className="sm:hidden">Live</span>
                        </span>
                        <span className="inline-flex items-center gap-1 text-primary font-medium text-xs">
                          <i className="fa-solid fa-fire"></i> {questionCount}
                        </span>
                      </div>

                      <h4 className="text-sm sm:text-base font-semibold text-ink mb-2 line-clamp-2">{event.title}</h4>

                      {event.org && (
                        <p className="text-neutral-600 text-xs flex items-center gap-1.5 truncate">
                          <i className="fa-solid fa-building flex-shrink-0 text-[10px]"></i>
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
              className="hidden lg:flex absolute right-0 top-1/2 -translate-y-1/2 lg:translate-x-3 z-10 w-9 h-9 bg-white rounded-full shadow-md border border-neutral-200 hover:bg-primary hover:text-white hover:border-primary transition-all duration-200 items-center justify-center text-neutral-700 text-sm"
              onClick={handleNext}
              aria-label="Next events"
            >
              <i className="fa-solid fa-chevron-right"></i>
            </button>
          )}

          {/* Mobile navigation buttons */}
          {showNavigation && (
            <button
              className="lg:hidden absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 sm:w-9 sm:h-9 bg-white rounded-full shadow-md border border-neutral-200 hover:bg-primary hover:text-white hover:border-primary transition-all duration-200 flex items-center justify-center text-neutral-700"
              onClick={handleNext}
              aria-label="Next events"
            >
              <i className="fa-solid fa-chevron-right text-xs"></i>
            </button>
          )}
        </div>

        {/* Carousel dots */}
        {showNavigation && (
          <div className="flex justify-center gap-1.5 mt-6">
            {Array.from({ length: recentEvents.length - cardsPerView + 1 }).map((_, index) => (
              <button
                key={index}
                className={`w-2 h-2 rounded-full transition-all duration-300 border-0 cursor-pointer ${
                  index === currentIndex
                    ? 'bg-primary w-5'
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
  const [valuesRef, valuesVisible] = useScrollAnimation({ threshold: 0.15 });

  return (
    <section id="values" className="py-12 md:py-16 bg-white" ref={valuesRef}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <h2 className={`text-xl md:text-2xl lg:text-3xl font-bold text-center text-ink mb-10 font-['Space_Grotesk'] transition-all duration-700 ${valuesVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          Built on Values That Matter
        </h2>

        {/* Values Grid */}
        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {/* Value 1: Safety */}
          <div className={`group text-center transition-all duration-700 delay-100 ${valuesVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <div className="w-14 h-14 mx-auto mb-4 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl flex items-center justify-center group-hover:scale-110 group-hover:shadow-md transition-all duration-300 animate-float" style={{ animationDelay: '0s' }}>
              <i className="fa-solid fa-hand-holding-heart text-xl text-primary" aria-hidden="true" />
            </div>
            <h3 className="text-base md:text-lg font-bold text-ink mb-2">
              Safety First, Always
            </h3>
            <p className="text-neutral-600 leading-relaxed text-sm">
              Optional anonymity with built-in moderation tools. Create spaces where the toughest questions can finally be asked—without fear or judgment.
            </p>
          </div>

          {/* Value 2: Community-Driven */}
          <div className={`group text-center transition-all duration-700 delay-200 ${valuesVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <div className="w-14 h-14 mx-auto mb-4 bg-gradient-to-br from-blue-500/20 to-blue-500/10 rounded-xl flex items-center justify-center group-hover:scale-110 group-hover:shadow-md transition-all duration-300 animate-float" style={{ animationDelay: '0.5s' }}>
              <i className="fa-solid fa-people-arrows text-xl text-blue-500" aria-hidden="true" />
            </div>
            <h3 className="text-base md:text-lg font-bold text-ink mb-2">
              Community-Driven Prioritization
            </h3>
            <p className="text-neutral-600 leading-relaxed text-sm">
              Let your audience upvote what truly matters to them. Stop guessing what people care about—let them show you through democratic engagement.
            </p>
          </div>

          {/* Value 3: Customization */}
          <div className={`group text-center transition-all duration-700 delay-300 ${valuesVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <div className="w-14 h-14 mx-auto mb-4 bg-gradient-to-br from-purple-500/20 to-purple-500/10 rounded-xl flex items-center justify-center group-hover:scale-110 group-hover:shadow-md transition-all duration-300 animate-float" style={{ animationDelay: '1s' }}>
              <i className="fa-solid fa-palette text-xl text-purple-500" aria-hidden="true" />
            </div>
            <h3 className="text-base md:text-lg font-bold text-ink mb-2">
              Your Brand, Your Voice
            </h3>
            <p className="text-neutral-600 leading-relaxed text-sm">
              Full white-label customization. Add your logo, colors, and messaging so participants feel right at home—not on a generic platform.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function StoriesSection() {
  const [storiesRef, storiesVisible] = useScrollAnimation({ threshold: 0.15 });

  return (
    <section id="stories" className="py-12 md:py-16 bg-gradient-to-b from-white to-neutral-50" aria-labelledby="stories-heading" ref={storiesRef}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <h3 id="stories-heading" className={`text-xl md:text-2xl lg:text-3xl font-bold text-center text-ink mb-10 font-['Space_Grotesk'] transition-all duration-700 ${storiesVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          Hear From Organizers Like You
        </h3>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-3 gap-4 md:gap-6">
          <div className={`transition-all duration-700 delay-100 ${storiesVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <Story
              quote="Ask Freely transformed our Q&A from an awkward silence to the most engaging part of our event. For the first time, people actually felt heard."
              avatar="https://res.cloudinary.com/dws3lnn4d/image/upload/v1718105160/pexels-emmy-e-1252107-2381069_ncpcqb.jpg"
              name="Ada"
              role="Youth Leader, Wuye"
            />
          </div>
          <div className={`transition-all duration-700 delay-200 ${storiesVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <Story
              quote="We used it at our campus town hall and finally got the tough questions we needed. Anonymity changed everything—highest participation we've ever seen."
              avatar="https://res.cloudinary.com/dws3lnn4d/image/upload/v1706346802/AjoVault%20App/pexels-christina-morillo-1181686_irzuti.jpg"
              name="Seyi"
              role="Campus Coordinator"
            />
          </div>
          <div className={`transition-all duration-700 delay-300 ${storiesVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <Story
              quote="The facilitator dashboard is incredibly clean and intuitive. But what impressed me most is how well it respects our cultural context and community values."
              avatar="https://res.cloudinary.com/dws3lnn4d/image/upload/v1719833077/IMG_2571_wsh2ef.jpg"
              name="Chidi"
              role="Community Organizer"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function HowItWorksSection() {
  const [howRef, howVisible] = useScrollAnimation({ threshold: 0.1 });

  return (
    <section id="how-it-works" className="py-12 md:py-16 bg-white overflow-hidden" ref={howRef}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className={`text-center mb-12 md:mb-16 transition-all duration-700 ${howVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <h3 className="text-xl md:text-2xl lg:text-3xl font-bold text-ink mb-2 font-['Space_Grotesk']">
            Simple to Start, Powerful in Practice
          </h3>
          <p className="text-sm md:text-base text-neutral-600 max-w-2xl mx-auto">
            Go from idea to engagement in under 3 minutes
          </p>
        </div>

        {/* Vertical Timeline */}
        <div className="relative max-w-4xl mx-auto">
          {/* Central Vertical Line - Desktop Only */}
          <div className="hidden lg:block absolute left-1/2 top-0 bottom-0 w-0.5 bg-primary/30 transform -translate-x-1/2" style={{ zIndex: 0 }} />

          {/* Numbered Badges on the Line - Desktop Only */}
          <div className="hidden lg:block">
            {/* Badge 1 - At start of Step 1 */}
            <div className="absolute left-1/2 transform -translate-x-1/2 w-10 h-10 md:w-12 md:h-12 bg-primary text-white rounded-full flex items-center justify-center text-lg md:text-xl font-bold shadow-md transition-all duration-300 hover:scale-110 hover:shadow-lg" style={{ top: '0', zIndex: 10 }}>
              1
            </div>
            {/* Badge 2 - At start of Step 2 (roughly 1/3 down) */}
            <div className="absolute left-1/2 transform -translate-x-1/2 w-10 h-10 md:w-12 md:h-12 bg-primary text-white rounded-full flex items-center justify-center text-lg md:text-xl font-bold shadow-md transition-all duration-300 hover:scale-110 hover:shadow-lg" style={{ top: 'calc(33.33% + 1rem)', zIndex: 10 }}>
              2
            </div>
            {/* Badge 3 - At start of Step 3 (roughly 2/3 down) */}
            <div className="absolute left-1/2 transform -translate-x-1/2 w-10 h-10 md:w-12 md:h-12 bg-primary text-white rounded-full flex items-center justify-center text-lg md:text-xl font-bold shadow-md transition-all duration-300 hover:scale-110 hover:shadow-lg" style={{ top: 'calc(66.66% + 2rem)', zIndex: 10 }}>
              3
            </div>
          </div>

          <div className="relative" style={{ zIndex: 1 }}>
            {/* Step 1 - Card on Left */}
            <div className={`relative mb-10 lg:mb-16 pt-0 lg:pt-0 transition-all duration-700 delay-100 ${howVisible ? 'opacity-100 translate-x-0' : 'opacity-0 lg:-translate-x-10'}`}>
              {/* Mobile Badge */}
              <div className="lg:hidden flex justify-center mb-4">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-primary text-white rounded-full flex items-center justify-center text-lg md:text-xl font-bold shadow-md transition-all duration-300 hover:scale-110 hover:shadow-lg">
                  1
                </div>
              </div>

              {/* Card */}
              <div className="lg:w-1/2 lg:pr-10">
                <div className="group bg-white rounded-xl shadow-md border border-neutral-100 p-5 md:p-6 hover:shadow-xl hover:border-primary/20 hover:-translate-y-1 transition-all duration-300 max-w-xs lg:ml-auto w-full cursor-pointer card-hover-lift">
                  {/* Icon */}
                  <div className="flex items-center justify-center w-12 h-12 bg-primary rounded-full mx-auto mb-4 shadow-sm group-hover:scale-110 transition-transform duration-300">
                    <i className="fa-solid fa-calendar-plus text-lg text-white" />
                  </div>

                  {/* Content */}
                  <h4 className="text-base md:text-lg font-bold text-ink mb-2 text-center font-['Space_Grotesk']">
                    Create Your Event in Seconds
                  </h4>
                  <p className="text-neutral-600 text-center leading-relaxed text-xs md:text-sm">
                    No credit card required. Set up your Q&amp;A session, customize your branding, add strategic prompts, and get a shareable link instantly.
                  </p>
                </div>
              </div>
            </div>

            {/* Step 2 - Card on Right */}
            <div className={`relative mb-10 lg:mb-16 transition-all duration-700 delay-300 ${howVisible ? 'opacity-100 translate-x-0' : 'opacity-0 lg:translate-x-10'}`}>
              {/* Mobile Badge */}
              <div className="lg:hidden flex justify-center mb-4">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-primary text-white rounded-full flex items-center justify-center text-lg md:text-xl font-bold shadow-md transition-all duration-300 hover:scale-110 hover:shadow-lg">
                  2
                </div>
              </div>

              {/* Card */}
              <div className="lg:w-1/2 lg:ml-auto lg:pl-10">
                <div className="group bg-white rounded-xl shadow-md border border-neutral-100 p-5 md:p-6 hover:shadow-xl hover:border-primary/20 hover:-translate-y-1 transition-all duration-300 max-w-xs w-full cursor-pointer card-hover-lift">
                  {/* Icon */}
                  <div className="flex items-center justify-center w-12 h-12 bg-primary rounded-full mx-auto mb-4 shadow-sm group-hover:scale-110 transition-transform duration-300">
                    <i className="fa-solid fa-comments text-lg text-white" />
                  </div>

                  {/* Content */}
                  <h4 className="text-base md:text-lg font-bold text-ink mb-2 text-center font-['Space_Grotesk']">
                    Share & Watch Engagement Soar
                  </h4>
                  <p className="text-neutral-600 text-center leading-relaxed text-xs md:text-sm">
                    One link, zero friction. Participants ask and upvote questions anonymously—no account creation, no downloads, no barriers to participation.
                  </p>
                </div>
              </div>
            </div>

            {/* Step 3 - Card on Left */}
            <div className={`relative transition-all duration-700 delay-500 ${howVisible ? 'opacity-100 translate-x-0' : 'opacity-0 lg:-translate-x-10'}`}>
              {/* Mobile Badge */}
              <div className="lg:hidden flex justify-center mb-4">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-primary text-white rounded-full flex items-center justify-center text-lg md:text-xl font-bold shadow-md transition-all duration-300 hover:scale-110 hover:shadow-lg">
                  3
                </div>
              </div>

              {/* Card */}
              <div className="lg:w-1/2 lg:pr-10">
                <div className="group bg-white rounded-xl shadow-md border border-neutral-100 p-5 md:p-6 hover:shadow-xl hover:border-primary/20 hover:-translate-y-1 transition-all duration-300 max-w-xs lg:ml-auto w-full cursor-pointer card-hover-lift">
                  {/* Icon */}
                  <div className="flex items-center justify-center w-12 h-12 bg-primary rounded-full mx-auto mb-4 shadow-sm group-hover:scale-110 transition-transform duration-300">
                    <i className="fa-solid fa-microphone text-lg text-white" />
                  </div>

                  {/* Content */}
                  <h4 className="text-base md:text-lg font-bold text-ink mb-2 text-center font-['Space_Grotesk']">
                    Facilitate Like a Pro
                  </h4>
                  <p className="text-neutral-600 text-center leading-relaxed text-xs md:text-sm">
                    See top questions ranked by community votes in real-time. Moderate with empathy, respond with confidence, and export insights for follow-up.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function WhySection() {
  const [whyRef, whyVisible] = useScrollAnimation({ threshold: 0.1 });

  return (
    <section id="why" className="py-12 md:py-16 bg-white" ref={whyRef}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <h3 className={`text-xl md:text-2xl lg:text-3xl font-bold text-center text-ink mb-10 font-['Space_Grotesk'] max-w-3xl mx-auto transition-all duration-700 ${whyVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          Everything You Need to Host Meaningful Conversations
        </h3>

        {/* Features Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
          {/* Feature 1: Strategic Question Seeding */}
          <div className={`group p-4 rounded-xl bg-gradient-to-br from-neutral-50 to-white border border-neutral-200 hover:border-primary/30 hover:shadow-md transition-all duration-500 delay-100 card-hover-lift ${whyVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <div className="w-10 h-10 mb-3 bg-gradient-to-br from-primary/20 to-primary/10 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <i className="fa-solid fa-bullseye text-base text-primary" />
            </div>
            <h4 className="text-sm md:text-base font-bold text-ink mb-2">
              Strategic Question Seeding
            </h4>
            <p className="text-neutral-600 leading-relaxed text-xs">
              Pre-populate thoughtful prompts to guide the conversation and ensure important topics get covered—even if the room is shy at first.
            </p>
          </div>

          {/* Feature 2: Privacy-First by Design */}
          <div className={`group p-4 rounded-xl bg-gradient-to-br from-neutral-50 to-white border border-neutral-200 hover:border-blue-500/30 hover:shadow-md transition-all duration-500 delay-200 card-hover-lift ${whyVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <div className="w-10 h-10 mb-3 bg-gradient-to-br from-blue-500/20 to-blue-500/10 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <i className="fa-solid fa-user-shield text-base text-blue-500" />
            </div>
            <h4 className="text-sm md:text-base font-bold text-ink mb-2">
              Privacy-First by Design
            </h4>
            <p className="text-neutral-600 leading-relaxed text-xs">
              Optional anonymity, robust moderation controls, and respectful boundaries. Build trust so people share what they actually think.
            </p>
          </div>

          {/* Feature 3: Actionable Insights & Analytics */}
          <div className={`group p-4 rounded-xl bg-gradient-to-br from-neutral-50 to-white border border-neutral-200 hover:border-green-500/30 hover:shadow-md transition-all duration-500 delay-300 card-hover-lift ${whyVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <div className="w-10 h-10 mb-3 bg-gradient-to-br from-green-500/20 to-green-500/10 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <i className="fa-solid fa-chart-line text-base text-green-500" />
            </div>
            <h4 className="text-sm md:text-base font-bold text-ink mb-2">
              Actionable Insights & Analytics
            </h4>
            <p className="text-neutral-600 leading-relaxed text-xs">
              Track participation patterns, identify trending themes, and export data to share with stakeholders. Turn feedback into action plans.
            </p>
          </div>

          {/* Feature 4: Complete White-Label Control */}
          <div className={`group p-4 rounded-xl bg-gradient-to-br from-neutral-50 to-white border border-neutral-200 hover:border-purple-500/30 hover:shadow-md transition-all duration-500 delay-[400ms] card-hover-lift ${whyVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <div className="w-10 h-10 mb-3 bg-gradient-to-br from-purple-500/20 to-purple-500/10 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <i className="fa-solid fa-sliders text-base text-purple-500" />
            </div>
            <h4 className="text-sm md:text-base font-bold text-ink mb-2">
              Complete White-Label Control
            </h4>
            <p className="text-neutral-600 leading-relaxed text-xs">
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
  const [ctaRef, ctaVisible] = useScrollAnimation({ threshold: 0.2 });

  return (
    <section id="cta" className="py-12 md:py-16 bg-gradient-to-br from-primary/10 via-white to-primary/10" aria-labelledby="cta-heading" ref={ctaRef}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`bg-gradient-to-br from-primary to-primary-dark rounded-2xl p-6 md:p-8 lg:p-10 text-center shadow-xl relative overflow-hidden transition-all duration-1000 ${ctaVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-10 scale-95'}`}>
          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 animate-float" style={{ animationDelay: '0s' }} />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2 animate-float" style={{ animationDelay: '1.5s' }} />

          <div className="relative z-10">
            <h3 id="cta-heading" className={`text-xl md:text-2xl lg:text-3xl font-bold text-white mb-4 font-['Space_Grotesk'] transition-all duration-700 delay-200 ${ctaVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
              Ready to Transform Your Next Q&amp;A Session?
            </h3>
            <p className={`text-sm md:text-base text-white/90 mb-6 max-w-2xl mx-auto leading-relaxed transition-all duration-700 delay-300 ${ctaVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
              Join organizers creating safer, more engaging conversations. Set up your first event free—no credit card required.
            </p>

            <div className={`flex flex-col sm:flex-row gap-3 justify-center items-center transition-all duration-700 delay-[400ms] ${ctaVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
              <button
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-white text-primary font-semibold rounded-lg hover:bg-neutral-50 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 text-sm border-0 cursor-pointer animate-pulse-glow"
                onClick={() => navigate("/signup")}
              >
                Start Free - Create Your Event
                <i className="fas fa-arrow-right text-xs" aria-hidden="true" />
              </button>
              <button
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-transparent text-white font-semibold rounded-lg border border-white hover:bg-white hover:text-primary transition-all duration-200 text-sm cursor-pointer"
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
    <footer className="bg-ink text-white py-10" role="contentinfo">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          {/* Brand Section */}
          <div className="md:col-span-1">
            <button
              className="inline-flex items-center gap-2 font-bold text-base text-white hover:opacity-80 transition-opacity bg-transparent border-0 cursor-pointer p-0 mb-3"
              onClick={() => navigate("/")}
            >
              <i className="fas fa-comments text-primary text-lg" aria-hidden="true" />
              <span className="font-['Space_Grotesk']">Ask Freely</span>
            </button>
            <p className="text-neutral-400 leading-relaxed text-xs">
              Built with communities. Powered by your stories.
            </p>
          </div>

          {/* Footer Links */}
          <div className="md:col-span-3 grid sm:grid-cols-3 gap-6">
            {/* Product Column */}
            <div>
              <h4 className="text-white font-semibold mb-3 text-sm">Product</h4>
              <div className="flex flex-col gap-2">
                <a href="#features" className="text-neutral-400 hover:text-primary transition-colors text-xs">
                  Features
                </a>
                <a href="#pricing" className="text-neutral-400 hover:text-primary transition-colors text-xs">
                  Pricing
                </a>
                <a href="#demo" className="text-neutral-400 hover:text-primary transition-colors text-xs">
                  Demo
                </a>
              </div>
            </div>

            {/* Community Column */}
            <div>
              <h4 className="text-white font-semibold mb-3 text-sm">Community</h4>
              <div className="flex flex-col gap-2">
                <a href="#stories" className="text-neutral-400 hover:text-primary transition-colors text-xs">
                  Stories
                </a>
                <a href="#events" className="text-neutral-400 hover:text-primary transition-colors text-xs">
                  Events
                </a>
                <a href="#guide" className="text-neutral-400 hover:text-primary transition-colors text-xs">
                  Community Guide
                </a>
              </div>
            </div>

            {/* Support Column */}
            <div>
              <h4 className="text-white font-semibold mb-3 text-sm">Support</h4>
              <div className="flex flex-col gap-2">
                <a href="#help" className="text-neutral-400 hover:text-primary transition-colors text-xs">
                  Help Center
                </a>
                <a href="#docs" className="text-neutral-400 hover:text-primary transition-colors text-xs">
                  Documentation
                </a>
                <a href="#status" className="text-neutral-400 hover:text-primary transition-colors text-xs">
                  Status
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="pt-6 border-t border-neutral-700 flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-neutral-400 text-xs">
            © {new Date().getFullYear()} Ask Freely
          </p>

          <div className="flex items-center gap-2 text-xs">
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
              <Route path="notifications" element={<NotificationsPage />} />
              <Route path="settings" element={<OrganizerSettings />} />
              <Route path="event/:eventId/setup" element={<EventSetup />} />
              <Route path="event/:eventId" element={<EventManagement />} />
              {/* Redirect /organizer to /organizer/dashboard */}
              <Route index element={<Navigate to="/organizer/dashboard" replace />} />
            </Route>
            {/* Super Admin Panel - Protected Routes */}
            <Route path="/admin" element={
              <AdminProtectedRoute>
                <AdminLayout />
              </AdminProtectedRoute>
            }>
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="events" element={<AdminEvents />} />
              <Route path="messages" element={<AdminMessages />} />
              <Route path="activity" element={<AdminActivity />} />
              {/* Redirect /admin to /admin/dashboard */}
              <Route index element={<Navigate to="/admin/dashboard" replace />} />
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