console.log('📝 script.js loaded');

async function loadPosts() {
  console.log('🔄 loadPosts() called');

  const container = document.getElementById('postsContainer');
  if (!container) {
    console.error('❌ <div id="postsContainer"> not found in DOM');
    return;
  }

  // Fetch from your backend
  try {
    const res   = await fetch('/api/posts');
    const posts = await res.json();
    console.log('📬 fetched posts:', posts);

    // Clear any old content
    container.innerHTML = '';

    // Render each post
    posts.forEach(post => {
      const el = document.createElement('div');
      el.className = 'post';
      el.innerHTML = `
        <h3>${post.title || 'Untitled'}</h3>
        <p>${post.content}</p>
        <small>by ${post.author.name} on ${new Date(post.createdAt).toLocaleString()}</small>
      `;
      container.appendChild(el);
    });

  } catch (err) {
    console.error('❌ loadPosts error:', err);
  }
}

document.addEventListener('DOMContentLoaded', function() {
  const logregBox = document.querySelector('.logreg-box');
  const loginLink = document.querySelector('.login-link');
  const registerLink = document.querySelector('.register-link');
  const authMessage = document.getElementById('auth-message');
  const isAuthenticated = checkAuthentication();
  
  
  // Login/Register toggle functionality
  if (loginLink) {
    loginLink.addEventListener('click', (e) => {
      e.preventDefault();
      logregBox.classList.remove('active');
    });
  }

  if (registerLink) {
    registerLink.addEventListener('click', (e) => {
      e.preventDefault();
      logregBox.classList.add('active');
    });
  }
  
  // Update navbar with profile dropdown if logged in
  updateNavbar(isAuthenticated);
  
  // Check for "Remember Me" on page load
  const rememberMe = localStorage.getItem('rememberMe') === 'true';
  if (rememberMe && !isAuthenticated) {
    const rememberedUser = JSON.parse(localStorage.getItem('rememberedUser'));
    if (rememberedUser) {
      const loginEmailField = document.getElementById('login-email');
      if (loginEmailField) {
        loginEmailField.value = rememberedUser.email;
        // Pre-check the remember me checkbox
        const rememberMeCheckbox = document.querySelector('#remember-me');
        if (rememberMeCheckbox) {
          rememberMeCheckbox.checked = true;
        }
      }
    }
  }
  
  // Form validation functions
  function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  function validatePassword(password) {
    // Password must be at least 8 characters with at least one number and one letter
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
    return passwordRegex.test(password);
  }

  // Handle login form submission with validation
  const loginForm = document.getElementById('login-form');
if (loginForm) {
  loginForm.addEventListener('submit', async e => {
    e.preventDefault();
    const email    = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    try {
      const res  = await fetch('/api/users/login', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      // save token + user for later
      localStorage.setItem('token',    data.token);
      localStorage.setItem('currentUser', JSON.stringify({
        _id:   data._id,
        name:  data.name,
        email: data.email,
        role:  data.role
      }));

      window.location.href = 'posts.html';
    } catch (err) {
      alert(err.message);
    }
  });
}

  
  // Handle registration form submission with validation
  const registerForm = document.getElementById('register-form');
if (registerForm) {
  registerForm.addEventListener('submit', async function(e) {
    e.preventDefault();

    const name     = document.getElementById('register-name').value;
    const email    = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;

    // (run your existing validateEmail, validatePassword, etc. here)

    try {
      const res  = await fetch('/api/users/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ name, email, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Signup failed');

      alert('🎉 Registered! Please log in.');
      registerForm.reset();
      // flip back to login view:
      document.querySelector('.logreg-box').classList.remove('active');
    } catch (err) {
      alert(err.message);
    }
  });
}

  // Handle forgot password form submission
  const forgotPasswordForm = document.getElementById('forgot-password-form');
  if (forgotPasswordForm) {
    forgotPasswordForm.addEventListener('submit', function(event) {
      event.preventDefault();
      
      const email = document.getElementById('reset-email').value;
      const messageElem = document.getElementById('reset-message');
      
      if (resetPassword(email)) {
        messageElem.textContent = "Password reset email sent. Please check your inbox.";
        messageElem.className = "success-message";
        messageElem.style.display = "block"; // Make message visible
      } else {
        messageElem.textContent = "Email not found. Please try again.";
        messageElem.className = "error-message";
        messageElem.style.display = "block"; // Make message visible
      }
    });
  }
  
  // Handle logout
  document.addEventListener('click', function(e) {
    if (e.target && e.target.id === 'logout-link') {
      e.preventDefault();
      logoutUser();
      window.location.href = 'index.html';
    }
  });
  
  // Profile dropdown toggle
  document.addEventListener('click', function(e) {
    const profileIcon = e.target.closest('.profile-icon');
    if (profileIcon) {
      const dropdown = document.querySelector('.profile-dropdown');
      if (dropdown) {
        dropdown.classList.toggle('active');
      }
    } else if (!e.target.closest('.profile-dropdown')) {
      // Close dropdown when clicking outside
      const dropdown = document.querySelector('.profile-dropdown');
      if (dropdown && dropdown.classList.contains('active')) {
        dropdown.classList.remove('active');
      }
    }
  });

  // Check if on posts page and handle authentication
  console.log('🗺️ current path:', window.location.pathname);

  if (window.location.pathname.includes('posts.html')) {
  document.addEventListener('DOMContentLoaded', async () => {
    await loadPosts();  // initial fetch & render
    console.log('🔄 loadPosts() called');

    const createForm = document.getElementById('storyForm');
    if (createForm) {
      createForm.addEventListener('submit', async e => {
        e.preventDefault();
        const token        = localStorage.getItem('token');
        const title        = document.getElementById('post-title').value;
        const content      = document.getElementById('post-content').value;
        const targetAmount = document.getElementById('target-amount').value;

        const res = await fetch('/api/posts', {
          method: 'POST',
          headers: {
            'Content-Type':  'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ title, content, targetAmount })
        });

        if (res.ok) {
          await loadPosts();
          createForm.reset();
        } else {
          const err = await res.json();
          alert(err.message);
        }
      });
    }
  });
}

  
  // Show authentication required message if redirected from posts page
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('auth') === 'required' && authMessage) {
    authMessage.style.display = 'flex';
  }

  // Initialize profile page if on profile page
  if (window.location.pathname.includes('profile.html')) {
    initializeProfilePage();
  }

  // Check if URL contains a post ID parameter (for sharing functionality)
  if (window.location.pathname.includes('posts.html')) {
    checkUrlForPostId();
  }
});

// Update navbar with profile dropdown if logged in
function updateNavbar(isAuthenticated) {
  const navbar = document.querySelector('.navbar');
  if (!navbar) return;

  // Remove any existing profile containers within the navbar only
  const existingProfileContainer = navbar.querySelector('.profile-container');
  if (existingProfileContainer) {
    existingProfileContainer.remove();
  }

  if (isAuthenticated) {
    const currentUser = getCurrentUser();

    // Add profile icon to navbar
    const profileItem = document.createElement('div');
    profileItem.className = 'profile-container';

    profileItem.innerHTML = `
      <div class="profile-icon">
        <span>${getInitials(currentUser.name)}</span>
      </div>
      <div class="profile-dropdown">
        <div class="dropdown-header">
          <strong>${currentUser.name}</strong>
          <span>${currentUser.email}</span>
        </div>
        <ul>
          <li><a href="profile.html" id="profile-link"><i class='bx bx-user'></i> My Profile</a></li>
          <li><a href="settings.html" id="settings-link"><i class='bx bx-cog'></i> Settings</a></li>
          <li><a href="help.html" id="help-link"><i class='bx bx-help-circle'></i> Help</a></li>
          <li class="divider"></li>
          <li><a href="#" id="logout-link"><i class='bx bx-log-out'></i> Logout</a></li>
        </ul>
      </div>
    `;

    navbar.appendChild(profileItem);
  }
}

// Get current user from localStorage
function getCurrentUser() {
  const userData = localStorage.getItem('currentUser');
  return userData ? JSON.parse(userData) : null;
}

// Authentication Functions
function checkAuthentication() {
  return localStorage.getItem('currentUser') !== null;
}

// Reset password functionality
function resetPassword(email) {
  const users = JSON.parse(localStorage.getItem('users')) || [];
  const userExists = users.some(user => user.email === email);
  
  if (userExists) {
    console.log('Password reset email sent to:', email);
    return true;
  }
  return false;
}

// Get initials from full name
function getInitials(name) {
  return name
    .split(' ')
    .map(part => part.charAt(0))
    .join('')
    .toUpperCase();
}

// Login user function
function loginUser(email, password) {
  const users = JSON.parse(localStorage.getItem('users')) || [];
  const user = users.find(u => u.email === email && u.password === password);
  
  if (user) {
    localStorage.setItem('currentUser', JSON.stringify({
      name: user.name,
      email: user.email,
      profileImage: user.profileImage || null
    }));
    return true;
  }
  return false;
}

// Register user function
function registerUser(name, email, password) {
  const users = JSON.parse(localStorage.getItem('users')) || [];
  
  // Check if email already exists
  if (users.some(user => user.email === email)) {
    return false;
  }
  
  // Add new user
  users.push({
    name: name,
    email: email,
    password: password,
    joined: new Date().toISOString(),
    profileImage: null
  });
  
  localStorage.setItem('users', JSON.stringify(users));
  return true;
}

// Logout user function
function logoutUser() {
  localStorage.removeItem('currentUser');
}

// Check URL for post ID parameter (for sharing functionality)
function checkUrlForPostId() {
  const urlParams = new URLSearchParams(window.location.search);
  const postId = urlParams.get('post');
  
  if (postId) {
    const posts = JSON.parse(localStorage.getItem('posts')) || [];
    const post = posts.find(p => p.id.toString() === postId);
    
    if (post) {
      setTimeout(() => {
        const postElement = document.getElementById(`post-${postId}`);
        if (postElement) {
          postElement.scrollIntoView({ behavior: 'smooth' });
          postElement.classList.add('highlight');
          setTimeout(() => {
            postElement.classList.remove('highlight');
          }, 3000);
        }
      }, 1000);
    }
  }
}

// Initialize posts page
function initializePostsPage() {
  const postsContainer = document.getElementById('postsContainer');
  const noPostsMessage = document.getElementById('no-posts-message');
  if (!postsContainer) return;
  
  const posts = JSON.parse(localStorage.getItem('posts')) || [];
  const currentUser = getCurrentUser();
  
  // Handle the display of posts or no posts message
  if (posts.length === 0) {
    if (noPostsMessage) noPostsMessage.style.display = 'block';
  } else {
    if (noPostsMessage) noPostsMessage.style.display = 'none';
    
    posts.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    postsContainer.innerHTML = '';
    posts.forEach(post => {
      const postElement = createPostElement(post, currentUser);
      postsContainer.appendChild(postElement);
    });
  }
  
  // Handle the post creation form
  const storyForm = document.getElementById('storyForm');
  if (storyForm) {
    storyForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      const title = document.getElementById('post-title').value;
      const content = document.getElementById('post-content').value;
      const targetAmount = document.getElementById('target-amount').value;
      
      if (title.trim() === '' || content.trim() === '') {
        alert('Please enter both a title and content for your story.');
        return;
      }
      
      // Variables to store image and QR code
      let imageUrl = null;
      let qrCodeUrl = null;
      let pendingUploads = 0;
      
      // Process post image if provided
      const imageInput = document.getElementById('post-image');
      if (imageInput.files && imageInput.files[0]) {
        pendingUploads++;
        const reader = new FileReader();
        reader.onload = function(e) {
          imageUrl = e.target.result;
          pendingUploads--;
          if (pendingUploads === 0) {
            // All uploads complete, now create the post
            createPost();
          }
        };
        reader.readAsDataURL(imageInput.files[0]);
      }
      
      // Process GCash QR code if provided
      const qrCodeInput = document.getElementById('gcash-qr');
      if (qrCodeInput.files && qrCodeInput.files[0]) {
        pendingUploads++;
        const reader = new FileReader();
        reader.onload = function(e) {
          qrCodeUrl = e.target.result;
          pendingUploads--;
          if (pendingUploads === 0) {
            // All uploads complete, now create the post
            createPost();
          }
        };
        reader.readAsDataURL(qrCodeInput.files[0]);
      }
      
      // If no files to upload, create post immediately
      if (pendingUploads === 0) {
        createPost();
      }
      
      // Create the post with all data
      function createPost() {
        const newPost = {
          id: Date.now(),
          title: title,
          author: currentUser.name,
          authorEmail: currentUser.email,
          content: content,
          date: new Date().toISOString(),
          targetAmount: parseFloat(targetAmount) || 0,
          amountRaised: 0,
          imageUrl: imageUrl,
          qrCodeUrl: qrCodeUrl,
          likes: 0,
          comments: []
        };
        
        // Add the new post to the array and save to localStorage
        posts.unshift(newPost);
        localStorage.setItem('posts', JSON.stringify(posts));
        
        // Create and display the new post element
        if (noPostsMessage) noPostsMessage.style.display = 'none';
        const postElement = createPostElement(newPost, currentUser);
        postsContainer.prepend(postElement);
        
        // Reset form fields
        storyForm.reset();
        document.getElementById('imagePreviewContainer').innerHTML = '';
        document.getElementById('qrPreviewContainer').innerHTML = '';
        
        alert('Your story has been successfully posted!');
      }
    });
  }

  // Set up image preview functionality
  const postImageInput = document.getElementById('post-image');
  const imagePreviewContainer = document.getElementById('imagePreviewContainer');
  
  if (postImageInput && imagePreviewContainer) {
    postImageInput.addEventListener('change', function(e) {
      if (this.files && this.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
          imagePreviewContainer.innerHTML = `<img src="${e.target.result}" alt="Image Preview" class="upload-preview">`;
        };
        reader.readAsDataURL(this.files[0]);
      }
    });
  }
  
  // Set up QR code preview
  const qrCodeInput = document.getElementById('gcash-qr');
  const qrPreviewContainer = document.getElementById('qrPreviewContainer');
  
  if (qrCodeInput && qrPreviewContainer) {
    qrCodeInput.addEventListener('change', function(e) {
      if (this.files && this.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
          qrPreviewContainer.innerHTML = `<img src="${e.target.result}" alt="QR Code Preview" class="qr-preview-img">`;
        };
        reader.readAsDataURL(this.files[0]);
      }
    });
  }
}

