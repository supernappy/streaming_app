/**
 * OpenAI GPT-OSS Local AI Service for OpenStream
 * Uses OpenAI's latest open-source GPT-OSS models via Ollama
 */

const { Ollama } = require('ollama');

class OpenAIGPTOSSService {
  constructor() {
    this.ollama = new Ollama({ 
      host: 'http://localhost:11434',
      timeout: 60000 // 1 minute timeout for better performance
    });
  this.enabled = process.env.ENABLE_GPT_OSS !== 'false';
    this.model = 'gpt-oss:20b'; // OpenAI GPT-OSS model (updated!)
    this.fallbackModel = 'llama3.2:3b';
    this.targetModel = 'gpt-oss:20b'; // Target when available
    this.isGPTOSSAvailable = true; // GPT-OSS is now available!
    this.enhanced = true; // Use enhanced prompting to mimic GPT-OSS capabilities
  }

  // Small helper to add a hard timeout around any promise
  withTimeout(promise, ms, label = 'operation') {
    return Promise.race([
      promise,
      new Promise((_, reject) => setTimeout(() => reject(new Error(`${label} timeout after ${ms}ms`)), ms))
    ]);
  }

  /**
   * Initialize and check model availability
   */
  async initialize() {
    try {
      console.log('🔍 Checking OpenAI GPT-OSS model availability...');
      
      // Check if GPT-OSS model is available
      const models = await this.ollama.list();
      const gptOssAvailable = models.models.some(m => m.name.includes('gpt-oss'));
      
      if (gptOssAvailable) {
        this.isGPTOSSAvailable = true;
        this.model = this.targetModel;
        console.log('✅ OpenAI GPT-OSS model is available!');
        await this.testModel();
      } else {
        console.log('📋 OpenAI GPT-OSS not yet available, using enhanced llama3.2:3b');
        console.log('🚀 Enhanced prompting enabled to mimic GPT-OSS capabilities');
        
        // Test current model
        await this.testModel();
      }
    } catch (error) {
      console.log('⚠️ Error checking models, using fallback:', error.message);
      this.model = this.fallbackModel;
    }
  }

  /**
   * Test the model with a simple prompt
   */
  async testModel() {
    try {
      const testPrompt = this.isGPTOSSAvailable 
        ? 'Hello! Can you help with music recommendations?' 
        : 'You are an advanced music AI assistant with deep understanding of musical preferences, genres, and recommendation algorithms. Can you help with music recommendations?';
        
  const response = await this.withTimeout(this.ollama.generate({
        model: this.model,
        prompt: testPrompt,
        options: { temperature: 0.1, num_predict: 30 }
  }), 5000, 'GPT-OSS test');
      
      if (response.response) {
        const engineType = this.isGPTOSSAvailable ? 'GPT-OSS' : 'Enhanced LLaMA';
        console.log(`🎉 ${engineType} model test successful!`);
        return true;
      }
    } catch (error) {
      console.log('⚠️ Model test failed, using basic fallback:', error.message);
      this.enhanced = false;
      return false;
    }
  }

  /**
   * Generate AI-powered music recommendations using GPT-OSS
   */
  async generateRecommendations(userId, userHistory = [], allTracks = []) {
    try {
  if (!this.enabled) return [];
      console.log(`🚀 Generating GPT-OSS AI recommendations for user ${userId}`);
      
      if (!allTracks.length) {
        return [];
      }

      // If no user history, return popular tracks with AI scoring
      if (!userHistory.length) {
        return this.generatePopularRecommendations(allTracks);
      }

      // Use faster fallback for profile creation due to GPT-OSS timeout issues
  const userProfile = await this.createUserProfileWithFallback(userHistory);
      
      // Score tracks using AI analysis with simpler approach
      const recommendations = [];
      
      for (const track of allTracks.slice(0, 15)) { // Reduced for performance
  const analysis = await this.analyzeTrackCompatibilityFast(track, userProfile);
        
        if (analysis.score > 0.3) {
          recommendations.push({
            ...track,
            aiScore: analysis.score,
            aiReason: analysis.reason,
            aiConfidence: analysis.confidence,
            aiTags: analysis.tags
          });
        }
      }

      // Sort by AI score and return top recommendations
      const topRecommendations = recommendations
        .sort((a, b) => b.aiScore - a.aiScore)
        .slice(0, 12);

      console.log(`🎯 GPT-OSS AI found ${topRecommendations.length} recommendations`);
      return topRecommendations;

    } catch (error) {
      console.error('🚨 GPT-OSS AI error:', error);
      return this.getFallbackRecommendations(allTracks);
    }
  }

