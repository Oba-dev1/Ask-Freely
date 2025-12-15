# Firebase Realtime Database Security Rules

## Current Issue

The duplicate organization name check in ProfileSetup.jsx was causing a "Permission denied" error because Firebase Realtime Database security rules prevent reading all users' data.

## Temporary Fix

**What We Did**: Removed the duplicate organization name check to allow profile setup to complete.

**Impact**: Users can now create profiles, but duplicate organization names are allowed temporarily.

## Proper Solution

To implement duplicate organization name checking properly, you need to update your Firebase Realtime Database security rules.

### Option 1: Allow Reading User Profiles (Simple)

This allows authenticated users to read all user profiles to check for duplicates.

**Firebase Console Steps**:
1. Go to Firebase Console: https://console.firebase.google.com/
2. Select your project: "Ask Freely"
3. Navigate to **Realtime Database** → **Rules**
4. Update the rules to:

```json
{
  "rules": {
    "users": {
      ".read": "auth != null",
      "$uid": {
        ".write": "$uid === auth.uid"
      }
    },
    "organizationNames": {
      ".read": "auth != null",
      "$orgName": {
        ".write": "auth != null"
      }
    }
  }
}
```

**What this does**:
- Any authenticated user can read the `users` collection
- Users can only write to their own profile (`$uid === auth.uid`)
- This allows the duplicate check to work

**Security Consideration**: This exposes all user profiles to authenticated users. If you have sensitive data in profiles, use Option 2.

### Option 2: Separate Organization Names Collection (More Secure)

Create a separate collection just for organization names that has public read access.

**Firebase Console Steps**:
1. Same as above, but use these rules:

```json
{
  "rules": {
    "users": {
      "$uid": {
        ".read": "$uid === auth.uid",
        ".write": "$uid === auth.uid"
      }
    },
    "organizationNames": {
      ".read": "auth != null",
      "$orgNameKey": {
        ".write": "auth != null"
      }
    }
  }
}
```

**Code Changes Required**:

You'll need to update ProfileSetup.jsx to:
1. Check duplicates against `organizationNames` collection
2. Write to both `users/${uid}` and `organizationNames/${sanitizedOrgName}`

**Example Code**:
```javascript
// In ProfileSetup.jsx handleSubmit function

// Step 1: Check for duplicate in organizationNames collection
const orgNameKey = organizationName.trim().toLowerCase().replace(/[.#$\[\]]/g, '_');
const orgNameRef = dbRef(database, `organizationNames/${orgNameKey}`);
const orgSnapshot = await get(orgNameRef);

if (orgSnapshot.exists() && orgSnapshot.val().userId !== currentUser.uid) {
  setError('This organization name is already taken. Please choose a different name.');
  setLoading(false);
  return;
}

// Step 2: Save user profile
const userRef = dbRef(database, `users/${currentUser.uid}`);
await update(userRef, {
  organizationName,
  eventType,
  logoUrl: logoUrl || null,
  profileComplete: true,
  updatedAt: new Date().toISOString()
});

// Step 3: Register organization name
await update(orgNameRef, {
  userId: currentUser.uid,
  organizationName: organizationName.trim(),
  createdAt: new Date().toISOString()
});
```

### Option 3: Cloud Functions (Most Secure - Requires Paid Plan)

Use Firebase Cloud Functions to validate organization names server-side.

**Note**: This requires upgrading to Firebase Blaze (pay-as-you-go) plan.

## Recommended Approach for Your Project

**For Now**: Keep the temporary fix (no duplicate check) since you're on free tier.

**When Ready**: Implement **Option 2** (Separate Organization Names Collection)
- More secure than Option 1
- Works on free tier (unlike Option 3)
- Only exposes organization names, not full user profiles

## Testing Security Rules

After updating rules, test them:

1. **Test Read Access**:
```javascript
// This should work for authenticated users
const orgQuery = query(
  dbRef(database, 'organizationNames'),
  orderByChild('organizationName')
);
const snapshot = await get(orgQuery);
```

2. **Test Write Access**:
```javascript
// This should only work for your own profile
const userRef = dbRef(database, `users/${currentUser.uid}`);
await update(userRef, { organizationName: 'Test Org' });
```

## Current Firebase Project Details

- **Project ID**: ask-freely
- **Database URL**: https://ask-freely-default-rtdb.firebaseio.com/
- **Auth Domain**: ask-freely.firebaseapp.com

## Next Steps

1. Decide which option you want to implement (recommend Option 2)
2. Update Firebase Realtime Database security rules in Firebase Console
3. If using Option 2, update ProfileSetup.jsx with the new code
4. Test the duplicate check functionality
5. Commit the changes

## References

- [Firebase Realtime Database Security Rules](https://firebase.google.com/docs/database/security)
- [Understanding Firebase Security Rules](https://firebase.google.com/docs/rules/basics)
