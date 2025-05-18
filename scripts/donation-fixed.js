// Enhanced version of donation.js with fixes for the page unresponsiveness issues
document.addEventListener('DOMContentLoaded', function() {
    // Initialize donation form functionality
    initDonationForm();
    
    // Load recipient suggestions if available
    loadRecipientSuggestions();
});

function initDonationForm() {
    const donationForm = document.getElementById('donation-form');
    const donationType = document.getElementById('donation-type');
    const itemsGroup = document.getElementById('items-group');
    const amountGroup = document.getElementById('amount-group');
    const paymentMethod = document.getElementById('payment-method');
    const gcashNumberGroup = document.getElementById('gcash-number-group');
    
    // Toggle items field based on donation type
    donationType.addEventListener('change', function() {
        const type = this.value;
        if (type === 'In-kind' || type === 'Both') {
            itemsGroup.style.display = 'block';
            if (type === 'In-kind') {
                amountGroup.style.display = 'none';
                document.getElementById('amount').removeAttribute('required');
            } else {
                amountGroup.style.display = 'block';
                document.getElementById('amount').setAttribute('required', '');
            }
        } else {
            itemsGroup.style.display = 'none';
            amountGroup.style.display = 'block';
            document.getElementById('amount').setAttribute('required', '');
        }
    });
    
    // Toggle GCash number field
    paymentMethod.addEventListener('change', function() {
    // Hide all payment method fields first
    gcashNumberGroup.style.display = 'none';
    document.getElementById('paymaya-number-group').style.display = 'none';
    document.getElementById('bank-transfer-group').style.display = 'none';
    
    // Remove required attributes from all fields
    document.getElementById('gcash-number').removeAttribute('required');
    document.getElementById('paymaya-number').removeAttribute('required');
    document.getElementById('bank-name').removeAttribute('required');
    document.getElementById('account-number').removeAttribute('required');
    document.getElementById('account-name').removeAttribute('required');
    
    // Show and set required for the selected payment method
    switch(this.value) {
        case 'GCash':
            gcashNumberGroup.style.display = 'block';
            document.getElementById('gcash-number').setAttribute('required', '');
            break;
        case 'PayMaya':
            document.getElementById('paymaya-number-group').style.display = 'block';
            document.getElementById('paymaya-number').setAttribute('required', '');
            break;
        case 'Bank Transfer':
            document.getElementById('bank-transfer-group').style.display = 'block';
            document.getElementById('bank-name').setAttribute('required', '');
            document.getElementById('account-number').setAttribute('required', '');
            document.getElementById('account-name').setAttribute('required', '');
            break;
    }
});
    
    // Quick amount selection
    document.querySelectorAll('.amount-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.getElementById('amount').value = this.dataset.amount;
        });
    });
    
    // Form submission
    donationForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Disable form elements during submission to prevent double clicks
        const formElements = donationForm.querySelectorAll('button, input, textarea, select');
        formElements.forEach(element => {
            element.disabled = true;
        });
        
        try {
            if (validateDonationForm()) {
                processDonation();
            } else {
                // Re-enable form elements if validation fails
                enableFormElements();
            }
        } catch (err) {
            console.error('Error processing donation:', err);
            alert('An error occurred while processing your donation. Please try again.');
            // Re-enable form elements on error
            enableFormElements();
        }
    });
}

