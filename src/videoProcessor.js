const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs-extra');
const { v4: uuidv4 } = require('uuid');
const videoDownloader = require('./videoDownloader');
const keyframeExtractor = require('./keyframeExtractor');
const SessionCleanup = require('./sessionCleanup');
const jobManager = require('./jobManager');

// Process video from URL (updated to support progress tracking)
router.post('/process', async (req, res) => {
  try {
    const { videoUrl, options = {} } = req.body;

    if (!videoUrl) {
      return res.status(400).json({ error: 'Video URL is required' });
    }

    console.log(`Processing video from URL: ${videoUrl}`);
    console.log(`Options:`, options);

    // Generate unique session ID
    const sessionId = uuidv4();
    const tempDir = path.join(__dirname, '..', 'temp');
    const videoPath = path.join(tempDir, 'uploads', `${sessionId}.mp4`);
    const keyframesDir = path.join(tempDir, 'keyframes', sessionId);

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
        // Update progress
        jobManager.updateJob(job.jobId, { status: 'downloading', progress: 10 });

        // Ensure directories exist
        await fs.ensureDir(path.dirname(videoPath));
        await fs.ensureDir(keyframesDir);

        // Download video
        await videoDownloader.downloadVideo(videoUrl, videoPath);
        console.log(`Video downloaded: ${videoPath}`);

        // Check if cancelled
        const currentJob = jobManager.getJob(job.jobId);
        if (currentJob?.cancelled) {
          jobManager.updateJob(job.jobId, { status: 'cancelled' });
          return;
        }

        // Update progress
        jobManager.updateJob(job.jobId, { status: 'extracting', progress: 50 });

        // Extract keyframes with user options
        const extractionResult = await keyframeExtractor.extractKeyframes(videoPath, keyframesDir, options);
        console.log(`Extracted ${extractionResult.keyframes.length} keyframes`);

        // Check if cancelled
        const finalJob = jobManager.getJob(job.jobId);
        if (finalJob?.cancelled) {
          jobManager.updateJob(job.jobId, { status: 'cancelled' });
          return;
        }

        // Return keyframes info with timestamp data if available
        const keyframes = extractionResult.keyframes.map((filename, index) => ({
          id: uuidv4(), // Generate unique ID for each keyframe
          filename,
          url: `/keyframes/${sessionId}/${filename}`,
          timestamp: extractionResult.timestamps ? extractionResult.timestamps[index] : index * 2, // fallback estimate
          index: index // Keep index for backwards compatibility
        }));

        const result = {
          sessionId,
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
        console.error('Error processing video:', error);
        jobManager.updateJob(job.jobId, {
          status: 'error',
          error: error.message
        });
      }
    })();

  } catch (error) {
    console.error('Error starting video processing:', error);
    res.status(500).json({
      error: 'Failed to start video processing',
      message: error.message
    });
  }
});

// Get processing progress
router.get('/progress/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const job = jobManager.getJob(id);

    if (!job) {
      // Return 204 for non-existent jobs instead of 404 to prevent frontend errors
      return res.status(204).json({
        status: 'not_found',
        message: 'Job not found or expired'
      });
    }

    res.status(200).json({
      jobId: id,
      status: job.status,
      progress: job.progress,
      sessionId: job.sessionId,
      ...(job.error && { error: job.error }),
      ...(job.result && { result: job.result })
    });

  } catch (error) {
    console.error('Error getting progress:', error);
    res.status(500).json({
      error: 'Failed to get progress',
      message: error.message
    });
  }
});

// Cancel processing job
router.post('/cancel/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const success = jobManager.cancelJob(id);

    if (!success) {
      // Return 204 for non-existent jobs instead of 404
      return res.status(204).json({
        status: 'not_found',
        message: 'Job not found or already completed'
      });
    }

    console.log(`Job ${id} cancelled`);

    res.status(200).json({
      jobId: id,
      status: 'cancelled',
      message: 'Job cancelled successfully'
    });

  } catch (error) {
    console.error('Error cancelling job:', error);
    res.status(500).json({
      error: 'Failed to cancel job',
      message: error.message
    });
  }
});

