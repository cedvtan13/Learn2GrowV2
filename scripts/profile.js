// scripts/profile.js

document.addEventListener('DOMContentLoaded', function() {
    // DOM elements
    const profileForm = document.getElementById('profile-form');
    const profileImage = document.getElementById('profile-image');
    const uploadBtn = document.getElementById('upload-trigger');
    const fileInput = document.getElementById('profile-pic-upload');
    const nameInput = document.getElementById('profile-name');
    const emailInput = document.getElementById('profile-email');
    const passwordInput = document.getElementById('current-password');
    const newPasswordInput = document.getElementById('new-password');
    const confirmPasswordInput = document.getElementById('confirm-password');
    const togglePasswordFields = document.getElementById('toggle-password-fields');
    const passwordFields = document.querySelector('.password-fields');
    
    // Load user data
    loadUserData();
    
    // Event listener for profile picture upload
    uploadBtn.addEventListener('click', function() {
        fileInput.click();
    });
    
    // Event listener for file input change
    fileInput.addEventListener('change', handleProfilePictureChange);
    
    // Toggle password fields visibility
    togglePasswordFields.addEventListener('click', function() {
        if (passwordFields.style.display === 'none') {
            passwordFields.style.display = 'block';
            togglePasswordFields.querySelector('i').classList.remove('bx-chevron-down');
            togglePasswordFields.querySelector('i').classList.add('bx-chevron-up');
        } else {
            passwordFields.style.display = 'none';
            togglePasswordFields.querySelector('i').classList.remove('bx-chevron-up');
            togglePasswordFields.querySelector('i').classList.add('bx-chevron-down');
        }
    });
    
    // Form submission
    profileForm.addEventListener('submit', handleProfileUpdate);
      // Function to load user data
    async function loadUserData() {
        try {
            // Get current user from localStorage
            const userData = localStorage.getItem('currentUser');
            if (!userData) {
                window.location.href = 'index.html'; // Redirect to login if not logged in
                return;
            }
            
            const user = JSON.parse(userData);
            const token = user.token;
            
            // Populate form fields with user data
            nameInput.value = user.name || '';
            emailInput.value = user.email || '';
            emailInput.disabled = true; // Email cannot be changed
            
            // Set profile picture if available
            if (user.profile && user.profile.profilePicture) {
                profileImage.src = user.profile.profilePicture;
            }
            
            // Fetch latest user data from server
            try {
                const response = await fetch(`/api/users/${user._id}`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
                  if (response.ok) {
                    const latestUserData = await response.json();
                    
                    // Update form fields with latest data
                    nameInput.value = latestUserData.name || '';
                    
                    // Update profile picture if available
                    if (latestUserData.profile && latestUserData.profile.profilePicture) {
                        profileImage.src = latestUserData.profile.profilePicture;
                    }
                    
                    // Update localStorage with latest user data
                    const updatedUser = {
                        ...user,
                        name: latestUserData.name,
                        profile: latestUserData.profile
                    };
                    localStorage.setItem('currentUser', JSON.stringify(updatedUser));
                } else {
                    console.log('Could not fetch latest user data, using stored data instead');
                }
            } catch (fetchError) {
                console.error('Error fetching user data:', fetchError);
                // Continue with localStorage data if fetch fails
                console.log('Using existing user data from localStorage');
            }
        } catch (error) {
            console.error('Error loading user data:', error);
            showNotification('Error loading profile data. Please try again.', 'error');
        }
    }
    
    // Function to handle profile picture change
    function handleProfilePictureChange(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        // Validate file type
        const validImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!validImageTypes.includes(file.type)) {
            showNotification('Please select a valid image file (JPEG, PNG, GIF, WEBP).', 'error');
            return;
        }
        
        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            showNotification('Image size should be less than 5MB.', 'error');
            return;
        }
        
        // Create a preview of the image
        const reader = new FileReader();
        reader.onload = function(e) {
            profileImage.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
    
    // Function to handle profile update
    async function handleProfileUpdate(event) {
        event.preventDefault();
        
        try {
            // Get form values
            const name = nameInput.value.trim();
            const currentPassword = passwordInput.value;
            const newPassword = newPasswordInput.value;
            const confirmPassword = confirmPasswordInput.value;
            
            // Validate name
            if (!name) {
                showNotification('Name is required.', 'error');
                return;
            }
            
            // Get current user from localStorage
            const userData = localStorage.getItem('currentUser');
            if (!userData) {
                window.location.href = 'index.html'; // Redirect to login if not logged in
                return;
            }
            
            const user = JSON.parse(userData);
            const token = user.token;
            
            // Check if password is being changed
            let passwordChangeData = null;
            if (newPassword) {
                // Validate password requirements
                if (newPassword.length < 8) {
                    showNotification('Password must be at least 8 characters long.', 'error');
                    return;
                }
                
                // Validate password confirmation
                if (newPassword !== confirmPassword) {
                    showNotification('Passwords do not match.', 'error');
                    return;
                }
                
                // Password change requires current password
                if (!currentPassword) {
                    showNotification('Current password is required to set a new password.', 'error');
                    return;
                }
                
                passwordChangeData = {
                    currentPassword,
                    newPassword
                };
            }
            
            // Prepare profile update data
            const updateData = {
                name: name
            };
            
            // Add profile picture if changed
            if (fileInput.files.length > 0) {
                const file = fileInput.files[0];
                updateData.profilePicture = profileImage.src; // Base64 data URL
            }
              // Send profile update request
            try {
                const updateResponse = await fetch('/api/users/profile/update', {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(updateData)
                });
                
                if (!updateResponse.ok) {
                    const errorData = await updateResponse.json();
                    throw new Error(errorData.message || 'Failed to update profile');
                }
            
            const updatedUserData = await updateResponse.json();
            
            // Update localStorage with new user data
            const updatedUser = {
                ...user,
                name: updatedUserData.name,
                profile: updatedUserData.profile
            };
            localStorage.setItem('currentUser', JSON.stringify(updatedUser));
            
            // Handle password change if needed
            if (passwordChangeData) {
                const passwordResponse = await fetch('/api/users/change-password', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(passwordChangeData)
                });
                
                if (!passwordResponse.ok) {
                    const errorData = await passwordResponse.json();
                    throw new Error(errorData.message || 'Failed to update password');
                }
                
                // Clear password fields after successful update
                passwordInput.value = '';
                newPasswordInput.value = '';
                confirmPasswordInput.value = '';
                passwordFields.style.display = 'none';
            }
            
            // Show success notification
            showNotification('Profile updated successfully!', 'success');
            
            // Reload user data to ensure UI is updated
            loadUserData();
            
        } catch (error) {
            console.error('Error updating profile:', error);
            showNotification(error.message || 'Error updating profile. Please try again.', 'error');
        }
    }
    
    // Function to show notifications
    function showNotification(message, type = 'info') {
        // Check if notification container exists, create if not
        let notificationContainer = document.querySelector('.notification-container');
        if (!notificationContainer) {
            notificationContainer = document.createElement('div');
            notificationContainer.className = 'notification-container';
            document.body.appendChild(notificationContainer);
        }
        
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span>${message}</span>
                <button class="notification-close"><i class='bx bx-x'></i></button>
            </div>
        `;
        
        // Add to container
        notificationContainer.appendChild(notification);
        
        // Add event listener for close button
        notification.querySelector('.notification-close').addEventListener('click', function() {
            notification.remove();
        });
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            notification.remove();
        }, 5000);
    }
});
