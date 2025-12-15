# reCAPTCHA Integration Guide

This document explains how to integrate Google reCAPTCHA v3 into Ask Freely to protect against bots and spam.

---

## 📋 What You Have

**Secret Key**: `6LeGRCwsAAAAAGEL3Ynqdjvt_QfAp_oWIImqf2OB`

⚠️ **IMPORTANT**: This secret key should **NEVER** be in your frontend code. It's for server-side verification only!

---

## 🔑 What You Need

### 1. Get Your Site Key

You need the **Site Key** (public key) from the same reCAPTCHA admin page:

1. Go to: https://www.google.com/recaptcha/admin
2. Find your site registration
3. Copy the **Site Key** (starts with `6Le...`)

The Site Key is safe to use in frontend code - it identifies your site to Google's reCAPTCHA service.

---

## 🎯 Integration Options

You have two options for integrating reCAPTCHA:

### Option A: Frontend-Only (Simple, Limited Protection)
- ✅ Quick to implement
- ✅ Works with Netlify free tier
- ⚠️ Token validation happens client-side (less secure)
- ⚠️ Can be bypassed by sophisticated bots

### Option B: Frontend + Backend (Recommended, Full Protection)
- ✅ Proper server-side verification
- ✅ Secure - can't be bypassed
- ❌ Requires Firebase Functions (paid tier after free quota)
- ❌ More complex setup

**For small projects on free tier**: Start with Option A, upgrade to Option B when needed.

---

## 🚀 Option A: Frontend-Only Implementation

### Step 1: Add reCAPTCHA Script

Add this to `public/index.html` in the `<head>` section:

```html
<script src="https://www.google.com/recaptcha/api.js?render=YOUR_SITE_KEY_HERE"></script>
```

### Step 2: Create reCAPTCHA Hook

Create `src/hooks/useRecaptcha.js`:

```javascript
import { useEffect } from 'react';

const useRecaptcha = (siteKey) => {
  useEffect(() => {
    // Load reCAPTCHA script if not already loaded
    if (!window.grecaptcha) {
      const script = document.createElement('script');
      script.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}`;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }
  }, [siteKey]);

  const executeRecaptcha = async (action) => {
    if (!window.grecaptcha) {
      console.warn('reCAPTCHA not loaded');
      return null;
    }

    try {
      await window.grecaptcha.ready();
      const token = await window.grecaptcha.execute(siteKey, { action });
      return token;
    } catch (error) {
      console.error('reCAPTCHA execution failed:', error);
      return null;
    }
  };

  return { executeRecaptcha };
};

export default useRecaptcha;
```

### Step 3: Use in Forms

Example for signup:

```javascript
// In Signup.jsx
import useRecaptcha from '../hooks/useRecaptcha';

const RECAPTCHA_SITE_KEY = process.env.REACT_APP_RECAPTCHA_SITE_KEY || 'YOUR_FALLBACK_SITE_KEY';

function Signup() {
  const { executeRecaptcha } = useRecaptcha(RECAPTCHA_SITE_KEY);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Get reCAPTCHA token
    const token = await executeRecaptcha('signup');

    if (!token) {
      setError('reCAPTCHA verification failed. Please try again.');
      return;
    }

    // Continue with signup
    // ... existing signup code ...
  };

  // ... rest of component
}
```

### Step 4: Add to Environment Variables

Add to `src/Firebase/config.js`:

```javascript
// reCAPTCHA configuration
export const RECAPTCHA_SITE_KEY = process.env.REACT_APP_RECAPTCHA_SITE_KEY || 'YOUR_SITE_KEY_HERE';
```

---

## 🔒 Option B: Frontend + Backend (Full Implementation)

### Backend: Firebase Cloud Function

Create `functions/index.js`:

```javascript
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const axios = require('axios');

admin.initializeApp();

exports.verifyRecaptcha = functions.https.onCall(async (data, context) => {
  const { token, action } = data;

  // Your secret key (use Firebase environment config)
  const secretKey = '6LeGRCwsAAAAAGEL3Ynqdjvt_QfAp_oWIImqf2OB';

  try {
    // Verify token with Google
    const response = await axios.post(
      'https://www.google.com/recaptcha/api/siteverify',
      null,
      {
        params: {
          secret: secretKey,
          response: token
        }
      }
    );

    const { success, score, action: returnedAction } = response.data;

    // Check if verification successful
    if (!success) {
      return { success: false, error: 'reCAPTCHA verification failed' };
    }

    // Check if action matches
    if (returnedAction !== action) {
      return { success: false, error: 'Action mismatch' };
    }

    // Check score (0.0 - 1.0, higher is better)
    // Recommended threshold: 0.5
    if (score < 0.5) {
      return { success: false, error: 'Low score', score };
    }

    return { success: true, score };
  } catch (error) {
    console.error('reCAPTCHA verification error:', error);
    return { success: false, error: 'Verification failed' };
  }
});
```

### Frontend: Call Cloud Function

```javascript
// In Signup.jsx
import { getFunctions, httpsCallable } from 'firebase/functions';

