// src/config/adminConfig.js
// Super Admin Configuration
// This file defines who has super admin access to the platform

// Whitelisted admin emails - these users can access the admin panel
// SECURITY: Both email AND database flag (superAdmin: true) are required
export const ADMIN_EMAILS = [
  'bandechop01@gmail.com',
  'anthonyoladele@yahoo.com'
];

// Check if an email is in the admin whitelist
export const isAdminEmail = (email) => {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase());
};

// Admin panel feature flags
export const ADMIN_FEATURES = {
  userManagement: true,
  eventManagement: true,
  analytics: true,
  activityFeed: true,
  bulkActions: true
};
