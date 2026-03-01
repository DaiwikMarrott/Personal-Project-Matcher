# 🚀 Project Jekyll & Hyde - Complete Setup Guide

## Overview
This guide will help you set up both the frontend (React TypeScript with Expo) and backend (FastAPI with Python) for Project Jekyll & Hyde.

## Prerequisites

### General
- Node.js 18+ and npm/yarn
- Python 3.9+
- Git

### Services
- **Supabase Account**: [supabase.com](https://supabase.com) (Free tier works)
- **Google AI Studio**: [makersuite.google.com](https://makersuite.google.com) (for Gemini API key)
- **ElevenLabs** (Optional): For voice generation features

---

## 🗄️ Database Setup (Supabase)

### 1. Create a New Supabase Project
1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Choose a name, database password, and region
4. Wait for the project to initialize (~2 minutes)

### 2. Run the Schema
1. In your Supabase dashboard, go to **SQL Editor**
2. Click "New Query"
3. Copy the entire contents of `backend/schema.sql`
4. Paste and click "Run"
5. Verify success (you should see tables created)

### 3. Get Your Credentials
1. Go to **Settings > API**
2. Copy the following:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **Anon/Public Key** (the `anon` key)
3. Save these for later

### 4. Enable Authentication Providers
1. Go to **Authentication > Providers**
2. Enable **Email** provider
3. Enable **Google** provider:
   - Follow Supabase's guide to set up Google OAuth
   - You'll need to create a Google Cloud project
   - Add Authorized redirect URIs from Supabase

---

## 🔧 Backend Setup (FastAPI)

### 1. Navigate to Backend Folder
```bash
cd backend
```

### 2. Create Virtual Environment
```bash
# Windows
python -m venv venv
venv\Scripts\activate

# macOS/Linux
python3 -m venv venv
source venv/bin/activate
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

### 4. Configure Environment Variables
```bash
# Copy the example file
cp .env.example .env
```

Edit `.env` and add your credentials:
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
GEMINI_API_KEY=your_gemini_api_key_here
```

**Get Gemini API Key:**
1. Go to [Google AI Studio](https://makersuite.google.com/)
2. Click "Get API Key"
3. Create a new key for your project

### 5. Run the Backend
```bash
# Development mode (with auto-reload)
uvicorn main:app --reload

# The API will be available at http://localhost:8000
# API docs at http://localhost:8000/docs
```

### 6. Test the API
Open your browser and go to `http://localhost:8000/docs` to see the interactive API documentation.

---

## 📱 Frontend Setup (React Native with Expo)

### 1. Navigate to Frontend Folder
```bash
cd frontend
```

### 2. Install Dependencies
```bash
npm install
# or
yarn install
```

### 3. Configure Environment Variables
```bash
# Copy the example file
cp .env.example .env
```

Edit `.env` and add:
```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
EXPO_PUBLIC_REDIRECT_URL=your-app://redirect
EXPO_PUBLIC_API_URL=http://localhost:8000
```

**Note:** For mobile testing, replace `localhost` with your computer's local IP address (e.g., `http://192.168.1.100:8000`)

### 4. Start the Development Server
```bash
npm start
# or
yarn start
```

### 5. Run on Your Device
- **Web**: Press `w` in the terminal
- **iOS Simulator**: Press `i` (macOS only, requires Xcode)
- **Android Emulator**: Press `a` (requires Android Studio)
- **Physical Device**: Scan the QR code with Expo Go app

---

## 🔐 Integrating Authentication

### Update Your Root Layout
Edit `frontend/app/_layout.tsx` to wrap your app with the AuthProvider:

```typescript
import { AuthProvider } from '../contexts/AuthContext';

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack>
        {/* your routes */}
      </Stack>
    </AuthProvider>
  );
}
```

### Use Authentication in Components
```typescript
import { useAuth } from '../contexts/AuthContext';

export default function MyComponent() {
  const { user, signInWithEmail, signOut } = useAuth();

  return (
    <View>
      {user ? (
        <Text>Welcome {user.email}</Text>
      ) : (
        <Text>Please sign in</Text>
      )}
    </View>
  );
}
```

---

## 🧪 Testing the Complete System

### 1. Start Both Services
**Terminal 1 - Backend:**
```bash
cd backend
uvicorn main:app --reload
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start
```

### 2. Test Profile Creation
Use the API docs at `http://localhost:8000/docs`:

1. Click on `POST /profile`
2. Click "Try it out"
3. Enter sample data:
```json
{
  "first_name": "Jane",
  "last_name": "Doe",
  "email": "jane@example.com",
  "major": "Computer Science",
  "skills": ["Python", "React"],
  "experience_level": "intermediate"
}
```
4. Click "Execute"
5. Save the returned `id` (you'll need it for matching)

### 3. Test Project Creation
1. Click on `POST /project`
2. Enter sample data (use the profile ID from step 2):
```json
{
  "owner_id": "your-profile-id-here",
  "title": "AI-Powered Study Assistant",
  "description": "A mobile app that helps students study using AI",
  "tags": ["ai", "education", "mobile"]
}
```
3. The response will include an AI-generated roadmap!

### 4. Test Matching
1. Click on `POST /match`
2. Enter:
```json
{
  "project_id": "your-project-id-here",
  "match_threshold": 0.5,
  "match_limit": 10
}
```
3. You should see matching profiles with similarity scores

---

## 📁 Project Structure

```
Personal-Project-Matcher/
├── frontend/                    # React Native (Expo) frontend
│   ├── app/                     # Expo Router pages
│   ├── components/              # React components
│   ├── contexts/
│   │   └── AuthContext.tsx      # Authentication context
│   ├── package.json
│   └── .env                     # Frontend environment variables
│
├── backend/                     # FastAPI backend
│   ├── main.py                  # API endpoints
│   ├── ai_service.py            # AI utilities
│   ├── schema.sql               # Database schema
│   ├── requirements.txt         # Python dependencies
│   └── .env                     # Backend environment variables
│
└── README.md                    # Project overview
```

---

## 🐛 Troubleshooting

### Backend Issues

**"No module named 'supabase'"**
```bash
pip install -r requirements.txt
```

**"Connection refused" when connecting to Supabase**
- Check your `SUPABASE_URL` and `SUPABASE_ANON_KEY`
- Verify your Supabase project is active

**Gemini API errors**
- Verify your API key is valid
- Check quota at [Google AI Studio](https://makersuite.google.com/)

### Frontend Issues

**"Cannot find module '@supabase/supabase-js'"**
```bash
npm install
```

**Can't connect to backend from mobile**
- Replace `localhost` with your computer's IP address in `.env`
- Ensure both devices are on the same network
- Check firewall settings

**Authentication not working**
- Verify Supabase Auth is enabled
- Check redirect URLs in Supabase dashboard
- Clear app cache and restart Expo

---

## 🎯 Next Steps

1. **Create Sign-In/Sign-Up UI** - Build login screens using the `useAuth` hook
2. **Profile Screen** - Create a form for users to set up their profiles
3. **Project Creation Flow** - Build UI for posting new projects
4. **Matching Interface** - Display matched profiles/projects
5. **Add Voice Features** - Integrate ElevenLabs for Mr. Hyde's roasts/hype

---

## 📚 Additional Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Supabase Documentation](https://supabase.com/docs)
- [Expo Documentation](https://docs.expo.dev/)
- [Google Gemini API](https://ai.google.dev/docs)
- [pgvector Guide](https://github.com/pgvector/pgvector)

---

## 💡 Tips for Hackathon

- Use the `/docs` endpoint extensively for testing
- Start with basic features before adding AI enhancements
- Test auth flow early to avoid last-minute issues
- The AI roadmap generation can take 5-10 seconds
- Use mock data if APIs are slow during development

---

**Good luck with Mountain Madness 2026! 🏔️**
