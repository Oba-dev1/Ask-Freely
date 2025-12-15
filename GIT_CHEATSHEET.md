# Git Workflow Cheat Sheet 📝

## 🌟 Quick Reference (Print This!)

### Starting a New Feature
```bash
git checkout develop
git pull origin develop
git checkout -b feature/short-description
```

### Making Changes
```bash
git status                    # See what changed
git add .                     # Stage all changes
git commit -m "feat: what I did"
git push -u origin feature/short-description
```

### Create Pull Request
1. Go to GitHub
2. Click "Compare & pull request"
3. Base: `develop` ← Compare: `feature/your-branch`
4. Add description
5. Click "Create pull request"

### Deploy to Production
1. Test on staging: `develop--your-site.netlify.app`
2. Create PR: `develop` → `main`
3. Merge PR
4. Auto-deploys to production!

---

## 🔥 Common Scenarios

### "I made changes but haven't committed yet"
```bash
# See what changed
git status
git diff

# Stage and commit
git add .
git commit -m "feat: your description"
git push
```

### "I need to update my feature branch with latest develop"
```bash
git checkout develop
git pull origin develop
git checkout feature/your-branch
git merge develop
# Resolve conflicts if any
git push
```

### "I made a mistake in my last commit"
```bash
# Fix the mistake, then:
git add .
git commit --amend --no-edit
git push --force-with-lease origin feature/your-branch
```

### "I want to undo my last commit"
```bash
# Keep the changes
git reset --soft HEAD~1

# Discard the changes (CAREFUL!)
git reset --hard HEAD~1
```

### "I'm on the wrong branch!"
```bash
# Haven't committed yet? Stash your changes:
git stash
git checkout correct-branch
git stash pop
```

### "Production is broken! Need hotfix NOW!"
```bash
git checkout main
git pull origin main
git checkout -b hotfix/fix-critical-bug
# Fix the bug
git add .
git commit -m "fix: describe the fix"
git push -u origin hotfix/fix-critical-bug
# Create PR to main, merge immediately
# Then merge back to develop:
git checkout develop
git merge hotfix/fix-critical-bug
git push origin develop
```

### "How do I delete a branch?"
```bash
# Delete local branch
git branch -d feature/old-branch

# Delete remote branch
git push origin --delete feature/old-branch
```

---

## 📋 Commit Message Prefixes

| Prefix | When to Use | Example |
|--------|-------------|---------|
| `feat:` | New feature | `feat: add user profile page` |
| `fix:` | Bug fix | `fix: resolve login redirect issue` |
| `docs:` | Documentation only | `docs: update README` |
| `style:` | Formatting, no code change | `style: fix indentation` |
| `refactor:` | Code restructuring | `refactor: simplify auth logic` |
| `test:` | Adding tests | `test: add login tests` |
| `chore:` | Maintenance | `chore: update dependencies` |

---

## 🎯 Branch Naming Convention

| Type | Format | Example |
|------|--------|---------|
| Feature | `feature/description` | `feature/add-user-settings` |
| Bug Fix | `fix/description` | `fix/login-redirect` |
| Hotfix | `hotfix/description` | `hotfix/critical-security` |
| Refactor | `refactor/description` | `refactor/auth-service` |
| Docs | `docs/description` | `docs/api-documentation` |

---

## 🚫 DON'T Do These

❌ `git push origin main` (protected - won't work anyway)
❌ `git commit -m "changes"` (too vague)
❌ `git push --force origin main` (NEVER force push to main!)
❌ Working directly on `main` or `develop`
❌ Committing sensitive data (.env files, API keys)

---

## ✅ DO These

✅ Always work on feature branches
✅ Pull latest `develop` before creating branch
✅ Write descriptive commit messages
✅ Test locally before pushing
✅ Review your own PR before asking others
✅ Keep commits small and focused
✅ Delete branches after merging

---

## 🔍 Useful Git Commands

```bash
# See commit history
git log --oneline --graph --all

# See what changed in a file
git diff filename.js

# See who changed what
git blame filename.js

# Find a commit by message
git log --grep="user settings"

# Undo all local changes (CAREFUL!)
git checkout .

# See all branches
git branch -a

# Switch to previous branch
git checkout -

# Create branch and switch to it
git checkout -b new-branch

# Update all remote info
git fetch --all

# See remote URLs
git remote -v
```

---

## 🌐 Your URLs (Write Your Own)

| Environment | Branch | URL |
|-------------|--------|-----|
| Production | `main` | `https://______________________` |
| Staging | `develop` | `https://develop--______________.netlify.app` |
| Preview | PR | `https://deploy-preview-##--_____.netlify.app` |

---

## 💾 Save These Aliases (Optional)

Add to `~/.gitconfig` or `~/.bashrc`:

```bash
# Git aliases
alias gs='git status'
alias ga='git add .'
alias gc='git commit -m'
alias gp='git push'
alias gpl='git pull'
alias gco='git checkout'
alias gb='git branch'
alias gd='git diff'
alias gl='git log --oneline --graph --all'
```

Now you can type `gs` instead of `git status`!

---

## 📞 Help! I'm Stuck!

### Scenario: Merge Conflict
```bash
# 1. Open the files with conflict markers
# 2. Manually resolve conflicts (remove <<<, ===, >>> markers)
# 3. Stage the resolved files
git add .
git commit -m "fix: resolve merge conflict"
git push
```

### Scenario: Accidentally Committed to Wrong Branch
```bash
# Move last commit to new branch
git checkout -b correct-branch
git checkout wrong-branch
git reset --hard HEAD~1
```

### Scenario: Need to Start Over
```bash
# Throw away ALL local changes (CAREFUL!)
git fetch origin
git reset --hard origin/develop
```

---

## 🎓 Pro Tips

1. **Pull before you start**: Always `git pull origin develop` before creating a new branch
2. **Commit often**: Small commits are easier to review and revert
3. **Push daily**: Backs up your work to GitHub
4. **Test on preview**: Every PR gets a preview URL - use it!
5. **Read the diff**: Before committing, review what you changed
6. **Use .gitignore**: Never commit node_modules, .env, or build files

---

## 📱 Quick Check Before Committing

```bash
✓ Run npm start - does it work?
✓ Run git status - anything unexpected?
✓ Run git diff - does the diff look correct?
✓ Did I update .gitignore if needed?
✓ Is my commit message clear?
✓ Am I on the right branch?
```

---

**Print this page and keep it handy! 📌**
