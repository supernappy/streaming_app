// Script to update all tracks with plain text lyrics to LRC/timestamped lyrics
// Usage: node scripts/update_old_lyrics_to_lrc.js

const { pool } = require('../server/src/utils/database');
const { generateLyrics } = require('../server/src/services/aiLyricsService');

// Regex to detect LRC timestamps
const lrcRegex = /\[\d{1,2}:\d{2}(?:\.\d{1,2})?\]/;

async function updateLyricsToLRC() {
  const tracks = await pool.query("SELECT id, title, artist, genre, lyrics FROM tracks WHERE lyrics IS NOT NULL AND lyrics != ''");
  let updated = 0;
  for (const track of tracks.rows) {
    if (!lrcRegex.test(track.lyrics)) {
      console.log(`Updating track: ${track.title} by ${track.artist}`);
      const lrcLyrics = await generateLyrics(track.title, track.artist, track.genre);
      if (lrcLyrics && lrcRegex.test(lrcLyrics)) {
  await pool.query('UPDATE tracks SET lyrics = $1, updated_at = NOW() WHERE id = $2', [lrcLyrics, track.id]);
        updated++;
      } else {
        console.warn(`Failed to generate LRC for track: ${track.title}`);
      }
    }
  }
  console.log(`Updated ${updated} tracks to LRC format.`);
  process.exit(0);
}

updateLyricsToLRC().catch(err => {
  console.error('Error updating lyrics:', err);
  process.exit(1);
});
