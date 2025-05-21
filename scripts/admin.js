// Admin Dashboard JavaScript
document.addEventListener('DOMContentLoaded', async function() {
    // Check if user is logged in and is an admin
    if (!isAuthenticated()) {
        window.location.href = '/';
        return;
    }

    // Get current user data
    const currentUser = await fetchCurrentUser();
    
    // Check if user is an admin
    if (!currentUser || currentUser.role !== 'Admin') {
        // Redirect non-admin users
        alert('Access denied. Admin privileges required.');
        window.location.href = '/';
        return;
    }

    // Tab navigation
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabPanes = document.querySelectorAll('.tab-pane');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons and panes
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabPanes.forEach(pane => pane.classList.remove('active'));
            
            // Add active class to clicked button
            button.classList.add('active');
            
            // Show corresponding tab pane
            const tabId = button.getAttribute('data-tab');
            document.getElementById(tabId).classList.add('active');
            
            // Load data for the active tab
            if (tabId === 'recipient-requests') {
                loadRecipientRequests();
            } else if (tabId === 'users') {
                loadUsers();
            } else if (tabId === 'reports') {
                loadReports();
            }
        });
    });
    
    // Load recipient requests by default
    loadRecipientRequests();
    
    // Set up event listeners for modals
    setupModals();
    
    // Set up filters
    setupFilters();
});

// Helper function for handling error responses
async function handleErrorResponse(response, defaultMessage) {
    let errorMessage = defaultMessage || 'An error occurred';
    
    try {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            const errorData = await response.json();
            errorMessage = errorData.message || errorMessage;
        } else {
            errorMessage = `Error: ${response.status} ${response.statusText}`;
        }
    } catch (parseError) {
        console.error('Error parsing error response:', parseError);
    }
    
    return errorMessage;
}

