// src/Components/OrganizerAnalytics.jsx
import React, { useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";
import { database } from "../firebase/config";
import { useAuth } from "../context/AuthContext";
import "./Organizer.css";

function OrganizerAnalytics() {
  const { currentUser } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser?.uid) return;

    const organizerEventsRef = ref(database, `organizers/${currentUser.uid}/events`);
    const unsubscribe = onValue(organizerEventsRef, (snapshot) => {
      const data = snapshot.val() || {};
      const formatted = Object.entries(data).map(([id, value]) => ({
        id,
        ...value,
      }));
      setEvents(formatted);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  if (loading) {
    return (
      <div className="dashboard-card">
        <h2>Loading Analytics...</h2>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="dashboard-card">
        <h2>No Events Yet</h2>
        <p>Create an event to see analytics here.</p>
      </div>
    );
  }

  return (
    <div className="container host-container">
      <header className="page-header">
        <h1>Organizer Analytics</h1>
        <p className="page-subtitle">Performance overview across all your events</p>
      </header>

      <div className="dashboard-card">
        <table className="analytics-table">
          <thead>
            <tr>
              <th>Event</th>
              <th>Date</th>
              <th>Questions</th>
              <th>Answered</th>
              <th>Unanswered</th>
              <th>Anonymous</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {events.map((event) => {
              const total = event.questionCount || 0;
              const answered = event.strategicQuestions?.filter((q) => q.answered).length || 0;
              const unanswered = total - answered;
              const anonymous = event.strategicQuestions?.filter(
                (q) => q.author === "Anonymous"
              ).length || 0;

              return (
                <tr key={event.id}>
                  <td>{event.title}</td>
                  <td>{event.date}</td>
                  <td>{total}</td>
                  <td>{answered}</td>
                  <td>{unanswered}</td>
                  <td>{anonymous}</td>
                  <td>{event.status}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default OrganizerAnalytics;
