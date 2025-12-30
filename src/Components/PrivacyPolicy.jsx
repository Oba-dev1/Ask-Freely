// src/Components/PrivacyPolicy.jsx
import React from 'react';
import { Link } from 'react-router-dom';

function PrivacyPolicy() {
  const lastUpdated = "December 16, 2024";

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/98 backdrop-blur-lg border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-12 md:h-14">
            <Link to="/" className="inline-flex items-center gap-2 font-bold text-sm md:text-base text-ink hover:opacity-80 transition-opacity">
              <i className="fas fa-comments text-primary text-base md:text-lg"></i>
              <span className="font-['Space_Grotesk']">Ask Freely</span>
            </Link>
            <Link to="/" className="text-neutral-700 font-medium text-sm hover:text-primary transition-colors px-2.5 py-1.5 rounded-md hover:bg-primary/5">
              Back to Home
            </Link>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-12">
        {/* Header */}
        <header className="text-center mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-ink mb-2 font-['Space_Grotesk']">Privacy Policy</h1>
          <p className="text-neutral-500 text-sm">Last Updated: {lastUpdated}</p>
        </header>

        {/* Content */}
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6 md:p-8 space-y-6">
          <section>
            <h2 className="text-lg font-bold text-ink mb-3 font-['Space_Grotesk']">1. Introduction</h2>
            <p className="text-neutral-600 text-sm leading-relaxed mb-2">
              Ask Freely ("we," "our," or "us") respects your privacy and is committed to protecting your personal
              information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information
              when you use our Q&A platform service ("Service").
            </p>
            <p className="text-neutral-600 text-sm leading-relaxed">
              By using the Service, you consent to the data practices described in this policy. If you do not agree
              with this Privacy Policy, please do not use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-ink mb-3 font-['Space_Grotesk']">2. Information We Collect</h2>

            <h3 className="text-sm font-semibold text-ink mb-2">2.1 Information You Provide Directly</h3>
            <p className="text-neutral-600 text-sm leading-relaxed mb-2">We collect information that you voluntarily provide when using the Service:</p>
            <ul className="list-disc list-inside text-neutral-600 text-sm leading-relaxed space-y-1 mb-4 ml-2">
              <li><strong>Account Information:</strong> Email address, password (encrypted), organization name, event type</li>
              <li><strong>Profile Information:</strong> Organization logo, profile photo (if using Google OAuth)</li>
              <li><strong>Event Information:</strong> Event titles, descriptions, dates, times, branding (logos, colors, taglines)</li>
              <li><strong>Questions:</strong> Question text, author name (optional), anonymous submission preference</li>
              <li><strong>Program Information:</strong> Event agenda items, descriptions, notes</li>
            </ul>

            <h3 className="text-sm font-semibold text-ink mb-2">2.2 Information Collected Automatically</h3>
            <p className="text-neutral-600 text-sm leading-relaxed mb-2">When you use the Service, we automatically collect certain information:</p>
            <ul className="list-disc list-inside text-neutral-600 text-sm leading-relaxed space-y-1 mb-4 ml-2">
              <li><strong>Usage Data:</strong> Pages visited, features used, time spent, actions taken</li>
              <li><strong>Device Information:</strong> Browser type, operating system, device type</li>
              <li><strong>IP Address:</strong> Your IP address for security and analytics purposes</li>
              <li><strong>Cookies:</strong> Session cookies, authentication tokens (see Section 8)</li>
              <li><strong>Timestamps:</strong> Account creation, last login, question submission times</li>
            </ul>

            <h3 className="text-sm font-semibold text-ink mb-2">2.3 Information from Third-Party Services</h3>
            <p className="text-neutral-600 text-sm leading-relaxed mb-2">If you sign up or log in using Google OAuth, we receive:</p>
            <ul className="list-disc list-inside text-neutral-600 text-sm leading-relaxed space-y-1 mb-2 ml-2">
              <li>Your Google account email address</li>
              <li>Your name (if provided by Google)</li>
              <li>Your profile photo (if available)</li>
              <li>Email verification status</li>
            </ul>
            <p className="text-neutral-600 text-sm leading-relaxed">
              We do not receive your Google password. Your use of Google OAuth is subject to Google's Privacy Policy.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-ink mb-3 font-['Space_Grotesk']">3. How We Use Your Information</h2>
            <p className="text-neutral-600 text-sm leading-relaxed mb-3">We use the collected information for the following purposes:</p>

            <h3 className="text-sm font-semibold text-ink mb-2">3.1 To Provide and Maintain the Service</h3>
            <ul className="list-disc list-inside text-neutral-600 text-sm leading-relaxed space-y-1 mb-4 ml-2">
              <li>Create and manage your account</li>
              <li>Authenticate your identity</li>
              <li>Enable event creation and management</li>
              <li>Facilitate question submission and moderation</li>
              <li>Display event branding and customization</li>
              <li>Provide real-time updates and synchronization</li>
            </ul>

            <h3 className="text-sm font-semibold text-ink mb-2">3.2 To Improve and Optimize the Service</h3>
            <ul className="list-disc list-inside text-neutral-600 text-sm leading-relaxed space-y-1 mb-4 ml-2">
              <li>Analyze usage patterns and trends</li>
              <li>Identify and fix bugs and technical issues</li>
              <li>Develop new features and functionality</li>
              <li>Conduct research and analytics</li>
              <li>Monitor performance and uptime</li>
            </ul>

            <h3 className="text-sm font-semibold text-ink mb-2">3.3 To Communicate With You</h3>
            <ul className="list-disc list-inside text-neutral-600 text-sm leading-relaxed space-y-1 mb-4 ml-2">
              <li>Send email verification messages</li>
              <li>Send password reset emails</li>
              <li>Respond to your inquiries and support requests</li>
              <li>Send important service announcements and updates</li>
              <li>Notify you of changes to our policies (with your consent)</li>
            </ul>

            <h3 className="text-sm font-semibold text-ink mb-2">3.4 To Ensure Security and Prevent Fraud</h3>
            <ul className="list-disc list-inside text-neutral-600 text-sm leading-relaxed space-y-1 ml-2">
              <li>Detect and prevent spam and abuse</li>
              <li>Enforce rate limiting and usage policies</li>
              <li>Verify human users (via reCAPTCHA)</li>
              <li>Protect against unauthorized access</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-ink mb-3 font-['Space_Grotesk']">4. How We Share Your Information</h2>
            <p className="text-neutral-600 text-sm leading-relaxed mb-3">We do not sell, trade, or rent your personal information to third parties. We may share your information in the following limited circumstances:</p>

            <h3 className="text-sm font-semibold text-ink mb-2">4.1 With Service Providers</h3>
            <p className="text-neutral-600 text-sm leading-relaxed mb-2">We use third-party service providers to support the Service:</p>
            <ul className="list-disc list-inside text-neutral-600 text-sm leading-relaxed space-y-1 mb-2 ml-2">
              <li><strong>Firebase (Google Cloud):</strong> Authentication, database, and file storage</li>
              <li><strong>Google reCAPTCHA:</strong> Spam and bot protection</li>
              <li><strong>Netlify:</strong> Web hosting and content delivery</li>
              <li><strong>Analytics Services:</strong> Usage analytics and monitoring (if applicable)</li>
            </ul>
            <p className="text-neutral-600 text-sm leading-relaxed mb-4">
              These providers have access to your information only to perform services on our behalf and are obligated
              to protect your information and not use it for other purposes.
            </p>

            <h3 className="text-sm font-semibold text-ink mb-2">4.2 Within Events</h3>
            <p className="text-neutral-600 text-sm leading-relaxed mb-2">Information shared within the context of events:</p>
            <ul className="list-disc list-inside text-neutral-600 text-sm leading-relaxed space-y-1 mb-4 ml-2">
              <li><strong>Questions:</strong> Submitted questions are visible to event organizers and MCs</li>
              <li><strong>Author Names:</strong> If you provide a name (non-anonymous), it's visible to organizers/MCs</li>
              <li><strong>Anonymous Questions:</strong> Marked as "Anonymous" to protect your identity</li>
              <li><strong>Event Branding:</strong> Organization logos and event details are visible to all participants</li>
            </ul>

            <h3 className="text-sm font-semibold text-ink mb-2">4.3 For Legal Reasons</h3>
            <p className="text-neutral-600 text-sm leading-relaxed mb-2">We may disclose your information if required to do so by law or in response to:</p>
            <ul className="list-disc list-inside text-neutral-600 text-sm leading-relaxed space-y-1 mb-4 ml-2">
              <li>Valid legal process (subpoenas, court orders)</li>
              <li>Requests from law enforcement or government agencies</li>
              <li>Protection of our rights, property, or safety</li>
              <li>Protection of users' rights, property, or safety</li>
              <li>Prevention of fraud or illegal activities</li>
            </ul>

            <h3 className="text-sm font-semibold text-ink mb-2">4.4 Business Transfers</h3>
            <p className="text-neutral-600 text-sm leading-relaxed">
              If Ask Freely is involved in a merger, acquisition, sale of assets, or bankruptcy, your information may
              be transferred as part of that transaction. We will notify you before your information is transferred
              and becomes subject to a different privacy policy.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-ink mb-3 font-['Space_Grotesk']">5. Data Storage and Security</h2>

            <h3 className="text-sm font-semibold text-ink mb-2">5.1 Where We Store Your Data</h3>
            <p className="text-neutral-600 text-sm leading-relaxed mb-4">
              Your data is stored in Firebase (Google Cloud Platform) data centers. Firebase uses industry-standard
              security measures to protect your data, including encryption in transit and at rest.
            </p>

            <h3 className="text-sm font-semibold text-ink mb-2">5.2 How We Protect Your Data</h3>
            <p className="text-neutral-600 text-sm leading-relaxed mb-2">We implement reasonable security measures to protect your information:</p>
            <ul className="list-disc list-inside text-neutral-600 text-sm leading-relaxed space-y-1 mb-4 ml-2">
              <li><strong>Encryption:</strong> All data transmitted over the internet is encrypted using HTTPS/TLS</li>
              <li><strong>Password Security:</strong> Passwords are hashed and encrypted before storage</li>
              <li><strong>Access Controls:</strong> Database security rules limit access to authorized users only</li>
              <li><strong>Authentication:</strong> Firebase Authentication with email verification and OAuth</li>
              <li><strong>Rate Limiting:</strong> Protection against spam and abuse</li>
              <li><strong>Monitoring:</strong> Regular security audits and monitoring for suspicious activity</li>
            </ul>

            <h3 className="text-sm font-semibold text-ink mb-2">5.3 Data Retention</h3>
            <p className="text-neutral-600 text-sm leading-relaxed mb-2">
              We retain your information for as long as your account is active or as needed to provide the Service.
              You may request deletion of your account and associated data at any time by contacting us. We will
              delete your data within 30 days of your request, subject to legal and operational requirements.
            </p>
            <p className="text-neutral-600 text-sm leading-relaxed">
              Deleted data may persist in backups for up to 90 days but will not be used or accessible except
              for disaster recovery purposes.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-ink mb-3 font-['Space_Grotesk']">6. Your Rights and Choices</h2>

            <h3 className="text-sm font-semibold text-ink mb-2">6.1 Access and Update</h3>
            <p className="text-neutral-600 text-sm leading-relaxed mb-2">You have the right to:</p>
            <ul className="list-disc list-inside text-neutral-600 text-sm leading-relaxed space-y-1 mb-4 ml-2">
              <li>Access your personal information stored in our Service</li>
              <li>Update or correct inaccurate information</li>
              <li>Change your organization name, logo, and event type</li>
              <li>Update your email address (subject to verification)</li>
            </ul>

            <h3 className="text-sm font-semibold text-ink mb-2">6.2 Delete Your Account</h3>
            <p className="text-neutral-600 text-sm leading-relaxed mb-2">
              You may delete your account at any time by contacting us. Upon deletion:
            </p>
            <ul className="list-disc list-inside text-neutral-600 text-sm leading-relaxed space-y-1 mb-4 ml-2">
              <li>Your account and profile information will be permanently deleted</li>
              <li>Your events and associated data will be removed</li>
              <li>Questions you submitted may be retained in anonymized form for analytics</li>
              <li>Some information may be retained for legal compliance</li>
            </ul>

            <h3 className="text-sm font-semibold text-ink mb-2">6.3 Export Your Data</h3>
            <p className="text-neutral-600 text-sm leading-relaxed mb-4">
              Event organizers can export their event data (questions, analytics) in CSV, JSON, or text format
              directly from the MC/Host dashboard.
            </p>

            <h3 className="text-sm font-semibold text-ink mb-2">6.4 Opt-Out of Communications</h3>
            <p className="text-neutral-600 text-sm leading-relaxed mb-4">
              You can opt out of promotional emails by following the unsubscribe link in any marketing email.
              However, you cannot opt out of service-related emails as they are necessary for the Service to function.
            </p>

            <h3 className="text-sm font-semibold text-ink mb-2">6.5 Do Not Track</h3>
            <p className="text-neutral-600 text-sm leading-relaxed">
              Some browsers have a "Do Not Track" feature. We do not currently respond to Do Not Track signals,
              as there is no industry standard for how to respond to such signals.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-ink mb-3 font-['Space_Grotesk']">7. Children's Privacy</h2>
            <p className="text-neutral-600 text-sm leading-relaxed">
              The Service is not intended for children under 13 years of age. We do not knowingly collect personal
              information from children under 13. If you are a parent or guardian and believe your child has provided
              us with personal information, please contact us immediately. We will delete such information promptly.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-ink mb-3 font-['Space_Grotesk']">8. Cookies and Tracking Technologies</h2>

            <h3 className="text-sm font-semibold text-ink mb-2">8.1 What Are Cookies</h3>
            <p className="text-neutral-600 text-sm leading-relaxed mb-4">
              Cookies are small text files stored on your device by your browser. We use cookies and similar
              technologies to authenticate users, remember preferences, and improve the Service.
            </p>

            <h3 className="text-sm font-semibold text-ink mb-2">8.2 Types of Cookies We Use</h3>
            <ul className="list-disc list-inside text-neutral-600 text-sm leading-relaxed space-y-1 mb-4 ml-2">
              <li><strong>Essential Cookies:</strong> Required for authentication and core functionality</li>
              <li><strong>Preference Cookies:</strong> Remember your settings and preferences</li>
              <li><strong>Analytics Cookies:</strong> Help us understand how you use the Service</li>
              <li><strong>Security Cookies:</strong> Detect and prevent fraudulent activity</li>
            </ul>

            <h3 className="text-sm font-semibold text-ink mb-2">8.3 Third-Party Cookies</h3>
            <p className="text-neutral-600 text-sm leading-relaxed mb-2">Third-party services we use may set their own cookies:</p>
            <ul className="list-disc list-inside text-neutral-600 text-sm leading-relaxed space-y-1 mb-4 ml-2">
              <li><strong>Firebase:</strong> Authentication and session management</li>
              <li><strong>Google reCAPTCHA:</strong> Spam detection and bot prevention</li>
              <li><strong>Google Analytics:</strong> Usage analytics (if enabled)</li>
            </ul>

            <h3 className="text-sm font-semibold text-ink mb-2">8.4 Managing Cookies</h3>
            <p className="text-neutral-600 text-sm leading-relaxed">
              You can control cookies through your browser settings. However, disabling cookies may affect the
              functionality of the Service, including the ability to log in and use certain features.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-ink mb-3 font-['Space_Grotesk']">9. Third-Party Links</h2>
            <p className="text-neutral-600 text-sm leading-relaxed">
              The Service may contain links to third-party websites or services. We are not responsible for the
              privacy practices or content of these third-party sites. We encourage you to read the privacy
              policies of any third-party sites you visit.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-ink mb-3 font-['Space_Grotesk']">10. International Data Transfers</h2>
            <p className="text-neutral-600 text-sm leading-relaxed mb-2">
              Your information may be transferred to and maintained on servers located outside your jurisdiction
              where data protection laws may differ from those in your jurisdiction.
            </p>
            <p className="text-neutral-600 text-sm leading-relaxed">
              By using the Service, you consent to the transfer of your information to Firebase (Google Cloud)
              data centers, which may be located globally.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-ink mb-3 font-['Space_Grotesk']">11. California Privacy Rights (CCPA)</h2>
            <p className="text-neutral-600 text-sm leading-relaxed mb-2">
              If you are a California resident, you have additional rights under the CCPA:
            </p>
            <ul className="list-disc list-inside text-neutral-600 text-sm leading-relaxed space-y-1 mb-2 ml-2">
              <li><strong>Right to Know:</strong> Request disclosure of personal information we collect about you</li>
              <li><strong>Right to Delete:</strong> Request deletion of your personal information</li>
              <li><strong>Right to Opt-Out:</strong> Opt out of the sale of personal information (we do not sell your data)</li>
              <li><strong>Right to Non-Discrimination:</strong> Not be discriminated against for exercising your rights</li>
            </ul>
            <p className="text-neutral-600 text-sm leading-relaxed">
              To exercise these rights, contact us. We will verify your identity before processing your request.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-ink mb-3 font-['Space_Grotesk']">12. European Privacy Rights (GDPR)</h2>
            <p className="text-neutral-600 text-sm leading-relaxed mb-2">
              If you are in the European Economic Area (EEA), you have rights under the GDPR:
            </p>
            <ul className="list-disc list-inside text-neutral-600 text-sm leading-relaxed space-y-1 mb-2 ml-2">
              <li><strong>Right of Access:</strong> Request copies of your personal data</li>
              <li><strong>Right to Rectification:</strong> Correct inaccurate or incomplete data</li>
              <li><strong>Right to Erasure:</strong> Request deletion of your data</li>
              <li><strong>Right to Restrict Processing:</strong> Limit how we use your data</li>
              <li><strong>Right to Data Portability:</strong> Receive your data in a portable format</li>
              <li><strong>Right to Object:</strong> Object to processing of your data</li>
              <li><strong>Right to Lodge a Complaint:</strong> File a complaint with your local data protection authority</li>
            </ul>
            <p className="text-neutral-600 text-sm leading-relaxed">
              Our legal basis for processing your data is your consent, contract performance, and legitimate interests.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-ink mb-3 font-['Space_Grotesk']">13. Changes to This Privacy Policy</h2>
            <p className="text-neutral-600 text-sm leading-relaxed mb-2">
              We may update this Privacy Policy from time to time. We will notify you of material changes by:
            </p>
            <ul className="list-disc list-inside text-neutral-600 text-sm leading-relaxed space-y-1 mb-2 ml-2">
              <li>Updating the "Last Updated" date at the top of this policy</li>
              <li>Sending an email notification to registered users</li>
              <li>Posting a prominent notice on the Service</li>
            </ul>
            <p className="text-neutral-600 text-sm leading-relaxed">
              Your continued use of the Service after changes become effective constitutes acceptance of the revised
              Privacy Policy.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-ink mb-3 font-['Space_Grotesk']">14. Contact Us</h2>
            <p className="text-neutral-600 text-sm leading-relaxed mb-3">
              If you have questions or concerns regarding this Privacy Policy, please contact us at:
            </p>
            <div className="bg-neutral-50 rounded-lg p-4 text-sm">
              <p className="font-semibold text-ink">Ask Freely Privacy Team</p>
              <p className="text-neutral-600">Email: privacy@ask-freely.com</p>
              <p className="text-neutral-600">Website: <Link to="/" className="text-primary hover:underline">ask-freely.com</Link></p>
            </div>
            <p className="text-neutral-600 text-sm leading-relaxed mt-3">
              We will respond to your inquiry within 30 days.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-ink mb-3 font-['Space_Grotesk']">15. Acknowledgment</h2>
            <p className="text-neutral-600 text-sm leading-relaxed uppercase">
              By using the Service, you acknowledge that you have read and understood this Privacy Policy and
              consent to the collection, use, and disclosure of your information as described herein.
            </p>
          </section>
        </div>

        {/* Footer */}
        <footer className="mt-8 pt-6 border-t border-neutral-200 text-center">
          <p className="text-neutral-500 text-xs">
            <Link to="/terms-of-service" className="hover:text-primary transition-colors">Terms of Service</Link>
            {' · '}
            <Link to="/" className="hover:text-primary transition-colors">Home</Link>
          </p>
        </footer>
      </div>
    </div>
  );
}

export default PrivacyPolicy;
