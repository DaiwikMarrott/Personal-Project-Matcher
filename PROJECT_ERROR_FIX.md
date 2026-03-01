# 🚨 Error Fix: Cannot Create Project

## The Problem

You're getting this error when trying to create a project:
```
violates foreign key constraint "projects_owner_id_fkey"
Key (owner_id)=(ad140252-140f-4316-91b7-26fe6bb5a45c) is not present in table "profiles"
```

## What This Means

**You need to create your user profile first before you can create projects!**

The database requires every project to have an `owner_id` that points to an existing profile in the `profiles` table. Your user account exists (ID: `ad140252-140f-4316-91b7-26fe6bb5a45c`), but you haven't created a profile yet.

## The Solution (2 Steps)

### Step 1: Apply Database Migration

First, make sure your database has the `auth_user_id` column:

1. **Open Supabase Dashboard** → SQL Editor
2. **Run this SQL** (from backend/QUICK_FIX.sql):

```sql
-- Add auth_user_id column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS auth_user_id UUID;

-- Add unique constraint
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'profiles_auth_user_id_unique'
    ) THEN
        ALTER TABLE profiles ADD CONSTRAINT profiles_auth_user_id_unique UNIQUE (auth_user_id);
    END IF;
END $$;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_auth_user_id ON profiles(auth_user_id);

-- Add profile_picture_url column
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS profile_picture_url TEXT;
```

3. Click **Run** - should see "Success"

### Step 2: Create Your Profile

Now create your profile in the app:

#### Option A: Through the App (Recommended)
1. In your app, click **"View Your Profile"** on the home screen
2. If you see "No Profile Found", click **"Create Profile"**
3. Fill in:
   - ✅ First Name (required)
   - ✅ Last Name (required)
   - ✅ Major (required)
   - Skills, interests, etc. (optional)
4. Click **"Create Profile"**

#### Option B: Directly via API
```bash
curl -X POST http://localhost:8000/profile \
  -H "Content-Type: application/json" \
  -d '{
    "auth_user_id": "ad140252-140f-4316-91b7-26fe6bb5a45c",
    "first_name": "Your Name",
    "last_name": "Your Last Name",
    "email": "your@email.com",
    "major": "Computer Science"
  }'
```

#### Option C: Manually in Database
1. Go to Supabase Dashboard → **Table Editor** → **profiles** table
2. Click **Insert** → **Insert row**
3. Fill in:
   - `auth_user_id`: `ad140252-140f-4316-91b7-26fe6bb5a45c`
   - `first_name`: Your first name
   - `last_name`: Your last name
   - `email`: your email
   - `major`: Your major
4. Click **Save**

### Step 3: Now Create Your Project

After your profile exists, you can create projects! The `owner_id` in projects will automatically link to your profile.

## Bonus Fix: AI Model Errors

I also fixed the Gemini AI model names in the code:
- ✅ Changed `gemini-2.5-flash` → `gemini-1.5-flash` (for roadmap generation)
- ✅ Changed `text-embedding-004` → `embedding-001` (for embeddings)

These were causing the "not found for API version v1beta" error.

## Verify Everything Works

After creating your profile, test project creation:

```bash
curl -X POST http://localhost:8000/project \
  -H "Content-Type: application/json" \
  -d '{
    "owner_id": "YOUR_PROFILE_ID",
    "title": "Test Project",
    "description": "Testing project creation",
    "tags": ["test"]
  }'
```

You should see a successful response with the project details and AI-generated roadmap!

## Why This Happens

The database enforces **referential integrity** - every project must have a valid owner. This prevents orphaned projects and ensures data consistency. The flow is:

1. Create Auth Account (Supabase handles this) ✅
2. Create Profile (links to auth account) ← **You're here**
3. Create Projects (links to profile) ← **Next step**

This is by design - you can't create projects without a profile!
