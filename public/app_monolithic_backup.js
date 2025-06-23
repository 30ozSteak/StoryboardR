class VideoKeyframeExtractor {
    constructor() {
        this.currentSessionId = null;
        this.isProcessing = false;
        this.abortController = null;
        this.currentProject = null; // Store current project data

        this.initializeElements();
        this.bindEvents();
        this.initializeView();
        this.initializeTheme();
        this.checkServerStatus();
        this.checkCookieStatus();
        this.checkProjectLoad(); // Check if loading an existing project
        this.initializeMouseTracking();
    }

    initializeElements() {
        // Sections
        this.uploadSection = document.getElementById('uploadSection');
        this.loadingSection = document.getElementById('loadingSection');
        this.resultsSection = document.getElementById('resultsSection');
        this.errorSection = document.getElementById('errorSection');

        // Forms and inputs
        this.urlForm = document.getElementById('urlForm');
        this.uploadForm = document.getElementById('uploadForm');
        this.videoUrlInput = document.getElementById('videoUrl');
        this.videoFileInput = document.getElementById('videoFile');
        this.fileDropArea = document.getElementById('fileDropArea');

        // Buttons
        this.urlSubmitBtn = document.getElementById('urlSubmitBtn');
        this.uploadSubmitBtn = document.getElementById('uploadSubmitBtn');
        this.cancelBtn = document.getElementById('cancelBtn');
        this.newExtractionBtn = document.getElementById('newExtractionBtn');
        this.retryBtn = document.getElementById('retryBtn');
        this.downloadAllBtn = document.getElementById('downloadAllBtn');
        this.saveProjectBtn = document.getElementById('saveProjectBtn');
        this.backToProjectsBtn = document.getElementById('backToProjectsBtn');

        // Tab navigation
        this.tabButtons = document.querySelectorAll('.tab-btn');
        this.tabContents = document.querySelectorAll('.tab-content');

        // Loading elements
        this.loadingText = document.getElementById('loadingText');
        this.progressFill = document.getElementById('progressFill');
        this.progressPercentage = document.getElementById('progressPercentage');

        // Results elements
        this.frameCount = document.getElementById('frameCount');
        this.gallery = document.getElementById('gallery');
        this.galleryContainer = document.getElementById('galleryContainer');
        this.sectionTitle = document.getElementById('sectionTitle');

        // Selection elements
        this.selectionInfo = document.getElementById('selectionInfo');
        this.selectedCount = document.getElementById('selectedCount');
        this.selectAllBtn = document.getElementById('selectAllBtn');
        this.deselectAllBtn = document.getElementById('deselectAllBtn');
        this.addNotesBtn = document.getElementById('addNotesBtn');
        this.deleteSelectedBtn = document.getElementById('deleteSelectedBtn');

        // Selection state
        this.selectedKeyframes = new Set();

        // Custom keyframe names
        this.keyframeNames = new Map();

        // Keyframe notes
        this.keyframeNotes = new Map();

        // Frame metadata for navigation
        this.frameMetadata = new Map(); // Maps filename to {timestamp, index, sessionId}
        this.videoDuration = null; // Store video duration for boundary checking
        this.frameCache = new Map(); // Cache for adjacent frames: Maps timestamp to {url, filename}

        // Navigation message debouncing
        this.navigationMessageTimeout = null;
        this.lastNavigationTime = 0;

        // Error elements
        this.errorMessage = document.getElementById('errorMessage');

        // Modal elements
        this.imageModal = document.getElementById('imageModal');
        this.modalBackdrop = document.getElementById('modalBackdrop');
        this.modalClose = document.getElementById('modalClose');
        this.modalImage = document.getElementById('modalImage');
        this.modalTitle = document.getElementById('modalTitle');
        this.downloadBtn = document.getElementById('downloadBtn');
        this.copyUrlBtn = document.getElementById('copyUrlBtn');
        this.saveFrameBtn = document.getElementById('saveFrameBtn');

        // Frame navigation elements
        this.framePrevBtn = document.getElementById('framePrevBtn');
        this.frameNextBtn = document.getElementById('frameNextBtn');

        // Frame progress elements
        this.frameProgress = document.getElementById('frameProgress');
        this.frameProgressFill = document.getElementById('frameProgressFill');
        this.frameTimeInfo = document.getElementById('frameTimeInfo');

        // Notes modal elements
        this.notesModal = document.getElementById('notesModal');
        this.notesModalBackdrop = document.getElementById('notesModalBackdrop');
        this.notesModalClose = document.getElementById('notesModalClose');
        this.notesModalTitle = document.getElementById('notesModalTitle');
        this.selectedFramesCount = document.getElementById('selectedFramesCount');
        this.notesTextarea = document.getElementById('notesTextarea');
        this.notesCharCount = document.getElementById('notesCharCount');
        this.saveNotesBtn = document.getElementById('saveNotesBtn');
        this.cancelNotesBtn = document.getElementById('cancelNotesBtn');

        // Add Keyframe button (now in bulk actions)
        this.addKeyframeBtn = document.getElementById('addKeyframeBtn');

        // Cookie management elements
        this.cookieFile = document.getElementById('cookieFile');
        this.uploadCookieBtn = document.getElementById('uploadCookieBtn');
        this.clearCookiesBtn = document.getElementById('clearCookiesBtn');
        this.cookieStatus = document.getElementById('cookieStatus');
        this.statusIndicator = document.getElementById('statusIndicator');
        this.statusText = document.getElementById('statusText');
        this.cookieActions = document.getElementById('cookieActions');
        this.cookieUploadArea = document.getElementById('cookieUploadArea');

        // Keyframe options elements
        this.urlMaxFrames = document.getElementById('urlMaxFrames');
        this.urlIncludeLastFrame = document.getElementById('urlIncludeLastFrame');
        this.uploadMaxFrames = document.getElementById('uploadMaxFrames');
        this.uploadIncludeLastFrame = document.getElementById('uploadIncludeLastFrame');

        // Storyboard view elements
        this.storyboardContainer = document.getElementById('storyboardContainer');
        this.storyboardSidebar = document.getElementById('storyboardSidebar');
        this.storyboardFrames = document.getElementById('storyboardFrames');
        this.storyboardMain = document.getElementById('storyboardMain');
        this.mainFrameContainer = document.getElementById('mainFrameContainer');
        this.mainFrameDetails = document.getElementById('mainFrameDetails');
        this.galleryViewBtn = document.getElementById('galleryViewBtn');
        this.storyboardViewBtn = document.getElementById('storyboardViewBtn');

        // Theme toggle elements
        this.themeToggle = document.getElementById('themeToggle');
        this.themeToggleLabel = document.getElementById('themeToggleLabel');
        this.themeIcon = document.getElementById('themeIcon');

        // Main header theme toggle elements
        this.mainThemeToggle = document.getElementById('mainThemeToggle');
        this.mainThemeToggleLabel = document.getElementById('mainThemeToggleLabel');
        this.mainThemeIcon = document.getElementById('mainThemeIcon');

        // Track selected storyboard frame
        this.selectedStoryboardFrame = null;
    }

    bindEvents() {
        // Tab navigation
        this.tabButtons.forEach(btn => {
            btn.addEventListener('click', () => this.switchTab(btn.dataset.tab));
        });

        // Form submissions
        this.urlForm.addEventListener('submit', (e) => this.handleUrlSubmit(e));
        this.uploadForm.addEventListener('submit', (e) => this.handleUploadSubmit(e));

        // File drag and drop
        this.bindFileDropEvents();

        // File input change
        this.videoFileInput.addEventListener('change', () => this.handleFileSelection());

        // Cookie management
        this.bindCookieEvents();

        // Button clicks
        this.cancelBtn.addEventListener('click', () => this.cancelProcessing());
        this.newExtractionBtn.addEventListener('click', () => this.resetToUpload());
        this.retryBtn.addEventListener('click', () => this.resetToUpload());
        this.downloadAllBtn.addEventListener('click', () => this.downloadAllKeyframes());
        this.saveProjectBtn.addEventListener('click', () => this.saveProject());
        this.backToProjectsBtn.addEventListener('click', () => this.goBackToProjects());

        // Selection buttons
        this.selectAllBtn.addEventListener('click', () => this.selectAllKeyframes());
        this.deselectAllBtn.addEventListener('click', () => this.deselectAllKeyframes());
        this.addNotesBtn.addEventListener('click', () => this.openNotesModal());
        this.deleteSelectedBtn.addEventListener('click', () => this.deleteSelectedKeyframes());

        // Add Keyframe button (Clone Selected)
        this.addKeyframeBtn.addEventListener('click', () => this.cloneSelectedKeyframes());

        // Modal events
        this.modalBackdrop.addEventListener('click', () => this.closeModal());
        this.modalClose.addEventListener('click', () => this.closeModal());
        this.downloadBtn.addEventListener('click', () => this.downloadCurrentImage());
        this.copyUrlBtn.addEventListener('click', () => this.copyImageUrl());
        this.saveFrameBtn.addEventListener('click', () => this.saveCurrentNavigationFrame());

        // Frame navigation events
        this.framePrevBtn.addEventListener('click', () => this.navigateFrame('prev'));
        this.frameNextBtn.addEventListener('click', () => this.navigateFrame('next'));

        // Notes modal events
        this.notesModalBackdrop.addEventListener('click', () => this.closeNotesModal());
        this.notesModalClose.addEventListener('click', () => this.closeNotesModal());
        this.saveNotesBtn.addEventListener('click', () => this.saveNotesToSelected());
        this.cancelNotesBtn.addEventListener('click', () => this.closeNotesModal());
        this.notesTextarea.addEventListener('input', () => this.updateNotesCharCount());

        // Keyboard events
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModal();
                this.closeNotesModal();
            }

            // Frame navigation with arrow keys
            if (!this.imageModal.classList.contains('hidden')) {
                if (e.key === 'ArrowLeft') {
                    e.preventDefault();
                    if (!this.framePrevBtn.disabled) {
                        this.navigateFrame('prev');
                    }
                } else if (e.key === 'ArrowRight') {
                    e.preventDefault();
                    if (!this.frameNextBtn.disabled) {
                        this.navigateFrame('next');
                    }
                }
                // Add spacebar for play/pause-like behavior (cycle between frames)
                else if (e.key === ' ') {
                    e.preventDefault();
                    if (!this.frameNextBtn.disabled) {
                        this.navigateFrame('next');
                    } else if (!this.framePrevBtn.disabled) {
                        this.navigateFrame('prev');
                    }
                }
            }
        });

        // Gallery scroll effects
        if (this.galleryContainer) {
            this.galleryContainer.addEventListener('scroll', () => this.handleGalleryScroll());
        }

        // View toggle events
        this.galleryViewBtn.addEventListener('click', () => this.switchView('gallery'));
        this.storyboardViewBtn.addEventListener('click', () => this.switchView('storyboard'));

        // Theme toggle events (with delayed binding to ensure elements exist)
        setTimeout(() => {
            const themeToggle = document.getElementById('themeToggle');
            const themeToggleLabel = document.getElementById('themeToggleLabel');
            const mainThemeToggle = document.getElementById('mainThemeToggle');
            const mainThemeToggleLabel = document.getElementById('mainThemeToggleLabel');

            if (themeToggle) {
                themeToggle.addEventListener('click', () => this.toggleTheme());
            }
            if (themeToggleLabel) {
                themeToggleLabel.addEventListener('click', () => this.toggleTheme());
            }
            if (mainThemeToggle) {
                mainThemeToggle.addEventListener('click', () => this.toggleTheme());
            }
            if (mainThemeToggleLabel) {
                mainThemeToggleLabel.addEventListener('click', () => this.toggleTheme());
            }
        }, 100);
    }

    initializeMouseTracking() {
        let mouseTimeout;

        document.addEventListener('mousemove', (e) => {
            // Update CSS custom properties for mouse position
            document.documentElement.style.setProperty('--mouse-x', e.clientX + 'px');
            document.documentElement.style.setProperty('--mouse-y', e.clientY + 'px');

            // Show gradient
            document.body.classList.add('mouse-active');

            // Clear existing timeout
            clearTimeout(mouseTimeout);

            // Hide gradient after 2 seconds of no movement
            mouseTimeout = setTimeout(() => {
                document.body.classList.remove('mouse-active');
            }, 2000);
        });

        // Hide gradient when mouse leaves the window
        document.addEventListener('mouseleave', () => {
            document.body.classList.remove('mouse-active');
            clearTimeout(mouseTimeout);
        });
    }

    initializeView() {
        // Check URL parameters for initial view
        const urlParams = new URLSearchParams(window.location.search);
        const requestedView = urlParams.get('view');
        const mode = urlParams.get('mode');

        // If coming from "Start from Scratch", switch to storyboard view
        if (requestedView === 'storyboard' && mode === 'scratch') {
            this.switchView('storyboard');
            // Hide upload section since we're starting from scratch
            this.uploadSection.style.display = 'none';
            this.resultsSection.style.display = 'block';
            // Initialize empty gallery for storyboard
            this.initializeEmptyStoryboard();
        } else {
            // Set gallery as the default view
            this.switchView('gallery');
        }
    }

    initializeEmptyStoryboard() {
        // Initialize empty storyboard interface
        this.frameCount.textContent = '0';

        // Clear any existing content
        if (this.gallery) {
            this.gallery.innerHTML = '';
        }

        // Show storyboard-specific UI elements
        if (this.storyboardContainer) {
            this.storyboardContainer.style.display = 'flex';
            this.storyboardContainer.classList.remove('hidden');
        }

        // Hide gallery-specific UI elements
        if (this.galleryContainer) {
            this.galleryContainer.style.display = 'none';
            this.galleryContainer.classList.add('hidden');
        }

        // Update view toggle buttons
        if (this.galleryViewBtn && this.storyboardViewBtn) {
            this.galleryViewBtn.classList.remove('active');
            this.storyboardViewBtn.classList.add('active');
        }

        // Initialize empty storyboard sidebar
        this.renderStoryboardSidebar();
    }

    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';

        document.documentElement.setAttribute('data-theme', newTheme);
        this.updateThemeIcon(newTheme);

        // Save theme preference
        localStorage.setItem('theme', newTheme);
    }

    updateThemeIcon(theme) {
        if (this.themeIcon) {
            if (theme === 'light') {
                this.themeIcon.className = 'fas fa-sun';
            } else {
                this.themeIcon.className = 'fas fa-moon';
            }
        }

        if (this.mainThemeIcon) {
            if (theme === 'light') {
                this.mainThemeIcon.className = 'fas fa-sun';
            } else {
                this.mainThemeIcon.className = 'fas fa-moon';
            }
        }
    }

    initializeTheme() {
        // Get saved theme or default to dark
        const savedTheme = localStorage.getItem('theme') || 'dark';
        document.documentElement.setAttribute('data-theme', savedTheme);
        this.updateThemeIcon(savedTheme);
    }

    bindFileDropEvents() {
        // Prevent default drag behaviors
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            this.fileDropArea.addEventListener(eventName, this.preventDefaults, false);
            document.body.addEventListener(eventName, this.preventDefaults, false);
        });

        // Highlight drop area when item is dragged over it
        ['dragenter', 'dragover'].forEach(eventName => {
            this.fileDropArea.addEventListener(eventName, () => {
                this.fileDropArea.classList.add('drag-over');
            }, false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            this.fileDropArea.addEventListener(eventName, () => {
                this.fileDropArea.classList.remove('drag-over');
            }, false);
        });

        // Handle dropped files
        this.fileDropArea.addEventListener('drop', (e) => {
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                this.handleFileSelection(files[0]);
            }
        }, false);

        // Handle click on drop area
        this.fileDropArea.addEventListener('click', () => {
            this.videoFileInput.click();
        });
    }

    bindCookieEvents() {
        // Cookie file selection
        this.cookieFile.addEventListener('change', () => {
            const file = this.cookieFile.files[0];
            if (file) {
                this.uploadCookieBtn.disabled = false;
                this.uploadCookieBtn.innerHTML = `<i class="fas fa-upload"></i> Upload ${file.name}`;
            } else {
                this.uploadCookieBtn.disabled = true;
                this.uploadCookieBtn.innerHTML = '<i class="fas fa-upload"></i> Upload Cookies';
            }
        });

        // Cookie upload button click
        this.uploadCookieBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent event bubbling
            this.handleCookieUpload();
        });

        // Clear cookies
        this.clearCookiesBtn.addEventListener('click', () => this.handleClearCookies());

        // Cookie upload area click - delegate to specific areas that should trigger file input
        this.cookieUploadArea.addEventListener('click', (e) => {
            // Only trigger file dialog if clicking on:
            // 1. The upload area itself (not its children)
            // 2. The icon or text elements (but not the button)
            const targetElement = e.target;
            const isUploadButton = targetElement === this.uploadCookieBtn ||
                targetElement.closest('#uploadCookieBtn');
            const isFileInput = targetElement === this.cookieFile;

            // Don't trigger if clicking on button or file input directly
            if (isUploadButton || isFileInput) {
                return;
            }

            // Only trigger for clicks on the upload area background or text/icon elements
            const isClickableArea = targetElement === this.cookieUploadArea ||
                targetElement.classList.contains('cookie-upload-content') ||
                targetElement.tagName === 'I' ||
                targetElement.tagName === 'H4' ||
                (targetElement.tagName === 'P' && targetElement.textContent.includes('Export'));

            if (isClickableArea) {
                e.stopPropagation();
                this.cookieFile.click();
            }
        });
    }

    preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    switchTab(tabName) {
        // Update tab buttons
        this.tabButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });

        // Update tab contents
        this.tabContents.forEach(content => {
            content.classList.toggle('active', content.id === `${tabName}Tab`);
        });
    } switchView(viewName) {
        // Update view toggle buttons
        this.galleryViewBtn.classList.toggle('active', viewName === 'gallery');
        this.storyboardViewBtn.classList.toggle('active', viewName === 'storyboard');

        // Show/hide appropriate containers
        if (viewName === 'gallery') {
            this.galleryContainer.style.display = 'block';
            this.galleryContainer.classList.remove('hidden');
            this.storyboardContainer.style.display = 'none';
            this.storyboardContainer.classList.add('hidden');
        } else {
            this.galleryContainer.style.display = 'none';
            this.galleryContainer.classList.add('hidden');
            this.storyboardContainer.style.display = 'flex';
            this.storyboardContainer.classList.remove('hidden');

            // Render storyboard if we have keyframes
            if (this.gallery && this.gallery.children.length > 0) {
                this.renderStoryboardSidebar();
                // Select first frame if none selected
                if (!this.selectedStoryboardFrame) {
                    const firstFrame = this.storyboardFrames.firstElementChild;
                    if (firstFrame) {
                        this.selectStoryboardFrame(firstFrame);
                    }
                }
            }
        }
    }

    // Project Management Methods
    async checkProjectLoad() {
        const urlParams = new URLSearchParams(window.location.search);
        const projectId = urlParams.get('project');

        if (projectId) {
            try {
                console.log('Loading project:', projectId);
                await this.loadProject(projectId);
            } catch (error) {
                console.error('Failed to load project:', error);
                this.showError('Failed to load project. Redirecting to dashboard...');
                setTimeout(() => {
                    window.location.href = '/';
                }, 2000);
            }
        }
    }

    async loadProject(projectId) {
        try {
            this.showLoading('Loading project...');

            const response = await fetch(`/api/projects/${projectId}`);
            const data = await response.json();

            if (!data.success) {
                throw new Error(data.error || 'Failed to load project');
            }

            this.currentProject = data.project;

            // Restore project data
            this.currentSessionId = this.currentProject.sessionId;
            this.keyframeNames = new Map(Object.entries(this.currentProject.keyframeNames || {}));
            this.keyframeNotes = new Map(Object.entries(this.currentProject.keyframeNotes || {}));
            this.selectedKeyframes = new Set(this.currentProject.selectedKeyframes || []);
            this.videoDuration = this.currentProject.videoDuration;

            // Simulate the results from extraction
            const mockResult = {
                keyframes: this.currentProject.keyframes.map(kf => ({
                    filename: kf.filename,
                    url: kf.url,
                    timestamp: kf.timestamp
                })),
                duration: this.currentProject.videoDuration,
                sessionId: this.currentProject.sessionId
            };

            // Restore frame metadata
            this.frameMetadata.clear();
            this.currentProject.keyframes.forEach((keyframe, index) => {
                this.frameMetadata.set(keyframe.filename, {
                    timestamp: keyframe.timestamp,
                    index: index,
                    sessionId: this.currentProject.sessionId
                });
            });

            // Show results
            this.showResults(mockResult);

            // Update section title with project name
            this.updateSectionTitle();

            console.log('Project loaded successfully:', this.currentProject.name);

        } catch (error) {
            console.error('Error loading project:', error);
            throw error;
        }
    }

    async saveProject() {
        try {
            if (!this.currentSessionId || !this.gallery || this.gallery.children.length === 0) {
                this.showError('No keyframes to save. Please extract keyframes first.');
                return;
            }

            // Show loading state
            const originalText = this.saveProjectBtn.innerHTML;
            this.saveProjectBtn.disabled = true;
            this.saveProjectBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

            // Gather project data
            const keyframes = Array.from(this.gallery.children).map((item, index) => {
                const img = item.querySelector('img');
                const checkbox = item.querySelector('input[type="checkbox"]');
                const filename = checkbox ? checkbox.value : '';
                const metadata = this.frameMetadata.get(filename);

                return {
                    filename: filename,
                    url: img ? img.src : '',
                    timestamp: metadata ? metadata.timestamp : index * 2
                };
            });

            // Get first keyframe as thumbnail
            const firstKeyframe = keyframes[0];
            const thumbnail = firstKeyframe ? firstKeyframe.url : null;

            const projectData = {
                name: this.currentProject ? this.currentProject.name : this.generateProjectName(),
                description: this.currentProject ? this.currentProject.description : '',
                videoSource: this.getVideoSource(),
                sessionId: this.currentSessionId,
                keyframes: keyframes,
                frameCount: keyframes.length,
                videoDuration: this.videoDuration || 0,
                thumbnail: thumbnail,
                keyframeNames: Object.fromEntries(this.keyframeNames),
                keyframeNotes: Object.fromEntries(this.keyframeNotes),
                selectedKeyframes: Array.from(this.selectedKeyframes)
            };

            let response;
            if (this.currentProject) {
                // Update existing project
                response = await fetch(`/api/projects/${this.currentProject.id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(projectData)
                });
            } else {
                // Create new project
                response = await fetch('/api/projects', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(projectData)
                });
            }

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (data.success) {
                this.currentProject = data.project;
                this.showTemporaryMessage(this.currentProject ? 'Project updated successfully!' : 'Project saved successfully!');

                // Update URL to include project ID
                const newUrl = new URL(window.location);
                newUrl.searchParams.set('project', this.currentProject.id);
                window.history.replaceState({}, '', newUrl);

                // Update section title with project name
                this.updateSectionTitle();

                // Ensure results section is visible after save
                this.resultsSection.classList.remove('hidden');
            } else {
                throw new Error(data.error || 'Unknown error occurred');
            }

        } catch (error) {
            console.error('Failed to save project:', error);
            this.showError('Failed to save project: ' + error.message);
        } finally {
            // Restore button state
            this.saveProjectBtn.disabled = false;
            this.saveProjectBtn.innerHTML = originalText;
        }
    }

    generateProjectName() {
        const now = new Date();
        const timestamp = now.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        return `Video Project - ${timestamp}`;
    }

    getVideoSource() {
        // Try to get video source from the current session
        const activeTab = document.querySelector('.tab-btn.active');
        if (activeTab) {
            if (activeTab.dataset.tab === 'url') {
                return this.videoUrlInput.value || 'URL Source';
            } else {
                const file = this.videoFileInput.files[0];
                return file ? file.name : 'File Upload';
            }
        }
        return 'Unknown Source';
    }

    goBackToProjects() {
        window.location.href = '/';
    }

    renderStoryboardSidebar() {
        // Clear existing frames
        this.storyboardFrames.innerHTML = '';

        // Get all gallery items and convert to sidebar frames
        const galleryItems = Array.from(this.gallery.children);

        galleryItems.forEach((galleryItem, index) => {
            const img = galleryItem.querySelector('img');
            const checkbox = galleryItem.querySelector('input[type="checkbox"]');
            const filename = checkbox ? checkbox.value : '';

            if (!img) return;

            // Create storyboard frame element
            const frameElement = document.createElement('div');
            frameElement.className = 'storyboard-frame-item';
            frameElement.dataset.filename = filename;
            frameElement.dataset.index = index;

            // Add selected class if this frame was selected in gallery
            if (checkbox && checkbox.checked) {
                frameElement.classList.add('selected');
            }

            frameElement.innerHTML = `
                <img src="${img.src}" alt="Frame ${index + 1}" loading="lazy" class="storyboard-frame-thumb">
                <div class="storyboard-frame-info">
                    <div class="storyboard-frame-title">${this.getKeyframeName(filename) || `Frame ${index + 1}`}</div>
                    <div class="storyboard-frame-meta">
                        <span>${this.formatTimestamp(this.getFrameTimestamp(filename))}</span>
                        <span class="storyboard-frame-index">${index + 1}</span>
                    </div>
                </div>
            `;

            // Add click handler for frame selection
            frameElement.addEventListener('click', () => {
                this.selectStoryboardFrame(frameElement);
            });

            this.storyboardFrames.appendChild(frameElement);
        });
    }

    selectStoryboardFrame(frameElement) {
        // Remove active class from all frames
        this.storyboardFrames.querySelectorAll('.storyboard-frame-item').forEach(frame => {
            frame.classList.remove('active');
        });

        // Add active class to selected frame
        frameElement.classList.add('active');
        this.selectedStoryboardFrame = frameElement;

        // Render the main frame view
        this.renderStoryboardMain(frameElement);
    }

    renderStoryboardMain(frameElement) {
        const img = frameElement.querySelector('img');
        const filename = frameElement.dataset.filename;
        const index = parseInt(frameElement.dataset.index);

        if (!img) return;

        // Clear and populate main frame container
        this.mainFrameContainer.innerHTML = `
            <img src="${img.src}" alt="Frame ${index + 1}" class="main-frame-image">
            <div class="main-frame-overlay">
                <button class="action-btn small" onclick="app.openImageModal('${img.src}', '${filename}')" title="View Full Size">
                    <i class="fas fa-expand"></i>
                    Full Size
                </button>
            </div>
        `;

        // Clear and populate main frame details
        this.mainFrameDetails.innerHTML = `
            <div class="main-frame-header">
                <div class="main-frame-title-section">
                    <h3 class="main-frame-title">Frame ${index + 1}</h3>
                </div>
                <div class="main-frame-actions">
                    <button class="action-btn small" onclick="app.toggleFrameSelection('${filename}')" 
                            title="${frameElement.classList.contains('selected') ? 'Deselect' : 'Select'} Frame">
                        <i class="fas fa-${frameElement.classList.contains('selected') ? 'check-square' : 'square'}"></i>
                        ${frameElement.classList.contains('selected') ? 'Selected' : 'Select'}
                    </button>
                    <button class="action-btn small" onclick="app.downloadSingleFrame('${filename}')" title="Download Frame">
                        <i class="fas fa-download"></i>
                        Download
                    </button>
                </div>
            </div>
            
            <div class="main-frame-metadata">
                <div class="metadata-item">
                    <strong>Timestamp:</strong> ${this.formatTimestamp(this.getFrameTimestamp(filename))}
                </div>
                <div class="metadata-item">
                    <strong>Filename:</strong> ${filename}
                </div>
            </div>

            <div class="main-frame-title-section">
                <label for="frameTitle" class="notes-label">
                    <i class="fas fa-tag"></i>
                    Frame Title
                </label>
                <input type="text" id="frameTitle" class="main-frame-title-input" 
                       value="${this.getKeyframeName(filename) || ''}" 
                       placeholder="Enter frame title..."
                       onchange="app.updateFrameTitle('${filename}', this.value)">
            </div>

            <div class="main-frame-notes">
                <label for="frameNotes" class="notes-label">
                    <i class="fas fa-sticky-note"></i>
                    Notes
                </label>
                <textarea id="frameNotes" class="main-frame-notes-textarea" 
                          placeholder="Add notes for this frame..."
                          onchange="app.updateFrameNotes('${filename}', this.value)">${this.keyframeNotes.get(filename) || ''}</textarea>
                <div class="notes-char-count">
                    <span id="frameNotesCount">${(this.keyframeNotes.get(filename) || '').length}</span>/500 characters
                </div>
            </div>
        `;

        // Update character count for notes
        const notesTextarea = document.getElementById('frameNotes');
        if (notesTextarea) {
            notesTextarea.addEventListener('input', () => {
                const count = notesTextarea.value.length;
                document.getElementById('frameNotesCount').textContent = count;

                // Limit to 500 characters
                if (count > 500) {
                    notesTextarea.value = notesTextarea.value.substring(0, 500);
                    document.getElementById('frameNotesCount').textContent = '500';
                }
            });
        }
    }

    updateFrameTitle(filename, title) {
        if (title.trim()) {
            this.keyframeNames.set(filename, title.trim());
        } else {
            this.keyframeNames.delete(filename);
        }

        // Update the sidebar frame title
        const sidebarFrame = this.storyboardFrames.querySelector(`[data-filename="${filename}"]`);
        if (sidebarFrame) {
            const frameTitle = sidebarFrame.querySelector('.storyboard-frame-title');
            if (frameTitle) {
                const index = parseInt(sidebarFrame.dataset.index);
                frameTitle.textContent = title.trim() || `Frame ${index + 1}`;
            }
        }

        // Also update gallery view if title was changed
        this.updateGalleryItemTitle(filename, title);
    }

    updateFrameNotes(filename, notes) {
        if (notes.trim()) {
            this.keyframeNotes.set(filename, notes.trim());
        } else {
            this.keyframeNotes.delete(filename);
        }
    }

    toggleFrameSelection(filename) {
        // Find the corresponding gallery checkbox and toggle it
        const galleryCheckbox = this.gallery.querySelector(`input[value="${filename}"]`);
        if (galleryCheckbox) {
            galleryCheckbox.checked = !galleryCheckbox.checked;

            // Update selection state
            if (galleryCheckbox.checked) {
                this.selectedKeyframes.add(filename);
            } else {
                this.selectedKeyframes.delete(filename);
            }

            // Update selection UI
            this.updateSelectionUI();

            // Update storyboard frame appearance
            const storyboardFrame = this.storyboardFrames.querySelector(`[data-filename="${filename}"]`);
            if (storyboardFrame) {
                storyboardFrame.classList.toggle('selected', galleryCheckbox.checked);
            }

            // Update the main frame actions if this is the currently selected frame
            if (this.selectedStoryboardFrame && this.selectedStoryboardFrame.dataset.filename === filename) {
                this.renderStoryboardMain(this.selectedStoryboardFrame);
            }
        }
    }

    getFrameTimestamp(filename) {
        const metadata = this.frameMetadata.get(filename);
        return metadata ? metadata.timestamp : 0;
    }

    formatTimestamp(seconds) {
        if (typeof seconds !== 'number' || isNaN(seconds)) {
            return '00:00';
        }

        const minutes = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    // Project Management Methods
    async checkProjectLoad() {
        const urlParams = new URLSearchParams(window.location.search);
        const projectId = urlParams.get('project');

        if (projectId) {
            try {
                await this.loadProject(projectId);
            } catch (error) {
                console.error('Failed to load project:', error);
                this.showError('Failed to load project: ' + error.message);
            }
        }
    }

    async loadProject(projectId) {
        try {
            this.showLoading('Loading project...');

            const response = await fetch(`/api/projects/${projectId}`);
            const data = await response.json();

            if (!data.success) {
                throw new Error(data.error || 'Failed to load project');
            }

            this.currentProject = data.project;

            // Restore project data
            this.currentSessionId = this.currentProject.sessionId;
            this.keyframeNames = new Map(Object.entries(this.currentProject.keyframeNames || {}));
            this.keyframeNotes = new Map(Object.entries(this.currentProject.keyframeNotes || {}));
            this.selectedKeyframes = new Set(this.currentProject.selectedKeyframes || []);

            // Create result object from project data
            const result = {
                sessionId: this.currentProject.sessionId,
                keyframes: this.currentProject.keyframes,
                duration: this.currentProject.videoDuration,
                frameCount: this.currentProject.frameCount
            };

            // Show results
            this.showResults(result);

            // Update save button to show "Update Project"
            if (this.saveProjectBtn) {
                this.saveProjectBtn.innerHTML = '<i class="fas fa-save"></i> Update Project';
            }

            // Update section title with project name
            this.updateSectionTitle();

            console.log('Project loaded successfully:', this.currentProject.name);

        } catch (error) {
            console.error('Error loading project:', error);
            throw error;
        } finally {
            this.hideLoading();
        }
    }

    async saveProject() {
        if (!this.currentSessionId || !this.gallery.children.length) {
            this.showError('No keyframes to save. Please extract keyframes first.');
            return;
        }

        const projectName = prompt(
            this.currentProject
                ? `Update project name (current: ${this.currentProject.name}):`
                : 'Enter project name:',
            this.currentProject?.name || 'My Video Project'
        );

        if (!projectName || projectName.trim() === '') {
            return;
        }

        try {
            this.showLoading('Saving project...');

            // Collect keyframes data
            const keyframes = Array.from(this.gallery.children).map((item, index) => {
                const img = item.querySelector('img');
                const filename = item.dataset.filename || '';
                return {
                    filename: filename,
                    url: img?.src || '',
                    timestamp: this.getFrameTimestamp(filename) || index * 2,
                    index: index
                };
            });

            // Get the first keyframe as thumbnail
            const thumbnail = keyframes.length > 0 ? keyframes[0].url : null;

            // Prepare project data
            const projectData = {
                name: projectName.trim(),
                description: `Video project with ${keyframes.length} keyframes`,
                videoSource: this.getVideoSource(),
                sessionId: this.currentSessionId,
                keyframes: keyframes,
                frameCount: keyframes.length,
                videoDuration: this.videoDuration || 0,
                thumbnail: thumbnail,
                keyframeNames: Object.fromEntries(this.keyframeNames),
                keyframeNotes: Object.fromEntries(this.keyframeNotes),
                selectedKeyframes: Array.from(this.selectedKeyframes)
            };

            let response;
            if (this.currentProject) {
                // Update existing project
                response = await fetch(`/api/projects/${this.currentProject.id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(projectData)
                });
            } else {
                // Create new project
                response = await fetch('/api/projects', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(projectData)
                });
            }

            const result = await response.json();

            if (result.success) {
                this.currentProject = result.project;

                // Update save button
                if (this.saveProjectBtn) {
                    this.saveProjectBtn.innerHTML = '<i class="fas fa-save"></i> Update Project';
                }

                // Update URL to include project ID
                const newUrl = new URL(window.location);
                newUrl.searchParams.set('project', this.currentProject.id);
                window.history.replaceState({}, '', newUrl);

                this.showTemporaryMessage('Project saved successfully!');
                console.log('Project saved:', this.currentProject.name);

                // Update section title with project name
                this.updateSectionTitle();

                // Ensure results section is visible after save
                this.resultsSection.classList.remove('hidden');
            } else {
                throw new Error(result.error || 'Failed to save project');
            }

        } catch (error) {
            console.error('Error saving project:', error);
            this.showError('Failed to save project: ' + error.message);
        } finally {
            this.hideLoading();
        }
    }

    getVideoSource() {
        // Try to get video source from current form data
        if (this.videoUrlInput && this.videoUrlInput.value) {
            return this.videoUrlInput.value;
        }

        if (this.videoFileInput && this.videoFileInput.files.length > 0) {
            return this.videoFileInput.files[0].name;
        }

        return this.currentProject?.videoSource || 'Unknown source';
    }

    showLoading(message = 'Loading...') {
        if (this.loadingText) {
            this.loadingText.textContent = message;
        }

        this.uploadSection.classList.add('hidden');
        this.resultsSection.classList.add('hidden');
        this.errorSection.classList.add('hidden');
        this.loadingSection.classList.remove('hidden');
    }

    hideLoading() {
        this.loadingSection.classList.add('hidden');
    }

    goBackToProjects() {
        window.location.href = '/dashboard.html';
    }

    async checkServerStatus() {
        try {
            const response = await fetch('/health');
            if (!response.ok) {
                throw new Error('Server not responding');
            }
            console.log('✅ Server is running');
        } catch (error) {
            console.error('❌ Server connection failed:', error);
            this.showError('Cannot connect to the server. Please ensure the backend is running on port 3000.');
        }
    }

    async handleUrlSubmit(e) {
        e.preventDefault();

        const videoUrl = this.videoUrlInput.value.trim();
        if (!videoUrl) {
            this.showError('Please enter a valid video URL.');
            return;
        }

        if (!this.isValidUrl(videoUrl)) {
            this.showError('Please enter a valid URL.');
            return;
        }

        await this.processVideoUrl(videoUrl);
    }

    async handleUploadSubmit(e) {
        e.preventDefault();

        const file = this.videoFileInput.files[0];
        if (!file) {
            this.showError('Please select a video file.');
            return;
        }

        if (!this.isValidVideoFile(file)) {
            this.showError('Please select a valid video file (MP4, AVI, MOV, etc.).');
            return;
        }

        if (file.size > 100 * 1024 * 1024) // 100MB
        {
            this.showError('File size must be less than 100MB.');
            return;
        }

        await this.processVideoFile(file);
    }

    handleFileSelection(file = null) {
        const selectedFile = file || this.videoFileInput.files[0];

        if (selectedFile) {
            const fileName = selectedFile.name;
            this.updateFileDropArea(fileName);
            this.uploadSubmitBtn.disabled = false;
            this.uploadForm.classList.add('file-selected');
        } else {
            this.resetFileDropArea();
            this.uploadSubmitBtn.disabled = true;
            this.uploadForm.classList.remove('file-selected');
        }
    }

    updateFileDropArea(fileName) {
        const content = this.fileDropArea.querySelector('.file-drop-content');
        let fileNameDiv = this.fileDropArea.querySelector('.file-name');

        if (!fileNameDiv) {
            fileNameDiv = document.createElement('div');
            fileNameDiv.className = 'file-name';
            content.appendChild(fileNameDiv);
        }

        fileNameDiv.innerHTML = `
            <i class="fas fa-file-video"></i>
            ${fileName}
        `;
    }

    resetFileDropArea() {
        const fileNameDiv = this.fileDropArea.querySelector('.file-name');
        if (fileNameDiv) {
            fileNameDiv.remove();
        }
    }

    isValidUrl(string) {
        try {
            new URL(string);
            return true;
        } catch (_) {
            return false;
        }
    }

    isValidVideoFile(file) {
        const validTypes = [
            'video/mp4',
            'video/avi',
            'video/quicktime',
            'video/x-msvideo',
            'video/webm',
            'video/x-flv',
            'video/x-matroska'
        ];
        return validTypes.includes(file.type) || file.name.match(/\.(mp4|avi|mov|wmv|flv|webm|mkv)$/i);
    }

    isPlatformUrl(url) {
        const platformPatterns = [
            /youtube\.com/i,
            /youtu\.be/i,
            /vimeo\.com/i,
            /dailymotion\.com/i,
            /twitch\.tv/i,
            /tiktok\.com/i,
            /instagram\.com/i,
            /facebook\.com/i,
            /twitter\.com/i,
            /x\.com/i
        ];

        return platformPatterns.some(pattern => pattern.test(url));
    }

    async processVideoUrl(videoUrl) {
        // Check if it's a YouTube or platform URL and provide appropriate messaging
        const isYouTubeOrPlatform = this.isPlatformUrl(videoUrl);
        const initialMessage = isYouTubeOrPlatform
            ? 'Preparing to download from video platform...'
            : 'Downloading video...';

        this.startProcessing(initialMessage);

        try {
            this.abortController = new AbortController();

            // Get keyframe options from URL tab
            const maxFrames = parseInt(this.urlMaxFrames.value) || 50;
            const includeLastFrame = this.urlIncludeLastFrame.checked;

            const response = await fetch('/api/video/process-url', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    videoUrl,
                    options: {
                        maxFrames: maxFrames === 0 ? null : maxFrames, // null means unlimited
                        includeLastFrame
                    }
                }),
                signal: this.abortController.signal
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `Server error: ${response.status}`);
            }

            const result = await response.json();
            this.handleProcessingSuccess(result);
        } catch (error) {
            if (error.name === 'AbortError') {
                console.log('Processing cancelled');
                this.resetToUpload();
            } else {
                console.error('Processing failed:', error);
                this.showError(error.message || 'Failed to process video URL.');
            }
        } finally {
            this.isProcessing = false;
            this.abortController = null;
        }
    }

    async processVideoFile(file) {
        this.startProcessing('Uploading and processing video...');

        try {
            this.abortController = new AbortController();

            // Get keyframe options from Upload tab
            const maxFrames = parseInt(this.uploadMaxFrames.value) || 50;
            const includeLastFrame = this.uploadIncludeLastFrame.checked;

            const formData = new FormData();
            formData.append('video', file);
            formData.append('options', JSON.stringify({
                maxFrames: maxFrames === 0 ? null : maxFrames, // null means unlimited
                includeLastFrame
            }));

            const response = await fetch('/api/upload/file', {
                method: 'POST',
                body: formData,
                signal: this.abortController.signal
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `Server error: ${response.status}`);
            }

            const result = await response.json();
            this.handleProcessingSuccess(result);
        } catch (error) {
            if (error.name === 'AbortError') {
                console.log('Processing cancelled');
                this.resetToUpload();
            } else {
                console.error('Processing failed:', error);
                this.showError(error.message || 'Failed to process video file.');
            }
        } finally {
            this.isProcessing = false;
            this.abortController = null;
        }
    }

    startProcessing(message) {
        this.isProcessing = true;
        this.hideAllSections();
        this.loadingSection.classList.remove('hidden');
        this.loadingSection.classList.add('fade-in');

        this.updateLoadingProgress(0, message);
        this.simulateProgress();
    }

    simulateProgress() {
        let progress = 0;
        const messages = [
            'Initializing...',
            'Downloading video...',
            'Analyzing video format...',
            'Extracting keyframes...',
            'Processing images...',
            'Finalizing...'
        ];

        // Adjust messages for platform URLs
        const videoUrl = this.videoUrlInput?.value || '';
        if (this.isPlatformUrl(videoUrl)) {
            messages[1] = 'Downloading from video platform...';
            messages[2] = 'Processing platform video...';
        }

        const interval = setInterval(() => {
            if (!this.isProcessing) {
                clearInterval(interval);
                return;
            }

            progress += Math.random() * 15;
            if (progress > 90) progress = 90;

            const messageIndex = Math.floor((progress / 90) * (messages.length - 1));
            this.updateLoadingProgress(progress, messages[messageIndex]);
        }, 800);
    }

    updateLoadingProgress(percentage, message) {
        this.progressFill.style.width = `${percentage}%`;
        this.progressPercentage.textContent = `${Math.round(percentage)}%`;
        this.loadingText.textContent = message;
    }

    handleProcessingSuccess(result) {
        this.currentSessionId = result.sessionId;
        this.updateLoadingProgress(100, 'Complete!');

        setTimeout(() => {
            this.hideAllSections();
            this.showResults(result);
        }, 500);
    }

    showResults(result) {
        // Hide the header when showing results (gallery mode)
        const header = document.querySelector('.header');
        if (header) {
            header.classList.add('gallery-mode');
        }

        this.resultsSection.classList.remove('hidden');
        this.resultsSection.classList.add('slide-up');

        // Update frame count with settings info
        const count = result.keyframes.length;
        const activeTab = document.querySelector('.tab-btn.active').dataset.tab;
        const maxFrames = activeTab === 'url' ?
            parseInt(this.urlMaxFrames.value) :
            parseInt(this.uploadMaxFrames.value);
        const includeLastFrame = activeTab === 'url' ?
            this.urlIncludeLastFrame.checked :
            this.uploadIncludeLastFrame.checked;

        let frameText = `${count} frame${count !== 1 ? 's' : ''}`;

        if (maxFrames > 0 && maxFrames !== 50) {
            frameText += ` (max: ${maxFrames})`;
        } else if (maxFrames === 0) {
            frameText += ` (all keyframes)`;
        }

        if (includeLastFrame && maxFrames > 0) {
            frameText += ` • includes final frame`;
        }

        this.frameCount.textContent = frameText;

        // Reset selection state and custom names
        this.selectedKeyframes.clear();
        this.keyframeNames.clear();
        this.keyframeNotes.clear();
        this.frameMetadata.clear();
        this.frameCache.clear(); // Clear frame cache
        this.videoDuration = result.duration || null; // Store video duration
        this.updateSelectionUI();

        // Clear and populate gallery
        this.gallery.innerHTML = '';
        result.keyframes.forEach((keyframe, index) => {
            const item = this.createKeyframeItem(keyframe, index + 1);
            this.gallery.appendChild(item);

            // Store frame metadata for navigation with actual timestamp if available
            const timestamp = keyframe.timestamp !== undefined ? keyframe.timestamp : index * 2; // Use provided timestamp or fallback
            this.frameMetadata.set(keyframe.filename, {
                timestamp: timestamp,
                index: index,
                sessionId: this.currentSessionId
            });
        });

        // Initialize scroll effects
        setTimeout(() => this.handleGalleryScroll(), 100);

        // If storyboard view is active, update it
        if (this.storyboardContainer.style.display === 'flex') {
            this.renderStoryboardSidebar();
            // Select first frame by default
            const firstFrame = this.storyboardFrames.firstElementChild;
            if (firstFrame) {
                this.selectStoryboardFrame(firstFrame);
            }
        }
    }

    createKeyframeItem(keyframe, index) {
        const item = document.createElement('div');
        item.className = 'keyframe-item';
        item.dataset.filename = keyframe.filename; // Add data attribute for deletion tracking

        // Generate default name and store it
        const galleryItems = Array.from(this.gallery.children);
        const currentPosition = galleryItems.length + 1; // Position where this item will be added
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

        // Bind events
        const downloadBtn = item.querySelector('.download-btn');
        const viewBtn = item.querySelector('.view-btn');
        const image = item.querySelector('.keyframe-image');
        const titleInput = item.querySelector('.keyframe-title-input');
        const notesIndicator = item.querySelector('.notes-indicator');
        const notesContainer = item.querySelector('.keyframe-notes');
        const notesContent = item.querySelector('.notes-content');

        // Update notes display if notes exist
        this.updateKeyframeNotesDisplay(keyframe.filename, notesIndicator, notesContainer, notesContent);

        // Selection toggle on item click
        item.addEventListener('click', (e) => {
            // Don't trigger selection if clicking on buttons or input
            if (e.target.closest('.keyframe-btn') || e.target.closest('.keyframe-title-input')) {
                return;
            }
            this.toggleKeyframeSelection(keyframe.filename, item);
        });

        // Handle title input changes
        titleInput.addEventListener('blur', (e) => {
            // Calculate current index dynamically
            const galleryItems = Array.from(this.gallery.children);
            const currentIndex = galleryItems.indexOf(item) + 1;
            const newName = e.target.value.trim() || `Keyframe ${currentIndex}`;
            this.keyframeNames.set(keyframe.filename, newName);
            e.target.value = newName;

            // Update view button data-title
            viewBtn.dataset.title = newName;
            // Update image alt text
            image.alt = newName;
        });

        titleInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.target.blur();
            }
            // Stop event propagation to prevent selection toggle
            e.stopPropagation();
        });

        // Prevent input click from triggering selection
        titleInput.addEventListener('click', (e) => {
            e.stopPropagation();
        });

        downloadBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const customName = this.keyframeNames.get(keyframe.filename) || 'Keyframe';
            const notes = this.keyframeNotes.get(keyframe.filename);
            this.downloadImageWithCustomName(keyframe.url, keyframe.filename, customName, notes);
        });

        viewBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const customName = this.keyframeNames.get(keyframe.filename) || 'Keyframe';
            this.openModal(keyframe.url, customName);
        });

        // Modal open on image click (but allow selection via item click)
        image.addEventListener('click', (e) => {
            e.stopPropagation();
            const customName = this.keyframeNames.get(keyframe.filename) || 'Keyframe';
            this.openModal(keyframe.url, customName);
        });

        // Add drag and drop functionality for reordering
        this.addDragAndDropHandlers(item, keyframe.filename);

        return item;
    }

    openModal(imageUrl, title) {
        this.modalImage.src = imageUrl;
        this.modalTitle.textContent = title;
        this.imageModal.classList.remove('hidden');
        this.imageModal.classList.add('fade-in');

        // Store current image data for modal actions
        this.currentModalImage = {
            url: imageUrl,
            title: title,
            filename: imageUrl.split('/').pop(),
            isNavigationFrame: false // Regular keyframes are not navigation frames
        };

        // Store the original frame for navigation positioning
        this.originalFrameForNavigation = this.currentModalImage.filename;

        // Hide Save Frame button for regular keyframes
        this.saveFrameBtn.classList.add('hidden');

        // Show frame navigation buttons and progress
        this.framePrevBtn.style.display = 'flex';
        this.frameNextBtn.style.display = 'flex';

        // Show progress indicator if we have video duration
        this.updateFrameProgress();

        // Reset navigation button states
        this.framePrevBtn.disabled = false;
        this.frameNextBtn.disabled = false;

        // Update button states based on current frame
        this.updateNavigationButtonStates();

        document.body.style.overflow = 'hidden';
    }

    closeModal() {
        this.imageModal.classList.add('hidden');
        this.imageModal.classList.remove('fade-in');
        document.body.style.overflow = '';
        this.currentModalImage = null;

        // Hide frame navigation buttons and progress
        this.framePrevBtn.style.display = 'none';
        this.frameNextBtn.style.display = 'none';
        this.frameProgress.classList.add('hidden');

        // Clean up any loading indicators
        this.hideFrameLoading();
    }

    openImageModal(imageUrl, filename) {
        // Find the keyframe title for this filename
        const index = this.findFramePositionInGallery(filename) + 1;
        const title = this.getKeyframeName(filename) || `Frame ${index}`;
        this.openModal(imageUrl, title);
    }

    downloadSingleFrame(filename) {
        // Find the frame in the gallery
        const galleryItem = this.gallery.querySelector(`[data-filename="${filename}"]`);
        if (!galleryItem) return;

        const img = galleryItem.querySelector('img');
        if (!img) return;

        const customName = this.getKeyframeName(filename) || filename;
        const notes = this.keyframeNotes.get(filename);
        this.downloadImageWithCustomName(img.src, filename, customName, notes);
    }

    updateGalleryItemTitle(filename, title) {
        // Find the corresponding gallery item and update its title
        const galleryItem = this.gallery.querySelector(`[data-filename="${filename}"]`);
        if (galleryItem) {
            const titleInput = galleryItem.querySelector('.keyframe-title-input');
            if (titleInput) {
                titleInput.value = title;
            }
        }
    }

    getKeyframeName(filename) {
        return this.keyframeNames.get(filename);
    }

    downloadCurrentImage() {
        if (this.currentModalImage) {
            const customName = this.keyframeNames.get(this.currentModalImage.filename) || this.currentModalImage.title;
            const notes = this.keyframeNotes.get(this.currentModalImage.filename);
            this.downloadImageWithCustomName(this.currentModalImage.url, this.currentModalImage.filename, customName, notes);
        }
    }

    async copyImageUrl() {
        if (this.currentModalImage) {
            try {
                const fullUrl = window.location.origin + this.currentModalImage.url;
                await navigator.clipboard.writeText(fullUrl);
                this.showTemporaryMessage('URL copied to clipboard!');
            } catch (error) {
                console.error('Failed to copy URL:', error);
                this.showTemporaryMessage('Failed to copy URL');
            }
        }
    }

    async saveCurrentNavigationFrame() {
        if (!this.currentModalImage || !this.currentModalImage.isNavigationFrame) {
            this.showTemporaryMessage('No navigation frame to save.');
            return;
        }

        try {
            // Disable the save button during processing
            this.saveFrameBtn.disabled = true;
            this.saveFrameBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

            // Get current metadata
            const metadata = this.frameMetadata.get(this.currentModalImage.filename);
            const timestamp = metadata ? metadata.timestamp : 0;

            // Call backend to save navigation frame
            const response = await fetch(`/api/video/save-nav-frame/${this.currentSessionId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    navFilename: this.currentModalImage.filename,
                    timestamp: timestamp
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || 'Failed to save navigation frame');
            }

            const result = await response.json();

            if (result.success) {
                // Find the original frame that was used for navigation
                const originalFilename = this.getOriginalFrameFromModal();
                const originalIndex = this.findFramePositionInGallery(originalFilename);

                // Insert after the original frame (or at end if not found)
                const insertIndex = originalIndex !== -1 ? originalIndex : this.gallery.querySelectorAll('.keyframe-item').length - 1;

                const savedKeyframe = {
                    filename: result.savedFrame.filename,
                    url: result.savedFrame.url,
                    timestamp: result.savedFrame.timestamp
                };

                // Create new keyframe item
                const keyframeItem = this.createKeyframeItem(savedKeyframe, insertIndex + 2);

                // Mark as saved navigation frame for visual distinction
                keyframeItem.classList.add('saved-nav-frame');

                // Set a descriptive name
                const savedFrameName = `Saved Frame at ${timestamp.toFixed(1)}s`;
                const titleInput = keyframeItem.querySelector('.keyframe-title-input');
                titleInput.value = savedFrameName;
                this.keyframeNames.set(result.savedFrame.filename, savedFrameName);

                // Store metadata
                this.frameMetadata.set(result.savedFrame.filename, {
                    timestamp: timestamp,
                    index: insertIndex + 1,
                    sessionId: this.currentSessionId,
                    savedFromNavigation: true
                });

                // Insert in correct position
                const galleryItems = this.gallery.querySelectorAll('.keyframe-item');
                if (insertIndex >= galleryItems.length - 1) {
                    // Insert at end
                    this.gallery.appendChild(keyframeItem);
                } else {
                    // Insert after the original frame
                    const targetItem = galleryItems[insertIndex];
                    targetItem.parentNode.insertBefore(keyframeItem, targetItem.nextSibling);
                }

                // Add animation
                keyframeItem.style.opacity = '0';
                keyframeItem.style.transform = 'scale(0.8)';

                setTimeout(() => {
                    keyframeItem.style.transition = 'all 0.3s ease';
                    keyframeItem.style.opacity = '1';
                    keyframeItem.style.transform = 'scale(1)';
                }, 50);

                // Update frame count
                this.updateFrameCount();

                // Hide the save button since frame is now saved
                this.saveFrameBtn.classList.add('hidden');

                this.showTemporaryMessage('Navigation frame saved to gallery!');

            } else {
                throw new Error('Server returned unsuccessful save result');
            }

        } catch (error) {
            console.error('Failed to save navigation frame:', error);
            this.showTemporaryMessage('Failed to save frame: ' + error.message);
        } finally {
            // Re-enable save button
            this.saveFrameBtn.disabled = false;
            this.saveFrameBtn.innerHTML = '<i class="fas fa-save"></i> Save Frame';
        }
    }

    // Helper methods for frame positioning
    getOriginalFrameFromModal() {
        // When navigating, we store the original frame filename that was clicked
        // For now, we'll use a simple approach - find the closest original keyframe
        if (this.originalFrameForNavigation) {
            return this.originalFrameForNavigation;
        }

        // Fallback: find the first non-navigation frame in gallery
        const galleryItems = this.gallery.querySelectorAll('.keyframe-item');
        for (const item of galleryItems) {
            const filename = item.dataset.filename;
            if (!filename.startsWith('nav_') && !filename.startsWith('saved_frame_') && !filename.startsWith('clone_')) {
                return filename;
            }
        }
        return null;
    }

    findFramePositionInGallery(filename) {
        if (!filename) return -1;

        const galleryItems = this.gallery.querySelectorAll('.keyframe-item');
        for (let i = 0; i < galleryItems.length; i++) {
            if (galleryItems[i].dataset.filename === filename) {
                return i;
            }
        }
        return -1;
    }

    // Helper method to create a compact drag image
    createCompactDragImage(originalItem) {
        const img = originalItem.querySelector('img');
        const title = originalItem.querySelector('.keyframe-title')?.textContent || 'Frame';

        // Create compact drag preview
        const dragPreview = document.createElement('div');
        dragPreview.style.cssText = `
            position: absolute;
            top: -1000px;
            left: -1000px;
            width: 150px;
            background: white;
            border: 2px solid var(--primary-color);
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            padding: 8px;
            font-family: inherit;
            z-index: 9999;
            transform: rotate(3deg);
            opacity: 0.95;
        `;

        // Add thumbnail
        if (img) {
            const thumbnail = document.createElement('img');
            thumbnail.src = img.src;
            thumbnail.style.cssText = `
                width: 100%;
                height: 80px;
                object-fit: cover;
                border-radius: 4px;
                margin-bottom: 4px;
            `;
            dragPreview.appendChild(thumbnail);
        }

        // Add title
        const titleEl = document.createElement('div');
        titleEl.textContent = title.length > 20 ? title.substring(0, 17) + '...' : title;
        titleEl.style.cssText = `
            font-size: 12px;
            font-weight: 600;
            color: var(--text-primary);
            text-align: center;
            white-space: nowrap;
            overflow: hidden;
        `;
        dragPreview.appendChild(titleEl);

        // Add drag indicator
        const indicator = document.createElement('div');
        indicator.innerHTML = '↔️ Moving';
        indicator.style.cssText = `
            font-size: 10px;
            color: var(--primary-color);
            text-align: center;
            margin-top: 2px;
            font-weight: 500;
        `;
        dragPreview.appendChild(indicator);

        return dragPreview;
    }

    // Drag and Drop functionality for reordering frames
    addDragAndDropHandlers(item, filename) {
        // Make the item draggable
        item.draggable = true;

        // Drag start
        item.addEventListener('dragstart', (e) => {
            // Don't allow dragging if clicking on buttons or input
            if (e.target.closest('.keyframe-btn') || e.target.closest('.keyframe-title-input')) {
                e.preventDefault();
                return;
            }

            item.classList.add('dragging');
            this.gallery.classList.add('drag-active'); // Add gallery-wide drag state
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', filename);

            // Create compact drag image
            const dragImage = this.createCompactDragImage(item);
            document.body.appendChild(dragImage);
            e.dataTransfer.setDragImage(dragImage, 75, 40);

            // Clean up drag image
            setTimeout(() => {
                if (dragImage.parentNode) {
                    dragImage.parentNode.removeChild(dragImage);
                }
            }, 0);
        });

        // Drag end
        item.addEventListener('dragend', (e) => {
            item.classList.remove('dragging');
            this.gallery.classList.remove('drag-active'); // Remove gallery-wide drag state
            this.clearDragIndicators();
        });

        // Drag over
        item.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';

            // Add visual indicator
            const draggingItem = this.gallery.querySelector('.dragging');
            if (draggingItem && draggingItem !== item) {
                // Clear any existing indicators on other items
                this.gallery.querySelectorAll('.keyframe-item').forEach(otherItem => {
                    if (otherItem !== item) {
                        otherItem.classList.remove('drop-before', 'drop-after');
                    }
                });

                const rect = item.getBoundingClientRect();
                const midpoint = rect.top + rect.height / 2;

                if (e.clientY < midpoint) {
                    item.classList.add('drop-before');
                    item.classList.remove('drop-after');
                } else {
                    item.classList.add('drop-after');
                    item.classList.remove('drop-before');
                }
            }
        });

        // Drag leave
        item.addEventListener('dragleave', (e) => {
            // Only clear if we're actually leaving the item
            const rect = item.getBoundingClientRect();
            if (e.clientX < rect.left || e.clientX > rect.right ||
                e.clientY < rect.top || e.clientY > rect.bottom) {
                item.classList.remove('drop-before', 'drop-after');
            }
        });

        // Drop
        item.addEventListener('drop', (e) => {
            e.preventDefault();
            const draggedFilename = e.dataTransfer.getData('text/plain');
            const draggedItem = this.gallery.querySelector(`[data-filename="${draggedFilename}"]`);

            if (draggedItem && draggedItem !== item) {
                const rect = item.getBoundingClientRect();
                const midpoint = rect.top + rect.height / 2;
                const insertBefore = e.clientY < midpoint;

                this.reorderFrames(draggedItem, item, insertBefore);
            }

            this.clearDragIndicators();
        });
    }

    clearDragIndicators() {
        const items = this.gallery.querySelectorAll('.keyframe-item');
        items.forEach(item => {
            item.classList.remove('drop-before', 'drop-after', 'dragging');
        });
        // Also remove gallery-wide drag state
        this.gallery.classList.remove('drag-active');
    }

    reorderFrames(draggedItem, targetItem, insertBefore) {
        // Get current positions
        const allItems = Array.from(this.gallery.querySelectorAll('.keyframe-item'));
        const draggedIndex = allItems.indexOf(draggedItem);
        const targetIndex = allItems.indexOf(targetItem);

        if (draggedIndex === -1 || targetIndex === -1) return;

        // Remove dragged item temporarily
        draggedItem.remove();

        // Insert at new position
        if (insertBefore) {
            targetItem.parentNode.insertBefore(draggedItem, targetItem);
        } else {
            const nextSibling = targetItem.nextSibling;
            if (nextSibling) {
                targetItem.parentNode.insertBefore(draggedItem, nextSibling);
            } else {
                targetItem.parentNode.appendChild(draggedItem);
            }
        }

        // Update metadata indices
        this.updateFrameIndices();

        // Show feedback
        this.showTemporaryMessage('Frame reordered successfully!');

        // Add prominent success animation
        draggedItem.style.transition = 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
        draggedItem.style.transform = 'scale(1.08)';
        draggedItem.style.boxShadow = '0 8px 25px rgba(99, 102, 241, 0.4)';

        setTimeout(() => {
            draggedItem.style.transform = '';
            draggedItem.style.boxShadow = '';
            // Reset transition after animation
            setTimeout(() => {
                draggedItem.style.transition = '';
            }, 400);
        }, 300);
    }

    updateFrameIndices() {
        const items = this.gallery.querySelectorAll('.keyframe-item');
        items.forEach((item, index) => {
            const filename = item.dataset.filename;
            const metadata = this.frameMetadata.get(filename);
            if (metadata) {
                metadata.index = index;
                this.frameMetadata.set(filename, metadata);
            }

            // Update keyframe names if they follow the default pattern
            const titleInput = item.querySelector('.keyframe-title-input');
            const currentName = this.keyframeNames.get(filename);
            if (titleInput && currentName && currentName.match(/^Keyframe \d+$/)) {
                // Only update if it's still using the default naming pattern
                const newName = `Keyframe ${index + 1}`;
                this.keyframeNames.set(filename, newName);
                titleInput.value = newName;

                // Update other elements that reference the name
                const viewBtn = item.querySelector('.view-btn');
                const image = item.querySelector('.keyframe-image');
                if (viewBtn) viewBtn.dataset.title = newName;
                if (image) image.alt = newName;
            }
        });
    }

    downloadImage(url, filename) {
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    downloadImageWithCustomName(url, originalFilename, customName, notes = null) {
        // Get file extension from original filename
        const extension = originalFilename.split('.').pop();
        // Create safe filename from custom name
        let safeCustomName = customName.replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '_');

        // Add notes to filename if present
        if (notes && notes.trim()) {
            const safeNotes = notes.substring(0, 50).replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '_');
            safeCustomName += `_${safeNotes}`;
        }

        const customFilename = `${safeCustomName}.${extension}`;

        const link = document.createElement('a');
        link.href = url;
        link.download = customFilename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    async downloadAllKeyframes() {
        if (!this.currentSessionId) return;

        try {
            const response = await fetch(`/api/video/keyframes/${this.currentSessionId}/base64`);
            if (!response.ok) {
                throw new Error('Failed to fetch keyframes');
            }

            const result = await response.json();

            // Create a simple download of all images as separate files
            result.keyframes.forEach((keyframe, index) => {
                setTimeout(() => {
                    const customName = this.keyframeNames.get(keyframe.filename) || `Keyframe ${index + 1}`;
                    const notes = this.keyframeNotes.get(keyframe.filename);
                    const extension = keyframe.filename.split('.').pop();

                    let safeCustomName = customName.replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '_');

                    // Add notes to filename if present
                    if (notes && notes.trim()) {
                        const safeNotes = notes.substring(0, 50).replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '_');
                        safeCustomName += `_${safeNotes}`;
                    }

                    const customFilename = `${safeCustomName}.${extension}`;

                    const link = document.createElement('a');
                    link.href = keyframe.data;
                    link.download = customFilename;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                }, index * 200); // Stagger downloads
            });

            this.showTemporaryMessage(`Downloading ${result.keyframes.length} keyframes...`);
        } catch (error) {
            console.error('Failed to download all keyframes:', error);
            this.showError('Failed to download keyframes.');
        }
    }

    cancelProcessing() {
        if (this.abortController) {
            this.abortController.abort();
        }
        this.isProcessing = false;
    }

    resetToUpload() {
        this.currentSessionId = null;
        this.isProcessing = false;
        this.abortController = null;
        this.currentProject = null; // Clear current project

        // Show the header when returning to upload mode
        const header = document.querySelector('.header');
        if (header) {
            header.classList.remove('gallery-mode');
        }

        // Reset section title
        this.updateSectionTitle();

        // Reset selection state
        this.selectedKeyframes.clear();
        this.updateSelectionUI();

        // Reset custom keyframe names
        this.keyframeNames.clear();

        // Reset keyframe notes
        this.keyframeNotes.clear();

        // Reset frame metadata
        this.frameMetadata.clear();

        // Clear any preview timeouts
        if (this.previewTimeout) {
            clearTimeout(this.previewTimeout);
            this.previewTimeout = null;
        }

        // Reset forms
        this.urlForm.reset();
        this.uploadForm.reset();
        this.handleFileSelection(); // Reset file selection state

        // Show upload section
        this.hideAllSections();
        this.uploadSection.classList.remove('hidden');
        this.uploadSection.classList.add('fade-in');
    }

    showError(message) {
        this.hideAllSections();
        this.errorSection.classList.remove('hidden');
        this.errorSection.classList.add('slide-up');
        this.errorMessage.textContent = message;
    }

    hideAllSections() {
        [this.uploadSection, this.loadingSection, this.resultsSection, this.errorSection].forEach(section => {
            section.classList.add('hidden');
            section.classList.remove('fade-in', 'slide-up');
        });
    }

    showTemporaryMessage(message) {
        // Create temporary notification
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 2rem;
            right: 2rem;
            background: var(--accent-color);
            color: white;
            padding: 1rem 1.5rem;
            border-radius: var(--radius-lg);
            box-shadow: var(--shadow-lg);
            z-index: 1001;
            animation: slideInRight 0.3s ease-out;
        `;
        notification.textContent = message;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease-in forwards';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    showDebouncedNavigationMessage(message) {
        const currentTime = Date.now();

        // Clear any existing timeout
        if (this.navigationMessageTimeout) {
            clearTimeout(this.navigationMessageTimeout);
        }

        // Only show message if enough time has passed since last navigation (2 seconds)
        if (currentTime - this.lastNavigationTime > 2000) {
            this.showTemporaryMessage(message);
            this.lastNavigationTime = currentTime;
        } else {
            // Update last navigation time but don't show message
            this.lastNavigationTime = currentTime;

            // Set timeout to show message if user stops navigating for 2 seconds
            this.navigationMessageTimeout = setTimeout(() => {
                this.showTemporaryMessage('Navigation complete');
            }, 2000);
        }
    }

    // Cookie Management Methods
    async checkCookieStatus() {
        try {
            const response = await fetch('/api/cookies/status');
            const result = await response.json();

            if (result.hasCookies) {
                this.updateCookieStatus(true, 'YouTube cookies loaded', result.stats);
            } else {
                this.updateCookieStatus(false, 'No YouTube cookies found');
            }
        } catch (error) {
            console.error('Failed to check cookie status:', error);
            this.updateCookieStatus(false, 'Unable to check cookie status');
        }
    }

    updateCookieStatus(hasCookies, message, stats = null) {
        this.statusIndicator.className = `status-indicator ${hasCookies ? 'connected' : 'disconnected'}`;
        this.statusText.textContent = message;

        if (hasCookies) {
            this.cookieActions.style.display = 'flex';
            if (stats) {
                const age = Math.floor(stats.age / (1000 * 60 * 60 * 24));
                this.statusText.textContent += ` (${age} days old)`;
            }
        } else {
            this.cookieActions.style.display = 'none';
        }
    }

    async handleCookieUpload() {
        const file = this.cookieFile.files[0];
        if (!file) {
            this.showError('Please select a cookie file to upload.');
            return;
        }

        if (!file.name.endsWith('.txt')) {
            this.showError('Please select a .txt cookie file.');
            return;
        }

        try {
            const formData = new FormData();
            formData.append('cookies', file);

            const response = await fetch('/api/cookies/upload', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `Upload failed: ${response.status}`);
            }

            const result = await response.json();
            this.showTemporaryMessage('Cookie file uploaded successfully!');
            this.checkCookieStatus();

            // Reset file input
            this.cookieFile.value = '';
            this.uploadCookieBtn.disabled = true;
            this.uploadCookieBtn.innerHTML = '<i class="fas fa-upload"></i> Upload Cookies';

        } catch (error) {
            console.error('Cookie upload failed:', error);
            this.showError(error.message || 'Failed to upload cookie file.');
        }
    }

    async handleClearCookies() {
        if (!confirm('Are you sure you want to clear the stored YouTube cookies?')) {
            return;
        }

        try {
            const response = await fetch('/api/cookies/clear', {
                method: 'DELETE'
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `Clear failed: ${response.status}`);
            }

            this.showTemporaryMessage('Cookies cleared successfully!');
            this.checkCookieStatus();

        } catch (error) {
            console.error('Failed to clear cookies:', error);
            this.showError(error.message || 'Failed to clear cookies.');
        }
    }

    // Delete keyframe functionality
    async deleteKeyframe(filename, itemElement) {
        if (!confirm('Are you sure you want to remove this keyframe?')) {
            return;
        }

        try {
            const response = await fetch(`/api/video/keyframes/${this.currentSessionId}/${filename}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error('Failed to delete keyframe');
            }

            // Remove the item from the DOM with animation
            itemElement.style.transition = 'all 0.3s ease';
            itemElement.style.transform = 'scale(0.8)';
            itemElement.style.opacity = '0';

            setTimeout(() => {
                itemElement.remove();
                this.updateFrameCount();
            }, 300);

            this.showTemporaryMessage('Keyframe removed successfully!');

        } catch (error) {
            console.error('Failed to delete keyframe:', error);
            this.showError('Failed to remove keyframe.');
        }
    }

    // Update frame count after deletion
    updateFrameCount() {
        const remainingFrames = this.gallery.querySelectorAll('.keyframe-item').length;

        const activeTab = document.querySelector('.tab-btn.active').dataset.tab;
        const maxFrames = activeTab === 'url' ?
            parseInt(this.urlMaxFrames.value) :
            parseInt(this.uploadMaxFrames.value);
        const includeLastFrame = activeTab === 'url' ?
            this.urlIncludeLastFrame.checked :
            this.uploadIncludeLastFrame.checked;

        let frameText = `${remainingFrames} frame${remainingFrames !== 1 ? 's' : ''}`;

        if (maxFrames > 0 && maxFrames !== 50) {
            frameText += ` (originally max: ${maxFrames})`;
        } else if (maxFrames === 0) {
            frameText += ` (originally all keyframes)`;
        }

        if (includeLastFrame && maxFrames > 0) {
            frameText += ` • included final frame`;
        }

        this.frameCount.textContent = frameText;
    }

    // Update section title to show project name
    updateSectionTitle() {
        if (!this.sectionTitle) return;

        if (this.currentProject && this.currentProject.name) {
            this.sectionTitle.textContent = `StoryboardR - ${this.currentProject.name}`;
        } else {
            this.sectionTitle.textContent = 'StoryboardR';
        }
    }

    handleGalleryScroll() {
        if (!this.gallery || !this.galleryContainer) return;

        const { scrollTop, scrollHeight, clientHeight } = this.galleryContainer;
        const scrollFromTop = scrollTop;
        const scrollFromBottom = scrollHeight - clientHeight - scrollTop;

        // Add fade effects based on scroll position
        if (scrollFromTop > 10) {
            this.galleryContainer.classList.add('scrolled-top');
        } else {
            this.galleryContainer.classList.remove('scrolled-top');
        }

        if (scrollFromBottom > 10) {
            this.galleryContainer.classList.add('scrolled-bottom');
        } else {
            this.galleryContainer.classList.remove('scrolled-bottom');
        }
    }

    // Selection Management Methods
    toggleKeyframeSelection(filename, itemElement) {
        if (this.selectedKeyframes.has(filename)) {
            this.selectedKeyframes.delete(filename);
            itemElement.classList.remove('selected');
            itemElement.querySelector('.selection-indicator i').className = 'fas fa-circle';
        } else {
            this.selectedKeyframes.add(filename);
            itemElement.classList.add('selected');
            itemElement.querySelector('.selection-indicator i').className = 'fas fa-check';
        }
        this.updateSelectionUI();
    }

    selectAllKeyframes() {
        const keyframeItems = this.gallery.querySelectorAll('.keyframe-item');
        keyframeItems.forEach(item => {
            const filename = item.dataset.filename;
            this.selectedKeyframes.add(filename);
            item.classList.add('selected');
            item.querySelector('.selection-indicator i').className = 'fas fa-check';
        });
        this.updateSelectionUI();
    }

    deselectAllKeyframes() {
        const keyframeItems = this.gallery.querySelectorAll('.keyframe-item');
        keyframeItems.forEach(item => {
            const filename = item.dataset.filename;
            this.selectedKeyframes.delete(filename);
            item.classList.remove('selected');
            item.querySelector('.selection-indicator i').className = 'fas fa-circle';
        });
        this.updateSelectionUI();
    }

    updateSelectionUI() {
        const selectedCount = this.selectedKeyframes.size;

        if (selectedCount > 0) {
            this.selectionInfo.classList.remove('hidden');
            this.selectedCount.textContent = `${selectedCount} selected`;
            this.deleteSelectedBtn.disabled = false;
            this.addNotesBtn.disabled = false;
            this.addKeyframeBtn.disabled = false;
        } else {
            this.selectionInfo.classList.add('hidden');
            this.deleteSelectedBtn.disabled = true;
            this.addNotesBtn.disabled = true;
            this.addKeyframeBtn.disabled = true;
        }

        // Update select/deselect all button states
        const totalItems = this.gallery.querySelectorAll('.keyframe-item').length;
        this.selectAllBtn.disabled = selectedCount === totalItems;
        this.deselectAllBtn.disabled = selectedCount === 0;
    }

    async deleteSelectedKeyframes() {
        const selectedCount = this.selectedKeyframes.size;

        if (selectedCount === 0) return;

        const confirmMessage = `Are you sure you want to delete ${selectedCount} selected keyframe${selectedCount !== 1 ? 's' : ''}?`;
        if (!confirm(confirmMessage)) {
            return;
        }

        const selectedFilenames = Array.from(this.selectedKeyframes);
        const failures = [];

        // Delete keyframes one by one
        for (const filename of selectedFilenames) {
            try {
                const response = await fetch(`/api/video/keyframes/${this.currentSessionId}/${filename}`, {
                    method: 'DELETE'
                });

                if (!response.ok) {
                    failures.push(filename);
                    continue;
                }

                // Remove from DOM with animation
                const itemElement = this.gallery.querySelector(`[data-filename="${filename}"]`);
                if (itemElement) {
                    itemElement.style.transition = 'all 0.3s ease';
                    itemElement.style.transform = 'scale(0.8)';
                    itemElement.style.opacity = '0';

                    setTimeout(() => {
                        itemElement.remove();
                    }, 300);
                }

                // Remove from selection
                this.selectedKeyframes.delete(filename);
            } catch (error) {
                console.error(`Failed to delete keyframe ${filename}:`, error);
                failures.push(filename);
            }
        }

        // Update UI
        setTimeout(() => {
            this.updateFrameCount();
            this.updateSelectionUI();
        }, 350);

        // Show result message
        if (failures.length === 0) {
            this.showTemporaryMessage(`Successfully deleted ${selectedCount} keyframe${selectedCount !== 1 ? 's' : ''}!`);
        } else {
            const successCount = selectedCount - failures.length;
            this.showTemporaryMessage(`Deleted ${successCount} keyframes. ${failures.length} failed to delete.`);
        }
    }

    // Notes Management Methods
    openNotesModal() {
        const selectedCount = this.selectedKeyframes.size;
        if (selectedCount === 0) return;

        this.selectedFramesCount.textContent = selectedCount;
        this.notesTextarea.value = '';
        this.updateNotesCharCount();

        this.notesModal.classList.remove('hidden');
        this.notesModal.classList.add('fade-in');
        document.body.style.overflow = 'hidden';

        // Focus the textarea
        setTimeout(() => this.notesTextarea.focus(), 100);
    }

    closeNotesModal() {
        this.notesModal.classList.add('hidden');
        this.notesModal.classList.remove('fade-in');
        document.body.style.overflow = '';
    }

    updateNotesCharCount() {
        const count = this.notesTextarea.value.length;
        this.notesCharCount.textContent = count;

        // Change color if approaching limit
        if (count > 450) {
            this.notesCharCount.style.color = 'var(--error-color)';
        } else if (count > 400) {
            this.notesCharCount.style.color = 'var(--warning-color)';
        } else {
            this.notesCharCount.style.color = 'var(--text-secondary)';
        }
    }

    saveNotesToSelected() {
        const notes = this.notesTextarea.value.trim();
        if (!notes) {
            this.showTemporaryMessage('Please enter some notes before saving.');
            return;
        }

        const selectedFilenames = Array.from(this.selectedKeyframes);
        let updatedCount = 0;

        selectedFilenames.forEach(filename => {
            this.keyframeNotes.set(filename, notes);

            // Update the visual display for this keyframe
            const itemElement = this.gallery.querySelector(`[data-filename="${filename}"]`);
            if (itemElement) {
                const notesIndicator = itemElement.querySelector('.notes-indicator');
                const notesContainer = itemElement.querySelector('.keyframe-notes');
                const notesContent = itemElement.querySelector('.notes-content');
                this.updateKeyframeNotesDisplay(filename, notesIndicator, notesContainer, notesContent);
                updatedCount++;
            }
        });

        this.closeNotesModal();
        this.showTemporaryMessage(`Notes added to ${updatedCount} keyframe${updatedCount !== 1 ? 's' : ''}!`);
    }

    updateKeyframeNotesDisplay(filename, notesIndicator, notesContainer, notesContent) {
        const notes = this.keyframeNotes.get(filename);

        if (notes && notes.trim()) {
            notesIndicator.classList.remove('hidden');
            notesContainer.classList.remove('hidden');
            notesContent.textContent = notes;
        } else {
            notesIndicator.classList.add('hidden');
            notesContainer.classList.add('hidden');
            notesContent.textContent = '';
        }
    }

    // Add Keyframe Methods
    openAddKeyframeModal() {
        if (!this.currentSessionId || !this.videoDuration) {
            this.showTemporaryMessage('Video session not available for adding keyframes.');
            return;
        }

        // Initialize modal
        this.initializeAddKeyframeModal();

        // Show modal
        this.addKeyframeModal.classList.remove('hidden');
        this.addKeyframeModal.classList.add('fade-in');
        document.body.style.overflow = 'hidden';

        // Focus the slider
        setTimeout(() => this.timestampSlider.focus(), 100);
    }

    closeAddKeyframeModal() {
        this.addKeyframeModal.classList.add('hidden');
        this.addKeyframeModal.classList.remove('fade-in');
        document.body.style.overflow = '';

        // Reset preview
        this.previewContainer.classList.add('hidden');
        this.previewImage.classList.add('hidden');
        this.previewLoading.classList.add('hidden');
        this.previewError.classList.add('hidden');
    }

    initializeAddKeyframeModal() {
        // Set video duration
        const formatTime = (seconds) => {
            const mins = Math.floor(seconds / 60);
            const secs = Math.floor(seconds % 60);
            return `${mins}:${secs.toString().padStart(2, '0')}`;
        };

        this.modalVideoDuration.textContent = formatTime(this.videoDuration);
        this.sliderEndTime.textContent = formatTime(this.videoDuration);

        // Configure slider
        this.timestampSlider.max = this.videoDuration;
        this.timestampSlider.value = 0;
        this.manualTimestampInput.max = this.videoDuration;
        this.manualTimestampInput.value = 0;

        // Update timestamp display
        this.updateTimestampDisplay(0);

        // Populate position selector
        this.populatePositionSelector();
    }

    populatePositionSelector() {
        const galleryItems = this.gallery.querySelectorAll('.keyframe-item');
        const totalFrames = galleryItems.length;

        // Clear existing options
        this.insertPosition.innerHTML = '';

        // Add position options
        for (let i = 0; i <= totalFrames; i++) {
            const option = document.createElement('option');
            option.value = i;

            if (i === 0) {
                option.textContent = 'At beginning';
            } else if (i === totalFrames) {
                option.textContent = 'At end';
            } else {
                option.textContent = `After keyframe ${i}`;
            }

            this.insertPosition.appendChild(option);
        }

        // Default to end position
        this.insertPosition.value = totalFrames;
    }

    updateTimestampFromSlider() {
        const timestamp = parseFloat(this.timestampSlider.value);
        this.manualTimestampInput.value = timestamp.toFixed(1);
        this.updateTimestampDisplay(timestamp);
        this.debouncePreviewUpdate(timestamp);
    }

    updateTimestampFromInput() {
        let timestamp = parseFloat(this.manualTimestampInput.value) || 0;
        timestamp = Math.max(0, Math.min(this.videoDuration, timestamp));

        this.timestampSlider.value = timestamp;
        this.manualTimestampInput.value = timestamp.toFixed(1);
        this.updateTimestampDisplay(timestamp);
        this.debouncePreviewUpdate(timestamp);
    }

    updateTimestampDisplay(timestamp) {
        const formatTime = (seconds) => {
            const mins = Math.floor(seconds / 60);
            const secs = Math.floor(seconds % 60);
            return `${mins}:${secs.toString().padStart(2, '0')}`;
        };

        this.currentTimestamp.textContent = formatTime(timestamp);
    }

    debouncePreviewUpdate(timestamp) {
        // Clear existing timeout
        if (this.previewTimeout) {
            clearTimeout(this.previewTimeout);
        }

        // Set new timeout for preview update
        this.previewTimeout = setTimeout(() => {
            this.updatePreview(timestamp);
        }, 300); // 300ms debounce
    }

    async updatePreview(timestamp) {
        // Hide previous preview states
        this.previewImage.classList.add('hidden');
        this.previewError.classList.add('hidden');

        // Show loading
        this.previewContainer.classList.remove('hidden');
        this.previewLoading.classList.remove('hidden');

        try {
            // For now, we'll skip the preview and just show that it's ready
            // In a full implementation, you could extract a preview frame
            setTimeout(() => {
                this.previewLoading.classList.add('hidden');
                this.previewError.classList.remove('hidden');
                this.previewError.innerHTML = '<i class="fas fa-info-circle"></i>Preview will be available after extraction';
            }, 500);

        } catch (error) {
            console.error('Preview update failed:', error);
            this.previewLoading.classList.add('hidden');
            this.previewError.classList.remove('hidden');
        }
    }

    async confirmAddKeyframe() {
        const timestamp = parseFloat(this.timestampSlider.value);
        const insertAfterIndex = parseInt(this.insertPosition.value);

        if (timestamp < 0 || timestamp > this.videoDuration) {
            this.showTemporaryMessage('Invalid timestamp selected.');
            return;
        }

        // Disable confirm button during processing
        this.addKeyframeConfirmBtn.disabled = true;
        this.addKeyframeConfirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Adding...';

        try {
            const response = await fetch(`/api/video/add-keyframe/${this.currentSessionId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    timestamp: timestamp,
                    insertAfterIndex: insertAfterIndex
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || 'Failed to add keyframe');
            }

            const result = await response.json();

            if (result.success) {
                // Insert the new keyframe in the gallery
                await this.insertKeyframeInGallery(result.newKeyframe, insertAfterIndex);

                this.closeAddKeyframeModal();
                this.showTemporaryMessage('Keyframe added successfully!');
            } else {
                throw new Error('Failed to extract keyframe');
            }

        } catch (error) {
            console.error('Add keyframe failed:', error);
            this.showTemporaryMessage('Failed to add keyframe: ' + error.message);
        } finally {
            // Re-enable confirm button
            this.addKeyframeConfirmBtn.disabled = false;
            this.addKeyframeConfirmBtn.innerHTML = '<i class="fas fa-plus"></i> Add Keyframe';
        }
    }

    async insertKeyframeInGallery(newKeyframe, insertAfterIndex) {
        // Create new keyframe item
        const newIndex = insertAfterIndex + 1;
        const keyframeItem = this.createKeyframeItem(newKeyframe, newIndex);

        // Mark as custom keyframe for visual distinction
        keyframeItem.classList.add('custom-keyframe');
        keyframeItem.setAttribute('data-custom', 'true');

        // Store metadata
        this.frameMetadata.set(newKeyframe.filename, {
            timestamp: newKeyframe.timestamp,
            index: newIndex,
            sessionId: this.currentSessionId,
            custom: true
        });

        // Insert in correct position
        const galleryItems = this.gallery.querySelectorAll('.keyframe-item');

        if (insertAfterIndex >= galleryItems.length) {
            // Insert at end
            this.gallery.appendChild(keyframeItem);
        } else {
            // Insert after specified position
            const targetItem = galleryItems[insertAfterIndex];
            targetItem.parentNode.insertBefore(keyframeItem, targetItem.nextSibling);
        }

        // Update frame count
        this.updateFrameCount();

        // Add animation effect
        keyframeItem.style.opacity = '0';
        keyframeItem.style.transform = 'scale(0.8)';

        requestAnimationFrame(() => {
            keyframeItem.style.transition = 'all 0.3s ease';
            keyframeItem.style.opacity = '1';
            keyframeItem.style.transform = 'scale(1)';
        });
    }

    // Clone Selected Keyframes
    async cloneSelectedKeyframes() {
        const selectedCount = this.selectedKeyframes.size;

        if (selectedCount === 0) {
            this.showTemporaryMessage('Please select keyframes to clone.');
            return;
        }

        if (!this.currentSessionId) {
            this.showTemporaryMessage('No active session found.');
            return;
        }

        const confirmMessage = `Clone ${selectedCount} selected keyframe${selectedCount !== 1 ? 's' : ''}? ${selectedCount > 1 ? 'Each will be placed after its original.' : 'It will be placed after the original.'}`;
        if (!confirm(confirmMessage)) {
            return;
        }

        try {
            // Get all keyframe items in order
            const allItems = Array.from(this.gallery.querySelectorAll('.keyframe-item'));
            const selectedFilenames = Array.from(this.selectedKeyframes);

            // Sort selected items by their position in the gallery (reverse order for proper insertion)
            const selectedItemsData = selectedFilenames.map(filename => {
                const item = allItems.find(item => item.dataset.filename === filename);
                const index = allItems.indexOf(item);
                return { filename, item, index };
            }).sort((a, b) => b.index - a.index); // Reverse order so we can insert from right to left

            let successCount = 0;
            let failures = [];

            // Clone each selected keyframe
            for (const itemData of selectedItemsData) {
                try {
                    const { filename, item, index } = itemData;

                    // Get the keyframe data
                    const img = item.querySelector('.keyframe-image');
                    const titleInput = item.querySelector('.keyframe-title-input');
                    const originalName = titleInput.value || `Keyframe ${index + 1}`;

                    // Create a clone with a new filename
                    const timestamp = Date.now() + Math.random(); // Ensure uniqueness
                    const cloneFilename = `clone_${timestamp}.jpg`;
                    const cloneName = `${originalName} (Copy)`;

                    // Create new keyframe item
                    const cloneItem = this.createKeyframeItem({
                        filename: cloneFilename,
                        url: img.src // Use the same image URL
                    }, index + 2); // Position after the original

                    // Mark it as a cloned keyframe
                    cloneItem.classList.add('cloned-keyframe');

                    // Set the clone name
                    const cloneTitleInput = cloneItem.querySelector('.keyframe-title-input');
                    cloneTitleInput.value = cloneName;
                    this.keyframeNames.set(cloneFilename, cloneName);

                    // Copy notes if they exist
                    const originalNotes = this.keyframeNotes.get(filename);
                    if (originalNotes) {
                        this.keyframeNotes.set(cloneFilename, originalNotes);
                        this.updateKeyframeNotesDisplay(
                            cloneFilename,
                            cloneItem.querySelector('.notes-indicator'),
                            cloneItem.querySelector('.keyframe-notes'),
                            cloneItem.querySelector('.notes-content')
                        );
                    }

                    // Copy metadata if it exists
                    const originalMetadata = this.frameMetadata.get(filename);
                    if (originalMetadata) {
                        this.frameMetadata.set(cloneFilename, {
                            ...originalMetadata,
                            index: index + 1 // Adjust index
                        });
                    }

                    // Insert after the original item
                    const nextItem = item.nextElementSibling;
                    if (nextItem) {
                        this.gallery.insertBefore(cloneItem, nextItem);
                    } else {
                        this.gallery.appendChild(cloneItem);
                    }

                    // Add animation for the new item
                    cloneItem.style.opacity = '0';
                    cloneItem.style.transform = 'scale(0.8)';

                    // Trigger animation
                    setTimeout(() => {
                        cloneItem.style.transition = 'all 0.3s ease';
                        cloneItem.style.opacity = '1';
                        cloneItem.style.transform = 'scale(1)';
                    }, 50);

                    successCount++;

                } catch (error) {
                    console.error(`Failed to clone keyframe ${itemData.filename}:`, error);
                    failures.push(itemData.filename);
                }
            }

            // Update frame count
            this.updateFrameCount();

            // Clear selection
            this.selectedKeyframes.clear();
            this.updateSelectionUI();

            // Show result message
            if (failures.length === 0) {
                this.showTemporaryMessage(`Successfully cloned ${successCount} keyframe${successCount !== 1 ? 's' : ''}!`);
            } else {
                this.showTemporaryMessage(`Cloned ${successCount} keyframes. ${failures.length} failed to clone.`);
            }

        } catch (error) {
            console.error('Error cloning keyframes:', error);
            this.showTemporaryMessage('Failed to clone keyframes.');
        }
    }

    // Frame Navigation Methods
    async navigateFrame(direction) {
        if (!this.currentModalImage || !this.currentSessionId) {
            return;
        }

        // Disable navigation buttons during loading
        this.framePrevBtn.disabled = true;
        this.frameNextBtn.disabled = true;

        // Show loading indicator
        this.showFrameLoading();

        try {
            // Get frame metadata for more accurate timestamp
            const currentFilename = this.currentModalImage.filename;
            const metadata = this.frameMetadata.get(currentFilename);

            let timestamp;
            if (metadata && metadata.timestamp !== undefined) {
                timestamp = metadata.timestamp;
            } else {
                // Fallback to estimation based on filename
                const frameNumber = parseInt(currentFilename.match(/keyframe_(\d+)/)?.[1] || '1');
                timestamp = frameNumber * 2; // Rough estimate: 2 seconds per frame
            }

            // Calculate target timestamp
            const step = direction === 'next' ? 1.0 : -1.0;
            const targetTimestamp = timestamp + step;

            // Check cache first
            const cacheKey = `${targetTimestamp}_${direction}`;
            const cachedFrame = this.frameCache.get(cacheKey);

            if (cachedFrame) {
                // Use cached frame
                this.updateModalWithNewFrame({
                    url: cachedFrame.url,
                    filename: cachedFrame.filename,
                    timestamp: targetTimestamp,
                    direction: direction
                });
                this.showDebouncedNavigationMessage(`Navigated to ${direction === 'next' ? 'next' : 'previous'} frame (cached)`);
                return;
            }

            const response = await fetch(`/api/video/extract-adjacent/${this.currentSessionId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    baseFilename: currentFilename,
                    direction: direction,
                    timestamp: timestamp
                })
            });

            if (!response.ok) {
                throw new Error('Failed to extract adjacent frame');
            }

            const result = await response.json();

            // Check for boundary conditions
            if (result.boundary) {
                this.showTemporaryMessage(result.error);
                return;
            }

            // Update modal with new frame
            this.updateModalWithNewFrame(result.newFrame);

            // Cache the new frame for future use
            if (result.success && result.newFrame) {
                const cacheKey = `${result.newFrame.timestamp}_${direction}`;
                this.frameCache.set(cacheKey, {
                    url: result.newFrame.url,
                    filename: result.newFrame.filename
                });

                // Limit cache size to prevent memory issues
                if (this.frameCache.size > 20) {
                    const firstKey = this.frameCache.keys().next().value;
                    this.frameCache.delete(firstKey);
                }
            }

            if (result.success) {
                this.showDebouncedNavigationMessage(`Navigated to ${direction === 'next' ? 'next' : 'previous'} frame`);
            } else {
                this.showDebouncedNavigationMessage(`${result.message || 'Used existing frame'}`);
            }

        } catch (error) {
            console.error('Frame navigation failed:', error);
            this.showDebouncedNavigationMessage('Failed to navigate to adjacent frame');
        } finally {
            // Re-enable navigation buttons
            this.framePrevBtn.disabled = false;
            this.frameNextBtn.disabled = false;
            this.hideFrameLoading();

            // Update button states based on current position
            this.updateNavigationButtonStates();
            this.updateFrameProgress();
        }
    }

    updateModalWithNewFrame(newFrame) {
        // Update modal image and data
        this.modalImage.src = newFrame.url;

        // Update title to show timestamp or fallback to frame info
        let title = newFrame.timestamp !== undefined
            ? `Frame at ${newFrame.timestamp.toFixed(1)}s`
            : this.currentModalImage?.title || 'Navigation Frame';

        // Add duration info if available
        if (newFrame.timestamp !== undefined && this.videoDuration) {
            const percentage = ((newFrame.timestamp / this.videoDuration) * 100).toFixed(1);
            title += ` (${percentage}%)`;
        }

        this.modalTitle.textContent = title;

        // Update current modal image data
        this.currentModalImage = {
            url: newFrame.url,
            title: title,
            filename: newFrame.filename,
            isNavigationFrame: newFrame.filename.startsWith('nav_') // Mark as navigation frame
        };

        // Show/hide Save Frame button based on whether this is a navigation frame
        if (this.currentModalImage.isNavigationFrame) {
            this.saveFrameBtn.classList.remove('hidden');
        } else {
            this.saveFrameBtn.classList.add('hidden');
        }

        // Update frame metadata if this is a new navigation frame
        if (newFrame.timestamp !== undefined) {
            this.frameMetadata.set(newFrame.filename, {
                timestamp: newFrame.timestamp,
                index: -1, // Mark as navigation frame
                sessionId: this.currentSessionId
            });
        }

        // Update progress indicator
        this.updateFrameProgress();
    }

    showFrameLoading() {
        // Remove existing loading indicator if any
        this.hideFrameLoading();

        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'frame-loading';
        loadingDiv.id = 'frameLoading';
        loadingDiv.innerHTML = `
            <div class="spinner"></div>
            <span>Loading frame...</span>
        `;

        this.imageModal.querySelector('.modal-content').appendChild(loadingDiv);
    }

    hideFrameLoading() {
        const existingLoading = document.getElementById('frameLoading');
        if (existingLoading) {
            existingLoading.remove();
        }
    }

    updateNavigationButtonStates() {
        if (!this.currentModalImage) return;

        const metadata = this.frameMetadata.get(this.currentModalImage.filename);
        if (!metadata) return;

        const currentTimestamp = metadata.timestamp;

        // Disable previous button if we're at/near the beginning (within 0.5 seconds)
        this.framePrevBtn.disabled = currentTimestamp <= 0.5;

        // Disable next button if we're at/near the end (within 1 second of duration)
        if (this.videoDuration) {
            this.frameNextBtn.disabled = currentTimestamp >= (this.videoDuration - 1);
        } else {
            this.frameNextBtn.disabled = false; // Enable if we don't know duration
        }

        // Update button titles with helpful text
        this.framePrevBtn.title = this.framePrevBtn.disabled
            ? 'Beginning of video'
            : `Previous frame (${Math.max(0, currentTimestamp - 1).toFixed(1)}s)`;
        this.frameNextBtn.title = this.frameNextBtn.disabled
            ? 'End of video'
            : `Next frame (${(currentTimestamp + 1).toFixed(1)}s)`;
    }

    updateFrameProgress() {
        if (!this.currentModalImage || !this.videoDuration) {
            this.frameProgress.classList.add('hidden');
            return;
        }

        const metadata = this.frameMetadata.get(this.currentModalImage.filename);
        if (!metadata || metadata.timestamp === undefined) {
            this.frameProgress.classList.add('hidden');
            return;
        }

        const currentTime = metadata.timestamp;
        const progress = (currentTime / this.videoDuration) * 100;

        // Update progress bar
        this.frameProgressFill.style.width = `${Math.max(0, Math.min(100, progress))}%`;

        // Update time info
        const formatTime = (seconds) => {
            const mins = Math.floor(seconds / 60);
            const secs = Math.floor(seconds % 60);
            return `${mins}:${secs.toString().padStart(2, '0')}`;
        };

        this.frameTimeInfo.textContent = `${formatTime(currentTime)} / ${formatTime(this.videoDuration)}`;

        // Show progress indicator
        this.frameProgress.classList.remove('hidden');
    }
}

// Add CSS animations for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new VideoKeyframeExtractor();
});
