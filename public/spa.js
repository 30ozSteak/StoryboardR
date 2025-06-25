/**
 * StoryboardR Single Page Application
 * Hash-based routing with vanilla JavaScript
 */

class StoryboardSPA {
  constructor() {
    this.routes = {
      'home': () => this.renderDashboard(),
      'editor': () => this.renderEditor(),
      'story': (id) => this.renderStory(id),
      'extract': () => this.renderExtractor(),
      'settings': () => this.renderSettings()
    };

    this.currentView = null;
    this.appContainer = null;
    this.modules = {};

    this.init();
  }

  async init() {
    console.log('🚀 Initializing StoryboardR SPA...');

    // Create the main app structure
    this.createAppStructure();

    // Initialize mouse gradient
    this.initializeMouseGradient();

    // Load core modules
    await this.loadModules();

    // Setup routing
    this.setupRouting();

    // Handle initial route
    this.handleInitialRoute();

    console.log('✅ SPA initialized successfully');
  }

  createAppStructure() {
    // Create main SPA container
    document.body.innerHTML = `
      <div id="spa-app" class="spa-container">
        <!-- Navigation -->
        <nav class="spa-nav" id="spaNav">
          <div class="nav-brand">
            <h1><a href="javascript:void(0)" onclick="window.spa.navigate('home')">StoryboardR</a></h1>
          </div>
          <div class="nav-links">
            <a href="javascript:void(0)" class="nav-link" data-route="home">
              <i class="fas fa-home"></i> Home
            </a>
            <a href="javascript:void(0)" class="nav-link" data-route="extract">
              <i class="fas fa-video"></i> Extract
            </a>
            <a href="javascript:void(0)" class="nav-link" data-route="editor">
              <i class="fas fa-edit"></i> Editor
            </a>
            <a href="javascript:void(0)" class="nav-link" data-route="settings">
              <i class="fas fa-cog"></i> Settings
            </a>
          </div>
        </nav>
        
        <!-- Main content area -->
        <main class="spa-main" id="spaMain">
          <div class="loading-view" id="loadingView">
            <div class="spinner"></div>
            <p>Loading...</p>
          </div>
        </main>
        
        <!-- Global modals container -->
        <div id="globalModals"></div>
        
        <!-- Footer -->
        <footer class="spa-footer">
          <div class="footer-content">
            <p>&copy; 2025 StoryboardR. See more at mistakes.party</p>
          </div>
        </footer>
      </div>
    `;

    this.appContainer = document.getElementById('spaMain');
    if (!this.appContainer) {
      console.error('❌ SPA Main container not found!');
      return;
    }

    console.log('✅ SPA structure created successfully');

    // Setup navigation after DOM is created
    setTimeout(() => {
      this.setupNavigation();
    }, 0);
  }

  setupNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    console.log(`🔗 Setting up navigation, found ${navLinks.length} nav links`);

