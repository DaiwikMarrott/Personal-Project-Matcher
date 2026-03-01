# Profile Creation Feature Setup Guide

## Overview

The profile creation feature has been successfully implemented! This guide will help you set it up and test it.

## What Was Added

### Backend Changes
1. **Updated Database Schema** (`backend/schema.sql`)
   - Added `auth_user_id` column to link profiles with Supabase Auth users
   - Added `profile_picture_url` column for avatar images
   - Created index on `auth_user_id` for faster lookups

2. **New API Endpoints** (`backend/main.py`)
   - `POST /upload-avatar/{user_id}` - Upload profile pictures to Supabase Storage
   - `GET /profile/check/{auth_user_id}` - Check if a user has created a profile
   - `POST /profile` - Updated to include image URLs and auth linking

3. **Migration File** (`backend/migrations/001_add_profile_picture.sql`)
   - Adds new columns to existing databases

### Frontend Changes
1. **New Profile Creation Screen** (`frontend/app/create-profile.tsx`)
   - Form with required fields: First Name, Last Name, Major
   - Optional fields: Skills, Interests, Experience Level, URLs
   - Profile picture upload with preview
   - AI embedding generation on submit

2. **Updated Authentication Flow**
   - After sign-up, users are automatically redirected to profile creation
   - On sign-in, app checks if profile exists and redirects if needed
   - Profile creation is mandatory before accessing the app

3. **New Dependency**
   - `expo-image-picker` for profile picture uploads

## Setup Steps

### 1. Update Database

Run the migration to add new columns:

```bash
# In Supabase SQL Editor, run:
```

Copy the contents of `backend/migrations/001_add_profile_picture.sql` and execute it.

Or if setting up fresh, just run `backend/schema.sql` (already includes the new columns).

### 2. Set Up Supabase Storage

Follow the detailed guide in `backend/STORAGE_SETUP.md` to:

1. Create an `avatars` bucket in Supabase Storage
2. Set up storage policies for uploads and public access
3. Test that storage is working

**Quick Setup:**

1. Go to Supabase Dashboard → Storage
2. Create new bucket named `avatars`
3. Make it **public**
4. Add these policies in SQL Editor:

```sql
-- Allow public read
CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- Allow authenticated uploads
CREATE POLICY "Authenticated users can upload avatars"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars');

-- Allow users to update their own avatars
CREATE POLICY "Users can update their own avatars"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1])
WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow users to delete their own avatars
CREATE POLICY "Users can delete their own avatars"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
```

### 3. Install Frontend Dependencies

In the frontend directory:

```bash
cd frontend
npm install
```

This will install the new `expo-image-picker` dependency that was added to `package.json`.

### 4. Restart Backend

If your backend is already running, restart it to load the updated code:

```bash
cd backend
.\venv\Scripts\activate  # Windows
# or
source venv/bin/activate  # Mac/Linux

uvicorn main:app --reload
```

### 5. Restart Frontend

Restart your Expo development server:

```bash
cd frontend
npm start
```

## Testing the Feature

### Test Flow 1: New User Sign-Up

1. **Start the app** and go to the home screen
2. **Toggle to Sign Up** mode
3. **Enter email and password** and click "Sign Up"
4. **You'll be automatically redirected** to the profile creation screen
5. **Fill in required fields:**
   - First Name
   - Last Name
   - Major (select from dropdown)
6. **Optionally:**
   - Tap the camera icon to upload a profile picture
   - Add skills (comma-separated)
   - Add interests
   - Select experience level
   - Add GitHub/LinkedIn URLs
7. **Click "Create Profile"**
8. **You'll see a success message** and be redirected to the main app

### Test Flow 2: Existing User Without Profile

1. **Sign in** with an account that hasn't created a profile yet
2. **You'll be automatically redirected** to profile creation
3. **Complete the profile** as above

### Test Flow 3: Profile Picture Upload

1. **In profile creation**, tap the camera placeholder
2. **Select an image** from your device
3. **Preview appears** in a circular frame
4. **Submit the form**
5. **Backend uploads** the image to Supabase Storage
6. **Profile is created** with the image URL

### Test Flow 4: API Endpoints

Test the backend directly:

