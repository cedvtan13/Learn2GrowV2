// utils/emailAutomation.js
import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import emailService from './emailService.js';

/**
 * Process new recipient requests and send appropriate emails
 * @param {Object} request - The recipient request document
 * @returns {Object} Object with status of email sending operations
 */
export const processNewRecipientRequest = async (request) => {
  try {
    console.log(`🔄 Processing emails for new recipient request: ${request.name} (${request.email})`);
    
    const results = {
      adminNotification: false,
      confirmation: false
    };
    
    // Send notification to admin
    if (!request.emailsSent?.adminNotification) {
      try {
        results.adminNotification = await emailService.sendRecipientRequestToAdmin(
          request.name, 
          request.email
        );
        
        if (results.adminNotification) {
          // Update the request to mark admin notification as sent
          request.emailsSent = request.emailsSent || {};
          request.emailsSent.adminNotification = true;
          request.lastEmailSent = new Date();
          request.lastEmailType = 'adminNotification';
        }
      } catch (error) {
        console.error(`❌ Error sending admin notification email for ${request.email}:`, error);
      }
    }
    
    // Send confirmation to user
    if (!request.emailsSent?.confirmation) {
      try {
        results.confirmation = await emailService.sendRecipientConfirmation(
          request.name, 
          request.email
        );
        
        if (results.confirmation) {
          // Update the request to mark confirmation as sent
          request.emailsSent = request.emailsSent || {};
          request.emailsSent.confirmation = true;
          request.lastEmailSent = new Date();
          request.lastEmailType = 'confirmation';
          await request.save();
        }
      } catch (error) {
        console.error(`❌ Error sending confirmation email to ${request.email}:`, error);
      }
    }
    
    console.log(`✅ Email processing completed for ${request.email}:`, results);
    return results;
  } catch (error) {
    console.error('❌ Error in processNewRecipientRequest:', error);
    return { error: true, message: error.message };
  }
};

/**
 * Process approval email for a recipient request
 * @param {Object} request - The recipient request document
 * @returns {Boolean} True if email sent successfully
 */
export const processApprovalEmail = async (request) => {
  try {
    console.log(`🔄 Processing approval email for: ${request.name} (${request.email})`);
    
    // Don't send if already marked as sent
    if (request.emailsSent?.approval) {
      console.log(`⏩ Approval email already sent to ${request.email}, skipping`);
      return true;
    }
    
    // Send approval email
    const sent = await emailService.sendRecipientApproval(
      request.name, 
      request.email
    );
    
    if (sent) {
      // Update the request to mark approval email as sent
      request.emailsSent = request.emailsSent || {};
      request.emailsSent.approval = true;
      request.lastEmailSent = new Date();
      request.lastEmailType = 'approval';
      await request.save();
      console.log(`✅ Approval email sent to ${request.email}`);
    }
    
    return sent;
  } catch (error) {
    console.error(`❌ Error sending approval email to ${request.email}:`, error);
    return false;
  }
};

/**
 * Process verification email for a recipient request
 * @param {Object} request - The recipient request document
 * @param {String} notes - Additional verification notes
 * @returns {Boolean} True if email sent successfully
 */
export const processVerificationEmail = async (request, notes = '') => {
  try {
    console.log(`🔄 Processing verification email for: ${request.name} (${request.email})`);
    
    // Don't send if already marked as sent (unless we have new notes)
    if (request.emailsSent?.verification && !notes) {
      console.log(`⏩ Verification email already sent to ${request.email}, skipping`);
      return true;
    }
    
    // Send verification email
    const sent = await emailService.sendRecipientVerification(
      request.name, 
      request.email,
      notes || request.notes
    );
    
    if (sent) {
      // Update the request to mark verification email as sent
      request.emailsSent = request.emailsSent || {};
      request.emailsSent.verification = true;
      request.lastEmailSent = new Date();
      request.lastEmailType = 'verification';
      await request.save();
      console.log(`✅ Verification email sent to ${request.email}`);
    }
    
    return sent;
  } catch (error) {
    console.error(`❌ Error sending verification email to ${request.email}:`, error);
    return false;
  }
};

/**
 * Batch process pending emails for all recipient requests in the database
 * Useful for scheduled jobs or manual triggers
 * @returns {Object} Summary of processing results
 */
export const processPendingEmails = async () => {
  try {
    console.log('🔄 Starting batch processing of pending emails');
    
    // Import the RecipientRequest model
    const RecipientRequest = (await import('../models/recipientRequestModel.js')).default;
    
    // Get all requests that might need emails
    const requests = await RecipientRequest.find({
      $or: [
        { 'emailsSent.confirmation': { $ne: true } },
        { 
          status: 'approved',
          'emailsSent.approval': { $ne: true }
        },
        {
          status: 'rejected',
          'emailsSent.verification': { $ne: true }
        }
      ]
    });
    
    console.log(`📋 Found ${requests.length} requests that may need emails`);
    
    const results = {
      total: requests.length,
      confirmationSent: 0,
      approvalSent: 0,
      verificationSent: 0,
      errors: 0
    };
      // Process each request
    for (const request of requests) {
      try {
        // Send confirmation emails for new requests
        if (!request.emailsSent?.confirmation) {
          const confirmationResult = await processNewRecipientRequest(request);
          if (confirmationResult.confirmation) {
            results.confirmationSent++;
          }
        }
        
        // Send approval emails for approved requests
        if (request.status === 'approved' && !request.emailsSent?.approval) {
          const approvalSent = await processApprovalEmail(request);
          if (approvalSent) {
            results.approvalSent++;
          }
        }
        
        // Send verification emails for both 'pending' and 'rejected' requests
        // This ensures new registrations get verification emails even in batch mode
        if ((request.status === 'pending' || request.status === 'rejected') && !request.emailsSent?.verification) {
          const verificationSent = await processVerificationEmail(request);
          if (verificationSent) {
            results.verificationSent++;
          }
        }
      } catch (error) {
        console.error(`❌ Error processing emails for request ${request._id}:`, error);
        results.errors++;
      }
    }
    
    console.log('✅ Batch processing complete. Results:', results);
    return results;
  } catch (error) {
    console.error('❌ Error in processPendingEmails:', error);
    return { error: true, message: error.message };
  }
};

export default {
  processNewRecipientRequest,
  processApprovalEmail,
  processVerificationEmail,
  processPendingEmails
};