// src/Components/ParticipantForm.jsx
import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ref, push, serverTimestamp, get } from "firebase/database";
import { database } from "../Firebase/config";
import "./ParticipantForm.css";

function ParticipantForm() {
  const { slug } = useParams(); // present on /p/:slug, undefined on /participate

  const [formData, setFormData] = useState({
    name: "",
    question: "",
    anonymous: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const [questionsRef, setQuestionsRef] = useState(null);
  const [eventId, setEventId] = useState(null);
  const [event, setEvent] = useState(null);

  const [resolving, setResolving] = useState(!!slug);
  const [resolveError, setResolveError] = useState("");
  const [eventLoading, setEventLoading] = useState(false);

  // 1) Resolve /p/:slug → eventId (or use legacy global pool)
  useEffect(() => {
    let active = true;

    async function resolveSlug() {
      if (!slug) {
        // Legacy global pool
        setQuestionsRef(ref(database, "questions"));
        setResolving(false);
        return;
      }
      try {
        setResolving(true);
        setResolveError("");
        const snap = await get(ref(database, `slugs/${slug}`));
        if (!active) return;
        if (snap.exists()) {
          const eid = snap.val();
          setEventId(eid);
          setQuestionsRef(ref(database, `questions/${eid}`));
        } else {
          setResolveError("Invalid or expired event link.");
        }
      } catch {
        if (active) setResolveError("Could not resolve event link. Please try again.");
      } finally {
        if (active) setResolving(false);
      }
    }

    resolveSlug();
    return () => {
      active = false;
    };
  }, [slug]);

  // 2) Fetch events/{eventId} once we have it
  useEffect(() => {
    let active = true;
    async function loadEvent() {
      if (!eventId) return;
      try {
        setEventLoading(true);
        const snap = await get(ref(database, `events/${eventId}`));
        if (!active) return;
        setEvent(snap.exists() ? snap.val() : null);
      } finally {
        if (active) setEventLoading(false);
      }
    }
    loadEvent();
    return () => {
      active = false;
    };
  }, [eventId]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.question.trim()) {
      setMessage({ type: "error", text: "✗ Please enter a question." });
      return;
    }
    if (!questionsRef) {
      setMessage({ type: "error", text: "✗ Event not ready. Please refresh and try again." });
      return;
    }

    setIsSubmitting(true);
    setMessage({ type: "info", text: "Submitting your question…" });

    try {
      const newQuestion = {
        author:
          formData.anonymous || !formData.name.trim()
            ? "Anonymous"
            : formData.name.trim(),
        question: formData.question.trim(),
        source: formData.anonymous ? "anonymous" : "audience",
        answered: false,
        timestamp: new Date().toISOString(),
        createdAt: serverTimestamp(),
      };

      await push(questionsRef, newQuestion);

      setMessage({ type: "success", text: "✓ Question submitted successfully!" });
      setFormData({ name: "", question: "", anonymous: false });
      setTimeout(() => setMessage({ type: "", text: "" }), 3000);
    } catch (error) {
      console.error("Error submitting question:", error);
      setMessage({
        type: "error",
        text: "✗ Error submitting question. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Slug flow: loading / error
  if (resolving) {
    return (
      <div className="container">
        <p className="loading-text">Loading event…</p>
      </div>
    );
  }
  if (slug && resolveError) {
    return (
      <div className="container">
        <Link to="/" className="back-button">← Back to Home</Link>
        <div className="form-card">
          <p className="message error">{resolveError}</p>
        </div>
      </div>
    );
  }

  // Header values (dynamic if event available)
  const title = event?.title || "Beyond the Vibes";
  const subtitle =
    event?.date
      ? `${event.date}${event?.time ? ` • ${event.time}` : ""}`
      : "Singles Programme • October 28, 2025";
  const tagline = "Ask Your Questions ✨";

  return (
    <div className="container">
      <Link to="/" className="back-button">← Back to Home</Link>

      <header className="header">
        <h1>{eventLoading ? "Loading…" : title}</h1>
        <p className="subtitle">{subtitle}</p>
        <p className="tagline">{tagline}</p>
      </header>

      <div className="form-card">
        <p className="intro-text">
          Got questions about friendships, relationships, boundaries, or
          marriage? Submit them here and our panel will address them during the
          session! 🔥
        </p>

        <form onSubmit={handleSubmit}>
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
              disabled={formData.anonymous}
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
              placeholder="Type your question here..."
              required
            />
          </div>

          <div className="checkbox-group">
            <input
              type="checkbox"
              id="anonymous"
              name="anonymous"
              checked={formData.anonymous}
              onChange={handleChange}
            />
            <label htmlFor="anonymous">Submit anonymously</label>
          </div>

          <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Submit Question"}
          </button>
        </form>

        {message.text && (
          <div className={`message ${message.type}`}>{message.text}</div>
        )}
      </div>
    </div>
  );
}

export default ParticipantForm;
