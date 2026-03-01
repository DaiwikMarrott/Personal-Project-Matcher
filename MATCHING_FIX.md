# Matching Algorithm Fix - Complete Guide

## Issues Identified

1. **Zero Match Percentages**: RPC function has an ambiguous column reference error
2. **Inconsistent Sorting**: Fixed by adding secondary sort in RPC function

## Root Cause Analysis

### Issue 1: Ambiguous Column Reference
The `match_projects_to_profile` RPC function was failing with error:
```
column reference "id" is ambiguous
```

This occurred because the SQL query had column names that could refer to multiple tables without proper qualification.

### Issue 2: Inconsistent Sorting
When multiple projects have the same similarity score, PostgreSQL may return them in different orders across multiple queries. This was fixed by adding a secondary sort by `created_at`.

## The Fix

A corrected RPC function has been created in:
- `backend/migrations/FIX_AMBIGUOUS_COLUMN.sql`

## How to Apply the Fix

### Option 1: Use the provided shell script (Recommended if you have psql)

```bash
cd backend
./apply_rpc_fix.sh
```

**Note**: This requires `SUPABASE_DB_URL` in your `.env` file.

To get your database URL:
1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to **Project Settings** > **Database**
4. Look for **Connection String** > **URI**
5. Copy the connection string (starts with `postgresql://`)
6. Add to your `.env` file:
   ```
   SUPABASE_DB_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
   ```

### Option 2: Manually in Supabase SQL Editor (Always works)

1. Go to https://supabase.com/dashboard
2. Select your project
3. Click on **SQL Editor** in the left sidebar
4. Click **New query**
5. Open this file: `backend/migrations/FIX_AMBIGUOUS_COLUMN.sql`
6. Copy all the content
7. Paste into the SQL Editor
8. Click **Run** (or press Cmd+Enter)
9. You should see: ✅ RPC function fixed!

## Verification Steps

After applying the fix:

### 1. Run the diagnostic script
```bash
cd backend
source venv/bin/activate
python3 diagnose_embeddings.py
```

You should see:
- ✅ All embeddings appear valid
- RPC function returns projects with similarity scores > 0

### 2. Test in the frontend

#### Dashboard (Home Page)
1. Refresh the page
2. Look at "Recommended For You" section
3. **Expected**: You should see match percentage badges like "⭐ 75% Match", "⭐ 62% Match", etc.
4. **Before fix**: All showed "⭐ 0% Match"

#### Explore Page
1. Go to Explore page
2. Toggle "Sort by Match" button ON
3. **Expected**: Projects should be sorted by match percentage (highest first)
4. Click the toggle multiple times to turn ON/OFF
5. **Expected**: When ON, the order should be consistent (same every time)
6. **Expected**: When OFF, projects should appear in random order
7. **Before fix**: Different order each time even when sorted

### 3. Check browser console
Open browser DevTools (F12 or Cmd+Option+I), go to Console tab.

You should see logs like:
```
Recommended projects response: {recommended_projects: [...]}
Project 1: AI-Powered Study Assistant - Similarity: 0.7234
Project 2: Personal Code Snippet Organizer - Similarity: 0.6891
```

The similarity values should be > 0 for relevant matches.

## Technical Details

### What Changed in the RPC Function

**Before** (Ambiguous):
```sql
SELECT 
    proj.id,  -- Which table's 'id'? Ambiguous!
    ...
    1 - (proj.project_embedding <=> (SELECT bio_embedding FROM profiles WHERE id = profile_uuid)) AS similarity
FROM projects proj
WHERE proj.project_embedding IS NOT NULL
ORDER BY similarity DESC
```

**After** (Fixed):
```sql
DECLARE
    user_embedding VECTOR(768);
BEGIN
    -- Get user embedding first (no ambiguity)
    SELECT bio_embedding INTO user_embedding
    FROM profiles
    WHERE profiles.id = profile_uuid;
    
    -- Use the stored variable in query
    SELECT 
        projects.id,  -- Explicit table reference
        ...
        1 - (projects.project_embedding <=> user_embedding) AS similarity
    FROM projects
    WHERE projects.project_embedding IS NOT NULL
    ORDER BY similarity DESC, projects.created_at DESC  -- Secondary sort for consistency
```

### Key Improvements

1. **Explicit table references**: All column names use `projects.column_name` or `profiles.column_name`
2. **Variable storage**: User embedding is fetched once and stored in a variable
3. **Null handling**: Returns empty result if user has no embedding
4. **Secondary sort**: Ensures consistent ordering when similarity scores are equal
5. **Clear logic**: Easier to understand and maintain

## Troubleshooting

### If you still see 0% matches after applying the fix:

1. **Check if RPC function was applied correctly**:
   ```bash
   python3 diagnose_embeddings.py
   ```
   Look for "RPC function error" in the output.

2. **Check backend logs**:
   Look at the terminal running `uvicorn main:app --reload` for error messages.

3. **Check if embeddings exist**:
   The diagnostic script should show:
   - Profiles with NULL embeddings: 0/X
   - Projects with NULL embeddings: 0/X

4. **Restart backend** (if needed):
   ```bash
   # Kill existing process
   lsof -ti:8000 | xargs kill -9
   
   # Start again
   cd backend
   source venv/bin/activate
   uvicorn main:app --reload
   ```

5. **Clear browser cache**:
   - Chrome/Edge: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
   - Safari: Cmd+Option+E, then Cmd+R

### If embeddings are zero vectors or NULL:

This shouldn't happen for newly created profiles/projects, but if you have old data:

```bash
cd backend
source venv/bin/activate
python3 update_existing_data.py
```

This will regenerate AI summaries and embeddings for all existing data.

## Files Created/Modified

- ✅ `backend/migrations/FIX_AMBIGUOUS_COLUMN.sql` - The corrected RPC function
- ✅ `backend/diagnose_embeddings.py` - Diagnostic tool
- ✅ `backend/apply_rpc_fix.sh` - Shell script to apply fix
- ✅ `backend/apply_rpc_fix.py` - Python script to display SQL
- ✅ `MATCHING_FIX.md` - This guide

## Summary

The matching algorithm is working correctly on the backend (embeddings are valid), but the database RPC function had a SQL error preventing it from executing. The fix resolves the ambiguous column reference and adds consistent sorting.

After applying the fix, match percentages should display correctly and sorting should be consistent.
