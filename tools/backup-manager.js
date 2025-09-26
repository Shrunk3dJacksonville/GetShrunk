#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');
const archiver = require('archiver');
const cron = require('node-cron');

class BackupManager {
  constructor() {
    this.baseDir = process.cwd();
    this.backupDir = process.env.AIDRIVE_PATH || '/mnt/aidrive/shrunk-3d-backups';
    this.retentionDays = parseInt(process.env.BACKUP_RETENTION_DAYS) || 30;
    this.schedule = process.env.BACKUP_SCHEDULE || '0 2 * * *'; // 2 AM daily
  }

  async createBackup(options = {}) {
    console.log('🗄️  Starting backup process...');
    
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupName = options.name || `shrunk-3d-backup-${timestamp}`;
      const backupFileName = `${backupName}.tar.gz`;
      
      // Ensure backup directory exists
      await fs.ensureDir(this.backupDir);
      
      // Create temporary backup directory locally first
      const tempBackupDir = path.join(this.baseDir, 'temp-backup');
      await fs.ensureDir(tempBackupDir);
      
      const tempBackupPath = path.join(tempBackupDir, backupFileName);
      const finalBackupPath = path.join(this.backupDir, backupFileName);
      
      // Create archive
      const output = fs.createWriteStream(tempBackupPath);
      const archive = archiver('tar', {
        gzip: true,
        gzipOptions: {
          level: 9,
          memLevel: 9
        }
      });
      
      output.on('close', async () => {
        console.log(`📦 Archive created: ${(archive.pointer() / 1024 / 1024).toFixed(2)} MB`);
        
        try {
          // Move to AI Drive (slow operation, but single file)
          console.log('📤 Moving backup to AI Drive...');
          await fs.move(tempBackupPath, finalBackupPath);
          
          // Clean up temp directory
          await fs.remove(tempBackupDir);
          
          console.log(`✅ Backup completed: ${backupFileName}`);
          
          // Clean old backups
          await this.cleanOldBackups();
          
          return {
            success: true,
            fileName: backupFileName,
            path: finalBackupPath,
            size: archive.pointer()
          };
          
        } catch (error) {
          console.error('❌ Error moving backup to AI Drive:', error.message);
          throw error;
        }
      });
      
      archive.on('error', (err) => {
        throw err;
      });
      
      archive.pipe(output);
      
      // Add directories to backup
      const itemsToBackup = [
        { source: 'assets', name: 'assets' },
        { source: 'clients', name: 'clients' },
        { source: 'projects', name: 'projects' },
        { source: 'config', name: 'config' },
        { source: 'ghl-integration', name: 'ghl-integration' },
        { source: 'marketing', name: 'marketing' }
      ];
      
      for (const item of itemsToBackup) {
        const sourcePath = path.join(this.baseDir, item.source);
        if (await fs.pathExists(sourcePath)) {
          console.log(`📁 Adding ${item.name} to backup...`);
          archive.directory(sourcePath, item.name);
        }
      }
      
      // Add important files
      const filesToBackup = [
        'package.json',
        'README.md',
        '.env.example'
      ];
      
      for (const fileName of filesToBackup) {
        const filePath = path.join(this.baseDir, fileName);
        if (await fs.pathExists(filePath)) {
          console.log(`📄 Adding ${fileName} to backup...`);
          archive.file(filePath, { name: fileName });
        }
      }
      
      // Create backup manifest
      const manifest = {
        created: new Date().toISOString(),
        version: '1.0.0',
        type: 'full',
        source: 'shrunk-3d-business',
        items: itemsToBackup.map(item => item.name),
        files: filesToBackup
      };
      
      archive.append(JSON.stringify(manifest, null, 2), { name: 'backup-manifest.json' });
      
      await archive.finalize();
      
      // Return promise that resolves when backup is complete
      return new Promise((resolve, reject) => {
        output.on('close', resolve);
        archive.on('error', reject);
      });
      
    } catch (error) {
      console.error('❌ Backup failed:', error.message);
      throw error;
    }
  }

  async restoreBackup(backupFileName) {
    console.log(`🔄 Starting restore process for ${backupFileName}...`);
    
    try {
      const backupPath = path.join(this.backupDir, backupFileName);
      
      if (!(await fs.pathExists(backupPath))) {
        throw new Error(`Backup file not found: ${backupFileName}`);
      }
      
      // Create restore confirmation
      console.log('⚠️  This will overwrite existing data. Make sure you have a recent backup!');
      
      // Extract to temporary directory first
      const tempRestoreDir = path.join(this.baseDir, 'temp-restore');
      await fs.ensureDir(tempRestoreDir);
      
      // TODO: Implement extraction logic using tar
      // For now, return a placeholder
      console.log('🚧 Restore functionality is not yet implemented');
      
      return {
        success: true,
        message: 'Restore functionality coming soon'
      };
      
    } catch (error) {
      console.error('❌ Restore failed:', error.message);
      throw error;
    }
  }

  async listBackups() {
    console.log('📋 Listing available backups...');
    
    try {
      if (!(await fs.pathExists(this.backupDir))) {
        return [];
      }
      
      const files = await fs.readdir(this.backupDir);
      const backups = [];
      
      for (const file of files) {
        if (file.endsWith('.tar.gz')) {
          const filePath = path.join(this.backupDir, file);
          const stats = await fs.stat(filePath);
          
          backups.push({
            name: file,
            size: stats.size,
            created: stats.mtime.toISOString(),
            path: filePath
          });
        }
      }
      
      // Sort by creation date (newest first)
      backups.sort((a, b) => new Date(b.created) - new Date(a.created));
      
      console.log(`📦 Found ${backups.length} backups:`);
      backups.forEach(backup => {
        const sizeMB = (backup.size / 1024 / 1024).toFixed(2);
        console.log(`  ${backup.name} - ${sizeMB} MB - ${new Date(backup.created).toLocaleDateString()}`);
      });
      
      return backups;
      
    } catch (error) {
      console.error('❌ Error listing backups:', error.message);
      return [];
    }
  }

  async cleanOldBackups() {
    console.log('🧹 Cleaning old backups...');
    
    try {
      const backups = await this.listBackups();
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.retentionDays);
      
      let deletedCount = 0;
      
      for (const backup of backups) {
        const backupDate = new Date(backup.created);
        
        if (backupDate < cutoffDate) {
          console.log(`🗑️  Deleting old backup: ${backup.name}`);
          await fs.remove(backup.path);
          deletedCount++;
        }
      }
      
      console.log(`✅ Cleanup complete. Deleted ${deletedCount} old backups.`);
      
    } catch (error) {
      console.error('❌ Error cleaning old backups:', error.message);
    }
  }

  setupScheduledBackups() {
    console.log(`⏰ Setting up scheduled backups: ${this.schedule}`);
    
    // Validate cron expression
    if (!cron.validate(this.schedule)) {
      console.error('❌ Invalid backup schedule format');
      return false;
    }
    
    const task = cron.schedule(this.schedule, async () => {
      console.log('🔄 Starting scheduled backup...');
      try {
        await this.createBackup({
          name: `scheduled-backup-${new Date().toISOString().split('T')[0]}`
        });
      } catch (error) {
        console.error('❌ Scheduled backup failed:', error.message);
      }
    }, {
      scheduled: false
    });
    
    if (process.env.AUTO_BACKUP === 'true') {
      task.start();
      console.log('✅ Scheduled backups enabled');
    } else {
      console.log('ℹ️  Scheduled backups disabled (set AUTO_BACKUP=true to enable)');
    }
    
    return task;
  }

  async getBackupStats() {
    const backups = await this.listBackups();
    
    const stats = {
      totalBackups: backups.length,
      totalSize: backups.reduce((sum, backup) => sum + backup.size, 0),
      oldestBackup: backups.length > 0 ? backups[backups.length - 1].created : null,
      newestBackup: backups.length > 0 ? backups[0].created : null,
      retentionDays: this.retentionDays,
      backupDirectory: this.backupDir
    };
    
    return stats;
  }

  async createProjectBackup(projectId) {
    console.log(`📦 Creating project-specific backup for: ${projectId}`);
    
    try {
      // Load project metadata to get folder path
      const projectsConfig = path.join(this.baseDir, 'config', 'projects.json');
      
      if (!(await fs.pathExists(projectsConfig))) {
        throw new Error('No projects configuration found');
      }
      
      const projects = await fs.readJson(projectsConfig);
      const project = projects[projectId];
      
      if (!project) {
        throw new Error(`Project ${projectId} not found`);
      }
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupName = `project-${project.name.replace(/[^a-zA-Z0-9]/g, '_')}-${timestamp}`;
      const backupFileName = `${backupName}.tar.gz`;
      
      // Create temporary backup
      const tempBackupDir = path.join(this.baseDir, 'temp-backup');
      await fs.ensureDir(tempBackupDir);
      const tempBackupPath = path.join(tempBackupDir, backupFileName);
      
      const output = fs.createWriteStream(tempBackupPath);
      const archive = archiver('tar', { gzip: true });
      
      archive.pipe(output);
      
      // Add project folder
      if (await fs.pathExists(project.folderPath)) {
        archive.directory(project.folderPath, 'project');
      }
      
      // Add project metadata
      archive.append(JSON.stringify(project, null, 2), { name: 'project-metadata.json' });
      
      await archive.finalize();
      
      return new Promise((resolve, reject) => {
        output.on('close', async () => {
          try {
            const finalPath = path.join(this.backupDir, backupFileName);
            await fs.move(tempBackupPath, finalPath);
            await fs.remove(tempBackupDir);
            
            console.log(`✅ Project backup completed: ${backupFileName}`);
            resolve({
              success: true,
              fileName: backupFileName,
              path: finalPath,
              size: archive.pointer()
            });
          } catch (error) {
            reject(error);
          }
        });
        
        archive.on('error', reject);
      });
      
    } catch (error) {
      console.error('❌ Project backup failed:', error.message);
      throw error;
    }
  }
}

