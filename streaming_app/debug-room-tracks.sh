#!/bin/bash

echo "🔍 Room Track Addition Debugging Script"
echo "========================================"

# Check if servers are running
echo "1. Checking server status..."
curl -s http://localhost:3001/api/health > /dev/null
if [ $? -eq 0 ]; then
    echo "✅ Backend is running"
else
    echo "❌ Backend not running"
    exit 1
fi

curl -s http://localhost:3000 > /dev/null
if [ $? -eq 0 ]; then
    echo "✅ Frontend is running"
else
    echo "❌ Frontend not running"
    exit 1
fi

echo ""
echo "🧪 Step-by-step debugging instructions:"
echo "========================================"
echo ""
echo "1. Open your browser to http://localhost:3000"
echo "2. Open Developer Tools (F12) and go to Console tab"
echo "3. Login with your account"
echo "4. Go to Upload page and upload at least one track"
echo "5. Create a new room or join an existing one"
echo "6. Try to click 'Add Track' or 'Add First Track'"
echo ""
echo "📋 What to check in the console:"
echo "================================"
echo "- Look for '=== DEBUG:' messages"
echo "- Check for any red error messages"
echo "- Verify authentication token exists"
echo "- Confirm tracks are loaded properly"
echo ""
echo "🚨 Common issues to check:"
echo "=========================="
echo "- Are you logged in? (Check localStorage.getItem('token'))"
echo "- Do you have uploaded tracks? (Should see tracks in /tracks/user API)"
echo "- Are you a room participant? (Check room participant status)"
echo "- Check Network tab for failed API calls"
echo ""
echo "💡 Quick test commands (run in browser console):"
echo "=================================================="
echo "// Check if you're logged in:"
echo "localStorage.getItem('token')"
echo ""
echo "// Check your tracks:"
echo "fetch('/api/tracks/user', {headers: {Authorization: 'Bearer ' + localStorage.getItem('token')}}).then(r => r.json()).then(console.log)"
echo ""
echo "// Check room participants:"
echo "fetch('/api/rooms/ROOM_ID/participants', {headers: {Authorization: 'Bearer ' + localStorage.getItem('token')}}).then(r => r.json()).then(console.log)"
echo ""
echo "📝 If you see errors, share the console output for further debugging."
