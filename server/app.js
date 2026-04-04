'use strict';

const express = require('express');
const cors = require('cors');

function createApp() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString()
    });
  });

  // 404 catch-all middleware
  app.use((req, res) => {
    res.status(404).json({ error: 'Not Found' });
  });

  return app;
}

module.exports = { createApp };