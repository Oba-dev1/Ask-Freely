// src/Components/Help.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';

function Help() {
  const [activeTab, setActiveTab] = useState('organizer');
  const [openFaq, setOpenFaq] = useState(null);

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const faqData = [
    {
      question: "Is Ask Freely really free to use?",
      answer: "Yes! Ask Freely is completely free to use. There are no hidden costs, subscription fees, or premium tiers. All features are available to everyone."
    },
    {
      question: "How many questions can participants submit?",
      answer: "Participants can submit unlimited questions, but there's a 30-second cooldown between submissions to prevent spam and ensure quality participation."
    },
    {
      question: "Can I use Ask Freely for private events?",
      answer: "Yes! When creating an event, you can choose to keep it unlisted. Unlisted events won't appear in public listings and can only be accessed by people who have the direct link."
    },
    {
      question: "How long are events stored?",
      answer: "Events and their questions are stored indefinitely. You can delete an event at any time from your organizer dashboard, which will permanently remove all associated data."
    },
    {
      question: "Can participants edit or delete their questions?",
      answer: "No, once a question is submitted, participants cannot edit or delete it. This ensures transparency and prevents manipulation of the Q&A process. However, organizers and MCs can moderate (hide) questions."
    },
    {
      question: "What happens if someone submits inappropriate content?",
      answer: "Organizers and MCs have moderation tools to hide inappropriate questions. Hidden questions are not deleted but are removed from the active view. This allows for review if needed while keeping your Q&A professional."
    },
    {
      question: "Do I need to create an account to ask a question?",
      answer: "No! Participants don't need to create an account. They can submit questions anonymously or with their name using just the event code. Only organizers need an account to create and manage events."
    },
    {
      question: "Can I export the questions after my event?",
      answer: "Yes! Organizers can export all questions (including hidden ones) in multiple formats: CSV for spreadsheets, JSON for developers, or plain text for documentation."
    },
    {
      question: "What's the difference between an organizer and an MC?",
      answer: "Organizers create and own the event, manage all settings, and can add/remove MCs. MCs (Master of Ceremonies) are collaborators who help moderate questions during the event but don't have access to event settings or deletion."
    },
    {
      question: "Can I customize the appearance of my event page?",
      answer: "Yes! You can upload a custom logo for your organization and individual events. The logo will be displayed on the event page and participant interface, providing professional branding."
    },
    {
      question: "Is there a limit to how many events I can create?",
      answer: "No, there's no limit! You can create as many events as you need, whether they're recurring meetings, one-time conferences, or anything in between."
    },
    {
      question: "What browsers are supported?",
      answer: "Ask Freely works on all modern browsers including Chrome, Firefox, Safari, and Edge. For the best experience, we recommend using the latest version of your preferred browser."
    }
  ];

  const tabs = [
    { id: 'organizer', label: 'For Organizers', icon: 'fas fa-user-tie' },
    { id: 'participant', label: 'For Participants', icon: 'fas fa-users' },
    { id: 'mc', label: 'For MCs/Hosts', icon: 'fas fa-microphone' },
    { id: 'faq', label: 'FAQ', icon: 'fas fa-question-circle' }
  ];

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
            <Link
              to="/"
              className="text-xs md:text-sm text-neutral-600 hover:text-primary transition-colors"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-12">
        <header className="text-center mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-ink mb-2 font-['Space_Grotesk']">Help & Documentation</h1>
          <p className="text-sm text-neutral-500">Everything you need to know about using Ask Freely</p>
        </header>

        {/* Tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs md:text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-primary text-white shadow-md'
                  : 'bg-white text-neutral-600 hover:bg-neutral-100 border border-neutral-200'
              }`}
              onClick={() => setActiveTab(tab.id)}
            >
              <i className={tab.icon}></i>
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.label.split(' ').pop()}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6 md:p-8">
          {/* Organizer Guide */}
          {activeTab === 'organizer' && (
            <section>
              <h2 className="text-xl font-bold text-ink mb-2 font-['Space_Grotesk']">Organizer Guide</h2>
              <p className="text-sm text-neutral-600 mb-6">
                As an organizer, you have full control over creating and managing events, moderating questions, and collaborating with your team.
              </p>

              <div className="space-y-6">
                {/* Step 1 */}
                <div className="border-l-2 border-primary pl-4">
                  <h3 className="flex items-center gap-2 text-base font-semibold text-ink mb-2">
                    <span className="w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center">1</span>
                    Getting Started
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <h4 className="text-sm font-medium text-ink mb-1">Create an Account</h4>
                      <ul className="list-disc list-inside text-sm text-neutral-600 space-y-1 ml-2">
                        <li>Click "Login/Sign Up" on the homepage</li>
                        <li>Sign up with your email or use Google Sign-In</li>
                        <li>Verify your email address (check your inbox for a verification link)</li>
                        <li>Complete your profile setup with your organization details</li>
                      </ul>
                    </div>
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex gap-2">
                      <i className="fas fa-lightbulb text-amber-500 mt-0.5"></i>
                      <p className="text-xs text-amber-800"><strong>Tip:</strong> Use a professional email address for your organization. This will be used for important notifications about your events.</p>
                    </div>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="border-l-2 border-primary pl-4">
                  <h3 className="flex items-center gap-2 text-base font-semibold text-ink mb-2">
                    <span className="w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center">2</span>
                    Creating Your First Event
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <h4 className="text-sm font-medium text-ink mb-1">Event Setup</h4>
                      <ul className="list-disc list-inside text-sm text-neutral-600 space-y-1 ml-2">
                        <li>From your dashboard, click "Create New Event"</li>
                        <li>Enter a descriptive event name (e.g., "Town Hall Meeting Q&A")</li>
                        <li>Choose whether the event should be public or unlisted</li>
                        <li>Add an optional description to help participants understand the event's purpose</li>
                        <li>Upload a custom logo to brand your event (optional but recommended)</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-ink mb-1">Understanding Event Codes</h4>
                      <p className="text-sm text-neutral-600">
                        When you create an event, Ask Freely generates a unique 6-digit event code.
                        This code is what participants use to access your event and submit questions.
                        Share this code via presentations, emails, or QR codes.
                      </p>
                    </div>
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex gap-2">
                      <i className="fas fa-lightbulb text-amber-500 mt-0.5"></i>
                      <p className="text-xs text-amber-800"><strong>Tip:</strong> Display the event code prominently during your event (on slides, handouts, or screens) so participants can easily find it.</p>
                    </div>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="border-l-2 border-primary pl-4">
                  <h3 className="flex items-center gap-2 text-base font-semibold text-ink mb-2">
                    <span className="w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center">3</span>
                    Managing Questions
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <h4 className="text-sm font-medium text-ink mb-1">Viewing Questions</h4>
                      <ul className="list-disc list-inside text-sm text-neutral-600 space-y-1 ml-2">
                        <li>Access your event from the dashboard to see all submitted questions in real-time</li>
                        <li>Questions appear instantly as participants submit them (no page refresh needed)</li>
                        <li>Each question shows the submitter's name (or "Anonymous") and timestamp</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-ink mb-1">Moderation Tools</h4>
                      <ul className="list-disc list-inside text-sm text-neutral-600 space-y-1 ml-2">
                        <li><strong>Mark as Answered:</strong> Mark questions that have been addressed during your event</li>
                        <li><strong>Hide Question:</strong> Remove inappropriate or duplicate questions from the active view</li>
                        <li><strong>View Hidden Questions:</strong> Access all hidden questions for review if needed</li>
                      </ul>
                    </div>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex gap-2">
                      <i className="fas fa-exclamation-triangle text-red-500 mt-0.5"></i>
                      <p className="text-xs text-red-800"><strong>Note:</strong> Hidden questions are not deleted. They're removed from the main view but remain in your database for audit purposes.</p>
                    </div>
                  </div>
                </div>

                {/* Step 4 */}
                <div className="border-l-2 border-primary pl-4">
                  <h3 className="flex items-center gap-2 text-base font-semibold text-ink mb-2">
                    <span className="w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center">4</span>
                    Collaboration with MCs
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <h4 className="text-sm font-medium text-ink mb-1">Adding MCs (Master of Ceremonies)</h4>
                      <ul className="list-disc list-inside text-sm text-neutral-600 space-y-1 ml-2">
                        <li>Go to your event settings and find the "MC Access" section</li>
                        <li>Click "Add MC" and enter their email address</li>
                        <li>The MC will receive an email notification with access instructions</li>
                        <li>MCs can moderate questions but cannot change event settings or delete the event</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-ink mb-1">Managing MC Access</h4>
                      <ul className="list-disc list-inside text-sm text-neutral-600 space-y-1 ml-2">
                        <li>View all MCs with access to your event in the settings panel</li>
                        <li>Remove MC access at any time by clicking "Remove" next to their name</li>
                        <li>Only the organizer (you) can add or remove MCs</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Step 5 */}
                <div className="border-l-2 border-primary pl-4">
                  <h3 className="flex items-center gap-2 text-base font-semibold text-ink mb-2">
                    <span className="w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center">5</span>
                    Exporting Data
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <h4 className="text-sm font-medium text-ink mb-1">Export Options</h4>
                      <ul className="list-disc list-inside text-sm text-neutral-600 space-y-1 ml-2">
                        <li><strong>CSV Format:</strong> Best for spreadsheet analysis in Excel or Google Sheets</li>
                        <li><strong>JSON Format:</strong> Best for developers and technical integrations</li>
                        <li><strong>Text Format:</strong> Best for reports, documentation, or simple reading</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-ink mb-1">What's Included</h4>
                      <p className="text-sm text-neutral-600">
                        All exports include all questions (visible and hidden), submitter names,
                        timestamps, answered status, and hidden status. Use this for post-event
                        analysis, reporting, or archiving.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Step 6 */}
                <div className="border-l-2 border-primary pl-4">
                  <h3 className="flex items-center gap-2 text-base font-semibold text-ink mb-2">
                    <span className="w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center">6</span>
                    Event Settings & Customization
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <h4 className="text-sm font-medium text-ink mb-1">Logo Upload</h4>
                      <ul className="list-disc list-inside text-sm text-neutral-600 space-y-1 ml-2">
                        <li>Upload a custom logo for your organization (applies to all your events)</li>
                        <li>Upload a custom logo for individual events for specific branding</li>
                        <li>Supported formats: PNG, JPG, GIF (max 5MB)</li>
                        <li>Recommended dimensions: 200x200 pixels for best display</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-ink mb-1">Event Visibility</h4>
                      <ul className="list-disc list-inside text-sm text-neutral-600 space-y-1 ml-2">
                        <li><strong>Public Events:</strong> Listed on Ask Freely and searchable by anyone</li>
                        <li><strong>Unlisted Events:</strong> Only accessible via direct link or event code</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Step 7 */}
                <div className="border-l-2 border-primary pl-4">
                  <h3 className="flex items-center gap-2 text-base font-semibold text-ink mb-2">
                    <span className="w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center">7</span>
                    Best Practices
                  </h3>
                  <ul className="list-disc list-inside text-sm text-neutral-600 space-y-1 ml-2">
                    <li><strong>Before the Event:</strong> Test your event setup, share the event code in advance, brief your MCs on moderation tools</li>
                    <li><strong>During the Event:</strong> Display the event code prominently, monitor questions actively, mark questions as answered to track progress</li>
                    <li><strong>After the Event:</strong> Export questions for records, review hidden questions, use feedback for future events</li>
                  </ul>
                </div>
              </div>
            </section>
          )}

          {/* Participant Guide */}
          {activeTab === 'participant' && (
            <section>
              <h2 className="text-xl font-bold text-ink mb-2 font-['Space_Grotesk']">Participant Guide</h2>
              <p className="text-sm text-neutral-600 mb-6">
                Participating in an Ask Freely event is simple and doesn't require an account. Just follow these easy steps to submit your questions.
              </p>

              <div className="space-y-6">
                {/* Step 1 */}
                <div className="border-l-2 border-primary pl-4">
                  <h3 className="flex items-center gap-2 text-base font-semibold text-ink mb-2">
                    <span className="w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center">1</span>
                    Joining an Event
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <h4 className="text-sm font-medium text-ink mb-1">How to Access an Event</h4>
                      <ul className="list-disc list-inside text-sm text-neutral-600 space-y-1 ml-2">
                        <li>Get the 6-digit event code from the organizer (usually displayed during the event)</li>
                        <li>Go to <a href="https://ask-freely.netlify.app" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">ask-freely.netlify.app</a></li>
                        <li>Enter the event code in the "Enter Event Code" box</li>
                        <li>Click "Join Event" to access the question submission form</li>
                      </ul>
                    </div>
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex gap-2">
                      <i className="fas fa-lightbulb text-amber-500 mt-0.5"></i>
                      <p className="text-xs text-amber-800"><strong>Tip:</strong> Event codes are 6 digits long and case-sensitive. Make sure to enter it exactly as shown.</p>
                    </div>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="border-l-2 border-primary pl-4">
                  <h3 className="flex items-center gap-2 text-base font-semibold text-ink mb-2">
                    <span className="w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center">2</span>
                    Submitting Questions
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <h4 className="text-sm font-medium text-ink mb-1">Question Form</h4>
                      <ul className="list-disc list-inside text-sm text-neutral-600 space-y-1 ml-2">
                        <li>Enter your name (optional - you can submit anonymously by leaving it blank)</li>
                        <li>Type your question in the text box (up to 500 characters)</li>
                        <li>Click "Submit Question" to send it to the organizers</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-ink mb-1">Anonymous Questions</h4>
                      <p className="text-sm text-neutral-600">
                        To submit anonymously, simply leave the name field blank. Your question
                        will appear as "Anonymous" to the organizers and MCs. This is great for
                        sensitive topics or when you prefer privacy.
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-ink mb-1">Rate Limiting</h4>
                      <p className="text-sm text-neutral-600">
                        After submitting a question, you'll need to wait 30 seconds before submitting
                        another one. This helps prevent spam and ensures quality participation.
                        You'll see a countdown timer if you try to submit too quickly.
                      </p>
                    </div>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex gap-2">
                      <i className="fas fa-exclamation-triangle text-red-500 mt-0.5"></i>
                      <p className="text-xs text-red-800"><strong>Note:</strong> Once submitted, you cannot edit or delete your question. Make sure to review it before clicking submit!</p>
                    </div>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="border-l-2 border-primary pl-4">
                  <h3 className="flex items-center gap-2 text-base font-semibold text-ink mb-2">
                    <span className="w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center">3</span>
                    What Happens Next?
                  </h3>
                  <ul className="list-disc list-inside text-sm text-neutral-600 space-y-1 ml-2">
                    <li>Your question is instantly visible to the organizers and MCs</li>
                    <li>The host will select which questions to answer during the event</li>
                    <li>You won't see other participants' questions (to keep the interface simple)</li>
                    <li>The organizer may mark your question as "answered" after addressing it</li>
                  </ul>
                </div>

                {/* Step 4 */}
                <div className="border-l-2 border-primary pl-4">
                  <h3 className="flex items-center gap-2 text-base font-semibold text-ink mb-2">
                    <span className="w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center">4</span>
                    Tips for Great Questions
                  </h3>
                  <ul className="list-disc list-inside text-sm text-neutral-600 space-y-1 ml-2">
                    <li><strong>Be specific:</strong> Clear, focused questions are more likely to be answered</li>
                    <li><strong>Stay on topic:</strong> Keep your question relevant to the event</li>
                    <li><strong>Be respectful:</strong> Inappropriate questions may be hidden by moderators</li>
                    <li><strong>Keep it concise:</strong> Shorter questions are easier to answer quickly</li>
                  </ul>
                </div>

                {/* Step 5 */}
                <div className="border-l-2 border-primary pl-4">
                  <h3 className="flex items-center gap-2 text-base font-semibold text-ink mb-2">
                    <span className="w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center">5</span>
                    Privacy & Data
                  </h3>
                  <div className="space-y-3">
                    <p className="text-sm text-neutral-600">Ask Freely takes your privacy seriously. When you submit a question:</p>
                    <ul className="list-disc list-inside text-sm text-neutral-600 space-y-1 ml-2">
                      <li>We don't track your email or personal information</li>
                      <li>Your IP address is not stored</li>
                      <li>Only the name you provide (or "Anonymous") is visible</li>
                      <li>Questions are stored securely and only accessible to the event organizers</li>
                    </ul>
                    <p className="text-sm text-neutral-600">
                      For more details, see our <Link to="/privacy-policy" className="text-primary hover:underline">Privacy Policy</Link>.
                    </p>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* MC/Host Guide */}
          {activeTab === 'mc' && (
            <section>
              <h2 className="text-xl font-bold text-ink mb-2 font-['Space_Grotesk']">MC/Host Guide</h2>
              <p className="text-sm text-neutral-600 mb-6">
                As a Master of Ceremonies (MC) or host, you help organizers moderate questions during events.
                You have the same question management tools as organizers but without access to event settings.
              </p>

              <div className="space-y-6">
                {/* Step 1 */}
                <div className="border-l-2 border-primary pl-4">
                  <h3 className="flex items-center gap-2 text-base font-semibold text-ink mb-2">
                    <span className="w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center">1</span>
                    Getting Access
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <h4 className="text-sm font-medium text-ink mb-1">How You're Added</h4>
                      <ul className="list-disc list-inside text-sm text-neutral-600 space-y-1 ml-2">
                        <li>The event organizer will add you as an MC using your email address</li>
                        <li>You'll receive an email notification with your access details</li>
                        <li>You must have an Ask Freely account (create one if you don't have one yet)</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-ink mb-1">Creating Your Account</h4>
                      <ul className="list-disc list-inside text-sm text-neutral-600 space-y-1 ml-2">
                        <li>Click "Login/Sign Up" on the homepage</li>
                        <li>Sign up with the same email address the organizer used to add you</li>
                        <li>Verify your email address</li>
                        <li>The event will automatically appear in your dashboard</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="border-l-2 border-primary pl-4">
                  <h3 className="flex items-center gap-2 text-base font-semibold text-ink mb-2">
                    <span className="w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center">2</span>
                    Accessing Your Events
                  </h3>
                  <ul className="list-disc list-inside text-sm text-neutral-600 space-y-1 ml-2">
                    <li>Log in to your Ask Freely account</li>
                    <li>Your dashboard shows all events where you have MC access</li>
                    <li>Events you're an MC for are clearly labeled</li>
                    <li>Click on an event to open the moderation interface</li>
                  </ul>
                </div>

                {/* Step 3 */}
                <div className="border-l-2 border-primary pl-4">
                  <h3 className="flex items-center gap-2 text-base font-semibold text-ink mb-2">
                    <span className="w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center">3</span>
                    Moderating Questions
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <h4 className="text-sm font-medium text-ink mb-1">What You Can Do</h4>
                      <ul className="list-disc list-inside text-sm text-neutral-600 space-y-1 ml-2">
                        <li><strong>View all questions:</strong> See questions in real-time as they're submitted</li>
                        <li><strong>Mark as answered:</strong> Track which questions have been addressed</li>
                        <li><strong>Hide questions:</strong> Remove inappropriate or duplicate questions</li>
                        <li><strong>View hidden questions:</strong> Review all hidden questions</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-ink mb-1">What You Cannot Do</h4>
                      <ul className="list-disc list-inside text-sm text-neutral-600 space-y-1 ml-2">
                        <li>Change event settings (name, description, visibility)</li>
                        <li>Delete the event</li>
                        <li>Add or remove other MCs</li>
                        <li>Export data (only organizers can export)</li>
                      </ul>
                    </div>
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex gap-2">
                      <i className="fas fa-lightbulb text-amber-500 mt-0.5"></i>
                      <p className="text-xs text-amber-800"><strong>Tip:</strong> Use the "Mark as Answered" feature to keep track of your progress during live Q&A sessions.</p>
                    </div>
                  </div>
                </div>

                {/* Step 4 */}
                <div className="border-l-2 border-primary pl-4">
                  <h3 className="flex items-center gap-2 text-base font-semibold text-ink mb-2">
                    <span className="w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center">4</span>
                    Real-Time Collaboration
                  </h3>
                  <div className="space-y-3">
                    <p className="text-sm text-neutral-600">
                      Multiple MCs and the organizer can work together simultaneously. Changes made
                      by any moderator are instantly visible to everyone else. This makes it easy to:
                    </p>
                    <ul className="list-disc list-inside text-sm text-neutral-600 space-y-1 ml-2">
                      <li>Share moderation duties during large events</li>
                      <li>Tag-team between different moderators</li>
                      <li>Coordinate question selection with the speaker</li>
                    </ul>
                  </div>
                </div>

                {/* Step 5 */}
                <div className="border-l-2 border-primary pl-4">
                  <h3 className="flex items-center gap-2 text-base font-semibold text-ink mb-2">
                    <span className="w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center">5</span>
                    Best Practices for MCs
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <h4 className="text-sm font-medium text-ink mb-1">Before the Event</h4>
                      <ul className="list-disc list-inside text-sm text-neutral-600 space-y-1 ml-2">
                        <li>Confirm your access with the organizer</li>
                        <li>Familiarize yourself with the moderation tools</li>
                        <li>Agree on moderation guidelines with the organizer</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-ink mb-1">During the Event</h4>
                      <ul className="list-disc list-inside text-sm text-neutral-600 space-y-1 ml-2">
                        <li>Monitor questions actively for inappropriate content</li>
                        <li>Mark questions as answered to track progress</li>
                        <li>Hide duplicates to keep the queue clean</li>
                        <li>Coordinate with other MCs if multiple moderators are active</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-ink mb-1">Moderation Guidelines</h4>
                      <ul className="list-disc list-inside text-sm text-neutral-600 space-y-1 ml-2">
                        <li><strong>Hide questions that are:</strong> Spam, offensive, off-topic, duplicates, or irrelevant</li>
                        <li><strong>Keep questions that are:</strong> On-topic, respectful, clear, and relevant</li>
                        <li><strong>When in doubt:</strong> Leave it visible and let the organizer decide</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Step 6 */}
                <div className="border-l-2 border-primary pl-4">
                  <h3 className="flex items-center gap-2 text-base font-semibold text-ink mb-2">
                    <span className="w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center">6</span>
                    Communication with Organizers
                  </h3>
                  <div className="space-y-3">
                    <p className="text-sm text-neutral-600">As an MC, maintain good communication with the event organizer:</p>
                    <ul className="list-disc list-inside text-sm text-neutral-600 space-y-1 ml-2">
                      <li>Report any technical issues immediately</li>
                      <li>Share feedback about question quality or volume</li>
                      <li>Coordinate moderation approach for consistency</li>
                      <li>Ask for clarification on ambiguous moderation decisions</li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* FAQ */}
          {activeTab === 'faq' && (
            <section>
              <h2 className="text-xl font-bold text-ink mb-2 font-['Space_Grotesk']">Frequently Asked Questions</h2>
              <p className="text-sm text-neutral-600 mb-6">
                Quick answers to common questions about Ask Freely.
              </p>

              <div className="space-y-2">
                {faqData.map((faq, index) => (
                  <div key={index} className="border border-neutral-200 rounded-lg overflow-hidden">
                    <button
                      className="w-full flex items-center justify-between p-4 text-left bg-white hover:bg-neutral-50 transition-colors"
                      onClick={() => toggleFaq(index)}
                    >
                      <span className="text-sm font-medium text-ink pr-4">{faq.question}</span>
                      <i className={`fas fa-chevron-${openFaq === index ? 'up' : 'down'} text-neutral-400 text-xs flex-shrink-0`}></i>
                    </button>
                    {openFaq === index && (
                      <div className="px-4 pb-4 bg-neutral-50 border-t border-neutral-200">
                        <p className="text-sm text-neutral-600 pt-3">{faq.answer}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-8 p-4 bg-neutral-100 rounded-lg text-center">
                <h3 className="text-sm font-semibold text-ink mb-2">Still have questions?</h3>
                <p className="text-sm text-neutral-600">
                  If you couldn't find what you're looking for, please check our{' '}
                  <Link to="/terms-of-service" className="text-primary hover:underline">Terms of Service</Link> or{' '}
                  <Link to="/privacy-policy" className="text-primary hover:underline">Privacy Policy</Link> for more detailed information.
                </p>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

export default Help;