// Process video from URL
router.post('/process-url', async (req, res) => {
  try {
    const { videoUrl, options = {} } = req.body;

    if (!videoUrl) {
      return res.status(400).json({ error: 'Video URL is required' });
    }

    console.log(`Processing video from URL: ${videoUrl}`);
    console.log(`Options:`, options);

    // Generate unique session ID
    const sessionId = uuidv4();
    const tempDir = path.join(__dirname, '..', 'temp');
    const videoPath = path.join(tempDir, 'uploads', `${sessionId}.mp4`);
    const keyframesDir = path.join(tempDir, 'keyframes', sessionId);

    // Ensure directories exist
    await fs.ensureDir(path.dirname(videoPath));
    await fs.ensureDir(keyframesDir);

    // Download video
    await videoDownloader.downloadVideo(videoUrl, videoPath);
    console.log(`Video downloaded: ${videoPath}`);

    // Extract keyframes with user options
    const extractionResult = await keyframeExtractor.extractKeyframes(videoPath, keyframesDir, options);
    console.log(`Extracted ${extractionResult.keyframes.length} keyframes`);

    // Don't immediately clean up video file - keep it for frame navigation
    // It will be cleaned up by a separate cleanup job or when session expires

    // Return keyframes info with timestamp data if available
    const keyframes = extractionResult.keyframes.map((filename, index) => ({
      id: uuidv4(), // Generate unique ID for each keyframe
      filename,
      url: `/keyframes/${sessionId}/${filename}`,
      timestamp: extractionResult.timestamps ? extractionResult.timestamps[index] : index * 2, // fallback estimate
      index: index // Keep index for backwards compatibility
    }));

    res.json({
      sessionId,
      keyframes,
      totalFrames: keyframes.length,
      duration: extractionResult.duration || null
    });

  } catch (error) {
    console.error('Error processing video:', error);
    res.status(500).json({
      error: 'Failed to process video',
      message: error.message
    });
  }
});

// Get keyframes as base64 strings
router.get('/keyframes/:sessionId/base64', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const keyframesDir = path.join(__dirname, '..', 'temp', 'keyframes', sessionId);

    if (!await fs.pathExists(keyframesDir)) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const files = await fs.readdir(keyframesDir);
    const imageFiles = files.filter(file => file.toLowerCase().endsWith('.jpg'));

    const base64Images = await Promise.all(
      imageFiles.map(async (filename) => {
        const filePath = path.join(keyframesDir, filename);
        const imageBuffer = await fs.readFile(filePath);
        const base64 = imageBuffer.toString('base64');
        return {
          filename,
          data: `data:image/jpeg;base64,${base64}`
        };
      })
    );

    res.json({
      sessionId,
      keyframes: base64Images,
      totalFrames: base64Images.length
    });

  } catch (error) {
    console.error('Error getting base64 keyframes:', error);
    res.status(500).json({
      error: 'Failed to get keyframes',
      message: error.message
    });
  }
});

// Clean up session
router.delete('/session/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const keyframesDir = path.join(__dirname, '..', 'temp', 'keyframes', sessionId);

    if (await fs.pathExists(keyframesDir)) {
      await fs.remove(keyframesDir);
      res.json({ message: 'Session cleaned up successfully' });
    } else {
      res.status(404).json({ error: 'Session not found' });
    }

  } catch (error) {
    console.error('Error cleaning up session:', error);
    res.status(500).json({
      error: 'Failed to clean up session',
      message: error.message
    });
  }
});

