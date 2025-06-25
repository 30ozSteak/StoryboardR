const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs-extra');
const videoProcessor = require('./src/videoProcessor');
const fileUpload = require('./src/fileUpload');
const cookieManager = require('./src/cookieManager');
const projectRoutes = require('./src/projectRoutes');
const SessionCleanup = require('./src/sessionCleanup');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize session cleanup
const sessionCleanup = new SessionCleanup();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Create temp directories if they don't exist
const tempDir = path.join(__dirname, 'temp');
const uploadsDir = path.join(__dirname, 'temp', 'uploads');
const keyframesDir = path.join(__dirname, 'temp', 'keyframes');

fs.ensureDirSync(tempDir);
fs.ensureDirSync(uploadsDir);
fs.ensureDirSync(keyframesDir);

// Routes
app.use('/api/upload', fileUpload);
app.use('/api/video', videoProcessor);
app.use('/api/cookies', cookieManager);
app.use('/api/projects', projectRoutes);

// Serve static files FIRST (before SPA catch-all)
app.use(express.static(path.join(__dirname, 'public')));

// Serve static keyframe images
app.use('/keyframes', express.static(keyframesDir));

// SPA catch-all - serve app.html for ALL non-API routes
app.get('*', (req, res, next) => {
  // Only serve SPA for non-API routes
  if (req.path.startsWith('/api/')) {
    return next(); // Let API routes handle themselves
  }
  
  // Serve the SPA for ALL other routes (including root)
  res.sendFile(path.join(__dirname, 'public', 'app.html'));
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Video Keyframes Extractor API is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Something went wrong!',
    message: err.message
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);

  // Start automatic session cleanup
  sessionCleanup.startAutomaticCleanup();
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nReceived SIGINT. Graceful shutdown...');
  sessionCleanup.stopAutomaticCleanup();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\nReceived SIGTERM. Graceful shutdown...');
  sessionCleanup.stopAutomaticCleanup();
  process.exit(0);
});

module.exports = app;
