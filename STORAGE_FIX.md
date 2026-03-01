# 🚨 Quick Fix: Storage Upload Not Working

## The Problem
Your avatars bucket exists but policies aren't configured, so uploads are failing with "Bucket not found" error.

## The Solution (2 minutes)

### Step 1: Run Storage Policies

1. **Open Supabase Dashboard** → Your Project
2. **Click "SQL Editor"** in the left sidebar
3. **Copy and paste** this entire SQL script:

```sql
-- Storage policies for avatars bucket
-- Run this once to enable profile picture uploads

-- 1. Allow public read access (so profile pictures are visible)
CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- 2. Allow authenticated users to upload their own avatars
CREATE POLICY "Authenticated users can upload avatars"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars');

-- 3. Allow users to update their own avatars
CREATE POLICY "Users can update their own avatars"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1])
WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 4. Allow users to delete their own avatars  
CREATE POLICY "Users can delete their own avatars"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
```

4. **Click "Run"** or press `Ctrl+Enter`
5. **You should see**: `Success. No rows returned` (this is good!)

### Step 2: Verify It Worked

1. Go back to **Storage** → **avatars** bucket
2. Try uploading a profile picture again in your app
3. Refresh the bucket - you should now see a folder with your user ID containing `avatar.jpg`

### Step 3: Test Profile Picture

1. In your app, go to **Profile** page
2. Click **Edit** button
3. Tap the profile picture
4. Select an image
5. Click **Save Changes**
6. Image should upload successfully! ✅

## If It Still Fails

Check the backend terminal - you should see:
```
INFO: Storage response: ...
INFO: Successfully uploaded avatar for user xxx, URL: https://...
```

If you see "Storage bucket not configured", the policies didn't run correctly. Make sure:
- You ran ALL 4 policies (not just one)
- The avatars bucket is marked as PUBLIC ✅ (shown in your screenshot - good!)
- You're signed in (not anonymous user)

## What These Policies Do

1. **Policy 1**: Anyone can VIEW profile pictures (public read)
2. **Policy 2**: Logged-in users can UPLOAD pictures
3. **Policy 3**: Users can UPDATE their own pictures only
4. **Policy 4**: Users can DELETE their own pictures only

This prevents users from deleting each other's photos while allowing uploads!