// Create post element function
function createPostElement(post, currentUser) {
  // Use the post template if available
  const template = document.getElementById('post-template');
  if (template) {
    return createTemplatePostElement(post, currentUser);
  }
  
  // Fallback to original implementation
  const postElement = document.createElement('div');
  postElement.className = 'post';
  postElement.id = `post-${post.id}`;
  
  const postDate = new Date(post.date);
  const formattedDate = postDate.toLocaleDateString() + ' ' + postDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
  
  postElement.innerHTML = `
    <div class="post-header">
      <div class="post-author">
        <span class="author-icon">${getInitials(post.author)}</span>
        <div>
          <span class="author-name">${post.author}</span>
          <span class="post-date">${formattedDate}</span>
        </div>
      </div>
      <div class="post-actions">
        <button class="share-btn" title="Share post"><i class='bx bx-share'></i></button>
        ${post.authorEmail === currentUser.email ? '<button class="delete-btn" title="Delete post"><i class="bx bx-trash"></i></button>' : ''}
      </div>
    </div>
    <div class="post-content">${post.content}</div>
    <div class="post-footer">
      <button class="like-btn ${post.likedBy && post.likedBy.includes(currentUser.email) ? 'liked' : ''}">
        <i class='bx ${post.likedBy && post.likedBy.includes(currentUser.email) ? 'bxs-heart' : 'bx-heart'}'></i>
        <span class="like-count">${post.likes || 0}</span>
      </button>
      <button class="comment-btn">
        <i class='bx bx-comment'></i>
        <span class="comment-count">${post.comments ? post.comments.length : 0}</span>
      </button>
    </div>
    <div class="comments-section" style="display: none;">
      <div class="comments-container">
        ${(post.comments || []).map(comment => `
          <div class="comment">
            <div class="comment-author">
              <span class="author-icon small">${getInitials(comment.author)}</span>
              <span class="author-name">${comment.author}</span>
            </div>
            <div class="comment-content">${comment.content}</div>
          </div>
        `).join('')}
      </div>
      <form class="comment-form">
        <input type="text" class="comment-input" placeholder="Write a comment...">
        <button type="submit" class="comment-submit"><i class='bx bx-send'></i></button>
      </form>
    </div>
  `;
  
  const likeBtn = postElement.querySelector('.like-btn');
  likeBtn.addEventListener('click', function() {
    toggleLike(post.id, currentUser.email, likeBtn);
  });
  
  const commentBtn = postElement.querySelector('.comment-btn');
  const commentsSection = postElement.querySelector('.comments-section');
  commentBtn.addEventListener('click', function() {
    commentsSection.style.display = commentsSection.style.display === 'none' ? 'block' : 'none';
  });
  
  const commentForm = postElement.querySelector('.comment-form');
  commentForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const commentInput = this.querySelector('.comment-input');
    const commentContent = commentInput.value.trim();
    
    if (commentContent === '') return;
    
    addComment(post.id, {
      author: currentUser.name,
      authorEmail: currentUser.email,
      content: commentContent,
      date: new Date().toISOString()
    }, postElement);
    
    commentInput.value = '';
  });
  
  const shareBtn = postElement.querySelector('.share-btn');
  shareBtn.addEventListener('click', function() {
    const postUrl = `${window.location.origin}${window.location.pathname}?post=${post.id}`;
    
    navigator.clipboard.writeText(postUrl).then(() => {
      alert('Link copied to clipboard!');
    }).catch(err => {
      console.error('Could not copy text: ', err);
    });
  });
  
  const deleteBtn = postElement.querySelector('.delete-btn');
  if (deleteBtn) {
    deleteBtn.addEventListener('click', function() {
      if (confirm('Are you sure you want to delete this post?')) {
        deletePost(post.id, postElement);
      }
    });
  }
  
  return postElement;
}

