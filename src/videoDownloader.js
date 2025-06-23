const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

/**
 * Check if URL is from a video platform that requires yt-dlp
 * @param {string} url - The URL to check
 * @returns {boolean}
 */
function requiresYtDlp(url) {
  const platformPatterns = [
    /youtube\.com/i,
    /youtu\.be/i,
    /vimeo\.com/i,
    /dailymotion\.com/i,
    /twitch\.tv/i,
    /tiktok\.com/i,
    /instagram\.com/i,
    /facebook\.com/i,
    /twitter\.com/i,
    /x\.com/i
  ];
  
  return platformPatterns.some(pattern => pattern.test(url));
}

/**
 * Downloads a video using yt-dlp for supported platforms
 * @param {string} videoUrl - The URL of the video to download
 * @param {string} outputPath - The local path where the video should be saved
 * @returns {Promise<void>}
 */
async function downloadWithYtDlp(videoUrl, outputPath) {
  try {
    console.log(`Downloading video from platform using yt-dlp: ${videoUrl}`);
    
    const outputDir = path.dirname(outputPath);
    const outputFilename = path.basename(outputPath, path.extname(outputPath));
    
    // Ensure directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Check if we have cookies available
    const cookiesPath = path.join(__dirname, '..', 'cookies.txt');
    
    const args = [
      '--format', 'best[height<=720][ext=mp4]/best[ext=mp4]/best',
      '--output', path.join(outputDir, outputFilename + '.%(ext)s'),
      '--no-playlist',
      '--max-filesize', '50M',
      '--merge-output-format', 'mp4',
      '--no-check-certificate',
      '--user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      '--extractor-retries', '3',
      '--fragment-retries', '3',
      '--no-part',  // Prevent .part files
      '--no-continue',  // Don't continue partial downloads
      '--prefer-free-formats',  // Prefer formats that don't require special handling
      videoUrl
    ];

    // Add cookies if available (only use manually uploaded cookies)
    if (fs.existsSync(cookiesPath)) {
      args.splice(-1, 0, '--cookies', cookiesPath);
      console.log('Using cookies file for authentication');
    }
    // Note: Removed automatic browser cookie extraction to avoid system password prompts
    
    console.log('yt-dlp command:', 'yt-dlp', args.join(' '));
    
    return new Promise((resolve, reject) => {
      const process = spawn('yt-dlp', args, {
        stdio: ['pipe', 'pipe', 'pipe']
      });
      
      let stdout = '';
      let stderr = '';
      
      process.stdout.on('data', (data) => {
        stdout += data.toString();
        console.log('yt-dlp stdout:', data.toString().trim());
      });
      
      process.stderr.on('data', (data) => {
        stderr += data.toString();
        console.log('yt-dlp stderr:', data.toString().trim());
      });
      
      process.on('close', (code) => {
        console.log(`yt-dlp process exited with code ${code}`);
        
        if (code === 0) {
          // Success - now find the downloaded file
          try {
            const files = fs.readdirSync(outputDir);
            console.log('Files after yt-dlp:', files);
            
            // Clean up any .part files first
            files.forEach(file => {
              if (file.endsWith('.part')) {
                const partPath = path.join(outputDir, file);
                try {
                  fs.unlinkSync(partPath);
                  console.log(`Cleaned up partial file: ${file}`);
                } catch (err) {
                  console.warn(`Could not clean up partial file ${file}:`, err.message);
                }
              }
            });
            
            // Refresh file list after cleanup
            const updatedFiles = fs.readdirSync(outputDir);
            console.log('Files after cleanup:', updatedFiles);
            
            // Look for our expected file or any mp4 file with our filename base
            const expectedFile = `${outputFilename}.mp4`;
            const downloadedFiles = updatedFiles.filter(file => 
              file.startsWith(outputFilename) && file.endsWith('.mp4') && !file.endsWith('.part')
            );
            
            if (downloadedFiles.length > 0) {
              const actualFile = downloadedFiles[0];
              const actualPath = path.join(outputDir, actualFile);
              
              // Rename to expected path if needed
              if (actualPath !== outputPath) {
                fs.renameSync(actualPath, outputPath);
                console.log(`Renamed ${actualFile} to ${path.basename(outputPath)}`);
              }
              
              // Verify file exists and has content
              const stats = fs.statSync(outputPath);
              if (stats.size === 0) {
                reject(new Error('Downloaded file is empty'));
                return;
              }
              
              console.log(`yt-dlp download completed: ${outputPath} (${stats.size} bytes)`);
              resolve();
            } else {
              reject(new Error(`Expected file ${expectedFile} not found. Available files: ${updatedFiles.join(', ')}`));
            }
          } catch (error) {
            reject(new Error(`Error processing downloaded file: ${error.message}`));
          }
        } else {
          // yt-dlp failed
          console.error('yt-dlp stdout:', stdout);
          console.error('yt-dlp stderr:', stderr);
          
          if (stderr.includes('max-filesize')) {
            reject(new Error('Video file is too large (over 50MB limit)'));
          } else if (stderr.includes('Video unavailable')) {
            reject(new Error('Video is unavailable or private'));
          } else if (stderr.includes('Sign in to confirm your age') || stderr.includes('inappropriate for some users')) {
            reject(new Error('This video requires age verification. To access age-restricted videos:\n\n1. Go to the Settings tab\n2. Upload your YouTube cookies\n3. Try again\n\nAlternatively, try a different video that doesn\'t require sign-in.'));
          } else if (stderr.includes('not found') || stderr.includes('404')) {
            reject(new Error('Video not found at the provided URL'));
          } else if (stderr.includes('Private video')) {
            reject(new Error('This video is private and cannot be accessed'));
          } else if (stderr.includes('Video is not available')) {
            reject(new Error('Video is not available in your region or has been removed'));
          } else if (stderr.includes('No cookies found') || stderr.includes('requires sign in')) {
            reject(new Error('This video requires authentication. To access age-restricted videos:\n\n1. Go to the Settings tab\n2. Upload your YouTube cookies\n3. Try again\n\nAlternatively, try a different video that doesn\'t require sign-in.'));
          } else {
            reject(new Error(`yt-dlp failed with code ${code}: ${stderr || stdout}`));
          }
        }
      });
      
      process.on('error', (error) => {
        console.error('yt-dlp process error:', error);
        reject(new Error(`Failed to start yt-dlp: ${error.message}`));
      });
    });
    
  } catch (error) {
    console.error('yt-dlp download error:', error);
    
    // Clean up any partial files
    const outputDir = path.dirname(outputPath);
    const outputFilename = path.basename(outputPath, path.extname(outputPath));
    
    try {
      const files = fs.readdirSync(outputDir);
      files.forEach(file => {
        if (file.startsWith(outputFilename)) {
          const filePath = path.join(outputDir, file);
          fs.unlinkSync(filePath);
          console.log(`Cleaned up partial file: ${filePath}`);
        }
      });
    } catch (cleanupError) {
      console.error('Error cleaning up files:', cleanupError);
    }
    
    throw error;
  }
}

