@echo off
REM Quick Start Script for Project Jekyll & Hyde (Windows)

echo 🧬 Starting Project Jekyll & Hyde...
echo.

REM Check if backend dependencies are installed
if not exist "backend\venv" (
    echo ⚠️  Backend virtual environment not found. Setting up...
    cd backend
    python -m venv venv
    call venv\Scripts\activate
    pip install -r requirements.txt
    cd ..
    echo ✅ Backend dependencies installed
) else (
    echo ✅ Backend virtual environment found
)

REM Check if frontend dependencies are installed
if not exist "frontend\node_modules" (
    echo ⚠️  Frontend dependencies not found. Installing...
    cd frontend
    call npm install
    cd ..
    echo ✅ Frontend dependencies installed
) else (
    echo ✅ Frontend dependencies found
)

REM Check for environment files
if not exist "backend\.env" (
    echo ⚠️  Backend .env not found. Copying from .env.example...
    copy backend\.env.example backend\.env
    echo ⚠️  Please edit backend\.env with your credentials
)

if not exist "frontend\.env" (
    echo ⚠️  Frontend .env not found. Copying from .env.example...
    copy frontend\.env.example frontend\.env
    echo ⚠️  Please edit frontend\.env with your credentials
)

echo.
echo 🚀 Ready to start!
echo.
echo Open TWO separate terminals:
echo.
echo Terminal 1 - Backend:
echo   cd backend
echo   venv\Scripts\activate
echo   uvicorn main:app --reload
echo.
echo Terminal 2 - Frontend:
echo   cd frontend
echo   npm start
echo.
pause
