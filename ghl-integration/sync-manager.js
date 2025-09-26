#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');
const GoHighLevelClient = require('./api/ghl-client');
const ClientManager = require('../tools/client-manager');
const ProjectManager = require('../tools/project-manager');

class SyncManager {
  constructor() {
    this.baseDir = process.cwd();
    this.ghlClient = null;
    this.clientManager = new ClientManager();
    this.projectManager = new ProjectManager();
    this.syncConfig = this.loadSyncConfig();
    this.initGHL();
  }

  loadSyncConfig() {
    try {
      const configPath = path.join(this.baseDir, 'config', 'ghl-config.json');
      const config = fs.readJsonSync(configPath);
      return config.sync;
    } catch (error) {
      console.warn('⚠️  Could not load sync configuration');
      return {
        autoSync: false,
        syncInterval: 300000, // 5 minutes
        syncFields: ['firstName', 'lastName', 'email', 'phone', 'tags']
      };
    }
  }

  async initGHL() {
    try {
      this.ghlClient = new GoHighLevelClient();
      const status = await this.ghlClient.testConnection();
      
      if (!status.connected) {
        console.warn('⚠️  GoHighLevel not connected. Sync will not work.');
      }
    } catch (error) {
      console.warn('⚠️  GoHighLevel integration not configured.');
    }
  }

  async syncAllContacts() {
    if (!this.ghlClient) {
      throw new Error('GoHighLevel client not initialized');
    }

    console.log('🔄 Starting full contact sync...');
    
    try {
      // Get all contacts from GHL
      const ghlContacts = await this.ghlClient.getContacts({
        limit: 100 // Adjust as needed
      });

      // Get all local clients
      const localClients = await this.clientManager.listClients();
      
      const syncResults = {
        processed: 0,
        created: 0,
        updated: 0,
        errors: 0,
        details: []
      };

      console.log(`📊 GHL Contacts: ${ghlContacts.contacts?.length || 0}`);
      console.log(`📊 Local Clients: ${localClients.length}`);

      // Sync GHL contacts to local clients
      if (ghlContacts.contacts) {
        for (const ghlContact of ghlContacts.contacts) {
          try {
            const result = await this.syncContactToLocal(ghlContact, localClients);
            syncResults.processed++;
            
            if (result.action === 'created') {
              syncResults.created++;
            } else if (result.action === 'updated') {
              syncResults.updated++;
            }
            
            syncResults.details.push(result);
            
          } catch (error) {
            console.error(`❌ Error syncing contact ${ghlContact.id}:`, error.message);
            syncResults.errors++;
            syncResults.details.push({
              id: ghlContact.id,
              action: 'error',
              error: error.message
            });
          }
        }
      }

      // Sync local clients to GHL (for clients not yet in GHL)
      for (const localClient of localClients) {
        if (!localClient.ghlContactId) {
          try {
            const result = await this.syncLocalToGHL(localClient);
            syncResults.processed++;
            
            if (result.action === 'created') {
              syncResults.created++;
            }
            
            syncResults.details.push(result);
            
          } catch (error) {
            console.error(`❌ Error syncing local client ${localClient.id}:`, error.message);
            syncResults.errors++;
          }
        }
      }

      console.log(`✅ Sync completed:`);
      console.log(`   Processed: ${syncResults.processed}`);
      console.log(`   Created: ${syncResults.created}`);
      console.log(`   Updated: ${syncResults.updated}`);
      console.log(`   Errors: ${syncResults.errors}`);

      return syncResults;

    } catch (error) {
      console.error('❌ Full sync failed:', error.message);
      throw error;
    }
  }

  async syncContactToLocal(ghlContact, localClients) {
    // Find existing local client by GHL contact ID or email
    let localClient = localClients.find(client => 
      client.ghlContactId === ghlContact.id || 
      client.email === ghlContact.email
    );

    const contactData = {
      firstName: ghlContact.firstName || '',
      lastName: ghlContact.lastName || '',
      email: ghlContact.email || '',
      phone: ghlContact.phone || '',
      ghlContactId: ghlContact.id
    };

    if (localClient) {
      // Update existing client
      await this.clientManager.updateClient(localClient.id, contactData);
      return {
        id: ghlContact.id,
        localId: localClient.id,
        action: 'updated',
        name: `${contactData.firstName} ${contactData.lastName}`
      };
    } else {
      // Create new local client
      const newClient = await this.clientManager.setupClient(contactData);
      return {
        id: ghlContact.id,
        localId: newClient.id,
        action: 'created',
        name: `${contactData.firstName} ${contactData.lastName}`
      };
    }
  }