  /**
   * Create advanced user preference profile using GPT-OSS
   */
  async createUserProfileWithGPTOSS(userHistory) {
    try {
      const musicData = userHistory.slice(0, 8).map(track => ({
        title: track.title,
        artist: track.artist || 'Unknown',
        genre: track.genre || 'Unspecified'
      }));

      const prompt = `Analyze this user's music taste and create a profile:

Recent listening:
${musicData.map(t => `• "${t.title}" by ${t.artist} (${t.genre})`).join('\n')}

Return JSON:
{
  "musicPersonality": "brief description of their taste",
  "preferredGenres": ["top", "genres"],
  "moodProfile": {"primary": "mood", "energy": "level"}
}`;

      const response = await this.ollama.generate({
        model: this.model,
        prompt: prompt,
        format: 'json',
        options: {
          temperature: 0.3,
          num_predict: 150
        }
      });

      try {
        const profile = JSON.parse(response.response);
        console.log('🧠 GPT-OSS generated enhanced profile:', profile.musicPersonality);
        return profile;
      } catch (parseError) {
        console.log('⚠️ Could not parse GPT-OSS response, using fallback profile');
        return this.createFallbackProfile(userHistory);
      }

    } catch (error) {
      console.error('Error creating GPT-OSS user profile:', error);
      return this.createFallbackProfile(userHistory);
    }
  }

  /**
   * Analyze track compatibility using advanced GPT-OSS reasoning
   */
  async analyzeTrackCompatibility(track, userProfile) {
    try {
      const prompt = `As a music recommendation AI, analyze how well this track matches the user's profile:

Track: "${track.title}" by ${track.artist || 'Unknown'}
Genre: ${track.genre || 'Unspecified'}
Duration: ${Math.floor((track.duration || 180) / 60)}:${String((track.duration || 180) % 60).padStart(2, '0')}

User Profile:
- Music Personality: ${userProfile.musicPersonality || 'Diverse listener'}
- Preferred Genres: ${userProfile.preferredGenres?.join(', ') || 'Various'}
- Mood Profile: ${userProfile.moodProfile?.primary || 'Balanced'} (${userProfile.moodProfile?.energy || 'medium'} energy)
- Listening Patterns: ${userProfile.listeningPatterns?.diversity || 'medium'} diversity, ${userProfile.listeningPatterns?.experimental ? 'experimental' : 'mainstream'} preference

Respond with JSON:
{
  "score": 0.75,
  "reason": "Compelling explanation for why this matches their taste",
  "confidence": 0.85,
  "tags": ["musical", "descriptors"],
  "analysis": "Brief musical analysis focusing on compatibility"
}

Score: 0.0-1.0 (how well it matches their profile)
Consider: genre alignment, mood compatibility, energy level, artistic style, and musical characteristics.`;

      const response = await this.ollama.generate({
        model: this.model,
        prompt: prompt,
        format: 'json',
        options: {
          temperature: 0.4,
          num_predict: 150
        }
      });

      try {
        const analysis = JSON.parse(response.response);
        return {
          score: Math.max(0, Math.min(1, analysis.score || 0.5)),
          reason: analysis.reason || 'AI-analyzed compatibility',
          confidence: analysis.confidence || 0.7,
          tags: analysis.tags || ['music'],
          analysis: analysis.analysis || 'Musical compatibility analysis'
        };
      } catch (parseError) {
        return this.getFallbackAnalysis(track, userProfile);
      }

    } catch (error) {
      return this.getFallbackAnalysis(track, userProfile);
    }
  }

