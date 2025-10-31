import React from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ParticipantForm from './Components/ParticipantForm';
import HostDashboard from './Components/HostDashboard';
import Login from './Components/Login';
import Signup from './Components/Signup';
import OrganizerDashboard from './Components/OrganizerDashboard';
import CreateEvent from './Components/CreateEvent';
import EventManagement from './Components/EventManagement';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="app">
          <Routes>
            {/* Landing Page */}
            <Route path="/" element={<LandingPage />} />

            {/* Participant Routes */}
            <Route path="/participate" element={<ParticipantForm />} />
            <Route path="/question" element={<ParticipantForm />} />

            {/* Host/MC Routes */}
            <Route path="/host" element={<HostDashboard />} />
            <Route path="/host/:eventId" element={<HostDashboard />} />
            <Route path="/response" element={<HostDashboard />} />

            {/* Organizer Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/organizer/dashboard" element={<OrganizerDashboard />} />
            <Route path="/organizer/create-event" element={<CreateEvent />} />
            <Route path="/organizer/event/:eventId" element={<EventManagement />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="landing-page">
      {/* Navigation */}
      <nav className="navbar">
        <div className="nav-container">
          <div className="logo">
            <span className="logo-icon">💬</span>
            <span className="logo-text">Ask Freely</span>
          </div>
          <div className="nav-links">
            <button onClick={() => navigate('/login')} className="nav-link">
              Sign In
            </button>
            <button onClick={() => navigate('/signup')} className="btn-primary-nav">
              Get Started Free
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-container">
          <div className="hero-badge">
            <span className="badge-dot"></span>
            <span>Trusted by 100+ organizations</span>
          </div>
          
          <h1 className="hero-title">
            Real-Time Q&A for
            <span className="gradient-text"> Engaging Events</span>
          </h1>
          
          <p className="hero-subtitle">
            Empower your audience to ask questions freely. Organize, prioritize, and manage Q&A sessions 
            like a pro. Perfect for churches, conferences, town halls, and corporate events.
          </p>

          <div className="hero-cta">
            <button onClick={() => navigate('/signup')} className="btn-hero-primary">
              Start Free Today
              <span className="btn-arrow">→</span>
            </button>
            <button onClick={() => navigate('/participate')} className="btn-hero-secondary">
              View Demo
            </button>
          </div>

          <div className="hero-stats">
            <div className="stat">
              <div className="stat-number">10K+</div>
              <div className="stat-label">Questions Managed</div>
            </div>
            <div className="stat">
              <div className="stat-number">500+</div>
              <div className="stat-label">Events Hosted</div>
            </div>
            <div className="stat">
              <div className="stat-number">98%</div>
              <div className="stat-label">Satisfaction Rate</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="features-container">
          <div className="section-header">
            <h2 className="section-title">Everything you need for seamless Q&A</h2>
            <p className="section-subtitle">Powerful features built for organizers, MCs, and participants</p>
          </div>

          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🎯</div>
              <h3>Strategic Questions</h3>
              <p>Pre-load questions to guide discussions and ensure key topics are covered.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">👥</div>
              <h3>Anonymous Submissions</h3>
              <p>Let participants ask freely without fear. Build psychological safety.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">⚡</div>
              <h3>Real-Time Updates</h3>
              <p>Questions appear instantly. No refresh needed. Keep the flow going.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">📊</div>
              <h3>Smart Analytics</h3>
              <p>Track engagement, measure participation, and export insights.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🎤</div>
              <h3>MC Dashboard</h3>
              <p>Beautiful interface for hosts to manage questions with source badges.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">📱</div>
              <h3>Mobile Friendly</h3>
              <p>Works perfectly on any device. Participants can submit from anywhere.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="how-it-works">
        <div className="how-container">
          <h2 className="section-title">How it works</h2>
          <p className="section-subtitle">Get started in 3 simple steps</p>

          <div className="steps-grid">
            <div className="step">
              <div className="step-number">1</div>
              <h3>Create Your Event</h3>
              <p>Sign up, create an event, and pre-load strategic questions in minutes.</p>
            </div>

            <div className="step">
              <div className="step-number">2</div>
              <h3>Share the Link</h3>
              <p>Send the participant link to your audience. They submit questions instantly.</p>
            </div>

            <div className="step">
              <div className="step-number">3</div>
              <h3>Manage Live</h3>
              <p>Your MC views all questions, filters by source, and marks as answered.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-container">
          <h2 className="cta-title">Ready to transform your events?</h2>
          <p className="cta-subtitle">Join hundreds of organizations creating better audience experiences</p>
          <button onClick={() => navigate('/signup')} className="btn-cta">
            Get Started Free
            <span className="btn-arrow">→</span>
          </button>
          <p className="cta-note">No credit card required • Free forever plan available</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-container">
          <div className="footer-brand">
            <div className="logo">
              <span className="logo-icon">💬</span>
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

export default App;