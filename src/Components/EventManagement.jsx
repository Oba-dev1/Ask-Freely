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
  const isArchived = event?.status === "archived";
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

  const handleArchive = useCallback(async () => {
    if (!event) return;
    const confirmMessage =
      `Archive "${event.title}"?\n\n` +
      `This will:\n` +
      `• Hide the event from your active and draft lists\n` +
      `• Disable participant access to the event page\n` +
      `• Preserve all questions and analytics data\n` +
      `• Allow you to restore it later from Archived Events\n\n` +
      `Continue?`;

    if (!window.confirm(confirmMessage)) return;

    try {
      setSaving(true);
      await update(ref(database, `events/${eventId}`), {
        status: "archived",
        archivedAt: new Date().toISOString(),
        enableQuestionSubmission: false,
      });
      // Navigate back to all events after archiving
      navigate('/organizer/events/all');
    } catch (err) {
      console.error("Error archiving event:", err);
      alert("Failed to archive event. Please try again.");
    } finally {
      setSaving(false);
    }
  }, [event, eventId, navigate]);

  const handleRestore = useCallback(async () => {
    if (!event) return;
    const confirmMessage =
      `Restore "${event.title}"?\n\n` +
      `This will move it back to your drafts. You can publish it again when ready.`;

    if (!window.confirm(confirmMessage)) return;

    try {
      setSaving(true);
      await update(ref(database, `events/${eventId}`), {
        status: "draft",
        restoredAt: new Date().toISOString(),
      });
    } catch (err) {
      console.error("Error restoring event:", err);
      alert("Failed to restore event. Please try again.");
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
      <div className="max-w-[1160px] mx-auto px-6 py-8">
        <p>Loading event…</p>
      </div>
    );
  }

  // Determine back navigation based on event status
  const handleBackNavigation = () => {
    if (event.status === 'published') {
      navigate('/organizer/events/active');
    } else {
      navigate('/organizer/events/all');
    }
  };

  const getBackButtonText = () => {
    if (event.status === 'published') {
      return 'Back to Active Events';
    }
    return 'Back to All Events';
  };

  // ---- UI ----
  return (
    <div className="max-w-[1160px] mx-auto px-6 py-8">
      {/* Back Button */}
      <button
        onClick={handleBackNavigation}
        className="bg-white border border-black/10 text-neutral-600 px-3.5 py-2.5 rounded-[10px] font-semibold text-sm cursor-pointer transition-all inline-flex items-center gap-2 mb-6 hover:bg-primary/5 hover:border-primary/30 hover:-translate-x-0.5"
      >
        <i className="fas fa-arrow-left text-sm"></i> {getBackButtonText()}
      </button>

      <header className="mb-6">
        <h1 className="text-[2.1rem] m-0 mb-1 flex items-center gap-2.5 text-black font-bold">
          {event.title}{" "}
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[0.85rem] rounded-full border ${isActive ? 'border-emerald-500/35 bg-emerald-500/10 text-emerald-500' : 'border-black/10 bg-primary/10 text-neutral-500'}`}>
            {isActive ? "Published" : "Draft"}
          </span>
        </h1>
        <p className="text-neutral-500">
          {event.date ? new Date(event.date).toLocaleDateString() : "Date TBA"}
          {event.time ? ` • ${event.time}` : ""}
        </p>
      </header>

      {/* Event Control Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[repeat(auto-fit,minmax(400px,1fr))] gap-6 my-6">
        {/* Publish Status Card */}
        <div className={`bg-white border-2 rounded-2xl p-7 flex flex-col gap-5 transition-all shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 ${isActive ? 'border-emerald-500/30 bg-gradient-to-br from-emerald-500/[0.03] to-emerald-500/[0.01]' : 'border-amber-500/30 bg-gradient-to-br from-amber-500/[0.03] to-amber-500/[0.01]'}`}>
          <div className={`w-[60px] h-[60px] rounded-xl flex items-center justify-center text-[1.75rem] text-white shadow-lg ${isActive ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-emerald-500/25' : 'bg-gradient-to-br from-amber-500 to-amber-600 shadow-amber-500/25'}`}>
            <i className={`fas ${isActive ? 'fa-check-circle' : 'fa-circle'}`}></i>
          </div>
          <div className="flex-1">
            <h3 className="text-base font-bold text-neutral-700 m-0 mb-2 tracking-tight">Event Status</h3>
            <p className="text-[1.75rem] font-bold text-neutral-900 m-0 mb-2 tracking-tight">{isActive ? 'Published' : 'Draft'}</p>
            <p className="text-sm text-neutral-500 leading-relaxed m-0">
              {isActive
                ? 'Your event is live and accessible to participants'
                : 'Event is hidden from participants'}
            </p>
          </div>
          <div className="flex gap-3">
            {isActive ? (
              <button
                className="flex-1 px-5 py-3.5 rounded-[10px] text-[0.9375rem] font-semibold flex items-center justify-center gap-2 cursor-pointer transition-all border-[1.5px] bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-100 hover:border-neutral-300 hover:-translate-y-px disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleUnpublish}
                disabled={saving}
              >
                <i className="fas fa-eye-slash"></i>
                {saving ? 'Hiding...' : 'Hide Event'}
              </button>
            ) : (
              <button
                className="flex-1 px-5 py-3.5 rounded-[10px] text-[0.9375rem] font-semibold flex items-center justify-center gap-2 cursor-pointer transition-all border-[1.5px] border-transparent bg-gradient-to-br from-primary to-orange-500 text-white shadow-[0_2px_8px_rgba(255,107,53,0.25)] hover:from-orange-500 hover:to-orange-600 hover:-translate-y-px hover:shadow-[0_4px_12px_rgba(255,107,53,0.4)] disabled:opacity-50 disabled:cursor-not-allowed"
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
        <div className={`bg-white border-2 rounded-2xl p-7 flex flex-col gap-5 transition-all shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 ${accepting ? 'border-emerald-500/30 bg-gradient-to-br from-emerald-500/[0.03] to-emerald-500/[0.01]' : 'border-neutral-400/20 bg-gradient-to-br from-neutral-400/[0.02] to-neutral-400/[0.01]'}`}>
          <div className={`w-[60px] h-[60px] rounded-xl flex items-center justify-center text-[1.75rem] text-white shadow-lg ${accepting ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-emerald-500/25' : 'bg-gradient-to-br from-neutral-400 to-neutral-500 shadow-neutral-400/20'}`}>
            <i className={`fas ${accepting ? 'fa-inbox' : 'fa-pause-circle'}`}></i>
          </div>
          <div className="flex-1">
            <h3 className="text-base font-bold text-neutral-700 m-0 mb-2 tracking-tight">Question Submissions</h3>
            <p className="text-[1.75rem] font-bold text-neutral-900 m-0 mb-2 tracking-tight">{accepting ? 'Accepting' : 'Paused'}</p>
            <p className="text-sm text-neutral-500 leading-relaxed m-0">
              {accepting
                ? 'Participants can submit questions'
                : 'New questions are temporarily paused'}
            </p>
          </div>
          <div className="flex gap-3">
            <button
              className="flex-1 px-5 py-3.5 rounded-[10px] text-[0.9375rem] font-semibold flex items-center justify-center gap-2 cursor-pointer transition-all border-[1.5px] bg-white text-primary border-primary hover:bg-primary/5 hover:border-orange-500 hover:-translate-y-px disabled:opacity-50 disabled:cursor-not-allowed"
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
      <div className="mt-10 mb-6">
        <h2 className="text-2xl font-bold text-neutral-900 m-0 mb-2 flex items-center gap-3 tracking-tight">
          <i className="fas fa-share-nodes text-primary text-xl"></i> Event Links
        </h2>
        <p className="text-[0.9375rem] text-neutral-500 m-0 leading-relaxed">Share these links to give access to participants and hosts</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[repeat(auto-fit,minmax(400px,1fr))] gap-6 mb-10">
        {/* Participant Link Card */}
        <div className={`bg-white border-[1.5px] border-neutral-200 rounded-2xl p-7 flex flex-col gap-5 transition-all shadow-[0_2px_8px_rgba(0,0,0,0.04)] ${!canShareParticipant ? 'opacity-60 cursor-not-allowed bg-neutral-50' : 'hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 hover:border-primary'}`}>
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-[10px] flex items-center justify-center text-2xl flex-shrink-0 bg-gradient-to-br from-primary to-orange-500 text-white shadow-[0_4px_12px_rgba(255,107,53,0.25)]">
              <i className="fas fa-users"></i>
            </div>
            <div>
              <h3 className="text-lg font-bold text-neutral-900 m-0 mb-1 tracking-tight">Participant Link</h3>
              <p className="text-sm text-neutral-500 m-0 leading-normal">For attendees to submit questions</p>
            </div>
          </div>
          <div className="flex-1">
            {canShareParticipant ? (
              <div className="bg-neutral-50 border border-neutral-200 rounded-lg px-4 py-3.5">
                <code className="font-mono text-[0.8125rem] text-neutral-700 break-all leading-relaxed">{participantLink}</code>
              </div>
            ) : (
              <div className="flex items-center gap-3 px-4 py-3.5 bg-amber-500/5 border border-amber-500/20 rounded-lg text-amber-800 text-sm leading-relaxed">
                <i className="fas fa-info-circle text-amber-500 text-base flex-shrink-0"></i>
                <span>
                  {hasSlug
                    ? "Publish your event to enable this link"
                    : "Add an event slug to generate a shareable link"}
                </span>
              </div>
            )}
          </div>
          <div className="flex gap-3 pt-2 border-t border-neutral-200">
            <button
              onClick={() => copyToClipboard(participantLink, "participant")}
              className="flex-1 px-4 py-3 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer transition-all bg-primary text-white border-[1.5px] border-primary hover:bg-orange-500 hover:border-orange-500 hover:-translate-y-px hover:shadow-[0_2px_8px_rgba(255,107,53,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
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
        <div className="bg-white border-[1.5px] border-neutral-200 rounded-2xl p-7 flex flex-col gap-5 transition-all shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 hover:border-primary">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-[10px] flex items-center justify-center text-2xl flex-shrink-0 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-[0_4px_12px_rgba(16,185,129,0.25)]">
              <i className="fas fa-microphone"></i>
            </div>
            <div>
              <h3 className="text-lg font-bold text-neutral-900 m-0 mb-1 tracking-tight">MC/Host Link</h3>
              <p className="text-sm text-neutral-500 m-0 leading-normal">For event moderators and hosts</p>
            </div>
          </div>
          <div className="flex-1">
            <div className="bg-neutral-50 border border-neutral-200 rounded-lg px-4 py-3.5">
              <code className="font-mono text-[0.8125rem] text-neutral-700 break-all leading-relaxed">{mcLink}</code>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 pt-2 border-t border-neutral-200">
            <button
              onClick={() => copyToClipboard(mcLink, "mc")}
              className="flex-1 px-4 py-3 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer transition-all bg-primary text-white border-[1.5px] border-primary hover:bg-orange-500 hover:border-orange-500 hover:-translate-y-px hover:shadow-[0_2px_8px_rgba(255,107,53,0.3)]"
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
              className="flex-1 px-4 py-3 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer transition-all bg-white text-neutral-700 border-[1.5px] border-neutral-200 hover:bg-neutral-100 hover:border-neutral-300 hover:text-neutral-900"
            >
              <i className="fas fa-envelope"></i> Send Invite
            </button>
          </div>
        </div>
      </div>

      {/* Archive/Restore Section */}
      {isArchived ? (
        <div className="my-8">
          <div className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 border-2 border-amber-500/30 rounded-2xl p-8 flex flex-col md:flex-row items-center gap-6 shadow-[0_4px_12px_rgba(245,158,11,0.08)]">
            <div className="w-16 h-16 bg-amber-500/15 rounded-full flex items-center justify-center text-[2rem] text-amber-500 flex-shrink-0">
              <i className="fas fa-archive"></i>
            </div>
            <div className="flex-1 text-center md:text-left">
              <h3 className="text-xl font-bold m-0 mb-2 text-amber-600 flex items-center justify-center md:justify-start gap-2">
                <i className="fas fa-info-circle"></i> This Event is Archived
              </h3>
              <p className="m-0 text-amber-800 text-[0.95rem]">
                This event is hidden from participants and your active lists. All questions and data are preserved.
              </p>
            </div>
            <button
              className="w-full md:w-auto px-6 py-3 rounded-[10px] font-semibold text-[0.95rem] cursor-pointer transition-all inline-flex items-center justify-center gap-2 bg-primary text-white shadow-[0_2px_8px_rgba(255,107,53,0.2)] hover:bg-orange-600 hover:-translate-y-px hover:shadow-[0_4px_12px_rgba(255,107,53,0.3)] disabled:opacity-60 disabled:cursor-not-allowed"
              onClick={handleRestore}
              disabled={saving}
            >
              <i className="fas fa-undo"></i>
              {saving ? 'Restoring...' : 'Restore Event'}
            </button>
          </div>
        </div>
      ) : (
        <div className="my-8">
          <div className="mt-10 mb-6">
            <h2 className="text-2xl font-bold text-neutral-900 m-0 mb-2 flex items-center gap-3 tracking-tight">
              <i className="fas fa-exclamation-triangle text-primary text-xl"></i> Archive Event
            </h2>
            <p className="text-[0.9375rem] text-neutral-500 m-0 leading-relaxed">
              Archive this event to remove it from your active lists while preserving all data
            </p>
          </div>
          <div className="bg-gradient-to-br from-red-500/[0.03] to-red-500/[0.01] border border-red-500/20 rounded-xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex-1">
              <h3 className="text-lg font-bold m-0 mb-2 text-red-600">Archive this event</h3>
              <p className="m-0 text-red-800 text-sm leading-normal">
                Archiving will hide this event from participants and move it to your archived events.
                You can restore it anytime. All questions and analytics will be preserved.
              </p>
            </div>
            <button
              className="w-full md:w-auto bg-red-500 text-white border-none px-6 py-3 rounded-[10px] font-semibold text-[0.95rem] cursor-pointer transition-all inline-flex items-center justify-center gap-2 whitespace-nowrap hover:bg-red-600 hover:-translate-y-px hover:shadow-[0_4px_12px_rgba(239,68,68,0.3)] active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed"
              onClick={handleArchive}
              disabled={saving}
            >
              <i className="fas fa-archive"></i>
              {saving ? 'Archiving...' : 'Archive Event'}
            </button>
          </div>
        </div>
      )}

      {/* Branding Preview */}
      <BrandingPreview event={event} />

      {/* Questions */}
      <div className="bg-white border border-black/10 rounded-[18px] p-7 shadow-[0_1px_3px_rgba(0,0,0,0.06)] mt-5">
        <div className="flex justify-between items-center gap-4 pb-4 border-b border-black/10 mb-4 flex-col md:flex-row">
          <h2 className="text-xl font-bold text-neutral-900 m-0">Questions</h2>
          <div className="relative">
            <button
              className="px-7 py-3.5 bg-primary/10 border border-primary/20 text-primary rounded-xl font-semibold cursor-pointer transition-all font-sans inline-flex items-center gap-2 text-[0.95rem] whitespace-nowrap hover:bg-primary/15 hover:-translate-y-0.5 hover:shadow-[0_4px_15px_rgba(255,107,53,0.2)]"
              onClick={() => setShowExportMenu((v) => !v)}
            >
              <i className="fas fa-download" aria-hidden="true" />
              Export
            </button>
            {showExportMenu && (
              <div className="absolute top-[calc(100%+0.75rem)] right-0 bg-white border border-black/10 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.15)] z-[100] min-w-[220px] max-w-[90vw] overflow-hidden animate-slideDown">
                <button
                  onClick={() => handleExport("csv")}
                  className="flex items-center gap-3 w-full px-5 py-4 border-0 bg-transparent text-neutral-600 text-left cursor-pointer text-[0.95em] font-medium transition-all font-sans hover:bg-primary/10 hover:text-neutral-900 border-b border-black/5"
                >
                  <i className="fas fa-file-csv" aria-hidden="true" />
                  Export as CSV
                </button>
                <button
                  onClick={() => handleExport("json")}
                  className="flex items-center gap-3 w-full px-5 py-4 border-0 bg-transparent text-neutral-600 text-left cursor-pointer text-[0.95em] font-medium transition-all font-sans hover:bg-primary/10 hover:text-neutral-900 border-b border-black/5"
                >
                  <i className="fas fa-code" aria-hidden="true" />
                  Export as JSON
                </button>
                <button
                  onClick={() => handleExport("txt")}
                  className="flex items-center gap-3 w-full px-5 py-4 border-0 bg-transparent text-neutral-600 text-left cursor-pointer text-[0.95em] font-medium transition-all font-sans hover:bg-primary/10 hover:text-neutral-900"
                >
                  <i className="fas fa-file-lines" aria-hidden="true" />
                  Export as Text
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Analytics Cards */}
        {analytics && (
          <section className="grid grid-cols-[repeat(auto-fit,minmax(min(200px,100%),1fr))] gap-[clamp(0.75rem,2vw,1.5rem)] mb-8">
            {/* Answered */}
            <div className="bg-white border border-black/10 rounded-2xl p-[clamp(1rem,2.5vw,1.75rem)] shadow-[0_1px_3px_rgba(0,0,0,0.06)] transition-all relative overflow-hidden group hover:bg-primary/[0.02] hover:border-primary/20 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(255,107,53,0.12)]">
              <div className="absolute inset-x-0 top-0 h-[3px] bg-primary opacity-0 transition-opacity group-hover:opacity-100"></div>
              <div className="flex justify-between items-center gap-3 mb-4">
                <span className="text-neutral-500 text-sm font-semibold uppercase tracking-wide flex-1">Answered</span>
                <div className="w-10 h-10 rounded-[10px] flex items-center justify-center text-xl flex-shrink-0 bg-emerald-500/10 text-emerald-500">
                  <i className="fas fa-check-circle" aria-hidden="true"></i>
                </div>
              </div>
              <div className="text-[clamp(1.75rem,3.2vw,2.5rem)] font-bold text-neutral-900 font-['Poppins',sans-serif] leading-none mb-1">
                {analytics.summary?.answered ?? 0}
              </div>
              <div className="text-neutral-500 text-sm min-h-[1.35rem]">
                <span className="text-emerald-500 font-semibold">
                  {fmtPct(analytics.summary?.percentAnswered)}
                </span>{" "}
                of total
              </div>
            </div>

            {/* Unanswered */}
            <div className="bg-white border border-black/10 rounded-2xl p-[clamp(1rem,2.5vw,1.75rem)] shadow-[0_1px_3px_rgba(0,0,0,0.06)] transition-all relative overflow-hidden group hover:bg-primary/[0.02] hover:border-primary/20 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(255,107,53,0.12)]">
              <div className="absolute inset-x-0 top-0 h-[3px] bg-primary opacity-0 transition-opacity group-hover:opacity-100"></div>
              <div className="flex justify-between items-center gap-3 mb-4">
                <span className="text-neutral-500 text-sm font-semibold uppercase tracking-wide flex-1">Unanswered</span>
                <div className="w-10 h-10 rounded-[10px] flex items-center justify-center text-xl flex-shrink-0 bg-amber-500/10 text-amber-500">
                  <i className="fas fa-question-circle" aria-hidden="true"></i>
                </div>
              </div>
              <div className="text-[clamp(1.75rem,3.2vw,2.5rem)] font-bold text-neutral-900 font-['Poppins',sans-serif] leading-none mb-1">
                {analytics.summary?.unanswered ?? 0}
              </div>
              <div className="text-neutral-500 text-sm min-h-[1.35rem]">
                <span className="text-neutral-500">Remaining in queue</span>
              </div>
            </div>

            {/* Anonymous */}
            <div className="bg-white border border-black/10 rounded-2xl p-[clamp(1rem,2.5vw,1.75rem)] shadow-[0_1px_3px_rgba(0,0,0,0.06)] transition-all relative overflow-hidden group hover:bg-primary/[0.02] hover:border-primary/20 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(255,107,53,0.12)]">
              <div className="absolute inset-x-0 top-0 h-[3px] bg-primary opacity-0 transition-opacity group-hover:opacity-100"></div>
              <div className="flex justify-between items-center gap-3 mb-4">
                <span className="text-neutral-500 text-sm font-semibold uppercase tracking-wide flex-1">Anonymous</span>
                <div className="w-10 h-10 rounded-[10px] flex items-center justify-center text-xl flex-shrink-0 bg-blue-500/10 text-blue-500">
                  <i className="fas fa-user-secret" aria-hidden="true"></i>
                </div>
              </div>
              <div className="text-[clamp(1.75rem,3.2vw,2.5rem)] font-bold text-neutral-900 font-['Poppins',sans-serif] leading-none mb-1">
                {analytics.summary?.anonymous ?? 0}
              </div>
              <div className="text-neutral-500 text-sm min-h-[1.35rem]">
                <span className="text-emerald-500 font-semibold">
                  {fmtPct(analytics.summary?.percentAnonymous)}
                </span>{" "}
                of submissions
              </div>
            </div>

            {/* Session Duration */}
            <div className="bg-white border border-black/10 rounded-2xl p-[clamp(1rem,2.5vw,1.75rem)] shadow-[0_1px_3px_rgba(0,0,0,0.06)] transition-all relative overflow-hidden group hover:bg-primary/[0.02] hover:border-primary/20 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(255,107,53,0.12)]">
              <div className="absolute inset-x-0 top-0 h-[3px] bg-primary opacity-0 transition-opacity group-hover:opacity-100"></div>
              <div className="flex justify-between items-center gap-3 mb-4">
                <span className="text-neutral-500 text-sm font-semibold uppercase tracking-wide flex-1">Session Duration</span>
                <div className="w-10 h-10 rounded-[10px] flex items-center justify-center text-xl flex-shrink-0 bg-primary/10 text-primary">
                  <i className="fas fa-clock" aria-hidden="true"></i>
                </div>
              </div>
              <div className="text-[2rem] font-bold text-neutral-900 font-['Poppins',sans-serif] leading-none mb-1">
                {analytics.timeline?.duration || "N/A"}
              </div>
              {compactTimeLabel(
                analytics.timeline?.firstQuestion,
                analytics.timeline?.lastQuestion
              ) && (
                <div className="text-neutral-500 text-sm min-h-[1.35rem]">
                  {compactTimeLabel(
                    analytics.timeline?.firstQuestion,
                    analytics.timeline?.lastQuestion
                  )}
                </div>
              )}
            </div>
          </section>
        )}

        <div className="flex gap-2 flex-wrap my-4 mb-5">
          <button
            className={`px-4 py-2.5 rounded-[10px] border font-bold cursor-pointer transition-all inline-flex gap-2 items-center ${filter === "all" ? "bg-primary border-transparent text-white shadow-[0_4px_12px_rgba(255,107,53,0.25)]" : "border-black/10 bg-black/[0.02] text-neutral-600 hover:bg-primary/10 hover:border-primary/20"}`}
            onClick={() => setFilter("all")}
          >
            All
          </button>
          <button
            className={`px-4 py-2.5 rounded-[10px] border font-bold cursor-pointer transition-all inline-flex gap-2 items-center ${filter === "organizer" ? "bg-primary border-transparent text-white shadow-[0_4px_12px_rgba(255,107,53,0.25)]" : "border-black/10 bg-black/[0.02] text-neutral-600 hover:bg-primary/10 hover:border-primary/20"}`}
            onClick={() => setFilter("organizer")}
          >
            <i className="fas fa-star" aria-hidden="true"></i> Strategic
          </button>
          <button
            className={`px-4 py-2.5 rounded-[10px] border font-bold cursor-pointer transition-all inline-flex gap-2 items-center ${filter === "audience" ? "bg-primary border-transparent text-white shadow-[0_4px_12px_rgba(255,107,53,0.25)]" : "border-black/10 bg-black/[0.02] text-neutral-600 hover:bg-primary/10 hover:border-primary/20"}`}
            onClick={() => setFilter("audience")}
          >
            <i className="fas fa-users" aria-hidden="true"></i> Audience
          </button>
          <button
            className={`px-4 py-2.5 rounded-[10px] border font-bold cursor-pointer transition-all inline-flex gap-2 items-center ${filter === "answered" ? "bg-primary border-transparent text-white shadow-[0_4px_12px_rgba(255,107,53,0.25)]" : "border-black/10 bg-black/[0.02] text-neutral-600 hover:bg-primary/10 hover:border-primary/20"}`}
            onClick={() => setFilter("answered")}
          >
            Answered
          </button>
          <button
            className={`px-4 py-2.5 rounded-[10px] border font-bold cursor-pointer transition-all inline-flex gap-2 items-center ${filter === "unanswered" ? "bg-primary border-transparent text-white shadow-[0_4px_12px_rgba(255,107,53,0.25)]" : "border-black/10 bg-black/[0.02] text-neutral-600 hover:bg-primary/10 hover:border-primary/20"}`}
            onClick={() => setFilter("unanswered")}
          >
            Unanswered
          </button>
        </div>

        <div className="grid gap-3">
          {filteredQuestions.length === 0 ? (
            <p className="text-center text-neutral-500 py-10 px-4">No questions to display.</p>
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
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-[4px] flex items-center justify-center z-[1000] animate-fadeIn"
          onClick={() => setShowInviteModal(false)}
        >
          <div
            className="bg-white border border-black/10 rounded-[18px] p-7 w-[min(520px,92vw)] shadow-[0_20px_60px_rgba(0,0,0,0.2)] animate-slideUp"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="invite-title"
          >
            <h3 id="invite-title" className="m-0 mb-2 flex items-center gap-2.5 text-xl font-bold">
              <i className="fas fa-paper-plane text-primary" aria-hidden="true"></i> Invite MC/Host
            </h3>
            <p className="text-neutral-500 m-0 mb-4">We'll open your email client with a pre-filled message containing the MC link.</p>

            <div className="my-2.5 mb-4">
              <label htmlFor="mcEmail" className="block font-bold mb-2 text-neutral-900">MC Email Address</label>
              <input
                type="email"
                id="mcEmail"
                value={mcEmail}
                onChange={(e) => setMcEmail(e.target.value)}
                placeholder="mc@example.com"
                autoFocus
                className="w-full px-3.5 py-3 rounded-[10px] border border-black/15 bg-white text-neutral-900 outline-none transition-all focus:border-primary focus:shadow-[0_0_0_3px_rgba(255,107,53,0.15)] focus:bg-primary/[0.02]"
              />
            </div>

            <div className="flex gap-2.5 justify-end mt-4">
              <button
                onClick={() => setShowInviteModal(false)}
                className="inline-flex items-center justify-center gap-2 rounded-[10px] font-bold px-5 py-3 cursor-pointer transition-all border bg-transparent border-black/15 text-neutral-600 hover:bg-black/[0.03] hover:border-black/25"
              >
                Cancel
              </button>
              <button
                onClick={sendMCInvite}
                className="inline-flex items-center justify-center gap-2 rounded-[10px] font-bold px-5 py-3 cursor-pointer transition-all border border-transparent bg-primary text-white shadow-[0_2px_8px_rgba(255,107,53,0.2)] hover:bg-orange-600 hover:-translate-y-px hover:shadow-[0_4px_12px_rgba(255,107,53,0.3)] disabled:opacity-60 disabled:cursor-not-allowed"
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
