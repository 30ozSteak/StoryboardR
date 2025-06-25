/**
 * SPA Integration with Existing Backend
 * Connects the new SPA with existing modules
 */

// API Configuration
const API_CONFIG = {
  // Switch between local and remote API
  USE_REMOTE_API: false, // Set to false to use localStorage for now
  LOCAL_API_URL: 'http://localhost:3000',
  REMOTE_API_URL: 'https://storyboardr-api.imsteaky.repl.co', // Your actual Repl.it URL
  
  get BASE_URL() {
    return this.USE_REMOTE_API ? this.REMOTE_API_URL : this.LOCAL_API_URL;
  }
};

// Smart localStorage fallback system
class LocalStorageAPI {
  constructor() {
    this.STORYBOARDS_KEY = 'storyboardr_storyboards';
    this.EXTRACTIONS_KEY = 'storyboardr_extractions';
    this.initializeStorage();
  }

  initializeStorage() {
    if (!localStorage.getItem(this.STORYBOARDS_KEY)) {
      localStorage.setItem(this.STORYBOARDS_KEY, JSON.stringify({ storyboards: [] }));
    }
    if (!localStorage.getItem(this.EXTRACTIONS_KEY)) {
      localStorage.setItem(this.EXTRACTIONS_KEY, JSON.stringify({ extractions: [] }));
    }
  }