// Delete individual keyframe
router.delete('/keyframes/:sessionId/:filename', async (req, res) => {
  try {
    const { sessionId, filename } = req.params;
    const keyframesDir = path.join(__dirname, '..', 'temp', 'keyframes', sessionId);
    const filePath = path.join(keyframesDir, filename);

    if (!await fs.pathExists(keyframesDir)) {
      return res.status(404).json({ error: 'Session not found' });
    }

    if (!await fs.pathExists(filePath)) {
      return res.status(404).json({ error: 'Keyframe not found' });
    }

    // Validate filename to prevent directory traversal
    if (!filename.match(/^(keyframe_\d+|saved_frame_\d+|nav_(next|prev)_\d+|clone_\d+(\.\d+)?|custom_keyframe_\d+)\.(jpg|jpeg|png)$/i)) {
      return res.status(400).json({ error: 'Invalid filename' });
    }

    // Delete the file
    await fs.remove(filePath);
    console.log(`Deleted keyframe: ${filePath}`);

    res.json({
      message: 'Keyframe deleted successfully',
      filename
    });

  } catch (error) {
    console.error('Error deleting keyframe:', error);
    res.status(500).json({
      error: 'Failed to delete keyframe',
      message: error.message
    });
  }
});

// Extract adjacent frames around a specific timestamp
router.post('/extract-adjacent/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { baseFilename, direction, timestamp } = req.body;

    if (!baseFilename || !direction || timestamp === undefined) {
      return res.status(400).json({ error: 'Missing required parameters: baseFilename, direction, timestamp' });
    }

    if (!['prev', 'next'].includes(direction)) {
      return res.status(400).json({ error: 'Direction must be "prev" or "next"' });
    }

    const keyframesDir = path.join(__dirname, '..', 'temp', 'keyframes', sessionId);

    if (!await fs.pathExists(keyframesDir)) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Calculate new timestamp (adjust by 1 second in the specified direction)
    const step = direction === 'next' ? 1.0 : -1.0;
    let newTimestamp = Math.max(0, timestamp + step);

    // Get video info for boundary checking
    try {
      if (videoPath && await fs.pathExists(videoPath)) {
        const videoInfo = await keyframeExtractor.getVideoInfo(videoPath);
        if (direction === 'next' && newTimestamp >= videoInfo.duration) {
          return res.json({
            sessionId,
            error: 'End of video reached',
            boundary: true,
            direction: direction,
            videoDuration: videoInfo.duration
          });
        }
        if (direction === 'prev' && newTimestamp <= 0) {
          return res.json({
            sessionId,
            error: 'Beginning of video reached',
            boundary: true,
            direction: direction,
            videoDuration: videoInfo.duration
          });
        }
      }
    } catch (infoError) {
      console.log('Could not get video info for boundary checking:', infoError.message);
    }

    // Generate new filename using a special prefix to distinguish navigation frames
    const baseNumber = parseInt(baseFilename.match(/keyframe_(\d+)/)?.[1] || '1');
    const navPrefix = direction === 'next' ? 'nav_next' : 'nav_prev';
    const newFilename = `${navPrefix}_${Date.now()}.jpg`;
    const outputPath = path.join(keyframesDir, newFilename);

    // For now, we'll create a simple placeholder response since we don't have the original video
    // In a production system, you'd store the video path or re-download it for frame extraction

    // Check if we have the original video file
    const uploadsDir = path.join(__dirname, '..', 'temp', 'uploads');
    const expectedVideoPath = path.join(uploadsDir, `${sessionId}.mp4`);

    let videoPath = null;
    if (await fs.pathExists(expectedVideoPath)) {
      videoPath = expectedVideoPath;
    } else {
      // Fallback: look for any video file with the session ID prefix
      try {
        const uploadFiles = await fs.readdir(uploadsDir);
        const videoFile = uploadFiles.find(file =>
          file.startsWith(sessionId) && (file.endsWith('.mp4') || file.endsWith('.webm') || file.endsWith('.avi'))
        );
        if (videoFile) {
          videoPath = path.join(uploadsDir, videoFile);
        }
      } catch (readError) {
        console.log('Could not read uploads directory:', readError.message);
      }
    }

    if (videoPath && await fs.pathExists(videoPath)) {
      try {
        // Extract frame at the new timestamp
        const extractedFilename = await keyframeExtractor.extractFrameAtTimestamp(
          videoPath,
          outputPath,
          newTimestamp
        );

        res.json({
          sessionId,
          newFrame: {
            filename: newFilename,
            url: `/keyframes/${sessionId}/${newFilename}`,
            timestamp: newTimestamp,
            direction: direction
          },
          originalTimestamp: timestamp,
          success: true
        });

      } catch (extractError) {
        console.error('Frame extraction failed:', extractError);
        // Fall back to placeholder response
        res.json({
          sessionId,
          newFrame: {
            filename: baseFilename, // Use original filename
            url: `/keyframes/${sessionId}/${baseFilename}`, // Use original frame as fallback
            timestamp: newTimestamp,
            direction: direction
          },
          originalTimestamp: timestamp,
          success: false,
          message: 'Used existing frame as video source extraction failed'
        });
      }
    } else {
      // No video available, return placeholder response
      res.json({
        sessionId,
        newFrame: {
          filename: baseFilename, // Use original filename
          url: `/keyframes/${sessionId}/${baseFilename}`, // Use original frame as fallback
          timestamp: newTimestamp,
          direction: direction
        },
        originalTimestamp: timestamp,
        success: false,
        message: 'Video source not available for frame extraction'
      });
    }

  } catch (error) {
    console.error('Error extracting adjacent frame:', error);
    res.status(500).json({
      error: 'Failed to extract adjacent frame',
      message: error.message
    });
  }
});

