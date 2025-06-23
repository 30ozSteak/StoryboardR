const express = require('express');
const multer = require('multer');
const router = express.Router();
const path = require('path');
const fs = require('fs-extra');

// Configure multer for cookie file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const cookieDir = path.join(__dirname, '..');
    cb(null, cookieDir);
  },
  filename: (req, file, cb) => {
    cb(null, 'cookies.txt');
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    // Accept text files only
    if (file.mimetype === 'text/plain' || file.originalname.endsWith('.txt')) {
      cb(null, true);
    } else {
      cb(new Error('Only .txt cookie files are allowed'), false);
    }
  },
  limits: {
    fileSize: 1024 * 1024 // 1MB limit for cookie files
  }
});

// Upload cookies file
router.post('/upload', upload.single('cookies'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No cookie file uploaded' });
    }

    console.log('Cookie file uploaded successfully');

    res.json({
      message: 'Cookie file uploaded successfully',
      filename: req.file.filename,
      size: req.file.size
    });

  } catch (error) {
    console.error('Error uploading cookie file:', error);
    res.status(500).json({
      error: 'Failed to upload cookie file',
      message: error.message
    });
  }
});

// Check if cookies file exists
router.get('/status', (req, res) => {
  const cookiesPath = path.join(__dirname, '..', 'cookies.txt');
  const exists = fs.existsSync(cookiesPath);

  let stats = null;
  if (exists) {
    const fileStats = fs.statSync(cookiesPath);
    stats = {
      size: fileStats.size,
      modified: fileStats.mtime,
      age: Date.now() - fileStats.mtime.getTime()
    };
  }

  res.json({
    hasCookies: exists,
    stats: stats
  });
});

// Delete cookies file
router.delete('/clear', async (req, res) => {
  try {
    const cookiesPath = path.join(__dirname, '..', 'cookies.txt');

    if (fs.existsSync(cookiesPath)) {
      await fs.remove(cookiesPath);
      res.json({ message: 'Cookie file deleted successfully' });
    } else {
      res.status(404).json({ error: 'No cookie file found' });
    }

  } catch (error) {
    console.error('Error deleting cookie file:', error);
    res.status(500).json({
      error: 'Failed to delete cookie file',
      message: error.message
    });
  }
});

// Handle multer errors
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: 'File too large',
        message: 'Cookie file must be smaller than 1MB'
      });
    }
    return res.status(400).json({
      error: 'Upload error',
      message: error.message
    });
  }

  if (error.message === 'Only .txt cookie files are allowed') {
    return res.status(400).json({
      error: 'Invalid file type',
      message: 'Only .txt cookie files are allowed'
    });
  }

  next(error);
});

module.exports = router;