  // Storyboard methods
  async saveStoryboard(storyboardData) {
    const data = JSON.parse(localStorage.getItem(this.STORYBOARDS_KEY));
    const storyboard = {
      id: this.generateId(),
      name: storyboardData.name,
      description: storyboardData.description || '',
      videoSource: storyboardData.videoSource || '',
      keyframes: storyboardData.keyframes || [],
      metadata: storyboardData.metadata || {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    data.storyboards.push(storyboard);
    localStorage.setItem(this.STORYBOARDS_KEY, JSON.stringify(data));
    
    return {
      success: true,
      storyboard: {
        id: storyboard.id,
        name: storyboard.name,
        createdAt: storyboard.createdAt
      }
    };
  }

  async loadStoryboards() {
    const data = JSON.parse(localStorage.getItem(this.STORYBOARDS_KEY));
    return data.storyboards.map(sb => ({
      id: sb.id,
      name: sb.name,
      description: sb.description,
      videoSource: sb.videoSource,
      keyframeCount: sb.keyframes.length,
      createdAt: sb.createdAt,
      updatedAt: sb.updatedAt
    }));
  }

  async loadStoryboard(id) {
    const data = JSON.parse(localStorage.getItem(this.STORYBOARDS_KEY));
    return data.storyboards.find(sb => sb.id === id);
  }

  async updateStoryboard(id, updates) {
    const data = JSON.parse(localStorage.getItem(this.STORYBOARDS_KEY));
    const index = data.storyboards.findIndex(sb => sb.id === id);
    
    if (index === -1) {
      throw new Error('Storyboard not found');
    }
    
    data.storyboards[index] = {
      ...data.storyboards[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    localStorage.setItem(this.STORYBOARDS_KEY, JSON.stringify(data));
    return { success: true, storyboard: data.storyboards[index] };
  }

  async deleteStoryboard(id) {
    const data = JSON.parse(localStorage.getItem(this.STORYBOARDS_KEY));
    const initialLength = data.storyboards.length;
    data.storyboards = data.storyboards.filter(sb => sb.id !== id);
    
    if (data.storyboards.length === initialLength) {
      throw new Error('Storyboard not found');
    }
    
    localStorage.setItem(this.STORYBOARDS_KEY, JSON.stringify(data));
    return { success: true };
  }

  // Extraction methods
  async saveExtraction(extractionData) {
    const data = JSON.parse(localStorage.getItem(this.EXTRACTIONS_KEY));
    const extraction = {
      id: this.generateId(),
      videoUrl: extractionData.videoUrl,
      sessionId: extractionData.sessionId || this.generateId(),
      keyframes: extractionData.keyframes || [],
      settings: extractionData.settings || {},
      metadata: extractionData.metadata || {},
      createdAt: new Date().toISOString()
    };
    
    data.extractions.push(extraction);
    localStorage.setItem(this.EXTRACTIONS_KEY, JSON.stringify(data));
    
    return {
      success: true,
      extraction: {
        id: extraction.id,
        sessionId: extraction.sessionId,
        keyframeCount: extraction.keyframes.length,
        createdAt: extraction.createdAt
      }
    };
  }

  async loadExtractions() {
    const data = JSON.parse(localStorage.getItem(this.EXTRACTIONS_KEY));
    return data.extractions.map(ext => ({
      id: ext.id,
      videoUrl: ext.videoUrl,
      sessionId: ext.sessionId,
      keyframeCount: ext.keyframes.length,
      createdAt: ext.createdAt
    }));
  }

  async loadExtraction(id) {
    const data = JSON.parse(localStorage.getItem(this.EXTRACTIONS_KEY));
    return data.extractions.find(ext => ext.id === id);
  }

  async deleteExtraction(id) {
    const data = JSON.parse(localStorage.getItem(this.EXTRACTIONS_KEY));
    const initialLength = data.extractions.length;
    data.extractions = data.extractions.filter(ext => ext.id !== id);
    
    if (data.extractions.length === initialLength) {
      throw new Error('Extraction not found');
    }
    
    localStorage.setItem(this.EXTRACTIONS_KEY, JSON.stringify(data));
    return { success: true };
  }

  generateId() {
    return 'local_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }
}

class SPAIntegration {
  constructor(spa) {
    this.spa = spa;
    this.modules = {};
    this.localAPI = new LocalStorageAPI();
    this.init();
  }

  async init() {
    try {
      // Load existing modules if available
      await this.loadExistingModules();

      // Setup API integration
      this.setupAPIIntegration();

      console.log('✅ SPA integration initialized');
    } catch (error) {
      console.error('❌ Error initializing SPA integration:', error);
    }
  }

  async loadExistingModules() {
    try {
      // Try to load existing modular components
      const modulePromises = [
        this.loadModule('./modules/keyframe/KeyframeManager.js', 'KeyframeManager'),
        this.loadModule('./modules/video/VideoProcessor.js', 'VideoProcessor'),
        this.loadModule('./modules/drawing/DrawingModule.js', 'DrawingModule'),
        this.loadModule('./modules/core/EventBus.js', 'EventBus'),
        this.loadModule('./modules/modal/ModalManager.js', 'ModalManager')
      ];

      const results = await Promise.allSettled(modulePromises);

      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          console.log(`📦 Loaded module: ${result.value.name}`);
        } else {
          console.warn(`⚠️ Could not load module ${index}:`, result.reason);
        }
      });

    } catch (error) {
      console.warn('⚠️ Some modules could not be loaded, SPA will work with limited functionality');
    }
  }

  async loadModule(path, className) {
    try {
      const module = await import(path);
      const ModuleClass = module[className];

      if (ModuleClass) {
        this.modules[className] = ModuleClass;
        return { name: className, module: ModuleClass };
      } else {
        throw new Error(`Class ${className} not found in module`);
      }
    } catch (error) {
      throw new Error(`Failed to load ${className}: ${error.message}`);
    }
  }

  setupAPIIntegration() {
    // Project API integration
    this.setupProjectAPI();

    // Video processing integration
    this.setupVideoAPI();

    // Keyframe management integration
    this.setupKeyframeAPI();

    // Storyboard API integration
    this.setupStoryboardAPI();

    // Extraction API integration
    this.setupExtractionAPI();
  }

  setupProjectAPI() {
    // Extend SPA with project management methods
    this.spa.loadProjects = async () => {
      try {
        const response = await fetch('/api/projects');
        const data = await response.json();

        if (data.projects && data.projects.length > 0) {
          this.spa.renderProjects(data.projects);
          document.getElementById('emptyState')?.style?.setProperty('display', 'none');
        } else {
          document.getElementById('emptyState')?.style?.setProperty('display', 'block');
        }
      } catch (error) {
        console.error('Error loading projects:', error);
        document.getElementById('emptyState')?.style?.setProperty('display', 'block');
      }
    };

    this.spa.createProject = async (projectData) => {
      try {
        const response = await fetch('/api/projects', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(projectData)
        });

        if (response.ok) {
          const project = await response.json();
          this.spa.showNotification('Project created successfully!', 'success');
          this.spa.navigate('story', project.id);
          return project;
        } else {
          throw new Error('Failed to create project');
        }
      } catch (error) {
        console.error('Error creating project:', error);
        this.spa.showNotification('Failed to create project', 'error');
      }
    };

    this.spa.deleteProject = async (projectId) => {
      try {
        const response = await fetch(`/api/projects/${projectId}`, {
          method: 'DELETE'
        });

        if (response.ok) {
          this.spa.showNotification('Project deleted successfully!', 'success');
          this.spa.loadProjects(); // Refresh projects list
        } else {
          throw new Error('Failed to delete project');
        }
      } catch (error) {
        console.error('Error deleting project:', error);
        this.spa.showNotification('Failed to delete project', 'error');
      }
    };
  }

  setupVideoAPI() {
    this.spa.extractKeyframes = async (videoData) => {
      try {
        this.spa.showNotification('Starting keyframe extraction...', 'info');

        const formData = new FormData();

        if (videoData.file) {
          formData.append('video', videoData.file);
        } else if (videoData.url) {
          formData.append('url', videoData.url);
        }

        // Add settings
        formData.append('interval', videoData.interval || 1);
        formData.append('maxFrames', videoData.maxFrames || 50);
        formData.append('quality', videoData.quality || 'medium');

        const response = await fetch('/api/video/extract', {
          method: 'POST',
          body: formData
        });

        if (response.ok) {
          const result = await response.json();
          this.spa.showNotification('Keyframes extracted successfully!', 'success');
          this.spa.displayExtractionResults(result);
          return result;
        } else {
          throw new Error('Failed to extract keyframes');
        }
      } catch (error) {
        console.error('Error extracting keyframes:', error);
        this.spa.showNotification('Failed to extract keyframes', 'error');
      }
    };

    this.spa.displayExtractionResults = (results) => {
      const resultsContainer = document.getElementById('extractionResults');
      const keyframesGrid = document.getElementById('keyframesGrid');

      if (!resultsContainer || !keyframesGrid) return;

      // Display keyframes
      keyframesGrid.innerHTML = results.keyframes.map((keyframe, index) => `
        <div class="keyframe-item">
          <img src="${keyframe.url}" alt="Keyframe ${index + 1}" />
          <div class="keyframe-info">
            <span>Frame ${index + 1}</span>
            <span>${keyframe.timestamp}s</span>
          </div>
        </div>
      `).join('');

      resultsContainer.style.display = 'block';

      // Scroll to results
      resultsContainer.scrollIntoView({ behavior: 'smooth' });
    };
  }

  setupKeyframeAPI() {
    // Initialize keyframe management if module is available
    if (this.modules.KeyframeManager) {
      this.spa.initializeKeyframeManager = () => {
        try {
          const keyframeManager = new this.modules.KeyframeManager();
          this.spa.keyframeManager = keyframeManager;
          console.log('✅ KeyframeManager initialized in SPA');
        } catch (error) {
          console.error('❌ Error initializing KeyframeManager:', error);
        }
      };
    }

    // Add keyframe operations
    this.spa.saveKeyframes = async (keyframes, projectId) => {
      try {
        const response = await fetch(`/api/projects/${projectId}/keyframes`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ keyframes })
        });

        if (response.ok) {
          this.spa.showNotification('Keyframes saved successfully!', 'success');
        } else {
          throw new Error('Failed to save keyframes');
        }
      } catch (error) {
        console.error('Error saving keyframes:', error);
        this.spa.showNotification('Failed to save keyframes', 'error');
      }
    };
  }  setupStoryboardAPI() {
    // Save storyboard with localStorage fallback
    this.spa.saveStoryboard = async (storyboardData) => {
      try {
        // Use localStorage for now (faster and more reliable)
        const result = await this.localAPI.saveStoryboard(storyboardData);
        this.spa.showNotification('Storyboard saved locally!', 'success');
        return result.storyboard;
      } catch (error) {
        console.error('Error saving storyboard:', error);
        this.spa.showNotification(`Failed to save storyboard: ${error.message}`, 'error');
        throw error;
      }
    };

    // Load all storyboards from localStorage
    this.spa.loadStoryboards = async () => {
      try {
        const storyboards = await this.localAPI.loadStoryboards();
        return storyboards;
      } catch (error) {
        console.error('Error loading storyboards:', error);
        this.spa.showNotification('Failed to load storyboards', 'error');
        return [];
      }
    };

    // Load specific storyboard from localStorage
    this.spa.loadStoryboard = async (storyboardId) => {
      try {
        const storyboard = await this.localAPI.loadStoryboard(storyboardId);
        if (!storyboard) {
          throw new Error('Storyboard not found');
        }
        return storyboard;
      } catch (error) {
        console.error('Error loading storyboard:', error);
        this.spa.showNotification(`Failed to load storyboard: ${error.message}`, 'error');
        throw error;
      }
    };

    // Update storyboard in localStorage
    this.spa.updateStoryboard = async (storyboardId, updates) => {
      try {
        const result = await this.localAPI.updateStoryboard(storyboardId, updates);
        this.spa.showNotification('Storyboard updated successfully!', 'success');
        return result.storyboard;
      } catch (error) {
        console.error('Error updating storyboard:', error);
        this.spa.showNotification(`Failed to update storyboard: ${error.message}`, 'error');
        throw error;
      }
    };

    // Delete storyboard from localStorage
    this.spa.deleteStoryboard = async (storyboardId) => {
      try {
        await this.localAPI.deleteStoryboard(storyboardId);
        this.spa.showNotification('Storyboard deleted successfully!', 'success');
        return true;
      } catch (error) {
        console.error('Error deleting storyboard:', error);
        this.spa.showNotification(`Failed to delete storyboard: ${error.message}`, 'error');
        return false;
      }
    };
  }  setupExtractionAPI() {
    // Save extraction with localStorage
    this.spa.saveExtraction = async (extractionData) => {
      try {
        const result = await this.localAPI.saveExtraction(extractionData);
        this.spa.showNotification('Extraction saved locally!', 'success');
        return result.extraction;
      } catch (error) {
        console.error('Error saving extraction:', error);
        this.spa.showNotification(`Failed to save extraction: ${error.message}`, 'error');
        throw error;
      }
    };

    // Load all extractions from localStorage
    this.spa.loadExtractions = async () => {
      try {
        const extractions = await this.localAPI.loadExtractions();
        return extractions;
      } catch (error) {
        console.error('Error loading extractions:', error);
        this.spa.showNotification('Failed to load extractions', 'error');
        return [];
      }
    };

    // Load specific extraction from localStorage
    this.spa.loadExtraction = async (extractionId) => {
      try {
        const extraction = await this.localAPI.loadExtraction(extractionId);
        if (!extraction) {
          throw new Error('Extraction not found');
        }
        return extraction;
      } catch (error) {
        console.error('Error loading extraction:', error);
        this.spa.showNotification(`Failed to load extraction: ${error.message}`, 'error');
        throw error;
      }
    };

    // Delete extraction from localStorage
    this.spa.deleteExtraction = async (extractionId) => {
      try {
        await this.localAPI.deleteExtraction(extractionId);
        this.spa.showNotification('Extraction deleted successfully!', 'success');
        return true;
      } catch (error) {
        console.error('Error deleting extraction:', error);
        this.spa.showNotification(`Failed to delete extraction: ${error.message}`, 'error');
        return false;
      }
    };

    // Revisit extraction (load keyframes back into interface)
    this.spa.revisitExtraction = async (extractionId) => {
      try {
        const extraction = await this.spa.loadExtraction(extractionId);
        if (extraction) {
          // Navigate to extract view and load the keyframes
          this.spa.navigate('extract');
          
          // Wait for view to load, then populate with extraction data
          setTimeout(() => {
            this.spa.displayExtractionResults(extraction);
            this.spa.showNotification('Extraction loaded successfully!', 'success');
          }, 500);
          
          return extraction;
        }
      } catch (error) {
        console.error('Error revisiting extraction:', error);
        // Error already handled in loadExtraction
      }
    };
  }

  // Helper method to check if backend APIs are available
  async checkAPIHealth() {
    try {
      const response = await fetch('/health');
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  // Method to gracefully handle missing backend
  enableOfflineMode() {
    console.warn('🔄 Backend not available, enabling offline mode');

    // Override methods to work with localStorage
    this.spa.loadProjects = () => {
      const projects = JSON.parse(localStorage.getItem('spa-projects') || '[]');
      if (projects.length > 0) {
        this.spa.renderProjects(projects);
        document.getElementById('emptyState')?.style?.setProperty('display', 'none');
      } else {
        document.getElementById('emptyState')?.style?.setProperty('display', 'block');
      }
    };

    this.spa.createProject = (projectData) => {
      const projects = JSON.parse(localStorage.getItem('spa-projects') || '[]');
      const newProject = {
        id: Date.now().toString(),
        ...projectData,
        created: new Date().toISOString()
      };

      projects.push(newProject);
      localStorage.setItem('spa-projects', JSON.stringify(projects));

      this.spa.showNotification('Project created (offline mode)', 'success');
      this.spa.navigate('story', newProject.id);
      return newProject;
    };

    // Show offline indicator
    this.spa.showNotification('Running in offline mode - limited functionality', 'info');
  }
}

// Auto-initialize when SPA is ready
document.addEventListener('DOMContentLoaded', () => {
  // Wait for SPA to initialize, then add integration
  setTimeout(() => {
    if (window.spa) {
      window.spaIntegration = new SPAIntegration(window.spa);
    }
  }, 1000);
});

export { SPAIntegration };
