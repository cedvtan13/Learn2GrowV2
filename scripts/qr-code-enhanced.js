// Enhanced QR code handling to ensure proper event cleanup and responsiveness
document.addEventListener('DOMContentLoaded', function() {
    // Set up proper QR code interactions
    enhanceQRCodeHandling();
    
    // Also fix the original expandImage function if it exists
    if (typeof window.expandImage === 'function') {
        const originalExpandImage = window.expandImage;
        
        // Replace with our enhanced version
        window.expandImage = function() {
            // Call the original implementation
            originalExpandImage.apply(this, arguments);
            
            // Make sure body overflow is restored and form elements are enabled when modal is closed
            const modal = document.getElementById('imageModal');
            const closeButton = document.querySelector('.close-image-modal');
            
            if (closeButton) {
                // Remove existing listeners and add new one
                const newCloseBtn = closeButton.cloneNode(true);
                closeButton.parentNode.replaceChild(newCloseBtn, closeButton);
                
                newCloseBtn.addEventListener('click', function() {
                    modal.style.display = 'none';
                    modal.classList.remove('visible');
                    document.body.style.overflow = '';
                    enableFormElements();
                });
            }
            
            // Also handle outside clicks and escape key
            const outsideClickHandler = function(e) {
                if (e.target === modal) {
                    modal.style.display = 'none';
                    modal.classList.remove('visible');
                    document.body.style.overflow = '';
                    enableFormElements();
                    
                    // Remove the listener once used
                    modal.removeEventListener('click', outsideClickHandler);
                }
            };
            
            modal.addEventListener('click', outsideClickHandler);
            
            // Also handle escape key
            const escapeKeyHandler = function(e) {
                if (e.key === 'Escape') {
                    modal.style.display = 'none';
                    modal.classList.remove('visible');
                    document.body.style.overflow = '';
                    enableFormElements();
                    
                    // Remove the listener once used
                    document.removeEventListener('keydown', escapeKeyHandler);
                }
            };
            
            document.addEventListener('keydown', escapeKeyHandler);
        };
    }
});

function enhanceQRCodeHandling() {
    // Handle QR code click events in the donation page
    const qrCodes = document.querySelectorAll('.qr-code:not(.clickable-image)');
    
    // Ensure QR codes are clickable and have proper event handling
    qrCodes.forEach(qrCode => {
        if (qrCode.src) {
            // Clone and replace to remove any existing listeners
            const newQrCode = qrCode.cloneNode(true);
            qrCode.parentNode.replaceChild(newQrCode, qrCode);
            
            // Add proper styling and attributes
            newQrCode.classList.add('clickable-image');
            newQrCode.setAttribute('data-title', 'Donation QR Code');
            
            // Add fresh event listener with proper error handling
            newQrCode.addEventListener('click', function(e) {
                e.stopPropagation();
                try {
                    expandImage.call(this);
                } catch (err) {
                    console.error('Error expanding QR code:', err);
                    // Fallback if expandImage function is not available
                    if (typeof expandImage !== 'function') {
                        const modal = document.getElementById('imageModal');
                        if (modal) {
                            const modalImg = document.getElementById('expandedImage');
                            if (modalImg) {
                                modalImg.src = this.src;
                                modal.style.display = 'flex';
                                
                                // Make sure the modal can be closed
                                const closeBtn = modal.querySelector('.close-image-modal');
                                if (closeBtn) {
                                    closeBtn.addEventListener('click', function() {
                                        modal.style.display = 'none';
                                        enableFormElements();
                                    });
                                }
                            }
                        }
                    }
                }
            });
        }
    });
    
    // Fix image modal close button behavior
    const imageModal = document.getElementById('imageModal');
    const closeImageModalBtn = document.querySelector('.close-image-modal');
    
    if (imageModal && closeImageModalBtn) {
        // Clone and replace to remove any existing listeners
        const newCloseBtn = closeImageModalBtn.cloneNode(true);
        closeImageModalBtn.parentNode.replaceChild(newCloseBtn, closeImageModalBtn);
        
        // Add fresh event listener that ensures form elements get enabled
        newCloseBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            imageModal.style.display = 'none';
            imageModal.classList.remove('visible');
            document.body.style.overflow = '';
            enableFormElements();
        });
        
        // Handle clicks outside the image
        imageModal.addEventListener('click', function(e) {
            if (e.target === imageModal) {
                imageModal.style.display = 'none';
                imageModal.classList.remove('visible');
                document.body.style.overflow = '';
                enableFormElements();
            }
        });
        
        // Add escape key handler
        document.addEventListener('keydown', function escKeyHandler(e) {
            if (e.key === 'Escape' && imageModal.style.display === 'flex') {
                imageModal.style.display = 'none';
                imageModal.classList.remove('visible');
                document.body.style.overflow = '';
                enableFormElements();
                document.removeEventListener('keydown', escKeyHandler);
            }
        });
    }
}

// Function to safely expand an image in a modal
function safeExpandImage(imgElement) {
    if (!imgElement || !imgElement.src) return;
    
    const modal = document.getElementById('imageModal');
    const modalImg = document.getElementById('expandedImage');
    const captionText = document.getElementById('imageModalCaption');
    
    if (!modal || !modalImg) return;
    
    // Set the modal image source and caption
    modalImg.src = imgElement.src;
    
    // Use the data-title attribute if available, otherwise use the alt text
    const caption = imgElement.getAttribute('data-title') || imgElement.alt || 'Image';
    if (captionText) captionText.innerHTML = caption;
    
    // Display the modal
    modal.style.display = 'flex';
    
    // Add a small delay before adding the visible class for animation
    setTimeout(() => {
        modal.classList.add('visible');
    }, 10);
    
    // Prevent scrolling of background content
    document.body.style.overflow = 'hidden';
}
