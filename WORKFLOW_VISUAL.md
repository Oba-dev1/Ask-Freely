# Visual Git Workflow for Ask Freely 🎨

## 🌊 The Flow (How Code Moves)

```
┌─────────────────────────────────────────────────────────────────────┐
│                         YOUR WORKFLOW                               │
└─────────────────────────────────────────────────────────────────────┘

   Your Computer                GitHub              Netlify

   ┌─────────┐
   │ develop │ ─────────────────> develop ────────> develop--site.netlify.app
   └────┬────┘                      ↑                (STAGING)
        │                            │
        │ create branch              │ merge PR
        ↓                            │
   ┌─────────────┐                  │
   │ feature/abc │ ──────────────────┘
   └─────────────┘     push & PR
        │
        │ test locally
        │ (npm start)
        ↓
   Ready? Create PR
        │
        ↓
   develop (staging) ────────────> main ──────────> your-site.com
        test here                    ↑              (PRODUCTION)
                                     │
                                merge PR when ready
```

---

## 🎯 Three Environments Explained

### 1️⃣ Local Development (Your Computer)
```
┌────────────────────────────┐
│   http://localhost:3000    │
│                            │
│  • Test instantly          │
│  • Break things safely     │
│  • See changes in real-time│
│  • Not visible to anyone   │
└────────────────────────────┘
```
**When**: Daily development
**Who sees it**: Only you
**Command**: `npm start`

---

### 2️⃣ Staging (Develop Branch)
```
┌────────────────────────────────────┐
│ https://develop--site.netlify.app  │
│                                    │
│  • Test in real environment        │
│  • Share with team                 │
│  • Verify before production        │
│  • Same as production (but safe)   │
└────────────────────────────────────┘
```
**When**: After merging feature PRs
**Who sees it**: Your team, testers
**Deploys**: Automatically when you push to `develop`

---

### 3️⃣ Production (Main Branch)
```
┌────────────────────────────────────┐
│     https://ask-freely.com         │
│                                    │
│  • Real users see this             │
│  • Must be stable                  │
│  • Only tested code                │
│  • The "official" version          │
└────────────────────────────────────┘
```
**When**: After testing on staging
**Who sees it**: Everyone, your users
**Deploys**: Automatically when you merge to `main`

---

## 📅 Weekly Workflow Example

### Monday - Start New Feature
```
Your Computer               GitHub                 Netlify

develop
  │
  └──> feature/auth ──────> Push ────────┐
       (work here)                        │
                                          ↓
                                      feature/auth
                                      (no deploy)
```

### Tuesday - Create Pull Request
```
feature/auth ──────────> Create PR ─────> develop ────> develop--site.netlify.app
                         (review)           │           (TEST HERE!)
                                            │
                                      CI checks run
```

### Wednesday - Merge to Staging
```
                         Merge PR
                            │
                            ↓
                         develop ─────────> develop--site.netlify.app
                            │               (LIVE ON STAGING)
                            │
                    Test thoroughly!
```

### Thursday - Deploy to Production
```
develop ───────> Create PR ──────> main ──────────> ask-freely.com
                  to main           │               (GOES LIVE!)
                                    │
                           Final checks pass
```

### Friday - Hotfix Emergency
```
main ──────> hotfix/bug ──────> Fix ──────> PR ──────> main ──────> DEPLOY
  │                                                      │
  │                                                      ↓
  └────────────────────────────────────────────> merge to develop
                                                 (keep in sync)
```

---

## 🎭 Real Example: Adding User Profile

### Step 1: Create Branch
```bash
$ git checkout develop
$ git checkout -b feature/user-profile

# You are now here:
  main
  develop
  └── feature/user-profile ← YOU ARE HERE
```

### Step 2: Make Changes
```bash
$ code src/components/UserProfile.jsx  # Edit files
$ npm start                            # Test locally
$ git add .
$ git commit -m "feat: add user profile page"
$ git push -u origin feature/user-profile

# GitHub now has your branch
```

### Step 3: Create PR
```
GitHub UI:

  ┌─────────────────────────────────────────┐
  │ Pull Request #123                       │
  │ feature/user-profile → develop          │
  │                                         │
  │ • 3 files changed                       │
  │ • +145 -23 lines                        │
  │ • ✓ All checks passed                   │
  │                                         │
  │ Preview: deploy-preview-123--site.app   │← TEST HERE!
  └─────────────────────────────────────────┘
```

### Step 4: Test Deploy Preview
```
Click preview URL:
https://deploy-preview-123--ask-freely.netlify.app

✓ Test user profile page
✓ Test on mobile
✓ Test login flow
✓ Everything works!
```

### Step 5: Merge to Develop
```
Merge PR on GitHub
     ↓
develop branch updated
     ↓
Netlify auto-deploys
     ↓
https://develop--ask-freely.netlify.app
(Now includes your user profile!)
```

