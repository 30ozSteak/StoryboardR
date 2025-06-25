/**
 * VideoProcessor - Handles video upload, URL processing, and extraction
 * Isolated from UI and other concerns
 */
export class VideoProcessor {
  constructor(eventBus) {
    this.eventBus = eventBus;
    this.currentSessionId = null;
    this.currentJobId = null;
    this.isProcessing = false;
    this.abortController = null;
    this.pollRetryCount = 0;
    this.maxRetries = 3;
    this.pollInterval = null;
    this.isResetting = false; // Guard against recursive resets
    this.activeTab = 'url'; // Track active tab
    this.fileDropClickHandler = null; // Store click handler reference

    this.initializeElements();
    this.bindEvents();
    this.setupTabTracking();
  }

  initializeElements() {
    // Forms and inputs
    this.urlForm = document.getElementById('urlForm');
    this.uploadForm = document.getElementById('uploadForm');
    this.videoUrlInput = document.getElementById('videoUrl');
    this.videoFileInput = document.getElementById('videoFile');
    this.fileDropArea = document.getElementById('fileDropArea');

    // Buttons
    this.urlSubmitBtn = document.getElementById('urlSubmitBtn');
    this.uploadSubmitBtn = document.getElementById('uploadSubmitBtn');
    this.cancelBtn = document.getElementById('cancelBtn');

    // Options
    this.urlMaxFrames = document.getElementById('urlMaxFrames');
    this.uploadMaxFrames = document.getElementById('uploadMaxFrames');
    this.urlIncludeLastFrame = document.getElementById('urlIncludeLastFrame');
    this.uploadIncludeLastFrame = document.getElementById('uploadIncludeLastFrame');
  }

