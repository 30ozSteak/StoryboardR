/**
 * ThemeManager - Handles dark/light theme toggling and persistence
 */
export class ThemeManager {
  constructor() {
    this.currentTheme = 'dark'; // default theme
    this.themeToggleButtons = [];
    this.themeIcons = [];
    this.themeToggleLabels = [];

    this.initializeElements();
    this.loadSavedTheme();
    this.bindEvents();
    this.watchSystemTheme(); // Start watching for system theme changes
  }

  initializeElements() {
    // Get all theme toggle elements using classes
    this.themeToggleButtons = Array.from(document.querySelectorAll('.theme-toggle'));
    this.themeIcons = Array.from(document.querySelectorAll('.theme-icon'));
    this.themeToggleLabels = Array.from(document.querySelectorAll('.theme-toggle-label'));

    if (this.themeToggleButtons.length === 0) {
      console.warn('ThemeManager: No theme toggle elements found');
      return;
    }

    console.log(`ThemeManager: Found ${this.themeToggleButtons.length} theme toggle(s)`);
  }

  bindEvents() {
    // Add click listeners to all theme toggle buttons
    this.themeToggleButtons.forEach(button => {
      button.addEventListener('click', () => {
        this.toggleTheme();
      });
    });

    // Add click listeners to all theme toggle labels
    this.themeToggleLabels.forEach(label => {
      label.addEventListener('click', () => {
        this.toggleTheme();
      });
    });
  }

  loadSavedTheme() {
    try {
      // Check for saved theme in localStorage
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
        this.currentTheme = savedTheme;
      } else {
        // Check system preference if no saved theme
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        this.currentTheme = prefersDark ? 'dark' : 'light';
      }

      this.applyTheme(this.currentTheme);
    } catch (error) {
      console.warn('ThemeManager: Error loading saved theme:', error);
      this.applyTheme('dark'); // fallback to dark theme
    }
  }

  toggleTheme() {
    const newTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
    this.setTheme(newTheme);
  }

  setTheme(theme) {
    if (theme !== 'light' && theme !== 'dark') {
      console.warn('ThemeManager: Invalid theme:', theme);
      return;
    }

    this.currentTheme = theme;
    this.applyTheme(theme);
    this.saveTheme(theme);
  }

  applyTheme(theme) {
    // Apply theme to document root
    if (theme === 'light') {
      document.documentElement.setAttribute('data-theme', 'light');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }

    // Update theme icon
    this.updateThemeIcon(theme);

    // Emit theme change event for other modules
    this.emitThemeChange(theme);
  }

  updateThemeIcon(theme) {
    // Update all theme icons
    this.themeIcons.forEach(icon => {
      if (theme === 'light') {
        icon.className = 'fas fa-sun theme-icon';
      } else {
        icon.className = 'fas fa-moon theme-icon';
      }
    });
  }

  saveTheme(theme) {
    try {
      localStorage.setItem('theme', theme);
    } catch (error) {
      console.warn('ThemeManager: Error saving theme:', error);
    }
  }

  emitThemeChange(theme) {
    // Dispatch a custom event that other modules can listen to
    const event = new CustomEvent('themeChange', {
      detail: { theme }
    });
    document.dispatchEvent(event);
  }

  getCurrentTheme() {
    return this.currentTheme;
  }

  isDarkMode() {
    return this.currentTheme === 'dark';
  }

  isLightMode() {
    return this.currentTheme === 'light';
  }

  // Listen for system theme changes
  watchSystemTheme() {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    mediaQuery.addEventListener('change', (e) => {
      // Only change if user hasn't manually set a preference
      if (!localStorage.getItem('theme')) {
        const newTheme = e.matches ? 'dark' : 'light';
        this.setTheme(newTheme);
      }
    });
  }

  // Method to reset theme to system preference
  resetToSystemTheme() {
    localStorage.removeItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const systemTheme = prefersDark ? 'dark' : 'light';
    this.setTheme(systemTheme);
  }
}