// CLI Usage
if (require.main === module) {
  const manager = new BackupManager();
  const command = process.argv[2];
  
  switch (command) {
    case 'create':
      const backupName = process.argv[3];
      manager.createBackup({ name: backupName });
      break;
      
    case 'list':
      manager.listBackups();
      break;
      
    case 'clean':
      manager.cleanOldBackups();
      break;
      
    case 'schedule':
      manager.setupScheduledBackups();
      // Keep the process running
      process.stdin.resume();
      break;
      
    case 'stats':
      manager.getBackupStats().then(stats => {
        console.log('\n📊 Backup Statistics:');
        console.log('====================');
        console.log(`Total Backups: ${stats.totalBackups}`);
        console.log(`Total Size: ${(stats.totalSize / 1024 / 1024).toFixed(2)} MB`);
        console.log(`Retention Days: ${stats.retentionDays}`);
        console.log(`Backup Directory: ${stats.backupDirectory}`);
        if (stats.newestBackup) {
          console.log(`Newest Backup: ${new Date(stats.newestBackup).toLocaleDateString()}`);
        }
        if (stats.oldestBackup) {
          console.log(`Oldest Backup: ${new Date(stats.oldestBackup).toLocaleDateString()}`);
        }
      });
      break;
      
    case 'project':
      const projectId = process.argv[3];
      if (!projectId) {
        console.error('Please provide project ID');
        process.exit(1);
      }
      manager.createProjectBackup(projectId);
      break;
      
    default:
      console.log('Usage: node backup-manager.js [create|list|clean|schedule|stats|project <projectId>] [backup-name]');
  }
}

module.exports = BackupManager;