// Update the validation function
function validateDonationForm() {
    const form = document.getElementById('donation-form');
    const donationType = document.getElementById('donation-type').value;
    const amount = document.getElementById('amount').value;
    const paymentMethod = document.getElementById('payment-method').value;
    
    // Basic validation
    if (!donationType) {
        alert('Please select a donation type');
        return false;
    }
    
    if (donationType !== 'In-kind' && (!amount || amount < 50)) {
        alert('Please enter a valid donation amount (minimum ₱50)');
        return false;
    }
    
    if (donationType === 'In-kind' && !document.getElementById('items').value) {
        alert('Please describe the items you are donating');
        return false;
    }
    
    if (!paymentMethod) {
        alert('Please select a payment method');
        return false;
    }
    
    // Payment method specific validation
    switch(paymentMethod) {
        case 'GCash':
            const gcashNumber = document.getElementById('gcash-number').value;
            if (!gcashNumber || !/^[0-9]{11}$/.test(gcashNumber)) {
                alert('Please enter a valid GCash number (11 digits)');
                return false;
            }
            break;
        case 'PayMaya':
            const paymayaNumber = document.getElementById('paymaya-number').value;
            if (!paymayaNumber || !/^[0-9]{11}$/.test(paymayaNumber)) {
                alert('Please enter a valid PayMaya number (11 digits)');
                return false;
            }
            break;
        case 'Bank Transfer':
            const bankName = document.getElementById('bank-name').value;
            const accountNumber = document.getElementById('account-number').value;
            const accountName = document.getElementById('account-name').value;
            
            if (!bankName) {
                alert('Please select a bank');
                return false;
            }
            
            if (!accountNumber || accountNumber.length < 10) {
                alert('Please enter a valid account number (at least 10 digits)');
                return false;
            }
            
            if (!accountName || accountName.length < 3) {
                alert('Please enter the recipient account name');
                return false;
            }
            break;
    }
    
    return true;
}
// Update the processDonation function to include payment details
function processDonation() {
    const form = document.getElementById('donation-form');
    const formData = new FormData(form);
    const donationData = {};
    
    // Disable form elements during processing
    const formElements = form.querySelectorAll('button, input, textarea, select');
    formElements.forEach(element => {
        element.disabled = true;
    });
    
    try {
        // Convert FormData to object
        formData.forEach((value, key) => {
            donationData[key] = value;
        });
        
        // Add payment details based on selected method
        const paymentMethod = donationData['payment-method'];
        switch(paymentMethod) {
            case 'GCash':
                donationData.paymentDetails = {
                    type: 'GCash',
                    number: document.getElementById('gcash-number').value
                };
                break;
            case 'PayMaya':
                donationData.paymentDetails = {
                    type: 'PayMaya',
                    number: document.getElementById('paymaya-number').value
                };
                break;
            case 'Bank Transfer':
                donationData.paymentDetails = {
                    type: 'Bank Transfer',
                    bank: document.getElementById('bank-name').value,
                    accountNumber: document.getElementById('account-number').value,
                    accountName: document.getElementById('account-name').value
                };
                break;
        }
        
        // Add additional metadata
        donationData.timestamp = new Date().toISOString();
        donationData.status = 'Completed';
        donationData.donorId = getCurrentUser()?.email || 'anonymous';
        donationData.transactionId = generateTransactionId();
        
        
        // Save the donation data for sharing/printing
        localStorage.setItem('lastDonation', JSON.stringify(donationData));
        // Save donation to local storage
        saveDonation(donationData);
        
        // Show confirmation
        showDonationConfirmation(donationData);
        
        // Reset form
        form.reset();
    } catch (err) {
        console.error('Error processing donation:', err);
        alert('An error occurred while processing your donation. Please try again.');
        // Re-enable form elements on error
        enableFormElements();
    }
}


function saveDonation(donationData) {
    let donations = JSON.parse(localStorage.getItem('donations')) || [];
    donations.push(donationData);
    localStorage.setItem('donations', JSON.stringify(donations));
    
    // Update recipient's received donations if specified
    if (donationData.recipient) {
        updateRecipientDonations(donationData.recipient, donationData);
    }
}

function updateRecipientDonations(recipientEmail, donationData) {
    let recipients = JSON.parse(localStorage.getItem('recipients')) || [];
    let recipient = recipients.find(r => r.email === recipientEmail);
    
    if (!recipient) {
        recipient = {
            email: recipientEmail,
            name: recipientEmail, // Default to email if name not available
            donations: [],
            totalReceived: 0
        };
        recipients.push(recipient);
    }
    
    // Add donation to recipient's record
    recipient.donations.push({
        amount: donationData.amount || 0,
        items: donationData.items || '',
        date: donationData.timestamp,
        transactionId: donationData.transactionId
    });
    
    // Update total received
    if (donationData.amount) {
        recipient.totalReceived += parseFloat(donationData.amount);
    }
    
    localStorage.setItem('recipients', JSON.stringify(recipients));
}

function generateTransactionId() {
    return 'DON-' + Date.now().toString(36).toUpperCase() + 
           Math.floor(Math.random() * 1000).toString().padStart(3, '0');
}

