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
        if (this.value === 'GCash') {
            gcashNumberGroup.style.display = 'block';
            document.getElementById('gcash-number').setAttribute('required', '');
        } else {
            gcashNumberGroup.style.display = 'none';
            document.getElementById('gcash-number').removeAttribute('required');
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
        
        if (validateDonationForm()) {
            processDonation();
        }
    });
}

function validateDonationForm() {
    const form = document.getElementById('donation-form');
    const donationType = document.getElementById('donation-type').value;
    const amount = document.getElementById('amount').value;
    const paymentMethod = document.getElementById('payment-method').value;
    const gcashNumber = document.getElementById('gcash-number').value;
    
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
    
    if (paymentMethod === 'GCash' && (!gcashNumber || !/^[0-9]{11}$/.test(gcashNumber))) {
        alert('Please enter a valid GCash number (11 digits)');
        return false;
    }
    
    return true;
}

function processDonation() {
    const form = document.getElementById('donation-form');
    const formData = new FormData(form);
    const donationData = {};
    
    // Convert FormData to object
    formData.forEach((value, key) => {
        donationData[key] = value;
    });
    
    // Add additional metadata
    donationData.timestamp = new Date().toISOString();
    donationData.status = 'Completed';
    donationData.donorId = getCurrentUser()?.email || 'anonymous';
    donationData.transactionId = generateTransactionId();
    
    // Save donation to local storage
    saveDonation(donationData);
    
    // Show confirmation
    showDonationConfirmation(donationData);
    
    // Reset form
    form.reset();
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
    
    // Close modal when clicking X
    document.querySelector('.close-modal').addEventListener('click', function() {
        modal.style.display = 'none';
    });
    
    // Close modal when clicking outside
    window.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
    
    // Print receipt functionality
    document.getElementById('print-receipt').addEventListener('click', function() {
        printReceipt(donationData);
    });
    
    // Share donation functionality
    document.getElementById('share-donation').addEventListener('click', function() {
        shareDonation(donationData);
    });
}

function printReceipt(donationData) {
    // Create a printable version of the receipt
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html>
            <head>
                <title>Donation Receipt - ${donationData.transactionId}</title>
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
                </style>
            </head>
            <body>
                <div class="receipt-header">
                    <div class="receipt-title">Learn2Grow</div>
                    <div class="receipt-subtitle">Donation Receipt</div>
                </div>
                <hr>
                <div class="receipt-details">
                    ${document.getElementById('donation-details').innerHTML}
                </div>
                <hr>
                <div class="thank-you">
                    Thank you for your generous donation!<br>
                    Your support makes a difference.
                </div>
            </body>
        </html>
    `);
    printWindow.document.close();
    printWindow.print();
}

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
    // Copy to clipboard as fallback
    navigator.clipboard.writeText(shareText).then(() => {
        alert('Copied to clipboard! You can now paste and share it.');
    }).catch(err => {
        console.error('Could not copy text: ', err);
        prompt('Copy this text to share:', shareText);
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