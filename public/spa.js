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

    // Initialize with some sample data if empty
    this.initializeSampleData();

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

        // For now, simulate extraction and show placeholder results
        this.simulateExtraction(videoData);
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
      // Use localStorage directly for reliable offline-first experience
      const storedStoryboards = JSON.parse(localStorage.getItem('storyboardr_storyboards') || '{"storyboards":[]}');
      const projects = storedStoryboards.storyboards || [];

      console.log('📦 Loaded projects from localStorage:', projects.length);

      if (projects.length > 0) {
        this.renderProjects(projects);
        document.getElementById('emptyState').style.display = 'none';
      } else {
        document.getElementById('emptyState').style.display = 'block';
      }
    } catch (error) {
      console.error('Error loading projects from localStorage:', error);
      document.getElementById('emptyState').style.display = 'block';
    }
  }

  renderProjects(projects) {
    const grid = document.getElementById('projectsGrid');
    if (!grid) return;

    grid.innerHTML = projects.map(project => `
      <div class="project-card" onclick="window.spa.navigate('story', '${project.id}')">
        <div class="project-thumbnail">
          ${project.thumbnail || (project.keyframes && project.keyframes[0] && project.keyframes[0].thumbnail) ?
        `<img src="${project.thumbnail || project.keyframes[0].thumbnail}" alt="${project.name}" />` :
        '<i class="fas fa-film"></i>'
      }
        </div>
        <div class="project-info">
          <h3>${project.name}</h3>
          <p>${project.description || 'No description'}</p>
          <div class="project-meta">
            <span><i class="fas fa-calendar"></i> ${new Date(project.createdAt || project.created || Date.now()).toLocaleDateString()}</span>
            <span><i class="fas fa-images"></i> ${(project.keyframes && project.keyframes.length) || project.frameCount || 0} frames</span>
          </div>
        </div>
      </div>
    `).join('');
  }

  async loadStory(id) {
    try {
      // Load from localStorage
      const storedStoryboards = JSON.parse(localStorage.getItem('storyboardr_storyboards') || '{"storyboards":[]}');
      const story = storedStoryboards.storyboards.find(s => s.id === id);

      if (story) {
        document.getElementById('storyContent').innerHTML = `
          <div class="story-details">
            <h3>${story.name}</h3>
            <p>${story.description || 'No description'}</p>
            <div class="story-meta">
              <span><i class="fas fa-calendar"></i> Created: ${new Date(story.createdAt).toLocaleDateString()}</span>
              <span><i class="fas fa-images"></i> ${story.keyframes ? story.keyframes.length : 0} frames</span>
              ${story.videoSource ? `<span><i class="fas fa-video"></i> Source: ${story.videoSource}</span>` : ''}
            </div>
            
            <div class="story-frames">
              <h4>Keyframes</h4>
              <div class="frames-grid">
                ${story.keyframes && story.keyframes.length > 0 ?
            story.keyframes.map((frame, index) => `
                    <div class="frame-item">
                      <div class="frame-content">
                        ${frame.thumbnail ?
                `<img src="${frame.thumbnail}" alt="Frame ${index + 1}" />` :
                `<div class="frame-placeholder">
                            <i class="fas fa-image"></i>
                            <p>Frame ${index + 1}</p>
                          </div>`
              }
                        ${frame.timestamp ? `<span class="frame-time">${frame.timestamp}s</span>` : ''}
                      </div>
                    </div>
                  `).join('') :
            `<div class="empty-frames">
                    <i class="fas fa-images"></i>
                    <p>No frames in this storyboard yet</p>
                    <button class="btn btn-primary" onclick="window.spa.navigate('extract')">
                      <i class="fas fa-plus"></i>
                      Extract Frames
                    </button>
                  </div>`
          }
              </div>
            </div>
          </div>
        `;
      } else {
        document.getElementById('storyContent').innerHTML = `
          <div class="error-state">
            <i class="fas fa-exclamation-triangle"></i>
            <h3>Story Not Found</h3>
            <p>Could not find story with ID: ${id}</p>
            <button class="btn btn-secondary" onclick="window.spa.navigate('home')">
              <i class="fas fa-arrow-left"></i>
              Back to Dashboard
            </button>
          </div>
        `;
      }
    } catch (error) {
      console.error('Error loading story:', error);
      document.getElementById('storyContent').innerHTML = `
        <div class="error-state">
          <i class="fas fa-exclamation-triangle"></i>
          <h3>Error Loading Story</h3>
          <p>Could not load story with ID: ${id}</p>
          <button class="btn btn-secondary" onclick="window.spa.navigate('home')">
            <i class="fas fa-arrow-left"></i>
            Back to Dashboard
          </button>
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
            <h4 style="margin: 0 0 0.5rem 0; color: var(--text-primary, #f8fafc);">Create New Project</h4>
            <p class="modal-description" style="margin: 0 0 1.5rem 0; color: var(--text-secondary, #cbd5e1);">Enter project details to get started.</p>

            <form id="newProjectForm" style="margin-bottom: 1.5rem;">
              <div style="margin-bottom: 1rem;">
                <label for="projectName" style="display: block; margin-bottom: 0.5rem; color: var(--text-primary, #f8fafc); font-weight: 500;">Project Name</label>
                <input type="text" id="projectName" required placeholder="Enter project name..." style="
                  width: 100%;
                  padding: 0.75rem;
                  background: var(--bg-tertiary, #1a1a1a);
                  border: 1px solid var(--border-primary, #404040);
                  border-radius: 0.375rem;
                  color: var(--text-primary, #f8fafc);
                  font-size: 0.875rem;
                " />
              </div>
              
              <div style="margin-bottom: 1.5rem;">
                <label for="projectDescription" style="display: block; margin-bottom: 0.5rem; color: var(--text-primary, #f8fafc); font-weight: 500;">Description (optional)</label>
                <textarea id="projectDescription" placeholder="Describe your project..." rows="3" style="
                  width: 100%;
                  padding: 0.75rem;
                  background: var(--bg-tertiary, #1a1a1a);
                  border: 1px solid var(--border-primary, #404040);
                  border-radius: 0.375rem;
                  color: var(--text-primary, #f8fafc);
                  font-size: 0.875rem;
                  resize: vertical;
                "></textarea>
              </div>
            </form>

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
        const form = document.getElementById('newProjectForm');
        const nameInput = document.getElementById('projectName');
        const descriptionInput = document.getElementById('projectDescription');

        // Validate form
        if (!nameInput.value.trim()) {
          nameInput.focus();
          this.showNotification('Please enter a project name', 'error');
          return;
        }

        // Create project data
        const projectData = {
          name: nameInput.value.trim(),
          description: descriptionInput.value.trim()
        };

        // Create the project
        const project = this.createProject(projectData);

        if (project) {
          closeModal();

          if (action === 'video') {
            console.log('🎬 Creating project and navigating to extract');
            // Store current project ID for extraction
            sessionStorage.setItem('currentProjectId', project.id);
            this.navigate('extract');
          } else {
            console.log('✏️ Creating project and navigating to editor');
            // Store current project ID for editing
            sessionStorage.setItem('currentProjectId', project.id);
            this.navigate('editor');
          }

          // Refresh dashboard to show new project
          if (this.currentView === 'home') {
            this.loadProjects();
          }
        }
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

    if (!file.type.startsWith('video/')) {
      this.showNotification('Please select a valid video file', 'error');
      return;
    }

    const videoData = {
      file: file,
      filename: file.name,
      interval: document.getElementById('frameInterval')?.value || 1,
      maxFrames: document.getElementById('maxFrames')?.value || 50,
      quality: document.getElementById('quality')?.value || 'medium'
    };

    // Simulate extraction from uploaded file
    this.simulateExtraction(videoData);
  }

  simulateExtraction(videoData) {
    console.log('🎬 Simulating keyframe extraction for:', videoData);

    // Show loading state
    const resultsDiv = document.getElementById('extractionResults');
    const keyframesGrid = document.getElementById('keyframesGrid');

    if (resultsDiv) {
      resultsDiv.style.display = 'block';
      keyframesGrid.innerHTML = '<div class="loading">Extracting keyframes...</div>';
    }

    // Simulate extraction delay
    setTimeout(() => {
      // Generate mock keyframes
      const mockKeyframes = this.generateMockKeyframes(videoData);
      this.displayExtractedKeyframes(mockKeyframes, videoData);
    }, 2000);
  }

  generateMockKeyframes(videoData) {
    const maxFrames = parseInt(videoData.maxFrames) || 5;
    const interval = parseInt(videoData.interval) || 1;
    const keyframes = [];

    for (let i = 0; i < Math.min(maxFrames, 8); i++) {
      keyframes.push({
        id: `frame_${Date.now()}_${i}`,
        timestamp: i * interval,
        thumbnail: `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200"><rect width="300" height="200" fill="%23374151"/><text x="150" y="100" text-anchor="middle" fill="%23f8fafc" font-family="Arial, sans-serif" font-size="16">Frame ${i + 1}</text><text x="150" y="120" text-anchor="middle" fill="%239ca3af" font-family="Arial, sans-serif" font-size="12">${i * interval}s</text></svg>`,
        metadata: {
          quality: videoData.quality,
          source: videoData.url || 'uploaded file'
        }
      });
    }

    return keyframes;
  }

  displayExtractedKeyframes(keyframes, videoData) {
    const keyframesGrid = document.getElementById('keyframesGrid');

    if (!keyframesGrid) return;

    keyframesGrid.innerHTML = keyframes.map(frame => `
      <div class="keyframe-item" data-frame-id="${frame.id}">
        <div class="keyframe-content">
          <img src="${frame.thumbnail}" alt="Frame at ${frame.timestamp}s" />
          <div class="keyframe-info">
            <span class="timestamp">${frame.timestamp}s</span>
            <button class="btn-small btn-remove" onclick="window.spa.removeKeyframe('${frame.id}')">
              <i class="fas fa-times"></i>
            </button>
          </div>
        </div>
      </div>
    `).join('');

    // Update results actions
    const resultsActions = document.querySelector('.results-actions');
    if (resultsActions) {
      resultsActions.innerHTML = `
        <button class="btn btn-primary" onclick="window.spa.saveExtractedFrames()">
          <i class="fas fa-save"></i>
          Save to Project
        </button>
        <button class="btn btn-secondary" onclick="window.spa.navigate('editor')">
          <i class="fas fa-edit"></i>
          Edit in Storyboard
        </button>
        <button class="btn btn-secondary" id="downloadFramesBtn">
          <i class="fas fa-download"></i>
          Download Frames
        </button>
      `;
    }

    // Store extracted frames for saving
    this.extractedKeyframes = keyframes;
    this.extractedVideoData = videoData;

    this.showNotification(`Successfully extracted ${keyframes.length} keyframes!`, 'success');
  }

  removeKeyframe(frameId) {
    if (this.extractedKeyframes) {
      this.extractedKeyframes = this.extractedKeyframes.filter(frame => frame.id !== frameId);

      const frameElement = document.querySelector(`[data-frame-id="${frameId}"]`);
      if (frameElement) {
        frameElement.remove();
      }

      this.showNotification('Keyframe removed', 'info');
    }
  }

  saveExtractedFrames() {
    const currentProjectId = sessionStorage.getItem('currentProjectId');

    if (!currentProjectId) {
      this.showNotification('No project selected. Please create a project first.', 'error');
      return;
    }

    if (!this.extractedKeyframes || this.extractedKeyframes.length === 0) {
      this.showNotification('No keyframes to save', 'error');
      return;
    }

    try {
      // Load current project
      const storedStoryboards = JSON.parse(localStorage.getItem('storyboardr_storyboards') || '{"storyboards":[]}');
      const projectIndex = storedStoryboards.storyboards.findIndex(p => p.id === currentProjectId);

      if (projectIndex === -1) {
        this.showNotification('Project not found', 'error');
        return;
      }

      // Update project with keyframes
      const project = storedStoryboards.storyboards[projectIndex];
      project.keyframes = [...(project.keyframes || []), ...this.extractedKeyframes];
      project.videoSource = this.extractedVideoData?.url || project.videoSource;
      project.updatedAt = new Date().toISOString();

      // Save updated project
      localStorage.setItem('storyboardr_storyboards', JSON.stringify(storedStoryboards));

      this.showNotification(`Saved ${this.extractedKeyframes.length} keyframes to project!`, 'success');

      // Navigate to the project
      this.navigate('story', currentProjectId);

    } catch (error) {
      console.error('Error saving keyframes:', error);
      this.showNotification('Error saving keyframes', 'error');
    }
  }

  // Initialize with some sample data if empty
  initializeSampleData() {
    const storedStoryboards = JSON.parse(localStorage.getItem('storyboardr_storyboards') || '{"storyboards":[]}');
    
    if (storedStoryboards.storyboards.length === 0) {
      console.log('📦 No projects found, adding sample data...');
      
      const sampleProjects = [
        {
          id: 'sample_project_1',
          name: 'Sample Video Project',
          description: 'A demo project showing keyframe extraction features',
          videoSource: 'https://example.com/video.mp4',
          keyframes: [
            {
              id: 'frame_1',
              timestamp: 0,
              thumbnail: `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200"><rect width="300" height="200" fill="%23374151"/><text x="150" y="100" text-anchor="middle" fill="%23f8fafc" font-family="Arial, sans-serif" font-size="16">Sample Frame 1</text></svg>`,
              metadata: { quality: 'medium', source: 'sample' }
            },
            {
              id: 'frame_2',
              timestamp: 5,
              thumbnail: `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200"><rect width="300" height="200" fill="%23dc2626"/><text x="150" y="100" text-anchor="middle" fill="%23f8fafc" font-family="Arial, sans-serif" font-size="16">Sample Frame 2</text></svg>`,
              metadata: { quality: 'medium', source: 'sample' }
            },
            {
              id: 'frame_3',
              timestamp: 10,
              thumbnail: `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200"><rect width="300" height="200" fill="%2316a34a"/><text x="150" y="100" text-anchor="middle" fill="%23f8fafc" font-family="Arial, sans-serif" font-size="16">Sample Frame 3</text></svg>`,
              metadata: { quality: 'medium', source: 'sample' }
            }
          ],
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
          updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()  // 1 day ago
        },
        {
          id: 'sample_project_2',
          name: 'Empty Project',
          description: 'An empty project ready for content',
          videoSource: '',
          keyframes: [],
          createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
          updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
        }
      ];

      storedStoryboards.storyboards = sampleProjects;
      localStorage.setItem('storyboardr_storyboards', JSON.stringify(storedStoryboards));
      console.log('✅ Sample data added to localStorage');
    }
  }

  // ...existing code...
}

// Initialize the SPA when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.spa = new StoryboardSPA();
});

export { StoryboardSPA };
