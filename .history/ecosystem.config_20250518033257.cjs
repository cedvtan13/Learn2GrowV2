// ecosystem.config.cjs - CommonJS version for PM2
module.exports = {
  apps: [
    {
      name: "learn2grow-emails",
      script: "scheduledEmails.js",
      args: "--interval=60", // Check every 60 minutes
      watch: false,
      autorestart: true,
      restart_delay: 3000,
      env: {
        NODE_ENV: "production"
      },
      log_date_format: "YYYY-MM-DD HH:mm:ss",
      error_file: "./logs/email-error.log",
      out_file: "./logs/email-out.log",
    },
    {
      name: "learn2grow-server",
      script: "server.js",
      watch: false,
      autorestart: true,
      env: {
        NODE_ENV: "production"
      },
      log_date_format: "YYYY-MM-DD HH:mm:ss",
      error_file: "./logs/server-error.log",
      out_file: "./logs/server-out.log",
    }
  ]
};
