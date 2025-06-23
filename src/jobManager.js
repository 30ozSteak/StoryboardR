/**
 * Shared job tracking for video processing
 * Manages processing jobs across URL and file upload endpoints
 */

const { v4: uuidv4 } = require('uuid');

class JobManager {
  constructor() {
    this.jobs = new Map();
    this.cleanupInterval = null;
    this.startPeriodicCleanup();
  }

  createJob(sessionId) {
    const jobId = uuidv4();
    const job = {
      jobId,
      sessionId,
      status: 'started',
      progress: 0,
      cancelled: false,
      error: null,
      result: null,
      createdAt: new Date()
    };

    this.jobs.set(jobId, job);
    return job;
  }

  updateJob(jobId, updates) {
    const job = this.jobs.get(jobId);
    if (job) {
      const updatedJob = { ...job, ...updates };
      this.jobs.set(jobId, updatedJob);
      return updatedJob;
    }
    return null;
  }

  getJob(jobId) {
    return this.jobs.get(jobId) || null;
  }

  cancelJob(jobId) {
    const job = this.jobs.get(jobId);
    if (job) {
      job.cancelled = true;
      job.status = 'cancelled';
      this.jobs.set(jobId, job);
      return true;
    }
    return false;
  }

  deleteJob(jobId) {
    return this.jobs.delete(jobId);
  }

  getAllJobs() {
    return Array.from(this.jobs.values());
  }

  getJobStats() {
    const jobs = this.getAllJobs();
    const stats = {
      total: jobs.length,
      started: 0,
      downloading: 0,
      extracting: 0,
      completed: 0,
      error: 0,
      cancelled: 0
    };

    jobs.forEach(job => {
      if (stats.hasOwnProperty(job.status)) {
        stats[job.status]++;
      }
    });

    return stats;
  }

  startPeriodicCleanup() {
    // Clean up jobs older than 10 minutes every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanupOldJobs();
    }, 5 * 60 * 1000);
  }

  cleanupOldJobs() {
    const maxAge = 10 * 60 * 1000; // 10 minutes
    const now = new Date();

    for (const [jobId, job] of this.jobs) {
      const age = now - job.createdAt;

      // Clean up completed, error, or cancelled jobs older than max age
      if (age > maxAge && ['completed', 'error', 'cancelled'].includes(job.status)) {
        console.log(`Cleaning up old job: ${jobId} (status: ${job.status}, age: ${Math.round(age / 1000)}s)`);
        this.jobs.delete(jobId);
      }
    }
  }

  stopPeriodicCleanup() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  shutdown() {
    this.stopPeriodicCleanup();
    this.jobs.clear();
  }
}

// Create singleton instance
const jobManager = new JobManager();

module.exports = jobManager;
