/**
 * ModalManager - Handles all modal functionality and navigation
 * Separated from main app logic for clean concerns
 */
export class ModalManager {
  constructor(eventBus) {
    this.eventBus = eventBus;
    this.currentModalImage = null;
    this.frameMetadata = new Map();

    this.initializeElements();
    this.bindEvents();
  }

  initializeElements() {
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
  }

  bindEvents() {
    // Modal close events
    this.modalBackdrop?.addEventListener('click', () => this.closeModal());
    this.modalClose?.addEventListener('click', () => this.closeModal());

    // Modal action events
    this.downloadBtn?.addEventListener('click', () => this.downloadCurrentImage());
    this.copyUrlBtn?.addEventListener('click', () => this.copyImageUrl());
    this.saveFrameBtn?.addEventListener('click', () => this.saveCurrentNavigationFrame());

    // Frame navigation
    this.framePrevBtn?.addEventListener('click', () => this.navigateToPreviousFrame());
    this.frameNextBtn?.addEventListener('click', () => this.navigateToNextFrame());

    // Keyboard events
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !this.imageModal.classList.contains('hidden')) {
        this.closeModal();
      }
      if (!this.imageModal.classList.contains('hidden')) {
        if (e.key === 'ArrowLeft') this.navigateToPreviousFrame();
        if (e.key === 'ArrowRight') this.navigateToNextFrame();
      }
    });
  }

  openModal(imageUrl, title, keyframeId, filename) {
    this.modalImage.src = imageUrl;
    this.modalTitle.textContent = title;

    // Remove hidden class and add fade-in animation
    this.imageModal.classList.remove('hidden');

    // Force reflow before adding animation class
    this.imageModal.offsetHeight;
    this.imageModal.classList.add('fade-in');

    this.currentModalImage = {
      url: imageUrl,
      title: title,
      id: keyframeId,
      filename: filename || imageUrl.split('/').pop(),
      isNavigationFrame: false
    };

    // Hide/show appropriate controls
    this.saveFrameBtn?.classList.add('hidden');
    if (this.framePrevBtn) this.framePrevBtn.style.display = 'flex';
    if (this.frameNextBtn) this.frameNextBtn.style.display = 'flex';

    this.updateFrameProgress();
    this.updateNavigationButtonStates();

    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';

    // Focus the modal for accessibility
    this.imageModal.focus();

    // Notify other modules
    this.eventBus.emit('modal:opened', this.currentModalImage);
  }

  closeModal() {
    this.imageModal.classList.add('hidden');
    this.imageModal.classList.remove('fade-in');
    document.body.style.overflow = '';

    const previousImage = this.currentModalImage;
    this.currentModalImage = null;

    // Hide navigation elements
    if (this.framePrevBtn) this.framePrevBtn.style.display = 'none';
    if (this.frameNextBtn) this.frameNextBtn.style.display = 'none';
    this.frameProgress?.classList.add('hidden');

    // Notify other modules
    this.eventBus.emit('modal:closed', previousImage);
  }

  downloadCurrentImage() {
    if (this.currentModalImage) {
      this.eventBus.emit('modal:downloadRequested', this.currentModalImage);
    }
  }

  async copyImageUrl() {
    if (this.currentModalImage) {
      try {
        const fullUrl = window.location.origin + this.currentModalImage.url;
        await navigator.clipboard.writeText(fullUrl);
        this.eventBus.emit('ui:showMessage', 'URL copied to clipboard!');
      } catch (error) {
        console.error('Failed to copy URL:', error);
        this.eventBus.emit('ui:showMessage', 'Failed to copy URL');
      }
    }
  }

  saveCurrentNavigationFrame() {
    if (this.currentModalImage) {
      this.eventBus.emit('modal:saveFrameRequested', this.currentModalImage);
    }
  }

  navigateToPreviousFrame() {
    if (this.currentModalImage) {
      this.eventBus.emit('modal:navigationRequested', {
        direction: 'previous',
        currentFrame: this.currentModalImage
      });
    }
  }

  navigateToNextFrame() {
    if (this.currentModalImage) {
      this.eventBus.emit('modal:navigationRequested', {
        direction: 'next',
        currentFrame: this.currentModalImage
      });
    }
  }

  updateFrameProgress() {
    if (!this.currentModalImage || !this.frameMetadata.has(this.currentModalImage.filename)) {
      this.frameProgress?.classList.add('hidden');
      return;
    }

    const metadata = this.frameMetadata.get(this.currentModalImage.filename);
    if (metadata && metadata.timestamp !== undefined) {
      this.frameProgress?.classList.remove('hidden');

      // Update progress display
      if (this.frameTimeInfo) {
        this.frameTimeInfo.textContent = this.formatTime(metadata.timestamp);
      }

      // Update progress bar if we have video duration
      this.eventBus.emit('modal:progressUpdate', {
        timestamp: metadata.timestamp,
        filename: this.currentModalImage.filename
      });
    }
  }

  updateNavigationButtonStates() {
    // This will be handled by the KeyframeManager
    this.eventBus.emit('modal:updateNavigationStates', this.currentModalImage);
  }

  formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  // Public API methods
  setFrameMetadata(metadata) {
    this.frameMetadata = metadata;
  }

  getCurrentImage() {
    return this.currentModalImage;
  }

  isOpen() {
    return !this.imageModal.classList.contains('hidden');
  }
}
