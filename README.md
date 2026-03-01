🧬 Project Jekyll & Hyde: The STEM Matchmaker
"Where brilliant ideas meet the perfect team."

📖 What is Project Jekyll & Hyde?
Have you ever had a world-changing idea for a research project or a new app, but didn't have the "other half" to build it? Maybe you’re a Biology student who needs a coder, or a Frontend developer looking for a Backend wizard.

Project Jekyll & Hyde is a platform designed to solve the "Founder Gap." We don't just match you based on keywords; we match you based on your wavelength.

How it works:
Create your Profile: List your major (e.g., Health Science, CS, Physics), your skills, and how much time you can realistically commit.

Post an Idea: Share your vision. Don't worry if it's vague—Dr. Jekyll (The Mentor) will automatically turn your idea into a professional technical roadmap so others know exactly how to help.

Get Matched: Our AI looks at more than just text. It understands the meaning behind your interests to find people who complement your skills (e.g., pairing a Designer with a Developer, not two Designers).

The "Hyde" Factor: To keep things fun, our resident "Hype-Man," Mr. Hyde, will voice-roast your profile if it's too boring or hype up your project using high-energy audio to attract teammates.

🛠 Technical Specifications (The "How")
The Brain (Backend & AI)
Framework: Python (FastAPI) for high-speed API performance.

AI Engine: * Google Gemini: Handles "Semantic Matching" (Vector Search) and generates the "Project Architect" roadmaps.

ElevenLabs: Powers the "Mr. Hyde" audio experience.

Vector Search: We use pgvector within Supabase to compare the "mathematical meaning" of profiles and projects to ensure high-quality matches.

The Face (Frontend)
Framework: React with TypeScript & Expo Router (compatible with Web, PC, and Mobile).

UI/UX: Designed in Figma, enhanced with ReactBits and Framer Motion for smooth, professional animations.

The Foundation (Database & Auth)
Supabase: Handles our PostgreSQL database and Secure Authentication (Google/Email login).

Profiles Table: Stores academic background, social links (GitHub/LinkedIn/Discord), and availability.

Projects Table: Stores descriptions, tags, the AI-generated "Architect Roadmaps.", and AI-generated "Match Scores" based on user who is trying to apply to be in the project.

Starting the app:

Open 2 terminals seperagtely:
One is the frontend:
  - cd frontend
  - npm install
  - npx expo start
One is the backend:
  - cd backend
  - python3 -m venv venv
  - source venv/bin/activate
  - pip install -r requirements.txt
  - 