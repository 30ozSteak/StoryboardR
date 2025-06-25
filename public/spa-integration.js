/**
 * SPA Integration with Existing Backend
 * Connects the new SPA with existing modules
 */

class SPAIntegration {
  constructor(spa) {
    this.spa = spa;
    this.modules = {};
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