  /**
   * Enhanced search using GPT-OSS semantic understanding
   */
  async enhancedSearch(query, tracks = []) {
    try {
      console.log(`🔍 GPT-OSS AI search for: "${query}"`);

      const searchResults = [];

      // Use GPT-OSS to understand search intent
      const searchIntent = await this.analyzeSearchIntent(query);

      for (const track of tracks.slice(0, 40)) {
        const relevance = await this.calculateSearchRelevanceGPTOSS(query, track, searchIntent);
        
        if (relevance.score > 0.3) {
          searchResults.push({
            ...track,
            relevanceScore: relevance.score,
            aiMatchReason: relevance.reason,
            searchConfidence: relevance.confidence
          });
        }
      }

      return searchResults
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .slice(0, 20);

    } catch (error) {
      console.error('GPT-OSS search error:', error);
      return this.getFallbackSearch(query, tracks);
    }
  }

  /**
   * Analyze search intent using GPT-OSS
   */
  async analyzeSearchIntent(query) {
    try {
      const prompt = `Analyze this music search query and extract the intent:

Query: "${query}"

Respond with JSON:
{
  "intent": "specific_song|artist_search|genre_browse|mood_search|discovery",
  "keywords": ["extracted", "key", "terms"],
  "mood": "happy|sad|energetic|chill|romantic|nostalgic|neutral",
  "genre_hints": ["possible", "genres"],
  "semantic_meaning": "what the user is really looking for"
}`;

      const response = await this.ollama.generate({
        model: this.model,
        prompt: prompt,
        format: 'json',
        options: { temperature: 0.2, num_predict: 100 }
      });

      return JSON.parse(response.response);
    } catch (error) {
      return {
        intent: 'general_search',
        keywords: query.toLowerCase().split(' '),
        mood: 'neutral',
        genre_hints: [],
        semantic_meaning: query
      };
    }
  }

  /**
   * Calculate search relevance using GPT-OSS advanced understanding
   */
  async calculateSearchRelevanceGPTOSS(query, track, searchIntent) {
    try {
      const prompt = `Rate how relevant this track is to the search query:

Search: "${query}"
Intent: ${searchIntent.intent}
Expected mood: ${searchIntent.mood}
Keywords: ${searchIntent.keywords?.join(', ')}

Track: "${track.title}" by ${track.artist || 'Unknown'}"
Genre: ${track.genre || 'Unspecified'}

Consider: exact matches, semantic similarity, mood alignment, and musical style.

Respond with JSON:
{
  "score": 0.85,
  "reason": "Why this track matches the search",
  "confidence": 0.9
}`;

      const response = await this.ollama.generate({
        model: this.model,
        prompt: prompt,
        format: 'json',
        options: { temperature: 0.1, num_predict: 80 }
      });

      const analysis = JSON.parse(response.response);
      return {
        score: Math.max(0, Math.min(1, analysis.score || 0.5)),
        reason: analysis.reason || `Matches "${query}"`,
        confidence: analysis.confidence || 0.7
      };

    } catch (error) {
      return this.getSimpleRelevance(query, track);
    }
  }

