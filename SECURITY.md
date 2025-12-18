# Security Guide for Ask Freely

This guide documents all security measures implemented in the Ask Freely application to protect user data and prevent common vulnerabilities.

## Table of Contents

1. [Overview](#overview)
2. [Firebase Security Rules](#firebase-security-rules)
3. [Input Validation & Sanitization](#input-validation--sanitization)
4. [Rate Limiting](#rate-limiting)
5. [CSRF Protection](#csrf-protection)
6. [Security Headers](#security-headers)
7. [Authentication & Authorization](#authentication--authorization)
8. [Data Encryption](#data-encryption)
9. [Best Practices](#best-practices)
10. [Security Checklist](#security-checklist)

---

## Overview

Ask Freely implements multiple layers of security to protect user information:

- **Firebase Security Rules** - Database and storage access control
- **Input Validation** - Sanitize all user inputs to prevent XSS and injection attacks
- **Rate Limiting** - Prevent abuse and spam
- **CSRF Protection** - Prevent cross-site request forgery
- **Security Headers** - HTTP headers to prevent common attacks
- **Authentication** - Email verification and Google OAuth
- **HTTPS Enforcement** - All traffic encrypted in transit

---

## Firebase Security Rules

### Database Rules

Location: `database.rules.json`

**User Data Protection:**
- Users can only read/write their own data (`users/{uid}`)
- Email validation and field type checking
- Role-based access control (organizer/admin)

**Event Access Control:**
- Organizers own their events and have full control
- Participants can read published/unlisted events only
- Draft events are private to the organizer

**Question Management:**
- Organizers see all questions (pending, approved, rejected)
- Participants see only approved/answered questions
- Submissions controlled by event settings (`enableQuestionSubmission`)

**Rate Limiting:**
- Question submissions: 100 per hour per user
- Event creations: 50 per day per user

### Storage Rules

Location: `storage.rules`

**File Upload Security:**
- Max file size: 5MB for images
- Allowed types: JPEG, PNG, GIF, WebP only
- File extension must match MIME type
- Users can only upload to their own folders

**Access Control:**
- Event logos/flyers: Public read, organizer-only write
- User profiles: Authenticated read, owner-only write
- Temp uploads: Owner-only access

---

## Input Validation & Sanitization

Location: `src/utils/validation.js`

### Functions Available:

#### Text Sanitization
```javascript
import { sanitizeText, sanitizeHtml } from './utils/validation';

// Remove HTML tags and dangerous characters
const clean = sanitizeText(userInput, maxLength);

// Sanitize HTML (for rich text)
const cleanHtml = sanitizeHtml(htmlContent);
```

#### Email Validation
```javascript
import { validateEmail } from './utils/validation';

const result = validateEmail(email);
// Returns: { valid: boolean, sanitized: string, error: string | null }
```

#### Password Validation
```javascript
import { validatePassword } from './utils/validation';

const result = validatePassword(password);
// Returns: { valid: boolean, strength: 0-4, errors: string[] }
```

#### URL Sanitization
```javascript
import { sanitizeUrl } from './utils/validation';

// Prevents javascript:, data:, and other dangerous protocols
const safeUrl = sanitizeUrl(userUrl);
```

#### Slug Validation
```javascript
import { validateSlug } from './utils/validation';

const result = validateSlug(eventSlug);
// Returns: { valid: boolean, sanitized: string, error: string | null }
// Converts to lowercase, removes invalid chars, checks reserved words
```

#### Question/Response Validation
```javascript
import { validateQuestion, validateResponse } from './utils/validation';

const questionResult = validateQuestion(text, maxLength);
const responseResult = validateResponse(text, maxLength);
// Both check for spam patterns, length limits, and sanitize HTML
```

### Validation Rules:

- **Emails**: RFC 5322 compliant, max 254 characters
- **Passwords**: Min 6 characters, strength scoring (0-4)
- **Questions**: 5-1000 characters, spam detection
- **Responses**: 1-2000 characters
- **Organization Names**: Max 200 characters, no HTML
- **Slugs**: Lowercase, alphanumeric + hyphens, 3-100 chars
- **Colors**: Valid hex format (#RRGGBB)

---

## Rate Limiting

Location: `src/utils/rateLimiter.js`

### Firebase-Based Rate Limiting

```javascript
import { checkRateLimit, incrementRateLimit } from './utils/rateLimiter';

// Check if user can perform action
const { allowed, retryAfter, remaining } = await checkRateLimit(userId, 'questionSubmission');

if (!allowed) {
  alert(`Rate limit exceeded. Try again in ${retryAfter} seconds.`);
  return;
}

// Perform action
await submitQuestion(data);

// Increment counter
await incrementRateLimit(userId, 'questionSubmission');
```

### Rate Limits:

| Action | Limit | Window |
|--------|-------|--------|
| Question Submission | 10 requests | Per hour |
| Event Creation | 5 requests | Per day |
| Login Attempts | 5 requests | Per 15 min |
| Password Reset | 3 requests | Per hour |
| File Upload | 20 requests | Per hour |

### Client-Side Rate Limiting

```javascript
import { ClientRateLimiter } from './utils/rateLimiter';

const limiter = new ClientRateLimiter('myAction', 10, 60000);

const { allowed, error } = limiter.check();
if (!allowed) {
  alert(error);
  return;
}

limiter.increment();
```

### Helper Functions:

```javascript
import { debounce, throttle } from './utils/rateLimiter';

// Debounce: Wait for user to stop typing
const debouncedSearch = debounce(searchFunction, 300);

// Throttle: Limit execution frequency
const throttledScroll = throttle(handleScroll, 1000);
```

---

## CSRF Protection

Location: `src/utils/security.js`

### How It Works:

1. **Token Generation**: Unique CSRF token generated per session
2. **Token Storage**: Stored in sessionStorage (not accessible to other sites)
3. **Token Validation**: Sent with each state-changing request

### Usage:

```javascript
import { getCSRFToken, addCSRFHeader } from './utils/security';

// Get token for forms
const token = getCSRFToken();

// Add to request headers
const headers = addCSRFHeader({
  'Content-Type': 'application/json'
});

fetch('/api/endpoint', {
  method: 'POST',
  headers,
  body: JSON.stringify(data)
});
```

### Implementation in Forms:

```jsx
import { getCSRFToken } from './utils/security';

function MyForm() {
  const csrfToken = getCSRFToken();

  return (
    <form>
      <input type="hidden" name="csrf_token" value={csrfToken} />
      {/* form fields */}
    </form>
  );
}
```

---

## Security Headers

Location: `public/_headers`

### Implemented Headers:

```
X-Frame-Options: DENY
  → Prevents clickjacking attacks

X-XSS-Protection: 1; mode=block
  → Enables browser XSS protection

X-Content-Type-Options: nosniff
  → Prevents MIME type sniffing

Referrer-Policy: strict-origin-when-cross-origin
  → Controls referrer information

Permissions-Policy: camera=(), microphone=(), ...
  → Restricts browser features

Content-Security-Policy: ...
  → Prevents XSS and injection attacks

Strict-Transport-Security: max-age=63072000
  → Forces HTTPS (HSTS)
```

### Content Security Policy (CSP):

- **default-src**: Self only
- **script-src**: Self + Google services + reCAPTCHA
- **style-src**: Self + Google Fonts + inline styles
- **img-src**: All HTTPS sources (for user-uploaded images)
- **connect-src**: Self + Firebase + Google Analytics
- **frame-ancestors**: None (prevents embedding)
- **upgrade-insecure-requests**: Forces HTTPS

---

## Authentication & Authorization

### Email/Password Authentication:

1. **Signup:**
   - Password minimum 6 characters (Firebase requirement)
   - Email verification required before login
   - User profile created in database
   - reCAPTCHA v3 verification

2. **Login:**
   - Email verification check
   - Remember me option (stores email only)
   - Rate limited (5 attempts per 15 minutes)
   - reCAPTCHA v3 verification

3. **Password Reset:**
   - Rate limited (3 requests per hour)
   - Email sent through Firebase Auth

### Google OAuth:

- Uses redirect flow (no popup issues)
- Email automatically verified
- User profile auto-created
- reCAPTCHA v3 verification

### Session Management:

```javascript
import { verifyAuthSession } from './utils/security';

// Verify user session is valid
const { valid, user, error } = await verifyAuthSession();

if (!valid) {
  // Redirect to login
  navigate('/login');
}
```

### Role-Based Access:

- **Organizers**: Can create events, manage questions, view analytics
- **Participants**: Can submit questions (if enabled), view published events
- **Admin**: Full access (future implementation)

---

## Data Encryption

### In Transit:

- **HTTPS Enforced**: All traffic encrypted with TLS 1.2+
- **HSTS Header**: Browsers forced to use HTTPS
- **Mixed Content Blocked**: No insecure resources allowed

### At Rest:

- **Firebase Encryption**: All data encrypted by Google Cloud
- **Password Hashing**: Handled by Firebase Auth (bcrypt)
- **API Keys**: Stored as environment variables

### Client-Side:

```javascript
import { SecureStorage } from './utils/security';

// Basic obfuscation for non-sensitive data
SecureStorage.set('key', value);
const value = SecureStorage.get('key');

// For sensitive data: NEVER store client-side
// Always fetch from server on demand
```

---

## Best Practices

### For Developers:

1. **Never Trust User Input**
   - Always validate and sanitize
   - Use validation utilities for all inputs
   - Test with malicious payloads

2. **Use Prepared Statements**
   - Firebase SDK handles this automatically
   - Never concatenate user input into queries

3. **Implement Defense in Depth**
   - Multiple layers of security
   - Client-side AND server-side validation
   - Rate limiting at multiple levels

4. **Keep Dependencies Updated**
   ```bash
   npm audit
   npm update
   ```

5. **Review Firebase Rules Regularly**
   - Test with Firebase emulator
   - Review before each deployment
   ```bash
   firebase deploy --only database:rules
   ```

6. **Monitor Security Events**
   ```javascript
   import { initializeSecurity } from './utils/security';

   // In App.jsx
   useEffect(() => {
     initializeSecurity();
   }, []);
   ```

7. **Handle Errors Securely**
   - Don't expose stack traces to users
   - Use friendly error messages
   - Log detailed errors server-side only

### For Users:

1. **Use Strong Passwords**
   - Minimum 8 characters
   - Mix of uppercase, lowercase, numbers, symbols

2. **Enable Two-Factor Authentication** (Future Feature)

3. **Verify Email Address**
   - Required before account access

4. **Keep Browser Updated**
   - Latest security patches

---

## Security Checklist

### Before Deployment:

- [ ] Firebase Security Rules deployed and tested
- [ ] All user inputs validated and sanitized
- [ ] Rate limiting configured and tested
- [ ] CSRF tokens implemented on all forms
- [ ] Security headers configured in `_headers`
- [ ] HTTPS enforced (redirect HTTP to HTTPS)
- [ ] Environment variables secured
- [ ] reCAPTCHA configured and working
- [ ] Email verification required
- [ ] Error messages don't expose sensitive info
- [ ] Dependencies updated (`npm audit` clean)
- [ ] CSP violations monitored
- [ ] File upload restrictions tested
- [ ] Session timeout configured
- [ ] Logout cleanup implemented

### Regular Maintenance:

- [ ] Review Firebase logs weekly
- [ ] Update dependencies monthly
- [ ] Review security rules quarterly
- [ ] Penetration testing annually
- [ ] Monitor for suspicious activity
- [ ] Review rate limit effectiveness
- [ ] Update CSP as needed
- [ ] Rotate API keys if compromised

### Incident Response:

If a security issue is discovered:

1. **Assess Impact**: What data was affected?
2. **Contain**: Disable compromised features
3. **Notify Users**: If personal data affected
4. **Fix Issue**: Deploy patch immediately
5. **Review**: Prevent similar issues
6. **Document**: Update security guide

---

## Additional Resources

- [Firebase Security Rules Documentation](https://firebase.google.com/docs/rules)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Web Security Academy](https://portswigger.net/web-security)
- [CSP Guide](https://content-security-policy.com/)

---

## Reporting Security Issues

If you discover a security vulnerability, please email: **security@askfreely.com**

**Do NOT** create a public GitHub issue for security vulnerabilities.

We aim to respond within 48 hours and will work with you to address the issue promptly.

---

## License

This security documentation is part of the Ask Freely project.
