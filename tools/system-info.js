#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');

class SystemInfo {
  constructor() {
    this.baseDir = process.cwd();
  }

  async getSystemOverview() {
    console.log('🔍 Shrunk 3D Business Organization System Overview');
    console.log('===============================================\n');

    // Basic system info
    console.log('📊 System Information:');
    console.log(`   Working Directory: ${this.baseDir}`);
    console.log(`   Node.js Version: ${process.version}`);
    console.log(`   Platform: ${process.platform} ${process.arch}`);
    console.log(`   System Time: ${new Date().toLocaleString()}\n`);

    // Directory structure status
    await this.checkDirectoryStructure();

    // File statistics
    await this.getFileStatistics();

    // Configuration status
    await this.checkConfiguration();

    // Service status
    await this.checkServices();

    // Integration status
    await this.checkIntegrations();
  }

  async checkDirectoryStructure() {
    console.log('📁 Directory Structure:');
    
    const requiredDirs = [
      'assets/images',
      'assets/3d-models',
      'assets/documents',
      'clients',
      'projects/active',
      'projects/completed',
      'ghl-integration',
      'tools',
      'config',
      'public'
    ];

    for (const dir of requiredDirs) {
      const dirPath = path.join(this.baseDir, dir);
      const exists = await fs.pathExists(dirPath);
      const status = exists ? '✅' : '❌';
      console.log(`   ${status} ${dir}`);
    }
    console.log();
  }

  async getFileStatistics() {
    console.log('📈 File Statistics:');
    
    try {
      const stats = {
        images: await this.countFilesInDirectory('assets/images'),
        models: await this.countFilesInDirectory('assets/3d-models'),
        documents: await this.countFilesInDirectory('assets/documents'),
        clients: await this.countDirectoriesInPath('clients'),
        projects: await this.countDirectoriesInPath('projects/active')
      };

      console.log(`   Images: ${stats.images} files`);
      console.log(`   3D Models: ${stats.models} files`);
      console.log(`   Documents: ${stats.documents} files`);
      console.log(`   Clients: ${stats.clients} folders`);
      console.log(`   Active Projects: ${stats.projects} folders`);
      console.log();

    } catch (error) {
      console.log(`   ❌ Error getting file statistics: ${error.message}\n`);
    }
  }

  async countFilesInDirectory(relativePath) {
    const dirPath = path.join(this.baseDir, relativePath);
    if (!(await fs.pathExists(dirPath))) return 0;

    let count = 0;
    const items = await fs.readdir(dirPath);
    
    for (const item of items) {
      const itemPath = path.join(dirPath, item);
      const stat = await fs.stat(itemPath);
      
      if (stat.isFile()) {
        count++;
      } else if (stat.isDirectory()) {
        count += await this.countFilesInDirectory(path.join(relativePath, item));
      }
    }
    
    return count;
  }

  async countDirectoriesInPath(relativePath) {
    const dirPath = path.join(this.baseDir, relativePath);
    if (!(await fs.pathExists(dirPath))) return 0;

    const items = await fs.readdir(dirPath);
    let count = 0;
    
    for (const item of items) {
      const itemPath = path.join(dirPath, item);
      const stat = await fs.stat(itemPath);
      if (stat.isDirectory()) count++;
    }
    
    return count;
  }

  async checkConfiguration() {
    console.log('⚙️  Configuration Status:');
    
    const configFiles = [
      'package.json',
      'config/ghl-config.json',
      'config/.env',
      '.gitignore'
    ];

    for (const configFile of configFiles) {
      const filePath = path.join(this.baseDir, configFile);
      const exists = await fs.pathExists(filePath);
      const status = exists ? '✅' : '❌';
      console.log(`   ${status} ${configFile}`);
    }

    // Check if .env has been configured
    const envPath = path.join(this.baseDir, 'config/.env');
    if (await fs.pathExists(envPath)) {
      const envContent = await fs.readFile(envPath, 'utf8');
      const hasApiKey = envContent.includes('your_api_key_here') === false;
      console.log(`   ${hasApiKey ? '✅' : '⚠️ '} GoHighLevel API configured: ${hasApiKey ? 'Yes' : 'No (using defaults)'}`);
    }
    console.log();
  }

  async checkServices() {
    console.log('🚀 Services Status:');
    
    try {
      // Check if dashboard is running
      const response = await fetch('http://localhost:3000/api/status').catch(() => null);
      console.log(`   ${response ? '✅' : '❌'} Dashboard Server: ${response ? 'Running' : 'Not running'}`);
      
      if (response) {
        const status = await response.json();
        console.log(`   📊 Server Status: ${status.server}`);
        console.log(`   🔗 GHL Integration: ${status.ghlIntegration ? 'Connected' : 'Not connected'}`);
      }
      
    } catch (error) {
      console.log(`   ❌ Error checking services: ${error.message}`);
    }
    console.log();
  }

