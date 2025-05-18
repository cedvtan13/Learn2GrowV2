/**
 * Messaging functionality for Learn2Grow
 * 
 * This script handles the messaging UI and API interactions
 */

// State management
let currentConversationId = null;
let currentUserData = null;
let conversations = [];
let messages = [];
let isInitialized = false;
let currentSearchResults = []; // Store current search results

// Check if user is logged in
async function checkAuthStatus() {
    try {
        // First check for debug user from auth-debug.js
        try {
            if (typeof ensureValidToken === 'function') {
                const debugTokenValid = ensureValidToken();
                if (debugTokenValid) {
                    console.log('Using debug token authentication');
                    const userData = JSON.parse(localStorage.getItem('currentUser'));
                    if (userData) {
                        currentUserData = userData;
                        hideLoginPrompt();
                        return true;
                    }
                }
            }
        } catch (debugError) {
            console.log('Debug auth not available:', debugError);
        }
        
        // Check for regular token authentication
        const token = localStorage.getItem('token') || 
                    (localStorage.getItem('currentUser') ? 
                     JSON.parse(localStorage.getItem('currentUser')).token : 
                     null);
                     
        if (!token) {
            showLoginPrompt();
            return false;
        }
        
        const response = await fetch('/api/users/profile', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.status === 401) {
            showLoginPrompt();
            return false;
        }
        
        if (response.ok) {
            currentUserData = await response.json();
            hideLoginPrompt();
            return true;
        }
        
        showLoginPrompt();
        return false;
    } catch (error) {
        console.error('Error checking auth status:', error);
        showLoginPrompt();
        return false;
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
            <p>You need to sign in to view and send messages.</p>
            <div class="login-prompt-buttons">
                <a href="index.html?requireLogin=true" class="login-btn">Sign In</a>
            </div>
        </div>
    `;
    
    document.body.appendChild(overlay);
}

// Hide login prompt
function hideLoginPrompt() {
    const overlay = document.getElementById('loginPromptOverlay');
    if (overlay) {
        overlay.style.display = 'none';
    }
}

// API Calls
async function fetchConversations() {
    try {
        const token = localStorage.getItem('token') || 
                    (localStorage.getItem('currentUser') ? 
                     JSON.parse(localStorage.getItem('currentUser')).token : 
                     null);
                     
        if (!token) throw new Error('No authentication token found');
        
        // Add debugging logs
        console.log('Fetching conversations with token:', token.substring(0, 20) + '...');
        
        const response = await fetch('/api/messages/conversations', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        // Improved error handling
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('Server response:', response.status, response.statusText, errorData);
            throw new Error(`Failed to fetch conversations: ${response.status} ${errorData.message || response.statusText}`);
        }
        
        const data = await response.json();
        console.log('Conversations fetched successfully:', data);
        conversations = data;
        renderConversations();
        return data;
    } catch (error) {
        console.error('Error fetching conversations:', error);
        handleApiError(error);
        return [];
    }
}

async function fetchMessages(userId) {
    try {
        const token = localStorage.getItem('token') || 
                    (localStorage.getItem('currentUser') ? 
                     JSON.parse(localStorage.getItem('currentUser')).token : 
                     null);
                     
        if (!token) throw new Error('No authentication token found');
        
        const response = await fetch(`/api/messages/${userId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) throw new Error('Failed to fetch messages');
        
        const data = await response.json();
        messages = data;
        renderMessages();
        return data;
    } catch (error) {
        console.error('Error fetching messages:', error);
        handleApiError(error);
        return [];
    }
}

async function sendMessage(userId, content) {
    try {
        const token = localStorage.getItem('token') || 
                    (localStorage.getItem('currentUser') ? 
                     JSON.parse(localStorage.getItem('currentUser')).token : 
                     null);
                     
        if (!token) throw new Error('No authentication token found');
        
        // Add debugging logs
        console.log('Sending message to user:', userId);
        console.log('Message content:', content);
        console.log('Using token:', token.substring(0, 20) + '...');
        
        const response = await fetch(`/api/messages/${userId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ content })
        });
        
        // Improved error handling
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('Server response:', response.status, response.statusText, errorData);
            throw new Error(`Failed to send message: ${response.status} ${errorData.message || response.statusText}`);
        }
        
        const newMessage = await response.json();
        console.log('Message sent successfully:', newMessage);
        messages.push(newMessage);
        renderMessages();
        return newMessage;
    } catch (error) {
        console.error('Error sending message:', error);
        handleApiError(error);
        return null;
    }
}

// User search functionality
async function searchUsers(query) {
    try {
        if (!query || query.trim().length < 2) {
            // Require at least 2 characters for search
            return [];
        }
        
        const token = localStorage.getItem('token') || 
                    (localStorage.getItem('currentUser') ? 
                     JSON.parse(localStorage.getItem('currentUser')).token : 
                     null);
                     
        if (!token) return [];
        
        const response = await fetch(`/api/messages/search/users?query=${encodeURIComponent(query)}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) throw new Error('Failed to search users');
        
        const users = await response.json();
        currentSearchResults = users; // Save results for later reference
        return users;
    } catch (error) {
        console.error('Error searching users:', error);
        return [];
    }
}

