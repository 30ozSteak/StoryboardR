const fs = require('fs-extra');
const path = require('path');

/**
 * Session cleanup utility for managing temporary files
 */
class SessionCleanup {
  constructor() {
    this.cleanupInterval = null;
    this.sessionExpiry = 2 * 60 * 60 * 1000; // 2 hours in milliseconds
    this.cleanupFrequency = 30 * 60 * 1000; // 30 minutes in milliseconds
  }

  /**
   * Start automatic cleanup of expired sessions
   */
  startAutomaticCleanup() {
    if (this.cleanupInterval) {
      return; // Already running
    }

    console.log('Starting automatic session cleanup...');
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredSessions().catch(error => {
        console.error('Error during automatic cleanup:', error);
      });
    }, this.cleanupFrequency);

    // Run initial cleanup
    this.cleanupExpiredSessions().catch(error => {
      console.error('Error during initial cleanup:', error);
    });
  }

  /**
   * Stop automatic cleanup
   */
  stopAutomaticCleanup() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
      console.log('Automatic session cleanup stopped.');
    }
  }

  /**
   * Clean up expired sessions
   */
  async cleanupExpiredSessions() {
    const tempDir = path.join(__dirname, '..', 'temp');
    const uploadsDir = path.join(tempDir, 'uploads');
    const keyframesDir = path.join(tempDir, 'keyframes');

    try {
      // Clean up expired video files
      await this.cleanupDirectory(uploadsDir, 'video files');

      // Clean up expired keyframe directories
      await this.cleanupDirectory(keyframesDir, 'keyframe directories');

      console.log('Session cleanup completed successfully');
    } catch (error) {
      console.error('Error during session cleanup:', error);
    }
  }

  /**
   * Clean up files/directories older than the expiry time
   */
  async cleanupDirectory(dirPath, description) {
    if (!await fs.pathExists(dirPath)) {
      return;
    }

    const items = await fs.readdir(dirPath);
    const now = Date.now();
    let cleanedCount = 0;

    for (const item of items) {
      const itemPath = path.join(dirPath, item);

      try {
        const stats = await fs.stat(itemPath);
        const age = now - stats.mtime.getTime();

        if (age > this.sessionExpiry) {
          await fs.remove(itemPath);
          cleanedCount++;
          console.log(`Cleaned up expired ${description.slice(0, -1)}: ${item}`);
        }
      } catch (error) {
        console.error(`Error cleaning up ${item}:`, error.message);
      }
    }

    if (cleanedCount > 0) {
      console.log(`Cleaned up ${cleanedCount} expired ${description}`);
    }
  }

  /**
   * Clean up a specific session immediately
   */
  async cleanupSession(sessionId) {
    const tempDir = path.join(__dirname, '..', 'temp');
    const uploadsDir = path.join(tempDir, 'uploads');
    const keyframesDir = path.join(tempDir, 'keyframes', sessionId);

    try {
      // Clean up video file
      const videoFiles = await fs.readdir(uploadsDir).catch(() => []);
      for (const file of videoFiles) {
        if (file.startsWith(sessionId)) {
          const videoPath = path.join(uploadsDir, file);
          await fs.remove(videoPath);
          console.log(`Cleaned up video file: ${file}`);
        }
      }

      // Clean up keyframes directory
      if (await fs.pathExists(keyframesDir)) {
        await fs.remove(keyframesDir);
        console.log(`Cleaned up keyframes directory: ${sessionId}`);
      }

      return true;
    } catch (error) {
      console.error(`Error cleaning up session ${sessionId}:`, error);
      return false;
    }
  }

  /**
   * Get session statistics
   */
  async getSessionStats() {
    const tempDir = path.join(__dirname, '..', 'temp');
    const uploadsDir = path.join(tempDir, 'uploads');
    const keyframesDir = path.join(tempDir, 'keyframes');

    const stats = {
      videoFiles: 0,
      keyframeSessions: 0,
      totalSize: 0
    };

    try {
      // Count video files
      if (await fs.pathExists(uploadsDir)) {
        const videoFiles = await fs.readdir(uploadsDir);
        stats.videoFiles = videoFiles.length;

        for (const file of videoFiles) {
          const filePath = path.join(uploadsDir, file);
          const stat = await fs.stat(filePath);
          stats.totalSize += stat.size;
        }
      }

      // Count keyframe sessions
      if (await fs.pathExists(keyframesDir)) {
        const sessions = await fs.readdir(keyframesDir);
        stats.keyframeSessions = sessions.length;

        for (const session of sessions) {
          const sessionPath = path.join(keyframesDir, session);
          const sessionStat = await fs.stat(sessionPath);
          if (sessionStat.isDirectory()) {
            const files = await fs.readdir(sessionPath);
            for (const file of files) {
              const filePath = path.join(sessionPath, file);
              const fileStat = await fs.stat(filePath);
              stats.totalSize += fileStat.size;
            }
          }
        }
      }
    } catch (error) {
      console.error('Error getting session stats:', error);
    }

    return stats;
  }
}

module.exports = SessionCleanup;
