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
const dataDir = path.join(__dirname, 'data');
const storyboardsFile = path.join(dataDir, 'storyboards.json');
const extractionsFile = path.join(dataDir, 'extractions.json');

fs.ensureDirSync(tempDir);
fs.ensureDirSync(uploadsDir);
fs.ensureDirSync(keyframesDir);
fs.ensureDirSync(dataDir);

// Initialize data files if they don't exist
if (!fs.existsSync(storyboardsFile)) {
  fs.writeFileSync(storyboardsFile, JSON.stringify({ storyboards: [] }, null, 2));
}
if (!fs.existsSync(extractionsFile)) {
  fs.writeFileSync(extractionsFile, JSON.stringify({ extractions: [] }, null, 2));
}

// Routes
app.use('/api/upload', fileUpload);
app.use('/api/video', videoProcessor);
app.use('/api/cookies', cookieManager);
app.use('/api/projects', projectRoutes);

// Storyboard API endpoints
app.post('/api/storyboards', async (req, res) => {
  try {
    const { name, description, keyframes, videoSource, metadata } = req.body;
    
    if (!name || !keyframes || !Array.isArray(keyframes)) {
      return res.status(400).json({ 
        error: 'Invalid storyboard data. Name and keyframes array required.' 
      });
    }

    const storyboard = {
      id: require('crypto').randomUUID(),
      name,
      description: description || '',
      videoSource: videoSource || '',
      keyframes,
      metadata: metadata || {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const data = await fs.readJSON(storyboardsFile);
    data.storyboards.push(storyboard);
    await fs.writeJSON(storyboardsFile, data, { spaces: 2 });

    res.status(201).json({ 
      success: true, 
      storyboard: { id: storyboard.id, name: storyboard.name, createdAt: storyboard.createdAt }
    });
  } catch (error) {
    console.error('Error saving storyboard:', error);
    res.status(500).json({ error: 'Failed to save storyboard', message: error.message });
  }
});

app.get('/api/storyboards', async (req, res) => {
  try {
    const data = await fs.readJSON(storyboardsFile);
    const storyboards = data.storyboards.map(sb => ({
      id: sb.id,
      name: sb.name,
      description: sb.description,
      videoSource: sb.videoSource,
      keyframeCount: sb.keyframes.length,
      createdAt: sb.createdAt,
      updatedAt: sb.updatedAt
    }));
    res.json({ storyboards });
  } catch (error) {
    console.error('Error fetching storyboards:', error);
    res.status(500).json({ error: 'Failed to fetch storyboards', message: error.message });
  }
});

app.get('/api/storyboards/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const data = await fs.readJSON(storyboardsFile);
    const storyboard = data.storyboards.find(sb => sb.id === id);
    
    if (!storyboard) {
      return res.status(404).json({ error: 'Storyboard not found' });
    }

    res.json({ storyboard });
  } catch (error) {
    console.error('Error fetching storyboard:', error);
    res.status(500).json({ error: 'Failed to fetch storyboard', message: error.message });
  }
});

app.put('/api/storyboards/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, keyframes, videoSource, metadata } = req.body;
    
    const data = await fs.readJSON(storyboardsFile);
    const storyboardIndex = data.storyboards.findIndex(sb => sb.id === id);
    
    if (storyboardIndex === -1) {
      return res.status(404).json({ error: 'Storyboard not found' });
    }

    data.storyboards[storyboardIndex] = {
      ...data.storyboards[storyboardIndex],
      name: name || data.storyboards[storyboardIndex].name,
      description: description !== undefined ? description : data.storyboards[storyboardIndex].description,
      keyframes: keyframes || data.storyboards[storyboardIndex].keyframes,
      videoSource: videoSource !== undefined ? videoSource : data.storyboards[storyboardIndex].videoSource,
      metadata: metadata || data.storyboards[storyboardIndex].metadata,
      updatedAt: new Date().toISOString()
    };

    await fs.writeJSON(storyboardsFile, data, { spaces: 2 });
    res.json({ success: true, storyboard: data.storyboards[storyboardIndex] });
  } catch (error) {
    console.error('Error updating storyboard:', error);
    res.status(500).json({ error: 'Failed to update storyboard', message: error.message });
  }
});

app.delete('/api/storyboards/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const data = await fs.readJSON(storyboardsFile);
    const initialLength = data.storyboards.length;
    data.storyboards = data.storyboards.filter(sb => sb.id !== id);
    
    if (data.storyboards.length === initialLength) {
      return res.status(404).json({ error: 'Storyboard not found' });
    }

    await fs.writeJSON(storyboardsFile, data, { spaces: 2 });
    res.json({ success: true, message: 'Storyboard deleted successfully' });
  } catch (error) {
    console.error('Error deleting storyboard:', error);
    res.status(500).json({ error: 'Failed to delete storyboard', message: error.message });
  }
});

// Extraction API endpoints
app.post('/api/extractions', async (req, res) => {
  try {
    const { videoUrl, sessionId, keyframes, settings, metadata } = req.body;
    
    if (!videoUrl || !keyframes || !Array.isArray(keyframes)) {
      return res.status(400).json({ 
        error: 'Invalid extraction data. Video URL and keyframes array required.' 
      });
    }

    const extraction = {
      id: require('crypto').randomUUID(),
      videoUrl,
      sessionId: sessionId || require('crypto').randomUUID(),
      keyframes,
      settings: settings || {},
      metadata: metadata || {},
      createdAt: new Date().toISOString()
    };

    const data = await fs.readJSON(extractionsFile);
    data.extractions.push(extraction);
    await fs.writeJSON(extractionsFile, data, { spaces: 2 });

    res.status(201).json({ 
      success: true, 
      extraction: { 
        id: extraction.id, 
        sessionId: extraction.sessionId,
        keyframeCount: extraction.keyframes.length,
        createdAt: extraction.createdAt 
      }
    });
  } catch (error) {
    console.error('Error saving extraction:', error);
    res.status(500).json({ error: 'Failed to save extraction', message: error.message });
  }
});

app.get('/api/extractions', async (req, res) => {
  try {
    const data = await fs.readJSON(extractionsFile);
    const extractions = data.extractions.map(ext => ({
      id: ext.id,
      videoUrl: ext.videoUrl,
      sessionId: ext.sessionId,
      keyframeCount: ext.keyframes.length,
      createdAt: ext.createdAt
    }));
    res.json({ extractions });
  } catch (error) {
    console.error('Error fetching extractions:', error);
    res.status(500).json({ error: 'Failed to fetch extractions', message: error.message });
  }
});

app.get('/api/extractions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const data = await fs.readJSON(extractionsFile);
    const extraction = data.extractions.find(ext => ext.id === id);
    
    if (!extraction) {
      return res.status(404).json({ error: 'Extraction not found' });
    }

    res.json({ extraction });
  } catch (error) {
    console.error('Error fetching extraction:', error);
    res.status(500).json({ error: 'Failed to fetch extraction', message: error.message });
  }
});

app.delete('/api/extractions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const data = await fs.readJSON(extractionsFile);
    const initialLength = data.extractions.length;
    data.extractions = data.extractions.filter(ext => ext.id !== id);
    
    if (data.extractions.length === initialLength) {
      return res.status(404).json({ error: 'Extraction not found' });
    }

    await fs.writeJSON(extractionsFile, data, { spaces: 2 });
    res.json({ success: true, message: 'Extraction deleted successfully' });
  } catch (error) {
    console.error('Error deleting extraction:', error);
    res.status(500).json({ error: 'Failed to delete extraction', message: error.message });
  }
});

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
