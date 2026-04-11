'use strict';

require('dotenv').config();

const http               = require('http');
const { createApp }      = require('./app');
const { initSocketIO }   = require('./src/socket/index');
const { loadDictionary } = require('./src/config/dictionary');

const PORT       = parseInt(process.env.PORT || '3002', 10);
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// Load dictionary synchronously at startup so every room uses the same Set.
loadDictionary();

const app        = createApp(CLIENT_URL);
const httpServer = http.createServer(app);

initSocketIO(httpServer, CLIENT_URL);

httpServer.listen(PORT, () => {
  console.log(`[Server] WordBomb running on port ${PORT}`);
  console.log(`[Server] Accepting connections from ${CLIENT_URL}`);
  console.log(`[Server] Environment: ${process.env.NODE_ENV || 'development'}`);
});

function shutdown(signal) {
  console.log(`\n[Server] ${signal} received — shutting down`);
  httpServer.close(() => {
    console.log('[Server] HTTP server closed');
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));

process.on('uncaughtException', (err) => {
  console.error('[Server] Uncaught exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('[Server] Unhandled rejection:', reason);
  process.exit(1);
});
