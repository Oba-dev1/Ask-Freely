// src/Components/OrganizerSettings.jsx
import React from 'react';
import { useAuth } from '../context/AuthContext';
import './OrganizerSettings.css';

function OrganizerSettings() {
  const { userProfile } = useAuth();

  return (
    <div className="settings-view">
      {/* Page Header */}
      <div className="settings-header">
        <div>
          <h1 className="settings-title">Settings</h1>
          <p className="settings-subtitle">Manage your organization profile and preferences</p>
        </div>
      </div>

      {/* Settings Content */}
      <div className="settings-content">
        {/* Organization Profile Card */}
        <div className="settings-card">
          <div className="settings-card-header">
            <h2 className="settings-card-title">
              <i className="fas fa-building"></i> Organization Profile
            </h2>
          </div>
          <div className="settings-card-body">
            <div className="settings-info-row">
              <span className="settings-label">Organization Name:</span>
              <span className="settings-value">{userProfile?.organizationName || 'Not set'}</span>
            </div>
            <div className="settings-info-row">
              <span className="settings-label">Email:</span>
              <span className="settings-value">{userProfile?.email || 'N/A'}</span>
            </div>
            <div className="settings-info-row">
              <span className="settings-label">Role:</span>
              <span className="settings-value">{userProfile?.role || 'Organizer'}</span>
            </div>
            <div className="settings-info-row">
              <span className="settings-label">Member Since:</span>
              <span className="settings-value">
                {userProfile?.createdAt
                  ? new Date(userProfile.createdAt).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric'
                    })
                  : 'N/A'}
              </span>
            </div>
          </div>
        </div>

        {/* Coming Soon Cards */}
        <div className="settings-card settings-card-disabled">
          <div className="settings-card-header">
            <h2 className="settings-card-title">
              <i className="fas fa-palette"></i> Branding Preferences
            </h2>
            <span className="coming-soon-badge">Coming Soon</span>
          </div>
          <div className="settings-card-body">
            <p className="settings-placeholder">
              Customize your default branding colors, logos, and styles for all events.
            </p>
          </div>
        </div>

        <div className="settings-card settings-card-disabled">
          <div className="settings-card-header">
            <h2 className="settings-card-title">
              <i className="fas fa-bell"></i> Notifications
            </h2>
            <span className="coming-soon-badge">Coming Soon</span>
          </div>
          <div className="settings-card-body">
            <p className="settings-placeholder">
              Configure email and push notifications for new questions, responses, and event updates.
            </p>
          </div>
        </div>

        <div className="settings-card settings-card-disabled">
          <div className="settings-card-header">
            <h2 className="settings-card-title">
              <i className="fas fa-users"></i> Team Members
            </h2>
            <span className="coming-soon-badge">Coming Soon</span>
          </div>
          <div className="settings-card-body">
            <p className="settings-placeholder">
              Invite team members to collaborate on events and manage questions together.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OrganizerSettings;
