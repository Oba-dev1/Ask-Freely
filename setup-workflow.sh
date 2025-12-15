#!/bin/bash
# Setup Proper Git Workflow
# Run this once to set up your deployment workflow

echo "🚀 Setting up proper deployment workflow..."
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Check current branch
echo -e "${BLUE}Step 1: Checking current branch...${NC}"
CURRENT_BRANCH=$(git branch --show-current)
echo "Current branch: $CURRENT_BRANCH"
echo ""

# Step 2: Create develop branch
echo -e "${BLUE}Step 2: Creating develop branch...${NC}"
if git show-ref --verify --quiet refs/heads/develop; then
    echo -e "${YELLOW}develop branch already exists${NC}"
else
    git checkout -b develop
    echo -e "${GREEN}✓ Created develop branch${NC}"
fi
echo ""

# Step 3: Push develop to remote
echo -e "${BLUE}Step 3: Pushing develop to GitHub...${NC}"
git push -u origin develop
echo -e "${GREEN}✓ Pushed develop branch${NC}"
echo ""

# Step 4: Clean up old branches (optional)
echo -e "${BLUE}Step 4: Checking for old branches...${NC}"
echo "Local branches:"
git branch
echo ""

# Step 5: Instructions
echo -e "${GREEN}════════════════════════════════════════${NC}"
echo -e "${GREEN}✓ Setup Complete!${NC}"
echo -e "${GREEN}════════════════════════════════════════${NC}"
echo ""
echo -e "${YELLOW}Next Steps (IMPORTANT):${NC}"
echo ""
echo "1. Go to GitHub.com → Your Repository → Settings → Branches"
echo "   Add branch protection rule for 'main':"
echo "   ✓ Require pull request before merging"
echo "   ✓ Require status checks to pass"
echo ""
echo "2. Go to Netlify Dashboard → Your Site → Site configuration → Build & deploy"
echo "   ✓ Set Production branch: main"
echo "   ✓ Enable Branch deploys for: develop"
echo "   ✓ Enable Deploy previews for: All pull requests"
echo ""
echo "3. Your URLs will be:"
echo "   Production: https://your-site.com (from main branch)"
echo "   Staging:    https://develop--your-site.netlify.app (from develop branch)"
echo "   Previews:   https://deploy-preview-##--your-site.netlify.app (from PRs)"
echo ""
echo -e "${BLUE}Daily Workflow:${NC}"
echo "  git checkout develop"
echo "  git checkout -b feature/my-feature"
echo "  # ... make changes ..."
echo "  git add . && git commit -m 'feat: description'"
echo "  git push -u origin feature/my-feature"
echo "  # Create PR on GitHub: feature/my-feature → develop"
echo ""
echo -e "${GREEN}Read DEPLOYMENT_QUICKSTART.md for full guide!${NC}"
echo ""