  async syncLocalToGHL(localClient) {
    const contactData = {
      firstName: localClient.firstName,
      lastName: localClient.lastName,
      email: localClient.email,
      phone: localClient.phone,
      tags: ['3d-shrunk-client']
    };

    // Create contact in GHL
    const ghlContact = await this.ghlClient.createContact(contactData);
    
    // Update local client with GHL ID
    await this.clientManager.updateClient(localClient.id, {
      ghlContactId: ghlContact.contact.id
    });

    return {
      id: ghlContact.contact.id,
      localId: localClient.id,
      action: 'created',
      name: `${localClient.firstName} ${localClient.lastName}`
    };
  }

  async syncProjectOpportunities() {
    if (!this.ghlClient) {
      throw new Error('GoHighLevel client not initialized');
    }

    console.log('🔄 Starting project-opportunity sync...');
    
    try {
      const localProjects = await this.projectManager.listProjects();
      const ghlOpportunities = await this.ghlClient.getOpportunities();

      const syncResults = {
        processed: 0,
        created: 0,
        updated: 0,
        errors: 0
      };

      for (const project of localProjects) {
        try {
          if (!project.ghlOpportunityId) {
            // Create opportunity in GHL
            const opportunityData = {
              title: `3D Project: ${project.name}`,
              contactId: project.ghlContactId, // Must have synced contact first
              status: this.mapProjectStatusToGHL(project.status),
              monetaryValue: parseFloat(project.budget) || 0,
              customFields: [
                {
                  key: 'project_type',
                  field_value: project.type
                },
                {
                  key: 'project_priority',
                  field_value: project.priority
                },
                {
                  key: 'local_project_id',
                  field_value: project.id
                }
              ]
            };

            if (project.ghlContactId) {
              const ghlOpportunity = await this.ghlClient.createOpportunity(opportunityData);
              
              // Update local project
              await this.projectManager.updateProject(project.id, {
                ghlOpportunityId: ghlOpportunity.opportunity.id
              });

              syncResults.created++;
            }
          }
          
          syncResults.processed++;
          
        } catch (error) {
          console.error(`❌ Error syncing project ${project.id}:`, error.message);
          syncResults.errors++;
        }
      }

      console.log(`✅ Project sync completed:`);
      console.log(`   Processed: ${syncResults.processed}`);
      console.log(`   Created: ${syncResults.created}`);
      console.log(`   Errors: ${syncResults.errors}`);

      return syncResults;

    } catch (error) {
      console.error('❌ Project sync failed:', error.message);
      throw error;
    }
  }

  mapProjectStatusToGHL(localStatus) {
    const statusMap = {
      'active': 'open',
      'completed': 'won',
      'archived': 'lost',
      'pending': 'open'
    };
    
    return statusMap[localStatus] || 'open';
  }

  async syncProjectFiles(projectId) {
    console.log(`📁 Syncing files for project: ${projectId}`);
    
    try {
      const project = await this.projectManager.getProject(projectId);
      
      if (!project.ghlOpportunityId) {
        throw new Error('Project not synced with GHL. Sync projects first.');
      }

      // Get project files
      const projectFiles = await this.getProjectFiles(project.folderPath);
      
      // Upload files to GHL
      const uploadResults = await this.ghlClient.syncProjectFiles(
        project.ghlOpportunityId, 
        projectFiles
      );

      console.log(`✅ Synced ${uploadResults.length} files for project ${project.name}`);
      
      return uploadResults;

    } catch (error) {
      console.error('❌ File sync failed:', error.message);
      throw error;
    }
  }

  async getProjectFiles(projectPath) {
    const files = [];
    
    if (!(await fs.pathExists(projectPath))) {
      return files;
    }

    const items = await fs.readdir(projectPath);
    
    for (const item of items) {
      const itemPath = path.join(projectPath, item);
      const stat = await fs.stat(itemPath);
      
      if (stat.isFile() && this.isFileTypeAllowed(item)) {
        files.push(itemPath);
      } else if (stat.isDirectory() && item !== 'node_modules') {
        // Recursively get files from subdirectories
        const subFiles = await this.getProjectFiles(itemPath);
        files.push(...subFiles);
      }
    }
    
    return files;
  }

