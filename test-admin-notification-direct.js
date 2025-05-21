// test-admin-notification-direct.js
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

async function testAdminNotificationTemplate() {
  console.log('Testing admin notification template directly...');
  
  try {
    const recipientName = 'Test Recipient';
    const recipientEmail = 'testrecipient@example.com';
    const websiteUrl = process.env.WEBSITE_URL || 'http://localhost:3000';
    
    // Create HTML content directly
    const subject = 'New Recipient Registration Request';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #4CAF50;">New Recipient Registration</h2>
        <p>Hello Admin,</p>
        <p>A new recipient has registered on Learn2Grow and requires your approval:</p>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Name:</strong></td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;">${recipientName}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Email:</strong></td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;">${recipientEmail}</td>
          </tr>
        </table>        <p>Please log in to the admin dashboard to review this application.</p>
        <div style="margin: 20px 0;">
          <a href="${websiteUrl}/admin.html" style="background-color: #4CAF50; color: white; padding: 10px 15px; text-decoration: none; border-radius: 4px; display: inline-block;">Go to Admin Dashboard</a>
        </div>
        <hr style="border: 1px solid #f0f0f0; margin: 20px 0;">
        <p>Best regards,<br>Learn2Grow System</p>
      </div>
    `;
    
    // Save to file
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `admin-notification-${timestamp}.html`;
    const emailDir = path.join(process.cwd(), 'email-logs');
    
    if (!fs.existsSync(emailDir)) {
      fs.mkdirSync(emailDir, { recursive: true });
    }
    
    const filePath = path.join(emailDir, filename);
    fs.writeFileSync(filePath, html);
    
    console.log(`Admin notification template saved to: ${filePath}`);
    
    // Print to console
    console.log('\nEmail Subject:', subject);
    console.log('\nEmail Content Preview:');
    console.log('-------------------------------------');
    console.log(html.substring(0, 200) + '...');
    console.log('-------------------------------------');
  } catch (error) {
    console.error('Error generating admin notification template:', error);
  }
}

testAdminNotificationTemplate();

testAdminNotificationTemplate();
