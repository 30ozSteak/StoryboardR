/**
 * KeyframeScrubber - Handles keyframe navigation and scrubbing functionality
 * Manages frame navigation, scrubbing, and temporary frame generation
 */
export class KeyframeScrubber {
  constructor(eventBus, storage, renderer) {
    this.eventBus = eventBus;
    this.storage = storage;
    this.renderer = renderer;
    this.bindEvents();
  }

  bindEvents() {
    this.eventBus.on('keyframe:navigate', (data) => {
      this.navigateKeyframe(data.keyframeId, data.direction);
    });
  }

  async navigateKeyframe(keyframeId, direction) {
    const galleryItems = this.renderer.getAllKeyframeItems();
    const currentItem = galleryItems.find(item => item.dataset.keyframeId === keyframeId);

    if (!currentItem) {
      console.warn('Current keyframe item not found:', keyframeId);
      return;
    }

    const keyframe = this.storage.getKeyframe(keyframeId);
    const frameMetadata = this.storage.getKeyframeMetadata(keyframeId);

    if (!frameMetadata || !frameMetadata.sessionId) {
      console.warn('No session metadata found for frame scrubbing:', {
        keyframeId,
        frameMetadata,
        allMetadata: Array.from(this.storage.frameMetadata.entries())
      });
      return;
    }

    // Calculate new timestamp (scrub 1 second forward/backward)
    const currentTimestamp = frameMetadata.timestamp || 0;
    const newTimestamp = direction === 'prev'
      ? Math.max(0, currentTimestamp - 1)
      : currentTimestamp + 1;

    console.log('Scrubbing frame:', {
      keyframeId,
      filename: frameMetadata.filename,
      direction,
      currentTimestamp,
      newTimestamp,
      sessionId: frameMetadata.sessionId
    });

    // Show loading state
    const image = currentItem.querySelector('.keyframe-image');
    const originalSrc = image.src;
    this.showScrubLoading(currentItem, direction);

    try {
      // Call backend to extract frame at new timestamp
      const response = await fetch('/api/video/scrub', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: frameMetadata.sessionId,
          timestamp: newTimestamp,
          frameFilename: frameMetadata.filename
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Scrub failed: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('Scrub result:', result);

      // Update the image with the new frame (non-destructive preview)
      image.src = result.newFrame.url;

      // Store scrub data for potential saving
      currentItem.dataset.scrubData = JSON.stringify({
        originalKeyframeId: keyframeId,
        originalFrame: frameMetadata.filename,
        scrubFrame: result.newFrame.filename,
        newTimestamp: newTimestamp,
        originalTimestamp: currentTimestamp,
        originalSrc: originalSrc
      });

      // Update frame metadata temporarily
      this.storage.updateKeyframeMetadata(keyframeId, { timestamp: newTimestamp });

      // Show save/revert controls
      this.showScrubControls(currentItem);

      this.eventBus.emit('keyframe:scrubbed', {
        keyframeId,
        direction,
        originalTimestamp: currentTimestamp,
        newTimestamp: newTimestamp,
        newFrameUrl: result.newFrame.url
      });

    } catch (error) {
      console.error('Error during frame scrubbing:', error);
      // Revert on error
      image.src = originalSrc;
      this.showScrubError(currentItem, error.message);
    } finally {
      this.hideScrubLoading(currentItem);
    }
  }

  showScrubLoading(item, direction) {
    const container = item.querySelector('.keyframe-container');
    let loadingOverlay = container.querySelector('.scrub-loading');

    if (!loadingOverlay) {
      loadingOverlay = document.createElement('div');
      loadingOverlay.className = 'scrub-loading';
      container.appendChild(loadingOverlay);
    }

    loadingOverlay.innerHTML = `
      <div class="scrub-loading-content">
        <div class="spinner"></div>
        <span>Scrubbing ${direction === 'prev' ? 'backward' : 'forward'}...</span>
        <div class="scrub-direction-icon">
          <i class="fas fa-${direction === 'prev' ? 'step-backward' : 'step-forward'}"></i>
        </div>
      </div>
    `;

    loadingOverlay.style.display = 'flex';
  }

  hideScrubLoading(item) {
    const loadingOverlay = item.querySelector('.scrub-loading');
    if (loadingOverlay) {
      loadingOverlay.style.display = 'none';
    }
  }

  showScrubControls(item) {
    const info = item.querySelector('.keyframe-info');
    let controlsContainer = info.querySelector('.scrub-controls');

    if (!controlsContainer) {
      controlsContainer = document.createElement('div');
      controlsContainer.className = 'scrub-controls';

      // Insert before existing actions
      const existingActions = info.querySelector('.keyframe-actions');
      info.insertBefore(controlsContainer, existingActions);
    }

    // Get scrub data to show timestamp info
    const scrubData = JSON.parse(item.dataset.scrubData || '{}');
    const originalTime = scrubData.originalTimestamp || 0;
    const newTime = scrubData.newTimestamp || 0;

    controlsContainer.innerHTML = `
      <div class="scrub-timestamp-info">
        <div class="timestamp-change">
          <span class="original-time">${originalTime.toFixed(1)}s</span>
          <i class="fas fa-arrow-right"></i>
          <span class="new-time">${newTime.toFixed(1)}s</span>
        </div>
      </div>
      <div class="scrub-actions">
        <button class="keyframe-btn primary save-scrub-btn">
          <i class="fas fa-save"></i>
          Save Frame
        </button>
        <button class="keyframe-btn secondary revert-scrub-btn">
          <i class="fas fa-undo"></i>
          Revert
        </button>
      </div>
      <div class="scrub-info">
        <small>Scrubbed to new timestamp. Save to add as new keyframe or revert to original.</small>
      </div>
    `;

    // Bind events after setting innerHTML
    const saveBtn = controlsContainer.querySelector('.save-scrub-btn');
    const revertBtn = controlsContainer.querySelector('.revert-scrub-btn');

    saveBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.saveScrubbed(item);
    });

    revertBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.revertScrubbed(item);
    });

    controlsContainer.style.display = 'block';

    // Emit event to disable drag and drop while scrub controls are visible
    this.eventBus.emit('dragdrop:disable');
  }

  hideScrubControls(item) {
    const controlsContainer = item.querySelector('.scrub-controls');
    if (controlsContainer) {
      controlsContainer.style.display = 'none';
    }

    // Re-enable drag and drop when scrub controls are hidden
    this.eventBus.emit('dragdrop:enable');
  }

  async saveScrubbed(item) {
    const scrubData = JSON.parse(item.dataset.scrubData || '{}');
    if (!scrubData.scrubFrame) return;

    const keyframeId = scrubData.originalKeyframeId;
    const frameMetadata = this.storage.getKeyframeMetadata(keyframeId);

    try {
      // Show saving state
      const saveBtn = item.querySelector('.save-scrub-btn');
      const originalText = saveBtn.innerHTML;
      saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
      saveBtn.disabled = true;

      // Call backend to save the scrubbed frame
      const response = await fetch('/api/video/save-scrubbed-frame', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: frameMetadata.sessionId,
          scrubFilename: scrubData.scrubFrame,
          originalFrameFilename: scrubData.originalFrame,
          timestamp: scrubData.newTimestamp
        })
      });

      if (!response.ok) {
        throw new Error(`Save failed: ${response.statusText}`);
      }

      const result = await response.json();

      // Add the new keyframe after the current one
      const galleryItems = this.renderer.getAllKeyframeItems();
      const currentIndex = galleryItems.indexOf(item);
      const newItem = this.renderer.insertKeyframeAfter(result.newKeyframe, currentIndex);

      // Emit events to reinitialize drag and drop
      this.eventBus.emit('dragdrop:reinitialize');

      // Clean up scrub state
      delete item.dataset.scrubData;
      this.hideScrubControls(item);

      this.eventBus.emit('keyframe:scrubSaved', {
        originalKeyframeId: keyframeId,
        newKeyframe: result.newKeyframe
      });

    } catch (error) {
      console.error('Error saving scrubbed frame:', error);
      this.showScrubError(item, error.message);
    } finally {
      const saveBtn = item.querySelector('.save-scrub-btn');
      if (saveBtn) {
        saveBtn.innerHTML = originalText;
        saveBtn.disabled = false;
      }
    }
  }

  async revertScrubbed(item) {
    const scrubData = JSON.parse(item.dataset.scrubData || '{}');
    if (!scrubData.originalSrc) return;

    // Clean up the temporary scrub file on the server
    if (scrubData.scrubFrame) {
      const keyframeId = scrubData.originalKeyframeId;
      const frameMetadata = this.storage.getKeyframeMetadata(keyframeId);
      if (frameMetadata?.sessionId) {
        try {
          await fetch(`/api/video/scrub/${scrubData.scrubFrame}`, {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              sessionId: frameMetadata.sessionId
            })
          });
        } catch (error) {
          console.warn('Failed to clean up scrubbed frame on server:', error);
        }
      }
    }

    // Revert the image to original
    const image = item.querySelector('.keyframe-image');
    image.src = scrubData.originalSrc;

    // Revert metadata
    const keyframeId = scrubData.originalKeyframeId;
    this.storage.updateKeyframeMetadata(keyframeId, {
      timestamp: scrubData.originalTimestamp
    });

    // Clean up scrub state
    delete item.dataset.scrubData;
    this.hideScrubControls(item);

    this.eventBus.emit('keyframe:scrubReverted', {
      keyframeId: keyframeId
    });
  }

  showScrubError(item, message) {
    const info = item.querySelector('.keyframe-info');
    let errorContainer = info.querySelector('.scrub-error');

    if (!errorContainer) {
      errorContainer = document.createElement('div');
      errorContainer.className = 'scrub-error';
      info.appendChild(errorContainer);
    }

    errorContainer.innerHTML = `
      <div class="error-message">
        <i class="fas fa-exclamation-triangle"></i>
        Error: ${message}
      </div>
    `;

    // Auto-hide after 5 seconds
    setTimeout(() => {
      if (errorContainer.parentNode) {
        errorContainer.remove();
      }
    }, 5000);
  }
}
