# Repository Cleanup Archive
**Date**: March 1, 2026  
**Purpose**: This document archives important information from deleted testing/diagnostic files

---

## Overview

This repository underwent cleanup to remove redundant testing files, diagnostic scripts, and multiple versions of database migrations. All core functionality remains intact. This document preserves important information from deleted files.

---

## 1. MATCHING ALGORITHM - Core Information

### How It Works
The matching algorithm uses **Google Gemini AI embeddings** with **cosine similarity** to match user profiles with projects.

**Components:**
1. **AI Summaries**: 2-3 sentence descriptions generated for both profiles and projects
2. **Embeddings**: 768-dimensional vectors created from AI summaries using `gemini-embedding-001`
3. **Similarity Calculation**: Cosine similarity between profile and project embeddings (0.0 to 1.0)
4. **RPC Function**: PostgreSQL function `match_projects_to_profile` that returns sorted matches

**Key Files:**
- `backend/ai_service.py`: Contains `generate_profile_summary()`, `generate_project_summary()`, and `generate_embedding()`
- `backend/main.py`: API endpoints for creating profiles/projects and getting recommendations
- Database RPC function in `backend/migrations/FIX_AMBIGUOUS_COLUMN.sql`

**User-Facing Features:**
- Dashboard "Recommended For You" section (top 3 matches)
- Explore page with "Sort by Match" toggle
- Match percentage badges (e.g., ⭐ 78% Match)

---

## 2. DATABASE MIGRATIONS - Applied Changes

### Current Schema
The active database schema is in `backend/schema.sql` with these key features:

**Tables:**
- `profiles`: User profile data with `bio_embedding` (VECTOR(768)) and `profile_ai_summary` (TEXT)
- `projects`: Project data with `project_embedding` (VECTOR(768)) and `project_ai_summary` (TEXT)

**Indexes:**
- HNSW indexes on embedding columns for fast vector similarity search
- Standard B-tree indexes on frequently queried fields

**RPC Functions:**
- `match_projects_to_profile(profile_uuid, match_threshold, match_limit)`: Returns projects sorted by similarity
- `match_profiles_to_project(project_uuid, match_threshold, match_limit)`: Returns profiles sorted by similarity

### Migration History (Applied)
1. **Initial Schema**: Basic tables with vector support
2. **Profile Picture**: Added `profile_picture_url` column
3. **Matching Fields**: Added `profile_ai_summary`, `project_ai_summary`, availability fields
4. **RPC Fix**: Fixed ambiguous column reference error in matching function

### Final Working RPC Function
Located in: `backend/migrations/FIX_AMBIGUOUS_COLUMN.sql`

This function resolves the "column reference 'id' is ambiguous" error by:
- Fetching user embedding into a variable first
- Using explicit table references (e.g., `projects.id`)
- Adding secondary sort by `created_at` for consistency
- Handling NULL embeddings gracefully

---

## 3. TROUBLESHOOTING GUIDE

### Common Issues and Solutions

#### Issue 1: Match Percentages Show as 0%
**Cause**: RPC function error (usually ambiguous column reference)  
**Solution**: Apply `backend/migrations/FIX_AMBIGUOUS_COLUMN.sql` in Supabase SQL Editor  
**Verify**: Run `backend/diagnose_embeddings.py` (if kept) or check Supabase logs

#### Issue 2: Inconsistent Sorting on Explore Page
**Cause**: Missing secondary sort in RPC function  
**Solution**: RPC function now includes `ORDER BY similarity DESC, projects.created_at DESC`  
**Verify**: Toggle "Sort by Match" multiple times - order should be identical

#### Issue 3: No Embeddings Generated
**Cause**: AI service error or missing API key  
**Solution**: 
- Check `GEMINI_API_KEY` in `.env`
- Verify backend logs for errors during profile/project creation
- If needed, regenerate embeddings using update script

#### Issue 4: Backend Connection Issues
**Cause**: Backend not running or wrong URL  
**Platform-specific URLs:**
- Web: `http://localhost:8000`
- Android Emulator: `http://10.0.2.2:8000`
- iOS Simulator: `http://localhost:8000`
- Physical Device: `http://<your-computer-ip>:8000`

---

## 4. TESTING PROCEDURES

### Manual Testing Checklist

#### Dashboard Testing
- [ ] "Recommended For You" section shows projects
- [ ] Match percentages are non-zero and varied (e.g., 78%, 65%, 52%)
- [ ] Top 3 recommendations make sense based on your profile
- [ ] Clicking project cards navigates to project detail page

#### Explore Page Testing
- [ ] **Unsorted mode** (button OFF): Projects in random order, no badges
- [ ] **Sorted mode** (button ON): Projects ordered by match %, badges visible
- [ ] Toggling sort multiple times shows consistent order when ON
- [ ] Match percentages match those on dashboard
- [ ] Search function works with both modes

