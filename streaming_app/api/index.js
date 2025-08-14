// Mock API for non-auth endpoints
module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { url, method } = req;
  
  try {
    // Handle different API endpoints
    if (url.includes('/tracks')) {
      if (method === 'GET') {
        return res.status(200).json({
          tracks: [
            {
              id: 1,
              title: 'Sample Track 1',
              artist: 'Demo Artist',
              album: 'Demo Album',
              duration: 180,
              file_path: '/demo/track1.mp3'
            },
            {
              id: 2,
              title: 'Sample Track 2',
              artist: 'Demo Artist',
              album: 'Demo Album',
              duration: 240,
              file_path: '/demo/track2.mp3'
            }
          ]
        });
      }
    }
    
    if (url.includes('/playlists')) {
      if (method === 'GET') {
        return res.status(200).json({
          playlists: [
            {
              id: 1,
              name: 'My Playlist',
              description: 'Demo playlist',
              tracks: []
            }
          ]
        });
      }
    }
    
    // Default response for unhandled endpoints
    res.status(404).json({ error: 'Endpoint not found' });
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