function showDonationConfirmation(donationData) {
    const modal = document.getElementById('donation-modal');
    const detailsContainer = document.getElementById('donation-details');
    
    // Format the amount with currency symbol
    const amount = donationData.amount ? 
        `₱${parseFloat(donationData.amount).toLocaleString('en-PH', {minimumFractionDigits: 2})}` : 
        'In-kind donation';
    
    // Build confirmation message
    let detailsHTML = `
        <div class="detail-row">
            <span class="detail-label">Transaction ID:</span>
            <span class="detail-value">${donationData.transactionId}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Amount:</span>
            <span class="detail-value">${amount}</span>
        </div>
    `;
    
    if (donationData.items) {
        detailsHTML += `
            <div class="detail-row">
                <span class="detail-label">Items:</span>
                <span class="detail-value">${donationData.items}</span>
            </div>
        `;
    }
    
    if (donationData.recipient) {
        detailsHTML += `
            <div class="detail-row">
                <span class="detail-label">Recipient:</span>
                <span class="detail-value">${donationData.recipient}</span>
            </div>
        `;
    }
    
    detailsHTML += `
        <div class="detail-row">
            <span class="detail-label">Date:</span>
            <span class="detail-value">${new Date(donationData.timestamp).toLocaleString()}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Payment Method:</span>
            <span class="detail-value">${donationData['payment-method']}</span>
        </div>
    `;
    
    detailsContainer.innerHTML = detailsHTML;
    
    // Show modal
    modal.style.display = 'block';
    
    // Remove any existing event listeners by cloning and replacing elements
    const closeButton = document.querySelector('.close-modal');
    const printButton = document.getElementById('print-receipt');
    const shareButton = document.getElementById('share-receipt');
    
    // Clone and replace the close button to remove any existing event listeners
    const newCloseButton = closeButton.cloneNode(true);
    closeButton.parentNode.replaceChild(newCloseButton, closeButton);
    
    // Clone and replace the print button
    if (printButton) {
        const newPrintButton = printButton.cloneNode(true);
        printButton.parentNode.replaceChild(newPrintButton, printButton);
        
        // Add event listener to the new button
        newPrintButton.addEventListener('click', function(e) {
            e.stopPropagation();
            printDonationReceipt(donationData);
        });
    }
    
    // Clone and replace the share button
    if (shareButton) {
        const newShareButton = shareButton.cloneNode(true);
        shareButton.parentNode.replaceChild(newShareButton, shareButton);
        
        // Add event listener to the new button
        newShareButton.addEventListener('click', function(e) {
            e.stopPropagation();
            shareDonation(donationData);
        });
    }
      
    // Add a new event listener to the new close button
    newCloseButton.addEventListener('click', function(e) {
        e.stopPropagation();
        safeCloseModal(modal);
    });
    
    // Handle outside clicks with one-time event listener
    const outsideClickHandler = function(e) {
        if (e.target === modal) {
            safeCloseModal(modal);
            // Remove this event listener once used
            window.removeEventListener('click', outsideClickHandler);
        }
    };
    
    window.addEventListener('click', outsideClickHandler);
    
    // Add escape key handler
    const escKeyHandler = function(e) {
        if (e.key === 'Escape') {
            safeCloseModal(modal);
            // Remove this event listener once used
            document.removeEventListener('keydown', escKeyHandler);
        }
    };
    
    document.addEventListener('keydown', escKeyHandler);
}

// Function to close modal and clean up event listeners
function closeModal(modal) {
    modal.style.display = 'none';
    
    // Re-enable form and buttons using our utility function
    enableFormElements();
}

