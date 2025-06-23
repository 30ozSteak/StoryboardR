const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs-extra');

/**
 * Extracts keyframes (I-frames) from a video file using FFmpeg
 * @param {string} videoPath - Path to the input video file
 * @param {string} outputDir - Directory to save extracted keyframes
 * @param {object} options - Extraction options
 * @returns {Promise<string[]>} Array of keyframe filenames
 */
async function extractKeyframes(videoPath, outputDir, options = {}) {
  const {
    format = 'jpg',
    quality = 2, // 1-31, lower is better quality
    maxFrames = 50, // Maximum number of keyframes to extract, null for unlimited
    minInterval = 1, // Minimum seconds between keyframes
    includeLastFrame = true // Whether to ensure the last frame is included
  } = options;

  try {
    console.log(`Extracting keyframes from: ${videoPath}`);
    console.log(`Output directory: ${outputDir}`);
    console.log(`Max frames: ${maxFrames || 'unlimited'}, Include last frame: ${includeLastFrame}`);

    // Ensure output directory exists
    await fs.ensureDir(outputDir);

    // Get video duration first
    const videoInfo = await getVideoInfo(videoPath);
    console.log(`Video duration: ${videoInfo.duration} seconds`);

    // If unlimited frames or we don't need to include last frame, use simple extraction
    if (!maxFrames || !includeLastFrame) {
      const keyframes = await extractKeyframesSimple(videoPath, outputDir, { format, quality, maxFrames, minInterval });
      return {
        keyframes,
        timestamps: generateEstimatedTimestamps(keyframes.length, videoInfo.duration),
        duration: videoInfo.duration
      };
    }

    // For limited frames with last frame inclusion, use advanced extraction
    const result = await extractKeyframesWithLastFrame(videoPath, outputDir, { format, quality, maxFrames, minInterval, videoInfo });
    return {
      keyframes: result.keyframes,
      timestamps: result.timestamps,
      duration: videoInfo.duration
    };

  } catch (error) {
    console.error('Error in keyframe extraction:', error);
    throw new Error(`Failed to extract keyframes: ${error.message}`);
  }
}

/**
 * Simple keyframe extraction without special last frame handling
 */
async function extractKeyframesSimple(videoPath, outputDir, options) {
  const { format, quality, maxFrames, minInterval } = options;
  const outputPattern = path.join(outputDir, `keyframe_%04d.${format}`);

  return new Promise((resolve, reject) => {
    let extractedFrames = [];

    const outputOptions = [
      // Extract only I-frames (keyframes)
      '-vf', 'select=eq(pict_type\\,I)',
      // Set quality (for JPEG)
      '-q:v', quality.toString(),
      // Limit frame rate to respect minInterval
      `-r`, `${1 / minInterval}`,
      // Disable audio
      '-an'
    ];

    // Add frame limit if specified
    if (maxFrames) {
      outputOptions.push('-frames:v', maxFrames.toString());
    }

    const command = ffmpeg(videoPath)
      .outputOptions(outputOptions)
      .output(outputPattern)
      .on('start', (commandLine) => {
        console.log('FFmpeg command:', commandLine);
      })
      .on('progress', (progress) => {
        if (progress.percent) {
          process.stdout.write(`\rExtracting keyframes: ${progress.percent.toFixed(1)}%`);
        }
      })
      .on('stderr', (stderrLine) => {
        // Log only important stderr messages
        if (stderrLine.includes('frame=')) {
          const frameMatch = stderrLine.match(/frame=\s*(\d+)/);
          if (frameMatch) {
            const frameCount = parseInt(frameMatch[1]);
            process.stdout.write(`\rExtracted frames: ${frameCount}`);
          }
        }
      })
      .on('end', async () => {
        console.log('\nKeyframe extraction completed');

        try {
          // Get list of extracted files
          const files = await fs.readdir(outputDir);
          extractedFrames = files
            .filter(file => file.startsWith('keyframe_') && file.endsWith(`.${format}`))
            .sort();

          console.log(`Successfully extracted ${extractedFrames.length} keyframes`);
          resolve(extractedFrames);
        } catch (error) {
          reject(new Error(`Error reading extracted keyframes: ${error.message}`));
        }
      })
      .on('error', (error) => {
        console.error('\nFFmpeg error:', error.message);
        reject(new Error(`Keyframe extraction failed: ${error.message}`));
      });

    // Start the extraction
    command.run();
  });
}

