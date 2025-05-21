// forgot-password.js
document.addEventListener('DOMContentLoaded', () => {
    const forgotPasswordForm = document.getElementById('forgot-password-form');
    const resetMessage = document.getElementById('reset-message');
    
    // Function to display messages
    function showMessage(message, isError = false) {
        resetMessage.textContent = message;
        resetMessage.style.display = 'block';
        resetMessage.className = isError ? 'message-box error' : 'message-box success';
    }
    
    // Function to clear messages
    function clearMessage() {
        resetMessage.style.display = 'none';
    }
    
    // Handle form submission
    forgotPasswordForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Clear any previous messages
        clearMessage();
        
        // Get email value
        const email = document.getElementById('reset-email').value.trim();
        
        // Basic validation
        if (!email) {
            showMessage('Please enter your email address.', true);
            return;
        }
        
        // Email format validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            showMessage('Please enter a valid email address.', true);
            return;
        }

        try {
            // Show loading message
            showMessage('Processing your request...');
            
            // Send request to server
            const response = await fetch('/api/users/forgot-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                // Success
                showMessage('Password reset instructions have been sent to your email.');
                forgotPasswordForm.reset();
            } else {
                // Error
                showMessage(data.message || 'An error occurred. Please try again.', true);
            }
        } catch (error) {
            console.error('Error:', error);
            showMessage('Network or server error. Please try again later.', true);
        }
    });
});
