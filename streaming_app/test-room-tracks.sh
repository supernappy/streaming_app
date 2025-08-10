#!/bin/bash

echo "🎵 Testing Room Track Addition Fix"
echo "=================================="
echo ""

# Check if backend is running
echo "1. Checking if backend is running..."
curl -f http://localhost:3001/api/health > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Backend is running"
else
    echo "❌ Backend not running. Starting backend..."
    cd server && npm run dev &
    BACKEND_PID=$!
    sleep 5
fi

# Check if frontend is running
echo ""
echo "2. Checking if frontend is running..."
curl -f http://localhost:3000 > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Frontend is running"
else
    echo "❌ Frontend not running. Starting frontend..."
    cd client && npm start &
    FRONTEND_PID=$!
    sleep 10
fi

echo ""
echo "🧪 Test Steps:"
echo "=============="
echo "1. Open http://localhost:3000 in your browser"
echo "2. Login/Register if not already logged in"
echo "3. Upload at least one track (Upload page)"
echo "4. Create a new room or join an existing one"
echo "5. Try to add a track using the 'Add Track' button"
echo "6. Check browser console for any error messages"
echo ""
echo "Expected Result:"
echo "- Track selection dialog should appear"
echo "- Your uploaded tracks should be listed"
echo "- Selecting a track should add it to the room"
echo ""
echo "📝 Troubleshooting:"
echo "==================="
echo "- If no tracks appear: Make sure you've uploaded tracks first"
echo "- If 401/403 errors: Check that you're logged in"
echo "- If API errors: Check backend logs for details"
echo "- Check browser console for detailed error messages"

# Wait for user input to kill processes
echo ""
echo "Press Ctrl+C to stop all services..."
wait
