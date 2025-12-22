// src/Components/EventManagement.jsx
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ref, onValue, update } from "firebase/database";
import { database } from "../Firebase/config";
import { useAuth } from "../context/AuthContext";
import QuestionItem from "./QuestionItem";
import BrandingPreview from "./BrandingPreview";
import {
  exportToCSV,
  exportToJSON,
  exportToText,
  generateAnalytics,
} from "../utils/exportutils";
import "./EventManagement.css";

// Helper functions
function fmtPct(n) {
  if (n == null || isNaN(n)) return "0%";
  return `${Math.round(n)}%`;
}

function compactTimeLabel(first, last) {
  if (!first || !last || first === "N/A" || last === "N/A") return null;
  try {
    const t1 = new Date(first);
    const t2 = new Date(last);
    const toHHMM = (d) =>
      d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    return `Started ${toHHMM(t1)} • Last ${toHHMM(t2)}`;
  } catch {
    return null;
  }
}

// Shorten URL for mobile display
function shortenUrl(url) {
  if (!url) return "";
  try {
    const urlObj = new URL(url);
    // Return just the path + search (e.g., /p/event-slug or /host/123)
    return urlObj.pathname + urlObj.search;
  } catch {
    return url;
  }
}

function EventManagement() {
  // ---- Router & Auth ----
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  // ---- State ----
  const [event, setEvent] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [filter, setFilter] = useState("all");
  const [copiedLink, setCopiedLink] = useState("");
  const [saving, setSaving] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [analytics, setAnalytics] = useState(null);

  // Invite modal
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [mcEmail, setMcEmail] = useState("");

  // ---- Derived ----
  const isActive = event?.status === "published";
  const hasSlug = !!event?.slug;
  const accepting = event?.enableQuestionSubmission !== false; // default true if undefined
  const canShareParticipant = isActive && hasSlug;

  const participantLink = useMemo(() => {
    if (!canShareParticipant) return "";
    // pretty route
    return `${window.location.origin}/p/${event.slug}`;
  }, [canShareParticipant, event?.slug]);

  const mcLink = useMemo(
    () => `${window.location.origin}/host/${eventId}`,
    [eventId]
  );

  const eventTitle = event?.title || "Event";

  // ---- Actions (callbacks) ----
  const copyToClipboard = useCallback((text, type) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedLink(type);
    setTimeout(() => setCopiedLink(""), 1600);
  }, []);

  const handlePublish = useCallback(async () => {
    if (!event) return;
    try {
      setSaving(true);
      await update(ref(database, `events/${eventId}`), {
        status: "published",
        enableQuestionSubmission: event.enableQuestionSubmission !== false,
      });
    } finally {
      setSaving(false);
    }
  }, [event, eventId]);

  const handleUnpublish = useCallback(async () => {
    if (!event) return;
    try {
      setSaving(true);
      await update(ref(database, `events/${eventId}`), { status: "draft" });
    } finally {
      setSaving(false);
    }
  }, [event, eventId]);

  const toggleAccepting = useCallback(async () => {
    if (!event) return;
    try {
      setSaving(true);
      const next =
        event.enableQuestionSubmission === false ? true : !event.enableQuestionSubmission;
      await update(ref(database, `events/${eventId}`), {
        enableQuestionSubmission: next,
      });
    } finally {
      setSaving(false);
    }
  }, [event, eventId]);

  const toggleAnswered = useCallback(
    async (questionId, currentStatus) => {
      try {
        await update(ref(database, `questions/${eventId}/${questionId}`), {
          answered: !currentStatus,
        });
      } catch (err) {
        console.error("Error updating question:", err);
      }
    },
    [eventId]
  );

  const deleteQuestion = useCallback(
    async (questionId) => {
      if (!window.confirm("Delete this question?")) return;
      try {
        await update(ref(database, `questions/${eventId}/${questionId}`), {
          deleted: true,
        });
      } catch (err) {
        console.error("Error deleting question:", err);
      }
    },
    [eventId]
  );

  const sendMCInvite = useCallback(() => {
    if (!mcEmail.trim()) return;
    const subject = encodeURIComponent(`MC Access Link for: ${eventTitle}`);
    const body = encodeURIComponent(
      `Hi,\n\nYou're invited to host this session.\n\nMC/Host link: ${mcLink}\n\nWhat you'll have access to:\n• Event program with timeline and flow\n• Live questions from participants\n• Filters to manage questions\n• Mark items as completed to track progress\n\nTips:\n• Open the link on a stable connection\n• Review the program before the event starts\n• Use the program timeline to stay on track\n\nLooking forward to a great session!\n`
    );
    window.location.href = `mailto:${mcEmail}?subject=${subject}&body=${body}`;
    setShowInviteModal(false);
    setMcEmail("");
  }, [mcEmail, mcLink, eventTitle]);

  const handleExport = useCallback(
    (format) => {
      const all = [...questions].sort(
        (a, b) => (b.createdAt || 0) - (a.createdAt || 0)
      );
      if (format === "csv") exportToCSV(all);
      else if (format === "json") exportToJSON(all);
      else if (format === "txt") exportToText(all);
      setShowExportMenu(false);
    },
    [questions]
  );

  // ---- Data subscriptions ----
  useEffect(() => {
    if (!currentUser) {
      navigate("/login");
      return;
    }
    if (!eventId) return;

    const eventRef = ref(database, `events/${eventId}`);
    const unsubEvent = onValue(eventRef, (snap) => {
      const data = snap.val();
      if (!data) return;
      if (data.organizerId && data.organizerId !== currentUser.uid) {
        navigate("/organizer/dashboard");
        return;
      }
      setEvent(data);
    });

    const questionsRef = ref(database, `questions/${eventId}`);
    const unsubQs = onValue(questionsRef, (snap) => {
      const data = snap.val();
      if (!data) {
        setQuestions([]);
        setAnalytics(generateAnalytics([]));
        return;
      }
      const arr = Object.keys(data)
        .map((k) => ({ id: k, ...data[k] }))
        .filter((q) => !q.deleted)
        .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      setQuestions(arr);
      setAnalytics(generateAnalytics(arr));
    });

    return () => {
      unsubEvent();
      unsubQs();
    };
  }, [eventId, currentUser, navigate]);

  // Close invite modal on ESC
  useEffect(() => {
    if (!showInviteModal) return;
    const onKeyDown = (e) => e.key === "Escape" && setShowInviteModal(false);
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [showInviteModal]);

  // ---- Filtering ----
  const filteredQuestions = useMemo(() => {
    let list = [...questions];
    switch (filter) {
      case "answered":
        list = list.filter((q) => q.answered);
        break;
      case "unanswered":
        list = list.filter((q) => !q.answered);
        break;
      case "organizer":
        list = list.filter((q) => q.source === "organizer");
        break;
      case "audience":
        list = list.filter(
          (q) => q.source === "audience" || q.source === "anonymous"
        );
        break;
      default:
        break;
    }
    return list;
  }, [questions, filter]);

  // ---- Early loading state (after all hooks) ----
  if (!event) {
    return (
      <div className="container">
        <p>Loading event…</p>
      </div>
    );
  }

  // ---- UI ----
  return (
    <div className="container">
      <header className="header">
        <h1>
          {event.title}{" "}
          <span className={`pill ${isActive ? "pill-success" : "pill-muted"}`}>
            {isActive ? "Published" : "Draft"}
          </span>
        </h1>
        <p className="subtitle">
          {event.date ? new Date(event.date).toLocaleDateString() : "Date TBA"}
          {event.time ? ` • ${event.time}` : ""}
        </p>
      </header>

      {/* Event Control Cards Grid */}
      <div className="control-cards-grid">
        {/* Publish Status Card */}
        <div className={`control-card ${isActive ? 'control-card-success' : 'control-card-warning'}`}>
          <div className="control-card-icon">
            <i className={`fas ${isActive ? 'fa-check-circle' : 'fa-circle'}`}></i>
          </div>
          <div className="control-card-content">
            <h3 className="control-card-title">Event Status</h3>
            <p className="control-card-status">{isActive ? 'Published' : 'Draft'}</p>
            <p className="control-card-description">
              {isActive
                ? 'Your event is live and accessible to participants'
                : 'Event is hidden from participants'}
            </p>
          </div>
          <div className="control-card-action">
            {isActive ? (
              <button
                className="btn btn-control btn-secondary"
                onClick={handleUnpublish}
                disabled={saving}
              >
                <i className="fas fa-eye-slash"></i>
                {saving ? 'Hiding...' : 'Hide Event'}
              </button>
            ) : (
              <button
                className="btn btn-control btn-primary"
                onClick={handlePublish}
                disabled={saving || !hasSlug}
              >
                <i className="fas fa-rocket"></i>
                {saving ? 'Publishing...' : 'Publish Event'}
              </button>
            )}
          </div>
        </div>

        {/* Questions Status Card */}
        <div className={`control-card ${accepting ? 'control-card-success' : 'control-card-muted'}`}>
          <div className="control-card-icon">
            <i className={`fas ${accepting ? 'fa-inbox' : 'fa-pause-circle'}`}></i>
          </div>
          <div className="control-card-content">
            <h3 className="control-card-title">Question Submissions</h3>
            <p className="control-card-status">{accepting ? 'Accepting' : 'Paused'}</p>
            <p className="control-card-description">
              {accepting
                ? 'Participants can submit questions'
                : 'New questions are temporarily paused'}
            </p>
          </div>
          <div className="control-card-action">
            <button
              className="btn btn-control btn-outline"
              onClick={toggleAccepting}
              disabled={saving}
            >
              <i className={`fas ${accepting ? 'fa-pause' : 'fa-play'}`}></i>
              {accepting ? 'Pause Questions' : 'Resume Questions'}
            </button>
          </div>
        </div>
      </div>

      {/* Event Links Section */}
      <div className="section-header">
        <h2 className="section-title">
          <i className="fas fa-share-nodes"></i> Event Links
        </h2>
        <p className="section-description">Share these links to give access to participants and hosts</p>
      </div>

      <div className="link-cards-grid">
        {/* Participant Link Card */}
        <div className={`link-card ${!canShareParticipant ? 'link-card-disabled' : ''}`}>
          <div className="link-card-header">
            <div className="link-card-icon link-card-icon-primary">
              <i className="fas fa-users"></i>
            </div>
            <div>
              <h3 className="link-card-title">Participant Link</h3>
              <p className="link-card-subtitle">For attendees to submit questions</p>
            </div>
          </div>
          <div className="link-card-body">
            {canShareParticipant ? (
              <div className="link-display">
                <code className="link-code">{participantLink}</code>
              </div>
            ) : (
              <div className="link-disabled-message">
                <i className="fas fa-info-circle"></i>
                <span>
                  {hasSlug
                    ? "Publish your event to enable this link"
                    : "Add an event slug to generate a shareable link"}
                </span>
              </div>
            )}
          </div>
          <div className="link-card-footer">
            <button
              onClick={() => copyToClipboard(participantLink, "participant")}
              className="btn btn-link-action"
              disabled={!canShareParticipant}
            >
              {copiedLink === "participant" ? (
                <>
                  <i className="fas fa-check"></i> Copied!
                </>
              ) : (
                <>
                  <i className="far fa-copy"></i> Copy Link
                </>
              )}
            </button>
          </div>
        </div>

        {/* MC/Host Link Card */}
        <div className="link-card">
          <div className="link-card-header">
            <div className="link-card-icon link-card-icon-success">
              <i className="fas fa-microphone"></i>
            </div>
            <div>
              <h3 className="link-card-title">MC/Host Link</h3>
              <p className="link-card-subtitle">For event moderators and hosts</p>
            </div>
          </div>
          <div className="link-card-body">
            <div className="link-display">
              <code className="link-code">{mcLink}</code>
            </div>
          </div>
          <div className="link-card-footer">
            <button
              onClick={() => copyToClipboard(mcLink, "mc")}
              className="btn btn-link-action"
            >
              {copiedLink === "mc" ? (
                <>
                  <i className="fas fa-check"></i> Copied!
                </>
              ) : (
                <>
                  <i className="far fa-copy"></i> Copy Link
                </>
              )}
            </button>
            <button
              onClick={() => setShowInviteModal(true)}
              className="btn btn-link-action btn-link-action-secondary"
            >
              <i className="fas fa-envelope"></i> Send Invite
            </button>
          </div>
        </div>
      </div>

      {/* Branding Preview */}
      <BrandingPreview event={event} />

      {/* Questions */}
      <div className="questions-dashboard">
        <div className="dashboard-header">
          <h2>Questions</h2>
          <div className="export-dropdown">
            <button
              className="btn btn-export"
              onClick={() => setShowExportMenu((v) => !v)}
            >
              <i className="fas fa-download" aria-hidden="true" />
              Export
            </button>
            {showExportMenu && (
              <div className="export-menu">
                <button onClick={() => handleExport("csv")}>
                  <i className="fas fa-file-csv" aria-hidden="true" />
                  Export as CSV
                </button>
                <button onClick={() => handleExport("json")}>
                  <i className="fas fa-code" aria-hidden="true" />
                  Export as JSON
                </button>
                <button onClick={() => handleExport("txt")}>
                  <i className="fas fa-file-lines" aria-hidden="true" />
                  Export as Text
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Analytics Cards */}
        {analytics && (
          <section className="analytics-section">
            {/* Answered */}
            <div className="analytics-card">
              <div className="analytics-card-header">
                <span className="analytics-card-title">Answered</span>
                <div className="analytics-icon success">
                  <i className="fas fa-check-circle" aria-hidden="true"></i>
                </div>
              </div>
              <div className="analytics-value">
                {analytics.summary?.answered ?? 0}
              </div>
              <div className="analytics-detail">
                <span className="analytics-percentage">
                  {fmtPct(analytics.summary?.percentAnswered)}
                </span>{" "}
                of total
              </div>
            </div>

            {/* Unanswered */}
            <div className="analytics-card">
              <div className="analytics-card-header">
                <span className="analytics-card-title">Unanswered</span>
                <div className="analytics-icon warning">
                  <i className="fas fa-question-circle" aria-hidden="true"></i>
                </div>
              </div>
              <div className="analytics-value">
                {analytics.summary?.unanswered ?? 0}
              </div>
              <div className="analytics-detail">
                <span className="analytics-text">Remaining in queue</span>
              </div>
            </div>

            {/* Anonymous */}
            <div className="analytics-card">
              <div className="analytics-card-header">
                <span className="analytics-card-title">Anonymous</span>
                <div className="analytics-icon info">
                  <i className="fas fa-user-secret" aria-hidden="true"></i>
                </div>
              </div>
              <div className="analytics-value">
                {analytics.summary?.anonymous ?? 0}
              </div>
              <div className="analytics-detail">
                <span className="analytics-percentage">
                  {fmtPct(analytics.summary?.percentAnonymous)}
                </span>{" "}
                of submissions
              </div>
            </div>

            {/* Session Duration */}
            <div className="analytics-card">
              <div className="analytics-card-header">
                <span className="analytics-card-title">Session Duration</span>
                <div className="analytics-icon primary">
                  <i className="fas fa-clock" aria-hidden="true"></i>
                </div>
              </div>
              <div className="analytics-value" style={{ fontSize: "2rem" }}>
                {analytics.timeline?.duration || "N/A"}
              </div>
              {compactTimeLabel(
                analytics.timeline?.firstQuestion,
                analytics.timeline?.lastQuestion
              ) && (
                <div className="analytics-detail">
                  {compactTimeLabel(
                    analytics.timeline?.firstQuestion,
                    analytics.timeline?.lastQuestion
                  )}
                </div>
              )}
            </div>
          </section>
        )}

        <div className="filter-controls">
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
            <i className="fas fa-star" aria-hidden="true"></i> Strategic
          </button>
          <button
            className={`filter-btn ${filter === "audience" ? "active" : ""}`}
            onClick={() => setFilter("audience")}
          >
            <i className="fas fa-users" aria-hidden="true"></i> Audience
          </button>
          <button
            className={`filter-btn ${filter === "answered" ? "active" : ""}`}
            onClick={() => setFilter("answered")}
          >
            Answered
          </button>
          <button
            className={`filter-btn ${filter === "unanswered" ? "active" : ""}`}
            onClick={() => setFilter("unanswered")}
          >
            Unanswered
          </button>
        </div>

        <div className="questions-list">
          {filteredQuestions.length === 0 ? (
            <p className="empty-state">No questions to display.</p>
          ) : (
            filteredQuestions.map((q) => (
              <QuestionItem
                key={q.id}
                question={q}
                onToggleAnswered={toggleAnswered}
                onDelete={deleteQuestion}
              />
            ))
          )}
        </div>
      </div>

      {/* Invite modal */}
      {showInviteModal && (
        <div className="modal-overlay" onClick={() => setShowInviteModal(false)}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="invite-title"
          >
            <h3 id="invite-title">
              <i className="fas fa-paper-plane" aria-hidden="true"></i> Invite MC/Host
            </h3>
            <p>We’ll open your email client with a pre-filled message containing the MC link.</p>

            <div className="form-group">
              <label htmlFor="mcEmail">MC Email Address</label>
              <input
                type="email"
                id="mcEmail"
                value={mcEmail}
                onChange={(e) => setMcEmail(e.target.value)}
                placeholder="mc@example.com"
                autoFocus
              />
            </div>

            <div className="modal-actions">
              <button onClick={() => setShowInviteModal(false)} className="btn btn-cancel">
                Cancel
              </button>
              <button
                onClick={sendMCInvite}
                className="btn btn-primary"
                disabled={!mcEmail.trim()}
              >
                Send Invite
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default EventManagement;
