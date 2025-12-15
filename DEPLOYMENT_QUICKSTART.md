# Quick Start: Proper Deployment Workflow (Free Tier)

## Current Situation
You've been pushing directly to `main` branch, which deploys straight to production. Let's fix that!

## 🎯 Recommended Workflow (Free Tier Optimized)

### Step 1: Create a Develop Branch (One-Time Setup)

```bash
# Create and push develop branch
git checkout -b develop
git push -u origin develop
```

### Step 2: Configure Netlify (One-Time Setup)

1. Go to Netlify Dashboard → Your site
2. Go to **Site configuration** → **Build & deploy** → **Continuous deployment**
3. Set **Production branch** to `main`
4. Enable **Branch deploys** for `develop`
5. Enable **Deploy previews** for all pull requests

**Result**:
- `main` branch → Production URL (`ask-freely.com`)
- `develop` branch → Staging URL (`develop--ask-freely.netlify.app`)
- Pull requests → Preview URL (`deploy-preview-123--ask-freely.netlify.app`)

### Step 3: Protect Your Main Branch (One-Time Setup)

On GitHub:
1. Go to **Settings** → **Branches**
2. Add rule for `main`:
   - ✅ Require a pull request before merging
   - ✅ Require approvals: 1 (or 0 if you're solo)
   - ✅ Require status checks to pass before merging
   - ✅ Require branches to be up to date before merging

**Result**: Can't push directly to `main` anymore - forces you to use PRs!

---

## 📋 Daily Workflow (What You'll Do Every Day)

### For New Features

```bash
# 1. Start from develop
git checkout develop
git pull origin develop

# 2. Create feature branch
git checkout -b feature/add-user-settings

# 3. Make your changes, test locally
npm start
# ... code, test, code, test ...

# 4. Commit your work
git add .
git commit -m "feat: add user settings page"

# 5. Push feature branch
git push -u origin feature/add-user-settings

# 6. Create Pull Request on GitHub
# Go to GitHub → Create PR: feature/add-user-settings → develop
# Review the deploy preview URL Netlify creates
# Test on the preview URL
# Merge the PR

# 7. Test on develop (staging)
# Visit: develop--ask-freely.netlify.app
# Make sure everything works

# 8. Deploy to production (when ready)
# Go to GitHub → Create PR: develop → main
# Review one more time
# Merge to deploy to production
```

### For Hotfixes (Urgent Production Bugs)

```bash
# 1. Branch from main
git checkout main
git pull origin main
git checkout -b hotfix/fix-login-bug

# 2. Fix the bug
# ... make fix ...

# 3. Commit and push
git add .
git commit -m "fix: resolve login redirect issue"
git push -u origin hotfix/fix-login-bug

# 4. Create PR to main
# Go to GitHub → Create PR: hotfix/fix-login-bug → main
# Merge immediately after review

# 5. Don't forget to merge back to develop!
git checkout develop
git pull origin main
git push origin develop
```

---

## 🌳 Branch Strategy Summary

```
main (production)
  ← Only merge from develop via PR
  ← Direct hotfixes (rare)

develop (staging)
  ← Merge feature branches here
  ← Test before promoting to main

feature/* (your work)
  ← Create from develop
  ← Daily development happens here
```

---

## 🔄 Typical Week

**Monday Morning:**
```bash
git checkout develop
git checkout -b feature/monday-feature
# ... work all day ...
git push -u origin feature/monday-feature
# Create PR → develop
```

**Tuesday:**
```bash
# Test on develop--ask-freely.netlify.app
# If looks good, create PR: develop → main
# Production deploy happens automatically!
```

**Wednesday:**
```bash
# Start new feature
git checkout develop
git pull origin develop
git checkout -b feature/wednesday-feature
# ... repeat cycle ...
```

---

## 💡 Pro Tips for Free Tier

### 1. Use Deploy Previews for Testing
Every PR gets a unique URL:
- `deploy-preview-42--ask-freely.netlify.app`
- Test your changes before merging
- Share with teammates or clients

### 2. Keep `develop` as Staging
- Always keep develop in a deployable state
- Test here before going to production
- Free staging environment!

### 3. Commit Message Convention
Use conventional commits for clarity:
```bash
feat: add new feature
fix: bug fix
docs: documentation
style: formatting
refactor: code restructuring
test: add tests
chore: maintenance
```

### 4. PR Description Template
When creating PRs, include:
```markdown
## What Changed
- Added user settings page
- Updated navigation menu

## Testing Done
- ✅ Tested locally
- ✅ Tested on deploy preview
- ✅ Verified on mobile

## Deploy Preview
[Test it here](https://deploy-preview-42--ask-freely.netlify.app)
```

---

## 🚨 Emergency: Need to Rollback?

If production breaks:

### Option 1: Quick Hotfix
```bash
git checkout main
git checkout -b hotfix/emergency-fix
# Fix the issue
git push -u origin hotfix/emergency-fix
# Create PR and merge immediately
```

### Option 2: Revert Last Deploy
```bash
# On GitHub, find the last working commit
git checkout main
git revert HEAD
git push origin main
# Netlify auto-deploys the reverted version
```

### Option 3: Netlify Rollback
1. Go to Netlify Dashboard
2. Click **Deploys**
3. Find last working deploy
4. Click **Publish deploy**

---

## 📊 Current vs. Recommended Setup

### Before (What You're Doing Now)
```
Your Computer → git push main → Production 🔴
                                 (risky!)
```

### After (Recommended)
```
Your Computer → feature branch → PR → develop → test → PR → main → Production ✅
                                       ↓                      ↓
                                   Staging URL         Production URL
```

---

## ⚡ Quick Reference Commands

```bash
# Start new feature
git checkout develop && git pull && git checkout -b feature/my-feature

# Update feature branch with latest develop
git checkout develop && git pull && git checkout - && git merge develop

# Delete local branch after merge
git branch -d feature/old-feature

# Delete remote branch after merge
git push origin --delete feature/old-feature

# See all branches
git branch -a

# See current branch
git branch --show-current

# Switch to develop
git checkout develop

# Undo last commit (keep changes)
git reset --soft HEAD~1

# Undo last commit (discard changes) - DANGEROUS!
git reset --hard HEAD~1
```

---

## 🎓 Learning Resources

- [Git Flow Explained](https://www.atlassian.com/git/tutorials/comparing-workflows/gitflow-workflow)
- [Netlify Deploy Contexts](https://docs.netlify.com/site-deploys/overview/#deploy-contexts)
- [Conventional Commits](https://www.conventionalcommits.org/)

---

## 🆘 Common Questions

**Q: Can I still push to main for small typos?**
A: No! Branch protection prevents this. Make a quick PR instead - it takes 30 seconds.

**Q: Do I need to create feature branches for everything?**
A: For production code, yes! Even small changes. It's about building good habits.

**Q: What if I'm working solo?**
A: Still use this workflow! PRs give you:
- Deploy previews to test
- History of what changed
- Easy rollback if needed
- Professional practices

**Q: This seems like a lot of work?**
A: First few times, yes. After a week, it becomes muscle memory and actually saves time.

**Q: Can I skip the develop branch?**
A: You could, but having a staging environment is valuable even solo. It's free with Netlify!

---

## ✅ Checklist: I'm Ready to Start!

- [ ] Created `develop` branch
- [ ] Enabled branch deploys in Netlify
- [ ] Protected `main` branch on GitHub
- [ ] Deleted old feature branches
- [ ] Bookmarked this guide
- [ ] Ready to make my first PR!

---

**Remember**: The goal isn't perfection, it's to prevent "oops" moments in production. This workflow is your safety net! 🎪
