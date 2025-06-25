class ProjectDashboard {
    constructor() {
        console.log('ProjectDashboard constructor called');
        this.projects = [];
        this.initializeElements();
        this.bindEvents();
        this.loadProjects();
    }

    initializeElements() {
        console.log('initializeElements called');
        
        // Sections
        this.projectsSection = document.getElementById('projectsSection');
        this.loadingSection = document.getElementById('loadingSection');

        // Projects elements
        this.projectsGrid = document.getElementById('projectsGrid');
        this.emptyState = document.getElementById('emptyState');
        this.newProjectBtn = document.getElementById('newProjectBtn');

        // New Project Modal elements
        this.newProjectModal = document.getElementById('newProjectModal');
        this.newProjectModalBackdrop = document.getElementById('newProjectModalBackdrop');
        this.newProjectModalClose = document.getElementById('newProjectModalClose');
        this.createFromScratchBtn = document.getElementById('createFromScratchBtn');
        this.createFromVideoBtn = document.getElementById('createFromVideoBtn');

        console.log('Elements found:', {
            newProjectBtn: !!this.newProjectBtn,
            newProjectModal: !!this.newProjectModal,
            createFromScratchBtn: !!this.createFromScratchBtn,
            createFromVideoBtn: !!this.createFromVideoBtn
        });
    }

    bindEvents() {
        console.log('bindEvents called');
        
        // New project button
        if (this.newProjectBtn) {
            console.log('Adding click listener to newProjectBtn');
            this.newProjectBtn.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('New Project button clicked!');
                this.showNewProjectModal();
            });
        } else {
            console.error('newProjectBtn element not found!');
        }

        // New Project Modal events
        if (this.newProjectModalClose) {
            this.newProjectModalClose.addEventListener('click', () => {
                this.hideNewProjectModal();
            });
        }

        // New project option buttons
        if (this.createFromScratchBtn) {
            this.createFromScratchBtn.addEventListener('click', () => {
                console.log('createFromScratchBtn clicked');
                this.createFromScratch();
            });
        }

        if (this.createFromVideoBtn) {
            this.createFromVideoBtn.addEventListener('click', () => {
                console.log('createFromVideoBtn clicked');
                this.createFromVideo();
            });
        }

        // Theme toggle events with delay to ensure elements are rendered
        setTimeout(() => {
            if (this.themeToggle) {
                this.themeToggle.addEventListener('click', () => this.toggleTheme());
            }
            if (this.themeToggleLabel) {
                this.themeToggleLabel.addEventListener('click', () => this.toggleTheme());
            }
        }, 100);
        console.log('Event binding complete');
    }

    async loadProjects() {
        try {
            this.showLoading();
            
            const response = await fetch('/api/projects');
            const data = await response.json();

            if (data.success) {
                this.projects = data.projects;
                this.renderProjects();
            } else {
                console.error('Failed to load projects:', data.error);
            }
        } catch (error) {
            console.error('Error loading projects:', error);
        } finally {
            this.hideLoading();
        }
    }

    renderProjects() {
        this.projectsGrid.innerHTML = '';

        if (this.projects.length === 0) {
            this.emptyState.classList.remove('hidden');
            this.projectsGrid.classList.add('hidden');
        } else {
            this.emptyState.classList.add('hidden');
            this.projectsGrid.classList.remove('hidden');

            this.projects.forEach(project => {
                const projectCard = this.createProjectCard(project);
                this.projectsGrid.appendChild(projectCard);
            });
        }
    }

    createProjectCard(project) {
        const card = document.createElement('div');
        card.className = 'project-card';
        card.dataset.projectId = project.id;

        const updatedDate = new Date(project.updatedAt).toLocaleDateString();
        const thumbnailHtml = project.thumbnail 
            ? `<img src="${project.thumbnail}" alt="${project.name}" loading="lazy">`
            : `<div class="project-placeholder">
                <i class="fas fa-video"></i>
                <span>No Preview</span>
              </div>`;

        card.innerHTML = `
            <div class="project-thumbnail">
                ${thumbnailHtml}
                <div class="project-overlay">
                    <button class="btn-icon" onclick="app.openProject('${project.id}')" title="Open Project">
                        <i class="fas fa-play"></i>
                    </button>
                </div>
            </div>
            <div class="project-info">
                <h3 class="project-title">${project.name}</h3>
                <p class="project-description">${project.description || 'No description'}</p>
                <div class="project-meta">
                    <div class="project-stats">
                        <span class="stat">
                            <i class="fas fa-images"></i>
                            ${project.frameCount || 0} frames
                        </span>
                    </div>
                    <div class="project-dates">
                        <span class="date">Updated ${updatedDate}</span>
                    </div>
                </div>
            </div>
        `;

        card.addEventListener('click', (e) => {
            if (!e.target.closest('button')) {
                this.openProject(project.id);
            }
        });

        return card;
    }

    // New Project Modal Methods
    showNewProjectModal() {
        console.log('showNewProjectModal called');
        if (this.newProjectModal) {
            this.newProjectModal.classList.remove('hidden');
            console.log('Modal should now be visible');
        } else {
            console.error('newProjectModal element not found!');
        }
    }

    hideNewProjectModal() {
        if (this.newProjectModal) {
            this.newProjectModal.classList.add('hidden');
        }
    }

    createFromScratch() {
        console.log('createFromScratch called');
        this.hideNewProjectModal();
        window.location.href = '/extract';
    }

    createFromVideo() {
        console.log('createFromVideo called');
        this.hideNewProjectModal();
        window.location.href = '/extract';
    }

    openProject(projectId) {
        console.log('openProject called with ID:', projectId);
        window.location.href = `/extract?project=${projectId}`;
    }

    showLoading() {
        this.loadingSection.classList.remove('hidden');
        this.projectsSection.classList.add('hidden');
    }

    hideLoading() {
        this.loadingSection.classList.add('hidden');
        this.projectsSection.classList.remove('hidden');
    }

    // Theme functionality
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
    }

    initializeTheme() {
        // Get saved theme or default to dark
        const savedTheme = localStorage.getItem('theme') || 'dark';
        document.documentElement.setAttribute('data-theme', savedTheme);
        this.updateThemeIcon(savedTheme);
    }

    initializeMouseTracking() {
        // Mouse tracking for dynamic background effects
        document.addEventListener('mousemove', (e) => {
            const mouseX = (e.clientX / window.innerWidth) * 100;
            const mouseY = (e.clientY / window.innerHeight) * 100;
            document.documentElement.style.setProperty('--mouse-x', mouseX + '%');
            document.documentElement.style.setProperty('--mouse-y', mouseY + '%');
        });

        // Add mouse active class for visual effects
        document.addEventListener('mouseenter', () => {
            document.body.classList.add('mouse-active');
        });

        document.addEventListener('mouseleave', () => {
            document.body.classList.remove('mouse-active');
        });
    }
}

// Initialize the dashboard when DOM is ready
console.log('Starting dashboard initialization...');

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        console.log('DOM loaded, initializing dashboard...');
        const app = new ProjectDashboard();
        window.app = app;
    });
} else {
    console.log('DOM already loaded, initializing dashboard immediately...');
    const app = new ProjectDashboard();
    window.app = app;
}