// Create a post element using the post template
function createTemplatePostElement(post, currentUser) {
  // Clone the template
  const postElement = document.importNode(document.getElementById('post-template').content, true).querySelector('.post-card');
  postElement.id = `post-${post.id}`;
  
  // Set post data
  const postDate = new Date(post.date);
  const formattedDate = postDate.toLocaleDateString();
  
  // Set post header info
  postElement.querySelector('.post-author').textContent = post.author;
  postElement.querySelector('.post-date').textContent = formattedDate;
  postElement.querySelector('.post-title').textContent = post.title || post.content.substring(0, 30) + '...';
  
  // Set post content
  postElement.querySelector('.post-content p').textContent = post.content;
  
  // Handle post image
  const postImage = postElement.querySelector('.post-image');
  if (post.imageUrl) {
    postImage.src = post.imageUrl;
    postElement.querySelector('.post-image-container').style.display = 'block';
  } else {
    postElement.querySelector('.post-image-container').style.display = 'none';
  }
  
  // Handle donation statistics
  const progress = postElement.querySelector('.progress');
  const amountRaised = postElement.querySelector('.amount-raised');
  const amountGoal = postElement.querySelector('.amount-goal');
  
  // Calculate progress percentage
  const targetAmount = parseFloat(post.targetAmount) || 0;
  const raisedAmount = parseFloat(post.amountRaised) || 0;
  const progressPercentage = targetAmount > 0 ? Math.min((raisedAmount / targetAmount) * 100, 100) : 0;
  
  progress.style.width = `${progressPercentage}%`;
  amountRaised.textContent = `₱${raisedAmount}`;
  amountGoal.textContent = `of ₱${targetAmount} goal`;
  
  // Handle donate button
  const donateBtn = postElement.querySelector('.donate-btn');
  const donationModal = postElement.querySelector('.donation-modal');
  const closeModal = postElement.querySelector('.close-modal');
  const modalTitle = donationModal.querySelector('h3');
  
  donateBtn.addEventListener('click', function() {
    modalTitle.textContent = `Donate to ${post.author}`;
    
    // Set QR code if available
    const qrCode = donationModal.querySelector('.qr-code');
    if (post.qrCodeUrl) {
      qrCode.src = post.qrCodeUrl;
      donationModal.style.display = 'flex';
    } else {
      alert('Sorry, this user has not set up their GCash QR code yet.');
    }
  });
  
  closeModal.addEventListener('click', function() {
    donationModal.style.display = 'none';
  });
  
  // Share button
  const shareBtn = postElement.querySelector('.share-btn');
  shareBtn.addEventListener('click', function() {
    const postUrl = `${window.location.origin}${window.location.pathname}?post=${post.id}`;
    
    navigator.clipboard.writeText(postUrl).then(() => {
      alert('Link to this story has been copied to your clipboard!');
    }).catch(err => {
      console.error('Could not copy text: ', err);
    });
  });
  
  return postElement;
}

