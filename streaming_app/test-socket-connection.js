const { io } = require('socket.io-client');

// Test socket connection directly
console.log('🧪 Testing direct socket connection...');

// Get the token from a login request first
const fetch = require('node-fetch');

async function testConnection() {
  try {
    // Step 1: Login to get token
    console.log('1️⃣ Logging in to get auth token...');
    const loginResponse = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'wale@example.com',
        password: 'password123'
      })
    });

    if (!loginResponse.ok) {
      throw new Error(`Login failed: ${loginResponse.status}`);
    }

    const loginData = await loginResponse.json();
    const token = loginData.token;
    console.log('✅ Login successful, token obtained:', token ? 'YES' : 'NO');

    // Step 2: Test socket connection
    console.log('2️⃣ Testing socket connection...');
    const socket = io('http://localhost:3001', {
      auth: {
        token: token
      },
      transports: ['websocket', 'polling'],
      timeout: 5000
    });

    socket.on('connect', () => {
      console.log('✅ Socket connected successfully!');
      
      // Step 3: Test room joining
      console.log('3️⃣ Testing room join...');
      socket.emit('join-room', '5');
      
      setTimeout(() => {
        console.log('4️⃣ Testing track change...');
        socket.emit('host-change-track', { trackId: 14, autoPlay: true });
        
        setTimeout(() => {
          console.log('✅ Test completed successfully!');
          socket.disconnect();
          process.exit(0);
        }, 1000);
      }, 1000);
    });

    socket.on('connect_error', (error) => {
      console.error('❌ Socket connection failed:', error.message);
      process.exit(1);
    });

    socket.on('sync-track-change', (data) => {
      console.log('🎵 Received track change event:', data);
    });

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

testConnection();
