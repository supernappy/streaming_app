const express = require('express');
const router = express.Router();
const ollamaAIService = require('../services/ollamaAIService');

// const aiService = require('../services/aiService'); // DEPRECATED
// const realAIService = require('../services/realAIService'); // DEPRECATED
const { authMiddleware } = require('../middleware/auth');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const { pool } = require('../utils/database');

// Trending tracks: based on play and like counts
router.get('/trending', async (req, res) => {
  try {
    // Get tracks with most plays and likes
    const trendingResult = await pool.query(`
      SELECT t.*, 
        COALESCE(p.play_count, 0) as play_count, 
        COALESCE(l.like_count, 0) as like_count
      FROM tracks t
      LEFT JOIN (
        SELECT track_id, COUNT(*) as play_count FROM track_plays GROUP BY track_id
      ) p ON t.id = p.track_id
      LEFT JOIN (
        SELECT track_id, COUNT(*) as like_count FROM track_likes GROUP BY track_id
      ) l ON t.id = l.track_id
      ORDER BY (COALESCE(p.play_count,0) + COALESCE(l.like_count,0)) DESC, t.created_at DESC
      LIMIT 20
    `);
    res.json({ success: true, tracks: trendingResult.rows });
  } catch (error) {
    console.error('Trending tracks error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Discovery tracks: random or new tracks
router.get('/discovery', async (req, res) => {
  try {
    // Get 20 random tracks (or you can use ORDER BY created_at DESC for newest)
    const discoveryResult = await pool.query(`
      SELECT * FROM tracks
      ORDER BY RANDOM()
      LIMIT 20
    `);
    res.json({ success: true, tracks: discoveryResult.rows });
  } catch (error) {
    console.error('Discovery tracks error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});
// AI Chat Summarization (Ollama)
router.post('/summarize', authMiddleware, async (req, res) => {
  try {
    const { chatHistory, roomId } = req.body;
    if (!chatHistory || typeof chatHistory !== 'string' || chatHistory.length < 10) {
      return res.status(400).json({ success: false, error: 'Chat history is too short to summarize.' });
    }
    const summary = await ollamaAIService.summarizeText(chatHistory);
    res.json({ success: true, summary });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Personalized Recommendations
router.get('/recommendations/:userId', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 10, type = 'all' } = req.query;

    // Fetch user listening history: tracks played
    const playsResult = await pool.query(
      `SELECT t.* FROM track_plays p JOIN tracks t ON p.track_id = t.id WHERE p.user_id = $1`,
      [userId]
    );
    // Fetch user liked tracks
    const likesResult = await pool.query(
      `SELECT t.* FROM track_likes l JOIN tracks t ON l.track_id = t.id WHERE l.user_id = $1`,
      [userId]
    );
    // Combine and deduplicate
    const historyMap = new Map();
    for (const track of playsResult.rows) historyMap.set(track.id, track);
    for (const track of likesResult.rows) historyMap.set(track.id, track);
    const userHistory = Array.from(historyMap.values());

    // Fetch all tracks
    const allTracksResult = await pool.query('SELECT * FROM tracks');
    const allTracks = allTracksResult.rows;

    // Call the AI recommendation service
    const recommendations = await ollamaAIService.generateRecommendations(userId, userHistory, allTracks);
    res.json({ success: true, recommendations: recommendations.slice(0, limit) });
  } catch (error) {
    console.error('AI recommendations error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Semantic Search
router.post('/search/semantic', authMiddleware, async (req, res) => {
  try {
    const { query, filters = {}, limit = 20 } = req.body;
    
  // DEPRECATED: Use OllamaAIService for semantic search
  // Not implemented: return empty array or error
  res.json({ success: true, results: [] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Smart Playlists Generation
router.post('/playlists/smart', authMiddleware, async (req, res) => {
  try {
    const { userId, criteria, name } = req.body;
    
  // DEPRECATED: Use OllamaAIService for smart playlist
  // Not implemented: return empty object or error
  res.json({ success: true, playlist: {} });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Content Auto-Tagging
router.post('/content/auto-tag', authMiddleware, upload.single('audio'), async (req, res) => {
  try {
    const { contentId, metadata } = req.body;
    const audioFile = req.file;
    
  // DEPRECATED: Use OllamaAIService for auto-tagging
  // Not implemented: return empty array or error
  res.json({ success: true, tags: [] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Content Moderation
router.post('/moderation/analyze', authMiddleware, async (req, res) => {
  console.log('[MODERATION] Endpoint hit');
  try {
    const { content, type = 'text' } = req.body;
    console.log('[MODERATION] Incoming moderation request:', { content, type });
    const analysis = await ollamaAIService.moderateContent(content, type);
    console.log('[MODERATION] Ollama moderation response:', analysis);
    res.json({ success: true, analysis });
  } catch (error) {
    console.error('[MODERATION] Error in moderation endpoint:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Simple moderation endpoint for chat
router.post('/moderate', async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }
    const analysis = await ollamaAIService.moderateContent(message, 'text');
    res.json({ isToxic: analysis.isToxic || false, confidence: analysis.confidence || 0.8 });
  } catch (error) {
    console.error('AI moderation error:', error);
    res.status(500).json({ error: 'AI moderation failed' });
  }
});

// AI chat endpoint
router.post('/chat', async (req, res) => {
  try {
    const { message, context } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }
    const response = await ollamaAIService.generateResponse(message, context || []);
    res.json({ response });
  } catch (error) {
    console.error('AI chat error:', error);
    res.status(500).json({ error: 'AI service unavailable' });
  }
});

// Track analysis endpoint
router.post('/track/analyze', async (req, res) => {
  try {
    const { trackData } = req.body;
    if (!trackData) {
      return res.status(400).json({ error: 'Track data is required' });
    }
    const analysis = await ollamaAIService.analyzeTrack(trackData);
    res.json(analysis);
  } catch (error) {
    console.error('Track analysis error:', error);
    res.status(500).json({ error: 'Track analysis failed' });
  }
});

// Dynamic Thumbnail Generation
router.post('/thumbnails/generate', authMiddleware, upload.single('audio'), async (req, res) => {
  try {
    const { contentId, style = 'default' } = req.body;
    const audioFile = req.file;
    
  // DEPRECATED: Use OllamaAIService for thumbnails
  // Not implemented: return empty string or error
  res.json({ success: true, thumbnail: '' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// AI Chatbot
router.post('/chatbot/message', authMiddleware, async (req, res) => {
  try {
    const { message, userId, context = {} } = req.body;
    
  // DEPRECATED: Use OllamaAIService for chatbot
  // Not implemented: return empty string or error
  res.json({ success: true, response: '' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Streaming Quality Optimization
router.post('/quality/optimize', authMiddleware, async (req, res) => {
  try {
    const { userId, networkConditions, deviceInfo } = req.body;
    
  // DEPRECATED: Use OllamaAIService for optimization
  // Not implemented: return empty object or error
  res.json({ success: true, optimization: {} });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// User Engagement Analytics
router.get('/analytics/engagement/:userId', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    const { timeframe = '30d' } = req.query;
    
  // DEPRECATED: Use OllamaAIService for analytics
  // Not implemented: return empty object or error
  res.json({ success: true, analytics: {} });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Profile Enhancement
router.post('/profile/enhance', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ success: false, error: 'userId is required' });
    }
    // Fetch user info
    const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    const user = userResult.rows[0];
    // Fetch user tracks (played and liked)
    const playedTracksResult = await pool.query(
      `SELECT t.* FROM track_plays p JOIN tracks t ON p.track_id = t.id WHERE p.user_id = $1`,
      [userId]
    );
    const likedTracksResult = await pool.query(
      `SELECT t.* FROM track_likes l JOIN tracks t ON l.track_id = t.id WHERE l.user_id = $1`,
      [userId]
    );
    // Combine and deduplicate tracks
    const trackMap = new Map();
    for (const track of playedTracksResult.rows) trackMap.set(track.id, track);
    for (const track of likedTracksResult.rows) trackMap.set(track.id, track);
    const userTracks = Array.from(trackMap.values());
    // Call AI enhancement
    const enhancementResult = await ollamaAIService.enhanceProfile(user, userTracks);
    res.json(enhancementResult);
  } catch (error) {
    console.error('Profile enhancement error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;