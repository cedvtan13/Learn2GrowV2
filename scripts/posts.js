// Additional functionality for posts
function completePostCreation(title, content, targetAmount, imageUrl, qrCodeUrl, currentUser, postsContainer, posts, noPostsMessage) {
  if (!currentUser) return;

  const newPost = {
    id: Date.now(),
    title: title,
    author: currentUser.name,
    authorEmail: currentUser.email,
    content: content,
    date: new Date().toISOString(),
    targetAmount: parseFloat(targetAmount) || 0,
    amountRaised: 0,
    imageUrl: imageUrl || null,
    qrCodeUrl: qrCodeUrl || null,
    likes: 0,
    comments: []
  };
  
  // Add the new post to the array and save to localStorage
  const allPosts = posts || JSON.parse(localStorage.getItem('posts')) || [];
  allPosts.unshift(newPost);
  localStorage.setItem('posts', JSON.stringify(allPosts));
  
  // Create and display the new post element
  if (postsContainer) {
    if (noPostsMessage) noPostsMessage.style.display = 'none';
    const postElement = createPostElement(newPost, currentUser);
    postsContainer.prepend(postElement);
  }
  
  // Reset form fields
  document.getElementById('post-title').value = '';
  document.getElementById('post-content').value = '';
  document.getElementById('target-amount').value = '';
  document.getElementById('post-image').value = '';
  document.getElementById('gcash-qr').value = '';
  
  // Clear previews
  document.getElementById('imagePreviewContainer').innerHTML = '';
  document.getElementById('qrPreviewContainer').innerHTML = '';
  
  // Show success message
  alert('Your story has been successfully posted!');
}