// Toggle like function
function toggleLike(postId, userEmail, likeBtn) {
  const posts = JSON.parse(localStorage.getItem('posts')) || [];
  const postIndex = posts.findIndex(p => p.id === postId);
  
  if (postIndex === -1) return;
  
  const post = posts[postIndex];
  
  if (!post.likedBy) {
    post.likedBy = [];
  }
  
  const alreadyLiked = post.likedBy.includes(userEmail);
  
  if (alreadyLiked) {
    post.likes--;
    post.likedBy = post.likedBy.filter(email => email !== userEmail);
    likeBtn.classList.remove('liked');
    likeBtn.querySelector('i').className = 'bx bx-heart';
  } else {
    post.likes++;
    post.likedBy.push(userEmail);
    likeBtn.classList.add('liked');
    likeBtn.querySelector('i').className = 'bx bxs-heart';
  }
  
  likeBtn.querySelector('.like-count').textContent = post.likes;
  
  localStorage.setItem('posts', JSON.stringify(posts));
}

// Add comment function
function addComment(postId, comment, postElement) {
  const posts = JSON.parse(localStorage.getItem('posts')) || [];
  const postIndex = posts.findIndex(p => p.id === postId);
  
  if (postIndex === -1) return;
  
  const post = posts[postIndex];
  
  if (!post.comments) {
    post.comments = [];
  }
  
  post.comments.push(comment);
  
  localStorage.setItem('posts', JSON.stringify(posts));
  
  const commentsContainer = postElement.querySelector('.comments-container');
  const commentElement = document.createElement('div');
  commentElement.className = 'comment';
  commentElement.innerHTML = `
    <div class="comment-author">
      <span class="author-icon small">${getInitials(comment.author)}</span>
      <span class="author-name">${comment.author}</span>
    </div>
    <div class="comment-content">${comment.content}</div>
  `;
  commentsContainer.appendChild(commentElement);
  
  const commentCount = postElement.querySelector('.comment-count');
  commentCount.textContent = post.comments.length;
}

