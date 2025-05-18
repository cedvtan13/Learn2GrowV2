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

// Function to refresh token if it's expired or about to expire
async function refreshTokenIfNeeded() {
  const userData = localStorage.getItem('currentUser');
  if (!userData) return false;
  
  try {
    const user = JSON.parse(userData);
    if (!user || !user.token) return false;
    
    // Check if token is within 5 minutes of expiry or already expired
    const tokenParts = user.token.split('.');
    if (tokenParts.length !== 3) return false;
    
    let payload;
    try {
      payload = JSON.parse(atob(tokenParts[1]));
    } catch (e) {
      console.error('Error decoding token:', e);
      return false;
    }
      const expiryTime = payload.exp * 1000; // Convert seconds to milliseconds
    const currentTime = Date.now();
    const timeToExpiry = expiryTime - currentTime;
    
    // If token is expired or will expire in less than 5 minutes
    if (timeToExpiry < 300000) {
      console.log('Token expired or about to expire, attempting to refresh...');
      
      // Call API to get a new token (you would need to implement this on the server)
      // This is a basic implementation - in production you might want to use a refresh token
      try {
        const response = await fetch('/api/users/refresh-token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user.token}`
          },
          body: JSON.stringify({ userId: user._id })
        });
        
        if (response.ok) {
          const data = await response.json();
          
          // Update token in localStorage
          user.token = data.token;
          localStorage.setItem('currentUser', JSON.stringify(user));
          console.log('Token refreshed successfully');
          return true;
        } else {
          // If refresh fails, redirect to login
          console.log('Token refresh failed, redirecting to login');
          logout();
          return false;
        }
      } catch (error) {
        console.error('Error refreshing token:', error);
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error checking token expiry:', error);
    return false;
  }
}

// Export functionality for use in other scripts
window.auth = {
  checkUserAuthentication,
  validateToken,
  requireAuthentication,
  refreshTokenIfNeeded,
  logout
};

console.log('Auth utilities loaded. Use auth.requireAuthentication() to ensure user is authenticated');
