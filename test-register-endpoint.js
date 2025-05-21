// test-register-endpoint.js
import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

async function testRegistration() {
  console.log('Testing registration endpoint...');
  
  try {
    const testData = {
      name: 'Test User',
      email: `testuser${Date.now()}@example.com`,
      password: 'Password123!'
    };
    
    console.log('Registering with:', testData);
    
    const response = await fetch('http://localhost:3000/api/users/register-recipient', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testData)
    });
    
    const result = await response.json();
    
    console.log('Response status:', response.status);
    console.log('Response body:', result);
    console.log('\nCheck your email logs for the verification email.');
  } catch (error) {
    console.error('Error during registration test:', error);
  }
}

testRegistration();
