const path = require('path');
const express = require('express');
const cors = require('cors');
const logger = require('../utils/logger');

const app = express();

/* ---------------- Middleware ---------------- */
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

/* ---------------- API Routes ---------------- */
const apiRoutes = require('../routes/index');
app.use('/api', apiRoutes);

/* ---------------- Frontend (Vite dist) ---------------- */
const frontendPath = path.join(__dirname, '../../frontend-build');

// Serve static assets
app.use(express.static(frontendPath));

// SPA fallback (MUST be AFTER /api)
app.get('*', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

/* ---------------- Error Handling ---------------- */
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err.message);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

module.exports = app;
