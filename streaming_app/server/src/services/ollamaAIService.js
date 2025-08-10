// (Removed duplicate require and class definition. The file should start with the require, then the single class definition below.)
/**
 * Ollama-based AI Service for OpenStream
 * Provides real AI capabilities using local Ollama models
 */

const { Ollama } = require('ollama');

class OllamaAIService {
  /**
   * Moderate content using Ollama Llama3 model
   * Returns { isToxic, confidence, categories }
   */
  async moderateContent(content, type = 'text') {
    try {
      if (type !== 'text') {
        return { isToxic: false, confidence: 0, categories: [] };
      }
      const prompt = `Classify the following message as either TOXIC or NOT_TOXIC. Respond with only the label and a confidence score from 0 to 1.\n\nMessage: ${content}\n\nResponse format: {\"label\":\"TOXIC|NOT_TOXIC\",\"score\":number}`;
      const response = await this.ollama.generate({
        model: this.model,
        prompt: prompt,
        format: 'json',
        options: {
          temperature: 0.0,
          num_predict: 60
        }
      });
      let result;
      try {
        result = JSON.parse(response.response);
      } catch (e) {
        return { isToxic: false, confidence: 0, categories: [], error: 'Invalid AI response', raw: response.response };
      }
      return {
        isToxic: result.label === 'TOXIC',
        confidence: result.score || 0,
        categories: [{ label: result.label, score: result.score }],
        raw: response.response
      };
    } catch (error) {
      console.error('Ollama moderation error:', error);
      return { isToxic: false, confidence: 0, categories: [], error: error.message, stack: error.stack };
    }
  }

  /**
   * Summarize chat or text using Ollama Llama3 model
   */
  async summarizeText(text) {
    try {
      const prompt = `Summarize the following chat transcript in 2-4 sentences, focusing on the main topics and any decisions or key points.\n\nChat Transcript:\n${text}\n\nSummary:`;
      const response = await this.ollama.generate({
        model: this.model,
        prompt: prompt,
        options: {
          temperature: 0.3,
          num_predict: 200
        }
      });
      if (!response || !response.response) {
        console.error('Ollama summarization: No response or missing response field', response);
        return { error: 'AI summarization failed: No response', raw: response };
      }
      return { summary: response.response.trim(), raw: response };
    } catch (error) {
      console.error('Ollama summarization error:', error);
      if (error && error.stack) {
        console.error('Ollama summarization error stack:', error.stack);
      }
      return { error: error.message, stack: error.stack };
    }
  }
  constructor() {
    this.ollama = new Ollama({ host: 'http://localhost:11434' });
    this.model = 'llama3.2:3b'; // Good balance of speed and capability
    this.embeddingModel = 'llama3.2:1b'; // Faster model for embeddings
  }

  /**
   * Generate AI-powered music recommendations
   */
  async generateRecommendations(userId, userHistory = [], allTracks = []) {
    try {
      console.log(`🦙 Generating Ollama AI recommendations for user ${userId}`);
      
      if (!allTracks.length) {
        return [];
      }

      // If no user history, return popular tracks with AI scoring
      if (!userHistory.length) {
        return this.generatePopularRecommendations(allTracks);
      }

      // Create user profile using Ollama
      const userProfile = await this.createUserProfileWithOllama(userHistory);
      
      // Score tracks using AI
      const recommendations = [];
      
      for (const track of allTracks) {
        const similarity = await this.calculateTrackSimilarity(track, userProfile);
        
        if (similarity > 0.3) {
          const reason = await this.generateRecommendationReason(track, userProfile);
          recommendations.push({
            ...track,
            aiScore: similarity,
            aiReason: reason
          });
        }
      }

      // Sort by AI score and return top recommendations
      const topRecommendations = recommendations
        .sort((a, b) => b.aiScore - a.aiScore)
        .slice(0, 15);

      console.log(`🎯 Ollama AI found ${topRecommendations.length} recommendations`);
      return topRecommendations;

    } catch (error) {
      console.error('🚨 Ollama AI error:', error);
      return this.getFallbackRecommendations(allTracks);
    }
  }

  /**
   * Create user preference profile using Ollama AI
   */
  async createUserProfileWithOllama(userHistory) {
    try {
      // Prepare user's music data for analysis
      const userMusicData = userHistory.map(track => ({
        title: track.title,
        artist: track.artist || 'Unknown',
        genre: track.genre || 'Unspecified',
        duration: track.duration
      }));

      // Create a prompt for Ollama to analyze user preferences
      const prompt = `Analyze this user's music listening history and create a preference profile:

Music History:
${userMusicData.map(track => `- "${track.title}" by ${track.artist} (Genre: ${track.genre})`).join('\n')}

Please provide a JSON response with the user's music preferences in this format:
{
  "preferredGenres": ["genre1", "genre2"],
  "preferredArtists": ["artist1", "artist2"],
  "musicStyle": "description of their style",
  "moodPreference": "upbeat/chill/mixed",
  "keywords": ["keyword1", "keyword2", "keyword3"]
}

Response:`;

      const response = await this.ollama.generate({
        model: this.model,
        prompt: prompt,
        format: 'json',
        options: {
          temperature: 0.3, // Lower temperature for more consistent results
          num_predict: 200
        }
      });

      try {
        const profile = JSON.parse(response.response);
        console.log('🧠 Ollama generated user profile:', profile);
        return profile;
      } catch (parseError) {
        console.log('⚠️ Could not parse Ollama response, using fallback profile');
        return this.createFallbackProfile(userHistory);
      }

    } catch (error) {
      console.error('Error creating Ollama user profile:', error);
      return this.createFallbackProfile(userHistory);
    }
  }

  /**
   * Calculate similarity between a track and user profile using AI
   */
  async calculateTrackSimilarity(track, userProfile) {
    try {
      const prompt = `Compare this track with the user's music preferences and rate similarity from 0.0 to 1.0:

Track: "${track.title}" by ${track.artist || 'Unknown'} (Genre: ${track.genre || 'Unspecified'})

User Preferences:
- Preferred Genres: ${userProfile.preferredGenres?.join(', ') || 'None specified'}
- Preferred Artists: ${userProfile.preferredArtists?.join(', ') || 'None specified'}
- Music Style: ${userProfile.musicStyle || 'Not specified'}
- Mood Preference: ${userProfile.moodPreference || 'Mixed'}

Respond with only a decimal number between 0.0 and 1.0 representing similarity:`;

      const response = await this.ollama.generate({
        model: this.embeddingModel, // Use faster model for similarity
        prompt: prompt,
        options: {
          temperature: 0.2,
          num_predict: 10
        }
      });

      const similarity = parseFloat(response.response.trim());
      return isNaN(similarity) ? 0.1 + Math.random() * 0.3 : Math.max(0, Math.min(1, similarity));

    } catch (error) {
      // Fallback to simple similarity calculation
      return this.calculateSimpleSimilarity(track, userProfile);
    }
  }

  /**
   * Generate AI explanation for why a track is recommended
   */
  async generateRecommendationReason(track, userProfile) {
    try {
      const prompt = `Explain in 1-2 short sentences why this track matches the user's preferences:

Track: "${track.title}" by ${track.artist || 'Unknown'} (Genre: ${track.genre || 'Unspecified'})
User Style: ${userProfile.musicStyle || 'Various'}
User Mood: ${userProfile.moodPreference || 'Mixed'}

Keep the explanation brief and engaging:`;

      const response = await this.ollama.generate({
        model: this.embeddingModel,
        prompt: prompt,
        options: {
          temperature: 0.4,
          num_predict: 50
        }
      });

      return response.response.trim() || 'Matches your musical taste';

    } catch (error) {
      return this.getSimpleReason(track, userProfile);
    }
  }

  /**
   * Enhanced search using Ollama AI
   */
  async enhancedSearch(query, tracks = []) {
    try {
      console.log(`🔍 Ollama AI search for: "${query}"`);

      const searchResults = [];

      for (const track of tracks.slice(0, 50)) { // Limit for performance
        const relevanceScore = await this.calculateSearchRelevance(query, track);
        
        if (relevanceScore > 0.3) {
          searchResults.push({
            ...track,
            relevanceScore,
            aiMatchReason: await this.generateSearchReason(query, track)
          });
        }
      }

      return searchResults
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .slice(0, 20);

    } catch (error) {
      console.error('Ollama search error:', error);
      return this.getFallbackSearch(query, tracks);
    }
  }

  /**
   * Calculate search relevance using Ollama
   */
  async calculateSearchRelevance(query, track) {
    try {
      const prompt = `Rate how relevant this track is to the search query from 0.0 to 1.0:

Search Query: "${query}"
Track: "${track.title}" by ${track.artist || 'Unknown'} (Genre: ${track.genre || 'Unspecified'})

Consider: title match, artist match, genre match, and semantic meaning.
Respond with only a decimal number:`;

      const response = await this.ollama.generate({
        model: this.embeddingModel,
        prompt: prompt,
        options: {
          temperature: 0.1,
          num_predict: 10
        }
      });

      const relevance = parseFloat(response.response.trim());
      return isNaN(relevance) ? 0 : Math.max(0, Math.min(1, relevance));

    } catch (error) {
      return this.getSimpleRelevance(query, track);
    }
  }

  /**
   * Generate AI-powered smart playlist
   */
  async generateSmartPlaylist(theme, tracks = [], options = {}) {
    try {
      const { duration = 60, mood = 'balanced' } = options;
      
      console.log(`🎵 Generating Ollama AI playlist: theme="${theme}", mood="${mood}"`);

      const prompt = `Create a music playlist for the theme "${theme}" with mood "${mood}".
      
Available tracks:
${tracks.slice(0, 20).map(t => `- "${t.title}" by ${t.artist || 'Unknown'} (${t.genre || 'Unspecified'})`).join('\n')}

Select 8-12 tracks that best fit the theme and mood. Respond with JSON:
{
  "name": "playlist name",
  "description": "brief description",
  "selectedTracks": [track_indices],
  "reasoning": "why these tracks work together"
}`;

      const response = await this.ollama.generate({
        model: this.model,
        prompt: prompt,
        format: 'json',
        options: {
          temperature: 0.5,
          num_predict: 300
        }
      });

      try {
        const playlistData = JSON.parse(response.response);
        const selectedTracks = playlistData.selectedTracks
          ?.map(index => tracks[index])
          .filter(Boolean) || tracks.slice(0, 10);

        return {
          name: playlistData.name || `${theme} Mix`,
          description: playlistData.description || `AI-curated ${theme} playlist`,
          tracks: selectedTracks,
          features: {
            aiGenerated: true,
            theme,
            mood,
            reasoning: playlistData.reasoning
          }
        };
      } catch (parseError) {
        return this.getFallbackPlaylist(theme, tracks, options);
      }

    } catch (error) {
      console.error('Ollama playlist error:', error);
      return this.getFallbackPlaylist(theme, tracks, options);
    }
  }

  /**
   * Auto-tag tracks using Ollama AI
   */
  async autoTagTrack(trackInfo) {
    try {
      const prompt = `Analyze this music track and suggest appropriate tags and metadata:

Track: "${trackInfo.title}" by ${trackInfo.artist || 'Unknown'}
Genre: ${trackInfo.genre || 'Unspecified'}
Duration: ${trackInfo.duration || 'Unknown'}

Provide JSON response with:
{
  "aiTags": ["tag1", "tag2", "tag3"],
  "moodTags": ["mood1", "mood2"],
  "suggestedGenre": "genre",
  "energy": "low/medium/high",
  "description": "brief description"
}`;

      const response = await this.ollama.generate({
        model: this.model,
        prompt: prompt,
        format: 'json',
        options: {
          temperature: 0.4,
          num_predict: 200
        }
      });

      try {
        const analysis = JSON.parse(response.response);
        return {
          ...trackInfo,
          aiTags: analysis.aiTags || [],
          enhancedMetadata: {
            moodTags: analysis.moodTags || [],
            suggestedGenre: analysis.suggestedGenre,
            energy: analysis.energy,
            description: analysis.description,
            recommendations: []
          }
        };
      } catch (parseError) {
        return this.getFallbackAnalysis(trackInfo);
      }

    } catch (error) {
      console.error('Ollama track analysis error:', error);
      return this.getFallbackAnalysis(trackInfo);
    }
  }

  /**
   * Enhance user profile with AI suggestions
   */
  async enhanceProfile(user, userTracks) {
    try {
      console.log(`🧠 Enhancing profile for user ${user.username}`);

      const prompt = `Analyze this user's music collection and suggest profile enhancements:

User: ${user.username}
Total Tracks: ${userTracks.length}

Sample Tracks:
${userTracks.slice(0, 10).map(t => `- "${t.title}" by ${t.artist || 'Unknown'} (${t.genre || 'Unspecified'})`).join('\n')}

Provide JSON response with:
{
  "musicPersonality": "description of their music taste",
  "suggestedGenres": ["genre1", "genre2"],
  "profileTags": ["tag1", "tag2", "tag3"],
  "recommendations": ["suggestion1", "suggestion2"],
  "musicStats": {
    "primaryGenre": "genre",
    "diversityScore": "low/medium/high",
    "collectionSize": "size description"
  }
}`;

      const response = await this.ollama.generate({
        model: this.model,
        prompt: prompt,
        format: 'json',
        options: {
          temperature: 0.4,
          num_predict: 250
        }
      });

      try {
        const enhancement = JSON.parse(response.response);
        return {
          success: true,
          enhancement: {
            musicPersonality: enhancement.musicPersonality || 'Music enthusiast',
            suggestedGenres: enhancement.suggestedGenres || [],
            profileTags: enhancement.profileTags || [],
            recommendations: enhancement.recommendations || [],
            musicStats: enhancement.musicStats || {
              primaryGenre: 'Various',
              diversityScore: 'medium',
              collectionSize: `${userTracks.length} tracks`
            }
          },
          aiEngine: 'Ollama Local AI',
          analysisDate: new Date().toISOString()
        };
      } catch (parseError) {
        return this.getFallbackProfileEnhancement(user, userTracks);
      }

    } catch (error) {
      console.error('Ollama profile enhancement error:', error);
      return this.getFallbackProfileEnhancement(user, userTracks);
    }
  }

  // === FALLBACK METHODS ===

  createFallbackProfile(userHistory) {
    const artists = [...new Set(userHistory.map(t => t.artist).filter(Boolean))];
    const genres = [...new Set(userHistory.map(t => t.genre).filter(Boolean))];
    
    return {
      preferredGenres: genres.slice(0, 3),
      preferredArtists: artists.slice(0, 3),
      musicStyle: genres.length > 0 ? `Enjoys ${genres[0]} music` : 'Diverse taste',
      moodPreference: 'mixed',
      keywords: [...genres, ...artists].slice(0, 5)
    };
  }

  calculateSimpleSimilarity(track, userProfile) {
    let score = 0.1; // Base score
    
    if (track.genre && userProfile.preferredGenres?.includes(track.genre)) {
      score += 0.4;
    }
    if (track.artist && userProfile.preferredArtists?.includes(track.artist)) {
      score += 0.3;
    }
    
    return Math.min(score + Math.random() * 0.2, 1.0);
  }

  getSimpleReason(track, userProfile) {
    if (track.genre && userProfile.preferredGenres?.includes(track.genre)) {
      return `Similar genre: ${track.genre}`;
    }
    if (track.artist && userProfile.preferredArtists?.includes(track.artist)) {
      return `Favorite artist: ${track.artist}`;
    }
    return 'Discovered for you';
  }

  generatePopularRecommendations(allTracks) {
    return allTracks
      .map(track => ({
        ...track,
        aiScore: 0.5 + Math.random() * 0.3,
        aiReason: 'Popular track discovery'
      }))
      .sort((a, b) => b.aiScore - a.aiScore)
      .slice(0, 15);
  }

  getFallbackRecommendations(allTracks) {
    return allTracks
      .map(track => ({
        ...track,
        aiScore: 0.3 + Math.random() * 0.4,
        aiReason: 'AI recommendation'
      }))
      .sort((a, b) => b.aiScore - a.aiScore)
      .slice(0, 10);
  }

  getSimpleRelevance(query, track) {
    const queryLower = query.toLowerCase();
    let score = 0;
    
    if (track.title?.toLowerCase().includes(queryLower)) score += 0.6;
    if (track.artist?.toLowerCase().includes(queryLower)) score += 0.5;
    if (track.genre?.toLowerCase().includes(queryLower)) score += 0.3;
    
    return Math.min(score, 1.0);
  }

