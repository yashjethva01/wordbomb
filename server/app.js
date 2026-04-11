'use strict';

const express = require('express');
const cors    = require('cors');

function createApp(clientUrl) {
  const app = express();

  app.use(cors({ origin: clientUrl, credentials: true }));
  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.use((_req, res) => {
    res.status(404).json({ error: 'Not found' });
  });

  return app;
}

module.exports = { createApp };
