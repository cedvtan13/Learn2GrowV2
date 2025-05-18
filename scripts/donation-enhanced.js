// Enhanced form event handling for donation form buttons
document.addEventListener('DOMContentLoaded', function() {
    enhanceDonationFormButtons();
});

// Fix event handling for donation modal close buttons
function enhanceDonationFormButtons() {
    // Get references to elements
    const modal = document.getElementById('donation-modal');
    const closeButtons = document.querySelectorAll('.close-modal');
    const printButton = document.getElementById('print-receipt');
    const shareButton = document.getElementById('share-receipt');
    const donationForm = document.getElementById('donation-form');
    
    // Fix modal close buttons
    if (closeButtons) {
        closeButtons.forEach(btn => {
            // Remove any existing event listeners by cloning
            const newBtn = btn.cloneNode(true);
            if (btn.parentNode) {
                btn.parentNode.replaceChild(newBtn, btn);
                
                // Add a fresh event listener that ensures form elements get enabled
                newBtn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    if (modal) {
                        safeCloseModal(modal);
                    }
                });
            }
        });
    }
    
    // Enhance print and share buttons to properly handle events
    if (printButton) {
        const newPrintButton = printButton.cloneNode(true);
        printButton.parentNode.replaceChild(newPrintButton, printButton);
        
        newPrintButton.addEventListener('click', function(e) {
            e.stopPropagation();
            if (typeof printDonationReceipt === 'function') {
                try {
                    const donationData = JSON.parse(localStorage.getItem('lastDonation')) || {};
                    printDonationReceipt(donationData);
                } catch (err) {
                    console.error('Error printing receipt:', err);
                    alert('There was an error printing your receipt. Please try again.');
                }
            }
        });
    }
    
    if (shareButton) {
        const newShareButton = shareButton.cloneNode(true);
        shareButton.parentNode.replaceChild(newShareButton, shareButton);
        
        newShareButton.addEventListener('click', function(e) {
            e.stopPropagation();
            if (typeof shareDonationReceipt === 'function') {
                try {
                    const donationData = JSON.parse(localStorage.getItem('lastDonation')) || {};
                    shareDonationReceipt(donationData);
                } catch (err) {
                    console.error('Error sharing receipt:', err);
                    alert('There was an error sharing your donation. Please try again.');
                }
            }
        });
    }
    
    // Fix the donation form submission to handle form state properly
    if (donationForm) {
        // Remove existing event listeners by cloning the form
        const newForm = donationForm.cloneNode(true);
        donationForm.parentNode.replaceChild(newForm, donationForm);
        
        // Add fresh event listener
        newForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Disable form elements during submission to prevent double clicks
            const formElements = newForm.querySelectorAll('button, input, textarea, select');
            formElements.forEach(element => {
                element.disabled = true;
            });
            
            // Call the validation and processing functions from the original code
            if (typeof validateDonationForm === 'function' && validateDonationForm()) {
                if (typeof processDonation === 'function') {
                    try {
                        processDonation();
                    } catch (err) {
                        console.error('Error processing donation:', err);
                        alert('An error occurred while processing your donation. Please try again.');
                        
                        // Re-enable form elements on error
                        enableFormElements();
                    }
                } else {
                    console.error('processDonation function not found');
                    enableFormElements();
                }
            } else {
                // Re-enable form elements if validation fails
                enableFormElements();
            }
        });
    }
    
    // Outside clicks should close the modal safely
    window.addEventListener('click', function(e) {
        if (modal && e.target === modal) {
            safeCloseModal(modal);
        }
    });
    
    // Escape key should close the modal safely
    document.addEventListener('keydown', function(e) {
        if (modal && e.key === 'Escape' && modal.style.display === 'block') {
            safeCloseModal(modal);
        }
    });
}
