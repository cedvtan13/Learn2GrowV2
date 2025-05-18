// Authentication management for Learn2Grow using existing user accounts in the database

console.log('📝 auth.js loaded');

// Function to check if a valid token/user exists in localStorage
function checkUserAuthentication() {
  const userData = localStorage.getItem('currentUser');
  
  try {
    // Parse user data if it exists
    if (userData) {
      const user = JSON.parse(userData);
      
      // Check if user data and token exist
      if (user && user.token) {
        console.log('Existing token found:', user.token.substring(0, 20) + '...');
        return true;
      }
    }
    
    console.log('No valid authentication found');
    return false;
  } catch (error) {
    console.error('Error checking authentication:', error);
    return false;
  }
}

// Function to validate token with the server
async function validateToken() {
  const userData = localStorage.getItem('currentUser');
  if (!userData) return false;
  
  try {
    const user = JSON.parse(userData);
    if (!user || !user.token) return false;
    
    // Call API to validate token
    const response = await fetch('/api/users/profile', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${user.token}`,
        'Content-Type': 'application/json'
      }
    });
    
    return response.ok;
  } catch (error) {
    console.error('Error validating token:', error);
    return false;
  }
}

// Function to redirect to login page if not authenticated
function requireAuthentication() {
  if (!checkUserAuthentication()) {
    console.log('Authentication required, redirecting to login page');
    window.location.href = '/index.html';
    return false;
  }
  return true;
}

// Function to clear authentication and logout
function logout() {
  localStorage.removeItem('currentUser');
  console.log('User logged out - currentUser removed from localStorage');
  window.location.href = '/index.html';
}

// Export functionality for use in other scripts
window.auth = {
  checkUserAuthentication,
  validateToken,
  requireAuthentication,
  logout
};

console.log('Auth utilities loaded. Use auth.requireAuthentication() to ensure user is authenticated');
