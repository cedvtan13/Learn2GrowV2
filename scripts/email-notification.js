// scripts/email-notification.js
document.addEventListener('DOMContentLoaded', function() {
    // Show notification for non-verified emails
    function showVerificationNotice() {
        const notificationContainer = document.createElement('div');
        notificationContainer.style.position = 'fixed';
        notificationContainer.style.top = '20px';
        notificationContainer.style.right = '20px';
        notificationContainer.style.backgroundColor = '#f8d7da';
        notificationContainer.style.border = '1px solid #f5c6cb';
        notificationContainer.style.borderRadius = '4px';
        notificationContainer.style.padding = '15px';
        notificationContainer.style.boxShadow = '0 0 10px rgba(0,0,0,0.1)';
        notificationContainer.style.maxWidth = '350px';
        notificationContainer.style.zIndex = '9999';
        
        notificationContainer.innerHTML = `
            <div style="display: flex; align-items: start;">
                <div style="margin-right: 10px; color: #721c24; font-size: 20px;">⚠️</div>
                <div>
                    <p style="margin: 0; color: #721c24; font-weight: bold;">Verification Email Notice</p>
                    <p style="margin: 5px 0 0; color: #721c24;">
                        <b>Testing Mode:</b> Verification emails are only sent to verified addresses while our domain verification is pending.
                        <br><br>
                        <b>All verification emails are currently being redirected to:</b> 21101045@usc.edu.ph
                        <br><br>
                        Your registration is still saved correctly in our system and will be processed once domain verification is complete.
                    </p>
                    <button id="closeNotification" style="background: #721c24; color: white; border: none; padding: 5px 10px; margin-top: 10px; border-radius: 3px; cursor: pointer;">
                        Close
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(notificationContainer);
        
        // Add close functionality
        document.getElementById('closeNotification').addEventListener('click', function() {
            notificationContainer.remove();
            localStorage.setItem('emailNoticeShown', 'true');
        });
    }
    
    // Show notification if not already shown in this session
    if (!localStorage.getItem('emailNoticeShown')) {
        showVerificationNotice();
    }
});
