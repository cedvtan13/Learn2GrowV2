// Debug helper to show the current authentication status
function debugAuthStatus() {
  const currentUser = getCurrentUser();
  const isAuthenticated = currentUser && currentUser.token;
  
  console.log('======= Auth Debug Info =======');
  console.log('Is authenticated:', isAuthenticated);
  if (currentUser) {
    console.log('User:', currentUser.name);
    console.log('Email:', currentUser.email);
    console.log('Role:', currentUser.role);
    console.log('Token exists:', !!currentUser.token);
    if (currentUser.token) {
      console.log('Token preview:', currentUser.token.substring(0, 20) + '...');
    } else {
      console.log('No token available');
    }
  } else {
    console.log('No current user data');
  }
  console.log('=============================');
  
  // Update visual indicators on the page
  const formStatus = document.getElementById('form-status');
  const authIndicator = document.getElementById('auth-indicator');
  const authStatusText = document.getElementById('auth-status-text');
  
  // Update form status
  if (formStatus) {
    if (isAuthenticated) {
      formStatus.textContent = `Ready to post as ${currentUser.name} (${currentUser.role})`;
      formStatus.style.color = 'green';
    } else {
      formStatus.textContent = 'Not logged in or token missing';
      formStatus.style.color = 'red';
    }
  }
  
  // Update authentication indicator
  if (authIndicator) {
    authIndicator.className = 'auth-status-indicator ' + 
      (isAuthenticated ? 'authenticated' : 'not-authenticated');
  }
  
  // Update authentication status text
  if (authStatusText) {
    if (isAuthenticated) {
      authStatusText.textContent = `Logged in as ${currentUser.name} (${currentUser.role})`;
      authStatusText.style.color = 'green';
    } else {
      authStatusText.textContent = 'Not authenticated';
      authStatusText.style.color = 'red';
    }
  }
    // If not authenticated, redirect to login page
  if (!isAuthenticated && window.auth && typeof window.auth.requireAuthentication === 'function') {
    console.log('Not authenticated, redirecting to login page');
    window.auth.requireAuthentication();
  }
}

// Additional functionality for posts

// Handle image uploads - uses either direct API upload or base64 encoding
function handleFileUpload(fileInput) {
  return new Promise((resolve, reject) => {
    if (!fileInput.files || fileInput.files.length === 0) {
      resolve(null);
      return;
    }
    
    const file = fileInput.files[0];
    
    // For larger files, use the upload endpoint
    if (file.size > 500000) { // > 500KB
      const formData = new FormData();
      formData.append('image', file);
      
      // Get currentUser token
      const currentUser = getCurrentUser();
      if (!currentUser || !currentUser.token) {
        reject(new Error('Authentication required for file upload'));
        return;
      }
      
      // Upload via API
      fetch('/api/posts/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${currentUser.token}`
        },
        body: formData
      })
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to upload file');
        }
        return response.json();
      })
      .then(data => {
        resolve(data.fileUrl);
      })
      .catch(error => {
        // Fall back to base64 if API upload fails
        console.warn('API upload failed, falling back to base64:', error);
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => reject(e);
        reader.readAsDataURL(file);
      });
    } else {
      // For smaller files, use base64 encoding
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (e) => reject(e);
      reader.readAsDataURL(file);
    }
  });
}

// Show preview of uploaded images
function setupImagePreviews() {
  const postImage = document.getElementById('post-image');
  const gcashQR = document.getElementById('gcash-qr');
  const imagePreviewContainer = document.getElementById('imagePreviewContainer');
  const qrPreviewContainer = document.getElementById('qrPreviewContainer');
  
  if (postImage) {
    postImage.addEventListener('change', async () => {
      try {
        const imageUrl = await handleFileUpload(postImage);
        if (imageUrl && imagePreviewContainer) {
          imagePreviewContainer.innerHTML = `<img src="${imageUrl}" alt="Preview" class="image-preview">`;
        }
      } catch (err) {
        console.error('Error previewing image:', err);
      }
    });
  }
  
  if (gcashQR) {
    gcashQR.addEventListener('change', async () => {
      try {
        const qrUrl = await handleFileUpload(gcashQR);
        if (qrUrl && qrPreviewContainer) {
          qrPreviewContainer.innerHTML = `<img src="${qrUrl}" alt="QR Preview" class="qr-preview">`;
        }
      } catch (err) {
        console.error('Error previewing QR:', err);
      }
    });
  }
}