// Fetch current user data
async function fetchCurrentUser() {
    try {
        const token = localStorage.getItem('token');
        
        if (!token) {
            return null;
        }
        
        const response = await fetch('/api/users/profile', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch user data');
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error fetching current user:', error);
        return null;
    }
}

// Load recipient requests
async function loadRecipientRequests() {
    try {
        document.getElementById('loading-requests').style.display = 'block';
        document.getElementById('no-requests').style.display = 'none';
        document.getElementById('requests-list').innerHTML = '';
        
        const token = localStorage.getItem('token');
        const statusFilter = document.getElementById('status-filter').value;
        const searchTerm = document.getElementById('search-requests').value.toLowerCase();
        
        const response = await fetch('/api/users/recipient-requests', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch recipient requests');
        }
        
        const requests = await response.json();
        
        // Filter requests based on selected status and search term
        const filteredRequests = requests.filter(request => {
            const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
            const matchesSearch = searchTerm === '' || 
                request.name.toLowerCase().includes(searchTerm) || 
                request.email.toLowerCase().includes(searchTerm);
            
            return matchesStatus && matchesSearch;
        });
        
        // Update UI
        document.getElementById('loading-requests').style.display = 'none';
        
        if (filteredRequests.length === 0) {
            document.getElementById('no-requests').style.display = 'block';
            return;
        }
        
        // Render requests
        const requestsList = document.getElementById('requests-list');
        filteredRequests.forEach(request => {
            const row = document.createElement('tr');
            
            // Format date
            const date = new Date(request.createdAt);
            const formattedDate = `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
            
            // Status class
            const statusClass = `status-${request.status || 'pending'}`;
            
            row.innerHTML = `
                <td>${request.name}</td>
                <td>${request.email}</td>
                <td>${formattedDate}</td>
                <td><span class="status-pill ${statusClass}">${request.status || 'pending'}</span></td>
                <td>
                    <button class="action-btn view-btn" data-id="${request._id}">Review</button>
                </td>
            `;
            
            requestsList.appendChild(row);
        });
        
        // Add event listeners to review buttons
        document.querySelectorAll('.view-btn').forEach(button => {
            button.addEventListener('click', () => {
                const requestId = button.getAttribute('data-id');
                const request = filteredRequests.find(req => req._id === requestId);
                
                if (request) {
                    openReviewModal(request);
                }
            });
        });
    } catch (error) {
        console.error('Error loading recipient requests:', error);
        document.getElementById('loading-requests').style.display = 'none';
        document.getElementById('no-requests').style.display = 'block';
        document.getElementById('no-requests').innerHTML = '<p>Error loading requests. Please try again.</p>';
    }
}

// Load users
async function loadUsers() {
    try {
        document.getElementById('loading-users').style.display = 'block';
        document.getElementById('users-list').innerHTML = '';
        
        const token = localStorage.getItem('token');
        const roleFilter = document.getElementById('role-filter').value;
        const searchTerm = document.getElementById('search-users').value.toLowerCase();
        
        const response = await fetch('/api/users', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch users');
        }
        
        const users = await response.json();
        
        // Filter users based on selected role and search term
        const filteredUsers = users.filter(user => {
            const matchesRole = roleFilter === 'all' || user.role === roleFilter;
            const matchesSearch = searchTerm === '' || 
                user.name.toLowerCase().includes(searchTerm) || 
                user.email.toLowerCase().includes(searchTerm);
            
            return matchesRole && matchesSearch;
        });
        
        // Update UI
        document.getElementById('loading-users').style.display = 'none';
        
        if (filteredUsers.length === 0) {
            document.getElementById('users-list').innerHTML = '<tr><td colspan="4">No users found</td></tr>';
            return;
        }
        
        // Render users
        const usersList = document.getElementById('users-list');
        filteredUsers.forEach(user => {
            const row = document.createElement('tr');
            
            row.innerHTML = `
                <td>${user.name}</td>
                <td>${user.email}</td>
                <td>${user.role}</td>
                <td>
                    <button class="action-btn edit-btn" data-id="${user._id}">Edit</button>
                    <button class="action-btn delete-btn" data-id="${user._id}">Delete</button>
                </td>
            `;
            
            usersList.appendChild(row);
        });
        
        // Add event listeners to buttons
        document.querySelectorAll('.edit-btn').forEach(button => {
            button.addEventListener('click', () => {
                const userId = button.getAttribute('data-id');
                const user = filteredUsers.find(u => u._id === userId);
                
                if (user) {
                    openUserModal(user);
                }
            });
        });
        
        document.querySelectorAll('.delete-btn').forEach(button => {
            button.addEventListener('click', () => {
                const userId = button.getAttribute('data-id');
                const user = filteredUsers.find(u => u._id === userId);
                
                if (user) {
                    if (confirm(`Are you sure you want to delete ${user.name}?`)) {
                        deleteUser(userId);
                    }
                }
            });
        });
    } catch (error) {
        console.error('Error loading users:', error);
        document.getElementById('loading-users').style.display = 'none';
        document.getElementById('users-list').innerHTML = '<tr><td colspan="4">Error loading users. Please try again.</td></tr>';
    }
}

// Load reports and statistics
async function loadReports() {
    try {
        const token = localStorage.getItem('token');
        
        // Show loading indicators
        document.querySelectorAll('#reports .metric-value').forEach(el => {
            el.innerHTML = '<small>Loading...</small>';
        });
        
        // Load user statistics
        const usersResponse = await fetch('/api/users', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!usersResponse.ok) {
            throw new Error('Failed to fetch users');
        }
        
        const users = await usersResponse.json();
        
        // Count users by role
        const totalUsers = users.length;
        const totalSponsors = users.filter(user => user.role === 'Sponsor').length;
        const totalRecipients = users.filter(user => user.role === 'Recipient').length;
        
        // Load pending requests
        const requestsResponse = await fetch('/api/users/recipient-requests', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!requestsResponse.ok) {
            throw new Error('Failed to fetch recipient requests');
        }
        
        const requests = await requestsResponse.json();
        const pendingRequests = requests.filter(request => !request.status || request.status === 'pending').length;
        
        // Update statistics in UI
        document.getElementById('total-users').textContent = totalUsers;
        document.getElementById('total-sponsors').textContent = totalSponsors;
        document.getElementById('total-recipients').textContent = totalRecipients;
        document.getElementById('pending-requests').textContent = pendingRequests;
        
    } catch (error) {
        console.error('Error loading reports:', error);
    }
}

// Set up filter functionality
function setupFilters() {
    // Status filter for recipient requests
    document.getElementById('status-filter').addEventListener('change', () => {
        loadRecipientRequests();
    });
    
    // Search filter for recipient requests
    document.getElementById('search-btn').addEventListener('click', () => {
        loadRecipientRequests();
    });
    
    document.getElementById('search-requests').addEventListener('keyup', event => {
        if (event.key === 'Enter') {
            loadRecipientRequests();
        }
    });
    
    // Role filter for users
    document.getElementById('role-filter').addEventListener('change', () => {
        loadUsers();
    });
    
    // Search filter for users
    document.getElementById('search-users-btn').addEventListener('click', () => {
        loadUsers();
    });
    
    document.getElementById('search-users').addEventListener('keyup', event => {
        if (event.key === 'Enter') {
            loadUsers();
        }
    });
}

// Set up modal functionality
function setupModals() {
    // Get modal elements
    const reviewModal = document.getElementById('review-modal');
    const userModal = document.getElementById('user-modal');
    
    // Get close buttons
    const closeBtns = document.querySelectorAll('.close');
    
    // Close modal when clicking on X
    closeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            reviewModal.style.display = 'none';
            userModal.style.display = 'none';
        });
    });
    
    // Close modal when clicking outside
    window.addEventListener('click', event => {
        if (event.target === reviewModal) {
            reviewModal.style.display = 'none';
        }
        if (event.target === userModal) {
            userModal.style.display = 'none';
        }
    });
    
    // Set up approve and reject buttons in review modal
    document.getElementById('approve-btn').addEventListener('click', () => {
        const requestId = reviewModal.getAttribute('data-id');
        const notes = document.getElementById('admin-notes').value;
        updateRequestStatus(requestId, 'approved', notes);
    });
    
    document.getElementById('reject-btn').addEventListener('click', () => {
        const requestId = reviewModal.getAttribute('data-id');
        const notes = document.getElementById('admin-notes').value;
        
        if (!notes.trim()) {
            alert('Please provide a reason for rejection in the notes field.');
            return;
        }
        
        updateRequestStatus(requestId, 'rejected', notes);
    });
    
    // Set up user edit form submission
    document.getElementById('edit-user-form').addEventListener('submit', event => {
        event.preventDefault();
        
        const userId = userModal.getAttribute('data-id');
        const name = document.getElementById('edit-name').value;
        const email = document.getElementById('edit-email').value;
        const role = document.getElementById('edit-role').value;
        
        updateUser(userId, { name, email, role });
    });
    
    // Set up delete user button in user modal
    document.getElementById('delete-user-btn').addEventListener('click', () => {
        const userId = userModal.getAttribute('data-id');
        
        if (confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
            deleteUser(userId);
            userModal.style.display = 'none';
        }
    });
}

// Open review modal with request data
function openReviewModal(request) {
    const modal = document.getElementById('review-modal');
    
    // Set request data
    document.getElementById('modal-name').textContent = request.name;
    document.getElementById('modal-email').textContent = request.email;
    
    const date = new Date(request.createdAt);
    document.getElementById('modal-date').textContent = `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
    
    document.getElementById('modal-reason').textContent = request.reason || 'No reason provided';
    
    // Clear notes field
    document.getElementById('admin-notes').value = '';
    
    // Store request ID in modal
    modal.setAttribute('data-id', request._id);
    
    // Show or hide buttons based on status
    const approveBtn = document.getElementById('approve-btn');
    const rejectBtn = document.getElementById('reject-btn');
    
    if (request.status === 'approved' || request.status === 'rejected') {
        approveBtn.style.display = 'none';
        rejectBtn.style.display = 'none';
    } else {
        approveBtn.style.display = 'block';
        rejectBtn.style.display = 'block';
    }
    
    // Show modal
    modal.style.display = 'block';
}

// Open user edit modal with user data
function openUserModal(user) {
    const modal = document.getElementById('user-modal');
    
    // Set user data in form
    document.getElementById('edit-name').value = user.name;
    document.getElementById('edit-email').value = user.email;
    document.getElementById('edit-role').value = user.role;
    
    // Store user ID in modal
    modal.setAttribute('data-id', user._id);
    
    // Show modal
    modal.style.display = 'block';
}

// Update recipient request status
async function updateRequestStatus(requestId, status, notes) {
    try {
        const token = localStorage.getItem('token');
        
        const response = await fetch(`/api/users/recipient-requests/${requestId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ status, notes })
        });
        
        if (!response.ok) {
            const errorMessage = await handleErrorResponse(response, 'Failed to update request status');
            throw new Error(errorMessage);
        }
        
        // Close modal
        document.getElementById('review-modal').style.display = 'none';
        
        // Show success message
        alert(`Recipient request ${status} successfully`);
        
        // Reload requests
        loadRecipientRequests();
        
        // Reload reports if tab is active
        if (document.getElementById('reports').classList.contains('active')) {
            loadReports();
        }
    } catch (error) {
        console.error('Error updating request status:', error);
        alert(`Error: ${error.message}`);
    }
}

// Update user data
async function updateUser(userId, userData) {
    try {
        const token = localStorage.getItem('token');
        
        const response = await fetch(`/api/users/${userId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(userData)
        });
        
        if (!response.ok) {
            const errorMessage = await handleErrorResponse(response, 'Failed to update user');
            throw new Error(errorMessage);
        }
        
        // Close modal
        document.getElementById('user-modal').style.display = 'none';
        
        // Show success message
        alert('User updated successfully');
        
        // Reload users
        loadUsers();
    } catch (error) {
        console.error('Error updating user:', error);
        alert(`Error: ${error.message}`);
    }
}

// Delete user
async function deleteUser(userId) {
    try {
        const token = localStorage.getItem('token');
        
        const response = await fetch(`/api/users/${userId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            const errorMessage = await handleErrorResponse(response, 'Failed to delete user');
            throw new Error(errorMessage);
        }
        
        // Try to parse the success response as JSON if it's JSON
        let message = 'User deleted successfully';
        try {
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                const result = await response.json();
                if (result.message) {
                    message = result.message;
                }
            }
        } catch (parseError) {
            console.warn('Could not parse response as JSON, using default success message');
        }
        
        // Show success message
        alert(message);
        
        // Reload users
        loadUsers();
        
        // Reload reports if tab is active
        if (document.getElementById('reports').classList.contains('active')) {
            loadReports();
        }
    } catch (error) {
        console.error('Error deleting user:', error);
        alert(`Error: ${error.message}`);
    }
}
