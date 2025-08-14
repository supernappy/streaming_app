// AI image generation for covers using Ollama
const fs = require('fs');
const axios = require('axios');

/**
 * Generate an AI cover image using Ollama's image model (or fallback to placeholder)
 * @param {string} prompt - Description for the cover (e.g. "A vibrant album cover for a song titled ... by ...")
 * @param {string} outputPath - Where to save the generated image
 * @returns {Promise<string>} - Resolves to outputPath
 */
async function generateAICover(prompt, outputPath) {
  try {
    // Example: POST to Ollama's image endpoint (adjust if your Ollama version differs)
    const response = await axios.post('http://localhost:11434/api/generate', {
      model: 'llava:7b-v1.6', // or another image model available in Ollama
      prompt,
      format: 'png',
      options: { size: '512x512' }
    }, { responseType: 'arraybuffer' });

    if (response.status === 200 && response.data) {
      fs.writeFileSync(outputPath, response.data);
      return outputPath;
    }
    throw new Error('No image data returned from Ollama');
  } catch (err) {
    console.warn('AI cover generation failed, using fallback:', err.message);
    // Fallback: copy static placeholder
    const placeholder = require('path').join(__dirname, '../public/default_cover.png');
    fs.copyFileSync(placeholder, outputPath);
    return outputPath;
  }
}

module.exports = { generateAICover };