#### API Testing
**Endpoints to test:**
```bash
# Health check
curl http://localhost:8000/

# Get recommended projects
curl http://localhost:8000/recommended-projects/{profile_id}?limit=10

# Get all open projects
curl http://localhost:8000/projects?project_status=open&limit=50
```

---

## 5. AI SERVICE DETAILS

### Gemini API Usage

**Models Used:**
- `gemini-flash-latest`: For generating summaries and roadmaps
- `gemini-embedding-001`: For creating 768D embeddings

**Functions:**

#### `generate_profile_summary(profile_data)`
Creates a 2-3 sentence description capturing:
- Major/field of study
- Skills and experience level
- Interests and project preferences
- Collaboration style

#### `generate_project_summary(project_data)`
Creates a 2-3 sentence description capturing:
- Project goals and description
- Required skills and technologies
- Time commitment and duration
- Ideal collaborator profile

#### `generate_embedding(text)`
- Converts text to 768D vector using `gemini-embedding-001`
- Task type: `retrieval_document`
- Handles empty text gracefully (returns zero vector)
- Pads/truncates to exactly 768 dimensions

### Rate Limiting
Free tier: ~15 requests per minute per model  
Production consideration: Implement request queuing for bulk operations

---

## 6. STORAGE POLICIES (Applied)

### Supabase Storage Buckets

**Profile Pictures:**
- Bucket: `profile-pictures`
- Public access: Read-only
- Upload: Authenticated users only
- Max size: 5MB
- Allowed types: image/jpeg, image/png, image/webp

**Project Images:**
- Bucket: `project-images`
- Public access: Read-only  
- Upload: Authenticated users only
- Max size: 5MB
- Allowed types: image/jpeg, image/png, image/webp

**RLS Policies:**
- Users can upload to their own folders
- Anyone can read public images
- Only owner can delete their images

---

## 7. DEVELOPMENT WORKFLOW

### Starting the Application

**Backend:**
```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

**Frontend:**
```bash
cd frontend
npm install
npx expo start
```

**Quick Start (Using Scripts):**
- Windows: `start.bat`
- Mac/Linux: `./start.sh`

### Environment Setup

**Backend .env:**
```env
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
GEMINI_API_KEY=your_gemini_key
```

**Frontend .env:**
```env
EXPO_PUBLIC_API_URL=http://localhost:8000
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

---

## 8. KEY FIXES IMPLEMENTED

### Fix 1: Ambiguous Column Reference (Feb 28, 2026)
**Problem**: RPC function failed with "column reference 'id' is ambiguous"  
**Impact**: All match scores showed as 0%  
**Solution**: Rewrote RPC function to use explicit table references and variable storage  
**Files Modified**: `backend/migrations/FIX_AMBIGUOUS_COLUMN.sql`

### Fix 2: Inconsistent Sorting (Feb 28, 2026)
**Problem**: Explore page showed different order each time when sorted  
**Impact**: Confusing user experience, appeared broken  
**Solution**: Added secondary sort by `created_at` in RPC function  
**Files Modified**: `backend/migrations/FIX_AMBIGUOUS_COLUMN.sql`

### Fix 3: Race Condition in Sort Toggle (Mar 1, 2026)
**Problem**: Clicking sort button read old state value  
**Impact**: Wrong API endpoint called, incorrect results  
**Solution**: Added useEffect to watch sortByMatch changes  
**Files Modified**: `frontend/app/(tabs)/explore.tsx`

### Fix 4: Missing Match Badges (Mar 1, 2026)
**Problem**: Badges only showed when `similarity_score !== undefined`  
**Impact**: Some projects didn't show match percentages  
**Solution**: Always show badges when sorted, with fallback to 0%  
**Files Modified**: `frontend/app/(tabs)/explore.tsx`

---

## 9. DELETED FILES REFERENCE

### Testing/Diagnostic Scripts (Deleted)
These were one-time use scripts for debugging:

- `backend/apply_rpc_fix.py` - Displayed SQL fix instructions
- `backend/apply_rpc_fix.sh` - Shell script to apply RPC fix via psql
- `backend/diagnose_embeddings.py` - Checked database embedding state
- `backend/fix_matching_guide.py` - Interactive guide for applying fix
- `backend/test_models.py` - Listed available Gemini models
- `backend/test_rpc.py` - Quick test for RPC function
- `backend/update_existing_data.py` - One-time script to regenerate embeddings

**Note**: If you need to debug embeddings in the future, the logic from `diagnose_embeddings.py` was:
```python
# Check if embeddings exist
profiles = supabase.table("profiles").select("id, bio_embedding, profile_ai_summary").execute()
for profile in profiles.data:
    if not profile['bio_embedding']:
        print(f"Missing embedding for {profile['id']}")
```

### Redundant Migrations (Deleted)
These were superseded by the final working version:

- `backend/migrations/APPLY_THIS_MIGRATION.sql` - Old version with ambiguous column bug
- `backend/migrations/FIX_RPC_URGENT.sql` - Interim fix attempt
- `backend/migrations/fix_matching_rpc_function.sql` - Another interim fix
- `backend/migrations/add_matching_fields.sql` - Partial migration
- `backend/migrations/001_add_profile_picture.sql` - Already applied, now in main schema
- `backend/migration_add_duration.sql` - Merged into main schema
- `backend/migration_add_project_fields.sql` - Merged into main schema
- `backend/migration_combined.sql` - Incomplete combination
- `backend/QUICK_FIX.sql` - One-time fix
- `backend/STORAGE_POLICIES.sql` - Applied policies

**Active Migration**: Only `backend/migrations/FIX_AMBIGUOUS_COLUMN.sql` remains as the canonical RPC function definition.

### Documentation Files (Consolidated)
These provided valuable information now archived here:

- `MATCHING_ALGORITHM.md` - Detailed algorithm explanation
- `MATCHING_FIX.md` - Fix guide and verification steps
- `EXPLORE_FIX_SUMMARY.md` - Explore page fix summary
- `EXPLORE_PAGE_TESTING.md` - Testing procedures
- `PROJECT_ANALYSIS.md` - Initial project analysis
- `PROJECT_ENHANCEMENTS.md` - Enhancement ideas
- `PROJECT_ERROR_FIX.md` - Error fix notes
- `STORAGE_FIX.md` - Storage setup guide
- `TROUBLESHOOTING.md` - Troubleshooting tips
- `PROFILE_SETUP.md` - Profile setup guide
- `backend/DATABASE_SETUP.md` - Database setup instructions
- `backend/STORAGE_SETUP.md` - Storage policies setup
- `backend/sorting_function.txt` - Complete system documentation

---

## 10. CURRENT PROJECT STRUCTURE

```
Personal-Project-Matcher/
├── README.md                 # Main documentation
├── SETUP.md                  # Setup instructions
├── LICENSE                   # MIT License
├── SECURITY.md              # Security policy
├── CONTRIBUTING.md          # Contribution guidelines
├── ARCHIVE.md               # This file
├── start.sh / start.bat     # Startup scripts
│
├── backend/
│   ├── main.py              # FastAPI application
│   ├── ai_service.py        # Gemini AI functions
│   ├── schema.sql           # Database schema
│   ├── seed_data.sql        # Sample data
│   ├── requirements.txt     # Python dependencies
│   ├── requirements-dev.txt # Dev dependencies
│   ├── .env.example         # Environment template
│   ├── migrations/
│   │   └── FIX_AMBIGUOUS_COLUMN.sql  # Active RPC function
│   └── tests/               # Pytest tests
│       ├── conftest.py
│       ├── test_main.py
│       └── test_ai_service.py
│
└── frontend/
    ├── app/                 # Expo Router pages
    ├── components/          # Reusable components
    ├── constants/           # Theme and colors
    ├── contexts/            # React contexts
    ├── hooks/               # Custom hooks
    ├── package.json         # Node dependencies
    └── .env.example         # Environment template
```

---

## 11. MAINTENANCE NOTES

### When to Regenerate Embeddings

Embeddings should be regenerated if:
- AI summary generation logic changes significantly
- You switch embedding models
- Database corruption or data migration occurs

**How to regenerate** (create this script if needed):
```python
# Get all profiles
profiles = supabase.table("profiles").select("*").execute()
for profile in profiles.data:
    summary = await generate_profile_summary(profile)
    embedding = await generate_embedding(summary)
    supabase.table("profiles").update({
        "profile_ai_summary": summary,
        "bio_embedding": embedding
    }).eq("id", profile["id"]).execute()
```

### Database Backup

Regular backups recommended:
```bash
# Via Supabase Dashboard: Settings > Database > Backups
# Or use pg_dump if you have direct access
```

### Monitoring

Key metrics to monitor:
- Gemini API usage and quotas
- Database query performance (especially RPC calls)
- Supabase storage usage
- Match quality (user feedback)

---

## 12. FUTURE ENHANCEMENTS

Ideas from deleted planning documents:

1. **Advanced Matching**
   - Weight certain skills more heavily
   - Consider time zone compatibility
   - Factor in project difficulty vs experience level

2. **User Experience**
   - Add match explanation ("Why this match?")
   - Allow users to rate match quality
   - Implement "Not interested" feedback loop

3. **Performance**
   - Cache match results for active users
   - Batch embed generation for new items
   - Consider approximate nearest neighbor (ANN) indexes

4. **Analytics**
   - Track which matches lead to collaborations
   - A/B test different matching algorithms
   - Monitor and improve match quality over time

---

## Conclusion

This cleanup removed ~20 redundant files while preserving all critical information. The core application remains fully functional with cleaner structure and better maintainability.

**For questions or to restore any deleted information, refer to this archive document or git history.**

---

**Last Updated**: March 1, 2026  
**Maintained By**: Development Team  
**Version**: 1.0
