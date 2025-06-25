/**
 * KeyframeStorage - Handles data management and persistence for keyframes
 * Manages keyframe data, metadata, names, notes, and unique ID generation
 */
export class KeyframeStorage {
  constructor() {
    this.keyframes = new Map(); // Store keyframes by ID
    this.frameMetadata = new Map(); // Store metadata by ID
    this.keyframeNames = new Map(); // Store names by ID
    this.keyframeNotes = new Map(); // Store notes by ID
    this.currentProjectId = null; // Store current project ID for saving order
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

  // Store keyframe data and metadata
  storeKeyframe(keyframe, index, projectInfo = null) {
    // Store keyframe data by ID
    this.keyframes.set(keyframe.id, keyframe);

    // Store frame metadata by ID
    this.frameMetadata.set(keyframe.id, {
      timestamp: keyframe.timestamp || 0,
      originalIndex: keyframe.index || index,
      sessionId: projectInfo?.sessionId,
      filename: keyframe.filename
    });

    // Store project ID for saving order changes
    if (projectInfo?.id) {
      this.currentProjectId = projectInfo.id;
    }
  }

  // Get keyframe by ID
  getKeyframe(keyframeId) {
    return this.keyframes.get(keyframeId);
  }

  // Get keyframe metadata by ID
  getKeyframeMetadata(keyframeId) {
    return this.frameMetadata.get(keyframeId);
  }

  // Set/get keyframe names
  setKeyframeName(keyframeId, name) {
    this.keyframeNames.set(keyframeId, name);
  }

  getKeyframeName(keyframeId) {
    return this.keyframeNames.get(keyframeId);
  }

  // Set/get keyframe notes
  setKeyframeNotes(keyframeId, notes) {
    this.keyframeNotes.set(keyframeId, notes);
  }

  getKeyframeNotes(keyframeId) {
    return this.keyframeNotes.get(keyframeId) || '';
  }

  // Update keyframe metadata
  updateKeyframeMetadata(keyframeId, updates) {
    const existing = this.frameMetadata.get(keyframeId);
    if (existing) {
      this.frameMetadata.set(keyframeId, { ...existing, ...updates });
    }
  }

  // Get all keyframes in current order (requires gallery items)
  getAllKeyframes(galleryItems) {
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

  // Get current order for saving
  getCurrentOrder(galleryItems) {
    return galleryItems.map((item, index) => {
      const keyframeId = item.dataset.keyframeId;
      const keyframe = this.keyframes.get(keyframeId);
      return {
        id: keyframeId,
        filename: keyframe?.filename || item.dataset.filename,
        index: index,
        title: this.keyframeNames.get(keyframeId) || `Keyframe ${index + 1}`
      };
    });
  }

  // Update internal order tracking
  updateInternalOrder(galleryItems) {
    galleryItems.forEach((item, index) => {
      const keyframeId = item.dataset.keyframeId;
      const metadata = this.frameMetadata.get(keyframeId);
      if (metadata) {
        metadata.index = index;
      }
    });
  }

  // Save keyframe order to backend
  async saveKeyframeOrder(galleryItems) {
    const newOrder = this.getCurrentOrder(galleryItems);

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
        return { success: true, order: newOrder };

      } catch (error) {
        console.error('Error saving keyframe order:', error);
        return { success: false, error: error.message, order: newOrder };
      }
    }

    return { success: true, order: newOrder };
  }

  // Clear all stored data
  clear() {
    this.keyframes.clear();
    this.frameMetadata.clear();
    this.keyframeNames.clear();
    this.keyframeNotes.clear();
    this.currentProjectId = null;
  }

  // Get storage statistics
  getStats() {
    return {
      keyframesCount: this.keyframes.size,
      metadataCount: this.frameMetadata.size,
      namesCount: this.keyframeNames.size,
      notesCount: this.keyframeNotes.size,
      currentProjectId: this.currentProjectId
    };
  }
}
