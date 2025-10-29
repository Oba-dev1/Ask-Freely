import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import ParticipantForm from './Components/ParticipantForm';
import HostDashboard from './Components/HostDashboard';
import './App.css';

function App() {
  return (
    <Router>
      <div className="app">
        <Routes>
          <Route path="/" element={<ParticipantHome />} />
          <Route path="/question" element={<ParticipantForm />} />
          <Route path="/host" element={<HostHome />} />
          <Route path="/host/response" element={<HostDashboard />} />
        </Routes>
      </div>
    </Router>
  );
}

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

export default App;