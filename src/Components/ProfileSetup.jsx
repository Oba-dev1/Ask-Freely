// src/Components/ProfileSetup.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ref as dbRef, update } from 'firebase/database';
import { database } from '../Firebase/config';
import { useAuth } from '../context/AuthContext';
import './ProfileSetup.css';

function ProfileSetup() {
  const [organizationName, setOrganizationName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const handleSkip = () => {
    // Allow users to skip and go straight to dashboard
    navigate('/organizer/dashboard');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!organizationName.trim()) {
      setError('Please enter your organization name');
      return;
    }

    if (!currentUser) {
      setError('User not authenticated');
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Update user profile in database (without logo for now)
      const userRef = dbRef(database, `users/${currentUser.uid}`);
      await update(userRef, {
        organizationName: organizationName.trim(),
        logoUrl: null,
        profileCompleted: true,
        profileCompletedAt: new Date().toISOString()
      });

      // Navigate to dashboard
      navigate('/organizer/dashboard');
    } catch (err) {
      console.error('Profile setup error:', err);
      setError('Failed to save profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profile-setup-wrapper">
      <div className="profile-setup-container">
        <div className="profile-setup-card">
          {/* Header */}
          <header className="setup-header">
            <div className="setup-icon">
              <i className="fas fa-user-circle"></i>
            </div>
            <h1>Complete Your Profile</h1>
            <p className="setup-subtitle">
              Tell us about your organization to get started
            </p>
          </header>

          {/* Progress Steps */}
          <div className="setup-progress">
            <div className="progress-step completed">
              <div className="step-number">1</div>
              <span>Account Created</span>
            </div>
            <div className="progress-line"></div>
            <div className="progress-step active">
              <div className="step-number">2</div>
              <span>Profile Setup</span>
            </div>
          </div>

          {error && <div className="error-banner" role="alert">{error}</div>}

          {/* Form */}
          <form onSubmit={handleSubmit} className="setup-form">
            {/* Organization Name */}
            <div className="form-group">
              <label htmlFor="organizationName">
                Organization Name <span className="required">*</span>
              </label>
              <input
                type="text"
                id="organizationName"
                value={organizationName}
                onChange={(e) => setOrganizationName(e.target.value)}
                placeholder="Your church, company, or organization"
                required
                autoFocus
                disabled={loading}
              />
              <small className="field-hint">
                This will appear on your events and dashboards
              </small>
            </div>

            {/* Logo Upload - Temporarily Disabled */}
            <div className="form-group">
              <label>
                Organization Logo <span className="optional">(Coming Soon)</span>
              </label>
              <div style={{
                padding: '1.5rem',
                background: 'rgba(0,0,0,0.03)',
                borderRadius: '12px',
                border: '2px dashed rgba(0,0,0,0.1)',
                textAlign: 'center',
                color: '#999'
              }}>
                <i className="fas fa-lock" style={{ fontSize: '1.5rem', marginBottom: '0.5rem', display: 'block' }}></i>
                <p style={{ margin: '0', fontSize: '0.95rem' }}>Logo upload will be available after Firebase Storage upgrade</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="form-actions">
              <button
                type="button"
                onClick={handleSkip}
                className="btn btn-secondary"
                disabled={loading}
              >
                Skip for now
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading || !organizationName.trim()}
              >
                {loading ? 'Saving...' : 'Complete Setup'}
              </button>
            </div>
          </form>

          {/* Help Text */}
          <div className="setup-footer">
            <p className="help-text">
              <i className="fas fa-info-circle"></i>
              You can update this information anytime in your settings
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfileSetup;
