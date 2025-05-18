// utils/emailAutomation.js
import dotenv from 'dotenv';
dotenv.config();
import emailService from './emailService.js';
import mongoose from 'mongoose';
import { connectDB } from '../db.js';

/**
 * Sends automated emails to all recipient requests with a specific status
 * @param {string} status - The status to filter requests by ('pending', 'approved', 'rejected')
 * @param {string} emailType - The type of email to send ('confirmation', 'approval', 'verification')
 * @param {boolean} onlyUnsent - If true, only send to recipients who haven't received this type of email yet
 */
export async function sendEmailsByStatus(status, emailType, onlyUnsent = false) {
  try {
    // Connect to the database if not already connected
    if (mongoose.connection.readyState !== 1) {
      await connectDB();
    }

    // Import the RecipientRequest model
    const RecipientRequest = (await import('../models/recipientRequestModel.js')).default;
    
    console.log(`🔍 Finding recipient requests with status: ${status}`);
    
    // Build the query
    const query = { status };
    
    // If onlyUnsent is true, filter for those who haven't been sent this type of email
    if (onlyUnsent) {
      query[`emailsSent.${emailType}`] = { $ne: true };
    }
    
    // Find all requests matching the query
    const requests = await RecipientRequest.find(query);
    
    console.log(`📋 Found ${requests.length} recipient requests to send emails to`);
    
    // Track successful and failed emails
    const results = {
      success: 0,
      failed: 0,
      recipients: []
    };
    
    // Send emails to each recipient
    for (const request of requests) {
      try {
        let success = false;
        
        switch (emailType) {
          case 'confirmation':
            success = await emailService.sendRecipientConfirmation(request.name, request.email);
            break;
          case 'approval':
            success = await emailService.sendRecipientApproval(request.name, request.email);
            break;
          case 'verification':
            success = await emailService.sendRecipientVerification(request.name, request.email, request.notes || '');
            break;
          default:
            console.warn(`⚠️ Unknown email type: ${emailType}`);
            continue;
        }
        
        if (success) {
          results.success++;
          results.recipients.push({
            id: request._id,
            name: request.name,
            email: request.email,
            status: 'sent'
          });
          
          // Update the database to mark this email as sent
          // First, ensure the emailsSent field exists
          if (!request.emailsSent) {
            request.emailsSent = {};
          }
          
          // Set this email type as sent
          request.emailsSent[emailType] = true;
          request.lastEmailSent = new Date();
          await request.save();
          
          console.log(`✅ ${emailType} email sent to ${request.email}`);
        } else {
          results.failed++;
          results.recipients.push({
            id: request._id,
            name: request.name,
            email: request.email,
            status: 'failed'
          });
          console.error(`❌ Failed to send ${emailType} email to ${request.email}`);
        }
      } catch (emailError) {
        results.failed++;
        console.error(`❌ Error sending ${emailType} email to ${request.email}:`, emailError);
      }
    }
    
    console.log(`📊 Email sending complete: ${results.success} successful, ${results.failed} failed`);
    return results;
  } catch (error) {
    console.error('❌ Error in sendEmailsByStatus:', error);
    throw error;
  }
}

/**
 * Sends follow-up verification emails to recipients who were marked for verification
 * but haven't responded within a specific timeframe
 * @param {number} daysAgo - Send follow-ups to requests that were set to verification status this many days ago
 */
export async function sendVerificationFollowUps(daysAgo = 7) {
  try {
    // Connect to the database if not already connected
    if (mongoose.connection.readyState !== 1) {
      await connectDB();
    }

    const RecipientRequest = (await import('../models/recipientRequestModel.js')).default;
    
    // Calculate the date threshold
    const threshold = new Date();
    threshold.setDate(threshold.getDate() - daysAgo);
    
    // Find requests that:
    // 1. Have 'rejected' status (which we're using for verification)
    // 2. Were reviewed before the threshold date
    // 3. Haven't received a follow-up email yet
    const requests = await RecipientRequest.find({
      status: 'rejected',
      reviewedAt: { $lt: threshold },
      'emailsSent.verificationFollowUp': { $ne: true }
    });
    
    console.log(`📋 Found ${requests.length} recipients needing verification follow-up`);
    
    // Track results
    const results = {
      success: 0,
      failed: 0,
      recipients: []
    };
    
    // Send follow-up emails
    for (const request of requests) {
      try {
        // Create a follow-up message
        const followUpMessage = `
          We noticed that you haven't completed your verification process yet. 
          Your application was flagged for verification on ${request.reviewedAt.toLocaleDateString()}.
          Please respond with the requested verification documents as soon as possible.
          
          Original notes: ${request.notes || 'No specific requirements noted.'} 
        `;
        
        const success = await emailService.sendRecipientVerification(
          request.name, 
          request.email, 
          followUpMessage
        );
        
        if (success) {
          results.success++;
          results.recipients.push({
            id: request._id,
            email: request.email,
            status: 'sent'
          });
          
          // Mark follow-up as sent
          if (!request.emailsSent) {
            request.emailsSent = {};
          }
          request.emailsSent.verificationFollowUp = true;
          request.lastEmailSent = new Date();
          await request.save();
          
          console.log(`✅ Verification follow-up sent to ${request.email}`);
        } else {
          results.failed++;
          console.error(`❌ Failed to send verification follow-up to ${request.email}`);
        }
      } catch (emailError) {
        results.failed++;
        console.error(`❌ Error sending verification follow-up to ${request.email}:`, emailError);
      }
    }
    
    console.log(`📊 Follow-up sending complete: ${results.success} successful, ${results.failed} failed`);
    return results;
  } catch (error) {
    console.error('❌ Error in sendVerificationFollowUps:', error);
    throw error;
  }
}

export default {
  sendEmailsByStatus,
  sendVerificationFollowUps
};
