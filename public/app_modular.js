/**
 * Main Application - Clean orchestrator for all modules
 * This file should stay under 200 lines by delegating to modules
 */

import { EventBus } from './modules/EventBus.js';
import { DrawingModule } from './modules/DrawingModule.js';
import { ModalManager } from './modules/ModalManager.js';
import { VideoProcessor } from './modules/VideoProcessor.js';
import { KeyframeManager } from './modules/KeyframeManager.js';
import { ThemeManager } from './modules/ThemeManager.js';

class VideoKeyframeExtractor {
  constructor() {
    // Create event bus for inter-module communication
    this.eventBus = new EventBus();

    // Initialize modules
    this.themeManager = new ThemeManager();
    this.drawingModule = new DrawingModule();
    this.modalManager = new ModalManager(this.eventBus);
    this.videoProcessor = new VideoProcessor(this.eventBus);
    this.keyframeManager = new KeyframeManager(this.eventBus);

    // App state
    this.currentProject = null;
    this.isHandlingCancellation = false; // Guard against recursive cancellation

    this.initializeElements();
    this.bindEvents();
    this.setupEventHandlers();
    this.initialize();
  }

  initializeElements() {
    // UI sections
    this.uploadSection = document.getElementById('uploadSection');
    this.loadingSection = document.getElementById('loadingSection');
    this.resultsSection = document.getElementById('resultsSection');
    this.errorSection = document.getElementById('errorSection');

    // UI controls
    this.backToProjectsBtn = document.getElementById('backToProjectsBtn');
    this.saveProjectBtn = document.getElementById('saveProjectBtn');
    this.newExtractionBtn = document.getElementById('newExtractionBtn');
    this.retryBtn = document.getElementById('retryBtn');

    // Loading elements
    this.loadingText = document.getElementById('loadingText');
    this.progressFill = document.getElementById('progressFill');
    this.progressPercentage = document.getElementById('progressPercentage');

    // Error elements
    this.errorMessage = document.getElementById('errorMessage');

    // Tab elements
    this.tabButtons = document.querySelectorAll('.tab-btn');
    this.tabContents = document.querySelectorAll('.tab-content');
  }

  bindEvents() {
    // App-level button events
    this.backToProjectsBtn?.addEventListener('click', () => {
      window.location.href = '/dashboard.html';
    });

    this.saveProjectBtn?.addEventListener('click', () => this.saveProject());
    this.newExtractionBtn?.addEventListener('click', () => this.resetToUpload());
    this.retryBtn?.addEventListener('click', () => this.resetToUpload());

    // Tab switching events
    this.tabButtons.forEach(button => {
      button.addEventListener('click', () => {
        const tabName = button.dataset.tab;
        this.switchTab(tabName);
      });
    });
  }

  setupEventHandlers() {
    // Video processing events
    this.eventBus.on('processing:started', (data) => {
      this.showLoadingSection();
      this.updateLoadingText('Initializing video processing...');
    });

    this.eventBus.on('processing:progress', (data) => {
      this.updateProgress(data);
    });

    this.eventBus.on('processing:completed', (data) => {
      this.displayResults(data);
    });

    this.eventBus.on('processing:error', (data) => {
      this.showError(data.error);
    });

    this.eventBus.on('processing:cancelled', () => {
      // Add guard to prevent infinite loops
      if (!this.isHandlingCancellation) {
        this.isHandlingCancellation = true;
        try {
          this.resetToUpload();
        } finally {
          // Use timeout to reset flag to allow future cancellations
          setTimeout(() => {
            this.isHandlingCancellation = false;
          }, 100);
        }
      }
    });

    // Modal events
    this.eventBus.on('modal:openRequested', (data) => {
      this.modalManager.openModal(data.url, data.title, data.filename);
    });

    this.eventBus.on('modal:opened', (imageData) => {
      this.drawingModule.setCurrentKeyframe(imageData.filename);
    });

    // Keyframe events
    this.eventBus.on('keyframes:displayed', (data) => {
      this.modalManager.setFrameMetadata(data.metadata);
    });
  }

  initialize() {
    this.checkProjectLoad();
    this.initializeTheme();
    this.checkServerStatus();
  }

  async checkProjectLoad() {
    const urlParams = new URLSearchParams(window.location.search);
    const projectId = urlParams.get('project');

    if (projectId) {
      console.log(`Loading project from URL: ${projectId}`);
      await this.loadProject(projectId);
    }
  }