```bash
# Check if user has profile
curl http://localhost:8000/profile/check/{USER_ID}

# Create profile (replace with actual data)
curl -X POST http://localhost:8000/profile \
  -H "Content-Type: application/json" \
  -d '{
    "auth_user_id": "your-user-id",
    "first_name": "John",
    "last_name": "Doe",
    "email": "john@example.com",
    "major": "Computer Science"
  }'

# Upload avatar
curl -X POST http://localhost:8000/upload-avatar/{USER_ID} \
  -F "file=@path/to/image.jpg"
```

## Troubleshooting

### Issue: "Profile already exists for this user"

**Solution:** The user has already created a profile. This is a safety check to prevent duplicates.

### Issue: Image upload fails

**Causes:**
1. Storage bucket not created or not public
2. Storage policies not configured
3. File too large (>5MB)
4. Unsupported file type

**Solution:**
- Follow `backend/STORAGE_SETUP.md` to set up storage correctly
- Check file size and type (JPEG, PNG, WebP, GIF only)
- Check browser console for detailed error messages

### Issue: Not redirected to profile creation after sign-up

**Causes:**
1. Backend not running
2. Network error preventing profile check
3. Profile already exists

**Solution:**
- Check backend is running on port 8000
- Check browser/app console for errors
- Manually navigate to `/create-profile` to test the screen

### Issue: "Failed to create profile" error

**Causes:**
1. Database migration not run (missing columns)
2. Network error
3. Invalid data in form

**Solution:**
- Run the migration SQL in Supabase
- Check backend logs for specific error
- Verify all required fields are filled

### Issue: Images not loading after upload

**Causes:**
1. Bucket not set to public
2. Read policy not configured

**Solution:**
- In Supabase Dashboard, check bucket is marked "Public"
- Verify the read policy exists (see Storage Setup guide)

## Feature Details

### Required vs Optional Fields

**Required:**
- First Name
- Last Name
- Major

**Optional:**
- Profile Picture
- Experience Level (defaults to "beginner")
- Skills
- Interests
- GitHub URL
- LinkedIn URL

### AI Embedding Generation

When a profile is created, the backend automatically:
1. Combines major, interests, and skills into a text string
2. Sends it to Google Gemini API
3. Generates a 768-dimensional embedding vector
4. Stores it in the `bio_embedding` column for matching

### Profile Picture Storage

Profile pictures are stored in Supabase Storage with this structure:
```
avatars/
  {user_id}/
    avatar.jpg  (current profile picture, overwritten on update)
```

The public URL is stored in the database's `profile_picture_url` column.

### Default Avatar

If no profile picture is uploaded, the `profile_picture_url` field is set to `null`. You can later add a default avatar image URL on the frontend or use initials as a fallback.

## Next Steps

After the profile creation feature is working:

1. **Add Profile Viewing** - Show the user's profile on a dedicated screen
2. **Add Profile Editing** - Allow users to update their profile
3. **Display Profile Pictures** - Show avatars in project listings and matches
4. **Build Project Creation** - Similar flow for creating projects with AI roadmaps
5. **Implement Matching** - Show personalized project recommendations

## Files Modified

### Backend
- `backend/schema.sql` - Added `auth_user_id` and `profile_picture_url`
- `backend/main.py` - Added upload and profile check endpoints
- `backend/seed_data.sql` - Updated with `auth_user_id`
- `backend/migrations/001_add_profile_picture.sql` - New migration file
- `backend/STORAGE_SETUP.md` - New storage setup guide

### Frontend
- `frontend/package.json` - Added `expo-image-picker`
- `frontend/app/create-profile.tsx` - New profile creation screen
- `frontend/app/_layout.tsx` - Added create-profile route
- `frontend/app/(tabs)/index.tsx` - Added profile check and redirect logic
- `frontend/contexts/AuthContext.tsx` - Added `checkProfileExists` function

## Questions?

If you encounter any issues not covered here:
1. Check the backend logs (`uvicorn` output)
2. Check the frontend console (browser dev tools or Expo console)
3. Check Supabase logs (Dashboard → Logs)
4. Refer to `backend/TROUBLESHOOTING.md` for general connection issues
