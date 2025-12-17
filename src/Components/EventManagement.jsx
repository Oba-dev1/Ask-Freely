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
  const isActive = event?.status === "active";
  const hasSlug = !!event?.slug;
  const accepting = event?.acceptingQuestions !== false; // default true if undefined
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
        status: "active",
        acceptingQuestions: event.acceptingQuestions !== false,
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
        event.acceptingQuestions === false ? true : !event.acceptingQuestions;
      await update(ref(database, `events/${eventId}`), {
        acceptingQuestions: next,
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

  const audienceCount = questions.filter(
    (q) => q.source === "audience" || q.source === "anonymous"
  ).length;
  const organizerCount = questions.filter(
    (q) => q.source === "organizer"
  ).length;

  // ---- UI ----
  return (
    <div className="container">
      <div className="event-header-section">
        <button
          onClick={() => navigate("/organizer/dashboard")}
          className="back-btn-simple"
        >
          ← Back to Dashboard
        </button>
      </div>

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

      {/* Controls */}
      <div className="controls-card">
        <h2 className="section-title">
          <i className="fas fa-sliders-h" aria-hidden="true"></i> Event Controls
        </h2>

        <div className="controls-row">
          {isActive ? (
            <button
              className="btn btn-secondary"
              onClick={handleUnpublish}
              disabled={saving}
              title="Hide the event and stop showing a public participant link"
            >
              {saving ? "Unpublishing…" : "Unpublish"}
            </button>
          ) : (
            <button
              className="btn btn-primary"
              onClick={handlePublish}
              disabled={saving || !hasSlug}
              title={hasSlug ? "Make event public and shareable" : "Add a slug to publish"}
            >
              {saving ? "Publishing…" : "Publish"}
            </button>
          )}

          <button
            className="btn btn-outline"
            onClick={toggleAccepting}
            disabled={saving}
            title="Allow or pause new questions from participants"
          >
            {accepting ? "Pause Questions" : "Resume Questions"}
          </button>
        </div>

        <div className="chips-row">
          <span className={`chip ${isActive ? "chip-success" : "chip-muted"}`}>
            <i className="fas fa-eye" aria-hidden="true"></i>{" "}
            {isActive ? "Public" : "Hidden"}
          </span>
          <span className={`chip ${accepting ? "chip-success" : "chip-warn"}`}>
            <i className="fas fa-inbox" aria-hidden="true"></i>{" "}
            {accepting ? "Accepting Questions" : "Intake Paused"}
          </span>
          {!hasSlug && (
            <span className="chip chip-warn">
              <i className="fas fa-link-slash" aria-hidden="true"></i> No slug set
            </span>
          )}
        </div>
      </div>

      {/* Event Links */}
      <div className="links-card">
        <h2 className="section-title">
          <i className="fas fa-link" aria-hidden="true"></i> Event Links
        </h2>

        {/* Participant link */}
        <div className={`link-item ${canShareParticipant ? "" : "is-disabled"}`}>
          <div className="link-info">
            <span className="link-label">
              <i className="fas fa-users" aria-hidden="true"></i> Participant Link
            </span>
            {canShareParticipant ? (
              <code className="link-url">{participantLink}</code>
            ) : (
              <div className="link-url link-url--muted">
                {hasSlug
                  ? "Event is not published yet. Publish to enable this link."
                  : "Add an event slug to generate a shareable link."}
              </div>
            )}
          </div>
          <button
            onClick={() => copyToClipboard(participantLink, "participant")}
            className="btn btn-copy"
            disabled={!canShareParticipant}
            title={canShareParticipant ? "Copy participant link" : "Participant link disabled"}
          >
            {copiedLink === "participant" ? (
              <>
                <i className="fas fa-check" aria-hidden="true"></i> Copied!
              </>
            ) : (
              <>
                <i className="far fa-copy" aria-hidden="true"></i> Copy
              </>
            )}
          </button>
        </div>

        {/* MC/Host link */}
        <div className="link-item">
          <div className="link-info">
            <span className="link-label">
              <i className="fas fa-microphone" aria-hidden="true"></i> MC/Host Link
            </span>
            <code className="link-url">{mcLink}</code>
          </div>
          <div className="link-actions">
            <button
              onClick={() => copyToClipboard(mcLink, "mc")}
              className="btn btn-copy"
              title="Copy MC link"
            >
              {copiedLink === "mc" ? (
                <>
                  <i className="fas fa-check" aria-hidden="true"></i> Copied!
                </>
              ) : (
                <>
                  <i className="far fa-copy" aria-hidden="true"></i> Copy
                </>
              )}
            </button>
            <button
              onClick={() => setShowInviteModal(true)}
              className="btn btn-secondary"
              title="Email invite to MC/Host"
            >
              <i className="fas fa-envelope" aria-hidden="true"></i> Send Invite
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
          <div className="header-actions">
            <div className="stats-row">
              <div className="stat-badge">
                <span className="stat-number">{questions.length}</span>
                <span className="stat-text">Total</span>
              </div>
              <div className="stat-badge organizer">
                <span className="stat-number">{organizerCount}</span>
                <span className="stat-text">Strategic</span>
              </div>
              <div className="stat-badge audience">
                <span className="stat-number">{audienceCount}</span>
                <span className="stat-text">Audience</span>
              </div>
            </div>
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
              <div className="analytics-detail">Remaining in queue</div>
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
