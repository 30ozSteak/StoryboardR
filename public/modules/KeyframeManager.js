/**
 * KeyframeManager - Handles keyframe creation, display, and interactions
 * Separated from other concerns for clean architecture
 */
export class KeyframeManager {
  constructor(eventBus) {
    this.eventBus = eventBus;
    this.gallery = null;
    this.frameMetadata = new Map();
    this.keyframeNames = new Map();
    this.keyframeNotes = new Map();

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

  createKeyframeItem(keyframe, index) {
    const item = document.createElement('div');
    item.className = 'keyframe-item';
    item.dataset.filename = keyframe.filename;

    // Generate default name and store it
    const galleryItems = Array.from(this.gallery.children);
    const currentPosition = galleryItems.length + 1;
    const defaultName = `Keyframe ${currentPosition}`;
    if (!this.keyframeNames.has(keyframe.filename)) {
      this.keyframeNames.set(keyframe.filename, defaultName);
    }
    const currentName = this.keyframeNames.get(keyframe.filename);

    item.innerHTML = `
            <div class="keyframe-container">
                <img src="${keyframe.url}" alt="${currentName}" class="keyframe-image" loading="lazy" />
                <div class="selection-indicator">
                    <i class="fas fa-circle"></i>
                </div>
                <div class="notes-indicator hidden">
                    <i class="fas fa-sticky-note"></i>
                </div>
            </div>
            <div class="keyframe-info">
                <input type="text" class="keyframe-title-input" value="${currentName}" data-filename="${keyframe.filename}" maxlength="50" />
                <div class="keyframe-notes hidden">
                    <div class="notes-content"></div>
                </div>
                <div class="keyframe-actions">
                    <button class="keyframe-btn primary download-btn" data-url="${keyframe.url}" data-filename="${keyframe.filename}">
                        <i class="fas fa-download"></i>
                        Download
                    </button>
                    <button class="keyframe-btn view-btn" data-url="${keyframe.url}" data-title="${currentName}">
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

    // Selection toggle on item click
    item.addEventListener('click', (e) => {
      if (e.target.closest('.keyframe-btn') || e.target.closest('.keyframe-title-input')) {
        return;
      }
      this.eventBus.emit('selection:toggle', keyframe.filename);
    });

    // Handle title input changes
    titleInput.addEventListener('blur', (e) => {
      const galleryItems = Array.from(this.gallery.children);
      const currentIndex = galleryItems.indexOf(item) + 1;
      const newName = e.target.value.trim() || `Keyframe ${currentIndex}`;
      this.keyframeNames.set(keyframe.filename, newName);
      e.target.value = newName;

      viewBtn.dataset.title = newName;
      image.alt = newName;

      this.eventBus.emit('keyframe:titleChanged', {
        filename: keyframe.filename,
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
      this.downloadSingleKeyframe(keyframe.filename);
    });

    viewBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const customName = this.keyframeNames.get(keyframe.filename) || 'Keyframe';
      this.eventBus.emit('modal:openRequested', {
        url: keyframe.url,
        title: customName,
        filename: keyframe.filename
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
      // Store frame metadata
      this.frameMetadata.set(keyframe.filename, {
        timestamp: keyframe.timestamp || 0,
        index: keyframe.index || index,
        sessionId: projectInfo?.sessionId
      });

      const item = this.createKeyframeItem(keyframe, index + 1);
      this.gallery.appendChild(item);
    });

    this.eventBus.emit('keyframes:displayed', {
      count: keyframes.length,
      metadata: this.frameMetadata
    });
  }

  handleFrameNavigation(data) {
    const { direction, currentFrame } = data;
    const allItems = Array.from(this.gallery.children);
    const currentIndex = allItems.findIndex(item =>
      item.dataset.filename === currentFrame.filename
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
      const filename = targetItem.dataset.filename;
      const title = this.keyframeNames.get(filename) || `Frame ${targetIndex + 1}`;

      this.eventBus.emit('modal:openRequested', {
        url: img.src,
        title: title,
        filename: filename
      });
    }
  }

  updateNavigationButtonStates(currentImage) {
    if (!currentImage) return;

    const allItems = Array.from(this.gallery.children);
    const currentIndex = allItems.findIndex(item =>
      item.dataset.filename === currentImage.filename
    );

    this.eventBus.emit('modal:navigationStateUpdate', {
      canGoPrevious: allItems.length > 1,
      canGoNext: allItems.length > 1,
      currentIndex: currentIndex,
      totalFrames: allItems.length
    });
  }

  downloadSingleKeyframe(filename) {
    const item = this.gallery.querySelector(`[data-filename="${filename}"]`);
    if (!item) return;

    const img = item.querySelector('img');
    const customName = this.keyframeNames.get(filename) || filename;
    const notes = this.keyframeNotes.get(filename);

    this.downloadImageWithCustomName(img.src, filename, customName, notes);
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
    const customName = this.keyframeNames.get(imageData.filename) || imageData.title;
    const notes = this.keyframeNotes.get(imageData.filename);
    this.downloadImageWithCustomName(imageData.url, imageData.filename, customName, notes);
  }

  // Public API methods
  getKeyframeName(filename) {
    return this.keyframeNames.get(filename);
  }

  setKeyframeName(filename, name) {
    this.keyframeNames.set(filename, name);
    this.eventBus.emit('keyframe:titleChanged', { filename, title: name });
  }

  getKeyframeNote(filename) {
    return this.keyframeNotes.get(filename);
  }

  setKeyframeNote(filename, note) {
    this.keyframeNotes.set(filename, note);
    this.eventBus.emit('keyframe:noteChanged', { filename, note });
  }

  getFrameMetadata() {
    return this.frameMetadata;
  }

  getAllKeyframes() {
    return Array.from(this.gallery.children).map(item => ({
      filename: item.dataset.filename,
      url: item.querySelector('img').src,
      title: this.keyframeNames.get(item.dataset.filename),
      notes: this.keyframeNotes.get(item.dataset.filename),
      metadata: this.frameMetadata.get(item.dataset.filename)
    }));
  }
}
