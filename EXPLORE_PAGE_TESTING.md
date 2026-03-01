# Explore Page Sorting - Testing Guide

## What Was Fixed

### Issue 1: Race Condition in Sort Button
**Problem**: When clicking "Sort by Match", the button was calling `setState` and then immediately calling `fetchProjects()`, but `fetchProjects()` was reading the OLD state value.

**Solution**: Added a `useEffect` that automatically refetches when `sortByMatch` changes. Now the flow is:
1. Click button → State updates
2. useEffect detects change → Refetches with new state value
3. Projects update correctly

### Issue 2: Match Badges Not Always Visible
**Problem**: Match badges only showed when `project.similarity_score !== undefined`, which could hide them if there was any data issue.

**Solution**: Match badges now ALWAYS show when the sort button is active, displaying "0%" if there's no score (though all projects should have scores when sorted).

### Issue 3: Badge Visibility
**Problem**: Match badges were small and hard to read.

**Solution**: Created dedicated `matchBadge` style with:
- Larger font (11px vs 9px)
- Better padding
- Shadow effect for depth
- Positioned below the status badge

## How to Test

### Test 1: Unsorted (Random) View
1. Go to Explore page
2. Make sure "Sort by Match" button is NOT highlighted (gray/default state)
3. **Expected**: 
   - Projects appear in random order
   - NO match percentage badges visible
   - Each refresh/revisit shows different order
4. **How to verify random order**:
   - Note the order of first 3 projects
   - Refresh the page (Cmd+R / Ctrl+R)
   - Order should be different

### Test 2: Sorted View
1. Click the "Sort by Match" button
2. Button should turn green with checkmark: "✓ Sorted by Match"
3. **Expected**:
   - Projects appear in descending order by match percentage
   - ALL projects show match badge (⭐ XX%)
   - Highest match at top, lowest at bottom
4. **How to verify sorting**:
   - Look at the percentages: 78%, 65%, 52%, 41%, etc.
   - Should be descending (never increasing as you scroll down)
   - Make note of the order

### Test 3: Sorting Consistency
1. With "Sort by Match" enabled, note the order of top 5 projects
2. Click the sort button OFF (back to random)
3. Wait 1 second
4. Click the sort button ON again
5. **Expected**: The EXACT SAME order should appear
   - Same projects in same positions
   - Same percentages for each project
6. **Before fix**: Order was different each time
7. **After fix**: Order is always consistent when sorted

### Test 4: Match Badge Visibility
When sorted, each project card should show:
- **Top right corner**: Status badge (OPEN in green)
- **Below status badge**: Match badge (⭐ XX% in accent color with shadow)

The match badge should be:
- Clearly readable
- Positioned consistently
- Has a subtle shadow effect
- Shows on ALL cards when sorted

### Test 5: Toggle Behavior
1. Click sort button ON → Wait for load → Note order
2. Click sort button OFF → Order changes (random)
3. Click sort button ON → Should return to sorted order
4. Repeat 2-3 times
5. **Expected**: Smooth transitions, no flickering, consistent sorted order

## Console Logs to Check

Open browser DevTools (F12 or Cmd+Option+I) and look for these logs:

### When toggling sort:
```
Toggling sort mode from false to true
Sort mode changed to: SORTED
Fetching projects from: http://localhost:8000/projects
Recommended projects loaded: 7
=== PROJECT MATCH SCORES ===
1. Campus Event Discovery Platform: 78%
2. Personal Code Snippet Organizer: 65%
3. AI-Powered Study Assistant: 52%
...
===========================
```

### When random (sort OFF):
```
Toggling sort mode from true to false
Sort mode changed to: RANDOM
Fetching projects from: http://localhost:8000/projects
Projects loaded: 7
Projects randomized for default view
```

## Troubleshooting

### If percentages still show as 0%:
1. Make sure you applied the SQL fix in Supabase
2. Run: `cd backend && python3 diagnose_embeddings.py`
3. Should show: "✅ RPC function fixed! Test returned X projects"

### If order is still inconsistent when sorted:
1. Check that the SQL migration includes the secondary sort:
   ```sql
   ORDER BY similarity DESC, projects.created_at DESC
   ```
2. The backend should log match scores in order
3. Frontend should NOT randomize when `sortByMatch` is true

### If match badges don't appear:
1. Check browser console for errors
2. Verify `sortByMatch` state is true (should see green button with checkmark)
3. Check that projects have `similarity_score` field in console logs

### If the sort button doesn't respond:
1. Check if backend is running (terminal with uvicorn)
2. Check browser console for API errors
3. Make sure user has a profile (needed for matching)

## Expected Behavior Summary

| Sort Button State | Projects Order | Match Badges | Consistency |
|------------------|----------------|--------------|-------------|
| OFF (gray) | Random | Hidden | Different each time |
| ON (green ✓) | By match % (high→low) | Visible on ALL | Same each time |

## Files Modified

- ✅ `frontend/app/(tabs)/explore.tsx`
  - Added useEffect for sortByMatch changes
  - Removed race condition in button handler
  - Always show match badges when sorted
  - Improved badge styling
- ✅ `backend/migrations/FIX_AMBIGUOUS_COLUMN.sql`
  - Fixed RPC function with secondary sort
  - Ensures consistent ordering

## Next Steps

After verifying everything works:
1. Test with multiple users to see different match percentages
2. Consider adding animation when toggling sort mode
3. Maybe add a tooltip explaining what the % means
4. Could add filter by match threshold (e.g., "> 50% matches only")
