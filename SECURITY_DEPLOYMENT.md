# Security Deployment Guide

This guide walks you through deploying all security features to production.

## Prerequisites

- Firebase CLI installed: `npm install -g firebase-tools`
- Firebase project configured
- Admin access to Firebase Console

---

## Step 1: Deploy Firebase Security Rules

### Database Rules

1. **Review the rules:**
   ```bash
   cat database.rules.json
   ```

2. **Test locally (optional but recommended):**
   ```bash
   firebase emulators:start
   ```

3. **Deploy to Firebase:**
   ```bash
   firebase deploy --only database
   ```

4. **Verify in Firebase Console:**
   - Go to Firebase Console → Realtime Database → Rules
   - Confirm rules are active
   - Check "Last deployed" timestamp

### Storage Rules

1. **Review the rules:**
   ```bash
   cat storage.rules
   ```

2. **Deploy to Firebase:**
   ```bash
   firebase deploy --only storage
   ```

3. **Verify in Firebase Console:**
   - Go to Firebase Console → Storage → Rules
   - Confirm rules are active

---

## Step 2: Configure Security Headers (Netlify)

The `_headers` file is already in `public/` directory and will be automatically deployed with your site.

**Verify after deployment:**
1. Visit your site
2. Open DevTools → Network tab
3. Refresh page
4. Click on main document
5. Check Response Headers for:
   - `X-Frame-Options`
   - `Content-Security-Policy`
   - `Strict-Transport-Security`

**If headers are missing:**
- Ensure `_headers` file is in `public/` folder
- Netlify automatically processes files starting with `_`

---

## Step 3: Initialize Security in Your App

### Update App.jsx

Add security initialization to your main app component:

```javascript
// src/App.jsx
import { useEffect } from 'react';
import { initializeSecurity } from './utils/security';

function App() {
  useEffect(() => {
    // Initialize security features
    initializeSecurity();
  }, []);

  // ... rest of your app
}
```

### Update AuthContext.jsx

Add cleanup on logout:

```javascript
// src/context/AuthContext.jsx
import { cleanupOnLogout } from '../utils/security';

export const AuthProvider = ({ children }) => {
  // ... existing code

  const logout = async () => {
    try {
      await signOut(auth);
      cleanupOnLogout(); // Add this line
      setCurrentUser(null);
      setUserProfile(null);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  // ... rest of code
};
```

---

## Step 4: Add Validation to Forms

### Example: Question Submission Form

```javascript
// src/Components/ParticipantForm.jsx
import { validateQuestion } from '../utils/validation';
import { checkRateLimit, incrementRateLimit } from '../utils/rateLimiter';

async function handleSubmitQuestion(questionText, userId) {
  // 1. Validate input
  const validation = validateQuestion(questionText);
  if (!validation.valid) {
    setError(validation.error);
    return;
  }

  // 2. Check rate limit
  const rateCheck = await checkRateLimit(userId, 'questionSubmission');
  if (!rateCheck.allowed) {
    setError(rateCheck.error);
    return;
  }

  // 3. Submit question with sanitized text
  try {
    await submitQuestion({
      questionText: validation.sanitized,
      // ... other fields
    });

    // 4. Increment rate limit counter
    await incrementRateLimit(userId, 'questionSubmission');

    setSuccess(true);
  } catch (error) {
    setError(error.message);
  }
}
```

### Example: Event Creation

