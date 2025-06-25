/**
 * KeyframeManager - Main coordinator for keyframe functionality
 * Orchestrates the renderer, storage, scrubber, and drag-drop modules
 */
import { KeyframeRenderer } from './KeyframeRenderer.js';
import { KeyframeStorage } from './KeyframeStorage.js';
import { KeyframeScrubber } from './KeyframeScrubber.js';
import { KeyframeDragDrop } from './KeyframeDragDrop.js';

export class KeyframeManager {
  constructor(eventBus) {
    this.eventBus = eventBus;

    // Initialize modules
    this.storage = new KeyframeStorage();
    this.renderer = new KeyframeRenderer(eventBus, this.storage);
    this.scrubber = new KeyframeScrubber(eventBus, this.storage, this.renderer);
    this.dragDrop = new KeyframeDragDrop(eventBus, this.storage, this.renderer);

    this.initializeElements();
    this.bindEvents();
  }

  initializeElements() {
    this.renderer.initializeElements();
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

    this.eventBus.on('keyframe:download', (keyframeId) => {
      this.downloadSingleKeyframe(keyframeId);
    });
  }

  // Public API methods that delegate to appropriate modules
  displayKeyframes(keyframes, projectInfo = null) {
    this.storage.currentProjectId = projectInfo?.id || null;
    this.renderer.displayKeyframes(keyframes, projectInfo);
  }

  handleFrameNavigation(data) {
    const { direction, currentFrame } = data;
    const allItems = this.renderer.getAllKeyframeItems();
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
      const title = this.storage.getKeyframeName(keyframeId) || `Frame ${targetIndex + 1}`;
      const keyframe = this.storage.getKeyframe(keyframeId);

      this.eventBus.emit('modal:openRequested', {
        url: img.src,
        title: title,
        id: keyframeId,
        filename: keyframe?.filename
      });
    }
  }

  updateNavigationButtonStates(currentImage) {
    if (!currentImage) return;

    const allItems = this.renderer.getAllKeyframeItems();
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
    const item = this.renderer.findKeyframeItem(keyframeId);
    if (!item) return;

    const keyframe = this.storage.getKeyframe(keyframeId);
    if (!keyframe) return;

    const img = item.querySelector('img');
    const customName = this.storage.getKeyframeName(keyframeId) || keyframe.filename;
    const notes = this.storage.getKeyframeNotes(keyframeId);

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
    const customName = this.storage.getKeyframeName(keyframeId) || imageData.title;
    const notes = this.storage.getKeyframeNotes(keyframeId);
    this.downloadImageWithCustomName(imageData.url, imageData.filename, customName, notes);
  }

  // Storage proxy methods for backward compatibility
  setKeyframeNotes(keyframeId, notes) {
    this.storage.setKeyframeNotes(keyframeId, notes);
  }

  getKeyframeNotes(keyframeId) {
    return this.storage.getKeyframeNotes(keyframeId);
  }

  getAllKeyframes() {
    const galleryItems = this.renderer.getAllKeyframeItems();
    return this.storage.getAllKeyframes(galleryItems);
  }

  // Cleanup method
  destroy() {
    this.dragDrop.destroy();
    this.storage.clear();
  }
}
