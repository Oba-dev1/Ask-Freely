// netlify/functions/process-email-queue.js
// Processes queued emails from Firebase and sends them via Resend

const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getDatabase } = require('firebase-admin/database');

// Initialize Firebase Admin (only once)
let db;
function getFirebaseDb() {
  if (!db) {
    if (getApps().length === 0) {
      const serviceAccount = {
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      };

      initializeApp({
        credential: cert(serviceAccount),
        databaseURL: process.env.FIREBASE_DATABASE_URL,
      });
    }
    db = getDatabase();
  }
  return db;
}

// Email templates (server-side version)
const EMAIL_TEMPLATES = {
  WELCOME: 'welcome',
  ANNOUNCEMENT: 'announcement',
  ACCOUNT_WARNING: 'account_warning',
  ACCOUNT_DISABLED: 'account_disabled',
  ACCOUNT_ENABLED: 'account_enabled',
  NEW_QUESTION: 'new_question',
  EVENT_REMINDER: 'event_reminder',
  VERIFICATION_REMINDER: 'verification_reminder',
};

// Generate HTML email content
function generateEmailHTML(template, data) {
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
            <h1 style="color: white; margin: 0; font-size: 24px;">📢 ${data.title || 'Announcement'}</h1>
          </div>
          <div style="${contentStyles}">
            <p>${data.message || ''}</p>
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
            <p>You have a new question on <strong>${data.eventTitle || 'your event'}</strong></p>
            <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #FF6B35;">
              <p style="margin: 0; font-style: italic;">"${data.questionPreview || ''}"</p>
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
    [EMAIL_TEMPLATES.VERIFICATION_REMINDER]: `
      <div style="${baseStyles}">
        <div style="${cardStyles}">
          <div style="${headerStyles}">
            <h1 style="color: white; margin: 0; font-size: 24px;">📧 Verify Your Email</h1>
          </div>
          <div style="${contentStyles}">
            <p>Hi there!</p>
            <p>We noticed you haven't verified your email address yet. To access your Ask Freely dashboard and start creating events, please verify your email.</p>
            <p><strong>How to verify:</strong></p>
            <ol style="padding-left: 20px;">
              <li>Check your inbox for the original verification email from Ask Freely</li>
              <li>Click the verification link in that email</li>
              <li>If you can't find it, try logging in and we'll send a new verification email</li>
            </ol>
            <p style="text-align: center; margin-top: 30px;">
              <a href="https://askfreely.live/login" style="display: inline-block; background: #FF6B35; color: white; padding: 12px 30px; border-radius: 8px; text-decoration: none; font-weight: 600;">Go to Login</a>
            </p>
            <p style="margin-top: 20px; color: #666; font-size: 14px;">Once logged in, you can request a new verification email if needed.</p>
          </div>
          <div style="${footerStyles}">
            <p>Ask Freely - Making every voice heard</p>
            <p style="color: #999; font-size: 11px;">If you didn't create an account, you can safely ignore this email.</p>
          </div>
        </div>
      </div>
    `,
  };

  return templates[template] || templates[EMAIL_TEMPLATES.ANNOUNCEMENT];
}

// Send email via Resend
async function sendEmailViaResend(to, subject, html) {
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  // Use custom domain if verified, otherwise use Resend's test domain
  const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'Ask Freely <onboarding@resend.dev>';

  if (!RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY not configured');
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: [to],
      subject: subject,
      html: html,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`Resend API error: ${response.status} - ${JSON.stringify(errorData)}`);
  }

  return response.json();
}

// Main handler
exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  // Only allow POST (for manual trigger) or scheduled invocation
  if (event.httpMethod !== 'POST' && !event.headers['x-netlify-event']) {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const database = getFirebaseDb();

    // Get pending emails from queue
    const queueRef = database.ref('emailQueue');
    const pendingSnapshot = await queueRef
      .orderByChild('status')
      .equalTo('pending')
      .limitToFirst(10) // Process 10 at a time
      .once('value');

    const pendingEmails = pendingSnapshot.val();

    if (!pendingEmails) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ message: 'No pending emails', processed: 0 }),
      };
    }

    let processed = 0;
    let failed = 0;
    const results = [];

    for (const [emailId, emailData] of Object.entries(pendingEmails)) {
      try {
        // Mark as processing
        await queueRef.child(emailId).update({
          status: 'processing',
          processingStartedAt: new Date().toISOString()
        });

        // Generate HTML content
        const html = generateEmailHTML(emailData.template, emailData.data || {});

        // Send via Resend
        const sendResult = await sendEmailViaResend(
          emailData.to,
          emailData.subject,
          html
        );

        // Mark as sent
        await queueRef.child(emailId).update({
          status: 'sent',
          sentAt: new Date().toISOString(),
          resendId: sendResult.id,
        });

        processed++;
        results.push({ id: emailId, status: 'sent', to: emailData.to });

      } catch (sendError) {
        console.error(`Failed to send email ${emailId}:`, sendError);

        // Mark as failed
        await queueRef.child(emailId).update({
          status: 'failed',
          failedAt: new Date().toISOString(),
          error: sendError.message,
        });

        failed++;
        results.push({ id: emailId, status: 'failed', error: sendError.message });
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: `Processed ${processed} emails, ${failed} failed`,
        processed,
        failed,
        results,
      }),
    };

  } catch (error) {
    console.error('Email queue processing error:', error);

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to process email queue' }),
    };
  }
};
