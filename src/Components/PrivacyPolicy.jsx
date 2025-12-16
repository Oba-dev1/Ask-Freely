// src/Components/PrivacyPolicy.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import './LegalPages.css';

function PrivacyPolicy() {
  const lastUpdated = "December 16, 2024";

  return (
    <div className="legal-page">
      <nav className="navbar">
        <div className="nav-container">
          <Link to="/" className="logo">
            <span className="logo-icon"><i className="fas fa-comments"></i></span>
            <span className="logo-text">Ask Freely</span>
          </Link>
          <Link to="/" className="nav-link">Back to Home</Link>
        </div>
      </nav>

      <div className="legal-container">
        <header className="legal-header">
          <h1>Privacy Policy</h1>
          <p className="last-updated">Last Updated: {lastUpdated}</p>
        </header>

        <div className="legal-content">
          <section>
            <h2>1. Introduction</h2>
            <p>
              Ask Freely ("we," "our," or "us") respects your privacy and is committed to protecting your personal
              information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information
              when you use our Q&A platform service ("Service").
            </p>
            <p>
              By using the Service, you consent to the data practices described in this policy. If you do not agree
              with this Privacy Policy, please do not use the Service.
            </p>
          </section>

          <section>
            <h2>2. Information We Collect</h2>

            <h3>2.1 Information You Provide Directly</h3>
            <p>We collect information that you voluntarily provide when using the Service:</p>
            <ul>
              <li><strong>Account Information:</strong> Email address, password (encrypted), organization name, event type</li>
              <li><strong>Profile Information:</strong> Organization logo, profile photo (if using Google OAuth)</li>
              <li><strong>Event Information:</strong> Event titles, descriptions, dates, times, branding (logos, colors, taglines)</li>
              <li><strong>Questions:</strong> Question text, author name (optional), anonymous submission preference</li>
              <li><strong>Program Information:</strong> Event agenda items, descriptions, notes</li>
            </ul>

            <h3>2.2 Information Collected Automatically</h3>
            <p>When you use the Service, we automatically collect certain information:</p>
            <ul>
              <li><strong>Usage Data:</strong> Pages visited, features used, time spent, actions taken</li>
              <li><strong>Device Information:</strong> Browser type, operating system, device type</li>
              <li><strong>IP Address:</strong> Your IP address for security and analytics purposes</li>
              <li><strong>Cookies:</strong> Session cookies, authentication tokens (see Section 8)</li>
              <li><strong>Timestamps:</strong> Account creation, last login, question submission times</li>
            </ul>

            <h3>2.3 Information from Third-Party Services</h3>
            <p>If you sign up or log in using Google OAuth, we receive:</p>
            <ul>
              <li>Your Google account email address</li>
              <li>Your name (if provided by Google)</li>
              <li>Your profile photo (if available)</li>
              <li>Email verification status</li>
            </ul>
            <p>
              We do not receive your Google password. Your use of Google OAuth is subject to Google's Privacy Policy.
            </p>
          </section>

          <section>
            <h2>3. How We Use Your Information</h2>
            <p>We use the collected information for the following purposes:</p>

            <h3>3.1 To Provide and Maintain the Service</h3>
            <ul>
              <li>Create and manage your account</li>
              <li>Authenticate your identity</li>
              <li>Enable event creation and management</li>
              <li>Facilitate question submission and moderation</li>
              <li>Display event branding and customization</li>
              <li>Provide real-time updates and synchronization</li>
            </ul>

            <h3>3.2 To Improve and Optimize the Service</h3>
            <ul>
              <li>Analyze usage patterns and trends</li>
              <li>Identify and fix bugs and technical issues</li>
              <li>Develop new features and functionality</li>
              <li>Conduct research and analytics</li>
              <li>Monitor performance and uptime</li>
            </ul>

            <h3>3.3 To Communicate With You</h3>
            <ul>
              <li>Send email verification messages</li>
              <li>Send password reset emails</li>
              <li>Respond to your inquiries and support requests</li>
              <li>Send important service announcements and updates</li>
              <li>Notify you of changes to our policies (with your consent)</li>
            </ul>

            <h3>3.4 To Ensure Security and Prevent Fraud</h3>
            <ul>
              <li>Detect and prevent spam and abuse</li>
              <li>Enforce rate limiting and usage policies</li>
              <li>Verify human users (via reCAPTCHA)</li>
              <li>Protect against unauthorized access</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2>4. How We Share Your Information</h2>
            <p>We do not sell, trade, or rent your personal information to third parties. We may share your information in the following limited circumstances:</p>

            <h3>4.1 With Service Providers</h3>
            <p>We use third-party service providers to support the Service:</p>
            <ul>
              <li><strong>Firebase (Google Cloud):</strong> Authentication, database, and file storage</li>
              <li><strong>Google reCAPTCHA:</strong> Spam and bot protection</li>
              <li><strong>Netlify:</strong> Web hosting and content delivery</li>
              <li><strong>Analytics Services:</strong> Usage analytics and monitoring (if applicable)</li>
            </ul>
            <p>
              These providers have access to your information only to perform services on our behalf and are obligated
              to protect your information and not use it for other purposes.
            </p>

            <h3>4.2 Within Events</h3>
            <p>Information shared within the context of events:</p>
            <ul>
              <li><strong>Questions:</strong> Submitted questions are visible to event organizers and MCs</li>
              <li><strong>Author Names:</strong> If you provide a name (non-anonymous), it's visible to organizers/MCs</li>
              <li><strong>Anonymous Questions:</strong> Marked as "Anonymous" to protect your identity</li>
              <li><strong>Event Branding:</strong> Organization logos and event details are visible to all participants</li>
            </ul>

            <h3>4.3 For Legal Reasons</h3>
            <p>We may disclose your information if required to do so by law or in response to:</p>
            <ul>
              <li>Valid legal process (subpoenas, court orders)</li>
              <li>Requests from law enforcement or government agencies</li>
              <li>Protection of our rights, property, or safety</li>
              <li>Protection of users' rights, property, or safety</li>
              <li>Prevention of fraud or illegal activities</li>
            </ul>

            <h3>4.4 Business Transfers</h3>
            <p>
              If Ask Freely is involved in a merger, acquisition, sale of assets, or bankruptcy, your information may
              be transferred as part of that transaction. We will notify you before your information is transferred
              and becomes subject to a different privacy policy.
            </p>
          </section>

          <section>
            <h2>5. Data Storage and Security</h2>

            <h3>5.1 Where We Store Your Data</h3>
            <p>
              Your data is stored in Firebase (Google Cloud Platform) data centers. Firebase uses industry-standard
              security measures to protect your data, including encryption in transit and at rest.
            </p>

            <h3>5.2 How We Protect Your Data</h3>
            <p>We implement reasonable security measures to protect your information:</p>
            <ul>
              <li><strong>Encryption:</strong> All data transmitted over the internet is encrypted using HTTPS/TLS</li>
              <li><strong>Password Security:</strong> Passwords are hashed and encrypted before storage</li>
              <li><strong>Access Controls:</strong> Database security rules limit access to authorized users only</li>
              <li><strong>Authentication:</strong> Firebase Authentication with email verification and OAuth</li>
              <li><strong>Rate Limiting:</strong> Protection against spam and abuse</li>
              <li><strong>Monitoring:</strong> Regular security audits and monitoring for suspicious activity</li>
            </ul>

            <h3>5.3 Data Retention</h3>
            <p>
              We retain your information for as long as your account is active or as needed to provide the Service.
              You may request deletion of your account and associated data at any time by contacting us. We will
              delete your data within 30 days of your request, subject to legal and operational requirements.
            </p>
            <p>
              Deleted data may persist in backups for up to 90 days but will not be used or accessible except
              for disaster recovery purposes.
            </p>
          </section>

          <section>
            <h2>6. Your Rights and Choices</h2>

            <h3>6.1 Access and Update</h3>
            <p>You have the right to:</p>
            <ul>
              <li>Access your personal information stored in our Service</li>
              <li>Update or correct inaccurate information</li>
              <li>Change your organization name, logo, and event type</li>
              <li>Update your email address (subject to verification)</li>
            </ul>

            <h3>6.2 Delete Your Account</h3>
            <p>
              You may delete your account at any time by contacting us at [Your Support Email]. Upon deletion:
            </p>
            <ul>
              <li>Your account and profile information will be permanently deleted</li>
              <li>Your events and associated data will be removed</li>
              <li>Questions you submitted may be retained in anonymized form for analytics</li>
              <li>Some information may be retained for legal compliance (e.g., transaction records)</li>
            </ul>

            <h3>6.3 Export Your Data</h3>
            <p>
              Event organizers can export their event data (questions, analytics) in CSV, JSON, or text format
              directly from the MC/Host dashboard.
            </p>

            <h3>6.4 Opt-Out of Communications</h3>
            <p>
              You can opt out of promotional emails by following the unsubscribe link in any marketing email.
              However, you cannot opt out of service-related emails (e.g., email verification, password reset)
              as they are necessary for the Service to function.
            </p>

            <h3>6.5 Do Not Track</h3>
            <p>
              Some browsers have a "Do Not Track" feature that lets you tell websites not to track your online
              activities. We do not currently respond to Do Not Track signals, as there is no industry standard
              for how to respond to such signals.
            </p>
          </section>

          <section>
            <h2>7. Children's Privacy</h2>
            <p>
              The Service is not intended for children under 13 years of age. We do not knowingly collect personal
              information from children under 13. If you are a parent or guardian and believe your child has provided
              us with personal information, please contact us immediately. We will delete such information from our
              systems promptly.
            </p>
          </section>

          <section>
            <h2>8. Cookies and Tracking Technologies</h2>

            <h3>8.1 What Are Cookies</h3>
            <p>
              Cookies are small text files stored on your device by your browser. We use cookies and similar
              technologies to authenticate users, remember preferences, and improve the Service.
            </p>

            <h3>8.2 Types of Cookies We Use</h3>
            <ul>
              <li><strong>Essential Cookies:</strong> Required for authentication and core functionality</li>
              <li><strong>Preference Cookies:</strong> Remember your settings and preferences</li>
              <li><strong>Analytics Cookies:</strong> Help us understand how you use the Service</li>
              <li><strong>Security Cookies:</strong> Detect and prevent fraudulent activity</li>
            </ul>

            <h3>8.3 Third-Party Cookies</h3>
            <p>Third-party services we use may set their own cookies:</p>
            <ul>
              <li><strong>Firebase:</strong> Authentication and session management</li>
              <li><strong>Google reCAPTCHA:</strong> Spam detection and bot prevention</li>
              <li><strong>Google Analytics:</strong> Usage analytics (if enabled)</li>
            </ul>

            <h3>8.4 Managing Cookies</h3>
            <p>
              You can control cookies through your browser settings. However, disabling cookies may affect the
              functionality of the Service, including the ability to log in and use certain features.
            </p>
          </section>

          <section>
            <h2>9. Third-Party Links</h2>
            <p>
              The Service may contain links to third-party websites or services (e.g., Google OAuth, social media).
              We are not responsible for the privacy practices or content of these third-party sites. We encourage
              you to read the privacy policies of any third-party sites you visit.
            </p>
          </section>

          <section>
            <h2>10. International Data Transfers</h2>
            <p>
              Your information may be transferred to and maintained on servers located outside your state, province,
              country, or other governmental jurisdiction where data protection laws may differ from those in your
              jurisdiction.
            </p>
            <p>
              By using the Service, you consent to the transfer of your information to Firebase (Google Cloud)
              data centers, which may be located globally. Firebase complies with applicable data protection
              frameworks and regulations.
            </p>
          </section>

          <section>
            <h2>11. California Privacy Rights (CCPA)</h2>
            <p>
              If you are a California resident, you have additional rights under the California Consumer Privacy
              Act (CCPA):
            </p>
            <ul>
              <li><strong>Right to Know:</strong> Request disclosure of personal information we collect about you</li>
              <li><strong>Right to Delete:</strong> Request deletion of your personal information</li>
              <li><strong>Right to Opt-Out:</strong> Opt out of the sale of personal information (we do not sell your data)</li>
              <li><strong>Right to Non-Discrimination:</strong> Not be discriminated against for exercising your rights</li>
            </ul>
            <p>
              To exercise these rights, contact us at [Your Support Email]. We will verify your identity before
              processing your request.
            </p>
          </section>

          <section>
            <h2>12. European Privacy Rights (GDPR)</h2>
            <p>
              If you are in the European Economic Area (EEA), you have rights under the General Data Protection
              Regulation (GDPR):
            </p>
            <ul>
              <li><strong>Right of Access:</strong> Request copies of your personal data</li>
              <li><strong>Right to Rectification:</strong> Correct inaccurate or incomplete data</li>
              <li><strong>Right to Erasure:</strong> Request deletion of your data</li>
              <li><strong>Right to Restrict Processing:</strong> Limit how we use your data</li>
              <li><strong>Right to Data Portability:</strong> Receive your data in a portable format</li>
              <li><strong>Right to Object:</strong> Object to processing of your data</li>
              <li><strong>Right to Lodge a Complaint:</strong> File a complaint with your local data protection authority</li>
            </ul>
            <p>
              Our legal basis for processing your data is your consent, contract performance, and legitimate interests
              in providing and improving the Service.
            </p>
          </section>

          <section>
            <h2>13. Changes to This Privacy Policy</h2>
            <p>
              We may update this Privacy Policy from time to time to reflect changes in our practices, technology,
              legal requirements, or other factors. We will notify you of material changes by:
            </p>
            <ul>
              <li>Updating the "Last Updated" date at the top of this policy</li>
              <li>Sending an email notification to registered users</li>
              <li>Posting a prominent notice on the Service</li>
            </ul>
            <p>
              Your continued use of the Service after changes become effective constitutes acceptance of the revised
              Privacy Policy. We encourage you to review this Privacy Policy periodically.
            </p>
          </section>

          <section>
            <h2>14. Contact Us</h2>
            <p>
              If you have questions, concerns, or requests regarding this Privacy Policy or our data practices,
              please contact us at:
            </p>
            <div className="contact-info">
              <p><strong>Ask Freely Privacy Team</strong></p>
              <p>Email: [Your Privacy Email]</p>
              <p>Website: <Link to="/">ask-freely.com</Link></p>
            </div>
            <p>
              We will respond to your inquiry within 30 days.
            </p>
          </section>

          <section>
            <h2>15. Acknowledgment</h2>
            <p>
              BY USING THE SERVICE, YOU ACKNOWLEDGE THAT YOU HAVE READ AND UNDERSTOOD THIS PRIVACY POLICY AND
              CONSENT TO THE COLLECTION, USE, AND DISCLOSURE OF YOUR INFORMATION AS DESCRIBED HEREIN.
            </p>
          </section>
        </div>

        <footer className="legal-footer">
          <p>
            <Link to="/terms-of-service">Terms of Service</Link>
            {' · '}
            <Link to="/">Home</Link>
          </p>
        </footer>
      </div>
    </div>
  );
}

export default PrivacyPolicy;
