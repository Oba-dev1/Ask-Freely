// src/services/emailService.js
/**
 * Email Service for Ask Freely
 *
 * NOTE: Resend requires a server-side implementation.
 * This service is designed to work with a Netlify serverless function.
 *
 * For now, email sending is queued in Firebase and can be processed
 * by a backend function. The UI will work with in-app notifications.
 */

import { ref, push } from 'firebase/database';
import { database } from '../Firebase/config';

// Email templates
export const EMAIL_TEMPLATES = {
  WELCOME: 'welcome',
  ANNOUNCEMENT: 'announcement',
  ACCOUNT_WARNING: 'account_warning',
  ACCOUNT_DISABLED: 'account_disabled',
  ACCOUNT_ENABLED: 'account_enabled',
  NEW_QUESTION: 'new_question',
  EVENT_REMINDER: 'event_reminder',
};

/**
 * Queue an email to be sent
 * This stores the email in Firebase for processing by a serverless function
 */
export async function queueEmail(to, subject, template, data = {}) {
  try {
    const emailQueueRef = ref(database, 'emailQueue');
    await push(emailQueueRef, {
      to,
      subject,
      template,
      data,
      status: 'pending',
      createdAt: new Date().toISOString(),
    });
    return { success: true };
  } catch (error) {
    console.error('Error queuing email:', error);
    return { success: false, error };
  }
}

/**
 * Send announcement email to a user
 */
export async function sendAnnouncementEmail(userEmail, title, message) {
  return queueEmail(
    userEmail,
    `[Ask Freely] ${title}`,
    EMAIL_TEMPLATES.ANNOUNCEMENT,
    { title, message }
  );
}

/**
 * Send account status email
 */
export async function sendAccountStatusEmail(userEmail, status, reason = '') {
  const subjects = {
    disabled: '[Ask Freely] Your account has been disabled',
    enabled: '[Ask Freely] Your account has been re-enabled',
    warning: '[Ask Freely] Important notice about your account',
  };

  return queueEmail(
    userEmail,
    subjects[status] || '[Ask Freely] Account Update',
    status === 'disabled' ? EMAIL_TEMPLATES.ACCOUNT_DISABLED :
    status === 'enabled' ? EMAIL_TEMPLATES.ACCOUNT_ENABLED :
    EMAIL_TEMPLATES.ACCOUNT_WARNING,
    { status, reason }
  );
}

/**
 * Send new question notification email
 */
export async function sendNewQuestionEmail(userEmail, eventTitle, questionPreview) {
  return queueEmail(
    userEmail,
    `[Ask Freely] New question on "${eventTitle}"`,
    EMAIL_TEMPLATES.NEW_QUESTION,
    { eventTitle, questionPreview }
  );
}

/**
 * Generate HTML email content
 */
export function generateEmailHTML(template, data) {
  const baseStyles = `
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    background-color: #f5f5f5;
    padding: 40px 20px;
  `;

  const cardStyles = `
    max-width: 600px;
    margin: 0 auto;
    background: white;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    overflow: hidden;
  `;

  const headerStyles = `
    background: linear-gradient(135deg, #FF6B35 0%, #e55a2b 100%);
    padding: 30px;
    text-align: center;
  `;

  const contentStyles = `
    padding: 30px;
    color: #333;
    line-height: 1.6;
  `;

  const footerStyles = `
    background: #f9fafb;
    padding: 20px 30px;
    text-align: center;
    color: #666;
    font-size: 12px;
  `;

  const templates = {
    [EMAIL_TEMPLATES.ANNOUNCEMENT]: `
      <div style="${baseStyles}">
        <div style="${cardStyles}">
          <div style="${headerStyles}">
            <h1 style="color: white; margin: 0; font-size: 24px;">📢 ${data.title}</h1>
          </div>
          <div style="${contentStyles}">
            <p>${data.message}</p>
          </div>
          <div style="${footerStyles}">
            <p>This message was sent by Ask Freely</p>
            <p><a href="https://askfreely.live" style="color: #FF6B35;">Visit Ask Freely</a></p>
          </div>
        </div>
      </div>
    `,
    [EMAIL_TEMPLATES.ACCOUNT_DISABLED]: `
      <div style="${baseStyles}">
        <div style="${cardStyles}">
          <div style="${headerStyles}">
            <h1 style="color: white; margin: 0; font-size: 24px;">Account Notice</h1>
          </div>
          <div style="${contentStyles}">
            <p>Your Ask Freely account has been disabled.</p>
            ${data.reason ? `<p><strong>Reason:</strong> ${data.reason}</p>` : ''}
            <p>If you believe this is a mistake, please contact our support team.</p>
          </div>
          <div style="${footerStyles}">
            <p>Ask Freely Team</p>
          </div>
        </div>
      </div>
    `,
    [EMAIL_TEMPLATES.ACCOUNT_ENABLED]: `
      <div style="${baseStyles}">
        <div style="${cardStyles}">
          <div style="${headerStyles}">
            <h1 style="color: white; margin: 0; font-size: 24px;">Account Re-enabled</h1>
          </div>
          <div style="${contentStyles}">
            <p>Good news! Your Ask Freely account has been re-enabled.</p>
            <p>You can now log in and continue using all features.</p>
            <p style="text-align: center; margin-top: 30px;">
              <a href="https://askfreely.live/login" style="display: inline-block; background: #FF6B35; color: white; padding: 12px 30px; border-radius: 8px; text-decoration: none; font-weight: 600;">Log In Now</a>
            </p>
          </div>
          <div style="${footerStyles}">
            <p>Ask Freely Team</p>
          </div>
        </div>
      </div>
    `,
    [EMAIL_TEMPLATES.NEW_QUESTION]: `
      <div style="${baseStyles}">
        <div style="${cardStyles}">
          <div style="${headerStyles}">
            <h1 style="color: white; margin: 0; font-size: 24px;">❓ New Question</h1>
          </div>
          <div style="${contentStyles}">
            <p>You have a new question on <strong>${data.eventTitle}</strong></p>
            <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #FF6B35;">
              <p style="margin: 0; font-style: italic;">"${data.questionPreview}"</p>
            </div>
            <p style="text-align: center; margin-top: 30px;">
              <a href="https://askfreely.live/organizer/dashboard" style="display: inline-block; background: #FF6B35; color: white; padding: 12px 30px; border-radius: 8px; text-decoration: none; font-weight: 600;">View Questions</a>
            </p>
          </div>
          <div style="${footerStyles}">
            <p>Ask Freely - Making every voice heard</p>
          </div>
        </div>
      </div>
    `,
  };

  return templates[template] || templates[EMAIL_TEMPLATES.ANNOUNCEMENT];
}
