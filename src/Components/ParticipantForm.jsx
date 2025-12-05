// src/Components/ParticipantForm.jsx
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ref,
  push,
  get,
  set,
  query,
  orderByChild,
  equalTo,
} from "firebase/database";
import { database } from "../Firebase/config"; // ← ensure lowercase folder
import ParticipantProgramView from "./ParticipantProgramView";
import "./ParticipantForm.css";

/**
 * Small utility: normalize strings → slug-safe form
 */
function toSlug(s = "") {
  return String(s)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/**
 * Resolve event by slug with fallback to events query.
 * Returns { eventId, event, questionsRef, error, loading }
 */
function useResolvedEventBySlug(slug) {
  const [eventId, setEventId] = useState(null);
  const [event, setEvent] = useState(null);
  const [questionsRef, setQuestionsRef] = useState(null);
  const [loading, setLoading] = useState(!!slug);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;

    async function run() {
      // Legacy/global mode (no slug in URL) — write to global pool
      if (!slug) {
        if (!alive) return;
        setEventId(null);
        setEvent(null);
        setQuestionsRef(ref(database, "questions"));
        setLoading(false);
        setError("");
        return;
      }

      setLoading(true);
      setError("");

      try {
        // 1) Try fast map: /slugs/{slug} -> eventId
        const mapSnap = await get(ref(database, `slugs/${slug}`));
        if (!alive) return;

        if (mapSnap.exists()) {
          const eid = mapSnap.val();
          setEventId(eid);
          setQuestionsRef(ref(database, `questions/${eid}`));

          // Load event doc
          const evSnap = await get(ref(database, `events/${eid}`));
          if (!alive) return;

          if (evSnap.exists()) {
            setEvent(evSnap.val());
            setError("");
          } else {
            setEvent(null);
            setError("This event link is invalid or has expired.");
          }

          setLoading(false);
          return;
        }

        // 2) Fallback: query events by slug
        const qRef = query(ref(database, "events"), orderByChild("slug"), equalTo(slug));
        const evQuerySnap = await get(qRef);
        if (!alive) return;

        if (evQuerySnap.exists()) {
          const firstKey = Object.keys(evQuerySnap.val())[0];
          setEventId(firstKey);
          setQuestionsRef(ref(database, `questions/${firstKey}`));
          setEvent(evQuerySnap.val()[firstKey]);

          // Heal missing mapping for future hits (non-fatal if it fails)
          try {
            await set(ref(database, `slugs/${slug}`), firstKey);
          } catch { /* noop */ }

          setError("");
          setLoading(false);
          return;
        }

        // 3) Not found either way
        setEventId(null);
        setEvent(null);
        setQuestionsRef(null);
        setError("This event link is invalid or has expired.");
        setLoading(false);
      } catch (err) {
        console.error("[ParticipantForm] resolve error:", err);
        if (!alive) return;
        setEventId(null);
        setEvent(null);
        setQuestionsRef(null);
        setError("Could not resolve event link. Please try again.");
        setLoading(false);
      }
    }

    run();
    return () => {
      alive = false;
    };
  }, [slug]);

  return { eventId, event, questionsRef, loading, error };
}

