# Codebase Health Check Report
**Date:** March 1, 2026
**Status:** 🟡 Needs Attention

## Executive Summary
The codebase has several areas of technical debt including duplicated code, unused files, and inconsistent API patterns. None are critical, but cleaning them up will improve maintainability.

---

## 🔴 Critical Issues

### 1. Image Upload Not Working ✅ FIXED
**Issue:** Backend was not returning full project data after updates
**Impact:** Images disappeared after saving
**Fix Applied:** 
- Added `.select()` to Supabase update queries in `backend/main.py`
- Backend now returns complete project records
- Frontend uses backend response data instead of manual state updates

### 2. Status Toggle Not Working ✅ FIXED  
**Issue:** Project status updates weren't being saved properly
**Impact:** Users couldn't close/reopen projects
**Fix Applied:**
- Added `.select()` to status update query
- Added comprehensive logging to both frontend and backend
- Frontend uses backend response data

---

## 🟡 High Priority - Code Duplication

### 1. **Duplicate Project Detail Files**
**Files:**
- ✅ `frontend/app/project-detail.tsx` (1,038 lines) - **ACTIVE, CURRENTLY USED**
- ❌ `frontend/app/project/[id].tsx` (794 lines) - **UNUSED, CAN BE DELETED**

**Evidence:** 
- Explore page uses `/project-detail` route
- No references to `/project/[id]` found in active code
- `project/[id].tsx` is likely leftover from earlier routing approach

**Recommendation:** DELETE `frontend/app/project/[id].tsx`

---

### 2. **Duplicate API URL Definitions** ⚠️
**Found in 4 files:**
- `frontend/app/create-profile.tsx` (line 24)
- `frontend/app/profile.tsx` (line 24)  
- `frontend/app/project/[id].tsx` (line 23)
- `frontend/contexts/AuthContext.tsx` (line 10)

**Current (duplicated):**
```typescript
const API_URL = Platform.OS === 'web' 
  ? 'http://localhost:8000' 
  : Platform.OS === 'android' 
    ? 'http://10.0.2.2:8000' 
    : 'http://localhost:8000';
```

**Solution:** Use centralized `API_BASE_URL` from `frontend/services/api.ts`

---

### 3. **Duplicate Constants - EXPERIENCE_LEVELS**
**Found in 2 files:**
- `frontend/app/create-profile.tsx` (line 30)
- `frontend/app/profile.tsx` (line 30)

**Value:** `['beginner', 'intermediate', 'advanced', 'expert']`

**Recommendation:** Create `frontend/constants/app-constants.ts` to centralize

---

### 4. **Duplicate Constants - MAJORS**
**Found in 2 files:**
- `frontend/app/create-profile.tsx` (line 42)
- `frontend/app/profile.tsx` (line 32)

**Value:** Array of 11 majors (Computer Science, Software Engineering, etc.)

**Recommendation:** Move to centralized constants file

---

## 🟢 Medium Priority - Unused Files

### Potentially Unused Components
Need user confirmation before deletion:
- `frontend/components/hello-wave.tsx`
- `frontend/components/parallax-scroll-view.tsx`
- `frontend/components/external-link.tsx`
- `frontend/components/haptic-tab.tsx`
- `frontend/app/modal.tsx`
- `frontend/app/index.tsx`
- `frontend/app/landing.tsx`

**Action:** Verify usage before removing

---

## 🟢 Low Priority - Code Quality

### 1. **Inconsistent Error Handling**
Some files use try-catch, others don't. Standardize error boundaries.

### 2. **Missing TypeScript Types**
Several `any` types found in:
- `profile.tsx` - `profile: any`
- `project-detail.tsx` - `updateData: any`

**Recommendation:** Define proper interfaces

### 3. **Hardcoded Styles**
Many inline styles could be extracted to StyleSheet for better performance.

---

## 📋 Recommended Action Plan

### Phase 1: Critical Fixes ✅ COMPLETED
1. ✅ Fix image upload backend (add .select())
2. ✅ Fix status toggle backend (add .select())
3. ✅ Add comprehensive logging

### Phase 2: Cleanup (Est. 1-2 hours)
1. **Create constants file**
   - Create `frontend/constants/app-constants.ts`
   - Move EXPERIENCE_LEVELS, MAJORS, and other shared constants
   - Update imports in create-profile.tsx and profile.tsx

2. **Remove duplicate files**
   - Delete `frontend/app/project/[id].tsx`
   - Verify no other references exist

3. **Consolidate API URLs**
   - Replace all local API_URL definitions with imports from `api.ts`
   - Update create-profile.tsx, profile.tsx, AuthContext.tsx

### Phase 3: Optional Cleanup (Est. 2-3 hours)
1. Remove unused components (after verification)
2. Add proper TypeScript interfaces
3. Extract inline styles
4. Add error boundaries

---

## 🎯 Current Project Status

### Working Features ✅
- User authentication (sign up, sign in, sign out)
- Profile creation and editing
- Project creation with image upload
- Project discovery and filtering
- Project status management (open/closed)
- Profile sections for open/closed projects
- AI-generated project roadmaps
- Matching algorithm

### Recently Fixed ✅
- Image upload now saves properly
- Status toggle now works correctly
- Comprehensive logging added for debugging

### Known Remaining Issues
- Code duplication (non-critical)
- Some unused files (need verification)

---

## 📊 Code Statistics

**Frontend:**
- Total .tsx files: 27
- Lines of code: ~8,000-10,000 (estimated)
- Duplicate code: ~15-20% (constants, API URLs, unused files)

**Backend:**
- Total .py files: ~8
- Lines of code: ~900 in main.py
- Status: Clean, well-structured

---

## 🔧 Quick Wins (Can implement now)

### 1. Create Constants File
```typescript
// frontend/constants/app-constants.ts
export const EXPERIENCE_LEVELS = ['beginner', 'intermediate', 'advanced', 'expert'];

export const MAJORS = [
  'Computer Science',
  'Software Engineering',
  'Data Science',
  'Biology',
  'Chemistry',
  'Physics',
  'Mathematics',
  'Engineering',
  'Design',
  'Business',
  'Other',
];
```

### 2. Delete Unused File
```bash
# Safe to delete:
rm frontend/app/project/[id].tsx
```

### 3. Use Centralized API URL
Replace all instances of local `API_URL` with:
```typescript
import { API_BASE_URL } from '@/services/api';
```

---

## Conclusion

**Overall Health:** 🟡 Good with Areas for Improvement

The critical functionality issues have been fixed. The remaining issues are technical debt that won't impact functionality but should be addressed to improve code maintainability and reduce confusion for future developers.

**Estimated cleanup time:** 3-5 hours total
**Priority:** Medium (can be done incrementally)
**Risk:** Low (mostly deletions and consolidations)
