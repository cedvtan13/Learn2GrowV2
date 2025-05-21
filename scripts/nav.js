// Navigation menu functionality
document.addEventListener('DOMContentLoaded', function() {
    // Toggle mobile menu functionality
    const menuToggle = document.getElementById('menu-toggle');
    const navMenu = document.getElementById('nav-menu');
    
    if (menuToggle && navMenu) {
        menuToggle.addEventListener('click', function() {
            navMenu.classList.toggle('active');
        });
    }

    // Check if user is logged in and get user data
    const token = localStorage.getItem('token');
    
    if (token) {
        // Fetch user profile to get role
        fetch('/api/users/profile', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch user data');
            }
            return response.json();
        })        .then(user => {
            // Show/hide admin link based on role
            const adminLinkInNav = document.querySelector('a[href="/admin.html"]') || 
                                  document.querySelector('a[href="admin.html"]');
            
            if (adminLinkInNav) {
                if (user.role === 'Admin') {
                    adminLinkInNav.style.display = 'inline-block';
                } else {
                    adminLinkInNav.style.display = 'none';
                }
            }
        })
        .catch(error => {
            console.error('Error fetching user data:', error);
        });
    }

    // Logout functionality
    const logoutBtn = document.getElementById('logout-btn');
    
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            // Clear local storage
            localStorage.removeItem('token');
            localStorage.removeItem('userId');
            
            // Redirect to login page
            window.location.href = '/';
        });
    }
});
