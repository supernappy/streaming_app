#!/bin/bash

echo "🦙 Testing Ollama AI Integration for OpenStream"
echo "=============================================="

# Test JWT token (replace with current valid token)
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjQsImVtYWlsIjoid2FsZXNvbGFnYmFkZUB5YWhvby5jb20iLCJyb2xlIjoidXNlciIsImlhdCI6MTc1NDUzMjQ2NiwiZXhwIjoxNzU0NjE4ODY2fQ.NvrPyFnaYd33Y8c2PUCCZO4AFdyHmEyYOA9C97yiw9o"
BASE_URL="http://localhost:5002/api"

echo
echo "1. Testing Ollama AI Recommendations..."
curl -s -H "Authorization: Bearer $TOKEN" \
     "$BASE_URL/ai/recommendations?limit=3" | \
     jq '.aiEngine, .recommendations | length'

echo
echo "2. Testing Ollama AI Search..."
curl -s -H "Authorization: Bearer $TOKEN" \
     "$BASE_URL/ai/search?q=music&limit=2" | \
     jq '.aiResults | length'

echo
echo "3. Testing Ollama AI Playlist Generation..."
curl -s -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"mood":"chill","duration":30}' \
     "$BASE_URL/ai/playlist/generate" | \
     jq '.playlist.features.aiGenerated'

echo
echo "4. Checking Ollama Model Status..."
ollama list | grep "llama3.2:3b"

echo
echo "5. Testing Ollama Connection..."
curl -s http://localhost:11434/api/version | jq '.version'

echo
echo "✅ Ollama AI Integration Test Complete!"
echo "🎵 Your OpenStream now uses local AI instead of external APIs!"
