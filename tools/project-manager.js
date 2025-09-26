#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

class ProjectManager {
  constructor() {
    this.baseDir = process.cwd();
    this.projectsDir = path.join(this.baseDir, 'projects');
    this.templatesDir = path.join(this.baseDir, 'assets', 'templates');
  }

  async createProject(projectData) {
    console.log('🚀 Creating new project...');
    
    try {
      const projectId = projectData.id || uuidv4();
      const projectFolder = await this.setupProjectFolder(projectId, projectData);
      
      // Create project metadata
      const projectMeta = {
        id: projectId,
        name: projectData.name,
        clientId: projectData.clientId,
        clientName: projectData.clientName,
        type: projectData.type || '3d_shrunk',
        status: 'active',
        priority: projectData.priority || 'medium',
        created: new Date().toISOString(),
        deadline: projectData.deadline,
        budget: projectData.budget,
        description: projectData.description,
        folderPath: projectFolder,
        workflow: this.getWorkflowSteps(projectData.type),
        files: {
          original: [],
          processed: [],
          final: []
        },
        timeline: []
      };
      
      await this.saveProjectMetadata(projectId, projectMeta);
      await this.initializeWorkflow(projectId, projectMeta.workflow);
      
      console.log(`✅ Project created: ${projectData.name}`);
      console.log(`📁 Project folder: ${projectFolder}`);
      console.log(`🆔 Project ID: ${projectId}`);
      
      return projectMeta;
      
    } catch (error) {
      console.error('❌ Error creating project:', error.message);
      throw error;
    }
  }

  async setupProjectFolder(projectId, projectData) {
    const folderName = `${projectData.name.replace(/[^a-zA-Z0-9]/g, '_')}_${projectId.slice(0, 8)}`;
    const projectPath = path.join(this.projectsDir, 'active', folderName);
    
    await fs.ensureDir(projectPath);
    
    // Create project subdirectories
    const subdirs = [
      'assets/original',
      'assets/processed',
      'assets/final',
      'documentation',
      'communications',
      'deliverables',
      'workflow/step_1_concept',
      'workflow/step_2_design',
      'workflow/step_3_3d_modeling',
      'workflow/step_4_optimization',
      'workflow/step_5_production',
      'workflow/step_6_delivery'
    ];
    
    for (const subdir of subdirs) {
      await fs.ensureDir(path.join(projectPath, subdir));
    }
    
    // Create project README
    await this.createProjectReadme(projectPath, projectData);
    
    // Copy workflow templates
    await this.copyWorkflowTemplates(projectPath, projectData.type);
    
    return projectPath;
  }

  async createProjectReadme(projectPath, projectData) {
    const readme = `# ${projectData.name}

## Project Information
- **Client**: ${projectData.clientName || 'Not specified'}
- **Type**: ${projectData.type || '3D Shrunk'}
- **Status**: Active
- **Created**: ${new Date().toLocaleDateString()}
- **Deadline**: ${projectData.deadline || 'Not set'}
- **Budget**: ${projectData.budget || 'Not specified'}

## Description
${projectData.description || 'No description provided'}

## Workflow Steps
1. **Concept & Planning** - Initial consultation and planning
2. **Design Review** - Review client requirements and create design brief
3. **3D Modeling** - Create 3D models based on specifications
4. **Optimization** - Optimize models for production/shrinking process
5. **Production** - Execute the shrinking/production process
6. **Delivery** - Final quality check and delivery to client

## File Organization
- \`assets/original/\` - Original files from client
- \`assets/processed/\` - Files after initial processing
- \`assets/final/\` - Final deliverable files
- \`documentation/\` - Project documentation and notes
- \`communications/\` - Client communications and feedback
- \`deliverables/\` - Files ready for client delivery
- \`workflow/\` - Step-by-step workflow documentation

## Status Updates
Project status and updates will be tracked in the timeline below:

### Timeline
- ${new Date().toLocaleDateString()} - Project created

## Notes
Add project-specific notes and requirements here.
`;

    await fs.writeFile(path.join(projectPath, 'README.md'), readme);
  }

