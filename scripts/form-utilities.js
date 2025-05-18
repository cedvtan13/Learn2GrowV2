// Form utilities to keep the page responsive after submissions
function enableFormElements() {
  // Enable all form elements that might have been disabled
  document.querySelectorAll('button, input, select, textarea').forEach(elem => {
    elem.disabled = false;
  });

  // Make sure any frozen UI elements are reset
  document.body.style.pointerEvents = '';
  document.body.style.overflow = '';

  // Reset any form alerts if needed
  const formAlerts = document.querySelectorAll('.form-alert');
  if (formAlerts) {
    formAlerts.forEach(alert => {
      setTimeout(() => {
        alert.style.display = 'none';
      }, 3000);
    });
  }
}

// Safe modal handling
function safeCloseModal(modalSelector) {
  const modal = typeof modalSelector === 'string' 
    ? document.querySelector(modalSelector) 
    : modalSelector;
  
  if (modal) {
    // Hide the modal
    modal.style.display = 'none';
    
    // Re-enable all form elements
    enableFormElements();
    
    // Clean up event listeners if any were attached to modal elements
    const closeButtons = modal.querySelectorAll('.close-modal, .modal-close, .close');
    if (closeButtons) {
      closeButtons.forEach(btn => {
        // Clone and replace to remove event listeners
        const newBtn = btn.cloneNode(true);
        if (btn.parentNode) {
          btn.parentNode.replaceChild(newBtn, btn);
          
          // Add fresh event listener
          newBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            safeCloseModal(modal);
          });
        }
      });
    }
  }
}