function renderSearchResults(users) {
    const resultsContainer = document.getElementById('userSearchResults');
    
    if (!users || users.length === 0) {
        resultsContainer.innerHTML = `<div class="no-results">No users found</div>`;
        return;
    }
    
    // Clear previous results
    resultsContainer.innerHTML = '';
    
    // Add new results
    users.forEach(user => {
        const avatarSrc = user.profile && user.profile.avatar 
            ? user.profile.avatar 
            : '../images/default-profile.jpg';
            
        const div = document.createElement('div');
        div.className = 'user-result';
        div.dataset.userId = user._id;
        
        div.innerHTML = `
            <img src="${avatarSrc}" alt="${user.name}">
            <span class="name">${user.name}</span>
            <span class="role">${user.role || ''}</span>
        `;
        
        div.addEventListener('click', () => startConversation(user._id));
        resultsContainer.appendChild(div);
    });
}

async function startConversation(userId) {
    try {
        // If we're not on the messages page, redirect after getting user data
        if (!window.location.href.includes('messages.html')) {
            // Store the userId in localStorage to open later
            localStorage.setItem('pendingConversationUserId', userId);
            
            // Redirect to messages page
            window.location.href = 'messages.html';
            return;
        }

        // Check if conversation already exists
        const existingConvo = conversations.find(c => c.otherUser._id === userId);
        
        if (existingConvo) {
            // If conversation exists, select it
            selectConversation(userId);
        } else {
            // If not, fetch user data first if we don't have it
            let user = currentSearchResults.find(u => u._id === userId);
            
            if (!user) {
                try {
                    const token = localStorage.getItem('token') || 
                                (localStorage.getItem('currentUser') ? 
                                JSON.parse(localStorage.getItem('currentUser')).token : 
                                null);
                                
                    if (!token) throw new Error('No authentication token found');
                    
                    // Fetch user data from API
                    const response = await fetch(`/api/users/${userId}`, {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });
                    
                    if (!response.ok) throw new Error('Failed to fetch user data');
                    
                    user = await response.json();
                } catch (error) {
                    console.error('Error fetching user data:', error);
                    return;
                }
            }
            
            if (!user) return;
            
            // Create a temporary conversation entry
            const tempConvo = {
                otherUser: user,
                lastMessage: {
                    content: 'Start a new conversation...',
                    createdAt: new Date().toISOString()
                }
            };
            
            // Add to conversations array
            conversations.unshift(tempConvo);
            renderConversations();
            
            // Select the new conversation
            selectConversation(userId);
            
            // Hide search results if they're visible
            const searchResults = document.getElementById('userSearchResults');
            if (searchResults) {
                searchResults.classList.remove('active');
            }
        }
    } catch (error) {
        console.error('Error starting conversation:', error);
    }
}

// UI Functions
function renderConversations() {
    const list = document.getElementById('conversationList');
    if (!list) return;
    
    list.innerHTML = '';
    
    if (conversations.length === 0) {
        list.innerHTML = '<div class="no-conversations">No conversations yet</div>';
        return;
    }
    
    conversations.forEach(conv => {
        const li = document.createElement('li');
        li.id = `conversation-${conv.otherUser._id}`;
        if (currentConversationId === conv.otherUser._id) {
            li.classList.add('active');
        }
        
        // Format the avatar
        const avatarSrc = conv.otherUser.profile && conv.otherUser.profile.avatar 
            ? conv.otherUser.profile.avatar 
            : '../images/default-profile.jpg';
        
        // Format the timestamp
        const timestamp = new Date(conv.lastMessage.createdAt).toLocaleString();
        
        li.innerHTML = `
            <img src="${avatarSrc}" alt="${conv.otherUser.name}">
            <div class="conversation-info">
                <span class="name">${conv.otherUser.name}</span>
                <span class="last-message">${truncateText(conv.lastMessage.content, 40)}</span>
            </div>
            <span class="time">${formatRelativeTime(timestamp)}</span>
        `;
        
        li.addEventListener('click', () => selectConversation(conv.otherUser._id));
        list.appendChild(li);
    });
}

