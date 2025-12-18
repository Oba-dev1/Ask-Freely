# Security Quick Reference

A quick guide for developers to implement security features correctly.

## Import Statements

```javascript
// Validation
import {
  sanitizeText,
  sanitizeHtml,
  validateEmail,
  validatePassword,
  validateQuestion,
  validateSlug,
  sanitizeUrl,
  validateFile
} from './utils/validation';

// Rate Limiting
import {
  checkRateLimit,
  incrementRateLimit,
  ClientRateLimiter
} from './utils/rateLimiter';

// Security
import {
  getCSRFToken,
  addCSRFHeader,
  verifyAuthSession,
  initializeSecurity,
  cleanupOnLogout
} from './utils/security';
```

---

## Common Patterns

### 1. Form Submission with Validation

```javascript
async function handleSubmit(formData) {
  // 1. Validate
  const validation = validateQuestion(formData.text);
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

  // 3. Submit with sanitized data
  try {
    await submitData({ text: validation.sanitized });
    await incrementRateLimit(userId, 'questionSubmission');
    setSuccess(true);
  } catch (error) {
    setError(error.message);
  }
}
```

### 2. File Upload

```javascript
async function handleFileUpload(file) {
  // Validate file
  const validation = validateFile(file, {
    maxSize: 5 * 1024 * 1024,
    allowedTypes: ['image/jpeg', 'image/png']
  });

  if (!validation.valid) {
    setError(validation.error);
    return;
  }

  // Upload
  const url = await uploadFile(file);
  setFileUrl(url);
}
```

### 3. Client-Side Rate Limiting

```javascript
const limiter = new ClientRateLimiter('myAction', 10, 60000);

function handleAction() {
  const { allowed, error } = limiter.check();
  if (!allowed) {
    alert(error);
    return;
  }

  limiter.increment();
  performAction();
}
```

### 4. Protected Route

```javascript
import { verifyAuthSession } from './utils/security';

function ProtectedRoute({ children }) {
  const [verified, setVerified] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    verifyAuthSession().then(({ valid }) => {
      if (!valid) {
        navigate('/login');
      } else {
        setVerified(true);
      }
    });
  }, []);

  if (!verified) return <LoadingSpinner />;
  return children;
}
```

---

## Validation Cheat Sheet

| Input Type | Function | Max Length | Notes |
|------------|----------|------------|-------|
| Email | `validateEmail()` | 254 | Returns sanitized lowercase |
| Password | `validatePassword()` | N/A | Returns strength 0-4 |
| Question | `validateQuestion()` | 1000 | Removes HTML, checks spam |
| Response | `validateResponse()` | 2000 | Removes HTML |
| Org Name | `sanitizeText()` | 200 | Removes HTML & specials |
| Event Slug | `validateSlug()` | 100 | Lowercase, alphanumeric |
| URL | `sanitizeUrl()` | N/A | Blocks javascript:, data: |
| Color | `validateColor()` | N/A | Must be #RRGGBB |

---

## Rate Limits

| Action | Limit | Window | Firebase Path |
|--------|-------|--------|---------------|
| Question Submit | 10 | 1 hour | `rateLimits/{uid}/questionSubmission` |
| Event Create | 5 | 1 day | `rateLimits/{uid}/eventCreation` |
| Login Attempt | 5 | 15 min | Client-side only |
| Password Reset | 3 | 1 hour | Client-side only |
| File Upload | 20 | 1 hour | `rateLimits/{uid}/fileUpload` |

---

## Security Headers (Netlify)

Headers automatically applied from `public/_headers`:

✅ X-Frame-Options: DENY
✅ X-XSS-Protection: 1; mode=block
✅ X-Content-Type-Options: nosniff
✅ Content-Security-Policy: [see _headers file]
✅ Strict-Transport-Security: max-age=63072000

---

## Firebase Security Rules

### User Data
```json
"users/{uid}": {
  ".read": "$uid === auth.uid",
  ".write": "$uid === auth.uid"
}
```

### Events
```json
"events/{eventId}": {
  ".read": "auth != null && (organizerId === auth.uid || status === 'published')",
  ".write": "auth != null && organizerId === auth.uid"
}
```

### Questions
```json
"questions/{eventId}/{questionId}": {
  ".read": "organizerId === auth.uid || status === 'approved'",
  ".write": "organizerId === auth.uid || enableSubmissions === true"
}
```

---

## Deployment Commands

```bash
# Deploy database rules
firebase deploy --only database

# Deploy storage rules
firebase deploy --only storage

# Deploy everything
firebase deploy

# Test locally
firebase emulators:start
```

---

## Common Mistakes to Avoid

❌ **Don't do this:**
```javascript
// No validation
await submitQuestion(userInput);

// No rate limiting
await createEvent(data);

// Trusting user input
const html = `<div>${userInput}</div>`;

// No file validation
await uploadFile(file);
```

✅ **Do this instead:**
```javascript
// With validation
const { valid, sanitized } = validateQuestion(userInput);
if (valid) await submitQuestion(sanitized);

// With rate limiting
const { allowed } = await checkRateLimit(uid, 'eventCreation');
if (allowed) {
  await createEvent(data);
  await incrementRateLimit(uid, 'eventCreation');
}

// Sanitize user input
const html = `<div>${sanitizeHtml(userInput)}</div>`;

// Validate files
const { valid } = validateFile(file);
if (valid) await uploadFile(file);
```

---

## Security Checklist for New Features

Before merging any PR:

- [ ] All user inputs validated
- [ ] Text inputs sanitized
- [ ] Rate limiting applied
- [ ] Firebase rules updated
- [ ] File uploads validated
- [ ] CSRF token included (forms)
- [ ] Error messages are user-friendly
- [ ] No sensitive data in logs
- [ ] Authentication checked
- [ ] Authorization verified
- [ ] Tested with malicious input

---

## Testing Security

```javascript
// Test XSS
const xssAttempt = '<script>alert("xss")</script>';
const result = validateQuestion(xssAttempt);
// Should sanitize and remove script tags

// Test SQL Injection
const sqlAttempt = "'; DROP TABLE users; --";
const result = sanitizeText(sqlAttempt);
// Should remove or escape dangerous chars

// Test Rate Limiting
for (let i = 0; i < 11; i++) {
  const result = await checkRateLimit(uid, 'questionSubmission');
  console.log(`Attempt ${i + 1}:`, result.allowed);
}
// Should block after 10 attempts
```

---

## Emergency Procedures

### If Security Breach Detected:

1. **Revoke all sessions:**
   ```javascript
   // Force re-authentication
   await auth.signOut();
   ```

2. **Update rules immediately:**
   ```bash
   firebase deploy --only database,storage
   ```

3. **Notify security team:**
   ```
   security@askfreely.com
   ```

### If Rules Broken:

```bash
# Rollback in Firebase Console
# Or redeploy previous version
git checkout <previous-commit> database.rules.json
firebase deploy --only database
```

---

## Support

- **Documentation**: See SECURITY.md
- **Deployment**: See SECURITY_DEPLOYMENT.md
- **Issues**: security@askfreely.com (private)

---

Last Updated: 2025-01-XX
Version: 1.0.0