export default function ParticipantForm() {
  const { slug: routeSlug } = useParams(); // supports /p/:slug and /event/:slug
  const slug = routeSlug ? toSlug(routeSlug) : "";

  const {eventId, event, questionsRef, loading: resolving, error: resolveError } =
    useResolvedEventBySlug(slug);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    question: "",
    anonymous: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState({ type: "", text: "" }); // {type: 'info'|'error'|'success', text}

  // Computed guards
  const acceptingQuestions = useMemo(
    () => (event ? event.acceptingQuestions !== false : true),
    [event]
  );

  const eventIsLive = useMemo(() => {
    // If there's an event, only allow if not draft
    if (!event) return true;
    return (event.status || "active") !== "draft";
  }, [event]);

  // Change handlers
  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  }, []);

  // Validation
  const validate = useCallback(() => {
    if (!formData.question.trim()) {
      setNotice({ type: "error", text: "✗ Please enter a question." });
      return false;
    }
    if (!questionsRef) {
      setNotice({ type: "error", text: "✗ Event not ready. Please refresh and try again." });
      return false;
    }
    if (!acceptingQuestions) {
      setNotice({
        type: "error",
        text: "✗ This event is not accepting questions at the moment.",
      });
      return false;
    }
    if (!eventIsLive) {
      setNotice({
        type: "error",
        text: "✗ This event is not live yet.",
      });
      return false;
    }
    return true;
  }, [formData.question, questionsRef, acceptingQuestions, eventIsLive]);

  // Submit
  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      if (!validate()) return;

      setIsSubmitting(true);
      setNotice({ type: "info", text: "Submitting your question…" });

      try {
        const payload = {
          author:
            formData.anonymous || !formData.name.trim()
              ? "Anonymous"
              : formData.name.trim(),
          question: formData.question.trim(),
          source: "audience",           // consistent with filters
          anonymous: !!formData.anonymous,
          answered: false,
          timestamp: new Date().toISOString(),
          createdAt: Date.now(),        // numeric for `.indexOn` and rules
        };

        await push(questionsRef, payload);

        setNotice({ type: "success", text: "✓ Question submitted successfully!" });
        setFormData({ name: "", question: "", anonymous: false });

        // Clear success after a short delay (nice UX)
        const t = setTimeout(() => setNotice({ type: "", text: "" }), 3000);
        return () => clearTimeout(t);
      } catch (err) {
        console.error("[ParticipantForm] submit error:", err);
        setNotice({ type: "error", text: "✗ Error submitting question. Please try again." });
      } finally {
        setIsSubmitting(false);
      }
    },
    [formData, questionsRef, validate]
  );

  // Early return: resolving link
  if (resolving) {
    return (
      <div className="container">
        <p className="loading-text" role="status" aria-live="polite">
          Loading event…
        </p>
      </div>
    );
  }

  // Early return: bad slug
  if (slug && resolveError) {
    return (
      <div className="container">
        <Link to="/" className="back-button">← Back to Home</Link>
        <div className="form-card">
          <p className="message error" role="alert">{resolveError}</p>
        </div>
      </div>
    );
  }

  // Header: dynamic values
  const title = event?.title || "Ask Freely";
  const subtitle = event?.date
    ? `${event.date}${event?.time ? ` • ${event.time}` : ""}`
    : "Event Q&A";
  const tagline = "Ask Your Questions ✨";

  return (
    <div className="participant-page">
    <div className="container">
      <Link to="/" className="back-button">← Back to Home</Link>

      <header className="header">
        <h1>{resolving ? "Loading…" : title}</h1>
        <p className="subtitle">{subtitle}</p>
        <p className="tagline">{tagline}</p>
      </header>

      {/* Event Program */}
      {eventId && <ParticipantProgramView eventId={eventId} />}

      <div className="form-card">
        {/* Status banners */}
        {event && !eventIsLive && (
          <div className="message info" role="status" style={{ marginBottom: "1rem" }}>
            ⏳ This event isn’t live yet.
          </div>
        )}
        {event && !acceptingQuestions && (
          <div className="message info" role="status" style={{ marginBottom: "1rem" }}>
            🔒 This event is currently not accepting questions. Please check back later.
          </div>
        )}

        <p className="intro-text">
          Got questions for this session? Submit them here and the panel will address them during the event. 
        </p>

        <form onSubmit={handleSubmit} aria-busy={isSubmitting}>
          <div className="form-group">
            <label htmlFor="name">Your Name (Optional)</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Leave blank to remain anonymous"
              autoComplete="off"
              disabled={formData.anonymous || isSubmitting || !acceptingQuestions || !eventIsLive}
            />
          </div>

          <div className="form-group">
            <label htmlFor="question">Your Question *</label>
            <textarea
              id="question"
              name="question"
              value={formData.question}
              onChange={handleChange}
              rows="5"
              placeholder={
                acceptingQuestions && eventIsLive
                  ? "Type your question here..."
                  : "Event is not accepting questions right now."
              }
              required
              disabled={isSubmitting || !acceptingQuestions || !eventIsLive}
            />
          </div>

          <div className="checkbox-group">
            <input
              type="checkbox"
              id="anonymous"
              name="anonymous"
              checked={formData.anonymous}
              onChange={handleChange}
              disabled={isSubmitting || !acceptingQuestions || !eventIsLive}
            />
            <label htmlFor="anonymous">Submit anonymously</label>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting || !acceptingQuestions || !eventIsLive}
          >
            {isSubmitting ? "Submitting..." : "Submit Question"}
          </button>
        </form>

        {notice.text && (
          <div
            className={`message ${notice.type}`}
            role={notice.type === "error" ? "alert" : "status"}
            aria-live="polite"
            style={{ marginTop: "1rem" }}
          >
            {notice.text}
          </div>
        )}
      </div>
    </div>
    </div>
  );
}
