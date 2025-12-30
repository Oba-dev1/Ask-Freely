// src/Components/EventBranding.jsx
import React, { useState } from 'react';

function EventBranding({ branding, onChange }) {
  const [imagePreview, setImagePreview] = useState(branding?.flyerUrl || '');

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
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

  const selectPresetColor = (color) => {
    onChange({
      ...branding,
      primaryColor: color
    });
  };

  const presetColors = [
    { name: 'Orange', color: '#FF6B35' },
    { name: 'Red', color: '#EF4444' },
    { name: 'Pink', color: '#EC4899' },
    { name: 'Purple', color: '#8B5CF6' },
    { name: 'Indigo', color: '#6366F1' },
    { name: 'Blue', color: '#3B82F6' },
    { name: 'Cyan', color: '#06B6D4' },
    { name: 'Teal', color: '#14B8A6' },
    { name: 'Green', color: '#22C55E' },
    { name: 'Yellow', color: '#F59E0B' },
    { name: 'Gray', color: '#6B7280' },
    { name: 'Black', color: '#1F2937' },
  ];

  const handleTextChange = (field, value) => {
    onChange({
      ...branding,
      [field]: value
    });
  };

  const removeImage = () => {
    setImagePreview('');
    onChange({
      ...branding,
      flyerUrl: '',
      flyerFile: null
    });
  };

  return (
    <div className="bg-primary/[0.02] border border-black/[0.08] rounded-[14px] p-8 md:p-6 sm:p-5 mb-8">
      <div className="mb-8">
        <h3 className="m-0 mb-2 text-[1.4rem] md:text-[1.2rem] text-neutral-800 font-bold">Event Branding & Customization</h3>
        <p className="m-0 text-neutral-500 text-[0.95rem] md:text-[0.9rem] leading-relaxed">
          Upload your event image and customize the look to match your brand
        </p>
      </div>

      {/* Event Image Upload - Flexible for banners or flyers */}
      <div className="mb-8">
        <div className="flex flex-col">
          <label className="flex items-center gap-2 font-semibold text-neutral-800 text-[0.95rem] mb-2">
            <i className="fas fa-image text-primary text-[0.9rem]"></i> Event Image
          </label>
          <p className="m-0 mb-4 text-neutral-500 text-[0.85rem]">Banner (1200×300px) or Flyer (1080×1920px) - any aspect ratio accepted</p>

          {imagePreview ? (
            <div className="relative rounded-xl overflow-hidden border border-black/[0.12] bg-black/[0.02] max-w-full max-h-[600px] md:max-h-[400px] flex items-center justify-center">
              <img src={imagePreview} alt="Preview of event banner or flyer" className="max-h-[600px] md:max-h-[400px] w-auto max-w-full object-contain block bg-white" />
              <button
                type="button"
                onClick={removeImage}
                className="absolute top-2 right-2 w-8 h-8 bg-red-600/90 border-none rounded-full text-white cursor-pointer flex items-center justify-center text-[0.9rem] transition-all z-10 hover:bg-red-600 hover:scale-110"
                title="Remove"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
          ) : (
            <label className="border-2 border-dashed border-black/15 rounded-xl p-8 md:p-6 sm:p-5 text-center cursor-pointer transition-all bg-white min-h-[200px] md:min-h-[180px] sm:min-h-[160px] flex items-center justify-center hover:border-primary/40 hover:bg-primary/[0.03]">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                hidden
              />
              <div className="flex flex-col items-center gap-3">
                <i className="fas fa-cloud-upload-alt text-[2.5rem] md:text-[2rem] sm:text-[1.75rem] text-primary opacity-70"></i>
                <span className="text-neutral-800 font-semibold text-base sm:text-[0.95rem]">Click to upload event image</span>
                <small className="text-neutral-500 text-[0.85rem]">PNG, JPG up to 10MB · Banner or Flyer format</small>
              </div>
            </label>
          )}
        </div>
      </div>

      {/* Color Customization */}
      <div className="bg-primary/[0.02] border border-black/[0.08] rounded-xl p-6 mb-8">
        <div className="mb-0">
          <label htmlFor="primaryColor" className="flex items-center gap-2 font-semibold text-neutral-800 text-[0.95rem] mb-2">
            <i className="fas fa-palette text-primary text-[0.9rem]"></i> Brand Color
          </label>

          {/* Preset Colors */}
          <div className="grid grid-cols-[repeat(auto-fill,minmax(50px,1fr))] md:grid-cols-6 gap-3 mb-6">
            {presetColors.map((preset) => (
              <button
                key={preset.color}
                type="button"
                className={`w-full aspect-square border-[3px] rounded-xl cursor-pointer transition-all flex items-center justify-center shadow-[0_2px_8px_rgba(0,0,0,0.1)] relative hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(0,0,0,0.15)] ${(branding?.primaryColor || '#FF6B35') === preset.color ? 'border-neutral-800 shadow-[0_4px_16px_rgba(0,0,0,0.2)]' : 'border-transparent'}`}
                style={{ backgroundColor: preset.color }}
                onClick={() => selectPresetColor(preset.color)}
                title={preset.name}
              >
                {(branding?.primaryColor || '#FF6B35') === preset.color && (
                  <i className="fas fa-check text-white text-xl drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]"></i>
                )}
              </button>
            ))}
          </div>

          {/* Custom Color Picker */}
          <div className="mt-4">
            <div className="flex items-center gap-3 mb-2">
              <div
                className="w-[60px] h-[60px] rounded-xl border-[3px] border-black/10 cursor-pointer transition-all relative overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.1)] hover:border-black/20 hover:scale-105 hover:shadow-[0_4px_12px_rgba(0,0,0,0.15)]"
                style={{ backgroundColor: branding?.primaryColor || '#FF6B35' }}
              >
                <input
                  type="color"
                  id="primaryColor"
                  value={branding?.primaryColor || '#FF6B35'}
                  onChange={handleColorChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>
              <input
                type="text"
                value={branding?.primaryColor || '#FF6B35'}
                onChange={handleColorChange}
                className="flex-1 max-w-[150px] md:max-w-full py-3.5 px-4 rounded-xl border-2 border-black/10 bg-white text-neutral-800 text-[1.0625rem] font-mono font-semibold transition-all uppercase focus:outline-none focus:border-primary focus:bg-primary/[0.02] focus:shadow-[0_0_0_4px_rgba(255,107,53,0.08)]"
                placeholder="#FF6B35"
                maxLength={7}
              />
            </div>
            <small className="block text-neutral-500 text-[0.875rem] mt-2">Choose a preset or enter a custom hex color</small>
          </div>
        </div>
      </div>

      {/* Additional Branding Info */}
      <div className="grid grid-cols-2 md:grid-cols-1 gap-6 md:gap-4">
        <div className="mb-0">
          <label htmlFor="organizationName" className="flex items-center gap-2 font-semibold text-neutral-800 text-[0.95rem] mb-2">
            <i className="fas fa-building text-primary text-[0.9rem]"></i> Organization Name
          </label>
          <input
            type="text"
            id="organizationName"
            value={branding?.organizationName || ''}
            onChange={(e) => handleTextChange('organizationName', e.target.value)}
            placeholder="e.g., Grace Community Church"
            className="w-full py-3 px-4 rounded-[10px] border-[1.5px] border-neutral-200 bg-white text-neutral-900 text-[0.9375rem] transition-all placeholder:text-neutral-400 focus:outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgba(255,107,53,0.1)]"
          />
          <small className="block mt-2 text-neutral-500 text-[0.8125rem]">Displayed on event pages and materials</small>
        </div>

        <div className="mb-0">
          <label htmlFor="tagline" className="flex items-center gap-2 font-semibold text-neutral-800 text-[0.95rem] mb-2">
            <i className="fas fa-quote-left text-primary text-[0.9rem]"></i> Event Tagline (Optional)
          </label>
          <input
            type="text"
            id="tagline"
            value={branding?.tagline || ''}
            onChange={(e) => handleTextChange('tagline', e.target.value)}
            placeholder="e.g., Building Community Through Conversation"
            maxLength={100}
            className="w-full py-3 px-4 rounded-[10px] border-[1.5px] border-neutral-200 bg-white text-neutral-900 text-[0.9375rem] transition-all placeholder:text-neutral-400 focus:outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgba(255,107,53,0.1)]"
          />
          <small className="block mt-2 text-neutral-500 text-[0.8125rem]">A short, catchy phrase for your event</small>
        </div>
      </div>
    </div>
  );
}

export default EventBranding;
