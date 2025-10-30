import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";

// Existing pages (current structure)
import ParticipantForm from "./Components/ParticipantForm";
import HostDashboard from "./Components/HostDashboard";
// New pages (make sure these files exist under ./Components with this exact casing)
import Login from "./Components/Login";
import Signup from "./Components/Signup";
import OrganizerDashboard from "./Components/OrganizerDashboard";
import CreateEvent from "./Components/CreateEvent";
import "./App.css";

// These existed inline before; keeping them as components here
// If you moved them out, replace with imports from ./Components/...
function HostHome() {
  return (
    <div className="container home-container">
      <header className="header">
        <h1>Ask Freely</h1>
        <p className="subtitle">Singles Programme • October 28, 2025</p>
        <p className="tagline">Question & Answer System ✨</p>
      </header>

      <div className="home-card">
        <h2>Welcome!</h2>
        <p className="home-text">
          This is the Question & Answer System platform for our Beyond the Vibes Singles Programme.
          Choose your role below to get started.
        </p>

        <div className="home-buttons">
          <Link to="/host/response" className="home-btn host-btn">
            <div className="btn-icon">🎤</div>
            <div className="btn-text">
              <h3>I'm the Host/MC</h3>
              <p>View and manage questions</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}

function ParticipantHome() {
  return (
    <div className="container home-container">
      <header className="header">
        <h1>Ask Freely</h1>
        <p className="subtitle">Singles Programme • October 28, 2025</p>
        <p className="tagline">Q&A System ✨</p>
      </header>

      <div className="home-card">
        <h2>Welcome!</h2>
        <p className="home-text">
          This is the Question & Answer platform we'll be using for our Beyond the Vibes Singles Programme.
          Click on the box below to get started.
        </p>

        <div className="home-buttons">
          <Link to="/question" className="home-btn participant-btn">
            <div className="btn-icon">🙋‍♂</div>
            <div className="btn-text">
              <h3>I'm a Participant</h3>
              <p>Submit your questions</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}

// New landing that generalizes the app (Ask Freely as a platform)
function Home() {
  return (
    <div className="container home-container">
      <header className="header">
        <h1>Beyond the Vibes</h1>
        <p className="subtitle">Singles Programme • October 28, 2025</p>
        <p className="tagline">Q&A System ✨</p>
      </header>

      <div className="home-card">
        <h2>Welcome!</h2>
        <p className="home-text">
          This is the Q&amp;A platform for our Beyond the Vibes Singles Programme.
          Choose your role below to get started.
        </p>

        <div className="home-buttons">
          <Link to="/participate" className="home-btn participant-btn">
            <div className="btn-icon">👥</div>
            <div className="btn-text">
              <h3>I'm a Participant</h3>
              <p>Submit your questions</p>
            </div>
          </Link>

          {/* Direct host dashboard (keeps /host/response too for backward compatibility) */}
          <Link to="/host" className="home-btn host-btn">
            <div className="btn-icon">🎤</div>
            <div className="btn-text">
              <h3>I'm the Host/MC</h3>
              <p>View and manage questions</p>
            </div>
          </Link>

          <Link to="/login" className="home-btn organizer-btn">
            <div className="btn-icon">🎯</div>
            <div className="btn-text">
              <h3>I'm an Organizer</h3>
              <p>Create and manage events</p>
            </div>
          </Link>
        </div>

        <div className="home-footer">
          <p>
            New organizer? <Link to="/signup">Sign up here</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="app">
          <Routes>
            {/* New platform landing */}
            <Route path="/" element={<Home />} />

            {/* Keep old participant landing and route working */}
            <Route path="/question" element={<ParticipantForm />} />
            <Route path="/participate" element={<ParticipantForm />} />

            {/* Old host landing preserved; new direct host route to dashboard */}
            <Route path="/host" element={<HostDashboard />} />
            <Route path="/host/response" element={<HostDashboard />} />
            <Route path="/host/home" element={<HostHome />} />

            {/* Original participant home preserved, if you still want it reachable */}
            <Route path="/participant/home" element={<ParticipantHome />} />

            {/* Organizer + Auth */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/organizer/dashboard" element={<OrganizerDashboard />} />
            <Route path="/organizer/create-event" element={<CreateEvent />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