  async copyWorkflowTemplates(projectPath, projectType) {
    const workflowTemplates = {
      '3d_shrunk': [
        'concept_checklist.md',
        'design_brief_template.md',
        'quality_control_checklist.md',
        'delivery_checklist.md'
      ]
    };
    
    const templates = workflowTemplates[projectType] || workflowTemplates['3d_shrunk'];
    
    for (const template of templates) {
      const templatePath = path.join(this.templatesDir, template);
      const targetPath = path.join(projectPath, 'documentation', template);
      
      if (await fs.pathExists(templatePath)) {
        await fs.copy(templatePath, targetPath);
      } else {
        // Create basic template if it doesn't exist
        await this.createBasicTemplate(targetPath, template);
      }
    }
  }

  async createBasicTemplate(filePath, templateName) {
    let content = '';
    
    switch (templateName) {
      case 'concept_checklist.md':
        content = `# Concept & Planning Checklist

- [ ] Initial client consultation completed
- [ ] Project requirements documented
- [ ] Timeline established
- [ ] Budget approved
- [ ] Technical feasibility assessed
- [ ] Materials and resources identified

## Notes
`;
        break;
      
      case 'design_brief_template.md':
        content = `# Design Brief

## Client Requirements
- 

## Technical Specifications
- 

## Constraints
- 

## Success Criteria
- 

## Timeline
- 

## Deliverables
- 
`;
        break;
      
      case 'quality_control_checklist.md':
        content = `# Quality Control Checklist

## Pre-Production
- [ ] Design approved by client
- [ ] Technical specifications verified
- [ ] Materials quality checked

## Production
- [ ] Process parameters verified
- [ ] Quality checkpoints passed
- [ ] Documentation updated

## Post-Production
- [ ] Final output quality verified
- [ ] Client acceptance obtained
- [ ] Files archived properly
`;
        break;
      
      case 'delivery_checklist.md':
        content = `# Delivery Checklist

## Final Deliverables
- [ ] All required files prepared
- [ ] Quality control completed
- [ ] Documentation finalized
- [ ] Client communication sent

## Handover
- [ ] Files delivered to client
- [ ] Instructions provided
- [ ] Support documentation included
- [ ] Project archived
`;
        break;
      
      default:
        content = `# ${templateName.replace(/[_-]/g, ' ').replace('.md', '')}

This is a template file for the project workflow.
`;
    }
    
    await fs.writeFile(filePath, content);
  }

  getWorkflowSteps(projectType) {
    const workflows = {
      '3d_shrunk': [
        {
          step: 1,
          name: 'Concept & Planning',
          status: 'pending',
          description: 'Initial consultation and project planning',
          estimatedHours: 2,
          deliverables: ['Project brief', 'Timeline', 'Cost estimate']
        },
        {
          step: 2,
          name: 'Design Review',
          status: 'pending',
          description: 'Review requirements and create design specification',
          estimatedHours: 4,
          deliverables: ['Design brief', 'Technical specifications']
        },
        {
          step: 3,
          name: '3D Modeling',
          status: 'pending',
          description: 'Create 3D models based on specifications',
          estimatedHours: 8,
          deliverables: ['3D models', 'Preview renders']
        },
        {
          step: 4,
          name: 'Optimization',
          status: 'pending',
          description: 'Optimize models for shrinking process',
          estimatedHours: 4,
          deliverables: ['Optimized models', 'Process parameters']
        },
        {
          step: 5,
          name: 'Production',
          status: 'pending',
          description: 'Execute shrinking/production process',
          estimatedHours: 6,
          deliverables: ['Completed product', 'Quality reports']
        },
        {
          step: 6,
          name: 'Delivery',
          status: 'pending',
          description: 'Final quality check and delivery',
          estimatedHours: 2,
          deliverables: ['Final product', 'Documentation', 'Support materials']
        }
      ]
    };
    
    return workflows[projectType] || workflows['3d_shrunk'];
  }

  async initializeWorkflow(projectId, workflow) {
    const workflowPath = path.join(this.baseDir, 'config', 'workflows.json');
    
    let workflows = {};
    if (await fs.pathExists(workflowPath)) {
      workflows = await fs.readJson(workflowPath);
    }
    
    workflows[projectId] = {
      projectId: projectId,
      steps: workflow,
      currentStep: 1,
      started: new Date().toISOString(),
      updated: new Date().toISOString()
    };
    
    await fs.writeJson(workflowPath, workflows, { spaces: 2 });
  }

