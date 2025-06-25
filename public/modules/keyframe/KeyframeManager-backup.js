/**
 * KeyframeManager - Handles keyframe creation, display, and interactions
 * Separated from other concerns for clean architecture
 */
export class KeyframeManager {
  constructor(eventBus) {
    this.eventBus = eventBus;
    this.gallery = null;
    this.keyframes = new Map(); // Store keyframes by ID
    this.frameMetadata = new Map(); // Store metadata by ID
    this.keyframeNames = new Map(); // Store names by ID
    this.keyframeNotes = new Map(); // Store notes by ID
    this.sortableInstance = null; // Store SortableJS instance
    this.currentProjectId = null; // Store current project ID for saving order

    this.initializeElements();
    this.bindEvents();
  }

  initializeElements() {
    this.gallery = document.getElementById('gallery');
    this.frameCount = document.getElementById('frameCount');
    this.sectionTitle = document.getElementById('sectionTitle');
  }

  bindEvents() {
    // Listen to modal events for navigation
    this.eventBus.on('modal:navigationRequested', (data) => {
      this.handleFrameNavigation(data);
    });

    this.eventBus.on('modal:updateNavigationStates', (currentImage) => {
      this.updateNavigationButtonStates(currentImage);
    });

    this.eventBus.on('modal:downloadRequested', (imageData) => {
      this.downloadImage(imageData);
    });
  }

  // Utility function to generate unique IDs
  generateUniqueId() {
    return 'kf_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 9);
  }

  // Ensure keyframe has a unique ID
  ensureKeyframeId(keyframe) {
    if (!keyframe.id) {
      keyframe.id = this.generateUniqueId();
    }
    return keyframe;
  }

  createKeyframeItem(keyframe, displayPosition) {
    // Ensure keyframe has a unique ID
    keyframe = this.ensureKeyframeId(keyframe);

    const item = document.createElement('div');
    item.className = 'keyframe-item';
    item.dataset.keyframeId = keyframe.id; // Use ID instead of filename
    item.dataset.filename = keyframe.filename; // Keep filename for backwards compatibility

    // Generate default name based on display position
    const defaultName = `Keyframe ${displayPosition}`;
    if (!this.keyframeNames.has(keyframe.id)) {
      this.keyframeNames.set(keyframe.id, defaultName);
    }
    const currentName = this.keyframeNames.get(keyframe.id);

    item.innerHTML = `
            <div class="keyframe-container">
                <div class="keyframe-checkbox" data-keyframe-id="${keyframe.id}" title="Select keyframe"></div>
                <img src="${keyframe.url}" alt="${currentName}" class="keyframe-image" loading="lazy" />
                <div class="keyframe-nav-arrows">
                    <button class="keyframe-nav-arrow prev" data-direction="prev" data-keyframe-id="${keyframe.id}">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
                        </svg>
                    </button>
                    <button class="keyframe-nav-arrow next" data-direction="next" data-keyframe-id="${keyframe.id}">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
                        </svg>
                    </button>
                </div>
                <div class="selection-indicator">
                    <i class="fas fa-circle"></i>
                </div>
                <div class="notes-indicator hidden">
                    <i class="fas fa-sticky-note"></i>
                </div>
            </div>
            <div class="keyframe-info">
                <input type="text" class="keyframe-title-input" value="${currentName}" data-keyframe-id="${keyframe.id}" maxlength="50" />
                <div class="keyframe-notes hidden">
                    <div class="notes-content"></div>
                </div>
                <div class="keyframe-actions">
                    <button class="keyframe-btn primary download-btn" data-url="${keyframe.url}" data-keyframe-id="${keyframe.id}">
                        <i class="fas fa-download"></i>
                        Download
                    </button>
                    <button class="keyframe-btn view-btn" data-url="${keyframe.url}" data-title="${currentName}" data-keyframe-id="${keyframe.id}">
                        <i class="fas fa-eye"></i>
                        View
                    </button>
                </div>
            </div>
        `;

    this.bindKeyframeItemEvents(item, keyframe);
    return item;
  }