  isFileTypeAllowed(filename) {
    const allowedExtensions = [
      '.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg',
      '.stl', '.obj', '.fbx', '.3mf',
      '.pdf', '.doc', '.docx', '.txt', '.md'
    ];
    
    const ext = path.extname(filename).toLowerCase();
    return allowedExtensions.includes(ext);
  }

  async setupAutoSync() {
    if (!this.syncConfig.autoSync) {
      console.log('ℹ️  Auto sync is disabled');
      return null;
    }

    console.log(`⏰ Setting up auto sync (every ${this.syncConfig.syncInterval / 1000}s)`);
    
    const interval = setInterval(async () => {
      console.log('🔄 Running scheduled sync...');
      try {
        await this.syncAllContacts();
        await this.syncProjectOpportunities();
      } catch (error) {
        console.error('❌ Scheduled sync failed:', error.message);
      }
    }, this.syncConfig.syncInterval);

    return interval;
  }

  async generateSyncReport() {
    console.log('📊 Generating sync report...');
    
    try {
      const localClients = await this.clientManager.listClients();
      const localProjects = await this.projectManager.listProjects();
      
      let ghlContacts = [];
      let ghlOpportunities = [];
      
      if (this.ghlClient) {
        try {
          const contactsResponse = await this.ghlClient.getContacts({ limit: 100 });
          ghlContacts = contactsResponse.contacts || [];
          
          const opportunitiesResponse = await this.ghlClient.getOpportunities({ limit: 100 });
          ghlOpportunities = opportunitiesResponse.opportunities || [];
        } catch (error) {
          console.warn('⚠️  Could not fetch GHL data for report');
        }
      }

      const report = {
        timestamp: new Date().toISOString(),
        local: {
          clients: localClients.length,
          projects: localProjects.length,
          syncedClients: localClients.filter(c => c.ghlContactId).length,
          syncedProjects: localProjects.filter(p => p.ghlOpportunityId).length
        },
        ghl: {
          contacts: ghlContacts.length,
          opportunities: ghlOpportunities.length
        },
        syncStatus: {
          clientsSyncPercentage: localClients.length > 0 ? 
            (localClients.filter(c => c.ghlContactId).length / localClients.length * 100).toFixed(1) : '0',
          projectsSyncPercentage: localProjects.length > 0 ? 
            (localProjects.filter(p => p.ghlOpportunityId).length / localProjects.length * 100).toFixed(1) : '0'
        }
      };

      console.log('\n📊 Sync Report:');
      console.log('===============');
      console.log(`Local Clients: ${report.local.clients} (${report.local.syncedClients} synced - ${report.syncStatus.clientsSyncPercentage}%)`);
      console.log(`Local Projects: ${report.local.projects} (${report.local.syncedProjects} synced - ${report.syncStatus.projectsSyncPercentage}%)`);
      console.log(`GHL Contacts: ${report.ghl.contacts}`);
      console.log(`GHL Opportunities: ${report.ghl.opportunities}`);
      
      return report;

    } catch (error) {
      console.error('❌ Error generating sync report:', error.message);
      throw error;
    }
  }
}

// CLI Usage
if (require.main === module) {
  const manager = new SyncManager();
  const command = process.argv[2];
  
  switch (command) {
    case 'contacts':
      manager.syncAllContacts();
      break;
      
    case 'projects':
      manager.syncProjectOpportunities();
      break;
      
    case 'files':
      const projectId = process.argv[3];
      if (!projectId) {
        console.error('Please provide project ID');
        process.exit(1);
      }
      manager.syncProjectFiles(projectId);
      break;
      
    case 'all':
      (async () => {
        await manager.syncAllContacts();
        await manager.syncProjectOpportunities();
      })();
      break;
      
    case 'auto':
      manager.setupAutoSync();
      // Keep process running
      process.stdin.resume();
      break;
      
    case 'report':
      manager.generateSyncReport();
      break;
      
    default:
      console.log('Usage: node sync-manager.js [contacts|projects|files <projectId>|all|auto|report]');
  }
}

module.exports = SyncManager;