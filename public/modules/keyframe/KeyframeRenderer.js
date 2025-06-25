/**
 * KeyframeRenderer - Handles DOM creation and rendering of keyframe items
 * Focused on UI generation and basic event binding
 */
export class KeyframeRenderer {
  constructor(eventBus, storage) {
    this.eventBus = eventBus;
    this.storage = storage;
    this.gallery = null;
    this.frameCount = null;
    this.sectionTitle = null;
  }

  initializeElements() {
    this.gallery = document.getElementById('gallery');
    this.frameCount = document.getElementById('frameCount');
    this.sectionTitle = document.getElementById('sectionTitle');
  }

  createKeyframeItem(keyframe, displayPosition) {
    // Ensure keyframe has a unique ID
    keyframe = this.storage.ensureKeyframeId(keyframe);

    const item = document.createElement('div');
    item.className = 'keyframe-item';
    item.dataset.keyframeId = keyframe.id;
    item.dataset.filename = keyframe.filename;

    // Generate default name based on display position
    const defaultName = `Keyframe ${displayPosition}`;
    if (!this.storage.keyframeNames.has(keyframe.id)) {
      this.storage.keyframeNames.set(keyframe.id, defaultName);
    }
    const currentName = this.storage.keyframeNames.get(keyframe.id);

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
      const customName = this.storage.keyframeNames.get(keyframe.id) || 'Keyframe';
      this.eventBus.emit('modal:openRequested', {
        url: keyframe.url,
        title: customName,
        id: keyframe.id,
        filename: keyframe.filename
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
        this.eventBus.emit('keyframe:navigate', { keyframeId, direction });
      });
    });

    // Handle title input changes
    titleInput.addEventListener('blur', (e) => {
      const galleryItems = Array.from(this.gallery.children);
      const currentPosition = galleryItems.indexOf(item) + 1;
      const newName = e.target.value.trim() || `Keyframe ${currentPosition}`;
      this.storage.keyframeNames.set(keyframe.id, newName);
      e.target.value = newName;

      viewBtn.dataset.title = newName;
      image.alt = newName;

      this.eventBus.emit('keyframe:titleChanged', {
        id: keyframe.id,
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
      this.eventBus.emit('keyframe:download', keyframe.id);
    });

    viewBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const customName = this.storage.keyframeNames.get(keyframe.id) || 'Keyframe';
      this.eventBus.emit('modal:openRequested', {
        url: keyframe.url,
        title: customName,
        id: keyframe.id,
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
      keyframe = this.storage.ensureKeyframeId(keyframe);
      this.storage.storeKeyframe(keyframe, index, projectInfo);

      const item = this.createKeyframeItem(keyframe, index + 1);
      this.gallery.appendChild(item);
    });

    this.eventBus.emit('keyframes:displayed', {
      count: keyframes.length,
      metadata: this.storage.frameMetadata
    });
  }

  updateFrameCount() {
    if (this.frameCount && this.gallery) {
      const newCount = this.gallery.children.length;
      this.frameCount.textContent = `${newCount} frames`;
    }
  }

  insertKeyframeAfter(newKeyframe, afterIndex) {
    // Ensure the new keyframe has a unique ID
    newKeyframe = this.storage.ensureKeyframeId(newKeyframe);

    // Create the new keyframe item
    const newItem = this.createKeyframeItem(newKeyframe, afterIndex + 2);

    // Store keyframe data and metadata
    this.storage.storeKeyframe(newKeyframe, afterIndex + 1);

    // Insert into gallery after the current item
    const galleryItems = Array.from(this.gallery.children);
    const afterItem = galleryItems[afterIndex];

    if (afterItem && afterItem.nextSibling) {
      this.gallery.insertBefore(newItem, afterItem.nextSibling);
    } else {
      this.gallery.appendChild(newItem);
    }

    // Update frame count
    this.updateFrameCount();

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

    return newItem;
  }

  findKeyframeItem(keyframeId) {
    return this.gallery.querySelector(`[data-keyframe-id="${keyframeId}"]`);
  }

  getAllKeyframeItems() {
    return Array.from(this.gallery?.children || []);
  }
}