// Save navigation frame to gallery as permanent keyframe
router.post('/save-nav-frame/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { navFilename, timestamp } = req.body;

    if (!navFilename || timestamp === undefined) {
      return res.status(400).json({ error: 'Missing required parameters: navFilename, timestamp' });
    }

    const keyframesDir = path.join(__dirname, '..', 'temp', 'keyframes', sessionId);

    if (!await fs.pathExists(keyframesDir)) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const navFramePath = path.join(keyframesDir, navFilename);
    if (!await fs.pathExists(navFramePath)) {
      return res.status(404).json({ error: 'Navigation frame not found' });
    }

    // Generate a permanent filename for the saved frame
    const permanentFilename = `saved_frame_${Date.now()}.jpg`;
    const permanentPath = path.join(keyframesDir, permanentFilename);

    // Copy the navigation frame to a permanent file
    await fs.copy(navFramePath, permanentPath);

    console.log(`Saved navigation frame: ${navFilename} -> ${permanentFilename}`);

    res.json({
      sessionId,
      savedFrame: {
        filename: permanentFilename,
        url: `/keyframes/${sessionId}/${permanentFilename}`,
        timestamp: timestamp,
        originalNavFrame: navFilename
      },
      success: true,
      message: 'Navigation frame saved successfully'
    });

  } catch (error) {
    console.error('Error saving navigation frame:', error);
    res.status(500).json({
      error: 'Failed to save navigation frame',
      message: error.message
    });
  }
});

// Force cleanup of specific session
router.delete('/cleanup/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const sessionCleanup = new SessionCleanup();

    const success = await sessionCleanup.cleanupSession(sessionId);

    if (success) {
      res.json({ message: 'Session cleaned up successfully' });
    } else {
      res.status(500).json({ error: 'Failed to clean up session' });
    }

  } catch (error) {
    console.error('Error in forced cleanup:', error);
    res.status(500).json({
      error: 'Failed to clean up session',
      message: error.message
    });
  }
});

// Get session statistics
router.get('/stats', async (req, res) => {
  try {
    const sessionCleanup = new SessionCleanup();
    const stats = await sessionCleanup.getSessionStats();

    res.json({
      ...stats,
      totalSizeMB: (stats.totalSize / (1024 * 1024)).toFixed(2)
    });

  } catch (error) {
    console.error('Error getting session stats:', error);
    res.status(500).json({
      error: 'Failed to get session statistics',
      message: error.message
    });
  }
});

