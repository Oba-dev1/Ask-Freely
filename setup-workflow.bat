@echo off
REM Setup Proper Git Workflow for Windows
REM Run this once to set up your deployment workflow

echo.
echo ======================================
echo Setting up proper deployment workflow
echo ======================================
echo.

REM Step 1: Check current branch
echo Step 1: Checking current branch...
git branch --show-current
echo.

REM Step 2: Create develop branch
echo Step 2: Creating develop branch...
git show-ref --verify --quiet refs/heads/develop
if errorlevel 1 (
    git checkout -b develop
    echo [92m[OK] Created develop branch[0m
) else (
    echo [93mNote: develop branch already exists[0m
)
echo.

REM Step 3: Push develop to remote
echo Step 3: Pushing develop to GitHub...
git push -u origin develop
echo [92m[OK] Pushed develop branch[0m
echo.

REM Step 4: Show branches
echo Step 4: Current branches:
git branch
echo.

REM Success message
echo.
echo ======================================
echo [92mSetup Complete![0m
echo ======================================
echo.
echo [93mNext Steps (IMPORTANT):[0m
echo.
echo 1. GitHub - Protect main branch:
echo    Go to: Settings ^> Branches ^> Add rule for 'main'
echo    - Require pull request before merging
echo    - Require status checks to pass
echo.
echo 2. Netlify - Enable branch deploys:
echo    Go to: Site configuration ^> Build ^& deploy
echo    - Set Production branch: main
echo    - Enable Branch deploys for: develop
echo    - Enable Deploy previews for: All pull requests
echo.
echo 3. Your deployment URLs:
echo    Production: https://your-site.com (main)
echo    Staging:    https://develop--your-site.netlify.app (develop)
echo    Previews:   https://deploy-preview-##--your-site.netlify.app (PRs)
echo.
echo [96mDaily Workflow:[0m
echo   git checkout develop
echo   git checkout -b feature/my-feature
echo   [make changes]
echo   git add . ^&^& git commit -m "feat: description"
echo   git push -u origin feature/my-feature
echo   [Create PR on GitHub]
echo.
echo [92mRead DEPLOYMENT_QUICKSTART.md for full guide![0m
echo.
pause