/**
 * Advanced keyframe extraction that ensures the last frame is included
 */
async function extractKeyframesWithLastFrame(videoPath, outputDir, options) {
  const { format, quality, maxFrames, minInterval, videoInfo } = options;

  // Calculate time points to extract frames
  const duration = videoInfo.duration;
  const timePoints = [];

  if (maxFrames === 1) {
    // If only one frame requested, extract the last frame
    timePoints.push(duration - 0.1);
  } else {
    // Calculate evenly distributed time points, ensuring we include the last frame
    const interval = duration / (maxFrames - 1);

    for (let i = 0; i < maxFrames - 1; i++) {
      timePoints.push(i * interval);
    }

    // Always add the last frame (slightly before the end to ensure we get a valid frame)
    timePoints.push(Math.max(duration - 0.1, 0));
  }

  console.log(`Extracting frames at specific time points: ${timePoints.length} frames`);

  return new Promise((resolve, reject) => {
    let extractedFrames = [];
    let currentFrameIndex = 0;

    const extractNextFrame = async () => {
      if (currentFrameIndex >= timePoints.length) {
        // All frames extracted, return results
        try {
          const files = await fs.readdir(outputDir);
          extractedFrames = files
            .filter(file => file.startsWith('keyframe_') && file.endsWith(`.${format}`))
            .sort();

          console.log(`\nSuccessfully extracted ${extractedFrames.length} keyframes with last frame`);
          resolve({
            keyframes: extractedFrames,
            timestamps: timePoints.slice(0, extractedFrames.length) // Match extracted frames
          });
        } catch (error) {
          reject(new Error(`Error reading extracted keyframes: ${error.message}`));
        }
        return;
      }

      const timePoint = timePoints[currentFrameIndex];
      const outputPath = path.join(outputDir, `keyframe_${String(currentFrameIndex + 1).padStart(4, '0')}.${format}`);

      ffmpeg(videoPath)
        .seekInput(timePoint)
        .outputOptions([
          '-vframes', '1',
          '-q:v', quality.toString(),
          '-an'
        ])
        .output(outputPath)
        .on('end', () => {
          currentFrameIndex++;
          process.stdout.write(`\rExtracting frame ${currentFrameIndex}/${timePoints.length}`);
          extractNextFrame();
        })
        .on('error', (error) => {
          console.error(`\nError extracting frame at ${timePoint}s:`, error.message);
          // Continue with next frame instead of failing completely
          currentFrameIndex++;
          extractNextFrame();
        })
        .run();
    };

    // Start extraction
    extractNextFrame();
  });
}

/**
 * Gets basic video information using FFmpeg
 * @param {string} videoPath - Path to the video file
 * @returns {Promise<object>} Video information
 */
function getVideoInfo(videoPath) {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(videoPath, (error, metadata) => {
      if (error) {
        reject(new Error(`Failed to get video info: ${error.message}`));
        return;
      }

      const videoStream = metadata.streams.find(stream => stream.codec_type === 'video');

      if (!videoStream) {
        reject(new Error('No video stream found in file'));
        return;
      }

      const info = {
        duration: parseFloat(metadata.format.duration) || 0,
        width: videoStream.width || 0,
        height: videoStream.height || 0,
        frameRate: eval(videoStream.r_frame_rate) || 0,
        codec: videoStream.codec_name || 'unknown',
        bitrate: parseInt(metadata.format.bit_rate) || 0,
        size: parseInt(metadata.format.size) || 0
      };

      resolve(info);
    });
  });
}

