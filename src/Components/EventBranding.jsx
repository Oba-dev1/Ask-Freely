// src/Components/EventBranding.jsx
import React, { useState } from 'react';
import './EventBranding.css';

function EventBranding({ branding, onChange }) {
  const [logoPreview, setLogoPreview] = useState(branding?.logoUrl || '');
  const [flyerPreview, setFlyerPreview] = useState(branding?.flyerUrl || '');

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result);
        onChange({
          ...branding,
          logoUrl: reader.result,
          logoFile: file
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFlyerChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFlyerPreview(reader.result);
        onChange({
          ...branding,
          flyerUrl: reader.result,
          flyerFile: file
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleColorChange = (e) => {
    onChange({
      ...branding,
      primaryColor: e.target.value
    });
  };

  const handleTextChange = (field, value) => {
    onChange({
      ...branding,
      [field]: value
    });
  };

  const removeLogo = () => {
    setLogoPreview('');
    onChange({
      ...branding,
      logoUrl: '',
      logoFile: null
    });
  };

  const removeFlyer = () => {
    setFlyerPreview('');
    onChange({
      ...branding,
      flyerUrl: '',
      flyerFile: null
    });
  };

  return (
    <div className="branding-section">
      <div className="branding-header">
        <h3>Event Branding & Customization</h3>
        <p className="branding-subtitle">
          Add your logo, event flyer, and customize the look to match your brand
        </p>
      </div>

      <div className="branding-grid">
        {/* Logo Upload */}
        <div className="branding-item">
          <label className="branding-label">
            <i className="fas fa-building"></i> Organization Logo
          </label>
          <p className="branding-hint">Recommended: 200x200px, PNG or JPG</p>

          {logoPreview ? (
            <div className="media-preview logo-preview">
              <img src={logoPreview} alt="Logo preview" />
              <button
                type="button"
                onClick={removeLogo}
                className="remove-media-btn"
                title="Remove logo"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
          ) : (
            <label className="upload-area">
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoChange}
                hidden
              />
              <div className="upload-content">
                <i className="fas fa-cloud-upload-alt"></i>
                <span>Click to upload logo</span>
                <small>PNG, JPG up to 5MB</small>
              </div>
            </label>
          )}
        </div>

        {/* Flyer Upload */}
        <div className="branding-item">
          <label className="branding-label">
            <i className="fas fa-image"></i> Event Flyer
          </label>
          <p className="branding-hint">Recommended: 1080x1920px (portrait)</p>

          {flyerPreview ? (
            <div className="media-preview flyer-preview">
              <img src={flyerPreview} alt="Flyer preview" />
              <button
                type="button"
                onClick={removeFlyer}
                className="remove-media-btn"
                title="Remove flyer"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
          ) : (
            <label className="upload-area">
              <input
                type="file"
                accept="image/*"
                onChange={handleFlyerChange}
                hidden
              />
              <div className="upload-content">
                <i className="fas fa-cloud-upload-alt"></i>
                <span>Click to upload flyer</span>
                <small>PNG, JPG up to 10MB</small>
              </div>
            </label>
          )}
        </div>
      </div>

      {/* Color Customization */}
      <div className="branding-colors">
        <div className="form-group">
          <label htmlFor="primaryColor">
            <i className="fas fa-palette"></i> Brand Color
          </label>
          <div className="color-picker-wrapper">
            <input
              type="color"
              id="primaryColor"
              value={branding?.primaryColor || '#667eea'}
              onChange={handleColorChange}
              className="color-input"
            />
            <input
              type="text"
              value={branding?.primaryColor || '#667eea'}
              onChange={handleColorChange}
              className="color-text-input"
              placeholder="#667eea"
              maxLength={7}
            />
          </div>
          <small>This color will be used for buttons and accents</small>
        </div>
      </div>

      {/* Additional Branding Info */}
      <div className="branding-text-fields">
        <div className="form-group">
          <label htmlFor="organizationName">
            <i className="fas fa-building"></i> Organization Name
          </label>
          <input
            type="text"
            id="organizationName"
            value={branding?.organizationName || ''}
            onChange={(e) => handleTextChange('organizationName', e.target.value)}
            placeholder="e.g., Grace Community Church"
          />
          <small>Displayed on event pages and materials</small>
        </div>

        <div className="form-group">
          <label htmlFor="tagline">
            <i className="fas fa-quote-left"></i> Event Tagline (Optional)
          </label>
          <input
            type="text"
            id="tagline"
            value={branding?.tagline || ''}
            onChange={(e) => handleTextChange('tagline', e.target.value)}
            placeholder="e.g., Building Community Through Conversation"
            maxLength={100}
          />
          <small>A short, catchy phrase for your event</small>
        </div>
      </div>
    </div>
  );
}

export default EventBranding;