```javascript
// src/Components/CreateEvent.jsx
import { validateSlug, sanitizeText } from '../utils/validation';
import { checkRateLimit, incrementRateLimit } from '../utils/rateLimiter';

async function handleCreateEvent(eventData, userId) {
  // 1. Validate slug
  const slugValidation = validateSlug(eventData.slug);
  if (!slugValidation.valid) {
    setError(slugValidation.error);
    return;
  }

  // 2. Sanitize text fields
  const sanitizedEvent = {
    ...eventData,
    slug: slugValidation.sanitized,
    title: sanitizeText(eventData.title, 200),
    description: sanitizeText(eventData.description, 2000),
    tagline: sanitizeText(eventData.tagline, 300)
  };

  // 3. Check rate limit
  const rateCheck = await checkRateLimit(userId, 'eventCreation');
  if (!rateCheck.allowed) {
    setError(rateCheck.error);
    return;
  }

  // 4. Create event
  try {
    await createEvent(sanitizedEvent);
    await incrementRateLimit(userId, 'eventCreation');
    navigate('/organizer/dashboard');
  } catch (error) {
    setError(error.message);
  }
}
```

### Example: Login Form

```javascript
// src/Components/Login.jsx
import { validateEmail } from '../utils/validation';
import { ClientRateLimiter } from '../utils/rateLimiter';

function Login() {
  const loginLimiter = new ClientRateLimiter('login', 5, 15 * 60 * 1000);

  async function handleLogin(email, password) {
    // 1. Validate email
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      setError(emailValidation.error);
      return;
    }

    // 2. Check rate limit (client-side)
    const rateCheck = loginLimiter.check();
    if (!rateCheck.allowed) {
      setError(rateCheck.error);
      return;
    }

    // 3. Attempt login
    try {
      await login(emailValidation.sanitized, password);
      loginLimiter.reset(); // Clear on success
      navigate('/organizer/dashboard');
    } catch (error) {
      loginLimiter.increment(); // Increment on failure
      setError(error.message);
    }
  }

  // ... rest of component
}
```

---

## Step 5: Add File Upload Validation

```javascript
// src/Components/EventSetup.jsx
import { validateFile } from '../utils/validation';

async function handleFileUpload(file) {
  // Validate file
  const validation = validateFile(file, {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp']
  });

  if (!validation.valid) {
    setError(validation.error);
    return;
  }

  // Upload file
  try {
    const url = await uploadToFirebaseStorage(file);
    setLogoUrl(url);
  } catch (error) {
    setError('Upload failed: ' + error.message);
  }
}
```

---

## Step 6: Environment Variables

### Required Environment Variables

Create `.env.production`:

```env
# Firebase Config (public - safe to include)
REACT_APP_FIREBASE_API_KEY=your-api-key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
REACT_APP_FIREBASE_DATABASE_URL=https://your-project.firebaseio.com
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
REACT_APP_FIREBASE_APP_ID=your-app-id

# reCAPTCHA Site Key (public - safe to include)
REACT_APP_RECAPTCHA_SITE_KEY=your-recaptcha-site-key

# Environment
REACT_APP_ENV=production
```

**Never commit:**
- `.env.production` → Add to `.gitignore`
- `.env.local`
- Any file with actual credentials

**For Netlify:**
- Environment variables are set in netlify.toml or Netlify UI
- See existing netlify.toml for configuration

---

## Step 7: Test Security Features

### Manual Testing Checklist

**Authentication:**
- [ ] Sign up requires email verification
- [ ] Login blocked until email verified
- [ ] Rate limiting blocks rapid login attempts
- [ ] Google OAuth works correctly

**Input Validation:**
- [ ] XSS attempts are sanitized (try `<script>alert('xss')</script>`)
- [ ] SQL injection patterns are blocked
- [ ] Long inputs are truncated
- [ ] Invalid email formats rejected

**Rate Limiting:**
- [ ] Question submission blocked after limit
- [ ] Event creation blocked after limit
- [ ] Error messages show retry time

**File Uploads:**
- [ ] Large files rejected (>5MB)
- [ ] Non-image files rejected
- [ ] Incorrect extensions rejected

**Authorization:**
- [ ] Users can't access other users' events
- [ ] Draft events hidden from participants
- [ ] Questions respect approval settings

