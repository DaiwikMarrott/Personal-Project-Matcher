# 🔧 Troubleshooting Network Connection Issues

## Problem: "Network request failed" error

This error means the frontend cannot reach the backend API.

---

## ✅ Quick Fix (Step-by-Step)

### 1. Check if Backend is Running

**Open a terminal and check:**

```powershell
# Windows Command Prompt or PowerShell
netstat -an | findstr 8000
```

If you see `0.0.0.0:8000` or `127.0.0.1:8000`, the backend is running. ✅  
If you see nothing, the backend is NOT running. ❌

### 2. Start the Backend (if not running)

```powershell
cd backend
venv\Scripts\activate    # Windows
# source venv/bin/activate  # Mac/Linux
uvicorn main:app --reload
```

Wait for this message:
```
INFO:     Application startup complete.
INFO:     Uvicorn running on http://127.0.0.1:8000
```

### 3. Test Backend Directly

Open your browser and go to: http://localhost:8000

You should see:
```json
{
  "message": "Welcome to Project Jekyll & Hyde API",
  "status": "operational",
  "version": "1.0.0"
}
```

### 4. Restart Frontend

In your frontend terminal:
1. Press `Ctrl+C` to stop Expo
2. Run `npm start` again
3. Press `w` to open in web browser
4. Navigate to the Projects tab

---

## 🔍 Common Issues & Solutions

### Issue 1: Backend stops immediately

**Symptoms:**
- Terminal closes right after running uvicorn
- Error: "Could not find the table 'public.projects'"

**Solution:**
You haven't set up the database yet!
1. Go to [Supabase SQL Editor](https://supabase.com/dashboard)
2. Run `backend/schema.sql`
3. Run `backend/seed_data.sql`
4. Restart backend

See: [backend/DATABASE_SETUP.md](backend/DATABASE_SETUP.md)

---

### Issue 2: Backend runs but frontend still can't connect

**Symptoms:**
- Backend shows "Application startup complete"
- Frontend shows "Network request failed"

**Solution A - Check URL:**

1. Open `frontend/.env`
2. Check this line:
   ```
   EXPO_PUBLIC_API_URL=http://localhost:8000
   ```
3. Make sure it matches where uvicorn is running

**Solution B - Check CORS:**

The backend allows all origins by default, so this shouldn't be the issue, but you can verify in `backend/main.py`:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Should be "*" for development
    ...
)
```

---

### Issue 3: "Module not found" error in backend

**Symptoms:**
```
ImportError: No module named 'fastapi'
```

**Solution:**
```powershell
cd backend
pip install -r requirements.txt
```

---

### Issue 4: Different port number

**Symptoms:**
- Uvicorn starts on a different port (not 8000)
- Message: "Address already in use"

**Solution A - Kill the process using port 8000:**
```powershell
# Windows
netstat -ano | findstr :8000
taskkill /PID <PID_NUMBER> /F

# Mac/Linux
lsof -ti:8000 | xargs kill -9
```

**Solution B - Use a different port:**

1. Start backend on different port:
   ```powershell
   uvicorn main:app --reload --port 8001
   ```

2. Update `frontend/.env`:
   ```
   EXPO_PUBLIC_API_URL=http://localhost:8001
   ```

3. Restart frontend

---

### Issue 5: Firewall blocking connection

**Symptoms:**
- Backend runs fine in browser
- Frontend can't connect
- Windows Firewall popup appeared earlier

**Solution:**
Allow Python through Windows Firewall:
1. Windows Security → Firewall & network protection
2. Allow an app through firewall
3. Find Python in the list
4. Check both Private and Public
5. Click OK
6. Restart backend

---

## 🧪 Testing the Connection

### Test 1: Backend Health Check
```powershell
curl http://localhost:8000/
```

Expected:
```json
{"message": "Welcome to Project Jekyll & Hyde API", "status": "operational", "version": "1.0.0"}
```

### Test 2: Backend Projects Endpoint
```powershell
curl http://localhost:8000/projects?project_status=open&limit=10
```

Expected:
```json
{"projects": [...], "count": 5}
```

### Test 3: Frontend API Logs

1. Open browser DevTools (F12)
2. Go to Console tab
3. Refresh the Projects tab
4. Look for logs:
   ```
   Checking backend at: http://localhost:8000
   Fetching projects from: http://localhost:8000/projects
   Projects loaded: 5
   ```

---

## 📱 Platform-Specific Issues

### Web (Browser)
- Uses: `http://localhost:8000`
- CORS enabled by default ✅
- Should work out of the box

### Android Emulator
- Backend URL needs to be: `http://10.0.2.2:8000`
- Update `frontend/.env`:
  ```
  EXPO_PUBLIC_API_URL=http://10.0.2.2:8000
  ```

### iOS Simulator
- Uses: `http://localhost:8000`
- Should work like web

### Physical Device
- Backend must be accessible on your local network
- Find your computer's IP: `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
- Update frontend/.env:
  ```
  EXPO_PUBLIC_API_URL=http://192.168.1.100:8000  # Use your actual IP
  ```
- Start backend with: `uvicorn main:app --reload --host 0.0.0.0`

---

## 🆘 Still Not Working?

### Check Backend Logs

The backend now has detailed logging. Look at your backend terminal for:

```
INFO:     Health check endpoint called
INFO:     Fetching projects with status=open, limit=50
INFO:     Successfully fetched X projects
```

Or errors like:
```
ERROR:    Error fetching projects: ...
```

### Check Frontend Console

In browser DevTools (F12), Console tab, look for:
```
Checking backend at: http://localhost:8000
Error fetching projects: ...
```

### Enable Verbose Logging

**Backend:**
```python
# In backend/main.py, line ~16
logging.basicConfig(level=logging.DEBUG)  # Change INFO to DEBUG
```

**Frontend:**
```typescript
// In frontend/app/(tabs)/explore.tsx
console.log('Full error:', JSON.stringify(err, null, 2));
```

---

## ✅ Checklist

Before asking for help, verify:

- [ ] Backend virtual environment is activated
- [ ] Backend dependencies are installed (`pip list` shows fastapi, uvicorn, etc.)
- [ ] Backend .env file exists with valid credentials
- [ ] Database tables are created in Supabase
- [ ] Backend shows "Application startup complete"
- [ ] Browser can access http://localhost:8000
- [ ] Frontend .env file exists
- [ ] Frontend dependencies are installed
- [ ] Both services are running simultaneously
- [ ] No firewall blocking connections

---

## 🎯 The Working Setup

**Terminal 1 (Backend):**
```
(venv) backend> uvicorn main:app --reload
INFO:     Uvicorn running on http://127.0.0.1:8000
INFO:     Application startup complete.
```

**Terminal 2 (Frontend):**
```
frontend> npm start
Starting Metro Bundler...
› Metro waiting on http://localhost:8081
› Opening in web browser...
```

**Browser Console (F12):**
```
Checking backend at: http://localhost:8000
Fetching projects from: http://localhost:8000/projects
Projects loaded: 5
```

**Result:** ✅ Projects tab shows 5 sample projects

---

**Need more help?** Check:
- [SETUP.md](SETUP.md) - Full setup guide
- [backend/DATABASE_SETUP.md](backend/DATABASE_SETUP.md) - Database setup
- [backend/README.md](backend/README.md) - Backend documentation

Good luck! 🚀
