class VideoKeyframeExtractor {
  constructor() {
    this.currentSessionId = null;
    this.isProcessing = false;
    this.abortController = null;
    this.currentProject = null; // Store current project data

    this.initializeElements();
    this.bindEvents();
    this.initializeView();
    this.initializeTheme();
    this.checkServerStatus();
    this.checkCookieStatus();
    this.checkProjectLoad(); // Check if loading an existing project
    this.initializeMouseTracking();

    // Initialize drawing functionality
    this.initializeDrawing();
  }

  initializeElements() {
    // Sections
    this.uploadSection = document.getElementById('uploadSection');
    this.loadingSection = document.getElementById('loadingSection');
    this.resultsSection = document.getElementById('resultsSection');
    this.errorSection = document.getElementById('errorSection');

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
    this.newExtractionBtn = document.getElementById('newExtractionBtn');
    this.retryBtn = document.getElementById('retryBtn');
    this.downloadAllBtn = document.getElementById('downloadAllBtn');
    this.saveProjectBtn = document.getElementById('saveProjectBtn');
    this.backToProjectsBtn = document.getElementById('backToProjectsBtn');

    // Tab navigation
    this.tabButtons = document.querySelectorAll('.tab-btn');
    this.tabContents = document.querySelectorAll('.tab-content');

    // Loading elements
    this.loadingText = document.getElementById('loadingText');
    this.progressFill = document.getElementById('progressFill');
    this.progressPercentage = document.getElementById('progressPercentage');

    // Results elements
    this.frameCount = document.getElementById('frameCount');
    this.gallery = document.getElementById('gallery');
    this.galleryContainer = document.getElementById('galleryContainer');
    this.sectionTitle = document.getElementById('sectionTitle');

    // Selection elements
    this.selectionInfo = document.getElementById('selectionInfo');
    this.selectedCount = document.getElementById('selectedCount');
    this.selectAllBtn = document.getElementById('selectAllBtn');
    this.deselectAllBtn = document.getElementById('deselectAllBtn');
    this.addNotesBtn = document.getElementById('addNotesBtn');
    this.deleteSelectedBtn = document.getElementById('deleteSelectedBtn');

    // Selection state
    this.selectedKeyframes = new Set();

    // Custom keyframe names
    this.keyframeNames = new Map();

    // Keyframe notes
    this.keyframeNotes = new Map();

    // Frame metadata for navigation
    this.frameMetadata = new Map(); // Maps filename to {timestamp, index, sessionId}
    this.videoDuration = null; // Store video duration for boundary checking
    this.frameCache = new Map(); // Cache for adjacent frames: Maps timestamp to {url, filename}

    // Navigation message debouncing
    this.navigationMessageTimeout = null;
    this.lastNavigationTime = 0;

    // Error elements
    this.errorMessage = document.getElementById('errorMessage');

    // Modal elements
    this.imageModal = document.getElementById('imageModal');
    this.modalBackdrop = document.getElementById('modalBackdrop');
    this.modalClose = document.getElementById('modalClose');
    this.modalImage = document.getElementById('modalImage');
    this.modalTitle = document.getElementById('modalTitle');
    this.downloadBtn = document.getElementById('downloadBtn');
    this.copyUrlBtn = document.getElementById('copyUrlBtn');
    this.saveFrameBtn = document.getElementById('saveFrameBtn');

    // Frame navigation elements
    this.framePrevBtn = document.getElementById('framePrevBtn');
    this.frameNextBtn = document.getElementById('frameNextBtn');

    // Frame progress elements
    this.frameProgress = document.getElementById('frameProgress');
    this.frameProgressFill = document.getElementById('frameProgressFill');
    this.frameTimeInfo = document.getElementById('frameTimeInfo');

    // Notes modal elements
    this.notesModal = document.getElementById('notesModal');
    this.notesModalBackdrop = document.getElementById('notesModalBackdrop');
    this.notesModalClose = document.getElementById('notesModalClose');
    this.notesModalTitle = document.getElementById('notesModalTitle');
    this.selectedFramesCount = document.getElementById('selectedFramesCount');
    this.notesTextarea = document.getElementById('notesTextarea');
    this.notesCharCount = document.getElementById('notesCharCount');
    this.saveNotesBtn = document.getElementById('saveNotesBtn');
    this.cancelNotesBtn = document.getElementById('cancelNotesBtn');

    // Add Keyframe button (now in bulk actions)
    this.addKeyframeBtn = document.getElementById('addKeyframeBtn');

    // Cookie management elements
    this.cookieFile = document.getElementById('cookieFile');

    // Drawing elements
    this.drawingCanvas = document.getElementById('drawingCanvas');
    this.imageContainer = document.getElementById('imageContainer');
    this.drawingControls = document.getElementById('drawingControls');
    this.toggleDrawingBtn = document.getElementById('toggleDrawingBtn');
    this.clearDrawingBtn = document.getElementById('clearDrawingBtn');
    this.toggleNotesBtn = document.getElementById('toggleNotesBtn');
    this.brushSize = document.getElementById('brushSize');
    this.brushColor = document.getElementById('brushColor');

    // Drawing state
    this.isDrawing = false;
    this.drawingMode = false;
    this.notesVisible = true;
    this.drawingHistory = new Map(); // Store drawings per keyframe filename
    this.ctx = null;
    this.currentModalImage = null;
  }

