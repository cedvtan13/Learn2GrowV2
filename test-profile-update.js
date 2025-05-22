// test-profile-update.js
import fetch from 'node-fetch';

// Test configuration
const API_URL = 'http://localhost:3000/api'; // Update with your actual server URL
let authToken = '';
let userId = '';

// Mock user data for testing
const testUser = {
  email: 'test@example.com',
  password: 'password123'
};

// Mock profile update data
const profileUpdate = {
  name: 'Updated Name',
  // Base64 encoded small image for testing
  profilePicture: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='
};

// Mock password change data
const passwordChange = {
  currentPassword: 'password123',
  newPassword: 'newPassword123'
};

// Helper function for logging
const logStep = (step) => {
  console.log(`\n--- ${step} ---`);
};

// Login function
async function login() {
  logStep('Logging in');
  try {
    const response = await fetch(`${API_URL}/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser)
    });
    
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to login');
    }
    
    authToken = data.token;
    userId = data._id;
    console.log('Login successful');
    console.log('User ID:', userId);
    return data;
  } catch (error) {
    console.error('Login failed:', error.message);
    throw error;
  }
}

// Get user profile function
async function getUserProfile() {
  logStep('Getting user profile');
  try {
    const response = await fetch(`${API_URL}/users/${userId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to get user profile');
    }
    
    console.log('User profile data:', data);
    return data;
  } catch (error) {
    console.error('Get profile failed:', error.message);
    throw error;
  }
}

// Update profile function
async function updateProfile() {
  logStep('Updating user profile');
  try {
    const response = await fetch(`${API_URL}/users/profile/update`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(profileUpdate)
    });
    
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to update profile');
    }
    
    console.log('Profile updated:', data);
    return data;
  } catch (error) {
    console.error('Update profile failed:', error.message);
    throw error;
  }
}

// Change password function
async function changePassword() {
  logStep('Changing password');
  try {
    const response = await fetch(`${API_URL}/users/change-password`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(passwordChange)
    });
    
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to change password');
    }
    
    console.log('Password changed successfully:', data);
    return data;
  } catch (error) {
    console.error('Change password failed:', error.message);
    throw error;
  }
}

// Login with new password function
async function loginWithNewPassword() {
  logStep('Logging in with new password');
  try {
    const response = await fetch(`${API_URL}/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testUser.email,
        password: passwordChange.newPassword
      })
    });
    
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to login with new password');
    }
    
    console.log('Login with new password successful');
    return data;
  } catch (error) {
    console.error('Login with new password failed:', error.message);
    throw error;
  }
}

// Run all tests
async function runTests() {
  try {
    console.log('Starting profile update and password change tests');
    
    // Step 1: Login
    await login();
    
    // Step 2: Get current profile
    await getUserProfile();
    
    // Step 3: Update profile
    await updateProfile();
    
    // Step 4: Get updated profile to verify changes
    await getUserProfile();
    
    // Step 5: Change password
    await changePassword();
    
    // Step 6: Login with new password to verify
    await loginWithNewPassword();
    
    console.log('\n✅ All tests completed successfully!');
  } catch (error) {
    console.error('\n❌ Test suite failed:', error.message);
  }
}

// Run the tests
runTests();
