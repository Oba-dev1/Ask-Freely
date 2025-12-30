// src/Components/OrganizerSettings.jsx
import React from 'react';
import { useAuth } from '../context/AuthContext';

function OrganizerSettings() {
  const { userProfile } = useAuth();

  return (
    <div className="animate-fade-in">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-ink mb-1 tracking-tight">Settings</h1>
        <p className="text-base text-neutral-500">Manage your organization profile and preferences</p>
      </div>

      {/* Settings Content */}
      <div className="grid grid-cols-1 lg:grid-cols-[repeat(auto-fit,minmax(400px,1fr))] gap-6">
        {/* Organization Profile Card */}
        <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.08)] overflow-hidden transition-all hover:shadow-medium">
          <div className="flex items-center justify-between p-6 border-b border-neutral-200">
            <h2 className="text-lg font-semibold text-ink m-0 flex items-center gap-2.5">
              <i className="fas fa-building text-primary"></i> Organization Profile
            </h2>
          </div>
          <div className="p-6">
            <div className="flex items-center justify-between py-4 border-b border-neutral-100 first:pt-0 last:border-b-0 last:pb-0 flex-col md:flex-row md:items-center gap-2 md:gap-0">
              <span className="text-[0.95rem] font-medium text-neutral-500">Organization Name:</span>
              <span className="text-[0.95rem] font-semibold text-ink text-left md:text-right">{userProfile?.organizationName || 'Not set'}</span>
            </div>
            <div className="flex items-center justify-between py-4 border-b border-neutral-100 first:pt-0 last:border-b-0 last:pb-0 flex-col md:flex-row md:items-center gap-2 md:gap-0">
              <span className="text-[0.95rem] font-medium text-neutral-500">Email:</span>
              <span className="text-[0.95rem] font-semibold text-ink text-left md:text-right">{userProfile?.email || 'N/A'}</span>
            </div>
            <div className="flex items-center justify-between py-4 border-b border-neutral-100 first:pt-0 last:border-b-0 last:pb-0 flex-col md:flex-row md:items-center gap-2 md:gap-0">
              <span className="text-[0.95rem] font-medium text-neutral-500">Role:</span>
              <span className="text-[0.95rem] font-semibold text-ink text-left md:text-right">{userProfile?.role || 'Organizer'}</span>
            </div>
            <div className="flex items-center justify-between py-4 border-b border-neutral-100 first:pt-0 last:border-b-0 last:pb-0 flex-col md:flex-row md:items-center gap-2 md:gap-0">
              <span className="text-[0.95rem] font-medium text-neutral-500">Member Since:</span>
              <span className="text-[0.95rem] font-semibold text-ink text-left md:text-right">
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
        <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.08)] overflow-hidden transition-all opacity-60 pointer-events-none">
          <div className="flex items-center justify-between p-6 border-b border-neutral-200">
            <h2 className="text-lg font-semibold text-ink m-0 flex items-center gap-2.5">
              <i className="fas fa-palette text-primary"></i> Branding Preferences
            </h2>
            <span className="px-3 py-1.5 bg-neutral-500/10 text-neutral-500 rounded-lg text-xs font-semibold">Coming Soon</span>
          </div>
          <div className="p-6">
            <p className="text-[0.95rem] text-neutral-500 m-0 leading-relaxed">
              Customize your default branding colors, logos, and styles for all events.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.08)] overflow-hidden transition-all opacity-60 pointer-events-none">
          <div className="flex items-center justify-between p-6 border-b border-neutral-200">
            <h2 className="text-lg font-semibold text-ink m-0 flex items-center gap-2.5">
              <i className="fas fa-bell text-primary"></i> Notifications
            </h2>
            <span className="px-3 py-1.5 bg-neutral-500/10 text-neutral-500 rounded-lg text-xs font-semibold">Coming Soon</span>
          </div>
          <div className="p-6">
            <p className="text-[0.95rem] text-neutral-500 m-0 leading-relaxed">
              Configure email and push notifications for new questions, responses, and event updates.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.08)] overflow-hidden transition-all opacity-60 pointer-events-none">
          <div className="flex items-center justify-between p-6 border-b border-neutral-200">
            <h2 className="text-lg font-semibold text-ink m-0 flex items-center gap-2.5">
              <i className="fas fa-users text-primary"></i> Team Members
            </h2>
            <span className="px-3 py-1.5 bg-neutral-500/10 text-neutral-500 rounded-lg text-xs font-semibold">Coming Soon</span>
          </div>
          <div className="p-6">
            <p className="text-[0.95rem] text-neutral-500 m-0 leading-relaxed">
              Invite team members to collaborate on events and manage questions together.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OrganizerSettings;