/**
 * Downloads a video from a given URL and saves it locally
 * Supports both direct URLs and video platforms via yt-dlp
 * @param {string} videoUrl - The URL of the video to download
 * @param {string} outputPath - The local path where the video should be saved
 * @returns {Promise<void>}
 */
async function downloadVideo(videoUrl, outputPath) {
  // Check if this URL requires yt-dlp
  if (requiresYtDlp(videoUrl)) {
    return downloadWithYtDlp(videoUrl, outputPath);
  }
  
  // Use direct HTTP download for regular video URLs
  // Use direct HTTP download for regular video URLs
  try {
    console.log(`Starting direct download from: ${videoUrl}`);
    console.log(`Saving to: ${outputPath}`);
    
    // Ensure the directory exists
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    // Configure axios for streaming
    const response = await axios({
      method: 'GET',
      url: videoUrl,
      responseType: 'stream',
      timeout: 30000, // 30 seconds timeout
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; VideoKeyframesExtractor/1.0)'
      }
    });
    
    // Get content length for progress tracking
    const contentLength = parseInt(response.headers['content-length'] || '0');
    let downloadedBytes = 0;
    
    console.log(`Content-Length: ${contentLength} bytes`);
    
    // Create write stream
    const writeStream = fs.createWriteStream(outputPath);
    
    // Track download progress
    response.data.on('data', (chunk) => {
      downloadedBytes += chunk.length;
      if (contentLength > 0) {
        const progress = ((downloadedBytes / contentLength) * 100).toFixed(2);
        process.stdout.write(`\rDownload progress: ${progress}%`);
      }
    });
    
    // Handle errors
    response.data.on('error', (error) => {
      console.error('\nDownload stream error:', error);
      writeStream.destroy();
      throw error;
    });
    
    writeStream.on('error', (error) => {
      console.error('\nWrite stream error:', error);
      throw error;
    });
    
    // Pipe the response data to the file
    response.data.pipe(writeStream);
    
    // Wait for download to complete
    return new Promise((resolve, reject) => {
      writeStream.on('finish', () => {
        console.log(`\nDownload completed: ${outputPath}`);
        
        // Verify file exists and has content
        const stats = fs.statSync(outputPath);
        if (stats.size === 0) {
          reject(new Error('Downloaded file is empty'));
          return;
        }
        
        console.log(`File size: ${stats.size} bytes`);
        resolve();
      });
      
      writeStream.on('error', reject);
      response.data.on('error', reject);
    });
    
  } catch (error) {
    console.error('Error downloading video:', error.message);
    
    // Clean up partial file if it exists
    if (fs.existsSync(outputPath)) {
      try {
        fs.unlinkSync(outputPath);
        console.log('Cleaned up partial download file');
      } catch (cleanupError) {
        console.error('Error cleaning up partial file:', cleanupError);
      }
    }
    
    // Provide more specific error messages
    if (error.code === 'ECONNABORTED') {
      throw new Error('Download timeout - the video file may be too large or the connection is slow');
    } else if (error.response && error.response.status === 404) {
      throw new Error('Video not found at the provided URL');
    } else if (error.response && error.response.status === 403) {
      throw new Error('Access denied - the video URL may require authentication');
    } else if (error.code === 'ENOTFOUND') {
      throw new Error('Invalid URL or network connection issue');
    } else {
      throw new Error(`Download failed: ${error.message}`);
    }
  }
}

