#!/bin/bash
# Lager System - Quick Start Script

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "🚀 Starting Lager System..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Kill any existing processes
echo "🧹 Cleaning up old processes..."
pkill -f "python.*server.py" || true
pkill -f "npm run dev" || true
sleep 1

# Start Backend
echo "🔧 Starting Backend (Flask)..."
cd "$PROJECT_ROOT/backend"
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
nohup python server.py > /tmp/lager_server.log 2>&1 &
BACKEND_PID=$!
echo "✓ Backend started (PID: $BACKEND_PID)"
sleep 2

# Check if backend is running
if ! curl -s http://127.0.0.1:5000/items > /dev/null 2>&1; then
    echo "❌ Backend failed to start. Check logs:"
    cat /tmp/lager_server.log
    exit 1
fi
echo "✓ Backend is responding"

# Start Frontend
echo ""
echo "🎨 Starting Frontend (Vite)..."
cd "$PROJECT_ROOT/frontend"
npm run dev > /tmp/vite.log 2>&1 &
FRONTEND_PID=$!
echo "✓ Frontend started (PID: $FRONTEND_PID)"
sleep 3

# Check if frontend is running
if ! curl -s http://localhost:5173 > /dev/null 2>&1; then
    echo "❌ Frontend failed to start. Check logs:"
    cat /tmp/vite.log
    exit 1
fi
echo "✓ Frontend is responding"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Lager System is running!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📚 Open your browser:"
echo "   http://localhost:5173"
echo ""
echo "🔐 Admin Login:"
echo "   Username: admin"
echo "   Password: (see backend logs for generated password)"
echo ""
echo "📝 Documentation:"
echo "   $PROJECT_ROOT/README_SYSTEM.md"
echo ""
echo "📊 Logs:"
echo "   Backend:  tail -f /tmp/lager_server.log"
echo "   Frontend: tail -f /tmp/vite.log"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Keep script running and show logs
tail -f /tmp/lager_server.log
