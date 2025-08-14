// AI Lyrics generation using Ollama
const ollamaAIService = require('./ollamaAIService');

/**
 * Generate lyrics for a track using Ollama LLM
 * @param {string} title
 * @param {string} artist
 * @param {string} genre
 * @returns {Promise<string>} Lyrics text
 */
async function generateLyrics(title, artist, genre) {
  const prompt = `Write original song lyrics for a track titled "${title}"${artist ? ` by ${artist}` : ''}${genre ? ` in the ${genre} genre` : ''}. Make the lyrics creative, engaging, and suitable for a modern streaming audience.\n\nFormat the lyrics in LRC format with timestamps for each line, starting at [00:10.00] and incrementing by about 5 seconds per line. Example:\n[00:10.00] First line\n[00:15.00] Second line\n...\nReturn only the LRC lyrics.`;
  try {
    const response = await ollamaAIService.ollama.generate({
      model: ollamaAIService.model,
      prompt,
      options: { temperature: 0.7, num_predict: 400 }
    });
    return response.response.trim();
  } catch (error) {
    console.error('AI lyrics generation error:', error);
    return '';
  }
}

module.exports = { generateLyrics };
