#!/bin/bash

# Function to kill child processes on exit
cleanup() {
    echo "Stopping servers..."
    kill $(jobs -p) 2>/dev/null
    exit
}

trap cleanup SIGINT SIGTERM

echo "🚀 Starting FabArena Development Environment..."

# Start Backend
echo "📦 Starting Backend (Port 3000)..."
cd fab-tcg-backend
npm run dev &
BACKEND_PID=$!
cd ..

# Start Frontend
echo "💻 Starting Frontend..."
# Running from root as package.json is here
npm run dev -- --open &
FRONTEND_PID=$!

echo "✅ Both servers are running!"
echo "Press Ctrl+C to stop both servers."

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID
