const express = require('express');
const multer = require('multer');
const router = express.Router();
const path = require('path');
const fs = require('fs-extra');
const { v4: uuidv4 } = require('uuid');
const keyframeExtractor = require('./keyframeExtractor');
const jobManager = require('./jobManager');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '..', 'temp', 'uploads');
    fs.ensureDirSync(uploadDir);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const sessionId = uuidv4();
    const extension = path.extname(file.originalname);
    req.sessionId = sessionId; // Store session ID in request
    cb(null, `${sessionId}${extension}`);
  }
});

// File filter for video files
const fileFilter = (req, file, cb) => {
  const allowedMimes = [
    'video/mp4',
    'video/avi',
    'video/quicktime',
    'video/x-msvideo',
    'video/webm',
    'video/x-flv'
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only video files are allowed'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit
  }
});

// Upload and process video file
router.post('/file', upload.single('video'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No video file uploaded' });
    }

    console.log(`Processing uploaded file: ${req.file.filename}`);

    // Parse options from form data or body
    let options = {};
    if (req.body.options) {
      try {
        options = JSON.parse(req.body.options);
      } catch (e) {
        console.warn('Failed to parse options:', e.message);
      }
    } else {
      // Extract individual option fields
      options = {
        maxFrames: parseInt(req.body.maxFrames) || 50,
        includeLastFrame: req.body.includeLastFrame === 'true' || req.body.includeLastFrame === true
      };
    }

    console.log('Options:', options);

    // Generate session ID from filename
    const sessionId = path.parse(req.file.filename).name;
    const videoPath = req.file.path;
    const keyframesDir = path.join(__dirname, '..', 'temp', 'keyframes', sessionId);

    // Create job
    const job = jobManager.createJob(sessionId);

    // Return job ID immediately for progress tracking
    res.status(202).json({
      jobId: job.jobId,
      sessionId: job.sessionId,
      status: 'started',
      message: 'Processing started'
    });

    // Process asynchronously
    (async () => {
      try {
        // Ensure keyframes directory exists
        await fs.ensureDir(keyframesDir);

        // Update progress
        jobManager.updateJob(job.jobId, { status: 'extracting', progress: 50 });

        // Check if cancelled
        const currentJob = jobManager.getJob(job.jobId);
        if (currentJob?.cancelled) {
          jobManager.updateJob(job.jobId, { status: 'cancelled' });
          await fs.remove(videoPath);
          return;
        }

        // Extract keyframes with user options
        const extractionResult = await keyframeExtractor.extractKeyframes(videoPath, keyframesDir, options);
        console.log(`Extracted ${extractionResult.keyframes.length} keyframes from uploaded file`);

        // Check if cancelled
        const finalJob = jobManager.getJob(job.jobId);
        if (finalJob?.cancelled) {
          jobManager.updateJob(job.jobId, { status: 'cancelled' });
          await fs.remove(videoPath);
          return;
        }

        // Keep uploaded video file for frame navigation
        // Don't remove: await fs.remove(videoPath);

        // Return keyframes info with timestamp data if available
        const keyframes = extractionResult.keyframes.map((filename, index) => ({
          filename,
          url: `/keyframes/${sessionId}/${filename}`,
          timestamp: extractionResult.timestamps ? extractionResult.timestamps[index] : index * 2 // fallback estimate
        }));

        const result = {
          sessionId,
          originalFilename: req.file.originalname,
          keyframes,
          totalFrames: keyframes.length,
          duration: extractionResult.duration || null
        };

        // Update job as completed
        jobManager.updateJob(job.jobId, {
          status: 'completed',
          progress: 100,
          result
        });

      } catch (error) {
        console.error('Error processing uploaded file:', error);

        // Clean up uploaded file if it exists
        if (videoPath) {
          try {
            await fs.remove(videoPath);
          } catch (cleanupError) {
            console.error('Error cleaning up uploaded file:', cleanupError);
          }
        }

        jobManager.updateJob(job.jobId, {
          status: 'error',
          error: error.message
        });
      }
    })();

  } catch (error) {
    console.error('Error starting file processing:', error);

    // Clean up uploaded file if it exists
    if (req.file && req.file.path) {
      try {
        await fs.remove(req.file.path);
      } catch (cleanupError) {
        console.error('Error cleaning up uploaded file:', cleanupError);
      }
    }

    res.status(500).json({
      error: 'Failed to start video processing',
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
        message: 'Video file must be smaller than 100MB'
      });
    }
    return res.status(400).json({
      error: 'Upload error',
      message: error.message
    });
  }

  if (error.message === 'Only video files are allowed') {
    return res.status(400).json({
      error: 'Invalid file type',
      message: 'Only video files are allowed'
    });
  }

  next(error);
});

module.exports = router;
