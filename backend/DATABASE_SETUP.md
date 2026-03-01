# 🗄️ Database Setup Guide

## Quick Setup (5 minutes)

### Step 1: Access Supabase SQL Editor

1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Select your project: **reyezzmxvvvpapxkjlvf**
3. Click **SQL Editor** in the left sidebar
4. Click **New Query**

### Step 2: Run the Schema

1. Copy the entire contents of `schema.sql`
2. Paste it into the SQL Editor
3. Click **Run** (or press Ctrl+Enter)
4. Wait for success message (should take ~5 seconds)

**Expected output:** ✓ Success. No rows returned

### Step 3: Verify Tables Were Created

Run this query to check:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('profiles', 'projects');
```

You should see:
- profiles
- projects

### Step 4: Seed Sample Data (Optional)

1. Copy the contents of `seed_data.sql`
2. Paste it into a new SQL query
3. Click **Run**

This will create:
- 4 sample user profiles
- 5 sample projects

### Step 5: Test the Connection

In another query, run:

```sql
-- Check profiles
SELECT COUNT(*) as profile_count FROM profiles;

-- Check projects
SELECT COUNT(*) as project_count FROM projects;

-- View sample projects
SELECT title, tags, status FROM projects LIMIT 5;
```

---

## Troubleshooting

### Error: "extension 'vector' does not exist"

**Solution:** Enable the pgvector extension:
1. Go to **Database > Extensions** in Supabase dashboard
2. Search for "vector"
3. Click **Enable** on `vector` extension
4. Wait for it to activate
5. Re-run schema.sql

### Error: "schema cache" or "table not found"

**Solution:** Reload the schema cache:
```sql
NOTIFY pgrst, 'reload schema';
```

Or just wait 30 seconds - Supabase auto-reloads.

### Error: "permission denied for schema public"

**Solution:** You're using the wrong API key. Make sure you're logged into Supabase dashboard with admin access.

---

## Verifying API Connection

After setting up the database, test your FastAPI backend:

### 1. Make sure backend is running:

```powershell
cd backend
uvicorn main:app --reload
```

### 2. Test the health endpoint:

Open browser: http://localhost:8000

Should see:
```json
{
  "message": "Welcome to Project Jekyll & Hyde API",
  "status": "operational",
  "version": "1.0.0"
}
```

### 3. Test fetching projects:

Open: http://localhost:8000/projects

Should see:
```json
{
  "projects": [...],
  "count": 5
}
```

### 4. View API Docs:

Open: http://localhost:8000/docs

This shows all available endpoints with interactive testing.

---

## Next Steps

Once the database is set up and backend is running:

1. **Restart your Expo frontend** if it was already running
2. **Navigate to the Projects tab** in your app
3. **You should see the 5 sample projects**

If projects don't appear:
- Check browser console for errors
- Verify backend URL in `frontend/.env` is `http://localhost:8000`
- Make sure backend terminal shows no errors

---

## Database Schema Overview

### profiles table
- User information (name, email, major, skills)
- `bio_embedding` - 768D vector for AI matching
- Linked to Supabase Auth users

### projects table
- Project details (title, description, tags)
- `roadmap` - AI-generated technical roadmap (JSON)
- `project_embedding` - 768D vector for AI matching
- `owner_id` - Links to profiles table

### RPC Functions
- `match_profiles_to_project(project_uuid)` - Find matching collaborators
- `match_projects_to_profile(profile_uuid)` - Find matching projects

---

## Production Notes

⚠️ **For the hackathon demo:**

The seed data uses zero vectors for embeddings. In production:
- Embeddings are generated automatically by the API when creating profiles/projects
- This happens via Google Gemini in `ai_service.py`
- The matching will be more accurate with real embeddings

To generate real embeddings for seed data, use the API:
```powershell
# Example: Create a profile via API to get real embedding
curl -X POST http://localhost:8000/profile \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Test",
    "last_name": "User",
    "email": "test@example.com",
    "major": "Computer Science",
    "skills": ["Python", "React"]
  }'
```

---

## Quick Reference

| Task | SQL Query |
|------|-----------|
| List all profiles | `SELECT * FROM profiles;` |
| List all projects | `SELECT * FROM projects;` |
| Count projects | `SELECT COUNT(*) FROM projects;` |
| Find CS students | `SELECT * FROM profiles WHERE major LIKE '%Computer%';` |
| Open projects | `SELECT * FROM projects WHERE status = 'open';` |
| Delete all data | `TRUNCATE profiles CASCADE; TRUNCATE projects CASCADE;` |

---

**Need help?** Check the main [SETUP.md](../SETUP.md) or backend [README.md](README.md)
