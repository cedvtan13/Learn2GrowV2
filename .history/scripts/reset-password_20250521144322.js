// Handle reading the token from URL for password reset
document.addEventListener('DOMContentLoaded', () => {
  // Check if we're on the reset password page
  if (window.location.pathname.includes('reset-password.html')) {
    initializeResetPasswordPage();
  }
});

// Initialize reset password functionality
function initializeResetPasswordPage() {
  // Get token from URL
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');
  
  if (!token) {
    // No token provided, show error
    showResetMessage('Invalid or missing reset token. Please try the reset process again.', false);
    document.getElementById('reset-password-form').style.display = 'none';
    return;
  }
  
  // Set up form submission handler
  const resetPasswordForm = document.getElementById('reset-password-form');
  resetPasswordForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    const messageElem = document.getElementById('reset-message');
    const submitButton = resetPasswordForm.querySelector('button[type="submit"]');
    
    // Validate passwords
    if (newPassword !== confirmPassword) {
      showResetMessage('Passwords do not match. Please try again.', false);
      return;
    }
    
    if (newPassword.length < 8) {
      showResetMessage('Password must be at least 8 characters long.', false);
      return;
    }
    
    // Disable button and show loading state
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = 'Processing...';
    }
    
    try {
      // Call API to reset password
      const response = await fetch('/api/users/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          token,
          password: newPassword
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        showResetMessage('Password has been reset successfully. You will be redirected to login.', true);
        // Redirect to login page after 3 seconds
        setTimeout(() => {
          window.location.href = 'index.html';
        }, 3000);
      } else {
        showResetMessage(data.message || 'Failed to reset password. Please try again.', false);
      }
    } catch (error) {
      console.error('Error resetting password:', error);
      showResetMessage('An error occurred. Please try again later.', false);
    } finally {
      // Restore button state
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = 'Update Password';
      }
    }
  });
}

// Helper function to show reset messages
function showResetMessage(message, isSuccess) {
  const messageElem = document.getElementById('reset-message');
  if (messageElem) {
    messageElem.textContent = message;
    messageElem.className = isSuccess ? 'success-message' : 'error-message';
    messageElem.style.display = 'block';
  }
}
