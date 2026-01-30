const express = require('express');
const cors = require('cors');
const logger = require('../utils/logger');

const app = express();

// Middleware
app.use(cors()); // allow all origins
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// Routes
const healthRoutes = require('../routes/healthRoutes');
const containerRoutes = require('../routes/containerRoutes');

app.use('/health', healthRoutes);
app.use('/api/containers', containerRoutes);

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ message: 'Worker service is running' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err.message);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

module.exports = app;