  async saveProjectMetadata(projectId, metadata) {
    const metaPath = path.join(this.baseDir, 'config', 'projects.json');
    
    let projects = {};
    if (await fs.pathExists(metaPath)) {
      projects = await fs.readJson(metaPath);
    }
    
    projects[projectId] = metadata;
    
    await fs.writeJson(metaPath, projects, { spaces: 2 });
  }

  async getProject(projectId) {
    const metaPath = path.join(this.baseDir, 'config', 'projects.json');
    
    if (!(await fs.pathExists(metaPath))) {
      throw new Error('No projects found');
    }
    
    const projects = await fs.readJson(metaPath);
    
    if (!projects[projectId]) {
      throw new Error(`Project ${projectId} not found`);
    }
    
    return projects[projectId];
  }

  async updateProjectStatus(projectId, status) {
    const project = await this.getProject(projectId);
    project.status = status;
    project.updated = new Date().toISOString();
    
    await this.saveProjectMetadata(projectId, project);
    
    // Move project folder if status changed to completed or archived
    if (status === 'completed' || status === 'archived') {
      await this.moveProject(project, status);
    }
    
    return project;
  }

  async moveProject(project, newStatus) {
    const currentPath = project.folderPath;
    const newPath = currentPath.replace('/active/', `/${newStatus}/`);
    
    await fs.ensureDir(path.dirname(newPath));
    await fs.move(currentPath, newPath);
    
    project.folderPath = newPath;
    await this.saveProjectMetadata(project.id, project);
  }

  async listProjects(status = null) {
    const metaPath = path.join(this.baseDir, 'config', 'projects.json');
    
    if (!(await fs.pathExists(metaPath))) {
      return [];
    }
    
    const projects = await fs.readJson(metaPath);
    const projectList = Object.values(projects);
    
    if (status) {
      return projectList.filter(p => p.status === status);
    }
    
    return projectList;
  }

  async generateProjectReport() {
    const projects = await this.listProjects();
    
    const report = {
      totalProjects: projects.length,
      byStatus: {},
      byType: {},
      byPriority: {},
      totalBudget: 0
    };
    
    projects.forEach(project => {
      // Count by status
      if (!report.byStatus[project.status]) {
        report.byStatus[project.status] = 0;
      }
      report.byStatus[project.status]++;
      
      // Count by type
      if (!report.byType[project.type]) {
        report.byType[project.type] = 0;
      }
      report.byType[project.type]++;
      
      // Count by priority
      if (!report.byPriority[project.priority]) {
        report.byPriority[project.priority] = 0;
      }
      report.byPriority[project.priority]++;
      
      // Sum budget
      if (project.budget && !isNaN(project.budget)) {
        report.totalBudget += parseFloat(project.budget);
      }
    });
    
    console.log('\n📊 Project Report:');
    console.log('==================');
    console.log(`Total Projects: ${report.totalProjects}`);
    console.log(`Total Budget: $${report.totalBudget.toFixed(2)}`);
    
    console.log('\nBy Status:');
    Object.entries(report.byStatus).forEach(([status, count]) => {
      console.log(`  ${status}: ${count}`);
    });
    
    console.log('\nBy Type:');
    Object.entries(report.byType).forEach(([type, count]) => {
      console.log(`  ${type}: ${count}`);
    });
    
    console.log('\nBy Priority:');
    Object.entries(report.byPriority).forEach(([priority, count]) => {
      console.log(`  ${priority}: ${count}`);
    });
    
    return report;
  }
}

// CLI Usage
if (require.main === module) {
  const manager = new ProjectManager();
  const command = process.argv[2];
  
  switch (command) {
    case 'create':
      const sampleProject = {
        name: 'Sample 3D Shrunk Project',
        clientName: 'John Doe',
        clientId: 'client-123',
        type: '3d_shrunk',
        priority: 'high',
        description: 'Sample project for testing the system',
        budget: 500,
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      };
      manager.createProject(sampleProject);
      break;
      
    case 'list':
      manager.listProjects().then(projects => {
        console.log('📋 Projects:');
        projects.forEach(project => {
          console.log(`  ${project.name} (${project.status}) - ${project.clientName}`);
        });
      });
      break;
      
    case 'report':
      manager.generateProjectReport();
      break;
      
    default:
      console.log('Usage: node project-manager.js [create|list|report]');
  }
}

module.exports = ProjectManager;