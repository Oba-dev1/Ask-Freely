import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ref, onValue, update } from "firebase/database";
import { database } from "../Firebase/config";
import { useAuth } from "../context/AuthContext";
import QuestionItem from "./QuestionItem";
import "./EventManagement.css";

function EventManagement() {
  const { eventId } = useParams();
  const [event, setEvent] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [filter, setFilter] = useState("all");
  const [mcEmail, setMcEmail] = useState("");
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const participantLink = `${window.location.origin}/event/${
    event?.slug || eventId
  }`;
  const mcLink = `${window.location.origin}/host/${eventId}`;

  useEffect(() => {
    if (!currentUser) {
      navigate("/login");
      return;
    }

    // Load event details
    const eventRef = ref(database, `events/${eventId}`);
    const unsubscribeEvent = onValue(eventRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        if (data.organizerId !== currentUser.uid) {
          navigate("/organizer/dashboard");
          return;
        }
        setEvent(data);
      }
    });

    // Load event questions
    const questionsRef = ref(database, `questions/${eventId}`);
    const unsubscribeQuestions = onValue(questionsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const questionsArray = Object.keys(data).map((key) => ({
          id: key,
          ...data[key],
        }));
        setQuestions(questionsArray);
      } else {
        setQuestions([]);
      }
    });

    return () => {
      unsubscribeEvent();
      unsubscribeQuestions();
    };
  }, [eventId, currentUser, navigate]);

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text);
    if (type === "participant") {
      setCopiedLink("participant");
    } else {
      setCopiedLink("mc");
    }
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const sendMCInvite = () => {
    // TODO: Implement email sending functionality
    alert(`Invite would be sent to: ${mcEmail}\n\nMC Link: ${mcLink}`);
    setShowInviteModal(false);
    setMcEmail("");
  };

  const toggleAnswered = async (questionId, currentStatus) => {
    try {
      const questionRef = ref(database, `questions/${eventId}/${questionId}`);
      await update(questionRef, { answered: !currentStatus });
    } catch (error) {
      console.error("Error updating question:", error);
    }
  };

  const deleteQuestion = async (questionId) => {
    if (window.confirm("Are you sure you want to delete this question?")) {
      try {
        const questionRef = ref(database, `questions/${eventId}/${questionId}`);
        await update(questionRef, { deleted: true });
      } catch (error) {
        console.error("Error deleting question:", error);
      }
    }
  };

  const getFilteredQuestions = () => {
    let filtered = questions.filter((q) => !q.deleted);

    if (filter === "answered") {
      filtered = filtered.filter((q) => q.answered);
    } else if (filter === "unanswered") {
      filtered = filtered.filter((q) => !q.answered);
    } else if (filter === "organizer") {
      filtered = filtered.filter((q) => q.source === "organizer");
    } else if (filter === "audience") {
      filtered = filtered.filter((q) => q.source === "audience");
    }

    return filtered.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  };

  if (!event) {
    return <div className="container">Loading...</div>;
  }

  const filteredQuestions = getFilteredQuestions();
  const audienceCount = questions.filter(
    (q) => q.source === "audience" && !q.deleted
  ).length;
  const organizerCount = questions.filter(
    (q) => q.source === "organizer" && !q.deleted
  ).length;

  return (
    <div className="page-wrapper">
      <div className="event-management-container">
        <button
          onClick={() => navigate("/organizer/dashboard")}
          className="back-btn"
        >
          ← Back to Dashboard
        </button>

        {/* Event header */}
        <section className="event-header-info">
          <h1>{event.title}</h1>
          <div className="event-header-meta">
            <span>
              <i className="far fa-calendar"></i>
              {event.date
                ? new Date(event.date).toLocaleDateString()
                : "Date TBA"}
            </span>
            {event.time && (
              <span>
                <i className="far fa-clock"></i>
                {event.time}
              </span>
            )}
            <span
              className={`status-pill ${
                event.status === "active" ? "active" : "draft"
              }`}
            >
              {event.status === "active" ? "Active" : "Draft"}
            </span>

            {/* Pause/Resume accepting questions */}
            <button
              className={`toggle-questions ${
                event.acceptingQuestions === false ? "off" : "on"
              }`}
              onClick={async () => {
                const next = event.acceptingQuestions === false ? true : false;
                await update(ref(database, `events/${eventId}`), {
                  acceptingQuestions: next,
                });
                setEvent((prev) => ({ ...prev, acceptingQuestions: next }));
              }}
              title={
                event.acceptingQuestions === false
                  ? "Resume accepting questions"
                  : "Pause accepting questions"
              }
            >
              {event.acceptingQuestions === false ? "Resume" : "Pause"}{" "}
              Questions
            </button>

            <span
              className={
                event.acceptingQuestions === false
                  ? "accepting-indicator paused"
                  : "accepting-indicator"
              }
            >
              {event.acceptingQuestions === false ? "Paused" : "Accepting"}
            </span>
          </div>
        </section>

        {/* Links */}
        <div className="links-card">
          <h2>
            <i className="fas fa-link"></i> Event Links
          </h2>

          <div className="link-item">
            <div className="link-header">
              <span className="link-label">
                <i className="fas fa-users"></i> Participant Link
              </span>
            </div>
            <div className="link-url-container">
              <code className="link-url">{participantLink}</code>
            </div>
            <div className="link-actions">
              <button
                onClick={() => copyToClipboard(participantLink, "participant")}
                className={`btn-copy ${
                  copiedLink === "participant" ? "copied" : ""
                }`}
                disabled={copiedLink === "participant"}
              >
                {copiedLink === "participant" ? "✓ Copied!" : "📋 Copy"}
              </button>
              <a
                className="btn-open"
                href={participantLink}
                target="_blank"
                rel="noreferrer"
              >
                Open
              </a>
            </div>
          </div>

          <div className="link-item">
            <div className="link-header">
              <span className="link-label">
                <i className="fas fa-microphone"></i> MC / Host Link
              </span>
            </div>
            <div className="link-url-container">
              <code className="link-url">{mcLink}</code>
            </div>
            <div className="link-actions">
              <button
                onClick={() => copyToClipboard(mcLink, "mc")}
                className={`btn-copy ${copiedLink === "mc" ? "copied" : ""}`}
                disabled={copiedLink === "mc"}
              >
                {copiedLink === "mc" ? "✓ Copied!" : "📋 Copy"}
              </button>
              <a
                className="btn-open"
                href={mcLink}
                target="_blank"
                rel="noreferrer"
              >
                Open
              </a>
              <button
                onClick={() => setShowInviteModal(true)}
                className="btn-invite"
              >
                <i className="fas fa-envelope"></i> Send Invite
              </button>
            </div>
          </div>
        </div>

        {/* Questions */}
        <div className="questions-dashboard">
          <div className="dashboard-header">
            <h2>
              <i className="far fa-comment-dots"></i> Questions
            </h2>
            <div className="stats-row">
              <div className="stat-badge">
                <span className="stat-number">
                  {questions.length - questions.filter((q) => q.deleted).length}
                </span>
                <span className="stat-text">Total</span>
              </div>
              <div className="stat-badge organizer">
                <span className="stat-number">{organizerCount}</span>
                <span className="stat-text"><i className="fas fa-star" /> Strategic</span>
              </div>
              <div className="stat-badge audience">
                <span className="stat-number">{audienceCount}</span>
                <span className="stat-text"><i className="fas fa-users" /> Audience</span>
              </div>
            </div>
          </div>

          {/* NEW: sticky filter row (uses your class name) */}
          <div className="filter-controls sticky">
            <button
              className={`filter-btn ${filter === "all" ? "active" : ""}`}
              onClick={() => setFilter("all")}
            >
              All
            </button>
            <button
              className={`filter-btn ${filter === "organizer" ? "active" : ""}`}
              onClick={() => setFilter("organizer")}
            >
              ⭐ Strategic
            </button>
            <button
              className={`filter-btn ${filter === "audience" ? "active" : ""}`}
              onClick={() => setFilter("audience")}
            >
              👥 Audience
            </button>
            <button
              className={`filter-btn ${filter === "answered" ? "active" : ""}`}
              onClick={() => setFilter("answered")}
            >
              Answered
            </button>
            <button
              className={`filter-btn ${
                filter === "unanswered" ? "active" : ""
              }`}
              onClick={() => setFilter("unanswered")}
            >
              Unanswered
            </button>
          </div>

          <div className="questions-list">
            {filteredQuestions.length === 0 ? (
              <div className="empty-state">
                <div className="empty-emoji">🤔</div>
                <h3>No questions yet</h3>
                <p>
                  Share your participant link to start collecting questions.
                </p>
              </div>
            ) : (
              filteredQuestions.map((question) => (
                <QuestionItem
                  key={question.id}
                  question={question}
                  onToggleAnswered={toggleAnswered}
                  onDelete={deleteQuestion}
                />
              ))
            )}
          </div>
        </div>

        {/* Invite Modal (unchanged) */}
        {showInviteModal && (
          <div
            className="modal-overlay"
            onClick={() => setShowInviteModal(false)}
          >
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h3>
                <i className="fas fa-paper-plane"></i> Invite MC/Host
              </h3>
              <p>Send an email invite with the MC access link</p>
              <div className="form-group">
                <label htmlFor="mcEmail">MC Email Address</label>
                <input
                  type="email"
                  id="mcEmail"
                  value={mcEmail}
                  onChange={(e) => setMcEmail(e.target.value)}
                  placeholder="mc@example.com"
                />
              </div>
              <div className="modal-actions">
                <button
                  onClick={() => setShowInviteModal(false)}
                  className="btn-cancel"
                >
                  Cancel
                </button>
                <button onClick={sendMCInvite} className="btn-primary">
                  Send Invite
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default EventManagement;
