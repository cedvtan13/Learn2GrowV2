// Debug helper to show the current authentication status
function debugAuthStatus() {
  const currentUser = getCurrentUser();
  const isAuthenticated = currentUser && currentUser.token;
  
  console.log('======= Auth Debug Info =======');
  console.log('Is authenticated:', isAuthenticated);
  if (currentUser) {
    console.log('User:', currentUser.name);
    console.log('Email:', currentUser.email);
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
      formStatus.textContent = `Ready to post as ${currentUser.name}`;
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
      authStatusText.textContent = `Logged in as ${currentUser.name}`;
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
      try {      // Get current user data or create debug user if needed
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
          return;
        }
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
      
      // Clear the status message after 3 seconds
      setTimeout(() => {
        formStatus.textContent = '';
      }, 3000);
      
    } catch (err) {
      console.error('Error creating post:', err);
      formStatus.textContent = `Error: ${err.message || 'Something went wrong'}`;
      formStatus.style.color = 'red';
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
    postElement.dataset.postId = post._id;
      // Set up the message button to link to the author
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
        
        // Hide message button if the post is from the current user
        if (currentUser && (currentUser._id === authorId)) {
          messageBtn.style.display = 'none';
        }
      } else {
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
  
  // Handle modal close buttons
  document.querySelectorAll('.close-modal').forEach(closeBtn => {
    closeBtn.addEventListener('click', function() {
      this.closest('.donation-modal').style.display = 'none';
    });
  });
}

// Initialize when DOM content is loaded
document.addEventListener('DOMContentLoaded', () => {
  if (window.location.pathname.includes('posts.html')) {
    initializePostsFunctionality();
  }
});
