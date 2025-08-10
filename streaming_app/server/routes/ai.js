const express = require('express');
const router = express.Router();
const OllamaAIService = require('../services/OllamaAIService');

const aiService = new OllamaAIService();

// AI moderation endpoint
router.post('/moderate', async (req, res) => {
    try {
        const { message } = req.body;
        
        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        const result = await aiService.moderateMessage(message);
        res.json(result);
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

        const response = await aiService.getChatResponse(message, context || []);
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

        const analysis = await aiService.analyzeTrack(trackData);
        res.json(analysis);
    } catch (error) {
        console.error('Track analysis error:', error);
        res.status(500).json({ error: 'Track analysis failed' });
    }
});

module.exports = router;