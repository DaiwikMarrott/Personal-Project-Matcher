# Supabase Storage Setup Guide

This guide explains how to set up Supabase Storage for profile picture uploads.

## Overview

Profile pictures are stored in Supabase Storage, which provides:
- Secure file uploads with authentication
- Public URLs for images
- Automatic image transformation and optimization
- CDN delivery for fast loading

## Setup Steps

### 1. Create Storage Bucket

1. Go to your Supabase dashboard: https://supabase.com/dashboard/project/reyezzmxvvvpapxkjlvf
2. Click on **Storage** in the left sidebar
3. Click **New bucket**
4. Enter bucket name: `avatars`
5. Set **Public bucket**: ✅ **Yes** (so images can be publicly accessed)
6. Click **Create bucket**

### 2. Set Storage Policies

By default, the bucket will have no access policies. You need to create policies to allow:
- Authenticated users to upload their own profile pictures
- Anyone to view profile pictures (public read access)

#### Policy 1: Allow Public Read Access

1. Click on your `avatars` bucket
2. Go to the **Policies** tab
3. Click **New policy**
4. Choose **Custom policy**
5. Enter:
   - **Policy name**: `Public read access`
   - **Allowed operation**: `SELECT`
   - **Target roles**: `public`
   - **Policy definition**: Leave as default (allows all reads)
6. Click **Review** and **Save policy**

Or use SQL:
```sql
CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');
```

#### Policy 2: Allow Authenticated Uploads

1. Click **New policy** again
2. Choose **Custom policy**
3. Enter:
   - **Policy name**: `Authenticated users can upload avatars`
   - **Allowed operation**: `INSERT`
   - **Target roles**: `authenticated`
   - **USING expression**: `auth.role() = 'authenticated'`
4. Click **Review** and **Save policy**

Or use SQL:
```sql
CREATE POLICY "Authenticated users can upload avatars"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars');
```

#### Policy 3: Allow Users to Update/Delete Their Own Avatars

```sql
CREATE POLICY "Users can update their own avatars"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1])
WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own avatars"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
```

### 3. Update Database (If Existing)

If you've already created your database, run the migration to add the profile_picture_url column:

```sql
-- Run in Supabase SQL Editor
\i backend/migrations/001_add_profile_picture.sql
```

Or copy-paste:
```sql
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS profile_picture_url TEXT;
```

### 4. Test Storage Setup

You can test if storage is working by:

1. Using the Supabase dashboard:
   - Go to Storage → avatars bucket
   - Click **Upload file**
   - Upload a test image
   - Click on the image and copy the public URL
   - Open the URL in a browser - you should see the image

2. Using the API:
```javascript
// In your frontend console
import { supabase } from './contexts/AuthContext';

// Upload test
const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
const { data, error } = await supabase.storage
  .from('avatars')
  .upload(`${user.id}/avatar.jpg`, file);

console.log('Upload result:', { data, error });

// Get public URL
const { data: urlData } = supabase.storage
  .from('avatars')
  .getPublicUrl(`${user.id}/avatar.jpg`);

console.log('Public URL:', urlData.publicUrl);
```

## File Organization

Profile pictures are stored with this structure:
```
avatars/
  {user_id}/
    avatar.jpg          # Current profile picture (overwritten on update)
    avatar_{timestamp}.jpg  # Optional: Keep old versions
```

## Supported File Types

- JPEG (`.jpg`, `.jpeg`)
- PNG (`.png`)
- WebP (`.webp`)
- GIF (`.gif`)

Maximum file size: 5MB (configurable)

## Image Transformation

Supabase Storage supports automatic image transformation via URL parameters:

```
https://reyezzmxvvvpapxkjlvf.supabase.co/storage/v1/object/public/avatars/abc123/avatar.jpg?width=200&height=200
```

Parameters:
- `width`: Set width in pixels
- `height`: Set height in pixels
- `quality`: Set quality (0-100)
- `format`: Convert format (jpeg, png, webp)

## Security Notes

1. **File Size Limits**: Configure max upload size in your bucket settings (default 50MB, we recommend 5MB for avatars)
2. **File Type Validation**: Always validate file types on both client and server
3. **Sanitize Filenames**: Use user IDs in paths to prevent conflicts and unauthorized access
4. **Rate Limiting**: Consider implementing rate limiting for uploads to prevent abuse

## Troubleshooting

### "Permission denied" errors
- Check that your storage policies are correctly configured
- Ensure the user is authenticated before uploading
- Verify bucket_id is 'avatars' in policies

### Images not loading
- Check that the bucket is set to **Public**
- Verify the public read policy exists
- Check the URL format is correct

### Upload fails with unknown error
- Check file size (must be under bucket limit)
- Verify file type is supported
- Check browser console for CORS errors
