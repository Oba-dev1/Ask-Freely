// src/Components/ProfileSetup.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ref as dbRef, update } from 'firebase/database';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { database, storage } from '../Firebase/config';
import { useAuth } from '../context/AuthContext';
import './ProfileSetup.css';

function ProfileSetup() {
  const [organizationName, setOrganizationName] = useState('');
  const [eventType, setEventType] = useState('');
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { currentUser, loadUserProfile } = useAuth();

  const handleSkip = () => {
    // Allow users to skip and go straight to dashboard
    navigate('/organizer/dashboard');
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError('Please upload a valid image file (JPG, PNG, or WebP)');
      return;
    }

    // Validate file size (max 2MB)
    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
      setError('Image size must be less than 2MB');
      return;
    }

    setError('');
    setLogoFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!organizationName.trim()) {
      setError('Please enter your organization name');
      return;
    }

    if (!eventType) {
      setError('Please select an event type');
      return;
    }

    if (!currentUser) {
      setError('User not authenticated');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setUploadProgress(0);

      console.log('=== Profile Setup Debug ===');
      console.log('User ID:', currentUser.uid);
      console.log('Organization:', organizationName);
      console.log('Event Type:', eventType);
      console.log('Logo File:', logoFile ? logoFile.name : 'None');
      console.log('Storage object:', storage);
      console.log('Storage bucket:', storage?.app?.options?.storageBucket);

      let logoUrl = null;

      // Upload logo if provided
      if (logoFile) {
        try {
          console.log('Starting logo upload...');
          console.log('File:', logoFile.name, 'Size:', logoFile.size, 'Type:', logoFile.type);

          setUploadProgress(25);
          const fileExtension = logoFile.name.split('.').pop();
          const fileName = `${currentUser.uid}_${Date.now()}.${fileExtension}`;
          console.log('Generated filename:', fileName);

          const logoRef = storageRef(storage, `logos/${fileName}`);
          console.log('Storage ref created:', logoRef.fullPath);

          setUploadProgress(50);
          console.log('Uploading bytes...');
          const uploadResult = await uploadBytes(logoRef, logoFile);
          console.log('Upload result:', uploadResult);

          setUploadProgress(75);
          console.log('Getting download URL...');
          logoUrl = await getDownloadURL(logoRef);

          console.log('✅ Logo uploaded successfully!');
          console.log('Download URL:', logoUrl);
          setUploadProgress(100);
        } catch (uploadErr) {
          console.error('❌ Logo upload error:', uploadErr);
          console.error('Error code:', uploadErr.code);
          console.error('Error message:', uploadErr.message);
          console.error('Error details:', {
            name: uploadErr.name,
            code: uploadErr.code,
            message: uploadErr.message,
            customData: uploadErr.customData,
            serverResponse: uploadErr.serverResponse
          });
          setError(`Failed to upload logo: ${uploadErr.message}`);
          // Continue without logo rather than failing completely
          logoUrl = null;
        }
      }

      console.log('=== Saving Profile ===');
      console.log('Logo URL to save:', logoUrl);

      // Update user profile in database
      const userRef = dbRef(database, `users/${currentUser.uid}`);
      const profileData = {
        organizationName: organizationName.trim(),
        eventType: eventType,
        logoUrl: logoUrl,
        profileCompleted: true,
        profileCompletedAt: new Date().toISOString()
      };

      console.log('Profile data:', profileData);
      await update(userRef, profileData);

      console.log('✅ Profile updated successfully in database');

      // Reload user profile to update the context
      console.log('Reloading user profile...');
      await loadUserProfile(currentUser.uid);
      console.log('✅ Profile reloaded');

      console.log('Navigating to dashboard...');

      // Navigate to dashboard
      navigate('/organizer/dashboard');
    } catch (err) {
      console.error('❌ Profile setup error:', err);
      console.error('Error code:', err.code);
      console.error('Error message:', err.message);
      console.error('Error details:', {
        name: err.name,
        code: err.code,
        message: err.message,
        stack: err.stack
      });
      setError(`Failed to save profile: ${err.message || 'Please try again.'}`);
    } finally {
      console.log('=== Profile Setup Complete ===');
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

            {/* Event Type */}
            <div className="form-group">
              <label htmlFor="eventType">
                Event Type <span className="required">*</span>
              </label>
              <select
                id="eventType"
                value={eventType}
                onChange={(e) => setEventType(e.target.value)}
                required
                disabled={loading}
              >
                <option value="">Select event type...</option>
                <option value="town-hall">Town Hall / Community Meeting</option>
                <option value="conference">Conference / Seminar</option>
                <option value="church">Church / Religious Service</option>
                <option value="corporate">Corporate Event</option>
                <option value="wedding">Wedding / Celebration</option>
                <option value="workshop">Workshop / Training</option>
                <option value="other">Other</option>
              </select>
              <small className="field-hint">
                This helps us personalize your experience
              </small>
            </div>

            {/* Logo Upload */}
            <div className="form-group">
              <label>
                Organization Logo <span className="optional">(Optional)</span>
              </label>
              {!logoPreview ? (
                <div className="logo-upload-area">
                  <input
                    type="file"
                    id="logoUpload"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={handleLogoChange}
                    disabled={loading}
                    style={{ display: 'none' }}
                  />
                  <label htmlFor="logoUpload" className="upload-label">
                    <i className="fas fa-cloud-upload-alt"></i>
                    <p>Click to upload logo</p>
                    <small>JPG, PNG, or WebP (Max 2MB)</small>
                  </label>
                </div>
              ) : (
                <div className="logo-preview-area">
                  <img src={logoPreview} alt="Logo preview" className="logo-preview-image" />
                  <button
                    type="button"
                    onClick={handleRemoveLogo}
                    className="remove-logo-btn"
                    disabled={loading}
                  >
                    <i className="fas fa-times"></i> Remove
                  </button>
                </div>
              )}
              {uploadProgress > 0 && uploadProgress < 100 && (
                <div className="upload-progress">
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${uploadProgress}%` }}></div>
                  </div>
                  <small>Uploading... {uploadProgress}%</small>
                </div>
              )}
              <small className="field-hint">
                Your logo will appear on event pages and materials
              </small>
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
                disabled={loading || !organizationName.trim() || !eventType}
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
