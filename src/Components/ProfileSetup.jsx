// src/Components/ProfileSetup.jsx
import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ref as dbRef, update } from 'firebase/database';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { database } from '../Firebase/config';
import { storage } from '../Firebase/config';
import { useAuth } from '../context/AuthContext';
import './ProfileSetup.css';

function ProfileSetup() {
  const [organizationName, setOrganizationName] = useState('');
  const [logo, setLogo] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB');
      return;
    }

    setLogo(file);
    setError('');

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setLogo(null);
    setLogoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

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

      let logoUrl = '';

      // Upload logo if provided
      if (logo) {
        setUploadProgress(10);
        const logoRef = storageRef(storage, `logos/${currentUser.uid}/${Date.now()}_${logo.name}`);

        setUploadProgress(50);
        await uploadBytes(logoRef, logo);

        setUploadProgress(75);
        logoUrl = await getDownloadURL(logoRef);
        setUploadProgress(100);
      }

      // Update user profile in database
      const userRef = dbRef(database, `users/${currentUser.uid}`);
      await update(userRef, {
        organizationName: organizationName.trim(),
        logoUrl: logoUrl || null,
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
      setUploadProgress(0);
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

            {/* Logo Upload */}
            <div className="form-group">
              <label htmlFor="logo">
                Organization Logo <span className="optional">(Optional)</span>
              </label>

              {!logoPreview ? (
                <div className="logo-upload-area">
                  <input
                    ref={fileInputRef}
                    type="file"
                    id="logo"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="file-input"
                    disabled={loading}
                  />
                  <label htmlFor="logo" className="upload-label">
                    <i className="fas fa-cloud-upload-alt"></i>
                    <span>Click to upload logo</span>
                    <small>PNG, JPG or GIF (max 5MB)</small>
                  </label>
                </div>
              ) : (
                <div className="logo-preview-container">
                  <div className="logo-preview">
                    <img src={logoPreview} alt="Logo preview" />
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveLogo}
                    className="btn-remove-logo"
                    disabled={loading}
                  >
                    <i className="fas fa-times"></i> Remove
                  </button>
                </div>
              )}

              <small className="field-hint">
                Your logo helps attendees recognize your brand
              </small>
            </div>

            {/* Upload Progress */}
            {uploadProgress > 0 && uploadProgress < 100 && (
              <div className="upload-progress">
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <span className="progress-text">Uploading... {uploadProgress}%</span>
              </div>
            )}

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
