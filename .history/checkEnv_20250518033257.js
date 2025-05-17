// checkEnv.js
// Check environment variables
import dotenv from 'dotenv';
dotenv.config();

console.log('Environment variables:');
console.log(`NODE_ENV: "${process.env.NODE_ENV}"`);
console.log(`EMAIL_HOST: "${process.env.EMAIL_HOST}"`);
console.log(`EMAIL_PORT: "${process.env.EMAIL_PORT}"`);
console.log(`EMAIL_USER: "${process.env.EMAIL_USER}"`);
console.log(`EMAIL_PASS: "${process.env.EMAIL_PASS ? '****' : 'not set'}"`);
console.log(`ADMIN_EMAIL: "${process.env.ADMIN_EMAIL}"`);

// Check if NODE_ENV is being overridden
console.log('\nChecking for NODE_ENV in system environment:');
console.log(`process.env.NODE_ENV: "${process.env.NODE_ENV}"`);

// Display all environment variables
console.log('\nAll environment variables:');
Object.keys(process.env)
  .filter(key => key.includes('NODE') || key.includes('EMAIL'))
  .forEach(key => {
    console.log(`${key}: "${process.env[key]}"`);
  });