  async generateSearchReason(query, track) {
    if (track.title?.toLowerCase().includes(query.toLowerCase())) {
      return `Title matches "${query}"`;
    }
    if (track.artist?.toLowerCase().includes(query.toLowerCase())) {
      return `Artist matches "${query}"`;
    }
    return `Related to "${query}"`;
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
        relevanceScore: this.getSimpleRelevance(query, track),
        aiMatchReason: `Matches "${query}"`
      }))
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 20);
  }

  getFallbackPlaylist(theme, tracks, options) {
    return {
      name: `${theme} Mix`,
      description: `AI-curated playlist for ${theme}`,
      tracks: tracks.slice(0, 10),
      features: {
        aiGenerated: true,
        theme,
        mood: options.mood || 'balanced'
      }
    };
  }

  getFallbackAnalysis(trackInfo) {
    return {
      ...trackInfo,
      aiTags: ['music', 'audio'],
      enhancedMetadata: {
        moodTags: ['neutral'],
        energy: 'medium',
        description: 'AI-analyzed track',
        recommendations: []
      }
    };
  }

  getFallbackProfileEnhancement(user, userTracks) {
    const genres = [...new Set(userTracks.map(t => t.genre).filter(Boolean))];
    const artists = [...new Set(userTracks.map(t => t.artist).filter(Boolean))];
    
    return {
      success: true,
      enhancement: {
        musicPersonality: `${user.username} enjoys ${genres.length > 0 ? genres[0] : 'various'} music`,
        suggestedGenres: genres.slice(0, 3),
        profileTags: ['music-lover', 'diverse-taste'],
        recommendations: [
          'Explore new genres based on your collection',
          'Create playlists to organize your music',
          'Discover similar artists'
        ],
        musicStats: {
          primaryGenre: genres[0] || 'Various',
          diversityScore: genres.length > 5 ? 'high' : genres.length > 2 ? 'medium' : 'low',
          collectionSize: `${userTracks.length} tracks`
        }
      },
      aiEngine: 'Ollama Local AI (Fallback)',
      analysisDate: new Date().toISOString()
    };
  }

  /**
   * Generate AI response for chat
   */
  async generateResponse(message, context = []) {
    try {
      const systemPrompt = "You are AURION, an AI assistant for a music streaming platform. Help users with music recommendations, playlist creation, and general music-related questions. Keep responses concise and friendly.";
      
      const prompt = `${systemPrompt}\n\nUser: ${message}\n\nAssistant:`;
      
      const response = await this.ollama.generate({
        model: this.model,
        prompt: prompt,
        options: {
          temperature: 0.7,
          num_predict: 200
        }
      });
      
      return response.response;
    } catch (error) {
      console.error('Ollama chat error:', error);
      return 'Sorry, I\'m having trouble processing your request right now.';
    }
  }

  /**
   * Analyze track with AI
   */
  async analyzeTrack(trackData) {
    try {
      const prompt = `Analyze this music track and provide insights:\n\nTitle: ${trackData.title}\nArtist: ${trackData.artist}\nGenre: ${trackData.genre || 'Unknown'}\nDuration: ${trackData.duration || 'Unknown'}\n\nProvide a brief analysis including:\n1. Musical style and characteristics\n2. Mood and energy level\n3. Recommended listening context\n4. Similar artists or tracks\n\nKeep the response concise and engaging.`;

      const response = await this.ollama.generate({
        model: this.model,
        prompt: prompt,
        options: {
          temperature: 0.6,
          num_predict: 300
        }
      });

      return {
        analysis: response.response,
        insights: {
          mood: this.extractMood(response.response),
          energy: this.extractEnergy(response.response),
          genre: trackData.genre || 'Unknown'
        }
      };
    } catch (error) {
      console.error('Track analysis error:', error);
      throw new Error('Failed to analyze track');
    }
  }

  extractMood(analysis) {
    const moodKeywords = {
      'happy': ['upbeat', 'cheerful', 'joyful', 'energetic'],
      'sad': ['melancholy', 'somber', 'emotional', 'reflective'],
      'calm': ['peaceful', 'relaxing', 'soothing', 'ambient'],
      'intense': ['powerful', 'dramatic', 'aggressive', 'driving']
    };

    for (const [mood, keywords] of Object.entries(moodKeywords)) {
      if (keywords.some(keyword => analysis.toLowerCase().includes(keyword))) {
        return mood;
      }
    }
    return 'neutral';
  }

  extractEnergy(analysis) {
    const energyKeywords = {
      'high': ['energetic', 'upbeat', 'driving', 'powerful', 'intense'],
      'medium': ['moderate', 'balanced', 'steady'],
      'low': ['calm', 'peaceful', 'slow', 'ambient', 'relaxing']
    };

    for (const [energy, keywords] of Object.entries(energyKeywords)) {
      if (keywords.some(keyword => analysis.toLowerCase().includes(keyword))) {
        return energy;
      }
    }
    return 'medium';
  }
}

module.exports = new OllamaAIService();
