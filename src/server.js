const app = require('./app');
const env = require('./config/env');

const server = app.listen(env.PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 Teenager Expense Tracker API running on port ${env.PORT}`);
  console.log(`🌐 Environment: ${env.NODE_ENV}`);
  console.log(`🔒 Security: Helmet, CORS, Rate-Limiting, Bcrypt Active`);
  console.log(`📊 Health Check: http://localhost:${env.PORT}/health`);
  console.log(`====================================================`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received. Closing HTTP server...');
  server.close(() => {
    console.log('HTTP server closed cleanly.');
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received. Closing HTTP server...');
  server.close(() => {
    console.log('HTTP server closed cleanly.');
    process.exit(0);
  });
});