// Add custom keyframe at specific timestamp
router.post('/add-keyframe/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { timestamp, insertAfterIndex } = req.body;

    if (timestamp === undefined || insertAfterIndex === undefined) {
      return res.status(400).json({ error: 'Missing required parameters: timestamp, insertAfterIndex' });
    }

    const keyframesDir = path.join(__dirname, '..', 'temp', 'keyframes', sessionId);

    if (!await fs.pathExists(keyframesDir)) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Check if we have the original video file
    const uploadsDir = path.join(__dirname, '..', 'temp', 'uploads');
    const expectedVideoPath = path.join(uploadsDir, `${sessionId}.mp4`);

    let videoPath = null;
    if (await fs.pathExists(expectedVideoPath)) {
      videoPath = expectedVideoPath;
    } else {
      // Fallback: look for any video file with the session ID prefix
      try {
        const uploadFiles = await fs.readdir(uploadsDir);
        const videoFile = uploadFiles.find(file =>
          file.startsWith(sessionId) && (file.endsWith('.mp4') || file.endsWith('.webm') || file.endsWith('.avi'))
        );
        if (videoFile) {
          videoPath = path.join(uploadsDir, videoFile);
        }
      } catch (readError) {
        console.log('Could not read uploads directory:', readError.message);
      }
    }

    if (!videoPath || !await fs.pathExists(videoPath)) {
      return res.status(404).json({ error: 'Video source not available for keyframe extraction' });
    }

    // Generate new filename for the custom keyframe
    const customFrameNumber = Date.now(); // Use timestamp to ensure uniqueness
    const newFilename = `custom_keyframe_${customFrameNumber}.jpg`;
    const outputPath = path.join(keyframesDir, newFilename);

    try {
      // Extract frame at the specified timestamp
      const extractedFilename = await keyframeExtractor.extractFrameAtTimestamp(
        videoPath,
        outputPath,
        timestamp
      );

      res.json({
        sessionId,
        newKeyframe: {
          filename: newFilename,
          url: `/keyframes/${sessionId}/${newFilename}`,
          timestamp: timestamp,
          insertAfterIndex: insertAfterIndex
        },
        success: true
      });

    } catch (extractError) {
      console.error('Custom keyframe extraction failed:', extractError);
      res.status(500).json({
        error: 'Failed to extract custom keyframe',
        message: extractError.message
      });
    }

  } catch (error) {
    console.error('Error adding custom keyframe:', error);
    res.status(500).json({
      error: 'Failed to add custom keyframe',
      message: error.message
    });
  }
});