  bindEvents() {
    // Form submissions
    this.urlForm?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.processVideoUrl();
    });

    this.uploadForm?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.processVideoFile();
    });

    // File drop area
    if (this.fileDropArea) {
      this.fileDropArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        this.fileDropArea.classList.add('drag-over');
      });

      this.fileDropArea.addEventListener('dragleave', () => {
        this.fileDropArea.classList.remove('drag-over');
      });

      this.fileDropArea.addEventListener('drop', (e) => {
        e.preventDefault();
        this.fileDropArea.classList.remove('drag-over');
        const files = e.dataTransfer.files;
        if (files.length > 0) {
          this.videoFileInput.files = files;
          this.processVideoFile();
        }
      });

      this.fileDropArea.addEventListener('click', () => {
        // Only handle click if upload tab is active
        if (this.activeTab === 'upload') {
          this.videoFileInput?.click();
        }
      });
    }

    // File input change
    this.videoFileInput?.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        this.uploadSubmitBtn.disabled = false;
        this.eventBus.emit('ui:fileSelected', { file });
      } else {
        this.uploadSubmitBtn.disabled = true;
      }
    });

    // Cancel processing
    this.cancelBtn?.addEventListener('click', () => this.cancelProcessing());
  }

  setupTabTracking() {
    // Listen for tab changes
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(button => {
      button.addEventListener('click', () => {
        this.activeTab = button.dataset.tab;
      });
    });

    // Set initial active tab
    const activeButton = document.querySelector('.tab-btn.active');
    if (activeButton) {
      this.activeTab = activeButton.dataset.tab;
    }
  }

  async processVideoUrl() {
    const url = this.videoUrlInput.value.trim();
    if (!url) return;

    const options = {
      maxFrames: parseInt(this.urlMaxFrames?.value || '50'),
      includeLastFrame: this.urlIncludeLastFrame?.checked || false
    };

    try {
      this.isProcessing = true;
      this.pollRetryCount = 0;
      this.abortController = new AbortController();

      this.eventBus.emit('processing:started', { type: 'url', source: url });

      const response = await fetch('/api/video/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          videoUrl: url,
          options: options
        }),
        signal: this.abortController.signal
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: Failed to start video processing`);
      }

      const data = await response.json();
      this.currentJobId = data.jobId;
      this.currentSessionId = data.sessionId;

      this.eventBus.emit('processing:sessionCreated', {
        sessionId: this.currentSessionId,
        jobId: this.currentJobId
      });

      this.startProgressPolling();

    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Error processing video URL:', error);
        this.eventBus.emit('processing:error', { error: error.message });
      }
      this.isProcessing = false;
    }
  }

  async processVideoFile() {
    const file = this.videoFileInput.files[0];
    if (!file) return;

    const options = {
      maxFrames: parseInt(this.uploadMaxFrames?.value || '50'),
      includeLastFrame: this.uploadIncludeLastFrame?.checked || false
    };

    try {
      this.isProcessing = true;
      this.pollRetryCount = 0;
      this.abortController = new AbortController();

      this.eventBus.emit('processing:started', { type: 'file', source: file.name });

      const formData = new FormData();
      formData.append('video', file);
      formData.append('maxFrames', options.maxFrames);
      formData.append('includeLastFrame', options.includeLastFrame);

      const response = await fetch('/api/upload/file', {
        method: 'POST',
        body: formData,
        signal: this.abortController.signal
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: Failed to start video processing`);
      }

      const data = await response.json();
      this.currentJobId = data.jobId;
      this.currentSessionId = data.sessionId;

      this.eventBus.emit('processing:sessionCreated', {
        sessionId: this.currentSessionId,
        jobId: this.currentJobId
      });

      this.startProgressPolling();

    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Error processing video file:', error);
        this.eventBus.emit('processing:error', { error: error.message });
      }
      this.isProcessing = false;
    }
  }

  startProgressPolling() {
    if (!this.currentJobId || !this.isProcessing) return;

    // Clear any existing interval
    if (this.pollInterval) {
      clearTimeout(this.pollInterval);
    }

    this.pollProgress();
  }

  async pollProgress() {
    if (!this.currentJobId || !this.isProcessing) return;

    try {
      const response = await fetch(`/api/video/progress/${this.currentJobId}`, {
        signal: this.abortController?.signal
      });

      // Handle different response codes gracefully
      if (response.status === 204) {
        // Job not found or expired - handle gracefully
        console.log('Job not found or expired, stopping polling');
        this.handleJobNotFound();
        return;
      }

      if (response.status === 404) {
        // Legacy 404 handling - treat same as 204
        console.log('Job endpoint returned 404, stopping polling');
        this.handleJobNotFound();
        return;
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to get progress`);
      }

      const data = await response.json();

      // Reset retry count on successful response
      this.pollRetryCount = 0;

      this.eventBus.emit('processing:progress', {
        ...data,
        progress: data.progress || 0
      });

      if (data.status === 'completed' && data.result) {
        this.isProcessing = false;
        this.eventBus.emit('processing:completed', data.result);
      } else if (data.status === 'error') {
        this.isProcessing = false;
        this.eventBus.emit('processing:error', { error: data.error || 'Unknown processing error' });
      } else if (data.status === 'cancelled') {
        this.isProcessing = false;
        this.eventBus.emit('processing:cancelled');
      } else {
        // Continue polling for in-progress jobs
        this.pollInterval = setTimeout(() => this.pollProgress(), 1000);
      }

    } catch (error) {
      if (error.name === 'AbortError') {
        // Processing was cancelled, don't emit error
        return;
      }

      console.error('Error polling progress:', error);

      // Implement retry logic
      this.pollRetryCount++;

      if (this.pollRetryCount < this.maxRetries) {
        console.log(`Retrying progress poll (${this.pollRetryCount}/${this.maxRetries})`);
        // Exponential backoff: 2s, 4s, 8s
        const retryDelay = Math.pow(2, this.pollRetryCount) * 1000;
        this.pollInterval = setTimeout(() => this.pollProgress(), retryDelay);
      } else {
        // Max retries exceeded
        this.isProcessing = false;
        this.eventBus.emit('processing:error', {
          error: `Failed to get progress after ${this.maxRetries} attempts: ${error.message}`
        });
      }
    }
  }

  handleJobNotFound() {
    // Job not found - could be expired or never existed
    // Provide user-friendly feedback instead of error
    this.isProcessing = false;
    this.eventBus.emit('processing:error', {
      error: 'Processing session expired or not found. Please try starting the extraction again.'
    });
  }

  cancelProcessing() {
    // Prevent recursive calls
    if (this.isResetting) return;

    console.log('Cancelling processing...');

    // Clear polling interval
    if (this.pollInterval) {
      clearTimeout(this.pollInterval);
      this.pollInterval = null;
    }

    // Abort any ongoing requests
    if (this.abortController) {
      this.abortController.abort();
    }

    // Notify server to cancel processing if we have a job ID
    if (this.currentJobId) {
      fetch(`/api/video/cancel/${this.currentJobId}`, {
        method: 'POST'
      }).catch(error => {
        console.error('Error cancelling job on server:', error);
        // Don't propagate this error to user
      });
    }

    this.cleanupState();
    this.eventBus.emit('processing:cancelled');
  }

  cleanupState() {
    this.isProcessing = false;
    this.currentSessionId = null;
    this.currentJobId = null;
    this.abortController = null;
    this.pollRetryCount = 0;

    if (this.pollInterval) {
      clearTimeout(this.pollInterval);
      this.pollInterval = null;
    }
  }

  reset() {
    // Prevent recursive reset calls
    if (this.isResetting) return;
    this.isResetting = true;

    try {
      this.cancelProcessing();

      // Reset UI elements
      if (this.videoUrlInput) this.videoUrlInput.value = '';
      if (this.videoFileInput) this.videoFileInput.value = '';
      if (this.uploadSubmitBtn) this.uploadSubmitBtn.disabled = true;

    } finally {
      this.isResetting = false;
    }
  }

  // Public API
  getCurrentSessionId() {
    return this.currentSessionId;
  }

  getCurrentJobId() {
    return this.currentJobId;
  }

  isCurrentlyProcessing() {
    return this.isProcessing;
  }
}