### Step 6: Test Staging
```
Visit: develop--ask-freely.netlify.app

✓ User profile works
✓ Existing features still work
✓ No errors in console
✓ Ready for production!
```

### Step 7: Deploy to Production
```
Create PR: develop → main
     ↓
Get approval
     ↓
Merge PR
     ↓
Netlify auto-deploys to production
     ↓
https://ask-freely.com
(User profile is now live! 🎉)
```

---

## 🚦 Decision Tree: What Should I Do?

```
                    ┌─────────────────┐
                    │ Need to code?   │
                    └────────┬────────┘
                             │
                    ┌────────┴────────┐
                    │                 │
              ┌─────▼─────┐     ┌────▼────┐
              │ New feature│     │ Bug fix │
              └─────┬─────┘     └────┬────┘
                    │                 │
                    │                 │
          ┌─────────┴────────┐  ┌────┴──────────┐
          │                  │  │               │
    ┌─────▼──────┐  ┌───────▼──▼────┐  ┌──────▼────────┐
    │ In develop?│  │ In production?│  │ Urgent hotfix?│
    │    YES     │  │      NO       │  │     YES       │
    └─────┬──────┘  └───────┬───────┘  └──────┬────────┘
          │                 │                  │
          ↓                 ↓                  ↓
    feature/name       feature/name      hotfix/name
    from develop       from develop      from main
          │                 │                  │
          ↓                 ↓                  ↓
    PR → develop       PR → develop       PR → main
          │                 │             then → develop
          ↓                 ↓
    Test staging       Test staging
          │                 │
          ↓                 ↓
    PR → main         PR → main
```

---

## 🎯 Remember These Rules

### ✅ Always Do
```
1. git checkout develop          ← Start here
2. git pull origin develop       ← Get latest
3. git checkout -b feature/name  ← Create branch
4. [code and test]
5. git push                      ← Push to GitHub
6. Create PR → develop           ← Review and merge
7. Test on staging               ← Verify it works
8. Create PR → main              ← Go to production
```

### ❌ Never Do
```
✗ git push origin main           (blocked by protection)
✗ git push --force origin main   (VERY BAD)
✗ Work directly on main          (use branches!)
✗ Skip testing on staging        (catch bugs early)
✗ Commit .env files              (security risk)
```

---

## 🎨 Color Code Your Branches

In your mind (or terminal colors):

- 🔴 **main** = Production (DANGER! Be careful)
- 🟡 **develop** = Staging (Almost there)
- 🟢 **feature/** = Safe zone (Break things here!)
- 🔴 **hotfix/** = Emergency (Fix and deploy fast)

---

## 🧭 Finding Your Way

### "Where am I?"
```bash
$ git branch --show-current
feature/user-profile
```

### "What changed?"
```bash
$ git status
Modified: src/components/UserProfile.jsx
```

### "How do I get to develop?"
```bash
$ git checkout develop
```

### "Did my deploy work?"
Check Netlify:
```
✓ develop--ask-freely.netlify.app    (staging)
✓ ask-freely.com                     (production)
```

---

## 🎓 Learning Path

### Week 1: Getting Comfortable
- Create feature branches
- Make commits
- Push to GitHub
- Create PRs

### Week 2: Building Confidence
- Merge PRs
- Test on staging
- Deploy to production
- Delete old branches

### Week 3: Advanced Moves
- Handle merge conflicts
- Do hotfixes
- Revert commits
- Use git aliases

### Month 2+: Natural Flow
This becomes muscle memory! 💪

---

## 📞 When Things Go Wrong

### "I pushed to the wrong branch!"
```
Don't panic! Create PR to correct branch.
Delete wrong branch if needed.
```

### "I have a merge conflict!"
```
1. Open conflicted file
2. Look for <<<<<<< and >>>>>>>
3. Decide what to keep
4. Remove conflict markers
5. git add . && git commit
```

### "Production is down!"
```
1. Go to Netlify → Deploys
2. Click previous working deploy
3. Click "Publish deploy"
4. Fix with hotfix branch
```

### "I don't know what I did!"
```
$ git log --oneline
Shows your recent commits

$ git diff
Shows what changed

$ git status
Shows current state
```

---

## 🎉 Success Metrics

You know you're doing it right when:

- ✅ You never push directly to main
- ✅ You test on staging before production
- ✅ You can rollback if needed
- ✅ You have a history of all changes
- ✅ You catch bugs before users do
- ✅ You sleep better at night 😴

---

**Remember**: This workflow exists to protect your production app and make your life easier. It might feel like extra steps at first, but it prevents the "Oh no!" moments. 🎪

Print this, bookmark it, reference it daily until it becomes second nature!
