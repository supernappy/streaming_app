// Minimal test for play-count endpoint and socket event
// Run with: node src/utils/playEventsTest.js
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const io = require('socket.io-client');

const API = process.env.API_URL || 'http://localhost:5002';
const TRACK_ID = process.env.TRACK_ID || 23;

async function testPlayIncrement() {
  console.log('Testing POST /api/tracks/' + TRACK_ID + '/play ...');
  const res = await fetch(`${API}/api/tracks/${TRACK_ID}/play`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{}'
  });
  const data = await res.json();
  if (!data.track || typeof data.track.play_count !== 'number') {
    throw new Error('No play_count in response: ' + JSON.stringify(data));
  }
  console.log('Play count after increment:', data.track.play_count);
}

function testSocketEvent() {
  return new Promise((resolve, reject) => {
    const socket = io(API, { transports: ['websocket'] });
    socket.on('connect', () => {
      console.log('Socket connected. Listening for play-count-updated...');
      // Trigger increment after connect
      fetch(`${API}/api/tracks/${TRACK_ID}/play`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{}'
      });
    });
    socket.on('track:play-count-updated', (payload) => {
      if (payload && payload.trackId == TRACK_ID) {
        console.log('Received socket event:', payload);
        socket.disconnect();
        resolve();
      }
    });
    setTimeout(() => {
      socket.disconnect();
      reject(new Error('Socket event not received in time.'));
    }, 4000);
  });
}

(async () => {
  try {
    await testPlayIncrement();
    await testSocketEvent();
    console.log('All play event tests passed!');
  } catch (e) {
    console.error('Test failed:', e);
    process.exit(1);
  }
})();
