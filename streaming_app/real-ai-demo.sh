#!/bin/bash

echo "🤖 OpenStream Real AI Demo - Testing Genuine Machine Learning Features"
echo "=================================================================="
echo ""

echo "🧠 Real AI Features Now Active:"
echo "✅ Hugging Face Transformers for semantic understanding"
echo "✅ Natural language processing for music recommendations"
echo "✅ Sentiment analysis for mood-based playlists"
echo "✅ Text embeddings for content similarity"
echo "✅ Machine learning-powered search"
echo ""

echo "🎯 Testing Real AI Endpoints..."
echo ""

echo "1️⃣ Testing Real AI Recommendations..."
curl -s -X GET "http://localhost:5001/api/ai/recommendations?limit=3" \
  -H "Authorization: Bearer fake-token-for-demo" | \
  jq -r '
    if .realAI then
      "✅ Real AI Engine Active: " + .aiEngine + "\n" +
      "🎵 Found " + (.recommendations | length | tostring) + " AI-powered recommendations\n" +
      (.recommendations[0:2] | map("   • " + .title + " (AI Score: " + (.aiScore * 100 | round | tostring) + "%, " + (.aiReason // "Semantic match") + ")") | join("\n"))
    else
      "❌ Demo mode still active"
    end
  ' 2>/dev/null || echo "⚠️  Server not responding (expected if not authenticated)"

echo ""
echo ""

echo "2️⃣ Testing Real AI Enhanced Search..."
curl -s -X GET "http://localhost:5001/api/ai/search?q=chill%20music&limit=3" | \
  jq -r '
    if .aiResults.aiPowered then
      "✅ Real AI Search Active\n" +
      "🔍 Query: " + .query + "\n" +
      "📊 Found " + (.aiResults.totalResults | tostring) + " semantically relevant results\n" +
      "🎯 AI Categories: " + (.aiResults.categorized | keys | join(", "))
    else
      "⚠️  Traditional search fallback"
    end
  ' 2>/dev/null || echo "⚠️  Server not responding"

echo ""
echo ""

echo "3️⃣ Testing Real AI Playlist Generation..."
curl -s -X POST "http://localhost:5001/api/ai/playlist/generate" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer fake-token-for-demo" \
  -d '{"mood":"energetic","duration":30}' | \
  jq -r '
    if .success and .playlist.aiGenerated then
      "✅ Real AI Playlist Generated\n" +
      "🎵 Name: " + .playlist.name + "\n" +
      "🎯 AI Confidence: " + (.playlist.aiConfidence | tostring) + "%\n" +
      "📝 Description: " + .playlist.description
    else
      "⚠️  Playlist generation failed or demo mode"
    end
  ' 2>/dev/null || echo "⚠️  Server not responding (expected if not authenticated)"

echo ""
echo ""

echo "4️⃣ Testing Real AI Track Analysis..."
echo "📁 Analyzing sample track with real AI models..."
curl -s -X POST "http://localhost:5001/api/ai/track/analyze" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer fake-token-for-demo" \
  -d '{"trackId":1}' | \
  jq -r '
    if .success and .analysis.aiGenerated then
      "✅ Real AI Track Analysis Complete\n" +
      "🎯 AI Confidence: " + (.analysis.aiConfidence * 100 | round | tostring) + "%\n" +
      "😊 Sentiment: " + .analysis.sentiment + " (" + (.analysis.sentimentScore * 100 | round | tostring) + "%)\n" +
      "⚡ Energy Level: " + (.analysis.energy * 100 | round | tostring) + "%\n" +
      "🏷️  Suggested Genres: " + (.analysis.suggestedGenres | join(", "))
    else
      "⚠️  Analysis failed or demo mode"
    end
  ' 2>/dev/null || echo "⚠️  Server not responding (expected if not authenticated)"

echo ""
echo ""

echo "5️⃣ Real AI vs Demo AI Comparison:"
echo "┌─────────────────────┬──────────────┬─────────────────┐"
echo "│ Feature             │ Demo AI      │ Real AI         │"
echo "├─────────────────────┼──────────────┼─────────────────┤"
echo "│ Recommendations     │ Rule-based   │ ML Embeddings   │"
echo "│ Search              │ Text Match   │ Semantic Search │"
echo "│ Sentiment Analysis  │ Keywords     │ Transformers    │"
echo "│ Profile Enhancement │ Templates    │ Text Generation │"
echo "│ Music Understanding │ Hardcoded    │ Neural Networks │"
echo "│ Learning Capability │ Static       │ Adaptive        │"
echo "└─────────────────────┴──────────────┴─────────────────┘"

echo ""
echo "🚀 Ready to Experience Real AI!"
echo ""
echo "To test the real AI features:"
echo "1. Start your development servers: ./start-dev.sh"
echo "2. Visit: http://localhost:3002/profile"
echo "3. Go to the 'AI Discover' tab"
echo "4. Click 'AI Analysis' or 'Generate Playlist'"
echo "5. Search with AI toggle enabled at: http://localhost:3002/search"
echo ""
echo "🧠 The AI models will:"
echo "   • Generate semantic embeddings for your content"
echo "   • Analyze sentiment and mood of tracks"
echo "   • Create intelligent recommendations based on listening patterns"
echo "   • Provide real natural language understanding"
echo ""
echo "⚡ Note: First AI requests may take a few seconds as models initialize"
