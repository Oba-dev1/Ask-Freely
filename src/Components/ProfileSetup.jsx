// src/Components/ProfileSetup.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ref as dbRef, update, get } from 'firebase/database';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { database, storage } from '../Firebase/config';
import { useAuth } from '../context/AuthContext';

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

      // Check for duplicate organization name using separate collection
      console.log('=== Checking for Duplicate Organization Name ===');
      const orgNameKey = organizationName.trim().toLowerCase().replace(/[.#$[\]]/g, '_');
      const orgNameRef = dbRef(database, `organizationNames/${orgNameKey}`);
      console.log('Checking organization name key:', orgNameKey);

      const orgSnapshot = await get(orgNameRef);

      if (orgSnapshot.exists() && orgSnapshot.val().userId !== currentUser.uid) {
        console.log('❌ Duplicate organization name found:', orgSnapshot.val());
        setError('This organization name is already taken. Please choose a different name.');
        setLoading(false);
        return;
      }

      console.log('✅ Organization name is available');

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

      // Register organization name in separate collection
      console.log('=== Registering Organization Name ===');
      const orgNameData = {
        userId: currentUser.uid,
        organizationName: organizationName.trim(),
        createdAt: new Date().toISOString()
      };
      await update(orgNameRef, orgNameData);
      console.log('✅ Organization name registered');

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
    <div className="min-h-screen bg-white flex justify-center items-center p-8 sm:p-6 xs:p-4 font-sans relative overflow-hidden">
      {/* Decorative background circles */}
      <div className="absolute -top-[10%] -right-[10%] w-[600px] h-[600px] bg-primary/[0.03] rounded-full pointer-events-none" />
      <div className="absolute -bottom-[15%] -left-[10%] w-[700px] h-[700px] bg-primary/[0.02] rounded-full pointer-events-none" />

      <div className="w-full max-w-[650px] relative z-10">
        <div className="bg-white rounded-3xl p-10 md:p-8 sm:p-7 xs:p-5 shadow-[0_10px_40px_rgba(255,107,53,0.08)] border border-black/10 relative">
          {/* Decorative corner accents */}
          <div className="absolute top-0 right-0 w-[120px] h-[120px] bg-primary/[0.04] rounded-[0_24px_0_100%] pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-[100px] h-[100px] bg-primary/[0.03] rounded-[100%_0_0_24px] pointer-events-none" />

          {/* Header */}
          <header className="text-center mb-10 relative z-10">
            <div className="w-20 h-20 md:w-[70px] md:h-[70px] sm:w-[60px] sm:h-[60px] mx-auto mb-6 bg-primary/[0.08] rounded-[20px] flex items-center justify-center text-[2.5rem] md:text-[2rem] sm:text-[1.75rem] text-primary shadow-[0_4px_12px_rgba(255,107,53,0.15)]">
              <i className="fas fa-user-circle"></i>
            </div>
            <h1 className="text-[2.25rem] md:text-[2rem] sm:text-[1.85rem] font-extrabold text-black m-0 mb-2 tracking-tight leading-tight">
              Complete Your Profile
            </h1>
            <p className="text-neutral-500 text-[1.05rem] sm:text-base font-medium m-0">
              Tell us about your organization to get started
            </p>
          </header>

          {/* Progress Steps */}
          <div className="flex items-center justify-center mb-12 relative z-10">
            <div className="flex flex-col items-center gap-2">
              <div className="w-11 h-11 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-lg shadow-[0_4px_12px_rgba(16,185,129,0.3)]">
                1
              </div>
              <span className="text-[0.9rem] sm:text-[0.8rem] font-semibold text-emerald-500">Account Created</span>
            </div>
            <div className="w-20 md:w-[60px] sm:w-10 h-[3px] bg-black/10 mx-4 sm:mx-2 rounded -mt-6 sm:-mt-5" />
            <div className="flex flex-col items-center gap-2">
              <div className="w-11 h-11 rounded-full bg-primary text-white flex items-center justify-center font-bold text-lg shadow-[0_4px_12px_rgba(255,107,53,0.3)] animate-pulse">
                2
              </div>
              <span className="text-[0.9rem] sm:text-[0.8rem] font-semibold text-primary">Profile Setup</span>
            </div>
          </div>

          {error && (
            <div
              className="bg-red-500/[0.08] border border-red-500/20 text-red-600 py-3.5 px-4 rounded-xl mb-6 text-[0.95rem] font-medium flex items-center gap-2 relative z-10"
              role="alert"
            >
              <span>⚠️</span> {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="mt-8 relative z-10">
            {/* Organization Name */}
            <div className="mb-7">
              <label htmlFor="organizationName" className="block mb-2.5 font-semibold text-neutral-800 text-[0.95rem] sm:text-[0.9rem]">
                Organization Name <span className="text-red-600">*</span>
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
                className="w-full py-4 px-4 sm:py-3 sm:px-3.5 rounded-xl border-2 border-black/10 bg-white text-neutral-800 text-base font-medium transition-all placeholder:text-neutral-400 hover:border-primary/30 focus:border-primary focus:outline-none focus:shadow-[0_0_0_4px_rgba(255,107,53,0.15)] disabled:opacity-60 disabled:cursor-not-allowed"
              />
              <small className="block mt-2 text-[0.875rem] text-neutral-400 font-medium">
                This will appear on your events and dashboards
              </small>
            </div>

            {/* Event Type */}
            <div className="mb-7">
              <label htmlFor="eventType" className="block mb-2.5 font-semibold text-neutral-800 text-[0.95rem] sm:text-[0.9rem]">
                Event Type <span className="text-red-600">*</span>
              </label>
              <select
                id="eventType"
                value={eventType}
                onChange={(e) => setEventType(e.target.value)}
                required
                disabled={loading}
                className="w-full py-4 px-4 sm:py-3 sm:px-3.5 pr-10 rounded-xl border-2 border-black/10 bg-white text-neutral-800 text-base font-medium transition-all cursor-pointer appearance-none bg-[url('data:image/svg+xml,%3Csvg_xmlns=%27http://www.w3.org/2000/svg%27_width=%2712%27_height=%2712%27_viewBox=%270_0_12_12%27%3E%3Cpath_fill=%27%23666%27_d=%27M6_9L1_4h10z%27/%3E%3C/svg%3E')] bg-no-repeat bg-[right_1rem_center] hover:border-primary/30 focus:border-primary focus:outline-none focus:shadow-[0_0_0_3px_rgba(255,107,53,0.1)] disabled:opacity-60 disabled:cursor-not-allowed"
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
              <small className="block mt-2 text-[0.875rem] text-neutral-400 font-medium">
                This helps us personalize your experience
              </small>
            </div>

            {/* Logo Upload */}
            <div className="mb-7">
              <label className="block mb-2.5 font-semibold text-neutral-800 text-[0.95rem] sm:text-[0.9rem]">
                Organization Logo <span className="text-neutral-400 font-medium">(Optional)</span>
              </label>
              {!logoPreview ? (
                <div className="relative mb-2">
                  <input
                    type="file"
                    id="logoUpload"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={handleLogoChange}
                    disabled={loading}
                    className="hidden"
                  />
                  <label
                    htmlFor="logoUpload"
                    className="flex flex-col items-center justify-center py-12 px-8 sm:py-8 sm:px-4 border-2 border-dashed border-black/15 rounded-xl bg-primary/[0.02] cursor-pointer transition-all text-neutral-500 text-center hover:border-primary hover:bg-primary/[0.05] focus-within:outline-2 focus-within:outline-primary focus-within:outline-offset-2"
                  >
                    <i className="fas fa-cloud-upload-alt text-[2rem] text-primary mb-2"></i>
                    <p className="font-medium text-base text-neutral-800 my-2">Click to upload logo</p>
                    <small className="text-[0.875rem] text-neutral-400">JPG, PNG, or WebP (Max 2MB)</small>
                  </label>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4 p-6 border-2 border-black/10 rounded-xl bg-neutral-50">
                  <img src={logoPreview} alt="Logo preview" className="w-[150px] h-[150px] sm:w-[100px] sm:h-[100px] rounded-xl object-cover border-2 border-black/[0.08] bg-white" />
                  <button
                    type="button"
                    onClick={handleRemoveLogo}
                    className="py-3 px-5 rounded-[10px] border-2 border-red-600 bg-white text-red-600 font-semibold text-[0.95rem] cursor-pointer transition-all flex items-center gap-2 hover:bg-red-600 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={loading}
                  >
                    <i className="fas fa-times"></i> Remove
                  </button>
                </div>
              )}
              {uploadProgress > 0 && uploadProgress < 100 && (
                <div className="my-6 p-4 bg-primary/[0.05] rounded-xl border border-primary/15">
                  <div className="w-full h-2 bg-black/10 rounded overflow-hidden mb-2">
                    <div className="h-full bg-primary rounded transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                  </div>
                  <small className="text-[0.875rem] font-semibold text-primary text-center block">Uploading... {uploadProgress}%</small>
                </div>
              )}
              <small className="block mt-2 text-[0.875rem] text-neutral-400 font-medium">
                Your logo will appear on event pages and materials
              </small>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 mt-8 sm:flex-col-reverse">
              <button
                type="button"
                onClick={handleSkip}
                className="flex-1 py-4 px-6 sm:py-3 sm:px-4 rounded-xl font-bold text-[1.05rem] sm:text-base cursor-pointer transition-all border-2 border-black/10 bg-white text-neutral-500 flex items-center justify-center hover:bg-neutral-100 hover:text-neutral-800 hover:border-black/15 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"
                disabled={loading}
              >
                Skip for now
              </button>
              <button
                type="submit"
                className="flex-1 py-4 px-6 sm:py-3 sm:px-4 rounded-xl font-bold text-[1.05rem] sm:text-base cursor-pointer transition-all border-none bg-primary text-white shadow-[0_4px_14px_rgba(255,107,53,0.3)] flex items-center justify-center hover:bg-orange-600 hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(255,107,53,0.4)] active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"
                disabled={loading || !organizationName.trim() || !eventType}
              >
                {loading ? 'Saving...' : 'Complete Setup'}
              </button>
            </div>
          </form>

          {/* Help Text */}
          <div className="mt-8 pt-6 border-t border-black/[0.08] relative z-10">
            <p className="flex items-center justify-center gap-2 text-[0.9rem] text-neutral-400 font-medium m-0 text-center">
              <i className="fas fa-info-circle text-primary text-base"></i>
              You can update this information anytime in your settings
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfileSetup;