// Delete post function
function deletePost(postId, postElement) {
  const posts = JSON.parse(localStorage.getItem('posts')) || [];
  const updatedPosts = posts.filter(p => p.id !== postId);
  
  localStorage.setItem('posts', JSON.stringify(updatedPosts));
  
  postElement.remove();
}

// Initialize profile page
function initializeProfilePage() {
  const currentUser = getCurrentUser();
  if (!currentUser) return;
  
  const profileName = document.getElementById('profile-name');
  const profileEmail = document.getElementById('profile-email');
  const profileJoined = document.getElementById('profile-joined');
  const profileImage = document.getElementById('profile-image');
  
  if (profileName) profileName.textContent = currentUser.name;
  if (profileEmail) profileEmail.textContent = currentUser.email;
  
  const users = JSON.parse(localStorage.getItem('users')) || [];
  const userData = users.find(u => u.email === currentUser.email);
  
  if (userData && profileJoined) {
    const joinedDate = new Date(userData.joined);
    profileJoined.textContent = joinedDate.toLocaleDateString();
  }
  
  if (profileImage) {
    if (currentUser.profileImage) {
      profileImage.src = currentUser.profileImage;
    } else {
      profileImage.src = '../images/default-profile.jpg';
    }
  }
  
  const imageUpload = document.getElementById('image-upload');
  if (imageUpload) {
    imageUpload.addEventListener('change', function(e) {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = function(event) {
          if (profileImage) {
            profileImage.src = event.target.result;
          }
          
          currentUser.profileImage = event.target.result;
          localStorage.setItem('currentUser', JSON.stringify(currentUser));
          
          const users = JSON.parse(localStorage.getItem('users')) || [];
          const userIndex = users.findIndex(u => u.email === currentUser.email);
          if (userIndex !== -1) {
            users[userIndex].profileImage = event.target.result;
            localStorage.setItem('users', JSON.stringify(users));
          }
        };
        reader.readAsDataURL(file);
      }
    });
  }
}
// Quick amount selection functionality
            document.querySelectorAll('.amount-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    document.getElementById('cash').value = this.dataset.amount;
                });
            });

// DEBUG: show us the URL path
console.log('🗺️ current path:', window.location.pathname);

// Only on posts.html do we load
if (window.location.pathname.endsWith('posts.html')) {
  console.log('✅ posts.html detected, scheduling loadPosts()');
  document.addEventListener('DOMContentLoaded', loadPosts);
}