function renderMessages() {
    const chatMessages = document.getElementById('chatMessages');
    if (!chatMessages) return;
    
    chatMessages.innerHTML = '';
    
    if (messages.length === 0) {
        chatMessages.innerHTML = `
            <div class="no-messages">
                <i class='bx bx-message-square-detail' style="font-size: 42px; color: #555;"></i>
                <p>No messages in this conversation yet.</p>
                <p>Type a message below to start chatting!</p>
            </div>`;
        return;
    }
    
    let currentDay = null;
      messages.forEach(msg => {
        // Check if we need to add a date separator
        const messageDate = new Date(msg.createdAt);
        const messageDay = messageDate.toLocaleDateString();
        
        if (currentDay !== messageDay) {
            const dateDiv = document.createElement('div');
            dateDiv.className = 'date-separator';
            dateDiv.textContent = formatDate(messageDate);
            chatMessages.appendChild(dateDiv);
            currentDay = messageDay;
        }
        
        const div = document.createElement('div');
        
        // Fix for determining if message is sent or received
        // Convert IDs to strings for consistent comparison
        const currentUserId = String(currentUserData._id || currentUserData.userId);
        const messageFromId = String(msg.from);
        
        // Log for debugging
        console.log('Message comparison:', { 
            messageFromId, 
            currentUserId, 
            isSent: messageFromId === currentUserId 
        });
        
        const isSent = messageFromId === currentUserId;
        div.className = `message ${isSent ? 'sent' : 'received'}`;
        
        div.innerHTML = `
            ${msg.content}
            <span class="timestamp">${formatTime(messageDate)}</span>
        `;
        
        chatMessages.appendChild(div);
    });
    
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function selectConversation(userId) {
    currentConversationId = userId;
    
    // Update active state in UI
    document.querySelectorAll('#conversationList li').forEach(li => {
        li.classList.remove('active');
    });
    
    const conversationEl = document.getElementById(`conversation-${userId}`);
    if (conversationEl) {
        conversationEl.classList.add('active');
    }
    
    // Find user info for header
    const conversation = conversations.find(c => c.otherUser._id === userId);
    if (conversation) {
        document.getElementById('chatUserName').textContent = conversation.otherUser.name;
    }
    
    // Load messages
    fetchMessages(userId);
}

// Helper Functions
function formatRelativeTime(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);
    
    if (diffDay > 0) {
        return diffDay === 1 ? 'Yesterday' : `${diffDay} days ago`;
    } else if (diffHour > 0) {
        return `${diffHour}h ago`;
    } else if (diffMin > 0) {
        return `${diffMin}m ago`;
    } else {
        return 'Just now';
    }
}

function formatDate(date) {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
        return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
        return 'Yesterday';
    } else {
        return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
    }
}

function formatTime(date) {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

function truncateText(text, maxLength) {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
}

function handleApiError(error) {
    if (error.message.includes('401')) {
        // Unauthorized, redirect to login
        window.location.href = 'index.html?requireLogin=true';
    } else {
        // Show error toast or message
        console.error('API Error:', error);
    }
}

// Initialize the page
async function initialize() {
    if (isInitialized) return;
    
    const isLoggedIn = await checkAuthStatus();
    if (!isLoggedIn) {
        // If not logged in, just show the login prompt
        // The page remains visible but non-functional
        return;
    }
    
    await fetchConversations();
    
    // Check if we have a pending conversation from a profile page
    const pendingUserId = localStorage.getItem('pendingConversationUserId');
    if (pendingUserId) {
        // Clear the pending conversation
        localStorage.removeItem('pendingConversationUserId');
        
        // Start or open the conversation
        startConversation(pendingUserId);
        return;
    }
    
    // If there's at least one conversation, open it
    if (conversations.length > 0) {
        selectConversation(conversations[0].otherUser._id);
    } else {
        // Show empty state message in chat area
        const chatMessages = document.getElementById('chatMessages');
        if (chatMessages) {
            chatMessages.innerHTML = `
                <div class="no-messages">
                    <i class='bx bx-message-square-detail' style="font-size: 48px; color: #555;"></i>
                    <p>You don't have any conversations yet.</p>
                    <p>Visit user profiles or posts to start messaging!</p>
                </div>
            `;
        }
    }
    
    isInitialized = true;
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    initialize();
    
    const chatForm = document.getElementById('chatForm');
    if (chatForm) {
        chatForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Check if user is logged in before allowing message submission
            if (!currentUserData) {
                showLoginPrompt();
                return;
            }
            
            const messageInput = document.getElementById('messageInput');
            const content = messageInput.value.trim();
            
            if (!content || !currentConversationId) return;
            
            messageInput.value = '';
            await sendMessage(currentConversationId, content);
            
            // Refresh conversations list to update last message
            fetchConversations();
        });
    }
    
    // Set up user search functionality
    const searchInput = document.getElementById('userSearchInput');
    const searchButton = document.getElementById('userSearchButton');
    const searchResults = document.getElementById('userSearchResults');
    
    if (searchInput && searchButton) {
        // Search when button is clicked
        searchButton.addEventListener('click', async () => {
            const query = searchInput.value.trim();
            const users = await searchUsers(query);
            renderSearchResults(users);
            searchResults.classList.add('active');
        });
        
        // Search when Enter key is pressed
        searchInput.addEventListener('keypress', async (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const query = searchInput.value.trim();
                const users = await searchUsers(query);
                renderSearchResults(users);
                searchResults.classList.add('active');
            }
        });
        
        // Hide results when clicking outside the search area
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.user-search') && searchResults.classList.contains('active')) {
                searchResults.classList.remove('active');
            }
        });
        
        // Show results again when clicking on the input field if there are results
        searchInput.addEventListener('click', () => {
            if (currentSearchResults.length > 0) {
                searchResults.classList.add('active');
            }
        });
    }
});

