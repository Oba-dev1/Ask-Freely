# Deployment Guide for Ask Freely

This document outlines the deployment strategy and procedures for the Ask Freely application.

## Table of Contents
- [Important: Netlify Free Tier](#important-netlify-free-tier)
- [Environment Strategy](#environment-strategy)
- [Branch Strategy](#branch-strategy)
- [Setup Instructions](#setup-instructions)
- [Deployment Process](#deployment-process)
- [Environment Variables](#environment-variables)
- [Troubleshooting](#troubleshooting)

---

## Important: Netlify Free Tier

**Good News!** This project is configured to work with **Netlify's free tier**, which doesn't support environment variables in the UI.

### How It Works

Instead of using Netlify environment variables (which require a paid plan), we use **build-time fallback defaults** in the Firebase configuration file:

- **Production**: Firebase credentials are hardcoded as fallback values in [`src/Firebase/config.js`](src/Firebase/config.js:9-15)
- **All Environments**: Currently share the same Firebase project (production)
- **Local Development**: Uses `.env.development` for local testing only

### What This Means

✅ **You can deploy immediately** - No Netlify configuration needed
✅ **No monthly costs** - Works on free tier
✅ **Automatic deployments** - Push to `main` branch deploys instantly
⚠️ **Shared Firebase project** - Dev/staging/prod all use the same database (not ideal but acceptable for small projects)

### Future: Upgrading to Multiple Environments

When you're ready to separate environments:
1. Upgrade to Netlify paid plan ($19/month)
2. Create separate Firebase projects (`ask-freely-dev`, `ask-freely-staging`)
3. Set environment variables in Netlify UI
4. The code is already set up to use them via `process.env.REACT_APP_*`

For now, the current setup is **production-ready and cost-free**! 🎉

---

## Environment Strategy

We use three separate environments to ensure safe and reliable deployments:

### 1. Development (`localhost:3000`)
- **Purpose**: Local development and testing
- **Firebase Project**: `ask-freely-dev` (TODO: Create separate project)
- **Branch**: Any feature branch
- **Access**: Developers only

### 2. Staging (`staging.ask-freely.com` or Netlify branch deploy)
- **Purpose**: Pre-production testing and QA
- **Firebase Project**: `ask-freely-staging` (TODO: Create separate project)
- **Branch**: `develop` or `staging`
- **Access**: Team members and testers

### 3. Production (`ask-freely.com`)
- **Purpose**: Live user-facing application
- **Firebase Project**: `ask-freely`
- **Branch**: `main`
- **Access**: Public users

---

## Branch Strategy

We follow a Git Flow strategy:

```
main (production)
  ↑
  └── develop/staging (pre-production)
        ↑
        └── feature/* (individual features)
              ↑
              └── hotfix/* (emergency fixes)
```

### Branch Types

#### `main` (Production)
- Always stable and deployable
- Protected branch (requires PR review)
- Auto-deploys to production on Netlify
- **NEVER push directly to main**

#### `develop` or `staging` (Staging)
- Integration branch for testing
- Deploys to staging environment
- Merge feature branches here first

#### `feature/*` (Feature Branches)
- Individual feature development
- Branch from `develop`
- Example: `feature/duplicate-org-check`

#### `hotfix/*` (Emergency Fixes)
- Critical bug fixes for production
- Branch from `main`
- Merge to both `main` and `develop`

---

## Setup Instructions

### 1. Clone Repository

```bash
git clone https://github.com/your-username/Ask-Freely.git
cd Ask-Freely
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Configuration

Copy the example environment file:

```bash
cp .env.example .env.development
```

Update `.env.development` with your development Firebase credentials.

**IMPORTANT**: Never commit `.env` files to Git!

### 4. Start Development Server

```bash
npm start
```

The app will run on `http://localhost:3000`

---

## Deployment Process

### Feature Development Workflow

1. **Create Feature Branch**
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feature/your-feature-name
   ```

2. **Develop and Commit**
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```

3. **Push and Create PR**
   ```bash
   git push -u origin feature/your-feature-name
   ```
   - Go to GitHub and create Pull Request to `develop`
   - Request review from team member
   - Wait for CI/CD checks to pass

4. **Test on Staging**
   - After merging to `develop`, Netlify will auto-deploy to staging
   - Test thoroughly on staging environment
   - Verify all features work as expected

5. **Deploy to Production**
   ```bash
   # Create PR from develop to main
   git checkout develop
   git pull origin develop
   git checkout main
   git pull origin main
   git merge develop
   git push origin main
   ```
   - Create Pull Request: `develop` → `main`
   - Get approval from senior developer/tech lead
   - Merge to trigger production deployment

### Hotfix Workflow

For urgent production fixes:

```bash
# Create hotfix branch from main
git checkout main
git pull origin main
git checkout -b hotfix/critical-bug-fix

# Make fix and commit
git add .
git commit -m "fix: critical bug description"

# Push and create PR to main
git push -u origin hotfix/critical-bug-fix

# After merging to main, also merge to develop
git checkout develop
git merge hotfix/critical-bug-fix
git push origin develop
```

---

## Environment Variables

### For Netlify Free Tier (Current Setup)

**No configuration needed!** Firebase credentials are set as fallback defaults in [`src/Firebase/config.js`](src/Firebase/config.js:9-15).

The app will work immediately after deployment without any Netlify UI configuration.

### Local Development Only

For local development, you can create `.env.development`:

```env
REACT_APP_ENV=development
REACT_APP_FIREBASE_API_KEY=your-api-key-from-firebase-console
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
REACT_APP_FIREBASE_DATABASE_URL=https://your-project-default-rtdb.firebaseio.com/
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
REACT_APP_FIREBASE_APP_ID=your-app-id
```

**Note:** Copy these values from your Firebase Console → Project Settings → Your apps.

**Note**: This file is in `.gitignore` and won't be committed.

### For Netlify Paid Plan (Future)

If you upgrade to Netlify's paid plan and want separate Firebase projects:

1. Create separate Firebase projects (dev, staging, production)
2. Go to Netlify Dashboard → Site settings → Environment variables
3. Add variables for each deploy context:
   - **Production (main branch)**: Set production Firebase credentials
   - **Staging (develop branch)**: Set staging Firebase credentials
   - **Branch deploys**: Set development Firebase credentials

The code is already set up to use these variables via `process.env.REACT_APP_*` with fallbacks.

---

## Firebase Projects Setup

### Current State
Currently using single Firebase project (`ask-freely`) for all environments.

### Recommended: Create Separate Projects

1. **Create Development Project**
   ```bash
   # Firebase Console
   # Create new project: ask-freely-dev
   # Enable Authentication, Realtime Database, Storage
   # Copy credentials to .env.development
   ```

2. **Create Staging Project**
   ```bash
   # Firebase Console
   # Create new project: ask-freely-staging
   # Enable Authentication, Realtime Database, Storage
   # Copy credentials to .env.staging
   # Set in Netlify for staging branch
   ```

3. **Production Project**
   - Keep existing `ask-freely` project
   - Ensure credentials are set in Netlify for main branch

### Why Separate Projects?

- **Data Isolation**: Test data doesn't mix with production
- **Safety**: Experiments won't affect live users
- **Security**: Different access controls per environment
- **Cost**: Better cost tracking per environment

---

## GitHub Branch Protection

### Set up protection for `main` branch:

1. Go to GitHub → Settings → Branches
2. Add rule for `main`:
   - ✅ Require pull request reviews (minimum 1)
   - ✅ Require status checks to pass before merging
   - ✅ Require branches to be up to date before merging
   - ✅ Require conversation resolution before merging
   - ✅ Do not allow bypassing the above settings

3. Add rule for `develop`:
   - ✅ Require pull request reviews (optional)
   - ✅ Require status checks to pass

---

## CI/CD Pipeline

### GitHub Actions

The `.github/workflows/ci.yml` runs automatically on:
- Pull requests to `main`, `develop`, `staging`
- Pushes to `main`, `develop`, `staging`

**Checks performed:**
- Linting
- Unit tests
- Build verification
- Security audit
- Code quality checks

### Netlify Auto-Deploy

Netlify automatically deploys on:
- **Production**: Push to `main` branch
- **Staging**: Push to `develop` or `staging` branch
- **Preview**: Any pull request (creates temporary preview URL)

---

## Commit Message Convention

Use conventional commits for better changelog generation:

```
feat: add new feature
fix: bug fix
docs: documentation changes
style: formatting, missing semicolons, etc.
refactor: code restructuring
test: adding tests
chore: maintenance tasks
```

Examples:
```bash
git commit -m "feat: add duplicate organization name validation"
git commit -m "fix: resolve Google sign-in redirect loop"
git commit -m "docs: update deployment guide"
```

---

## Troubleshooting

### Build Fails on Netlify

**Issue**: Environment variables not set
**Solution**: Check Netlify environment variables are configured for your branch context

**Issue**: `NODE_OPTIONS` error
**Solution**: Ensure `netlify.toml` has `NODE_OPTIONS = "--openssl-legacy-provider"`

### Firebase Connection Errors

**Issue**: "Firebase: Error (auth/invalid-api-key)"
**Solution**: Verify `REACT_APP_FIREBASE_API_KEY` is set correctly in environment

**Issue**: CORS errors on Storage
**Solution**: Run CORS configuration:
```bash
gsutil cors set cors.json gs://ask-freely.firebasestorage.app
```

### Git Issues

**Issue**: Can't push to `main`
**Solution**: Create pull request instead of pushing directly

**Issue**: Merge conflicts
**Solution**:
```bash
git checkout develop
git pull origin develop
git checkout your-branch
git merge develop
# Resolve conflicts
git commit
git push
```

---

## Quick Reference Commands

```bash
# Start development
npm start

# Build for production
npm run build

# Run tests
npm test

# Create feature branch
git checkout -b feature/my-feature

# Update from develop
git checkout develop && git pull && git checkout - && git merge develop

# View current branch
git branch

# View environment
echo $REACT_APP_ENV

# Check Netlify status
netlify status
```

---

## Additional Resources

- [React Documentation](https://react.dev)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Netlify Documentation](https://docs.netlify.com)
- [Git Flow Guide](https://www.atlassian.com/git/tutorials/comparing-workflows/gitflow-workflow)

---

## Support

For questions or issues:
1. Check this documentation
2. Review GitHub Issues
3. Contact the development team

---

**Last Updated**: 2025-12-11
**Version**: 1.0.0
