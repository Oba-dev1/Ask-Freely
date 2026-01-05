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
import { database } from "../Firebase/config";
import ParticipantProgramView from "./ParticipantProgramView";
import BrandedEventHeader from "./BrandedEventHeader";
import { validateQuestion, sanitizeText } from "../utils/validation";

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
  const [lastSubmitTime, setLastSubmitTime] = useState(null);

  // Rate limiting constants
  const RATE_LIMIT_COOLDOWN = 30000; // 30 seconds between submissions

  // Computed guards - check both field names for compatibility
  const acceptingQuestions = useMemo(
    () => {
      if (!event) return true;
      // Check enableQuestionSubmission (newer) or acceptingQuestions (legacy)
      if (event.enableQuestionSubmission !== undefined) {
        return event.enableQuestionSubmission === true;
      }
      return event.acceptingQuestions !== false;
    },
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

      // Rate limiting check
      const now = Date.now();
      if (lastSubmitTime && now - lastSubmitTime < RATE_LIMIT_COOLDOWN) {
        const waitSeconds = Math.ceil((RATE_LIMIT_COOLDOWN - (now - lastSubmitTime)) / 1000);
        setNotice({
          type: "error",
          text: `✗ Please wait ${waitSeconds} second${waitSeconds > 1 ? 's' : ''} before submitting another question.`
        });
        return;
      }

      setIsSubmitting(true);
      setNotice({ type: "info", text: "Submitting your question…" });

      try {
        // Validate and sanitize question text
        const questionValidation = validateQuestion(formData.question, 1000);
        if (!questionValidation.valid) {
          setNotice({ type: "error", text: `✗ ${questionValidation.error}` });
          setIsSubmitting(false);
          return;
        }

        // Sanitize author name
        const sanitizedName = formData.name ? sanitizeText(formData.name.trim(), 100) : "";

        const payload = {
          author:
            formData.anonymous || !sanitizedName
              ? "Anonymous"
              : sanitizedName,
          question: questionValidation.sanitized,
          source: "audience",           // consistent with filters
          anonymous: !!formData.anonymous,
          answered: false,
          timestamp: new Date().toISOString(),
          createdAt: Date.now(),        // numeric for `.indexOn` and rules
        };

        await push(questionsRef, payload);

        // Update last submit time after successful submission
        setLastSubmitTime(Date.now());

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
    [formData, questionsRef, validate, lastSubmitTime, RATE_LIMIT_COOLDOWN]
  );

  // Get brand color for dynamic styling
  const brandColor = event?.branding?.primaryColor || '#FF6B35';

  // Early return: resolving link
  if (resolving) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-[760px] mx-auto pt-24 px-6 pb-12 md:pt-24 md:px-6 sm:pt-20 sm:px-4 sm:pb-10">
          <p className="text-neutral-500 text-center py-16" role="status" aria-live="polite">
            Loading event…
          </p>
        </div>
      </div>
    );
  }

  // Early return: bad slug
  if (slug && resolveError) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-[760px] mx-auto pt-24 px-6 pb-12 md:pt-24 md:px-6 sm:pt-20 sm:px-4 sm:pb-10">
          <Link
            to="/"
            className="inline-block mb-4 text-neutral-500 no-underline border border-black/[0.08] bg-transparent px-3.5 py-2 rounded-[10px] transition-all hover:text-neutral-700 hover:border-primary/40"
          >
            ← Back to Home
          </Link>
          <div className="bg-white border border-black/[0.08] rounded-[18px] p-7 shadow-[0_4px_16px_rgba(0,0,0,0.08)]">
            <p
              className="mt-4 p-3 py-3.5 rounded-xl text-center font-bold animate-slideDown border bg-red-500/10 border-red-500/25 text-red-600"
              role="alert"
            >
              {resolveError}
            </p>
          </div>
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
    <div className="min-h-screen bg-white" style={{ '--brand-color': brandColor }}>
      <div className="max-w-[760px] mx-auto pt-24 px-6 pb-12 md:pt-20 md:px-5 sm:pt-16 sm:px-4 sm:pb-8">
        <div className="flex justify-center mb-5 sm:mb-4">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-neutral-500 no-underline border border-black/[0.08] bg-transparent px-3.5 py-2 sm:px-3 sm:py-1.5 rounded-[10px] text-[0.9rem] sm:text-[0.85rem] transition-all hover:text-neutral-700 hover:border-primary/40"
          >
            <i className="fas fa-arrow-left text-[0.75rem]"></i> Back to Home
          </Link>
        </div>

        {/* Branded Header */}
        {event ? (
          <BrandedEventHeader event={event} />
        ) : (
          <header className="text-center mb-7 sm:mb-5">
            <h1 className="text-neutral-900 text-[clamp(1.4rem,2.5vw,2rem)] m-0 mb-2 font-bold">
              {resolving ? "Loading…" : title}
            </h1>
            <p className="text-neutral-500 my-0.5 text-[0.95rem] sm:text-[0.9rem]">{subtitle}</p>
            <p className="text-neutral-500 my-0.5 text-[0.95rem] sm:text-[0.9rem]">{tagline}</p>
          </header>
        )}

        {/* Event Program */}
        {eventId && <ParticipantProgramView eventId={eventId} />}

        <div className="bg-white border border-black/[0.08] rounded-[18px] sm:rounded-xl p-7 md:p-6 sm:p-5 shadow-[0_4px_16px_rgba(0,0,0,0.08)]">
          {/* Status banners */}
          {event && !eventIsLive && (
            <div
              className="mb-4 p-3 py-3 sm:py-2.5 rounded-xl sm:rounded-lg text-center text-[0.9rem] sm:text-[0.85rem] font-bold animate-slideDown border bg-primary/10 border-primary/25 text-primary"
              role="status"
            >
              ⏳ This event isn't live yet.
            </div>
          )}
          {event && !acceptingQuestions && (
            <div
              className="mb-4 p-3 py-3 sm:py-2.5 rounded-xl sm:rounded-lg text-center text-[0.9rem] sm:text-[0.85rem] font-bold animate-slideDown border bg-primary/10 border-primary/25 text-primary"
              role="status"
            >
              🔒 Not accepting questions right now.
            </div>
          )}

          <p className="text-center text-[0.95rem] sm:text-[0.9rem] text-neutral-500 mb-5 sm:mb-4 leading-relaxed">
            Got questions? Submit them here and the panel will address them during the event.
          </p>

          <form onSubmit={handleSubmit} aria-busy={isSubmitting}>
            <div className="mb-4 sm:mb-3">
              <label htmlFor="name" className="block font-semibold mb-2 sm:mb-1.5 text-neutral-600 text-[0.95rem] sm:text-[0.9rem]">
                Your Name (Optional)
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Leave blank for anonymous"
                autoComplete="off"
                disabled={formData.anonymous || isSubmitting || !acceptingQuestions || !eventIsLive}
                className="w-full px-3.5 py-3 sm:px-3 sm:py-2.5 border border-black/15 rounded-xl sm:rounded-lg text-base sm:text-[0.95rem] font-sans text-neutral-600 bg-white transition-all placeholder:text-neutral-400 focus:outline-none focus:border-primary/40 focus:shadow-[0_0_0_3px_rgba(255,107,53,0.15)] disabled:opacity-70 disabled:cursor-not-allowed"
              />
            </div>

            <div className="mb-4 sm:mb-3">
              <label htmlFor="question" className="block font-semibold mb-2 sm:mb-1.5 text-neutral-600 text-[0.95rem] sm:text-[0.9rem]">
                Your Question *
              </label>
              <textarea
                id="question"
                name="question"
                value={formData.question}
                onChange={handleChange}
                rows="4"
                placeholder={
                  acceptingQuestions && eventIsLive
                    ? "Type your question here..."
                    : "Not accepting questions right now."
                }
                required
                disabled={isSubmitting || !acceptingQuestions || !eventIsLive}
                className="w-full px-3.5 py-3 sm:px-3 sm:py-2.5 border border-black/15 rounded-xl sm:rounded-lg text-base sm:text-[0.95rem] font-sans text-neutral-600 bg-white transition-all placeholder:text-neutral-400 focus:outline-none focus:border-primary/40 focus:shadow-[0_0_0_3px_rgba(255,107,53,0.15)] disabled:opacity-70 disabled:cursor-not-allowed resize-y min-h-[100px] sm:min-h-[90px]"
              />
            </div>

            <div className="flex items-center gap-2.5 my-3 mb-5 sm:mb-4 text-neutral-500 text-[0.95rem] sm:text-[0.9rem]">
              <input
                type="checkbox"
                id="anonymous"
                name="anonymous"
                checked={formData.anonymous}
                onChange={handleChange}
                disabled={isSubmitting || !acceptingQuestions || !eventIsLive}
                className="w-[18px] h-[18px] sm:w-4 sm:h-4 cursor-pointer accent-primary"
              />
              <label htmlFor="anonymous" className="cursor-pointer">Submit anonymously</label>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !acceptingQuestions || !eventIsLive}
              className="w-full px-4 py-3.5 sm:py-3 border-none rounded-xl sm:rounded-lg text-[1rem] sm:text-[0.95rem] font-bold cursor-pointer transition-all bg-primary text-white shadow-[0_4px_12px_rgba(255,107,53,0.25)] hover:-translate-y-px hover:bg-orange-600 hover:shadow-[0_6px_16px_rgba(255,107,53,0.3)] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:transform-none"
            >
              {isSubmitting ? "Submitting..." : "Submit Question"}
            </button>
          </form>

          {notice.text && (
            <div
              className={`mt-4 sm:mt-3 p-3 py-3 sm:py-2.5 rounded-xl sm:rounded-lg text-center text-[0.9rem] sm:text-[0.85rem] font-bold animate-slideDown border ${
                notice.type === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-600'
                  : notice.type === 'error'
                  ? 'bg-red-500/10 border-red-500/25 text-red-600'
                  : 'bg-primary/10 border-primary/25 text-primary'
              }`}
              role={notice.type === "error" ? "alert" : "status"}
              aria-live="polite"
            >
              {notice.text}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