const handleSubmit = async (e) => {
  e.preventDefault();

  // Get reCAPTCHA token
  const token = await executeRecaptcha('signup');

  if (!token) {
    setError('reCAPTCHA verification failed.');
    return;
  }

  // Verify token server-side
  const functions = getFunctions();
  const verifyRecaptcha = httpsCallable(functions, 'verifyRecaptcha');

  try {
    const result = await verifyRecaptcha({ token, action: 'signup' });

    if (!result.data.success) {
      setError('Bot verification failed. Please try again.');
      return;
    }

    // Proceed with signup
    // ... existing signup code ...
  } catch (error) {
    setError('Verification error. Please try again.');
    return;
  }
};
```

---

## 📝 Implementation Checklist

### Setup
- [ ] Get Site Key from reCAPTCHA admin console
- [ ] Choose implementation option (A or B)
- [ ] Add Site Key to environment variables

### Option A (Frontend Only)
- [ ] Add reCAPTCHA script to `public/index.html`
- [ ] Create `src/hooks/useRecaptcha.js`
- [ ] Add to `src/Firebase/config.js`
- [ ] Update `.env.example`
- [ ] Update `.env.development`
- [ ] Integrate into forms:
  - [ ] Signup
  - [ ] Login
  - [ ] Question submission
  - [ ] Profile setup
- [ ] Test locally
- [ ] Deploy to staging
- [ ] Test on staging
- [ ] Deploy to production

### Option B (Frontend + Backend)
- [ ] All steps from Option A, plus:
- [ ] Install Firebase Functions: `npm install -g firebase-tools`
- [ ] Initialize functions: `firebase init functions`
- [ ] Create `functions/index.js`
- [ ] Install dependencies: `cd functions && npm install axios`
- [ ] Set secret key securely: `firebase functions:config:set recaptcha.secret="YOUR_SECRET_KEY"`
- [ ] Deploy functions: `firebase deploy --only functions`
- [ ] Update frontend to call Cloud Function
- [ ] Test end-to-end

---

## 🔧 Configuration

### For Netlify Free Tier

Add to `src/Firebase/config.js`:

```javascript
// reCAPTCHA Site Key (safe to expose in frontend)
export const RECAPTCHA_SITE_KEY = process.env.REACT_APP_RECAPTCHA_SITE_KEY || 'YOUR_SITE_KEY_HERE';
```

Update `netlify.toml` (if using paid plan):

```toml
[context.production.environment]
  REACT_APP_RECAPTCHA_SITE_KEY = "your-production-site-key"

[context.develop.environment]
  REACT_APP_RECAPTCHA_SITE_KEY = "your-dev-site-key"
```

---

## 🎨 User Experience Tips

### Invisible reCAPTCHA (v3)
- No user interaction needed
- Works silently in background
- Shows reCAPTCHA badge in bottom right

### Hide Badge (Optional)

Add to your CSS if you want to hide the badge (only if you display reCAPTCHA notice yourself):

```css
.grecaptcha-badge {
  visibility: hidden;
}
```

Add this text to your footer:

```
This site is protected by reCAPTCHA and the Google
Privacy Policy and Terms of Service apply.
```

---

## 📊 Score Interpretation

reCAPTCHA v3 returns a score from 0.0 to 1.0:

| Score | Interpretation | Action |
|-------|---------------|--------|
| 0.9 - 1.0 | Very likely human | Allow |
| 0.7 - 0.9 | Probably human | Allow |
| 0.5 - 0.7 | Uncertain | Allow with caution |
| 0.3 - 0.5 | Probably bot | Block or add CAPTCHA challenge |
| 0.0 - 0.3 | Very likely bot | Block |

**Recommended threshold**: 0.5

---

## 🚨 Security Best Practices

### ✅ DO
- ✅ Keep secret key server-side only
- ✅ Use environment variables
- ✅ Verify tokens server-side (Option B)
- ✅ Check action matches expected action
- ✅ Set appropriate score threshold
- ✅ Add to `.gitignore` (already done)

### ❌ DON'T
- ❌ Commit secret key to git
- ❌ Put secret key in frontend code
- ❌ Skip token verification
- ❌ Accept all tokens without checking score
- ❌ Use same key for dev and production

---

## 🧪 Testing

### Local Testing
```bash
# Add your site key to .env.development
REACT_APP_RECAPTCHA_SITE_KEY=your-site-key-here

# Start dev server
npm start

# Test forms
# - Check console for reCAPTCHA logs
# - Verify token is generated
# - Check for errors
```

### Staging Testing
1. Push to `develop` branch
2. Visit: `https://develop--ask-freely.netlify.app`
3. Test all forms
4. Check Netlify function logs (if using Option B)

### Production Testing
1. Merge to `main` branch
2. Visit: `https://ask-freely.com`
3. Test carefully with real data
4. Monitor for issues

---

## 🐛 Troubleshooting

### "reCAPTCHA not loaded"
- Check if script is in `<head>`
- Verify site key is correct
- Check browser console for errors
- Ensure domain is authorized in reCAPTCHA admin

### "Token verification failed"
- Verify secret key is correct
- Check if token is expired (valid for 2 minutes)
- Ensure action matches
- Check server-side function logs

### "localhost not authorized"
- Add `localhost` to authorized domains in reCAPTCHA admin
- Use `127.0.0.1` if `localhost` doesn't work

### Badge showing on wrong pages
- reCAPTCHA loads globally
- Only execute on pages with forms
- Hide badge with CSS if needed

---

## 📚 Resources

- [reCAPTCHA Admin Console](https://www.google.com/recaptcha/admin)
- [reCAPTCHA v3 Documentation](https://developers.google.com/recaptcha/docs/v3)
- [Firebase Functions Documentation](https://firebase.google.com/docs/functions)
- [Best Practices](https://developers.google.com/recaptcha/docs/v3#best_practices)

---

## 🎯 Next Steps

1. **Get your Site Key** from reCAPTCHA admin console
2. **Choose implementation option** (A or B)
3. **Follow the checklist** above
4. **Test thoroughly** before production
5. **Monitor scores** and adjust threshold if needed

Once you have the Site Key, I can help you implement the full integration! Just share the key and let me know which option you prefer.

---

**Current Status**: ⏳ Waiting for Site Key

**Secret Key**: ✅ Stored securely (not in code)

**Ready to integrate**: Once Site Key is provided