  bindKeyframeItemEvents(item, keyframe) {
    const downloadBtn = item.querySelector('.download-btn');
    const viewBtn = item.querySelector('.view-btn');
    const image = item.querySelector('.keyframe-image');
    const titleInput = item.querySelector('.keyframe-title-input');
    const navArrows = item.querySelectorAll('.keyframe-nav-arrow');
    const checkbox = item.querySelector('.keyframe-checkbox');

    // Handle checkbox click for selection
    checkbox.addEventListener('click', (e) => {
      e.stopPropagation();
      this.eventBus.emit('selection:toggle', keyframe.id);
    });

    // Selection toggle on item click, but open modal on image click
    item.addEventListener('click', (e) => {
      if (e.target.closest('.keyframe-btn') ||
        e.target.closest('.keyframe-title-input') ||
        e.target.closest('.keyframe-nav-arrow') ||
        e.target.closest('.keyframe-checkbox')) {
        return;
      }
      this.eventBus.emit('selection:toggle', keyframe.id);
    });

    // Open modal when clicking on the image
    image.addEventListener('click', (e) => {
      e.stopPropagation();
      const customName = this.keyframeNames.get(keyframe.id) || 'Keyframe';
      this.eventBus.emit('modal:openRequested', {
        url: keyframe.url,
        title: customName,
        id: keyframe.id,
        filename: keyframe.filename // Keep for backwards compatibility
      });
    });

    // Add cursor pointer to image to indicate it's clickable
    image.style.cursor = 'pointer';

    // Handle navigation arrows
    navArrows.forEach(arrow => {
      arrow.addEventListener('click', (e) => {
        e.stopPropagation();
        const direction = arrow.dataset.direction;
        const keyframeId = arrow.dataset.keyframeId;
        this.navigateKeyframe(keyframeId, direction);
      });
    });

    // Handle title input changes
    titleInput.addEventListener('blur', (e) => {
      const galleryItems = Array.from(this.gallery.children);
      const currentPosition = galleryItems.indexOf(item) + 1;
      const newName = e.target.value.trim() || `Keyframe ${currentPosition}`;
      this.keyframeNames.set(keyframe.id, newName);
      e.target.value = newName;

      viewBtn.dataset.title = newName;
      image.alt = newName;

      this.eventBus.emit('keyframe:titleChanged', {
        id: keyframe.id,
        filename: keyframe.filename, // Keep for backwards compatibility
        title: newName
      });
    });

    titleInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.target.blur();
      }
      e.stopPropagation();
    });

    titleInput.addEventListener('click', (e) => {
      e.stopPropagation();
    });

    downloadBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.downloadSingleKeyframe(keyframe.id);
    });

    viewBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const customName = this.keyframeNames.get(keyframe.id) || 'Keyframe';
      this.eventBus.emit('modal:openRequested', {
        url: keyframe.url,
        title: customName,
        id: keyframe.id,
        filename: keyframe.filename // Keep for backwards compatibility
      });
    });
  }

  displayKeyframes(keyframes, projectInfo = null) {
    if (!this.gallery) return;

    // Validate keyframes data
    if (!keyframes || !Array.isArray(keyframes)) {
      console.error('Invalid keyframes data:', keyframes);
      return;
    }

    // Store project ID for saving order changes
    this.currentProjectId = projectInfo?.id || null;

    // Clear existing gallery
    this.gallery.innerHTML = '';

    // Set title and count
    if (this.sectionTitle && projectInfo) {
      this.sectionTitle.textContent = projectInfo.name || 'StoryboardR';
    }

    if (this.frameCount) {
      this.frameCount.textContent = `${keyframes.length} frames`;
    }

    // Create keyframe items
    keyframes.forEach((keyframe, index) => {
      // Ensure keyframe has a unique ID
      keyframe = this.ensureKeyframeId(keyframe);

      // Store keyframe data by ID
      this.keyframes.set(keyframe.id, keyframe);

      // Store frame metadata by ID
      this.frameMetadata.set(keyframe.id, {
        timestamp: keyframe.timestamp || 0,
        originalIndex: keyframe.index || index,
        sessionId: projectInfo?.sessionId,
        filename: keyframe.filename // Keep filename for backwards compatibility
      });

      const item = this.createKeyframeItem(keyframe, index + 1);
      this.gallery.appendChild(item);
    });

    // Initialize drag and drop after all items are added
    this.initializeDragAndDrop();

    this.eventBus.emit('keyframes:displayed', {
      count: keyframes.length,
      metadata: this.frameMetadata
    });
  }

  handleFrameNavigation(data) {
    const { direction, currentFrame } = data;
    const allItems = Array.from(this.gallery.children);
    const currentIndex = allItems.findIndex(item =>
      item.dataset.keyframeId === currentFrame.id
    );

    let targetIndex;
    if (direction === 'previous') {
      targetIndex = currentIndex > 0 ? currentIndex - 1 : allItems.length - 1;
    } else {
      targetIndex = currentIndex < allItems.length - 1 ? currentIndex + 1 : 0;
    }

    const targetItem = allItems[targetIndex];
    if (targetItem) {
      const img = targetItem.querySelector('.keyframe-image');
      const keyframeId = targetItem.dataset.keyframeId;
      const title = this.keyframeNames.get(keyframeId) || `Frame ${targetIndex + 1}`;
      const keyframe = this.keyframes.get(keyframeId);

      this.eventBus.emit('modal:openRequested', {
        url: img.src,
        title: title,
        id: keyframeId,
        filename: keyframe?.filename // Keep for backwards compatibility
      });
    }
  }

  updateNavigationButtonStates(currentImage) {
    if (!currentImage) return;

    const allItems = Array.from(this.gallery.children);
    const currentIndex = allItems.findIndex(item =>
      item.dataset.keyframeId === currentImage.id
    );

    this.eventBus.emit('modal:navigationStateUpdate', {
      canGoPrevious: allItems.length > 1,
      canGoNext: allItems.length > 1,
      currentIndex: currentIndex,
      totalFrames: allItems.length
    });
  }

  downloadSingleKeyframe(keyframeId) {
    const item = this.gallery.querySelector(`[data-keyframe-id="${keyframeId}"]`);
    if (!item) return;

    const keyframe = this.keyframes.get(keyframeId);
    if (!keyframe) return;

    const img = item.querySelector('img');
    const customName = this.keyframeNames.get(keyframeId) || keyframe.filename;
    const notes = this.keyframeNotes.get(keyframeId);

    this.downloadImageWithCustomName(img.src, keyframe.filename, customName, notes);
  }

  downloadImageWithCustomName(url, filename, customName, notes) {
    const link = document.createElement('a');
    link.href = url;
    link.download = `${customName}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    this.eventBus.emit('keyframe:downloaded', {
      filename,
      customName,
      notes
    });
  }

  downloadImage(imageData) {
    const keyframeId = imageData.id;
    const customName = this.keyframeNames.get(keyframeId) || imageData.title;
    const notes = this.keyframeNotes.get(keyframeId);
    this.downloadImageWithCustomName(imageData.url, imageData.filename, customName, notes);
  }

  async navigateKeyframe(keyframeId, direction) {
    const galleryItems = Array.from(this.gallery.children);
    const currentItem = galleryItems.find(item => item.dataset.keyframeId === keyframeId);

    if (!currentItem) {
      console.warn('Current keyframe item not found:', keyframeId);
      return;
    }

    const keyframe = this.keyframes.get(keyframeId);
    const frameMetadata = this.frameMetadata.get(keyframeId);

    if (!frameMetadata || !frameMetadata.sessionId) {
      console.warn('No session metadata found for frame scrubbing:', {
        keyframeId,
        frameMetadata,
        allMetadata: Array.from(this.frameMetadata.entries())
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
      frameMetadata.timestamp = newTimestamp;

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
  } showScrubLoading(item, direction) {
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

      // Bind events will be added after setting innerHTML
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

    // Disable drag and drop while scrub controls are visible
    this.disableDragAndDrop();
  }

  hideScrubControls(item) {
    const controlsContainer = item.querySelector('.scrub-controls');
    if (controlsContainer) {
      controlsContainer.style.display = 'none';
    }

    // Re-enable drag and drop when scrub controls are hidden
    this.enableDragAndDrop();
  }

  async saveScrubbed(item) {
    const scrubData = JSON.parse(item.dataset.scrubData || '{}');
    if (!scrubData.scrubFrame) return;

    const keyframeId = scrubData.originalKeyframeId;
    const frameMetadata = this.frameMetadata.get(keyframeId);

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
      const currentIndex = Array.from(this.gallery.children).indexOf(item);
      await this.insertKeyframeAfter(result.newKeyframe, currentIndex);

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
  } async revertScrubbed(item) {
    const scrubData = JSON.parse(item.dataset.scrubData || '{}');
    if (!scrubData.originalSrc) return;

    // Clean up the temporary scrub file on the server
    if (scrubData.scrubFrame) {
      const keyframeId = scrubData.originalKeyframeId;
      const frameMetadata = this.frameMetadata.get(keyframeId);
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
    const frameMetadata = this.frameMetadata.get(keyframeId);
    if (frameMetadata) {
      frameMetadata.timestamp = scrubData.originalTimestamp;
    }

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

  async insertKeyframeAfter(newKeyframe, afterIndex) {
    // Ensure the new keyframe has a unique ID
    newKeyframe = this.ensureKeyframeId(newKeyframe);

    // Create the new keyframe item
    const newItem = this.createKeyframeItem(newKeyframe, afterIndex + 2); // +2 because createKeyframeItem expects 1-based index

    // Store keyframe data and metadata
    this.keyframes.set(newKeyframe.id, newKeyframe);
    this.frameMetadata.set(newKeyframe.id, {
      timestamp: newKeyframe.timestamp || 0,
      originalIndex: afterIndex + 1,
      sessionId: Array.from(this.frameMetadata.values())[0]?.sessionId,
      filename: newKeyframe.filename // Keep filename for backwards compatibility
    });

    // Insert into gallery after the current item
    const galleryItems = Array.from(this.gallery.children);
    const afterItem = galleryItems[afterIndex];

    if (afterItem && afterItem.nextSibling) {
      this.gallery.insertBefore(newItem, afterItem.nextSibling);
    } else {
      this.gallery.appendChild(newItem);
    }

    // Update frame count
    if (this.frameCount) {
      const newCount = this.gallery.children.length;
      this.frameCount.textContent = `${newCount} frames`;
    }

    // Scroll to the new item
    newItem.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'center'
    });

    // Add a subtle highlight effect
    newItem.style.transform = 'scale(1.02)';
    newItem.style.boxShadow = '0 0 20px rgba(59, 130, 246, 0.5)';
    setTimeout(() => {
      newItem.style.transform = '';
      newItem.style.boxShadow = '';
    }, 1000);

    // Reinitialize drag and drop to include the new item
    this.initializeDragAndDrop();
  }

  initializeDragAndDrop() {
    if (!this.gallery || typeof Sortable === 'undefined') {
      console.warn('Gallery element or SortableJS not available');
      return;
    }

    // Destroy existing instance if it exists
    if (this.sortableInstance) {
      this.sortableInstance.destroy();
    }

    // Initialize SortableJS
    this.sortableInstance = Sortable.create(this.gallery, {
      animation: 200, // Smooth animation duration
      ghostClass: 'sortable-ghost', // CSS class for ghost element
      chosenClass: 'sortable-chosen', // CSS class for chosen element
      dragClass: 'keyframe-drag', // CSS class for drag element
      forceFallback: false, // Use native HTML5 DnD when possible
      fallbackClass: 'keyframe-fallback', // CSS class for fallback
      fallbackOnBody: true,
      swapThreshold: 0.65, // Threshold for swapping elements

      // Handle drag start
      onStart: (evt) => {
        this.onDragStart(evt);
      },

      // Handle drag end
      onEnd: (evt) => {
        this.onDragEnd(evt);
      },

      // Handle element move
      onMove: (evt) => {
        return this.onDragMove(evt);
      },

      // Handle order change
      onUpdate: (evt) => {
        this.onOrderChange(evt);
      }
    });

    console.log('Drag and drop initialized for keyframe gallery');
  }

  onDragStart(evt) {
    const keyframeId = evt.item.dataset.keyframeId;
    console.log('Drag started:', keyframeId);

    // Add visual feedback
    this.gallery.classList.add('dragging');

    // Hide scrub controls if any are visible
    const allScrubControls = this.gallery.querySelectorAll('.scrub-controls');
    allScrubControls.forEach(control => {
      control.style.display = 'none';
    });

    this.eventBus.emit('keyframe:dragStart', {
      keyframeId: keyframeId,
      oldIndex: evt.oldIndex
    });
  }

  onDragEnd(evt) {
    const keyframeId = evt.item.dataset.keyframeId;
    console.log('Drag ended:', keyframeId);

    // Remove visual feedback
    this.gallery.classList.remove('dragging');

    this.eventBus.emit('keyframe:dragEnd', {
      keyframeId: keyframeId,
      oldIndex: evt.oldIndex,
      newIndex: evt.newIndex
    });
  }

  onDragMove(evt) {
    // Allow all moves by default
    return true;
  }

  onOrderChange(evt) {
    const keyframeId = evt.item.dataset.keyframeId;
    console.log('Order changed:', {
      keyframeId: keyframeId,
      oldIndex: evt.oldIndex,
      newIndex: evt.newIndex
    });

    // Add reorder animation to affected items
    this.animateReorder(evt);

    // Update internal order tracking
    this.updateInternalOrder();

    // Save the new order
    this.saveKeyframeOrder();

    this.eventBus.emit('keyframe:orderChanged', {
      keyframeId: keyframeId,
      oldIndex: evt.oldIndex,
      newIndex: evt.newIndex,
      newOrder: this.getCurrentOrder()
    });
  }

  animateReorder(evt) {
    // Add animation to the moved item and nearby items
    const movedItem = evt.item;
    const startIndex = Math.min(evt.oldIndex, evt.newIndex);
    const endIndex = Math.max(evt.oldIndex, evt.newIndex);

    const galleryItems = Array.from(this.gallery.children);

    // Animate affected items
    for (let i = startIndex; i <= endIndex; i++) {
      const item = galleryItems[i];
      if (item) {
        item.classList.add('reorder-animation');
        setTimeout(() => {
          item.classList.remove('reorder-animation');
        }, 300);
      }
    }
  }

  updateInternalOrder() {
    // Update the index in frame metadata to match new DOM order
    const galleryItems = Array.from(this.gallery.children);
    galleryItems.forEach((item, index) => {
      const keyframeId = item.dataset.keyframeId;
      const metadata = this.frameMetadata.get(keyframeId);
      if (metadata) {
        metadata.index = index;
      }
    });
  }

  getCurrentOrder() {
    return Array.from(this.gallery.children).map((item, index) => {
      const keyframeId = item.dataset.keyframeId;
      const keyframe = this.keyframes.get(keyframeId);
      return {
        id: keyframeId,
        filename: keyframe?.filename || item.dataset.filename, // Keep filename for backwards compatibility
        index: index,
        title: this.keyframeNames.get(keyframeId) || `Keyframe ${index + 1}`
      };
    });
  }

  async saveKeyframeOrder() {
    const newOrder = this.getCurrentOrder();

    // Save to backend if we have a project ID
    if (this.currentProjectId) {
      try {
        const response = await fetch(`/api/projects/${this.currentProjectId}/keyframe-order`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            keyframeOrder: newOrder
          })
        });

        if (!response.ok) {
          throw new Error(`Failed to save order: ${response.statusText}`);
        }

        const result = await response.json();
        console.log('Keyframe order saved to project:', result.message);

      } catch (error) {
        console.error('Error saving keyframe order:', error);
        // Continue anyway - the UI order is still updated
      }
    }

    // Emit event that other parts of the app can listen to
    this.eventBus.emit('keyframe:orderSaved', {
      order: newOrder,
      projectId: this.currentProjectId,
      timestamp: new Date().toISOString()
    });

    console.log('Keyframe order updated:', newOrder);
  }

  setKeyframeNotes(keyframeId, notes) {
    this.keyframeNotes.set(keyframeId, notes);
  }

  getKeyframeNotes(keyframeId) {
    return this.keyframeNotes.get(keyframeId) || '';
  }

  getAllKeyframes() {
    const galleryItems = Array.from(this.gallery?.children || []);
    return galleryItems.map(item => {
      const keyframeId = item.dataset.keyframeId;
      const keyframe = this.keyframes.get(keyframeId);
      const metadata = this.frameMetadata.get(keyframeId);

      return {
        id: keyframeId,
        filename: keyframe?.filename || item.dataset.filename,
        url: item.querySelector('.keyframe-image')?.src,
        title: this.keyframeNames.get(keyframeId),
        notes: this.keyframeNotes.get(keyframeId),
        metadata: metadata
      };
    });
  }
}