  /**
   * Generate AI-powered smart playlist using GPT-OSS
   */
  async generateSmartPlaylist(theme, tracks = [], options = {}) {
    try {
      const { duration = 60, mood = 'balanced' } = options;
      
      console.log(`🎵 Generating GPT-OSS AI playlist: theme="${theme}", mood="${mood}"`);

      if (!tracks.length) {
        console.log('⚠️ No tracks available for playlist generation');
        return this.getFallbackPlaylist(theme, [], options);
      }

      // Use timeout for AI generation to prevent hanging
      try {
        const result = await Promise.race([
          this.generatePlaylistWithAI(theme, tracks, options),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('AI timeout')), 30000)
          )
        ]);
        return result;
      } catch (timeoutError) {
        console.log('⚡ AI playlist generation timed out, using fast fallback');
        return this.getFallbackPlaylist(theme, tracks, options);
      }

    } catch (error) {
      console.error('GPT-OSS playlist error:', error);
      return this.getFallbackPlaylist(theme, tracks, options);
    }
  }

  /**
   * Generate playlist using AI with proper error handling
   */
  async generatePlaylistWithAI(theme, tracks, options) {
    const { mood = 'balanced' } = options;
    
    // Use shorter prompt for better performance
    const prompt = `Create a "${theme}" playlist (${mood} mood).

Tracks:
${tracks.slice(0, 15).map((t, i) => `${i}: "${t.title}" by ${t.artist || 'Unknown'}`).join('\n')}

JSON response:
{
  "name": "Playlist name",
  "description": "Brief description", 
  "selectedTracks": [1,3,7,9,12]
}`;

    const response = await this.ollama.generate({
      model: this.model,
      prompt: prompt,
      format: 'json',
      options: {
        temperature: 0.4,
        num_predict: 150
      }
    });

    try {
      const playlistData = JSON.parse(response.response);
      const selectedTracks = playlistData.selectedTracks
        ?.map(index => tracks[index])
        .filter(Boolean) || tracks.slice(0, 8);

      return {
        name: playlistData.name || `${theme} Collection`,
        description: playlistData.description || `AI-curated ${theme} playlist`,
        tracks: selectedTracks,
        features: {
          aiGenerated: true,
          aiEngine: 'OpenAI GPT-OSS',
          theme,
          mood
        }
      };
    } catch (parseError) {
      console.log('⚠️ Could not parse AI response, using fallback');
      return this.getFallbackPlaylist(theme, tracks, options);
    }
  }

  /**
   * Advanced track analysis using GPT-OSS
   */
  async autoTagTrack(trackInfo) {
    try {
      const prompt = `As a music expert, analyze this track and provide comprehensive metadata:

Track: "${trackInfo.title}" by ${trackInfo.artist || 'Unknown'}"
Genre: ${trackInfo.genre || 'Unspecified'}
Duration: ${Math.floor((trackInfo.duration || 180) / 60)}:${String((trackInfo.duration || 180) % 60).padStart(2, '0')}

Provide detailed analysis in JSON:
{
  "aiTags": ["genre", "style", "mood", "descriptors"],
  "musicAnalysis": {
    "mood": "primary mood",
    "energy": "low/medium/high",
    "tempo": "slow/moderate/fast",
    "style": "musical style description",
    "instruments": ["prominent", "instruments"],
    "vocals": "vocal style description"
  },
  "recommendations": {
    "similarArtists": ["artist1", "artist2"],
    "complementaryGenres": ["genre1", "genre2"],
    "playlistFit": ["playlist", "types"]
  },
  "culturalContext": "musical and cultural significance",
  "listeningSuggestions": "when and how to enjoy this track"
}`;

      const response = await this.ollama.generate({
        model: this.model,
        prompt: prompt,
        format: 'json',
        options: {
          temperature: 0.4,
          num_predict: 400
        }
      });

      try {
        const analysis = JSON.parse(response.response);
        return {
          ...trackInfo,
          aiTags: analysis.aiTags || [],
          enhancedMetadata: {
            musicAnalysis: analysis.musicAnalysis || {},
            recommendations: analysis.recommendations || {},
            culturalContext: analysis.culturalContext,
            listeningSuggestions: analysis.listeningSuggestions,
            aiEngine: 'OpenAI GPT-OSS'
          }
        };
      } catch (parseError) {
        return this.getFallbackAnalysis(trackInfo);
      }

    } catch (error) {
      console.error('GPT-OSS track analysis error:', error);
      return this.getFallbackAnalysis(trackInfo);
    }
  }

  /**
   * Enhanced profile analysis using GPT-OSS
   */
  async enhanceProfile(user, userTracks) {
    try {
      if (!this.enabled) {
        return this.getFallbackProfileEnhancement(user, userTracks);
      }
      console.log(`🧠 Enhancing profile for user ${user.username} with GPT-OSS`);

      const prompt = `Analyze this user's music collection and provide deep insights:

User: ${user.username}
Collection: ${userTracks.length} tracks

Sample tracks:
${userTracks.slice(0, 15).map(t => `• "${t.title}" by ${t.artist || 'Unknown'} (${t.genre || 'Unspecified'})`).join('\n')}

Provide comprehensive analysis in JSON:
{
  "musicPersonality": "Deep analysis of their musical identity and preferences",
  "listeningProfile": {
    "diversity": "assessment of genre diversity",
    "adventurousness": "willingness to explore new music",
    "loyalty": "tendency to replay favorites",
    "discovery": "approach to finding new music"
  },
  "musicalJourney": "Evolution and growth in their taste",
  "recommendations": {
    "genresToExplore": ["suggested", "genres"],
    "artistDiscovery": ["recommended", "artists"],
    "playlistIdeas": ["curated", "playlist", "themes"],
    "listeningExperience": "how to enhance their experience"
  },
  "insights": ["key", "musical", "insights"],
  "socialProfile": "how their taste might connect with others"
}`;

  const response = await this.withTimeout(this.ollama.generate({
        model: this.model,
        prompt: prompt,
        format: 'json',
        options: {
          temperature: 0.4,
          num_predict: 500
        }
  }), 12000, 'GPT-OSS enhanceProfile');

      try {
        const enhancement = JSON.parse(response.response);
        return {
          success: true,
          enhancement: {
            musicPersonality: enhancement.musicPersonality,
            listeningProfile: enhancement.listeningProfile || {},
            musicalJourney: enhancement.musicalJourney,
            recommendations: enhancement.recommendations || {},
            insights: enhancement.insights || [],
            socialProfile: enhancement.socialProfile,
            analysisDepth: 'comprehensive'
          },
          aiEngine: 'OpenAI GPT-OSS',
          modelUsed: this.model,
          analysisDate: new Date().toISOString()
        };
      } catch (parseError) {
        return this.getFallbackProfileEnhancement(user, userTracks);
      }

    } catch (error) {
      console.error('GPT-OSS profile enhancement error:', error);
      return this.getFallbackProfileEnhancement(user, userTracks);
    }
  }

  // === FALLBACK METHODS ===

  /**
   * Create user profile with fallback to faster method
   */
  async createUserProfileWithFallback(userHistory) {
    try {
      // Try GPT-OSS first with shorter timeout
      const result = await Promise.race([
        this.createUserProfileWithGPTOSS(userHistory),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 15000))
      ]);
      return result;
    } catch (error) {
      console.log('⚡ Using fast fallback profile creation');
      return this.createFallbackProfile(userHistory);
    }
  }

  /**
   * Fast track compatibility analysis
   */
  async analyzeTrackCompatibilityFast(track, userProfile) {
    try {
      // Try AI analysis with very short timeout
      const result = await Promise.race([
        this.analyzeTrackCompatibility(track, userProfile),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 8000))
      ]);
      return result;
    } catch (error) {
      return this.getFallbackAnalysis(track, userProfile);
    }
  }

  createFallbackProfile(userHistory) {
    const artists = [...new Set(userHistory.map(t => t.artist).filter(Boolean))];
    const genres = [...new Set(userHistory.map(t => t.genre).filter(Boolean))];
    
    return {
      musicPersonality: `Enjoys ${genres.length > 0 ? genres[0] : 'diverse'} music with ${artists.length > 0 ? 'favorite artists like ' + artists[0] : 'varied artists'}`,
      preferredGenres: genres.slice(0, 3),
      artistPreferences: artists.slice(0, 3),
      moodProfile: {
        primary: 'balanced',
        secondary: 'varied',
        energy: 'medium'
      },
      recommendationKeywords: [...genres, ...artists].slice(0, 5),
      confidenceScore: 0.6
    };
  }

  getFallbackAnalysis(track, userProfile) {
    let score = 0.3;
    let reason = 'AI-suggested track';
    
    if (userProfile && track.genre && userProfile.preferredGenres?.includes(track.genre)) {
      score += 0.3;
      reason = `Matches your ${track.genre} preference`;
    }
    if (userProfile && track.artist && userProfile.artistPreferences?.includes(track.artist)) {
      score += 0.2;
      reason = `From favorite artist: ${track.artist}`;
    }
    
    return {
      score: Math.min(score + Math.random() * 0.2, 1.0),
      reason,
      confidence: 0.6,
      tags: ['music', 'recommended'],
      analysis: 'Compatible with your taste'
    };
  }

  getSimpleRelevance(query, track) {
    const queryLower = query.toLowerCase();
    let score = 0;
    
    if (track.title?.toLowerCase().includes(queryLower)) score += 0.6;
    if (track.artist?.toLowerCase().includes(queryLower)) score += 0.5;
    if (track.genre?.toLowerCase().includes(queryLower)) score += 0.3;
    
    return {
      score: Math.min(score, 1.0),
      reason: `Matches "${query}"`,
      confidence: 0.7
    };
  }

  generatePopularRecommendations(allTracks) {
    return allTracks
      .map(track => ({
        ...track,
        aiScore: 0.5 + Math.random() * 0.3,
        aiReason: 'Popular discovery',
        aiConfidence: 0.7,
        aiTags: ['popular', 'discovery']
      }))
      .sort((a, b) => b.aiScore - a.aiScore)
      .slice(0, 12);
  }

  getFallbackRecommendations(allTracks) {
    return allTracks
      .map(track => ({
        ...track,
        aiScore: 0.4 + Math.random() * 0.3,
        aiReason: 'AI recommendation',
        aiConfidence: 0.6,
        aiTags: ['music']
      }))
      .sort((a, b) => b.aiScore - a.aiScore)
      .slice(0, 10);
  }

  getFallbackSearch(query, tracks) {
    const queryLower = query.toLowerCase();
    return tracks
      .filter(track => 
        track.title?.toLowerCase().includes(queryLower) ||
        track.artist?.toLowerCase().includes(queryLower) ||
        track.genre?.toLowerCase().includes(queryLower)
      )
      .map(track => ({
        ...track,
        relevanceScore: this.getSimpleRelevance(query, track).score,
        aiMatchReason: `Matches "${query}"`,
        searchConfidence: 0.7
      }))
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 20);
  }

  getFallbackPlaylist(theme, tracks, options) {
    // Ensure we have some tracks to work with
    const availableTracks = tracks && tracks.length > 0 ? tracks : [];
    
    // Select random tracks if we have them, otherwise create minimal structure
    const selectedTracks = availableTracks.length > 0 
      ? availableTracks.slice(0, Math.min(8, availableTracks.length))
      : [];

    return {
      name: `${theme} Mix`,
      description: `AI-curated playlist featuring ${theme} vibes`,
      tracks: selectedTracks,
      features: {
        aiGenerated: true,
        aiEngine: 'OpenAI GPT-OSS (Fallback)',
        theme,
        mood: options.mood || 'balanced',
        fallback: true
      }
    };
  }

  getFallbackAnalysis(trackInfo) {
    return {
      ...trackInfo,
      aiTags: ['music', 'audio', 'track'],
      enhancedMetadata: {
        musicAnalysis: {
          mood: 'neutral',
          energy: 'medium',
          style: 'musical piece'
        },
        recommendations: {},
        aiEngine: 'OpenAI GPT-OSS (Fallback)'
      }
    };
  }

  getFallbackProfileEnhancement(user, userTracks) {
    const genres = [...new Set(userTracks.map(t => t.genre).filter(Boolean))];
    const artists = [...new Set(userTracks.map(t => t.artist).filter(Boolean))];
    
    return {
      success: true,
      enhancement: {
        musicPersonality: `${user.username} has a ${genres.length > 0 ? genres[0] : 'diverse'} music collection`,
        listeningProfile: {
          diversity: genres.length > 5 ? 'high' : genres.length > 2 ? 'medium' : 'low',
          adventurousness: 'moderate',
          discovery: 'active'
        },
        recommendations: {
          genresToExplore: genres.slice(0, 3),
          artistDiscovery: artists.slice(0, 3)
        },
        insights: ['Consistent music taste', 'Open to discovery'],
        analysisDepth: 'basic'
      },
      aiEngine: 'OpenAI GPT-OSS (Fallback)',
      modelUsed: this.model,
      analysisDate: new Date().toISOString()
    };
  }
}

// Initialize and export the service
const service = new OpenAIGPTOSSService();

// Initialize on first import
service.initialize().catch(console.error);

module.exports = service;
