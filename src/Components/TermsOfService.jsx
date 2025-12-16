// src/Components/TermsOfService.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import './LegalPages.css';

function TermsOfService() {
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
          <h1>Terms of Service</h1>
          <p className="last-updated">Last Updated: {lastUpdated}</p>
        </header>

        <div className="legal-content">
          <section>
            <h2>1. Acceptance of Terms</h2>
            <p>
              By accessing or using Ask Freely ("the Service"), you agree to be bound by these Terms of Service ("Terms").
              If you do not agree to these Terms, please do not use the Service.
            </p>
            <p>
              These Terms apply to all users of the Service, including event organizers, hosts/MCs, and participants
              who submit questions.
            </p>
          </section>

          <section>
            <h2>2. Description of Service</h2>
            <p>
              Ask Freely is a real-time Q&A platform that enables event organizers to:
            </p>
            <ul>
              <li>Create and manage live events</li>
              <li>Collect questions from event participants</li>
              <li>Moderate and respond to audience questions</li>
              <li>Customize event branding and experience</li>
              <li>Build and track event programs/agendas</li>
            </ul>
            <p>
              The Service facilitates communication between event organizers and participants but does not
              endorse, support, represent, or guarantee the completeness, truthfulness, accuracy, or reliability
              of any content submitted through the platform.
            </p>
          </section>

          <section>
            <h2>3. User Accounts</h2>
            <h3>3.1 Registration</h3>
            <p>
              To use certain features of the Service (such as creating events), you must register for an account.
              You may register using:
            </p>
            <ul>
              <li>Email address and password</li>
              <li>Google OAuth authentication</li>
            </ul>
            <p>
              You agree to provide accurate, current, and complete information during registration and to update
              such information to keep it accurate, current, and complete.
            </p>

            <h3>3.2 Account Security</h3>
            <p>
              You are responsible for safeguarding your account credentials and for all activities that occur
              under your account. You agree to:
            </p>
            <ul>
              <li>Use a strong, unique password</li>
              <li>Not share your account credentials with others</li>
              <li>Notify us immediately of any unauthorized use of your account</li>
              <li>Log out from your account at the end of each session</li>
            </ul>

            <h3>3.3 Email Verification</h3>
            <p>
              You must verify your email address before accessing full features of the Service. We reserve the
              right to suspend or terminate unverified accounts.
            </p>
          </section>

          <section>
            <h2>4. User Conduct</h2>
            <h3>4.1 Acceptable Use</h3>
            <p>You agree not to use the Service to:</p>
            <ul>
              <li>Submit false, misleading, or fraudulent content</li>
              <li>Impersonate any person or entity, or falsely state or misrepresent your affiliation</li>
              <li>Harass, abuse, threaten, or intimidate other users</li>
              <li>Submit spam, advertisements, or promotional materials</li>
              <li>Upload viruses, malware, or malicious code</li>
              <li>Violate any applicable laws or regulations</li>
              <li>Infringe upon intellectual property rights of others</li>
              <li>Collect or harvest personal information about other users</li>
              <li>Interfere with or disrupt the Service or servers</li>
            </ul>

            <h3>4.2 Content Standards</h3>
            <p>All content submitted through the Service (questions, event descriptions, etc.) must:</p>
            <ul>
              <li>Be respectful and professional</li>
              <li>Not contain hate speech, discrimination, or offensive material</li>
              <li>Not contain explicit sexual content or violence</li>
              <li>Not violate privacy rights of others</li>
              <li>Be relevant to the event or discussion</li>
            </ul>

            <h3>4.3 Rate Limiting</h3>
            <p>
              To prevent spam and ensure fair use, the Service implements rate limiting on question submissions.
              Users may be required to wait 30 seconds between submissions. Attempts to circumvent rate limiting
              may result in account suspension.
            </p>
          </section>

          <section>
            <h2>5. Content Ownership and Rights</h2>
            <h3>5.1 Your Content</h3>
            <p>
              You retain all ownership rights to content you submit to the Service ("User Content"). By submitting
              User Content, you grant Ask Freely a worldwide, non-exclusive, royalty-free license to use, copy,
              reproduce, process, adapt, modify, publish, transmit, display, and distribute such content for the
              purpose of providing and improving the Service.
            </p>

            <h3>5.2 Event Organizer Rights</h3>
            <p>
              Event organizers have the right to:
            </p>
            <ul>
              <li>Moderate and delete questions submitted to their events</li>
              <li>Mark questions as answered or unanswered</li>
              <li>Export questions and analytics data</li>
              <li>Control event visibility and access</li>
              <li>Remove their events and associated data at any time</li>
            </ul>

            <h3>5.3 Anonymous Submissions</h3>
            <p>
              Participants may submit questions anonymously. While we respect anonymity, we reserve the right to
              disclose user information if required by law or to protect the rights, property, or safety of Ask Freely,
              our users, or the public.
            </p>
          </section>

          <section>
            <h2>6. Privacy and Data</h2>
            <p>
              Your use of the Service is also governed by our <Link to="/privacy-policy">Privacy Policy</Link>,
              which describes how we collect, use, and protect your personal information.
            </p>
            <p>
              By using the Service, you consent to the collection and use of your data as described in the Privacy Policy.
            </p>
          </section>

          <section>
            <h2>7. Intellectual Property</h2>
            <p>
              The Service and its original content (excluding User Content), features, and functionality are owned by
              Ask Freely and are protected by international copyright, trademark, patent, trade secret, and other
              intellectual property laws.
            </p>
            <p>
              Our trademarks, logos, and service marks ("Marks") may not be used without our prior written consent.
              Other trademarks, service marks, and logos used on the Service are the property of their respective owners.
            </p>
          </section>

          <section>
            <h2>8. Third-Party Services</h2>
            <p>
              The Service integrates with third-party services, including but not limited to:
            </p>
            <ul>
              <li>Firebase (Google Cloud) for authentication and data storage</li>
              <li>Google reCAPTCHA for spam protection</li>
              <li>Google OAuth for authentication</li>
            </ul>
            <p>
              Your use of these third-party services is subject to their respective terms of service and privacy policies.
              We are not responsible for the practices of third-party services.
            </p>
          </section>

          <section>
            <h2>9. Disclaimer of Warranties</h2>
            <p>
              THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED,
              INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE,
              NON-INFRINGEMENT, OR COURSE OF PERFORMANCE.
            </p>
            <p>
              Ask Freely does not warrant that:
            </p>
            <ul>
              <li>The Service will function uninterrupted, secure, or available at any particular time or location</li>
              <li>Any errors or defects will be corrected</li>
              <li>The Service is free of viruses or other harmful components</li>
              <li>The results of using the Service will meet your requirements</li>
            </ul>
          </section>

          <section>
            <h2>10. Limitation of Liability</h2>
            <p>
              TO THE FULLEST EXTENT PERMITTED BY LAW, ASK FREELY SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL,
              CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY,
              OR ANY LOSS OF DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES, RESULTING FROM:
            </p>
            <ul>
              <li>Your use or inability to use the Service</li>
              <li>Any unauthorized access to or use of our servers and/or any personal information stored therein</li>
              <li>Any interruption or cessation of transmission to or from the Service</li>
              <li>Any bugs, viruses, or the like that may be transmitted to or through the Service by any third party</li>
              <li>Any errors or omissions in any content or for any loss or damage incurred as a result of the use of any content posted, emailed, transmitted, or otherwise made available through the Service</li>
            </ul>
            <p>
              IN NO EVENT SHALL ASK FREELY'S TOTAL LIABILITY TO YOU FOR ALL DAMAGES EXCEED THE AMOUNT PAID BY YOU TO
              ASK FREELY IN THE PAST SIX (6) MONTHS, OR ONE HUNDRED DOLLARS ($100), WHICHEVER IS GREATER.
            </p>
          </section>

          <section>
            <h2>11. Indemnification</h2>
            <p>
              You agree to indemnify, defend, and hold harmless Ask Freely, its officers, directors, employees, agents,
              and affiliates from and against any claims, liabilities, damages, losses, and expenses, including reasonable
              attorney's fees, arising out of or in any way connected with:
            </p>
            <ul>
              <li>Your access to or use of the Service</li>
              <li>Your violation of these Terms</li>
              <li>Your User Content</li>
              <li>Your violation of any rights of another party</li>
            </ul>
          </section>

          <section>
            <h2>12. Termination</h2>
            <p>
              We may terminate or suspend your account and access to the Service immediately, without prior notice or
              liability, for any reason, including but not limited to:
            </p>
            <ul>
              <li>Breach of these Terms</li>
              <li>At your request</li>
              <li>Discontinuation or material modification of the Service</li>
              <li>Unexpected technical issues or problems</li>
              <li>Extended periods of inactivity</li>
              <li>Engagement in fraudulent or illegal activities</li>
            </ul>
            <p>
              Upon termination, your right to use the Service will cease immediately. You may delete your account at
              any time by contacting us. We will make reasonable efforts to delete your data, subject to legal
              and operational requirements.
            </p>
          </section>

          <section>
            <h2>13. Changes to Terms</h2>
            <p>
              We reserve the right to modify or replace these Terms at any time. If a revision is material, we will
              provide at least 30 days' notice prior to any new terms taking effect. Material changes will be
              communicated via:
            </p>
            <ul>
              <li>Email notification to registered users</li>
              <li>Prominent notice on the Service</li>
              <li>Updated "Last Updated" date at the top of this page</li>
            </ul>
            <p>
              Your continued use of the Service after changes become effective constitutes acceptance of the revised Terms.
              If you do not agree to the new Terms, you must stop using the Service.
            </p>
          </section>

          <section>
            <h2>14. Governing Law</h2>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of [Your Jurisdiction],
              without regard to its conflict of law provisions.
            </p>
            <p>
              You agree to submit to the personal and exclusive jurisdiction of the courts located in [Your Jurisdiction]
              for the resolution of any disputes arising from or related to these Terms or the Service.
            </p>
          </section>

          <section>
            <h2>15. Dispute Resolution</h2>
            <p>
              If you have any concerns or disputes about the Service, you agree to first try to resolve the dispute
              informally by contacting us at [Your Support Email].
            </p>
            <p>
              For disputes that cannot be resolved informally, you and Ask Freely agree to resolve any disputes arising
              out of or relating to these Terms or the Service through binding arbitration, except that each party
              retains the right to seek injunctive or other equitable relief in a court of competent jurisdiction.
            </p>
          </section>

          <section>
            <h2>16. Severability</h2>
            <p>
              If any provision of these Terms is held to be unenforceable or invalid, such provision will be changed
              and interpreted to accomplish the objectives of such provision to the greatest extent possible under
              applicable law, and the remaining provisions will continue in full force and effect.
            </p>
          </section>

          <section>
            <h2>17. Waiver</h2>
            <p>
              No waiver by Ask Freely of any term or condition set forth in these Terms shall be deemed a further or
              continuing waiver of such term or condition or a waiver of any other term or condition, and any failure
              of Ask Freely to assert a right or provision under these Terms shall not constitute a waiver of such
              right or provision.
            </p>
          </section>

          <section>
            <h2>18. Entire Agreement</h2>
            <p>
              These Terms, together with our Privacy Policy, constitute the entire agreement between you and Ask Freely
              regarding the use of the Service, superseding any prior agreements between you and Ask Freely relating to
              your use of the Service.
            </p>
          </section>

          <section>
            <h2>19. Contact Information</h2>
            <p>
              If you have any questions about these Terms, please contact us at:
            </p>
            <div className="contact-info">
              <p><strong>Ask Freely Support</strong></p>
              <p>Email: [Your Support Email]</p>
              <p>Website: <Link to="/">ask-freely.com</Link></p>
            </div>
          </section>

          <section>
            <h2>20. Acknowledgment</h2>
            <p>
              BY USING THE SERVICE, YOU ACKNOWLEDGE THAT YOU HAVE READ THESE TERMS OF SERVICE AND AGREE TO BE BOUND BY THEM.
            </p>
          </section>
        </div>

        <footer className="legal-footer">
          <p>
            <Link to="/privacy-policy">Privacy Policy</Link>
            {' · '}
            <Link to="/">Home</Link>
          </p>
        </footer>
      </div>
    </div>
  );
}

export default TermsOfService;