/**
 * Validates if a URL appears to be a video URL or from a supported platform
 * @param {string} url - The URL to validate
 * @returns {boolean}
 */
function isValidVideoUrl(url) {
  try {
    const parsedUrl = new URL(url);
    const pathname = parsedUrl.pathname.toLowerCase();
    
    // Check if it's from a supported video platform
    if (requiresYtDlp(url)) {
      return true;
    }
    
    // Check for common video file extensions for direct URLs
    const videoExtensions = ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm', '.mkv'];
    return videoExtensions.some(ext => pathname.endsWith(ext));
  } catch (error) {
    return false;
  }
}

/**
 * Gets video metadata without downloading the entire file
 * @param {string} videoUrl - The URL of the video
 * @returns {Promise<object>}
 */
async function getVideoMetadata(videoUrl) {
  try {
    const response = await axios.head(videoUrl, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; VideoKeyframesExtractor/1.0)'
      }
    });
    
    return {
      contentLength: parseInt(response.headers['content-length'] || '0'),
      contentType: response.headers['content-type'] || 'unknown',
      lastModified: response.headers['last-modified'] || null,
      acceptsRanges: response.headers['accept-ranges'] === 'bytes'
    };
  } catch (error) {
    throw new Error(`Failed to get video metadata: ${error.message}`);
  }
}

module.exports = {
  downloadVideo,
  isValidVideoUrl,
  getVideoMetadata,
  requiresYtDlp
};
