# Beyond the Vibes - Q&A Platform

A real-time question and answer platform for the "Beyond the Vibes" Singles Programme.

## Features

- **Participant Form**: Submit questions anonymously or with your name
- **Host Dashboard**: View, manage, and mark questions as answered in real-time
- **Real-time Updates**: Powered by Firebase Realtime Database
- **Responsive Design**: Works on all devices

## Setup Instructions

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd beyond-the-vibes
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Firebase

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Enable **Realtime Database**:
   - Go to "Build" → "Realtime Database"
   - Click "Create Database"
   - Choose your region
   - Start in "Test mode"
4. Get your web config:
   - Go to Project Settings (gear icon)
   - Scroll to "Your apps"
   - Click the web icon `</>`
   - Copy the `firebaseConfig` object

### 4. Configure Environment Variables

1. Create a `.env` file in the root directory
2. Copy the contents from `.env.example`
3. Replace with your Firebase credentials:

```env
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
REACT_APP_FIREBASE_DATABASE_URL=https://your_project.firebaseio.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
```

### 5. Run Locally

```bash
npm start
```

The app will open at `http://localhost:3000`

## Deployment to Netlify

### Method 1: Through GitHub (Recommended)

1. Push your code to GitHub
2. Go to [Netlify](https://netlify.com)
3. Click "Add new site" → "Import an existing project"
4. Connect your GitHub repository
5. Configure build settings:
   - **Build command**: `npm run build`
   - **Publish directory**: `build`
6. Add environment variables in Netlify:
   - Go to Site settings → Environment variables
   - Add all your `REACT_APP_*` variables
7. Click "Deploy site"

### Method 2: Netlify CLI

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Build the project
npm run build

# Deploy
netlify deploy --prod
```

## Firebase Security Rules

After testing, update your Firebase Realtime Database rules:

```json
{
  "rules": {
    "questions": {
      ".read": true,
      ".write": true
    }
  }
}
```

For production, consider adding authentication.

## Project Structure

```
src/
├── components/
│   ├── ParticipantForm.jsx    # Question submission form
│   ├── ParticipantForm.css
│   ├── HostDashboard.jsx      # Host management dashboard
│   ├── HostDashboard.css
│   ├── QuestionItem.jsx       # Individual question component
│   └── QuestionItem.css
├── firebase/
│   └── config.js              # Firebase configuration
├── App.jsx                    # Main app with routing
├── App.css
├── index.js
└── index.css
```

## Routes

- `/` - Home page with role selection
- `/participate` - Participant question submission form
- `/host` - Host dashboard for managing questions

## Technologies Used

- React 18
- Firebase Realtime Database
- React Router v6
- CSS3

## Development Workflow

**NEW!** We use a proper Git workflow to protect production:

### Quick Start
1. **Read the guides** (in order):
   - 📖 [DEPLOYMENT_QUICKSTART.md](DEPLOYMENT_QUICKSTART.md) - Start here!
   - 🎨 [WORKFLOW_VISUAL.md](WORKFLOW_VISUAL.md) - Visual guide
   - 📝 [GIT_CHEATSHEET.md](GIT_CHEATSHEET.md) - Quick reference
   - 📚 [DEPLOYMENT.md](DEPLOYMENT.md) - Full documentation

2. **Setup your workflow** (one-time):
   ```bash
   # Windows
   setup-workflow.bat

   # Mac/Linux
   bash setup-workflow.sh
   ```

3. **Daily workflow**:
   ```bash
   git checkout develop
   git checkout -b feature/my-feature
   # ... make changes ...
   git add . && git commit -m "feat: description"
   git push -u origin feature/my-feature
   # Create PR on GitHub → develop → main
   ```

### Environments
- **Production**: `https://ask-freely.com` (main branch)
- **Staging**: `https://develop--ask-freely.netlify.app` (develop branch)
- **Previews**: Auto-generated for all PRs

### Branch Protection
- ✅ `main` branch is protected (requires PR)
- ✅ All changes go through `develop` first
- ✅ Test on staging before production
- ✅ Deploy previews for every PR

## Support

For issues or questions, please contact the development team.

---

**Beyond the Vibes** - Singles Programme • October 28, 2025