    navLinks.forEach((link, index) => {
      const route = link.getAttribute('data-route');
      console.log(`🔗 Nav link ${index}: route="${route}", href="${link.href}"`);

      link.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const route = link.getAttribute('data-route');
        console.log(`🖱️ Nav link clicked: route="${route}"`);
        console.log(`🖱️ Link href: "${link.href}"`);
        console.log(`🖱️ Current hash before navigate: "${window.location.hash}"`);
        this.navigate(route);
      });
    });
  }

  setupRouting() {
    // Listen for hash changes
    window.addEventListener('hashchange', () => {
      this.handleRouteChange();
    });

    // Handle back/forward buttons
    window.addEventListener('popstate', () => {
      this.handleRouteChange();
    });

    // Prevent traditional navigation within SPA
    document.addEventListener('click', (e) => {
      const link = e.target.closest('a');
      if (link && link.href) {
        const url = new URL(link.href);

        // If it's a same-origin link, check if we need to intercept it
        if (url.origin === window.location.origin) {
          // Handle hash-based navigation (our SPA navigation)
          if (url.hash && url.pathname === window.location.pathname) {
            console.log('🔄 Hash-based navigation detected, letting it proceed naturally');
            return; // Let the hash change naturally, don't intercept
          }

          // Handle legacy pathname-based navigation, convert to SPA navigation
          if (url.pathname === '/extract') {
            e.preventDefault();
            console.log('🔄 Intercepted /extract link, using SPA navigation');
            this.navigate('extract');
            return;
          }
          if (url.pathname === '/dashboard') {
            e.preventDefault();
            console.log('🔄 Intercepted /dashboard link, using SPA navigation');
            this.navigate('home');
            return;
          }
          if (url.pathname === '/') {
            e.preventDefault();
            console.log('🔄 Intercepted / link, using SPA navigation');
            this.navigate('home');
            return;
          }
        }
      }
    });
  }

  handleInitialRoute() {
    const hash = window.location.hash;
    if (!hash || hash === '#') {
      this.navigate('home');
    } else {
      this.handleRouteChange();
    }
  }

  handleRouteChange() {
    const hash = window.location.hash.slice(1); // Remove #
    const [route, param] = hash.split('/');

    console.log(`🔄 Route change detected:`);
    console.log(`   Raw hash: "${window.location.hash}"`);
    console.log(`   Parsed hash: "${hash}"`);
    console.log(`   Parsed route: "${route}"`);
    console.log(`   Parsed param: "${param || 'none'}"`);
    console.log(`   Available routes:`, Object.keys(this.routes));
    console.log(`   Route exists:`, !!this.routes[route]);

    this.updateActiveNavLink(route);

    if (this.routes[route]) {
      console.log(`✅ Route "${route}" found, executing...`);
      this.showLoading();

      setTimeout(() => {
        if (param) {
          this.routes[route](param);
        } else {
          this.routes[route]();
        }
        this.hideLoading();
      }, 100); // Small delay for smooth transition
    } else {
      console.warn(`❌ Route not found: "${route}", redirecting to home`);
      console.warn(`   This usually means the route is not in:`, Object.keys(this.routes));
      this.navigate('home');
    }
  }

  navigate(route, param = null) {
    const newHash = param ? `#${route}/${param}` : `#${route}`;

    console.log(`🚀 SPA Navigate called: ${route}${param ? '/' + param : ''}`);
    console.log(`📍 Current hash: ${window.location.hash}`);
    console.log(`📍 New hash: ${newHash}`);
    console.log(`📍 Call stack:`, new Error().stack);

    if (window.location.hash !== newHash) {
      console.log(`📍 Setting hash from "${window.location.hash}" to "${newHash}"`);
      window.location.hash = newHash;
    } else {
      console.log(`📍 Hash already matches, manually triggering route change`);
      // If hash is the same, manually trigger route change
      this.handleRouteChange();
    }
  }

  updateActiveNavLink(activeRoute) {
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
      const route = link.getAttribute('data-route');
      if (route === activeRoute) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  }

  showLoading() {
    const loadingView = document.getElementById('loadingView');
    if (loadingView) {
      loadingView.style.display = 'flex';
    }
  }

  hideLoading() {
    const loadingView = document.getElementById('loadingView');
    if (loadingView) {
      loadingView.style.display = 'none';
    }
  }

  async loadModules() {
    try {
      // Load existing modules
      const { EventBus } = await import('./modules/core/EventBus.js');
      const { ModalManager } = await import('./modules/modal/ModalManager.js');

      this.modules.eventBus = new EventBus();
      this.modules.modalManager = new ModalManager();

      console.log('📦 Core modules loaded');
    } catch (error) {
      console.error('❌ Error loading modules:', error);
    }
  }

  // Route Handlers
  renderDashboard() {
    if (!this.appContainer) {
      console.error('❌ App container not available for renderDashboard');
      return;
    }

    this.currentView = 'home';
    document.title = 'StoryboardR - Dashboard';

    this.appContainer.innerHTML = `
      <div class="dashboard-view">
        <div class="container">
          <!-- Projects Dashboard -->
          <section class="projects-section" id="projectsSection">
            <div class="projects-header">
              <div class="projects-title-section">
                <h2>
                  <i class="fas fa-folder-open"></i>
                  My Projects
                </h2>
                <p>Create new projects or continue working on existing ones</p>
              </div>
              <button class="btn btn-primary" id="newProjectBtn">
                <i class="fas fa-plus"></i>
                New Project
              </button>
            </div>

            <!-- Projects Grid -->
            <div class="projects-grid" id="projectsGrid">
              <!-- Projects will be dynamically loaded -->
            </div>

            <!-- Empty State -->
            <div class="empty-state" id="emptyState">
              <div class="empty-state-content">
                <i class="fas fa-folder-plus"></i>
                <h3>No projects yet</h3>
                <p>Create your first project to get started with keyframe extraction</p>
              </div>
            </div>
          </section>
        </div>
      </div>
    `;

    this.initializeDashboard();
  }

  renderEditor() {
    if (!this.appContainer) {
      console.error('❌ App container not available for renderEditor');
      return;
    }

    this.currentView = 'editor';
    document.title = 'StoryboardR - Editor';

    this.appContainer.innerHTML = `
      <div class="editor-view">
        <div class="container">
          <div class="editor-header">
            <h2>
              <i class="fas fa-edit"></i>
              Storyboard Editor
            </h2>
            <div class="editor-actions">
              <button class="btn btn-secondary" onclick="window.spa.navigate('home')">
                <i class="fas fa-arrow-left"></i>
                Back to Dashboard
              </button>
              <button class="btn btn-primary" id="saveStoryboardBtn">
                <i class="fas fa-save"></i>
                Save Storyboard
              </button>
            </div>
          </div>
          
          <div class="editor-content">
            <div class="editor-toolbar">
              <button class="tool-btn" title="Add Frame">
                <i class="fas fa-plus"></i>
              </button>
              <button class="tool-btn" title="Delete Frame">
                <i class="fas fa-trash"></i>
              </button>
              <button class="tool-btn" title="Duplicate Frame">
                <i class="fas fa-copy"></i>
              </button>
              <button class="tool-btn" title="Export">
                <i class="fas fa-download"></i>
              </button>
            </div>
            
            <div class="storyboard-canvas" id="storyboardCanvas">
              <div class="frame-placeholder">
                <i class="fas fa-image"></i>
                <p>No frames yet. <button class="link-btn" onclick="window.spa.navigate('extract')">Extract from video</button> or create manually.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    this.initializeEditor();
  }

  renderStory(id) {
    if (!this.appContainer) {
      console.error('❌ App container not available for renderStory');
      return;
    }

    this.currentView = 'story';
    document.title = `StoryboardR - Story ${id}`;

    this.appContainer.innerHTML = `
      <div class="story-view">
        <div class="container">
          <div class="story-header">
            <button class="btn btn-secondary" onclick="window.spa.navigate('home')">
              <i class="fas fa-arrow-left"></i>
              Back to Projects
            </button>
            <h2>
              <i class="fas fa-film"></i>
              Story: ${id}
            </h2>
            <div class="story-actions">
              <button class="btn btn-primary" onclick="window.spa.navigate('editor')">
                <i class="fas fa-edit"></i>
                Edit Storyboard
              </button>
            </div>
          </div>
          
          <div class="story-content" id="storyContent">
            <div class="loading-story">
              <div class="spinner"></div>
              <p>Loading story...</p>
            </div>
          </div>
        </div>
      </div>
    `;

    this.loadStory(id);
  }

  renderExtractor() {
    if (!this.appContainer) {
      console.error('❌ App container not available for renderExtractor');
      return;
    }

    this.currentView = 'extract';
    document.title = 'StoryboardR - Extract Keyframes';

    this.appContainer.innerHTML = `
      <div class="extractor-view">
        <div class="container">
          <div class="extractor-header">
            <h2>
              Extract Keyframes
            </h2>
            <p>Upload a video file or provide a URL to extract keyframes</p>
          </div>
          
          <div class="extractor-content">
            <!-- Tab Navigation -->
            <div class="tab-nav">
              <button class="tab-btn active" data-tab="url">
                <i class="fas fa-link"></i>
                Video URL
              </button>
              <button class="tab-btn" data-tab="upload">
                <i class="fas fa-upload"></i>
                Upload File
              </button>
              <button class="tab-btn" data-tab="settings">
                <i class="fas fa-cog"></i>
                Settings
              </button>
            </div>

            <!-- URL Tab -->
            <div class="tab-content active" id="urlTab">
              <div class="url-form">
                <div class="form-group">
                  <label for="videoUrl">Video URL</label>
                  <input type="url" id="videoUrl" placeholder="https://example.com/video.mp4" />
                </div>
                <button class="btn btn-primary" id="extractFromUrlBtn">
                  <i class="fas fa-download"></i>
                  Extract Keyframes
                </button>
              </div>
            </div>

            <!-- Upload Tab -->
            <div class="tab-content" id="uploadTab">
              <div class="upload-area" id="uploadArea">
                <i class="fas fa-cloud-upload-alt"></i>
                <h3>Drop video file here</h3>
                <p>or click to browse</p>
                <input type="file" id="videoFile" accept="video/*" hidden />
              </div>
            </div>

            <!-- Settings Tab -->
            <div class="tab-content" id="settingsTab">
              <div class="settings-form">
                <div class="form-group">
                  <label for="frameInterval">Frame Interval (seconds)</label>
                  <input type="number" id="frameInterval" value="1" min="0.1" step="0.1" />
                </div>
                <div class="form-group">
                  <label for="maxFrames">Maximum Frames</label>
                  <input type="number" id="maxFrames" value="50" min="1" />
                </div>
                <div class="form-group">
                  <label for="quality">Quality</label>
                  <select id="quality">
                    <option value="high">High</option>
                    <option value="medium" selected>Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>
            </div>
            
            <!-- Results will be displayed here -->
            <div class="extraction-results" id="extractionResults" style="display: none;">
              <h3>Extracted Keyframes</h3>
              <div class="keyframes-grid" id="keyframesGrid">
                <!-- Keyframes will be populated here -->
              </div>
              <div class="results-actions">
                <button class="btn btn-primary" onclick="window.spa.navigate('editor')">
                  <i class="fas fa-edit"></i>
                  Edit in Storyboard
                </button>
                <button class="btn btn-secondary" id="downloadFramesBtn">
                  <i class="fas fa-download"></i>
                  Download Frames
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    this.initializeExtractor();
  }

  renderSettings() {
    if (!this.appContainer) {
      console.error('❌ App container not available for renderSettings');
      return;
    }

    this.currentView = 'settings';
    document.title = 'StoryboardR - Settings';

    this.appContainer.innerHTML = `
      <div class="settings-view">
        <div class="container">
          <div class="settings-header">
            <h2>
              <i class="fas fa-cog"></i>
              Settings
            </h2>
            <p>Configure your StoryboardR preferences</p>
          </div>
          
          <div class="settings-content">
            <div class="settings-section">
              <h3>General</h3>
              <div class="setting-item">
                <label for="autoSave">Auto-save projects</label>
                <input type="checkbox" id="autoSave" checked />
              </div>
              <div class="setting-item">
                <label for="defaultQuality">Default extraction quality</label>
                <select id="defaultQuality">
                  <option value="high">High</option>
                  <option value="medium" selected>Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
            </div>
            
            <div class="settings-section">
              <h3>Export</h3>
              <div class="setting-item">
                <label for="exportFormat">Default export format</label>
                <select id="exportFormat">
                  <option value="pdf" selected>PDF</option>
                  <option value="png">PNG Sequence</option>
                  <option value="jpg">JPG Sequence</option>
                </select>
              </div>
            </div>
            
            <div class="settings-actions">
              <button class="btn btn-primary" id="saveSettingsBtn">
                <i class="fas fa-save"></i>
                Save Settings
              </button>
              <button class="btn btn-secondary" id="resetSettingsBtn">
                <i class="fas fa-undo"></i>
                Reset to Defaults
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    this.initializeSettings();
  }

  // View Initializers
  initializeDashboard() {
    console.log('🏠 Initializing Dashboard');
    this.loadProjects();

    // New project button
    const newProjectBtn = document.getElementById('newProjectBtn');
    console.log('🔗 New Project button found:', !!newProjectBtn);

    newProjectBtn?.addEventListener('click', () => {
      console.log('🆕 New Project button clicked!');
      this.showNewProjectModal();
    });
  }

  initializeEditor() {
    console.log('✏️ Initializing Editor');
    // Editor initialization logic here
  }

  initializeExtractor() {
    console.log('🎬 Initializing Extractor');

    // Tab switching
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.getAttribute('data-tab');

        // Update active tab
        tabBtns.forEach(b => b.classList.remove('active'));
        tabContents.forEach(c => c.classList.remove('active'));

        btn.classList.add('active');
        document.getElementById(tab + 'Tab').classList.add('active');
      });
    });

    // Extract from URL button
    const extractFromUrlBtn = document.getElementById('extractFromUrlBtn');
    extractFromUrlBtn?.addEventListener('click', (e) => {
      e.preventDefault();
      console.log('🔗 Extract from URL button clicked');

      const videoUrl = document.getElementById('videoUrl')?.value;
      if (videoUrl) {
        const videoData = {
          url: videoUrl,
          interval: document.getElementById('frameInterval')?.value || 1,
          maxFrames: document.getElementById('maxFrames')?.value || 50,
          quality: document.getElementById('quality')?.value || 'medium'
        };

        // Use SPA integration if available
        if (window.spaIntegration && this.extractKeyframes) {
          this.extractKeyframes(videoData);
        } else {
          this.showNotification('Video extraction will be implemented', 'info');
        }
      } else {
        this.showNotification('Please enter a video URL', 'error');
      }
    });

    // File upload handling
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('videoFile');

    uploadArea?.addEventListener('click', () => fileInput?.click());
    uploadArea?.addEventListener('dragover', (e) => {
      e.preventDefault();
      uploadArea.classList.add('dragover');
    });
    uploadArea?.addEventListener('dragleave', () => {
      uploadArea.classList.remove('dragover');
    });
    uploadArea?.addEventListener('drop', (e) => {
      e.preventDefault();
      uploadArea.classList.remove('dragover');
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        this.handleVideoUpload(files[0]);
      }
    });

    fileInput?.addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        this.handleVideoUpload(e.target.files[0]);
      }
    });
  }

  initializeSettings() {
    console.log('⚙️ Initializing Settings');
    this.loadSettings();

    document.getElementById('saveSettingsBtn')?.addEventListener('click', () => {
      this.saveSettings();
    });

    document.getElementById('resetSettingsBtn')?.addEventListener('click', () => {
      this.resetSettings();
    });
  }

  // Helper Methods
  async loadProjects() {
    try {
      const response = await fetch('/api/projects');
      const data = await response.json();

      if (data.projects && data.projects.length > 0) {
        this.renderProjects(data.projects);
        document.getElementById('emptyState').style.display = 'none';
      } else {
        document.getElementById('emptyState').style.display = 'block';
      }
    } catch (error) {
      console.error('Error loading projects:', error);
      document.getElementById('emptyState').style.display = 'block';
    }
  }

  renderProjects(projects) {
    const grid = document.getElementById('projectsGrid');
    if (!grid) return;

    grid.innerHTML = projects.map(project => `
      <div class="project-card" onclick="window.spa.navigate('story', '${project.id}')">
        <div class="project-thumbnail">
          ${project.thumbnail ?
        `<img src="${project.thumbnail}" alt="${project.name}" />` :
        '<i class="fas fa-film"></i>'
      }
        </div>
        <div class="project-info">
          <h3>${project.name}</h3>
          <p>${project.description || 'No description'}</p>
          <div class="project-meta">
            <span><i class="fas fa-calendar"></i> ${new Date(project.created).toLocaleDateString()}</span>
            <span><i class="fas fa-images"></i> ${project.frameCount || 0} frames</span>
          </div>
        </div>
      </div>
    `).join('');
  }

  async loadStory(id) {
    try {
      // Simulate loading delay
      await new Promise(resolve => setTimeout(resolve, 500));

      document.getElementById('storyContent').innerHTML = `
        <div class="story-details">
          <h3>Story Details</h3>
          <p>Story ID: ${id}</p>
          <p>This is where the story content would be displayed.</p>
          
          <div class="story-frames">
            <h4>Frames</h4>
            <div class="frames-grid">
              <div class="frame-item">
                <div class="frame-placeholder">
                  <i class="fas fa-image"></i>
                  <p>Frame 1</p>
                </div>
              </div>
              <div class="frame-item">
                <div class="frame-placeholder">
                  <i class="fas fa-image"></i>
                  <p>Frame 2</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
    } catch (error) {
      console.error('Error loading story:', error);
      document.getElementById('storyContent').innerHTML = `
        <div class="error-state">
          <i class="fas fa-exclamation-triangle"></i>
          <h3>Error Loading Story</h3>
          <p>Could not load story with ID: ${id}</p>
        </div>
      `;
    }
  }

  showNewProjectModal() {
    console.log('🆕 showNewProjectModal called');

    // Check if modal already exists and remove it
    const existingModal = document.getElementById('newProjectModalOverlay');
    if (existingModal) {
      console.log('🆕 Removing existing modal');
      existingModal.remove();
    }

    // Create modal manually if ModalManager isn't available
    const modalHTML = `
      <div class="modal-overlay" id="newProjectModalOverlay" style="
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        width: 100vw !important;
        height: 100vh !important;
        background: rgba(0, 0, 0, 0.8) !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        z-index: 9999 !important;
        opacity: 1 !important;
        visibility: visible !important;
      ">
        <div class="modal-content" style="
          background: #2a2a2a !important;
          color: #f8fafc !important;
          border: 1px solid #404040 !important;
          border-radius: 0.5rem !important;
          padding: 2rem !important;
          max-width: 600px !important;
          width: 90% !important;
          max-height: 80vh !important;
          overflow-y: auto !important;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5) !important;
        ">
          <div class="modal-header" style="
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1.5rem;
            padding-bottom: 1rem;
            border-bottom: 1px solid var(--border-primary, #404040);
          ">
            <h3 style="margin: 0; color: var(--text-primary, #f8fafc);">Create New Project</h3>
            <button class="modal-close" id="newProjectModalClose" style="
              background: none;
              border: none;
              color: var(--text-secondary, #cbd5e1);
              font-size: 1.5rem;
              cursor: pointer;
              padding: 0.5rem;
            ">
              <i class="fas fa-times"></i>
            </button>
          </div>
          
          <div class="new-project-options">
            <h4 style="margin: 0 0 0.5rem 0; color: var(--text-primary, #f8fafc);">How would you like to create your project?</h4>
            <p class="modal-description" style="margin: 0 0 1.5rem 0; color: var(--text-secondary, #cbd5e1);">Choose your starting point for the new video project.</p>

            <div class="project-option-cards" style="
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
              gap: 1rem;
            ">
              <div class="project-option-card" data-action="scratch" style="
                padding: 1.5rem;
                background: var(--bg-secondary, #333333);
                border: 1px solid var(--border-primary, #404040);
                border-radius: 0.375rem;
                cursor: pointer;
                transition: all 0.3s ease;
                text-align: center;
              ">
                <div class="option-icon" style="margin-bottom: 1rem;">
                  <i class="fas fa-plus-circle" style="font-size: 2rem; color: var(--primary, #3b82f6);"></i>
                </div>
                <h5 style="margin: 0 0 0.5rem 0; color: var(--text-primary, #f8fafc); font-weight: 600;">Start from Scratch</h5>
                <p style="margin: 0; color: var(--text-secondary, #cbd5e1); font-size: 0.875rem;">Create an empty project and add content later</p>
              </div>

              <div class="project-option-card" data-action="video" style="
                padding: 1.5rem;
                background: var(--bg-secondary, #333333);
                border: 1px solid var(--border-primary, #404040);
                border-radius: 0.375rem;
                cursor: pointer;
                transition: all 0.3s ease;
                text-align: center;
              ">
                <div class="option-icon" style="margin-bottom: 1rem;">
                  <i class="fas fa-video" style="font-size: 2rem; color: var(--primary, #3b82f6);"></i>
                </div>
                <h5 style="margin: 0 0 0.5rem 0; color: var(--text-primary, #f8fafc); font-weight: 600;">Extract from Video</h5>
                <p style="margin: 0; color: var(--text-secondary, #cbd5e1); font-size: 0.875rem;">Upload a video or provide a URL to extract keyframes</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Add modal to page
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    console.log('🆕 Modal HTML added to page');

    // Add event listeners
    const modal = document.getElementById('newProjectModalOverlay');
    console.log('🆕 Modal element found:', !!modal);
    console.log('🆕 Modal display style:', modal?.style.display);
    console.log('🆕 Modal z-index:', modal?.style.zIndex);

    // Force visibility
    if (modal) {
      modal.style.display = 'flex';
      modal.style.visibility = 'visible';
      modal.style.opacity = '1';
      console.log('🆕 Forced modal visibility');
    }

    const closeBtn = document.getElementById('newProjectModalClose');
    const optionCards = document.querySelectorAll('.project-option-card');

    // Close modal handlers
    const closeModal = () => {
      modal?.remove();
    };

    closeBtn?.addEventListener('click', closeModal);
    modal?.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeModal();
      }
    });

    // Option card handlers
    optionCards.forEach(card => {
      card.addEventListener('click', () => {
        const action = card.getAttribute('data-action');
        if (action === 'video') {
          console.log('🎬 Navigating to extract via SPA');
          this.navigate('extract');
        } else {
          console.log('✏️ Navigating to editor via SPA');
          this.navigate('editor');
        }
        closeModal();
      });

      // Add hover effect
      card.addEventListener('mouseenter', () => {
        card.style.borderColor = 'var(--primary, #3b82f6)';
        card.style.transform = 'translateY(-2px)';
        card.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.4)';
      });

      card.addEventListener('mouseleave', () => {
        card.style.borderColor = 'var(--border-primary, #404040)';
        card.style.transform = 'translateY(0)';
        card.style.boxShadow = 'none';
      });
    });

    // Prevent modal from closing when clicking inside content
    document.querySelector('.modal-content')?.addEventListener('click', (e) => {
      e.stopPropagation();
    });
  }

  handleVideoUpload(file) {
    console.log('📹 Handling video upload:', file.name);

    const videoData = {
      file: file,
      interval: document.getElementById('frameInterval')?.value || 1,
      maxFrames: document.getElementById('maxFrames')?.value || 50,
      quality: document.getElementById('quality')?.value || 'medium'
    };

    // Use SPA integration if available
    if (window.spaIntegration && this.extractKeyframes) {
      this.extractKeyframes(videoData);
    } else {
      this.showNotification('Video extraction will be implemented', 'info');
    }
  }

  loadSettings() {
    const settings = JSON.parse(localStorage.getItem('storyboardr-settings') || '{}');

    // Apply saved settings to form
    Object.keys(settings).forEach(key => {
      const element = document.getElementById(key);
      if (element) {
        if (element.type === 'checkbox') {
          element.checked = settings[key];
        } else {
          element.value = settings[key];
        }
      }
    });
  }

  saveSettings() {
    const settings = {};
    const formElements = document.querySelectorAll('#defaultQuality, #exportFormat, #autoSave');

    formElements.forEach(element => {
      if (element.type === 'checkbox') {
        settings[element.id] = element.checked;
      } else {
        settings[element.id] = element.value;
      }
    });

    localStorage.setItem('storyboardr-settings', JSON.stringify(settings));

    // Show success message
    this.showNotification('Settings saved successfully!', 'success');
  }

  resetSettings() {
    localStorage.removeItem('storyboardr-settings');
    this.loadSettings();
    this.showNotification('Settings reset to defaults', 'info');
  }

  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
      <i class="fas fa-${type === 'success' ? 'check' : type === 'error' ? 'times' : 'info'}"></i>
      <span>${message}</span>
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.classList.add('show');
    }, 100);

    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  initializeMouseGradient() {
    let mouseTimeout;

    document.addEventListener('mousemove', (e) => {
      const x = (e.clientX / window.innerWidth) * 100;
      const y = (e.clientY / window.innerHeight) * 100;

      document.documentElement.style.setProperty('--mouse-x', `${x}%`);
      document.documentElement.style.setProperty('--mouse-y', `${y}%`);

      document.body.classList.add('mouse-active');

      if (mouseTimeout) {
        clearTimeout(mouseTimeout);
      }

      mouseTimeout = setTimeout(() => {
        document.body.classList.remove('mouse-active');
      }, 1000);
    });

    document.addEventListener('mouseenter', () => {
      document.body.classList.add('mouse-active');
    });

    document.addEventListener('mouseleave', () => {
      document.body.classList.remove('mouse-active');
      if (mouseTimeout) {
        clearTimeout(mouseTimeout);
      }
    });
  }
}

// Initialize the SPA when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.spa = new StoryboardSPA();
});

export { StoryboardSPA };