// Get job statistics for debugging
router.get('/jobs/stats', async (req, res) => {
  try {
    const stats = jobManager.getJobStats();
    const allJobs = jobManager.getAllJobs().map(job => ({
      jobId: job.jobId,
      sessionId: job.sessionId,
      status: job.status,
      progress: job.progress,
      createdAt: job.createdAt,
      ...(job.error && { error: job.error })
    }));

    res.json({
      stats,
      jobs: allJobs,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error getting job stats:', error);
    res.status(500).json({
      error: 'Failed to get job statistics',
      message: error.message
    });
  }
});

// Extract single frame at timestamp (for scrubbing)
router.post('/scrub', async (req, res) => {
  try {
    const { sessionId, timestamp, frameFilename } = req.body;

    if (!sessionId || timestamp === undefined || !frameFilename) {
      return res.status(400).json({
        error: 'sessionId, timestamp, and frameFilename are required'
      });
    }

    console.log(`Scrubbing frame for session ${sessionId} at timestamp ${timestamp}s`);

    const tempDir = path.join(__dirname, '..', 'temp');
    const videoPath = path.join(tempDir, 'uploads', `${sessionId}.mp4`);
    const keyframesDir = path.join(tempDir, 'keyframes', sessionId);

    // Check if video file exists
    if (!await fs.pathExists(videoPath)) {
      return res.status(404).json({
        error: 'Original video file not found for this session'
      });
    }

    // Ensure keyframes directory exists
    await fs.ensureDir(keyframesDir);

    // Generate a temporary filename for the scrubbed frame
    const scrubFilename = `scrub_${Date.now()}_${frameFilename}`;
    const outputPath = path.join(keyframesDir, scrubFilename);

    // Extract frame at the specified timestamp
    const extractedFilename = await keyframeExtractor.extractFrameAtTimestamp(
      videoPath,
      outputPath,
      timestamp,
      { quality: 2 }
    );

    // Return the new frame data
    res.json({
      success: true,
      originalFrame: frameFilename,
      newFrame: {
        filename: extractedFilename,
        url: `/keyframes/${sessionId}/${extractedFilename}`,
        timestamp: timestamp
      }
    });

  } catch (error) {
    console.error('Error during frame scrubbing:', error);
    res.status(500).json({
      error: 'Failed to extract frame at timestamp',
      details: error.message
    });
  }
});

// Save scrubbed frame as a permanent keyframe
router.post('/save-scrubbed-frame', async (req, res) => {
  try {
    const { sessionId, scrubFilename, originalFrameFilename, timestamp } = req.body;

    if (!sessionId || !scrubFilename || !originalFrameFilename) {
      return res.status(400).json({
        error: 'sessionId, scrubFilename, and originalFrameFilename are required'
      });
    }

    console.log(`Saving scrubbed frame ${scrubFilename} for session ${sessionId}`);

    const tempDir = path.join(__dirname, '..', 'temp');
    const keyframesDir = path.join(tempDir, 'keyframes', sessionId);
    const scrubPath = path.join(keyframesDir, scrubFilename);

    // Check if scrubbed frame exists
    if (!await fs.pathExists(scrubPath)) {
      return res.status(404).json({
        error: 'Scrubbed frame not found'
      });
    }

    // Generate a new permanent filename
    const timestamp_str = String(Math.floor(Date.now() / 1000)).padStart(10, '0');
    const frame_num = String(Date.now() % 10000).padStart(4, '0');
    const permanentFilename = `keyframe_${timestamp_str}_${frame_num}.jpg`;
    const permanentPath = path.join(keyframesDir, permanentFilename);

    // Copy the scrubbed frame to a permanent filename
    await fs.copy(scrubPath, permanentPath);

    // Clean up the temporary scrub file
    await fs.remove(scrubPath);

    res.json({
      success: true,
      newKeyframe: {
        id: uuidv4(), // Generate unique ID for the new keyframe
        filename: permanentFilename,
        url: `/keyframes/${sessionId}/${permanentFilename}`,
        timestamp: timestamp || 0,
        insertAfter: originalFrameFilename
      }
    });

  } catch (error) {
    console.error('Error saving scrubbed frame:', error);
    res.status(500).json({
      error: 'Failed to save scrubbed frame',
      details: error.message
    });
  }
});

// Clean up temporary scrubbed frame
router.delete('/scrub/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    const { sessionId } = req.body;

    if (!sessionId || !filename) {
      return res.status(400).json({
        error: 'sessionId and filename are required'
      });
    }

    console.log(`Cleaning up scrubbed frame ${filename} for session ${sessionId}`);

    const tempDir = path.join(__dirname, '..', 'temp');
    const keyframesDir = path.join(tempDir, 'keyframes', sessionId);
    const scrubPath = path.join(keyframesDir, filename);

    // Check if scrubbed frame exists and remove it
    if (await fs.pathExists(scrubPath)) {
      await fs.remove(scrubPath);
      console.log(`Cleaned up scrubbed frame: ${filename}`);
    }

    res.json({
      success: true,
      message: 'Scrubbed frame cleaned up'
    });

  } catch (error) {
    console.error('Error cleaning up scrubbed frame:', error);
    res.status(500).json({
      error: 'Failed to clean up scrubbed frame',
      details: error.message
    });
  }
});

module.exports = router;
