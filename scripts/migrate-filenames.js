#!/usr/bin/env node

/**
 * Data migration script to fix empty filename fields in projects.json
 * Extracts filenames from URLs and updates the project data
 */

const fs = require('fs');
const path = require('path');

const PROJECTS_FILE = path.join(__dirname, '..', 'data', 'projects.json');

function extractFilenameFromUrl(url) {
  if (!url) return '';

  // Extract filename from URL path
  const urlParts = url.split('/');
  const filename = urlParts[urlParts.length - 1];

  // Validate that it looks like a keyframe filename
  if (filename && (filename.includes('keyframe_') || filename.includes('saved_frame_'))) {
    return filename;
  }

  return '';
}

function migrateProjects() {
  console.log('Starting filename migration...');

  try {
    // Read current projects data
    const projectsData = JSON.parse(fs.readFileSync(PROJECTS_FILE, 'utf8'));
    let totalFixed = 0;
    let totalKeyframes = 0;

    // Process each project
    projectsData.projects.forEach(project => {
      console.log(`Processing project: ${project.name} (${project.id})`);
      let fixedInProject = 0;

      // Process each keyframe
      project.keyframes.forEach(keyframe => {
        totalKeyframes++;

        // If filename is empty, try to extract from URL
        if (!keyframe.filename || keyframe.filename.trim() === '') {
          const extractedFilename = extractFilenameFromUrl(keyframe.url);

          if (extractedFilename) {
            keyframe.filename = extractedFilename;
            fixedInProject++;
            totalFixed++;
            console.log(`  Fixed: ${extractedFilename}`);
          } else {
            console.log(`  Warning: Could not extract filename from URL: ${keyframe.url}`);
          }
        }
      });

      console.log(`  Fixed ${fixedInProject} keyframes in project "${project.name}"`);
    });

    // Create backup before writing
    const backupFile = PROJECTS_FILE + '.backup.' + Date.now();
    fs.copyFileSync(PROJECTS_FILE, backupFile);
    console.log(`Created backup: ${backupFile}`);

    // Write updated data
    fs.writeFileSync(PROJECTS_FILE, JSON.stringify(projectsData, null, 2));

    console.log(`Migration complete!`);
    console.log(`Total keyframes processed: ${totalKeyframes}`);
    console.log(`Total filenames fixed: ${totalFixed}`);
    console.log(`Backup created: ${backupFile}`);

  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run migration if this script is executed directly
if (require.main === module) {
  migrateProjects();
}

module.exports = { migrateProjects, extractFilenameFromUrl };