  bindEvents() {
    // Tab switching
    this.tabButtons.forEach(button => {
      button.addEventListener('click', () => {
        const tabName = button.dataset.tab;
        this.switchTab(tabName);
      });
    });

    // Form submissions
    if (this.urlForm) {
      this.urlForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.processVideoUrl();
      });
    }

    if (this.uploadForm) {
      this.uploadForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.processVideoFile();
      });
    }

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
    }

    // Button events
    if (this.cancelBtn) {
      this.cancelBtn.addEventListener('click', () => this.cancelProcessing());
    }

    if (this.newExtractionBtn) {
      this.newExtractionBtn.addEventListener('click', () => this.resetToUpload());
    }

    if (this.retryBtn) {
      this.retryBtn.addEventListener('click', () => this.resetToUpload());
    }

    if (this.downloadAllBtn) {
      this.downloadAllBtn.addEventListener('click', () => this.downloadAllImages());
    }

    if (this.saveProjectBtn) {
      this.saveProjectBtn.addEventListener('click', () => this.saveProject());
    }

    if (this.backToProjectsBtn) {
      this.backToProjectsBtn.addEventListener('click', () => {
        window.location.href = '/dashboard.html';
      });
    }

    // Selection buttons
    if (this.selectAllBtn) {
      this.selectAllBtn.addEventListener('click', () => this.selectAllKeyframes());
    }

    if (this.deselectAllBtn) {
      this.deselectAllBtn.addEventListener('click', () => this.deselectAllKeyframes());
    }

    if (this.addNotesBtn) {
      this.addNotesBtn.addEventListener('click', () => this.openNotesModal());
    }

    if (this.deleteSelectedBtn) {
      this.deleteSelectedBtn.addEventListener('click', () => this.deleteSelectedKeyframes());
    }

    // Modal events
    if (this.modalBackdrop) {
      this.modalBackdrop.addEventListener('click', () => this.closeModal());
    }

    if (this.modalClose) {
      this.modalClose.addEventListener('click', () => this.closeModal());
    }

    // Modal button events
    if (this.downloadBtn) {
      this.downloadBtn.addEventListener('click', () => this.downloadCurrentImage());
    }

    if (this.copyUrlBtn) {
      this.copyUrlBtn.addEventListener('click', () => this.copyImageUrl());
    }

    if (this.saveFrameBtn) {
      this.saveFrameBtn.addEventListener('click', () => this.saveCurrentNavigationFrame());
    }

    // Frame navigation
    if (this.framePrevBtn) {
      this.framePrevBtn.addEventListener('click', () => this.navigateToPreviousFrame());
    }

    if (this.frameNextBtn) {
      this.frameNextBtn.addEventListener('click', () => this.navigateToNextFrame());
    }

    // Notes modal events
    if (this.notesModalBackdrop) {
      this.notesModalBackdrop.addEventListener('click', () => this.closeNotesModal());
    }

    if (this.notesModalClose) {
      this.notesModalClose.addEventListener('click', () => this.closeNotesModal());
    }

    if (this.saveNotesBtn) {
      this.saveNotesBtn.addEventListener('click', () => this.saveNotes());
    }

    if (this.cancelNotesBtn) {
      this.cancelNotesBtn.addEventListener('click', () => this.closeNotesModal());
    }

    if (this.notesTextarea) {
      this.notesTextarea.addEventListener('input', () => this.updateNotesCharCount());
    }

    // Keyboard events
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (!this.imageModal.classList.contains('hidden')) {
          this.closeModal();
        } else if (!this.notesModal.classList.contains('hidden')) {
          this.closeNotesModal();
        }
      }
    });

    // Drawing events
    this.bindDrawingEvents();
  }

  bindDrawingEvents() {
    if (!this.drawingCanvas) return;

    // Initialize canvas context
    this.ctx = this.drawingCanvas.getContext('2d');

    // Drawing button events
    if (this.toggleDrawingBtn) {
      this.toggleDrawingBtn.addEventListener('click', () => this.toggleDrawingMode());
    }

    if (this.clearDrawingBtn) {
      this.clearDrawingBtn.addEventListener('click', () => this.clearDrawing());
    }

    if (this.toggleNotesBtn) {
      this.toggleNotesBtn.addEventListener('click', () => this.toggleNotesVisibility());
    }

    // Settings events
    if (this.brushSize) {
      this.brushSize.addEventListener('input', (e) => {
        this.brushSizeValue = parseInt(e.target.value);
      });
    }

    if (this.brushColor) {
      this.brushColor.addEventListener('change', (e) => {
        this.brushColorValue = e.target.value;
      });
    }

    // Canvas drawing events
    this.drawingCanvas.addEventListener('mousedown', (e) => this.startDrawing(e));
    this.drawingCanvas.addEventListener('mousemove', (e) => this.draw(e));
    this.drawingCanvas.addEventListener('mouseup', () => this.stopDrawing());
    this.drawingCanvas.addEventListener('mouseout', () => this.stopDrawing());

    // Touch events for mobile
    this.drawingCanvas.addEventListener('touchstart', (e) => this.handleTouch(e, 'start'));
    this.drawingCanvas.addEventListener('touchmove', (e) => this.handleTouch(e, 'move'));
    this.drawingCanvas.addEventListener('touchend', (e) => this.handleTouch(e, 'end'));

    // Modal image load event
    if (this.modalImage) {
      this.modalImage.addEventListener('load', () => this.onImageLoad());
    }

    // Initialize default values
    this.brushSizeValue = 3;
    this.brushColorValue = '#ff0000';
  }

  // Drawing functionality methods
  setupCanvas() {
    this.resizeCanvas();
    if (this.ctx) {
      this.ctx.lineCap = 'round';
      this.ctx.lineJoin = 'round';
    }
  }

  resizeCanvas() {
    if (!this.modalImage || !this.drawingCanvas) return;

    const img = this.modalImage;
    const rect = img.getBoundingClientRect();

    this.drawingCanvas.width = rect.width;
    this.drawingCanvas.height = rect.height;
    this.drawingCanvas.style.width = rect.width + 'px';
    this.drawingCanvas.style.height = rect.height + 'px';

    if (this.ctx) {
      this.ctx.lineCap = 'round';
      this.ctx.lineJoin = 'round';
    }
  }

  onImageLoad() {
    this.setupCanvas();
    this.loadDrawingForCurrentKeyframe();
  }

  initializeDrawing() {
    // Initialize drawing state
    this.isDrawing = false;
    this.drawingMode = false;
    this.notesVisible = true;
    this.drawingHistory = new Map();
    this.brushSizeValue = 3;
    this.brushColorValue = '#ff0000';
  }

  toggleDrawingMode() {
    this.drawingMode = !this.drawingMode;

    if (this.drawingMode) {
      this.drawingCanvas.classList.add('drawing-mode');
      this.drawingCanvas.classList.remove('hidden');
      this.toggleDrawingBtn.classList.add('active');
      this.toggleDrawingBtn.innerHTML = '<i class="fas fa-pencil-alt"></i> Drawing';
    } else {
      this.drawingCanvas.classList.remove('drawing-mode');
      this.toggleDrawingBtn.classList.remove('active');
      this.toggleDrawingBtn.innerHTML = '<i class="fas fa-pencil-alt"></i> Draw';
    }
  }

  toggleNotesVisibility() {
    this.notesVisible = !this.notesVisible;

    if (this.notesVisible) {
      this.drawingCanvas.classList.remove('hidden');
      this.toggleNotesBtn.innerHTML = '<i class="fas fa-eye"></i> Hide Notes';
    } else {
      this.drawingCanvas.classList.add('hidden');
      this.toggleNotesBtn.innerHTML = '<i class="fas fa-eye-slash"></i> Show Notes';
    }
  }

  clearDrawing() {
    if (!this.ctx || !this.currentModalImage) return;

    this.ctx.clearRect(0, 0, this.drawingCanvas.width, this.drawingCanvas.height);
    this.drawingHistory.delete(this.currentModalImage.filename);
  }

  startDrawing(e) {
    if (!this.drawingMode) return;

    this.isDrawing = true;
    const pos = this.getMousePos(e);
    this.ctx.beginPath();
    this.ctx.moveTo(pos.x, pos.y);

    this.ctx.strokeStyle = this.brushColorValue;
    this.ctx.lineWidth = this.brushSizeValue;
  }

  draw(e) {
    if (!this.isDrawing || !this.drawingMode) return;

    const pos = this.getMousePos(e);
    this.ctx.lineTo(pos.x, pos.y);
    this.ctx.stroke();
  }

  stopDrawing() {
    if (!this.isDrawing) return;

    this.isDrawing = false;
    this.saveCurrentDrawing();
  }

  handleTouch(e, type) {
    e.preventDefault();

    if (e.touches.length !== 1) return;

    const touch = e.touches[0];
    const mouseEvent = new MouseEvent(
      type === 'start' ? 'mousedown' : type === 'move' ? 'mousemove' : 'mouseup',
      {
        clientX: touch.clientX,
        clientY: touch.clientY
      }
    );

    this.drawingCanvas.dispatchEvent(mouseEvent);
  }

  getMousePos(e) {
    const rect = this.drawingCanvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  }

  saveCurrentDrawing() {
    if (!this.currentModalImage) return;

    const imageData = this.drawingCanvas.toDataURL();
    this.drawingHistory.set(this.currentModalImage.filename, imageData);
  }

  loadDrawingForCurrentKeyframe() {
    if (!this.currentModalImage || !this.ctx) return;

    this.ctx.clearRect(0, 0, this.drawingCanvas.width, this.drawingCanvas.height);

    const savedDrawing = this.drawingHistory.get(this.currentModalImage.filename);
    if (savedDrawing) {
      const img = new Image();
      img.onload = () => {
        this.ctx.drawImage(img, 0, 0);
      };
      img.src = savedDrawing;
    }
  }

  // Modal functionality
  openModal(imageUrl, title) {
    this.modalImage.src = imageUrl;
    this.modalTitle.textContent = title;
    this.imageModal.classList.remove('hidden');
    this.imageModal.classList.add('fade-in');

    this.currentModalImage = {
      url: imageUrl,
      title: title,
      filename: imageUrl.split('/').pop(),
      isNavigationFrame: false
    };

    this.saveFrameBtn.classList.add('hidden');
    this.framePrevBtn.style.display = 'flex';
    this.frameNextBtn.style.display = 'flex';

    this.updateFrameProgress();
    this.framePrevBtn.disabled = false;
    this.frameNextBtn.disabled = false;
    this.updateNavigationButtonStates();

    document.body.style.overflow = 'hidden';
  }

  closeModal() {
    this.imageModal.classList.add('hidden');
    this.imageModal.classList.remove('fade-in');
    document.body.style.overflow = '';
    this.currentModalImage = null;

    this.framePrevBtn.style.display = 'none';
    this.frameNextBtn.style.display = 'none';
    this.frameProgress.classList.add('hidden');

    this.hideFrameLoading();
  }

  // Placeholder methods - these would need full implementation
  switchTab(tabName) {
    console.log(`Switching to tab: ${tabName}`);
  }

  processVideoUrl() {
    console.log('Processing video URL...');
  }

  processVideoFile() {
    console.log('Processing video file...');
  }

  cancelProcessing() {
    console.log('Cancelling processing...');
  }

  resetToUpload() {
    console.log('Resetting to upload...');
  }

  downloadAllImages() {
    console.log('Downloading all images...');
  }

  saveProject() {
    if (!this.gallery) return;

    console.log('Saving project...');

    const keyframes = [];
    const items = this.gallery.children;

    for (let item of items) {
      const img = item.querySelector('img');
      const filename = item.dataset.filename; // Use the data attribute we fixed

      if (img && filename) {
        const timestamp = this.frameMetadata.get(filename)?.timestamp || 0;
        const index = Array.from(items).indexOf(item);

        keyframes.push({
          filename: filename,
          url: img.src,
          timestamp: timestamp,
          index: index
        });
      }
    }

    console.log(`Saving ${keyframes.length} keyframes`);
    // Additional save logic would go here
  }

  selectAllKeyframes() {
    console.log('Selecting all keyframes...');
  }

  deselectAllKeyframes() {
    console.log('Deselecting all keyframes...');
  }

  openNotesModal() {
    console.log('Opening notes modal...');
  }

  closeNotesModal() {
    console.log('Closing notes modal...');
  }

  deleteSelectedKeyframes() {
    console.log('Deleting selected keyframes...');
  }

  downloadCurrentImage() {
    console.log('Downloading current image...');
  }

  copyImageUrl() {
    console.log('Copying image URL...');
  }

  saveCurrentNavigationFrame() {
    console.log('Saving current navigation frame...');
  }

  navigateToPreviousFrame() {
    console.log('Navigating to previous frame...');
  }

  navigateToNextFrame() {
    console.log('Navigating to next frame...');
  }

  saveNotes() {
    console.log('Saving notes...');
  }

  updateNotesCharCount() {
    console.log('Updating notes character count...');
  }

  updateFrameProgress() {
    console.log('Updating frame progress...');
  }

  updateNavigationButtonStates() {
    console.log('Updating navigation button states...');
  }

  hideFrameLoading() {
    console.log('Hiding frame loading...');
  }

  initializeView() {
    console.log('Initializing view...');
  }

  initializeTheme() {
    console.log('Initializing theme...');
  }

  checkServerStatus() {
    console.log('Checking server status...');
  }

  checkCookieStatus() {
    console.log('Checking cookie status...');
  }

  checkProjectLoad() {
    console.log('Checking project load...');
  }

  initializeMouseTracking() {
    console.log('Initializing mouse tracking...');
  }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.app = new VideoKeyframeExtractor();
});
