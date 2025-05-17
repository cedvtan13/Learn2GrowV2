/**
 * Profile messaging functionality for Learn2Grow
 * 
 * This script handles the message button on profile pages
 */

// Start a conversation with another user and navigate to messages
async function startConversation(userId) {
    try {
        // Verify user is logged in
        const currentUser = localStorage.getItem('currentUser');
        const token = localStorage.getItem('token') || 
                      (currentUser ? JSON.parse(currentUser)?.token : null);
                     
        if (!token) {
            // Show login prompt if not logged in
            showLoginPrompt();
            return;
        }
        
        // Store the user ID in localStorage to be picked up by messages.js
        localStorage.setItem('pendingConversationUserId', userId);
        
        // Navigate to messages page
        window.location.href = 'messages.html';
    } catch (error) {
        console.error('Error starting conversation:', error);
    }
}

// Show login prompt overlay
function showLoginPrompt() {
    // Check if login prompt already exists
    if (document.getElementById('loginPromptOverlay')) {
        document.getElementById('loginPromptOverlay').style.display = 'flex';
        return;
    }
    
    const overlay = document.createElement('div');
    overlay.id = 'loginPromptOverlay';
    overlay.className = 'login-prompt-overlay';
    
    overlay.innerHTML = `
        <div class="login-prompt-content">
            <h3><i class='bx bx-lock-alt'></i> Login Required</h3>
            <p>You need to sign in to send messages.</p>
            <div class="login-prompt-buttons">
                <a href="index.html?requireLogin=true" class="login-btn">Sign In</a>
                <button class="cancel-btn" onclick="document.getElementById('loginPromptOverlay').style.display='none'">Cancel</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(overlay);
}

// Add CSS for message button and login prompt if not already in style.css
document.addEventListener('DOMContentLoaded', () => {
    // Removed CSS injection as styles are now in style.css
});