// Setup form submission with API integration
function setupPostForm() {
  const storyForm = document.getElementById('storyForm');
  if (!storyForm) return;
  
  storyForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formStatus = document.getElementById('form-status');
    formStatus.textContent = 'Submitting your post...';
    
    // Temporarily disable form elements while submitting to prevent double submissions
    const formElements = storyForm.querySelectorAll('button, input, textarea, select');
    formElements.forEach(element => {
      element.disabled = true;
    });
    
    try {
      // Get current user data or create debug user if needed
      let currentUser = getCurrentUser();
      console.log('Current user data:', currentUser);
      
      // If no valid user or token, try to use the debug tools
      if (!currentUser || !currentUser.token) {
        console.log('Missing user or token, attempting to create debug user');
        
        // Try to use auth debug if available
        if (window.authDebug && typeof window.authDebug.ensureValidToken === 'function') {
          window.authDebug.ensureValidToken();
          currentUser = getCurrentUser(); // Refresh after creating debug user
          console.log('Debug user created:', currentUser);
        }
        
        // If still no valid user/token, show error
        if (!currentUser || !currentUser.token) {
          console.error('Unable to create valid user session');
          formStatus.textContent = 'You must be logged in to post.';
          formStatus.style.color = 'red';
          
          // Re-enable form elements
          enableFormElements();
          return;
        }
      }
      
      // Check if user is a Recipient (only Recipients can post)
      if (currentUser.role !== 'Recipient' && currentUser.role !== 'Admin') {
        console.error('User does not have permission to create posts');
        formStatus.textContent = 'Only Recipients can create posts.';
        formStatus.style.color = 'red';
        
        // Re-enable form elements
        formElements.forEach(element => {
          element.disabled = false;
        });
        return;
      }
      
      console.log('Token available:', currentUser.token.substring(0, 20) + '...');
      
      const title = document.getElementById('post-title').value;
      const content = document.getElementById('post-content').value;
      const targetAmount = document.getElementById('target-amount').value;
      
      // Convert uploaded files to base64
      const imageUrl = await handleFileUpload(document.getElementById('post-image'));
      const qrCodeUrl = await handleFileUpload(document.getElementById('gcash-qr'));
      
      // Send post to API
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentUser.token}`
        },
        body: JSON.stringify({
          title,
          content,
          targetAmount: parseFloat(targetAmount) || 0,
          imageUrl,
          qrCodeUrl
        })
      });
        if (!response.ok) {
        let errorMessage = 'Failed to create post';
        try {
          // Try to parse the error response as JSON
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (parseError) {
          // If the response isn't valid JSON, get the status text
          console.error('Error parsing error response:', parseError);
          errorMessage = `Server error: ${response.status} ${response.statusText}`;
          
          // If it's a payload size error (413), provide a specific message
          if (response.status === 413) {
            errorMessage = 'Your post or images are too large. Try using smaller images or less content.';
          }
        }
        throw new Error(errorMessage);
      }
      
      const newPost = await response.json();      // After successfully posting to the database, update the UI
      // Ensure the new post has proper author info for the current user
      if (newPost && !newPost.author && currentUser) {
        newPost.author = {
          _id: currentUser._id,
          name: currentUser.name,
          email: currentUser.email
        };
      }
        displayNewPost(newPost, currentUser);
      
      // Reset form fields
      storyForm.reset();
      document.getElementById('imagePreviewContainer').innerHTML = '';
      document.getElementById('qrPreviewContainer').innerHTML = '';
      
      formStatus.textContent = 'Your story has been successfully posted!';
      formStatus.style.color = 'green';
      
      // Re-enable form elements
      enableFormElements();      // Clear the status message and reload the page after brief delay
      setTimeout(() => {
        formStatus.textContent = '';
        // Reload the page after success message is shown
        window.location.reload();
      }, 500);
      
    } catch (err) {
      console.error('Error creating post:', err);
      formStatus.textContent = `Error: ${err.message || 'Something went wrong'}`;
      formStatus.style.color = 'red';
      
      // Re-enable form elements even if there's an error
      enableFormElements();
    }
  });
}

// Format date
function formatDate(dateString) {
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(dateString).toLocaleDateString(undefined, options);
}

// Display a new post in the UI
function displayNewPost(post, currentUser) {
  const postsContainer = document.getElementById('postsContainer');
  const noPostsMessage = document.getElementById('no-posts-message');
  
  if (!postsContainer) return;
  
  if (noPostsMessage) {
    noPostsMessage.style.display = 'none';
  }
  
  // Create the post element using either a template or direct DOM creation
  let postElement;
  const postTemplate = document.getElementById('post-template');
    if (postTemplate) {
    // Use the template if available
    postElement = document.importNode(postTemplate.content, true).querySelector('.post-card');
    
    // Fill in the post data
    // Handle author name - it might be nested as author.name or it might be a plain ID
    if (post.author) {
      if (post.author.name) {
        // If author object is populated
        postElement.querySelector('.post-author').textContent = post.author.name;
      } else if (currentUser && currentUser.name) {
        // Fallback to current user name
        postElement.querySelector('.post-author').textContent = currentUser.name;
      } else {
        // Fallback to Debug User
        postElement.querySelector('.post-author').textContent = "Debug User";
      }
    } else {
      // If author is completely missing
      postElement.querySelector('.post-author').textContent = "Unknown User";
    }
    
    postElement.querySelector('.post-date').textContent = formatDate(post.createdAt);
    postElement.querySelector('.post-title').textContent = post.title;
    postElement.querySelector('.post-content p').textContent = post.content;
      // Handle image if available
    const postImage = postElement.querySelector('.post-image');
    if (post.imageUrl && postImage) {
      postImage.src = post.imageUrl;
      postImage.style.display = 'block';
      postImage.classList.add('clickable-image');
      postImage.setAttribute('data-title', post.title);
      postImage.addEventListener('click', expandImage);
    } else if (postImage) {
      postImage.style.display = 'none';
    }
    
    // Update donation stats
    const progress = postElement.querySelector('.progress');
    const amountRaised = postElement.querySelector('.amount-raised');
    const amountGoal = postElement.querySelector('.amount-goal');
    
    if (progress && post.targetAmount > 0) {
      const percentage = (post.amountRaised / post.targetAmount) * 100;
      progress.style.width = `${Math.min(percentage, 100)}%`;
    }
    
    if (amountRaised) amountRaised.textContent = `₱${post.amountRaised.toLocaleString()}`;
    if (amountGoal) amountGoal.textContent = `of ₱${post.targetAmount.toLocaleString()}`;    // QR code for donations
    const qrCode = postElement.querySelector('.qr-code');
    if (qrCode && post.qrCodeUrl) {
      qrCode.src = post.qrCodeUrl;
    }
    
    // Store QR code URL as data attribute for donate button to use
    if (post.qrCodeUrl) {
      postElement.setAttribute('data-qrcode', post.qrCodeUrl);
    }
      // Add post ID as data attribute for reference
    postElement.dataset.postId = post._id;    // Set up the message button to link to the author
    const messageBtn = postElement.querySelector('.message-btn');
    if (messageBtn) {
      let authorId = null;
      
      // Handle different author formats (could be an object with _id, a string ID, or missing)
      if (post.author) {
        if (typeof post.author === 'object' && post.author._id) {
          // Author is an object with _id
          authorId = post.author._id;
        } else if (typeof post.author === 'string') {
          // Author is just the ID string
          authorId = post.author;
        } else if (typeof post.author === 'object' && post.author.id) {
          // Some systems use .id instead of ._id
          authorId = post.author.id;
        }
      }
        if (authorId) {
        messageBtn.setAttribute('onclick', `startConversation('${authorId}')`);
        messageBtn.dataset.userId = authorId;
        messageBtn.style.display = 'inline-flex'; // Make sure it's visible
        
        // Handle delete button visibility based on roles and ownership
        const deleteBtn = postElement.querySelector('.delete-btn');
        if (deleteBtn) {
          // Show delete button for:
          // 1. User's own posts (any role)
          // 2. Admin users for any post
          const isOwnPost = currentUser && (currentUser._id === authorId);
          const isAdmin = currentUser && currentUser.role === 'Admin';
          
          if (isOwnPost || isAdmin) {
            deleteBtn.style.display = 'inline-flex';
            deleteBtn.dataset.postId = post._id;
          } else {
            deleteBtn.style.display = 'none';
          }
        }
        
        // Hide message button if the post is from the current user
        if (currentUser && (currentUser._id === authorId)) {
          messageBtn.style.display = 'none';
        }
      }else {
        // If no valid author ID found, hide the message button
        messageBtn.style.display = 'none';
      }
    }
  } else {
    // Fallback to direct DOM creation if template is not available
    postElement = document.createElement('div');
    postElement.className = 'post-card';
    postElement.dataset.postId = post._id;
    
    // Create post content (simplified version)
    postElement.innerHTML = `
      <h3>${post.title}</h3>
      <p>By: ${post.author.name}</p>
      <p>${post.content}</p>
      <p>Target: ₱${post.targetAmount}</p>
    `;
  }
  
  // Add the post to the container
  postsContainer.prepend(postElement);
}

// Initialize posts functionality
async function initializePostsFunctionality() {
  // Try to refresh token if needed
  if (window.auth && typeof window.auth.refreshTokenIfNeeded === 'function') {
    await window.auth.refreshTokenIfNeeded();
  }
  
  // Get current user data
  const currentUser = getCurrentUser();
  const isAuthenticated = currentUser && currentUser.token;
  
  // Determine if user is a Recipient (can post) or Sponsor (can only view)
  const userRole = currentUser ? currentUser.role : null;
  const canCreatePosts = userRole === 'Recipient' || userRole === 'Admin';
  
  // Get references to UI elements
  const postsContent = document.getElementById('posts-content');
  const authRequired = document.getElementById('auth-required');
  const postCreationSection = document.querySelector('.post-creation');
  
  // Handle authentication state
  if (isAuthenticated) {
    // User is logged in
    if (postsContent) postsContent.style.display = 'block';
    if (authRequired) authRequired.style.display = 'none';
    
    // Show/hide post creation based on role
    if (postCreationSection) {
      if (canCreatePosts) {
        postCreationSection.style.display = 'block';
      } else {
        // Hide the post creation form for sponsors
        postCreationSection.style.display = 'none';
        
        // Add a message explaining that sponsors can't create posts
        // First, check if we've already added the message
        const existingSponsorMessage = document.querySelector('.sponsor-message');        if (!existingSponsorMessage) {
          const sponsorMessage = document.createElement('div');
          sponsorMessage.className = 'sponsor-message';
          sponsorMessage.innerHTML = `
            <h3>Welcome, Sponsor!</h3>
          `;
          // Insert at the beginning of posts-content
          postsContent.insertBefore(sponsorMessage, postsContent.firstChild);
          
          // Remove the element completely after animation ends (6 seconds total)
          setTimeout(() => {
            if (sponsorMessage.parentNode) {
              sponsorMessage.parentNode.removeChild(sponsorMessage);
            }
          }, 6000);
        }
      }
    }
  } else {
    // User is not logged in
    if (postsContent) postsContent.style.display = 'none';
    if (authRequired) authRequired.style.display = 'block';
  }
  
  debugAuthStatus();
  setupImagePreviews();
  setupPostForm();
  loadPosts();
}

// Load posts from API
async function loadPosts() {
  const postsContainer = document.getElementById('postsContainer');
  const noPostsMessage = document.getElementById('no-posts-message');
  const loadingIndicator = document.createElement('div');
  
  if (!postsContainer) return;
  
  try {
    loadingIndicator.textContent = 'Loading posts...';
    postsContainer.appendChild(loadingIndicator);
    
    // Get current user, but don't require authentication for viewing posts
    const currentUser = getCurrentUser();
    
    // Make the API request without requiring authentication
    const response = await fetch('/api/posts');
    
    if (!response.ok) {
      throw new Error('Failed to load posts');
    }
      const posts = await response.json();
    
    // Remove loading indicator
    postsContainer.removeChild(loadingIndicator);
    
    if (posts.length === 0 && noPostsMessage) {
      noPostsMessage.style.display = 'block';
      return;
    }
    
    if (noPostsMessage) {
      noPostsMessage.style.display = 'none';
    }
      // Display each post
    posts.forEach(post => {
      console.log('Post author info:', post.author);
      
      // Ensure post has valid author info for messaging
      if (!post.author || (typeof post.author === 'object' && !post.author._id)) {
        // If there's an issue with the author object, try to fix it
        console.warn('Post has missing or invalid author info:', post._id);
      }
      
      displayNewPost(post, currentUser);
    });
    
    // Add donation and interaction handlers after posts are loaded
    setupPostInteractions(currentUser);
    
  } catch (err) {
    console.error('Error loading posts:', err);
    loadingIndicator.textContent = `Error: ${err.message}`;
    loadingIndicator.style.color = 'red';
  }
}

// Get current user with token from localStorage
function getCurrentUser() {
  const userData = localStorage.getItem('currentUser');
  return userData ? JSON.parse(userData) : null;
}

// Setup post interactions based on authentication status
function setupPostInteractions(currentUser) {
  const donateButtons = document.querySelectorAll('.donate-btn');
  const shareButtons = document.querySelectorAll('.share-btn');
  const deleteButtons = document.querySelectorAll('.delete-btn:not(.event-bound)');
  const qrCodes = document.querySelectorAll('.qr-code:not(.clickable-image)');
  
  // Add click handlers to all QR codes
  qrCodes.forEach(qrCode => {
    if (qrCode.src) {
      qrCode.classList.add('clickable-image');
      qrCode.setAttribute('data-title', 'Donation QR Code');
      qrCode.addEventListener('click', expandImage);
    }
  });
    // Handle donate buttons
  donateButtons.forEach(button => {
    button.addEventListener('click', function(e) {
      const postCard = this.closest('.post-card');
      const postId = postCard.dataset.postId;
      
      if (!currentUser) {
        // Prompt login for donation
        alert('Please log in to donate to this story');
        window.location.href = 'index.html';
        return;
      }
      
      // Show donation modal for authenticated users
      const modal = postCard.querySelector('.donation-modal');
      if (modal) {
        // Set the modal title
        const modalTitle = modal.querySelector('h3');
        if (modalTitle) {
          const authorName = postCard.querySelector('.post-author').textContent || 'this story';
          modalTitle.textContent = `Donate to ${authorName}`;
        }
          // Ensure QR code is displayed if available
        const qrImg = modal.querySelector('.qr-code');
        if (qrImg && qrImg.getAttribute('src') === '') {
          // Find the QR code URL from post data
          const qrCodeUrl = postCard.getAttribute('data-qrcode');
          if (qrCodeUrl) {
            qrImg.src = qrCodeUrl;
          }
        }
        
        // Make the QR code clickable to expand
        if (qrImg && !qrImg.classList.contains('clickable-image')) {
          qrImg.classList.add('clickable-image');
          qrImg.setAttribute('data-title', `${modalTitle ? modalTitle.textContent : 'Donation'} QR Code`);
          qrImg.addEventListener('click', expandImage);
        }
        
        modal.style.display = 'flex';
      }
    });
  });
  
  // Handle share buttons
  shareButtons.forEach(button => {
    button.addEventListener('click', function(e) {
      const postCard = this.closest('.post-card');
      const postId = postCard.dataset.postId;
      
      // Share functionality works for everyone
      // Create a share URL with the post ID
      const shareUrl = `${window.location.origin}${window.location.pathname}?post=${postId}`;
      
      // Use the Web Share API if available
      if (navigator.share) {
        navigator.share({
          title: 'Check out this story on Learn 2 Grow',
          text: 'I found this story on Learn 2 Grow that you might be interested in.',
          url: shareUrl
        })
        .catch(err => {
          console.error('Error sharing:', err);
          fallbackShare();
        });
      } else {
        fallbackShare();
      }
      
      function fallbackShare() {
        // Fallback to clipboard copy
        navigator.clipboard.writeText(shareUrl)
          .then(() => alert('Link copied to clipboard: ' + shareUrl))
          .catch(() => prompt('Copy this link to share:', shareUrl));
      }
    });
  });
  // Handle delete buttons
  deleteButtons.forEach(button => {
    button.addEventListener('click', function(e) {
      const postCard = this.closest('.post-card');
      const postId = postCard.dataset.postId;
      
      if (!currentUser || !currentUser.token) {
        alert('You must be logged in to delete posts');
        return;
      }
      
      // Check if the user is an Admin or the author of the post
      const isAdmin = currentUser.role === 'Admin';
      const authorElement = postCard.querySelector('.post-author');
      const authorName = authorElement ? authorElement.textContent : '';
      const isAuthor = authorName === currentUser.name;
      
      if (!isAdmin && !isAuthor) {
        alert('You do not have permission to delete this post');
        return;
      }
      
      if (confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
        deletePost(postId, currentUser.token, postCard);
      }
    });
    
    // Mark button as having event listener bound
    button.classList.add('event-bound');
  });
  
  // Handle modal close buttons
  document.querySelectorAll('.close-modal').forEach(closeBtn => {
    closeBtn.addEventListener('click', function() {
      this.closest('.donation-modal').style.display = 'none';
    });
  });
}

// Function to delete a post
async function deletePost(postId, token, postElement) {
  try {
    const response = await fetch(`/api/posts/${postId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Server error: ${response.status}`);
    }
    
    // Remove the post from the UI
    if (postElement && postElement.parentNode) {
      postElement.parentNode.removeChild(postElement);
    }
    
    // Show a success message
    alert('Post deleted successfully');
    
    // Check if there are no posts left and show the "no posts" message if needed
    const postsContainer = document.getElementById('postsContainer');
    const noPostsMessage = document.getElementById('no-posts-message');
    
    if (postsContainer && postsContainer.children.length === 0 && noPostsMessage) {
      noPostsMessage.style.display = 'block';
    }
  } catch (err) {
    console.error('Error deleting post:', err);
    alert(`Error deleting post: ${err.message || 'Something went wrong'}`);
  }
}

// Initialize when DOM content is loaded
document.addEventListener('DOMContentLoaded', () => {
  if (window.location.pathname.includes('posts.html')) {
    initializePostsFunctionality();
    
    // Add click handler for the image modal close button
    const closeModal = document.querySelector('.close-image-modal');
    if (closeModal) {
      closeModal.addEventListener('click', closeImageModal);
    }
    
    // Close image modal when clicking outside the image
    const imageModal = document.getElementById('imageModal');
    if (imageModal) {
      imageModal.addEventListener('click', function(event) {
        if (event.target === imageModal) {
          closeImageModal();
        }
      });
    }
  }
});

// Function to handle expanding images when clicked
function expandImage() {
  const modal = document.getElementById('imageModal');
  const modalImg = document.getElementById('expandedImage');
  const captionText = document.getElementById('imageModalCaption');
  
  // Set the modal image source and caption
  modalImg.src = this.src;
  
  // Use the data-title attribute if available, otherwise use the alt text
  const caption = this.getAttribute('data-title') || this.alt || 'Image';
  captionText.innerHTML = caption;
  
  // Display the modal
  modal.style.display = 'flex';
  
  // Add a small delay before adding the visible class for animation
  setTimeout(() => {
    modal.classList.add('visible');
  }, 10);
  
  // Add keyboard support for closing the modal with Escape key
  document.addEventListener('keydown', function closeOnEscape(e) {
    if (e.key === 'Escape') {
      closeImageModal();
      document.removeEventListener('keydown', closeOnEscape);
    }
  });
  
  // Prevent scrolling of background content
  document.body.style.overflow = 'hidden';
}

// Function to close the image modal
function closeImageModal() {
  const modal = document.getElementById('imageModal');
  modal.classList.remove('visible');
  
  // Wait for transition to complete before hiding the modal
  setTimeout(() => {
    modal.style.display = 'none';
  }, 300);
  
  // Re-enable scrolling and form elements
  document.body.style.overflow = '';
  
  // Use the enableFormElements function from form-utilities.js if available
  if (typeof enableFormElements === 'function') {
    enableFormElements();
  }
}