  async loadProject(projectId) {
    try {
      const response = await fetch(`/api/projects/${projectId}`);
      if (!response.ok) {
        throw new Error(`Failed to load project: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      // Validate API response structure
      if (!data.success) {
        throw new Error(data.error || 'API returned success: false');
      }

      const project = data.project;

      // Validate project data
      if (!project) {
        throw new Error('Project data is null or undefined');
      }

      if (!project.keyframes || !Array.isArray(project.keyframes)) {
        throw new Error('Project has invalid keyframes data');
      }

      this.currentProject = project;

      this.keyframeManager.displayKeyframes(project.keyframes, project);
      this.switchToResults();

    } catch (error) {
      console.error('Error loading project:', error);
      this.showError(`Failed to load project: ${error.message}`);
    }
  }

  displayResults(data) {
    if (data.keyframes && data.keyframes.length > 0) {
      this.keyframeManager.displayKeyframes(data.keyframes, {
        sessionId: this.videoProcessor.getCurrentSessionId()
      });
      this.switchToResults();
    } else {
      this.showError('No keyframes were extracted from the video');
    }
  }

  showLoadingSection() {
    this.hideAllSections();
    this.loadingSection?.classList.remove('hidden');
  }

  switchToResults() {
    this.hideAllSections();
    this.resultsSection?.classList.remove('hidden');
  }

  showError(message) {
    this.hideAllSections();
    if (this.errorMessage) {
      this.errorMessage.textContent = message;
    }
    this.errorSection?.classList.remove('hidden');
  }

  resetToUpload() {
    this.hideAllSections();
    this.uploadSection?.classList.remove('hidden');
    this.videoProcessor.reset();
    this.currentProject = null;
  }

  hideAllSections() {
    [this.uploadSection, this.loadingSection, this.resultsSection, this.errorSection]
      .forEach(section => section?.classList.add('hidden'));
  }

  updateLoadingText(text) {
    if (this.loadingText) {
      this.loadingText.textContent = text;
    }
  }

  updateProgress(data) {
    if (data.message) {
      this.updateLoadingText(data.message);
    }

    if (data.progress !== undefined) {
      const percentage = Math.round(data.progress);
      if (this.progressFill) {
        this.progressFill.style.width = `${percentage}%`;
      }
      if (this.progressPercentage) {
        this.progressPercentage.textContent = `${percentage}%`;
      }
    }
  }

  async saveProject() {
    if (!this.keyframeManager) return;

    try {
      const keyframes = this.keyframeManager.getAllKeyframes();

      // Create project data
      const projectData = {
        name: this.currentProject?.name || 'New Project',
        description: `Video project with ${keyframes.length} keyframes`,
        keyframes: keyframes.map(kf => ({
          filename: kf.filename,
          url: kf.url,
          timestamp: kf.metadata?.timestamp || 0,
          index: kf.metadata?.index || 0
        })),
        sessionId: this.videoProcessor.getCurrentSessionId()
      };

      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(projectData)
      });

      if (response.ok) {
        this.eventBus.emit('ui:showMessage', 'Project saved successfully!');
      } else {
        throw new Error('Failed to save project');
      }

    } catch (error) {
      console.error('Error saving project:', error);
      this.eventBus.emit('ui:showMessage', 'Failed to save project');
    }
  }

  initializeTheme() {
    // Basic theme initialization
    const theme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', theme);
  }

  async checkServerStatus() {
    try {
      const response = await fetch('/health');
      if (!response.ok) {
        console.warn('Server health check failed');
      } else {
        console.log('Server health check passed');
      }
    } catch (error) {
      console.warn('Could not connect to server:', error);
    }
  }

  switchTab(tabName) {
    // Remove active class from all tabs and contents
    this.tabButtons.forEach(btn => btn.classList.remove('active'));
    this.tabContents.forEach(content => content.classList.remove('active'));

    // Add active class to selected tab and content
    const selectedTab = document.querySelector(`[data-tab="${tabName}"]`);
    const selectedContent = document.getElementById(`${tabName}Tab`);

    if (selectedTab) selectedTab.classList.add('active');
    if (selectedContent) selectedContent.classList.add('active');
  }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.app = new VideoKeyframeExtractor();
});
