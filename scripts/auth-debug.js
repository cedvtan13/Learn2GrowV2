// Utility script to help debug authentication issues

// Function to generate a simple base64 encoded token with user data
function generateDebugToken() {
  console.log('Generating debug token for authentication testing');
  
  // Generate a valid MongoDB ObjectId for the debug user
  const debugObjectId = '507f1f77bcf86cd799439011'; // Valid MongoDB ObjectId format
  
  const header = btoa(JSON.stringify({ alg: 'mock', typ: 'JWT' }));
  const payload = btoa(JSON.stringify({
    userId: debugObjectId, // Using a valid ObjectId format string
    name: 'Debug User',
    email: 'debug@learn2grow.test',
    role: 'Recipient',
    exp: Date.now() + 3600000 // 1 hour expiry
  }));
  const signature = btoa('mocksignature');
  
  const token = `${header}.${payload}.${signature}`;
  console.log('Debug token created:', token.substring(0, 20) + '...');
  
  return token;
}

// Function to verify token in localStorage or create a debug token
function ensureValidToken() {
  const userData = localStorage.getItem('currentUser');
  
  try {
    // Parse user data if it exists
    if (userData) {
      const user = JSON.parse(userData);
      
      // Check if token exists and is valid
      if (user && user.token) {
        console.log('Existing token found:', user.token.substring(0, 20) + '...');
        return true;
      }
    }
    
    // No valid token found, create a debug user with token
    console.log('No valid token found, creating debug user');
    const debugUser = {
      name: 'Debug User',
      email: 'debug@learn2grow.test',
      role: 'Recipient',
      profileImage: null,
      token: generateDebugToken()
    };
    
    // Store debug user in localStorage
    localStorage.setItem('currentUser', JSON.stringify(debugUser));
    console.log('Debug user created and stored in localStorage');
    
    return true;
  } catch (error) {
    console.error('Error ensuring valid token:', error);
    return false;
  }
}

// Function to clear authentication and start fresh
function resetAuthentication() {
  localStorage.removeItem('currentUser');
  console.log('Authentication reset - currentUser removed from localStorage');
}

// Export functionality for use in other scripts
window.authDebug = {
  generateDebugToken,
  ensureValidToken,
  resetAuthentication
};

console.log('Auth debug utilities loaded. Use authDebug.ensureValidToken() to ensure a valid token exists');