  async checkIntegrations() {
    console.log('🔗 Integration Status:');
    
    try {
      // Check client data
      const clientsConfigPath = path.join(this.baseDir, 'config/clients.json');
      if (await fs.pathExists(clientsConfigPath)) {
        const clients = await fs.readJson(clientsConfigPath);
        const clientCount = Object.keys(clients).length;
        const syncedCount = Object.values(clients).filter(c => c.ghlContactId).length;
        console.log(`   👥 Local Clients: ${clientCount} (${syncedCount} synced with GHL)`);
      } else {
        console.log('   👥 Local Clients: 0');
      }

      // Check project data
      const projectsConfigPath = path.join(this.baseDir, 'config/projects.json');
      if (await fs.pathExists(projectsConfigPath)) {
        const projects = await fs.readJson(projectsConfigPath);
        const projectCount = Object.keys(projects).length;
        const syncedCount = Object.values(projects).filter(p => p.ghlOpportunityId).length;
        console.log(`   📋 Local Projects: ${projectCount} (${syncedCount} synced with GHL)`);
      } else {
        console.log('   📋 Local Projects: 0');
      }

      // Check backup configuration
      const backupPath = process.env.AIDRIVE_PATH || '/mnt/aidrive/shrunk-3d-backups';
      const aiDriveExists = await fs.pathExists('/mnt/aidrive');
      console.log(`   💾 AI Drive Access: ${aiDriveExists ? 'Available' : 'Not mounted'}`);
      console.log(`   📦 Backup Location: ${backupPath}`);

    } catch (error) {
      console.log(`   ❌ Error checking integrations: ${error.message}`);
    }
    console.log();
  }

  async getQuickCommands() {
    console.log('⚡ Quick Commands:');
    console.log('================');
    console.log('Start Dashboard:     npm start');
    console.log('Organize Files:      npm run organize');
    console.log('Create Backup:       npm run backup');
    console.log('Sync with GHL:       npm run ghl-sync');
    console.log('Setup New Client:    npm run client-setup');
    console.log('Create New Project:  npm run project-create');
    console.log('Search Files:        npm run search');
    console.log();
    console.log('Individual Tools:');
    console.log('Client Management:   node tools/client-manager.js [setup|list|sync|report]');
    console.log('Project Management:  node tools/project-manager.js [create|list|report]');
    console.log('File Organization:   node tools/file-organizer.js [organize|index|all]');
    console.log('Backup Management:   node tools/backup-manager.js [create|list|clean|stats]');
    console.log('GHL Sync:           node ghl-integration/sync-manager.js [contacts|projects|all]');
    console.log();
  }

  async getSystemHealth() {
    console.log('🏥 System Health Check:');
    console.log('======================');

    let healthScore = 0;
    const checks = [];

    // Directory structure (20 points)
    const requiredDirs = ['assets', 'clients', 'projects', 'tools', 'config'];
    let dirScore = 0;
    for (const dir of requiredDirs) {
      if (await fs.pathExists(path.join(this.baseDir, dir))) {
        dirScore += 4;
      }
    }
    checks.push({ name: 'Directory Structure', score: dirScore, max: 20 });
    healthScore += dirScore;

    // Configuration (20 points)
    let configScore = 0;
    const configFiles = ['package.json', 'config/ghl-config.json'];
    for (const file of configFiles) {
      if (await fs.pathExists(path.join(this.baseDir, file))) {
        configScore += 10;
      }
    }
    checks.push({ name: 'Configuration Files', score: configScore, max: 20 });
    healthScore += configScore;

    // Dependencies (20 points)
    let depScore = 0;
    if (await fs.pathExists(path.join(this.baseDir, 'node_modules'))) {
      depScore = 20;
    }
    checks.push({ name: 'Dependencies Installed', score: depScore, max: 20 });
    healthScore += depScore;

    // Services (20 points)
    let serviceScore = 0;
    try {
      const response = await fetch('http://localhost:3000/api/status').catch(() => null);
      if (response) serviceScore = 20;
    } catch (error) {
      // Service not running
    }
    checks.push({ name: 'Dashboard Service', score: serviceScore, max: 20 });
    healthScore += serviceScore;

    // Data integrity (20 points)
    let dataScore = 0;
    const clientsExist = await fs.pathExists(path.join(this.baseDir, 'config/clients.json'));
    const projectsExist = await fs.pathExists(path.join(this.baseDir, 'config/projects.json'));
    if (clientsExist) dataScore += 10;
    if (projectsExist) dataScore += 10;
    checks.push({ name: 'Data Files', score: dataScore, max: 20 });
    healthScore += dataScore;

    // Display results
    for (const check of checks) {
      const percentage = Math.round((check.score / check.max) * 100);
      const status = percentage === 100 ? '✅' : percentage >= 70 ? '⚠️ ' : '❌';
      console.log(`   ${status} ${check.name}: ${check.score}/${check.max} (${percentage}%)`);
    }

    const totalPercentage = Math.round((healthScore / 100) * 100);
    const overallStatus = totalPercentage >= 90 ? '🟢 Excellent' : 
                         totalPercentage >= 70 ? '🟡 Good' : 
                         totalPercentage >= 50 ? '🟠 Fair' : '🔴 Poor';

    console.log(`\n🎯 Overall Health: ${healthScore}/100 (${totalPercentage}%) - ${overallStatus}\n`);
  }
}

// CLI Usage
if (require.main === module) {
  const systemInfo = new SystemInfo();
  const command = process.argv[2];

  switch (command) {
    case 'overview':
    case undefined:
      systemInfo.getSystemOverview();
      break;
      
    case 'health':
      systemInfo.getSystemHealth();
      break;
      
    case 'commands':
      systemInfo.getQuickCommands();
      break;
      
    default:
      console.log('Usage: node system-info.js [overview|health|commands]');
  }
}

module.exports = SystemInfo;