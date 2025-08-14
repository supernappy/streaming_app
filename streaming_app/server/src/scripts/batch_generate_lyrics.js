// Batch-generate lyrics for all tracks missing lyrics using Ollama AI
const { pool } = require('../utils/database');
const { generateLyrics } = require('../services/aiLyricsService');

async function batchGenerateLyrics() {
  try {
  const { rows: tracks } = await pool.query("SELECT * FROM tracks WHERE lyrics IS NULL OR lyrics = ''");
    console.log(`Found ${tracks.length} tracks without lyrics.`);
    for (const track of tracks) {
      console.log(`Generating lyrics for: ${track.title} by ${track.artist} (ID: ${track.id})`);
      try {
        const lyrics = await generateLyrics(track.title, track.artist, track.genre);
        if (lyrics && lyrics.trim()) {
          await pool.query('UPDATE tracks SET lyrics = $1, updated_at = NOW() WHERE id = $2', [lyrics, track.id]);
          console.log(`Lyrics updated for track ID: ${track.id}`);
        } else {
          console.warn(`No lyrics generated for track ID: ${track.id}`);
        }
      } catch (err) {
        console.error(`Failed to generate lyrics for track ID: ${track.id}`, err);
      }
    }
    console.log('Batch lyrics generation complete.');
    process.exit(0);
  } catch (err) {
    console.error('Batch lyrics generation failed:', err);
    process.exit(1);
  }
}

batchGenerateLyrics();