**Security Headers:**
- [ ] CSP violations logged in console
- [ ] X-Frame-Options prevents iframe embedding
- [ ] HTTPS enforced (HTTP redirects to HTTPS)

### Automated Testing

```bash
# Run tests
npm test

# Security audit
npm audit

# Check for vulnerabilities
npm audit fix
```

---

## Step 8: Monitoring & Logging

### Firebase Console Monitoring

1. **Database Usage:**
   - Monitor read/write operations
   - Watch for unusual spikes
   - Check rule denials

2. **Storage Usage:**
   - Monitor upload frequency
   - Check file sizes
   - Watch for abuse

3. **Authentication:**
   - Monitor new signups
   - Check for suspicious patterns
   - Review failed login attempts

### Browser Console Monitoring

Security utilities log important events:
- `✅ Security features initialized`
- `⚠️ Security Alert: Rapid form submissions`
- `🚨 CSP Violation: ...`

### Set Up Alerts

In Firebase Console:
1. Go to Project Settings → Usage and billing
2. Set up budget alerts
3. Monitor quotas

---

## Step 9: Incident Response Plan

### If Security Breach Detected:

1. **Immediate Actions:**
   ```bash
   # Revoke all sessions
   firebase auth:import --hash-algo STANDARD_SCRYPT ...

   # Update security rules
   firebase deploy --only database,storage
   ```

2. **Assess Damage:**
   - Check Firebase logs
   - Review affected users
   - Identify vulnerability

3. **Notify Users:**
   - Email affected users
   - Require password reset
   - Explain what happened

4. **Fix Vulnerability:**
   - Deploy patch immediately
   - Test thoroughly
   - Update documentation

5. **Post-Mortem:**
   - Document incident
   - Update security procedures
   - Improve monitoring

---

## Step 10: Maintenance Schedule

### Daily:
- Monitor Firebase logs
- Check error rates

### Weekly:
- Review security alerts
- Check rate limit effectiveness
- Monitor storage usage

### Monthly:
- Update dependencies: `npm update`
- Security audit: `npm audit`
- Review user reports

### Quarterly:
- Review Firebase security rules
- Update CSP if needed
- Test all security features
- Update this documentation

### Annually:
- Penetration testing
- Security audit by third party
- Rotate API keys
- Review compliance requirements

---

## Rollback Procedure

If security deployment causes issues:

```bash
# Rollback database rules
firebase deploy --only database

# Check previous version in Firebase Console
# Rules tab → "Rollback" button

# Rollback storage rules
firebase deploy --only storage
```

For code changes:
```bash
# Revert commit
git revert <commit-hash>
git push

# Netlify will auto-deploy the revert
```

---

## Success Verification

After deployment, verify:

1. **Firebase Console:**
   - Rules show "Deployed" status
   - Last deployed timestamp is recent

2. **Live Site:**
   - Check response headers (DevTools)
   - Test authentication flow
   - Verify rate limiting works
   - Test file uploads

3. **User Testing:**
   - Create test accounts
   - Submit test questions
   - Verify all features work

4. **Security Scan:**
   - Run `npm audit`
   - Check for CSP violations
   - Verify HTTPS enforcement

---

## Troubleshooting

### Issue: Rules not deploying
```bash
# Check Firebase CLI version
firebase --version

# Update if needed
npm install -g firebase-tools

# Re-authenticate
firebase login

# Deploy with debug
firebase deploy --only database --debug
```

### Issue: Headers not showing
- Verify `_headers` file is in `public/` folder
- Check Netlify deploy logs
- Clear browser cache
- Use incognito mode to test

### Issue: Rate limiting not working
- Check if user is authenticated
- Verify database rules allow writes to `rateLimits/`
- Check browser console for errors

---

## Support

For security-related questions:
- **Security Issues**: security@askfreely.com (private)
- **General Help**: Open GitHub issue (non-security only)
- **Documentation**: See SECURITY.md

---

Last Updated: 2025-01-XX
