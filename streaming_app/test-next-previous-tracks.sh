#!/bin/bash

echo "🎵 Testing Next/Previous Track Functionality"
echo "============================================"

echo "1. Make sure both server and client are running..."
echo "2. Navigate to http://localhost:3000/login"
echo "3. Login with: email: wale@example.com, password: password123"
echo "4. Navigate to Room 5: http://localhost:3000/room/5"
echo "5. Test the following:"
echo ""
echo "   ✅ Check if tracks are visible in the track queue"
echo "   ✅ Click on different tracks in the queue to switch"
echo "   ✅ Click the Next Track button (⏭️) to move forward"
echo "   ✅ Click the Previous Track button (⏮️) to move backward" 
echo "   ✅ Verify audio plays automatically when switching"
echo ""
echo "Expected Debug Messages in Browser Console:"
echo "   🖱️ TRACK CLICK: Track clicked"
echo "   🎵 HOST CHANGE TRACK: Called with"
echo "   ⏭️ NEXT TRACK: Button clicked"
echo "   ⏮️ PREVIOUS TRACK: Button clicked"
echo "   🎵 SYNC: Track change received"
echo "   🎵 SYNC: Auto-playing new track"
echo ""
echo "Opening debug page and room..."

# Open the debug page and room
open "file://$(pwd)/debug-room-logs.html"
sleep 2
open "http://localhost:3000/login"
sleep 2
open "http://localhost:3000/room/5"

echo ""
echo "✅ All test pages opened!"
echo "👆 Click the buttons and check the console logs"
