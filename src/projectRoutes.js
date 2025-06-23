const express = require('express');
const ProjectManager = require('./projectManager');

const router = express.Router();
const projectManager = new ProjectManager();

// Get all projects
router.get('/', async (req, res) => {
  try {
    const projects = await projectManager.getAllProjects();
    res.json({ success: true, projects });
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get a specific project
router.get('/:id', async (req, res) => {
  try {
    const project = await projectManager.getProject(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }
    res.json({ success: true, project });
  } catch (error) {
    console.error('Error fetching project:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create a new project
router.post('/', async (req, res) => {
  try {
    const projectData = req.body;
    const project = await projectManager.createProject(projectData);
    res.json({ success: true, project });
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update a project
router.put('/:id', async (req, res) => {
  try {
    const projectId = req.params.id;
    const updateData = req.body;
    const project = await projectManager.updateProject(projectId, updateData);
    res.json({ success: true, project });
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete a project
router.delete('/:id', async (req, res) => {
  try {
    const project = await projectManager.deleteProject(req.params.id);
    res.json({ success: true, project });
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Clean up orphaned projects
router.post('/cleanup', async (req, res) => {
  try {
    const result = await projectManager.cleanupOrphanedProjects();
    res.json({ success: true, ...result });
  } catch (error) {
    console.error('Error cleaning up projects:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