// Mock data for testing without backend
function initMockData() {
    console.log("Initializing mock data for messages");
    currentUserData = { _id: 'currentuser' };
    isInitialized = true; // Mark as initialized so we don't try to fetch real data again
    
    conversations = [
        {
            otherUser: {
                _id: '1',
                name: 'Cedric Vince Tan',
                profile: { avatar: '../images/default-profile.jpg' }
            },
            lastMessage: {
                content: 'Hello! How can I help you?',
                createdAt: new Date().toISOString()
            }
        },
        {
            otherUser: {
                _id: '2',
                name: 'Gerard Oliver Casas',
                profile: { avatar: '../images/default-profile.jpg' }
            },
            lastMessage: {
                content: 'Sure! What would you like to know?',
                createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString() // 30 minutes ago
            }
        },
        {
            otherUser: {
                _id: '3',
                name: 'Kin Marius Lato',
                profile: { avatar: '../images/default-profile.jpg' }
            },
            lastMessage: {
                content: 'Hi Kin!',
                createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString() // 2 hours ago
            }
        }
    ];
    
    // Override API functions for mock data
    fetchConversations = () => {
        renderConversations();
        return Promise.resolve(conversations);
    };
    
    fetchMessages = (userId) => {
        // Create more messages based on which user is selected
        let mockMessages = [];
        
        if (userId === '1') {
            mockMessages = [
                { 
                    _id: 'm1', 
                    from: userId, 
                    to: 'currentuser', 
                    content: 'Hi there!', 
                    createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString() 
                },
                { 
                    _id: 'm2', 
                    from: 'currentuser', 
                    to: userId, 
                    content: 'Hello Cedric! How can I help you?', 
                    createdAt: new Date(Date.now() - 1000 * 60 * 59).toISOString() 
                },
                {
                    _id: 'm3',
                    from: userId,
                    to: 'currentuser',
                    content: 'I wanted to discuss the recent donations to our education program.',
                    createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString()
                }
            ];
        } else if (userId === '2') {
            mockMessages = [
                { 
                    _id: 'm4', 
                    from: userId, 
                    to: 'currentuser', 
                    content: 'Hi, I have a question about donations.', 
                    createdAt: new Date(Date.now() - 1000 * 60 * 35).toISOString() 
                },
                { 
                    _id: 'm5', 
                    from: 'currentuser', 
                    to: userId, 
                    content: 'Sure! What would you like to know?', 
                    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString() 
                },
                {
                    _id: 'm6',
                    from: userId,
                    to: 'currentuser',
                    content: 'How can I set up a recurring monthly donation to help with ongoing projects?',
                    createdAt: new Date(Date.now() - 1000 * 60 * 25).toISOString()
                }
            ];
        } else if (userId === '3') {
            mockMessages = [
                { 
                    _id: 'm7', 
                    from: userId, 
                    to: 'currentuser', 
                    content: 'Hey!', 
                    createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString() 
                },
                { 
                    _id: 'm8', 
                    from: 'currentuser', 
                    to: userId, 
                    content: 'Hi Kin!', 
                    createdAt: new Date(Date.now() - 1000 * 60 * 119).toISOString() 
                },
                {
                    _id: 'm9',
                    from: userId,
                    to: 'currentuser',
                    content: 'I just wanted to check in about the new platform features. When will the community forum be available?',
                    createdAt: new Date(Date.now() - 1000 * 60 * 110).toISOString()
                }
            ];
        }
        
        messages = mockMessages;
        renderMessages();
        return Promise.resolve(mockMessages);
    };
    
    sendMessage = (userId, content) => {
        const newMessage = {
            _id: `m${Math.random()}`,
            from: 'currentuser',
            to: userId,
            content,
            createdAt: new Date().toISOString()
        };
        messages.push(newMessage);
        renderMessages();
        return Promise.resolve(newMessage);
    };
    
    // Actually render the conversations and select the first one
    renderConversations();
    selectConversation('1');
}