/**
 * Extracts keyframes at specific time intervals
 * @param {string} videoPath - Path to the input video file
 * @param {string} outputDir - Directory to save extracted keyframes
 * @param {number} interval - Interval in seconds between frames
 * @returns {Promise<string[]>} Array of keyframe filenames
 */
async function extractFramesAtInterval(videoPath, outputDir, interval = 5) {
  try {
    console.log(`Extracting frames every ${interval} seconds`);

    await fs.ensureDir(outputDir);

    const videoInfo = await getVideoInfo(videoPath);
    const totalFrames = Math.floor(videoInfo.duration / interval);

    console.log(`Will extract approximately ${totalFrames} frames`);

    const outputPattern = path.join(outputDir, 'frame_%04d.jpg');

    return new Promise((resolve, reject) => {
      ffmpeg(videoPath)
        .outputOptions([
          '-vf', `fps=1/${interval}`,
          '-q:v', '2',
          '-an'
        ])
        .output(outputPattern)
        .on('start', (commandLine) => {
          console.log('FFmpeg command:', commandLine);
        })
        .on('progress', (progress) => {
          if (progress.percent) {
            process.stdout.write(`\rExtracting frames: ${progress.percent.toFixed(1)}%`);
          }
        })
        .on('end', async () => {
          console.log('\nFrame extraction completed');

          try {
            const files = await fs.readdir(outputDir);
            const extractedFrames = files
              .filter(file => file.startsWith('frame_') && file.endsWith('.jpg'))
              .sort();

            console.log(`Successfully extracted ${extractedFrames.length} frames`);
            resolve(extractedFrames);
          } catch (error) {
            reject(new Error(`Error reading extracted frames: ${error.message}`));
          }
        })
        .on('error', (error) => {
          console.error('\nFFmpeg error:', error.message);
          reject(new Error(`Frame extraction failed: ${error.message}`));
        })
        .run();
    });

  } catch (error) {
    throw new Error(`Failed to extract frames at interval: ${error.message}`);
  }
}

/**
 * Checks if FFmpeg is available on the system
 * @returns {Promise<boolean>}
 */
function checkFFmpegAvailability() {
  return new Promise((resolve) => {
    ffmpeg.getAvailableFormats((error, formats) => {
      if (error) {
        console.error('FFmpeg not available:', error.message);
        resolve(false);
      } else {
        console.log('FFmpeg is available');
        resolve(true);
      }
    });
  });
}

/**
 * Generates estimated timestamps for extracted keyframes
 * @param {number} frameCount - Number of extracted frames
 * @param {number} duration - Video duration in seconds
 * @returns {number[]} Array of estimated timestamps
 */
function generateEstimatedTimestamps(frameCount, duration) {
  if (frameCount <= 1) return [0];

  const timestamps = [];
  const interval = duration / (frameCount - 1);

  for (let i = 0; i < frameCount; i++) {
    timestamps.push(i * interval);
  }

  return timestamps;
}

/**
 * Extracts a single frame at a specific timestamp
 * @param {string} videoPath - Path to the input video file
 * @param {string} outputPath - Full path for the output image
 * @param {number} timestamp - Timestamp in seconds
 * @param {object} options - Extraction options
 * @returns {Promise<string>} Filename of extracted frame
 */
async function extractFrameAtTimestamp(videoPath, outputPath, timestamp, options = {}) {
  const { quality = 2 } = options;

  return new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      .seekInput(timestamp)
      .outputOptions([
        '-vframes', '1',
        '-q:v', quality.toString(),
        '-an'
      ])
      .output(outputPath)
      .on('end', () => {
        const filename = path.basename(outputPath);
        console.log(`Extracted frame at ${timestamp}s: ${filename}`);
        resolve(filename);
      })
      .on('error', (error) => {
        console.error(`Error extracting frame at ${timestamp}s:`, error.message);
        reject(new Error(`Frame extraction failed: ${error.message}`));
      })
      .run();
  });
}

module.exports = {
  extractKeyframes,
  extractFramesAtInterval,
  getVideoInfo,
  checkFFmpegAvailability,
  extractFrameAtTimestamp,
  generateEstimatedTimestamps
};
