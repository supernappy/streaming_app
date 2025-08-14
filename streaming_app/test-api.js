// Test script to verify API connectivity
const fetch = require('node-fetch');

// Test the backend API endpoint
async function testAPI() {
  const baseURL = 'http://localhost:9000/api';
  
  console.log('Testing API connectivity...');
  
  try {
    // Test basic connectivity
    const response = await fetch(`${baseURL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'testpassword'
      })
    });
    
    console.log('Response status:', response.status);
    const data = await response.text();
    console.log('Response data:', data);
    
  } catch (error) {
    console.error('API connection failed:', error.message);
  }
}

testAPI();
