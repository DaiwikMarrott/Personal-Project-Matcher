#!/bin/bash
# Quick Start Script for Project Jekyll & Hyde (Unix/Mac)

echo "🧬 Starting Project Jekyll & Hyde..."
echo ""

# Check if backend dependencies are installed
if [ ! -d "backend/venv" ]; then
    echo "⚠️  Backend virtual environment not found. Setting up..."
    cd backend
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
    cd ..
    echo "✅ Backend dependencies installed"
else
    echo "✅ Backend virtual environment found"
fi

# Check if frontend dependencies are installed
if [ ! -d "frontend/node_modules" ]; then
    echo "⚠️  Frontend dependencies not found. Installing..."
    cd frontend
    npm install
    cd ..
    echo "✅ Frontend dependencies installed"
else
    echo "✅ Frontend dependencies found"
fi

# Check for environment files
if [ ! -f "backend/.env" ]; then
    echo "⚠️  Backend .env not found. Copying from .env.example..."
    cp backend/.env.example backend/.env
    echo "⚠️  Please edit backend/.env with your credentials"
fi

if [ ! -f "frontend/.env" ]; then
    echo "⚠️  Frontend .env not found. Copying from .env.example..."
    cp frontend/.env.example frontend/.env
    echo "⚠️  Please edit frontend/.env with your credentials"
fi

echo ""
echo "🚀 Starting services..."
echo ""

# Start backend in background
echo "Starting backend on http://localhost:8000"
cd backend
source venv/bin/activate
uvicorn main:app --reload &
BACKEND_PID=$!
cd ..

# Wait a bit for backend to start
sleep 3

# Start frontend
echo "Starting frontend on http://localhost:8081"
cd frontend
npm start

# When frontend exits, kill backend
kill $BACKEND_PID
