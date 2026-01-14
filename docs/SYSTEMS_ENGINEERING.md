# Ask Freely - Systems Engineering & Scaling Document

## Table of Contents
1. [Current Architecture](#current-architecture)
2. [Security Assessment](#security-assessment)
3. [Data Protection & Compliance](#data-protection--compliance)
4. [Scaling Strategy](#scaling-strategy)
5. [Rate Limiting](#rate-limiting)
6. [Monitoring & Observability](#monitoring--observability)
7. [Disaster Recovery](#disaster-recovery)
8. [Cost Optimization](#cost-optimization)
9. [Implementation Roadmap](#implementation-roadmap)

---

## Current Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENTS                                  │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐            │
│  │ Mobile  │  │ Desktop │  │  MC     │  │Organizer│            │
│  │ Browser │  │ Browser │  │Dashboard│  │Dashboard│            │
│  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘            │
└───────┼────────────┼────────────┼────────────┼──────────────────┘
        │            │            │            │
        └────────────┴─────┬──────┴────────────┘
                           │
                    ┌──────▼──────┐
                    │   Firebase   │
                    │   Hosting    │
                    │  (React SPA) │
                    └──────┬──────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
┌───────▼───────┐  ┌───────▼───────┐  ┌───────▼───────┐
│   Firebase    │  │   Firebase    │  │   Firebase    │
│   Realtime    │  │   Storage     │  │Authentication │
│   Database    │  │   (Images)    │  │   (Auth)      │
└───────────────┘  └───────────────┘  └───────────────┘
```

### Current Stack
- **Frontend**: React 18 (CRA) + Tailwind CSS
- **Database**: Firebase Realtime Database
- **Storage**: Firebase Storage (images/flyers)
- **Auth**: Firebase Authentication (Email/Password, Google)
- **Hosting**: Firebase Hosting (assumed)

---

## Security Assessment

### Current Security Status: ✅ GOOD (with improvements needed)

#### What's Working Well
1. **Database Rules**: Proper owner-based access control
2. **Storage Rules**: File type and size validation
3. **Auth Integration**: Firebase Auth properly integrated
4. **Input Validation**: Server-side validation in rules

#### Security Improvements Needed

### 1. Content Security Policy (CSP)
Add to `public/index.html`:
```html
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' 'unsafe-inline' https://apis.google.com;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com;
  img-src 'self' data: https: blob:;
  connect-src 'self' https://*.firebaseio.com https://*.googleapis.com wss://*.firebaseio.com;
  frame-src https://accounts.google.com;
">
```

### 2. XSS Prevention
Create `src/utils/sanitize.js`:
```javascript
import DOMPurify from 'dompurify';

export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [], // Strip all HTML
    ALLOWED_ATTR: []
  });
};

export const sanitizeQuestion = (question) => {
  return {
    ...question,
    question: sanitizeInput(question.question),
    author: sanitizeInput(question.author),
    notes: question.notes ? sanitizeInput(question.notes) : ''
  };
};
```

### 3. Rate Limiting (Client-Side)
Create `src/utils/rateLimiter.js`:
```javascript
class RateLimiter {
  constructor(maxRequests, windowMs) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.requests = [];
  }

  canMakeRequest() {
    const now = Date.now();
    this.requests = this.requests.filter(time => now - time < this.windowMs);

    if (this.requests.length >= this.maxRequests) {
      return false;
    }

    this.requests.push(now);
    return true;
  }

  getTimeUntilReset() {
    if (this.requests.length === 0) return 0;
    const oldestRequest = Math.min(...this.requests);
    return Math.max(0, this.windowMs - (Date.now() - oldestRequest));
  }
}

// Limits
export const questionLimiter = new RateLimiter(10, 60000); // 10 questions/minute
export const eventLimiter = new RateLimiter(5, 3600000);    // 5 events/hour
export const upvoteLimiter = new RateLimiter(30, 60000);    // 30 upvotes/minute
```

### 4. Environment Variables Security
Ensure `.env` is in `.gitignore` and use:
```env
# .env.local (never commit)
REACT_APP_FIREBASE_API_KEY=xxx
REACT_APP_FIREBASE_AUTH_DOMAIN=xxx
REACT_APP_FIREBASE_DATABASE_URL=xxx
REACT_APP_FIREBASE_PROJECT_ID=xxx
REACT_APP_FIREBASE_STORAGE_BUCKET=xxx
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=xxx
REACT_APP_FIREBASE_APP_ID=xxx

# Feature flags
REACT_APP_ENABLE_ANALYTICS=true
REACT_APP_MAX_QUESTIONS_PER_EVENT=500
REACT_APP_MAX_PARTICIPANTS_FREE=50
```

---

## Data Protection & Compliance

### Nigeria Data Protection Regulation (NDPR) Compliance

#### Required Actions:

### 1. Privacy Policy
Create a privacy policy page covering:
- What data is collected
- How data is used
- Data retention periods
- User rights (access, deletion, portability)
- Third-party sharing (Firebase/Google)

### 2. User Consent
```javascript
// Add to registration/first use
const ConsentBanner = () => {
  const [consented, setConsented] = useState(false);

  const handleConsent = () => {
    localStorage.setItem('privacy_consent', Date.now());
    setConsented(true);
  };

  return (
    <div className="consent-banner">
      <p>By using Ask Freely, you agree to our Privacy Policy...</p>
      <button onClick={handleConsent}>I Accept</button>
    </div>
  );
};
```

### 3. Data Retention Policy
```javascript
// Implement auto-cleanup for old events
// Firebase Cloud Function (future implementation)
exports.cleanupOldEvents = functions.pubsub
  .schedule('0 0 * * *') // Daily at midnight
  .onRun(async (context) => {
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - 12); // 12 months retention

    // Archive or delete events older than cutoff
  });
```

### 4. User Data Export
Implement account data export feature:
```javascript
export const exportUserData = async (userId) => {
  const userData = await get(ref(database, `users/${userId}`));
  const userEvents = await get(query(
    ref(database, 'events'),
    orderByChild('organizerId'),
    equalTo(userId)
  ));

  return {
    profile: userData.val(),
    events: userEvents.val(),
    exportDate: new Date().toISOString()
  };
};
```

### 5. Right to Deletion
```javascript
export const deleteUserAccount = async (userId) => {
  // 1. Delete user's events
  // 2. Delete user's questions
  // 3. Delete user's storage files
  // 4. Delete user profile
  // 5. Delete Firebase Auth account
};
```

---

## Scaling Strategy

### Firebase Realtime Database Scaling

#### Current Limits (Spark Plan - Free)
- 1 GB storage
- 10 GB/month download
- 100 simultaneous connections

#### Blaze Plan (Pay-as-you-go)
- Unlimited storage
- $5/GB storage
- $1/GB download
- 200,000 simultaneous connections

### Scaling Thresholds

| Metric | Free Tier | Action Point | Solution |
|--------|-----------|--------------|----------|
| Storage | 1 GB | 800 MB | Upgrade to Blaze |
| Bandwidth | 10 GB/mo | 8 GB/mo | Implement caching |
| Connections | 100 | 80 | Add connection pooling |
| Events | ~500 | 400 | Implement pagination |

### Database Optimization

#### 1. Data Denormalization
Current structure is good, but consider:
```javascript
// Store event summary in user profile for faster dashboard loading
"users": {
  "userId": {
    "eventCount": 5,
    "totalQuestions": 150,
    "recentEvents": ["eventId1", "eventId2", "eventId3"]
  }
}
```

#### 2. Indexing
Add to database rules:
```json
{
  "rules": {
    "events": {
      ".indexOn": ["organizerId", "status", "createdAt", "slug"]
    },
    "questions": {
      "$eventId": {
        ".indexOn": ["status", "timestamp", "upvotes"]
      }
    }
  }
}
```

#### 3. Pagination
```javascript
// Implement cursor-based pagination
const loadMoreQuestions = async (eventId, lastTimestamp, limit = 20) => {
  const questionsRef = ref(database, `questions/${eventId}`);
  const q = query(
    questionsRef,
    orderByChild('timestamp'),
    startAfter(lastTimestamp),
    limitToFirst(limit)
  );
  return get(q);
};
```

### CDN & Caching Strategy

#### 1. Static Assets
Firebase Hosting automatically uses CDN. Ensure cache headers:
```json
// firebase.json
{
  "hosting": {
    "headers": [
      {
        "source": "**/*.@(js|css)",
        "headers": [
          { "key": "Cache-Control", "value": "max-age=31536000" }
        ]
      },
      {
        "source": "**/*.@(jpg|jpeg|gif|png|svg|webp)",
        "headers": [
          { "key": "Cache-Control", "value": "max-age=31536000" }
        ]
      }
    ]
  }
}
```

#### 2. API Response Caching
```javascript
// Client-side caching with SWR or React Query
import useSWR from 'swr';

const useEvent = (eventId) => {
  return useSWR(`event/${eventId}`, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60000, // 1 minute
  });
};
```

---

## Rate Limiting

### Implementation Plan

#### 1. Client-Side Rate Limiting
Already outlined above in security section.

#### 2. Firebase Rules Rate Limiting
Update `database.rules.json`:
```json
"rateLimits": {
  "$userId": {
    ".read": "$userId === auth.uid",
    ".write": "$userId === auth.uid && (
      !data.exists() ||
      data.child('lastRequest').val() < now - 1000
    )"
  }
}
```

#### 3. Abuse Detection
```javascript
// Track suspicious patterns
const detectAbuse = (userId, action) => {
  const patterns = {
    rapidQuestions: 20,    // 20 questions in 5 minutes
    massUpvotes: 50,       // 50 upvotes in 1 minute
    eventSpam: 10          // 10 events in 1 hour
  };

  // Log and alert if threshold exceeded
};
```

---

## Monitoring & Observability

### 1. Firebase Analytics (Free)
- User engagement
- Screen views
- Custom events

### 2. Error Tracking
```javascript
// Add error boundary with reporting
class ErrorBoundary extends React.Component {
  componentDidCatch(error, errorInfo) {
    // Log to Firebase Analytics
    logEvent(analytics, 'error', {
      error: error.message,
      stack: errorInfo.componentStack
    });
  }
}
```

### 3. Performance Monitoring
```javascript
// Firebase Performance
import { getPerformance, trace } from 'firebase/performance';

const perf = getPerformance();

// Custom traces
const loadEventTrace = trace(perf, 'load_event');
loadEventTrace.start();
// ... load event
loadEventTrace.stop();
```

### 4. Uptime Monitoring
- Use UptimeRobot (free) or Better Uptime
- Monitor: Main site, Event pages, API endpoints

---

## Disaster Recovery

### Backup Strategy

#### 1. Database Backups
Firebase doesn't auto-backup on free tier. Options:
- **Manual**: Export via Firebase Console weekly
- **Automated**: Firebase Cloud Functions + Cloud Storage

```javascript
// Cloud Function for automated backup
exports.backupDatabase = functions.pubsub
  .schedule('0 2 * * 0') // Weekly, Sunday 2 AM
  .onRun(async () => {
    // Export database to Cloud Storage
  });
```

#### 2. Recovery Procedures
Document in runbook:
1. Identify issue scope
2. Switch to maintenance mode
3. Restore from backup
4. Verify data integrity
5. Resume operations

### High Availability
Firebase provides 99.95% SLA on Blaze plan.

---

## Cost Optimization

### Current (Spark Plan): $0/month

### Projected Costs (Blaze Plan)

| Users/Month | Storage | Bandwidth | Auth | Total/Month |
|-------------|---------|-----------|------|-------------|
| 100 | $0.50 | $1 | $0 | ~$2 |
| 1,000 | $2 | $5 | $0 | ~$7 |
| 10,000 | $10 | $25 | $6 | ~$41 |
| 50,000 | $25 | $100 | $30 | ~$155 |

### Cost Saving Strategies

1. **Image Optimization**
   - Compress on upload
   - Use WebP format
   - Implement lazy loading

2. **Query Optimization**
   - Avoid deep listeners
   - Use specific paths
   - Implement pagination

3. **Connection Management**
   - Disconnect on idle
   - Use presence system efficiently

---

## Implementation Roadmap

### Phase 1: Security Hardening (Week 1-2)
- [ ] Add Content Security Policy
- [ ] Implement input sanitization
- [ ] Add client-side rate limiting
- [ ] Audit and update Firebase rules
- [ ] Add error tracking

### Phase 2: Data Protection (Week 2-3)
- [ ] Create Privacy Policy page
- [ ] Implement consent mechanism
- [ ] Add data export feature
- [ ] Add account deletion feature
- [ ] Document data retention policy

### Phase 3: Performance (Week 3-4)
- [ ] Implement response caching
- [ ] Add database indexes
- [ ] Implement pagination
- [ ] Optimize images
- [ ] Add performance monitoring

### Phase 4: Scaling Prep (Week 4-5)
- [ ] Upgrade to Blaze plan (when needed)
- [ ] Set up automated backups
- [ ] Configure alerting
- [ ] Document runbooks
- [ ] Load test critical paths

---

## Appendix: Quick Reference

### Firebase Console Links
- Database Rules: Firebase Console > Realtime Database > Rules
- Storage Rules: Firebase Console > Storage > Rules
- Analytics: Firebase Console > Analytics
- Performance: Firebase Console > Performance

### Emergency Contacts
- Firebase Status: https://status.firebase.google.com/
- Firebase Support: https://firebase.google.com/support

### Key Metrics to Monitor
1. Simultaneous connections (limit: 100 free, 200k paid)
2. Database size (limit: 1GB free)
3. Bandwidth usage (limit: 10GB/month free)
4. Error rate (target: <1%)
5. Response time (target: <500ms)
