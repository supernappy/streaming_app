// Script to inspect all tracks and unique artists in the database
const { pool } = require('./server/src/utils/database');

async function inspectTracksAndArtists() {
  try {
    // Fetch all tracks
    const tracksRes = await pool.query('SELECT id, title, artist, album, genre, created_at FROM tracks ORDER BY created_at DESC');
    const tracks = tracksRes.rows;
    console.log(`\n=== TRACKS (${tracks.length}) ===`);
    tracks.forEach(track => {
      console.log(`- [${track.id}] ${track.title} by ${track.artist} (Album: ${track.album}, Genre: ${track.genre}, Created: ${track.created_at})`);
    });

    // Fetch unique artists
    const artistsRes = await pool.query('SELECT DISTINCT artist FROM tracks ORDER BY artist');
    const artists = artistsRes.rows.map(r => r.artist);
    console.log(`\n=== ARTISTS (${artists.length}) ===`);
    artists.forEach(artist => {
      console.log(`- ${artist}`);
    });

    process.exit(0);
  } catch (err) {
    console.error('Error inspecting tracks/artists:', err);
    process.exit(1);
  }
}

inspectTracksAndArtists();
