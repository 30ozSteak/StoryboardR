/**
 * Canvas Drawing Module for Keyframe Notes
 * This module provides drawing functionality for keyframes using HTML5 Canvas
 */

class KeyframeDrawing {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.isDrawing = false;
    this.drawingMode = false;
    this.notesVisible = true;
    this.drawingHistory = new Map(); // Store drawings per keyframe filename
    this.currentKeyframe = null;

    // Drawing settings
    this.brushSize = 3;
    this.brushColor = '#ff0000';

    this.initializeElements();
    this.bindEvents();
  }

  initializeElements() {
    this.canvas = document.getElementById('drawingCanvas');
    this.imageContainer = document.getElementById('imageContainer');
    this.modalImage = document.getElementById('modalImage');
    this.toggleDrawingBtn = document.getElementById('toggleDrawingBtn');
    this.clearDrawingBtn = document.getElementById('clearDrawingBtn');
    this.toggleNotesBtn = document.getElementById('toggleNotesBtn');
    this.brushSizeSlider = document.getElementById('brushSize');
    this.colorPicker = document.getElementById('brushColor');

    if (this.canvas) {
      this.ctx = this.canvas.getContext('2d');
      this.setupCanvas();
    }
  }

  bindEvents() {
    if (!this.canvas) return;

    // Drawing button events
    this.toggleDrawingBtn?.addEventListener('click', () => this.toggleDrawingMode());
    this.clearDrawingBtn?.addEventListener('click', () => this.clearDrawing());
    this.toggleNotesBtn?.addEventListener('click', () => this.toggleNotesVisibility());

    // Settings events
    this.brushSizeSlider?.addEventListener('input', (e) => {
      this.brushSize = parseInt(e.target.value);
    });

    this.colorPicker?.addEventListener('change', (e) => {
      this.brushColor = e.target.value;
    });

    // Canvas drawing events
    this.canvas.addEventListener('mousedown', (e) => this.startDrawing(e));
    this.canvas.addEventListener('mousemove', (e) => this.draw(e));
    this.canvas.addEventListener('mouseup', () => this.stopDrawing());
    this.canvas.addEventListener('mouseout', () => this.stopDrawing());

    // Touch events for mobile
    this.canvas.addEventListener('touchstart', (e) => this.handleTouch(e, 'start'));
    this.canvas.addEventListener('touchmove', (e) => this.handleTouch(e, 'move'));
    this.canvas.addEventListener('touchend', (e) => this.handleTouch(e, 'end'));

    // Modal image load event
    this.modalImage?.addEventListener('load', () => this.onImageLoad());
  }

  setupCanvas() {
    // Set canvas size to match image
    this.resizeCanvas();

    // Configure drawing context
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
  }

  resizeCanvas() {
    if (!this.modalImage || !this.canvas) return;

    const img = this.modalImage;
    const rect = img.getBoundingClientRect();

    // Set canvas size to match image display size
    this.canvas.width = rect.width;
    this.canvas.height = rect.height;

    // Set canvas position
    this.canvas.style.width = rect.width + 'px';
    this.canvas.style.height = rect.height + 'px';

    // Reconfigure context after resize
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
  }

  onImageLoad() {
    this.resizeCanvas();
    this.loadDrawingForCurrentKeyframe();
  }

  toggleDrawingMode() {
    this.drawingMode = !this.drawingMode;

    if (this.drawingMode) {
      this.canvas.classList.add('drawing-mode');
      this.canvas.classList.remove('hidden');
      this.toggleDrawingBtn.classList.add('active');
      this.toggleDrawingBtn.innerHTML = '<i class="fas fa-pencil-alt"></i> Drawing';
    } else {
      this.canvas.classList.remove('drawing-mode');
      this.toggleDrawingBtn.classList.remove('active');
      this.toggleDrawingBtn.innerHTML = '<i class="fas fa-pencil-alt"></i> Draw';
    }
  }

  toggleNotesVisibility() {
    this.notesVisible = !this.notesVisible;

    if (this.notesVisible) {
      this.canvas.classList.remove('hidden');
      this.toggleNotesBtn.innerHTML = '<i class="fas fa-eye"></i> Hide Notes';
    } else {
      this.canvas.classList.add('hidden');
      this.toggleNotesBtn.innerHTML = '<i class="fas fa-eye-slash"></i> Show Notes';
    }
  }

  clearDrawing() {
    if (!this.ctx || !this.currentKeyframe) return;

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.drawingHistory.delete(this.currentKeyframe);
  }

  startDrawing(e) {
    if (!this.drawingMode) return;

    this.isDrawing = true;
    const pos = this.getMousePos(e);
    this.ctx.beginPath();
    this.ctx.moveTo(pos.x, pos.y);

    // Set drawing style
    this.ctx.strokeStyle = this.brushColor;
    this.ctx.lineWidth = this.brushSize;
  }

  draw(e) {
    if (!this.isDrawing || !this.drawingMode) return;

    const pos = this.getMousePos(e);
    this.ctx.lineTo(pos.x, pos.y);
    this.ctx.stroke();
  }

  stopDrawing() {
    if (!this.isDrawing) return;

    this.isDrawing = false;
    this.saveCurrentDrawing();
  }

  handleTouch(e, type) {
    e.preventDefault();

    if (e.touches.length !== 1) return;

    const touch = e.touches[0];
    const mouseEvent = new MouseEvent(
      type === 'start' ? 'mousedown' : type === 'move' ? 'mousemove' : 'mouseup',
      {
        clientX: touch.clientX,
        clientY: touch.clientY
      }
    );

    this.canvas.dispatchEvent(mouseEvent);
  }

  getMousePos(e) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  }

  saveCurrentDrawing() {
    if (!this.currentKeyframe) return;

    // Save canvas as image data
    const imageData = this.canvas.toDataURL();
    this.drawingHistory.set(this.currentKeyframe, imageData);
  }

  loadDrawingForCurrentKeyframe() {
    if (!this.currentKeyframe || !this.ctx) return;

    // Clear canvas first
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Load saved drawing if it exists
    const savedDrawing = this.drawingHistory.get(this.currentKeyframe);
    if (savedDrawing) {
      const img = new Image();
      img.onload = () => {
        this.ctx.drawImage(img, 0, 0);
      };
      img.src = savedDrawing;
    }
  }

  setCurrentKeyframe(filename) {
    // Save current drawing before switching
    if (this.currentKeyframe && this.isDrawing) {
      this.saveCurrentDrawing();
    }

    this.currentKeyframe = filename;
    this.loadDrawingForCurrentKeyframe();
  }

  // Method to get drawing data for download/export
  getDrawingData(filename) {
    return this.drawingHistory.get(filename);
  }

  // Method to import drawing data
  setDrawingData(filename, imageData) {
    this.drawingHistory.set(filename, imageData);
    if (filename === this.currentKeyframe) {
      this.loadDrawingForCurrentKeyframe();
    }
  }
}

// Export for use in main application
window.KeyframeDrawing = KeyframeDrawing;
