/**
 * KeyframeDragDrop - Handles drag and drop reordering of keyframes
 * Manages SortableJS integration and order persistence
 */
export class KeyframeDragDrop {
  constructor(eventBus, storage, renderer) {
    this.eventBus = eventBus;
    this.storage = storage;
    this.renderer = renderer;
    this.sortableInstance = null;
    this.bindEvents();
  }

  bindEvents() {
    this.eventBus.on('dragdrop:disable', () => {
      this.disable();
    });

    this.eventBus.on('dragdrop:enable', () => {
      this.enable();
    });

    this.eventBus.on('dragdrop:reinitialize', () => {
      this.initialize();
    });

    this.eventBus.on('keyframes:displayed', () => {
      this.initialize();
    });
  }

  initialize() {
    if (!this.renderer.gallery || typeof Sortable === 'undefined') {
      console.warn('Gallery element or SortableJS not available');
      return;
    }

    // Destroy existing instance if it exists
    if (this.sortableInstance) {
      this.sortableInstance.destroy();
    }

    // Initialize SortableJS
    this.sortableInstance = Sortable.create(this.renderer.gallery, {
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

  disable() {
    if (this.sortableInstance) {
      this.sortableInstance.option('disabled', true);
    }
  }

  enable() {
    if (this.sortableInstance) {
      this.sortableInstance.option('disabled', false);
    }
  }

  destroy() {
    if (this.sortableInstance) {
      this.sortableInstance.destroy();
      this.sortableInstance = null;
    }
  }

  onDragStart(evt) {
    const keyframeId = evt.item.dataset.keyframeId;
    console.log('Drag started:', keyframeId);

    // Add visual feedback
    this.renderer.gallery.classList.add('dragging');

    // Hide scrub controls if any are visible
    const allScrubControls = this.renderer.gallery.querySelectorAll('.scrub-controls');
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
    this.renderer.gallery.classList.remove('dragging');

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
    const galleryItems = this.renderer.getAllKeyframeItems();
    this.storage.updateInternalOrder(galleryItems);

    // Save the new order
    this.saveKeyframeOrder();

    this.eventBus.emit('keyframe:orderChanged', {
      keyframeId: keyframeId,
      oldIndex: evt.oldIndex,
      newIndex: evt.newIndex,
      newOrder: this.storage.getCurrentOrder(galleryItems)
    });
  }

  animateReorder(evt) {
    // Add animation to the moved item and nearby items
    const movedItem = evt.item;
    const startIndex = Math.min(evt.oldIndex, evt.newIndex);
    const endIndex = Math.max(evt.oldIndex, evt.newIndex);

    const galleryItems = this.renderer.getAllKeyframeItems();

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

  async saveKeyframeOrder() {
    const galleryItems = this.renderer.getAllKeyframeItems();
    const result = await this.storage.saveKeyframeOrder(galleryItems);

    // Emit event that other parts of the app can listen to
    this.eventBus.emit('keyframe:orderSaved', {
      order: result.order,
      projectId: this.storage.currentProjectId,
      timestamp: new Date().toISOString(),
      success: result.success,
      error: result.error
    });

    if (result.success) {
      console.log('Keyframe order updated:', result.order);
    } else {
      console.error('Failed to save keyframe order:', result.error);
    }
  }
}