// Print receipt functionality - FIXED
function printDonationReceipt(donationData) {
    const modalContent = document.querySelector('.modal-content').cloneNode(true);
    
    // Remove elements we don't want in the print
    const closeBtn = modalContent.querySelector('.close-modal');
    if (closeBtn) closeBtn.remove();
    
    const modalActions = modalContent.querySelector('.modal-actions');
    if (modalActions) modalActions.remove();
    
    // Create a print-friendly version
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        alert('Please allow pop-ups for this site to print your receipt.');
        return;
    }
    
    printWindow.document.write(`
        <html>
            <head>
                <title>Donation Receipt</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    .receipt-header { text-align: center; margin-bottom: 20px; }
                    .receipt-title { font-size: 24px; margin-bottom: 5px; }
                    .receipt-subtitle { font-size: 14px; color: #666; }
                    .receipt-details { margin: 30px 0; }
                    .detail-row { display: flex; margin-bottom: 10px; }
                    .detail-label { font-weight: bold; width: 150px; }
                    .thank-you { margin-top: 30px; font-style: italic; text-align: center; }
                    hr { border: none; border-top: 1px dashed #ccc; margin: 20px 0; }
                    .success-icon { text-align: center; color: #4CAF50; font-size: 50px; margin: 20px 0; }
                </style>
            </head>
            <body>
                <div class="receipt-header">
                    <div class="success-icon">✓</div>
                    <div class="receipt-title">Learn2Grow</div>
                    <div class="receipt-subtitle">Donation Receipt</div>
                </div>
                <hr>
                <div class="receipt-details">
                    ${modalContent.querySelector('#donation-details').innerHTML}
                </div>
                <hr>
                <div class="thank-you">
                    Thank you for your generous donation!<br>
                    Your support makes a difference.
                </div>
                <script>
                    window.onload = function() {
                        window.print();
                        setTimeout(function() {
                            window.close();
                        }, 1000);
                    };
                </script>
            </body>
        </html>
    `);
    
    printWindow.document.close();
}

// Share functionality - FIXED
function shareDonation(donationData) {
    const shareText = `I just donated to ${donationData.recipient || 'a worthy cause'} through Learn2Grow! ` +
                     `Join me in making a difference. #Learn2Grow #DonateForGood`;
    
    if (navigator.share) {
        navigator.share({
            title: 'My Donation on Learn2Grow',
            text: shareText,
            url: window.location.href
        }).catch(err => {
            console.log('Error sharing:', err);
            fallbackShare(shareText);
        });
    } else {
        fallbackShare(shareText);
    }
}

function fallbackShare(shareText) {
    // Copy to clipboard
    navigator.clipboard.writeText(shareText).then(() => {
        alert('Copied to clipboard! You can now paste and share your donation.');
    }).catch(err => {
        console.error('Could not copy text: ', err);
        // Fallback to prompt if clipboard fails
        prompt('Copy this text to share your donation:', shareText);
    });
}

function loadRecipientSuggestions() {
    // Load recipients from posts or other sources
    const recipientInput = document.getElementById('recipient');
    const suggestionsContainer = document.getElementById('recipient-suggestions');
    
    if (!recipientInput || !suggestionsContainer) return;
    
    recipientInput.addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase();
        if (searchTerm.length < 2) {
            suggestionsContainer.innerHTML = '';
            suggestionsContainer.style.display = 'none';
            return;
        }
        
        // Get suggestions from posts or other sources
        const posts = JSON.parse(localStorage.getItem('posts')) || [];
        const recipients = [...new Set(posts.map(post => post.authorEmail))];
        
        const filtered = recipients.filter(email => 
            email.toLowerCase().includes(searchTerm)
        ).slice(0, 5);
        
        if (filtered.length > 0) {
            suggestionsContainer.innerHTML = filtered.map(email => 
                `<div class="suggestion-item" data-email="${email}">${email}</div>`
            ).join('');
            suggestionsContainer.style.display = 'block';
            
            // Add click handler to suggestions
            document.querySelectorAll('.suggestion-item').forEach(item => {
                item.addEventListener('click', function() {
                    recipientInput.value = this.dataset.email;
                    suggestionsContainer.style.display = 'none';
                });
            });
        } else {
            suggestionsContainer.innerHTML = '';
            suggestionsContainer.style.display = 'none';
        }
    });
    
    // Hide suggestions when clicking outside
    document.addEventListener('click', function(e) {
        if (e.target !== recipientInput) {
            suggestionsContainer.style.display = 'none';
        }
    });
}

function getCurrentUser() {
    const userData = localStorage.getItem('currentUser');
    return userData ? JSON.parse(userData) : null;
}

// Helper function to re-enable form elements after submission
function enableFormElements() {
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        const formElements = form.querySelectorAll('button, input, textarea, select');
        formElements.forEach(element => {
            element.disabled = false;
        });
    });
}

// Helper function to safely close modals
function safeCloseModal(modal) {
    if (modal) {
        modal.style.display = 'none';
        // Re-enable form elements 
        enableFormElements();
    }
}
