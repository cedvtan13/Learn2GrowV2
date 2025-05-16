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
    
    try {
      const currentUser = getCurrentUser();
      if (!currentUser || !currentUser.token) {
        formStatus.textContent = 'You must be logged in to post.';
        return;
      }
      
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
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create post');
      }
      
      const newPost = await response.json();
      
      // After successfully posting to the database, update the UI
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
    postElement.querySelector('.post-author').textContent = post.author.name;
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
    if (amountGoal) amountGoal.textContent = `of ₱${post.targetAmount.toLocaleString()}`;
    
    // QR code for donations
    const qrCode = postElement.querySelector('.qr-code');
    if (qrCode && post.qrCodeUrl) {
      qrCode.src = post.qrCodeUrl;
    }
    
    // Add post ID as data attribute for reference
    postElement.dataset.postId = post._id;
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
function initializePostsFunctionality() {
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
    
    const currentUser = getCurrentUser();
    if (!currentUser || !currentUser.token) {
      throw new Error('Authentication required');
    }
    
    const response = await fetch('/api/posts', {
      headers: {
        'Authorization': `Bearer ${currentUser.token}`
      }
    });
    
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
      displayNewPost(post, currentUser);
    });
    
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

// Initialize when DOM content is loaded
document.addEventListener('DOMContentLoaded', () => {
  if (window.location.pathname.includes('posts.html')) {
    initializePostsFunctionality();
  }
});
