const fs = require('fs-extra');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

class ProjectManager {
  constructor() {
    this.dbPath = path.join(__dirname, '..', 'data');
    this.projectsFile = path.join(this.dbPath, 'projects.json');
    this.initializeDatabase();
  }

  async initializeDatabase() {
    try {
      // Ensure data directory exists
      await fs.ensureDir(this.dbPath);

      // Create projects file if it doesn't exist
      if (!await fs.pathExists(this.projectsFile)) {
        await fs.writeJson(this.projectsFile, { projects: [] }, { spaces: 2 });
      }
    } catch (error) {
      console.error('Failed to initialize database:', error);
    }
  }

  async loadProjects() {
    try {
      const data = await fs.readJson(this.projectsFile);
      return data.projects || [];
    } catch (error) {
      console.error('Failed to load projects:', error);
      return [];
    }
  }

  async saveProjects(projects) {
    try {
      await fs.writeJson(this.projectsFile, { projects }, { spaces: 2 });
    } catch (error) {
      console.error('Failed to save projects:', error);
      throw error;
    }
  }

  async createProject(projectData) {
    try {
      const projects = await this.loadProjects();

      const newProject = {
        id: uuidv4(),
        name: projectData.name || 'Untitled Project',
        description: projectData.description || '',
        videoSource: projectData.videoSource || '', // URL or original filename
        sessionId: projectData.sessionId,
        keyframes: projectData.keyframes || [],
        frameCount: projectData.frameCount || 0,
        videoDuration: projectData.videoDuration || 0,
        thumbnail: projectData.thumbnail || null, // First keyframe as thumbnail
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        keyframeNames: projectData.keyframeNames || {},
        keyframeNotes: projectData.keyframeNotes || {},
        selectedKeyframes: projectData.selectedKeyframes || []
      };

      projects.push(newProject);
      await this.saveProjects(projects);

      return newProject;
    } catch (error) {
      console.error('Failed to create project:', error);
      throw error;
    }
  }

  async getProject(projectId) {
    try {
      const projects = await this.loadProjects();
      const project = projects.find(project => project.id === projectId);

      if (!project) {
        return null;
      }

      // Validate that keyframe files still exist
      if (project.sessionId && project.keyframes && project.keyframes.length > 0) {
        const keyframesDir = path.join(__dirname, '..', 'temp', 'keyframes', project.sessionId);

        try {
          // Check if the session directory exists
          const dirExists = await fs.pathExists(keyframesDir);

          if (!dirExists) {
            console.warn(`Session directory not found for project ${projectId}: ${project.sessionId}`);
            // Mark project as having missing files
            project._hasMissingFiles = true;
          } else {
            // Check if individual keyframe files exist
            const missingFiles = [];
            for (const keyframe of project.keyframes) {
              if (keyframe.filename) {
                const filePath = path.join(keyframesDir, keyframe.filename);
                const fileExists = await fs.pathExists(filePath);
                if (!fileExists) {
                  missingFiles.push(keyframe.filename);
                }
              }
            }

            if (missingFiles.length > 0) {
              console.warn(`Missing keyframe files for project ${projectId}:`, missingFiles);
              project._hasMissingFiles = true;
              project._missingFiles = missingFiles;
            }
          }
        } catch (error) {
          console.error(`Error validating keyframes for project ${projectId}:`, error);
          project._hasMissingFiles = true;
        }
      }

      return project;
    } catch (error) {
      console.error('Failed to get project:', error);
      return null;
    }
  }

  async updateProject(projectId, updateData) {
    try {
      const projects = await this.loadProjects();
      const projectIndex = projects.findIndex(project => project.id === projectId);

      if (projectIndex === -1) {
        throw new Error('Project not found');
      }

      projects[projectIndex] = {
        ...projects[projectIndex],
        ...updateData,
        updatedAt: new Date().toISOString()
      };

      await this.saveProjects(projects);
      return projects[projectIndex];
    } catch (error) {
      console.error('Failed to update project:', error);
      throw error;
    }
  }

  async deleteProject(projectId) {
    try {
      const projects = await this.loadProjects();
      const projectIndex = projects.findIndex(project => project.id === projectId);

      if (projectIndex === -1) {
        throw new Error('Project not found');
      }

      // Remove the project
      const deletedProject = projects.splice(projectIndex, 1)[0];
      await this.saveProjects(projects);

      // Optionally clean up associated files
      // TODO: Clean up keyframe files if needed

      return deletedProject;
    } catch (error) {
      console.error('Failed to delete project:', error);
      throw error;
    }
  }

  async getAllProjects() {
    try {
      const projects = await this.loadProjects();
      const validProjects = [];

      // Filter out projects with missing keyframe directories
      for (const project of projects) {
        if (project.sessionId && project.keyframes && project.keyframes.length > 0) {
          const keyframesDir = path.join(__dirname, '..', 'temp', 'keyframes', project.sessionId);
          const dirExists = await fs.pathExists(keyframesDir);

          if (dirExists) {
            validProjects.push(project);
          } else {
            console.warn(`Skipping project with missing session directory: ${project.name} (${project.sessionId})`);
          }
        } else {
          // Include projects without keyframes (empty projects)
          validProjects.push(project);
        }
      }

      // Sort by updatedAt descending (most recent first)
      return validProjects.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    } catch (error) {
      console.error('Failed to get all projects:', error);
      return [];
    }
  }

  async cleanupOrphanedProjects() {
    try {
      const projects = await this.loadProjects();
      const validProjects = [];
      const removedProjects = [];

      for (const project of projects) {
        if (project.sessionId && project.keyframes && project.keyframes.length > 0) {
          const keyframesDir = path.join(__dirname, '..', 'temp', 'keyframes', project.sessionId);
          const dirExists = await fs.pathExists(keyframesDir);

          if (dirExists) {
            // Check if at least some keyframe files exist
            let hasValidFiles = false;
            for (const keyframe of project.keyframes.slice(0, 3)) { // Check first 3 files
              if (keyframe.filename) {
                const filePath = path.join(keyframesDir, keyframe.filename);
                const fileExists = await fs.pathExists(filePath);
                if (fileExists) {
                  hasValidFiles = true;
                  break;
                }
              }
            }

            if (hasValidFiles) {
              validProjects.push(project);
            } else {
              console.log(`Removing orphaned project: ${project.name} (${project.id})`);
              removedProjects.push(project);
            }
          } else {
            console.log(`Removing orphaned project: ${project.name} (${project.id}) - session directory missing`);
            removedProjects.push(project);
          }
        } else {
          // Keep projects without keyframes (they might be empty projects)
          validProjects.push(project);
        }
      }

      if (removedProjects.length > 0) {
        await this.saveProjects(validProjects);
        console.log(`Cleaned up ${removedProjects.length} orphaned projects`);
      }

      return {
        removedCount: removedProjects.length,
        removedProjects: removedProjects.map(p => ({ id: p.id, name: p.name }))
      };
    } catch (error) {
      console.error('Failed to cleanup orphaned projects:', error);
      throw error;
    }
  }
}

module.exports = ProjectManager;
