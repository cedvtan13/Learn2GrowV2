// test-env.js
import dotenv from 'dotenv';
dotenv.config();

// Log the env variables we're interested in
console.log('Environment Variables:');
console.log('RESEND_API_KEY:', process.env.RESEND_API_KEY);
console.log('FROM_EMAIL:', process.env.FROM_EMAIL);
console.log('WEBSITE_URL:', process.env.WEBSITE_URL);
console.log('FORCE_SEND_EMAILS:', process.env.FORCE_SEND_EMAILS);
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('VERIFIED_EMAILS:', process.env.VERIFIED_EMAILS);
