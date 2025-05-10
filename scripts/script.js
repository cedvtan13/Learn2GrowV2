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
    loginForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      const email = document.getElementById('login-email').value;
      const password = document.getElementById('login-password').value;
      
      if (!validateEmail(email)) {
        alert('Please enter a valid email address.');
        return;
      }
      
      if (loginUser(email, password)) {
        alert('Login successful!');
        
        // Check if "Remember me" is checked
        const rememberMe = document.querySelector('#remember-me').checked;
        if (rememberMe) {
          localStorage.setItem('rememberMe', 'true');
          localStorage.setItem('rememberedUser', JSON.stringify({ email: email }));
        } else {
          localStorage.removeItem('rememberMe');
          localStorage.removeItem('rememberedUser');
        }
        
        window.location.href = 'posts.html';
      } else {
        alert('Invalid email or password.');
      }
    });
  }
  
  // Handle registration form submission with validation
  const registerForm = document.getElementById('register-form');
  if (registerForm) {
    registerForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      const name = document.getElementById('register-name').value;
      const email = document.getElementById('register-email').value;
      const password = document.getElementById('register-password').value;
      
      if (name.trim().length < 2) {
        alert('Please enter a valid name (at least 2 characters).');
        return;
      }
      
      if (!validateEmail(email)) {
        alert('Please enter a valid email address.');
        return;
      }
      
      if (!validatePassword(password)) {
        alert('Password must be at least 8 characters long and contain at least one letter and one number.');
        return;
      }
      
      if (registerUser(name, email, password)) {
        alert('Registration successful! Please login.');
        const logregBox = document.querySelector('.logreg-box');
        if (logregBox) logregBox.classList.remove('active');
      } else {
        alert('Email already registered. Please use a different email.');
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
  if (window.location.pathname.includes('posts.html')) {
    const authRequired = document.getElementById('auth-required');
    const postsContent = document.getElementById('posts-content');
    
    if (!isAuthenticated) {
      // Show authentication required message
      if (authRequired) authRequired.style.display = 'flex';
      if (postsContent) postsContent.style.display = 'none';
    } else {
      // Show posts content
      if (authRequired) authRequired.style.display = 'none';
      if (postsContent) postsContent.style.display = 'block';
      
      // Initialize posts functionality
      initializePostsPage();
    }
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
  const postsContainer = document.getElementById('posts-container');
  if (!postsContainer) return;
  
  const posts = JSON.parse(localStorage.getItem('posts')) || [];
  const currentUser = getCurrentUser();
  
  if (posts.length === 0) {
    postsContainer.innerHTML = '<div class="no-posts">No posts yet. Be the first to share!</div>';
    return;
  }
  
  posts.sort((a, b) => new Date(b.date) - new Date(a.date));
  
  postsContainer.innerHTML = '';
  posts.forEach(post => {
    const postElement = createPostElement(post, currentUser);
    postsContainer.appendChild(postElement);
  });
  
  const postForm = document.getElementById('post-form');
  if (postForm) {
    postForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      const content = document.getElementById('post-content').value;
      if (content.trim() === '') return;
      
      const newPost = {
        id: Date.now(),
        author: currentUser.name,
        authorEmail: currentUser.email,
        content: content,
        date: new Date().toISOString(),
        likes: 0,
        comments: []
      };
      
      posts.unshift(newPost);
      localStorage.setItem('posts', JSON.stringify(posts));
      
      const postElement = createPostElement(newPost, currentUser);
      postsContainer.prepend(postElement);
      
      document.getElementById('post-content').value = '';
    });
  }
}

// Create post element function
function createPostElement(post, currentUser) {
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