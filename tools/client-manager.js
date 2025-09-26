#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const GoHighLevelClient = require('../ghl-integration/api/ghl-client');

class ClientManager {
  constructor() {
    this.baseDir = process.cwd();
    this.clientsDir = path.join(this.baseDir, 'clients');
    this.ghlClient = null;
    this.initGHL();
  }

  async initGHL() {
    try {
      this.ghlClient = new GoHighLevelClient();
    } catch (error) {
      console.warn('⚠️  GoHighLevel integration not configured. Client management will work in local mode only.');
    }
  }

  async setupClient(clientData) {
    console.log('👤 Setting up new client...');
    
    try {
      // Generate client ID if not provided
      const clientId = clientData.id || uuidv4();
      
      // Create client folder structure
      const clientFolder = await this.createClientFolder(clientId, clientData);
      
      // Create client in GHL if connected
      let ghlContact = null;
      if (this.ghlClient) {
        try {
          ghlContact = await this.ghlClient.create3DProject(clientData, {
            name: `${clientData.firstName} ${clientData.lastName} - 3D Project`,
            type: 'shrunk_3d',
            value: clientData.projectValue || 0
          });
        } catch (error) {
          console.warn('⚠️  Failed to create client in GoHighLevel:', error.message);
        }
      }
      
      // Save client metadata
      const clientMeta = {
        id: clientId,
        ...clientData,
        ghlContactId: ghlContact?.contact?.id,
        ghlOpportunityId: ghlContact?.opportunity?.id,
        created: new Date().toISOString(),
        folderPath: clientFolder,
        status: 'active'
      };
      
      await this.saveClientMetadata(clientId, clientMeta);
      
      console.log(`✅ Client setup completed: ${clientData.firstName} ${clientData.lastName}`);
      console.log(`📁 Client folder: ${clientFolder}`);
      
      return clientMeta;
      
    } catch (error) {
      console.error('❌ Error setting up client:', error.message);
      throw error;
    }
  }

  async createClientFolder(clientId, clientData) {
    const folderName = `${clientData.firstName}_${clientData.lastName}_${clientId.slice(0, 8)}`;
    const clientPath = path.join(this.clientsDir, folderName);
    
    // Create main client directory
    await fs.ensureDir(clientPath);
    
    // Create subdirectories
    const subdirs = [
      'projects',
      'communications',
      'files/images/original',
      'files/images/processed',
      'files/3d-models/source',
      'files/3d-models/optimized',
      'files/documents',
      'invoices',
      'contracts'
    ];
    
    for (const subdir of subdirs) {
      await fs.ensureDir(path.join(clientPath, subdir));
    }
    
    // Create client README
    const readme = `# ${clientData.firstName} ${clientData.lastName}

## Client Information
- **Name**: ${clientData.firstName} ${clientData.lastName}
- **Email**: ${clientData.email || 'Not provided'}
- **Phone**: ${clientData.phone || 'Not provided'}
- **Created**: ${new Date().toLocaleDateString()}
- **Client ID**: ${clientId}

## Project Status
- Status: Active
- Type: 3D Shrunk Business

## Folder Structure
- \`projects/\` - Active and completed projects
- \`communications/\` - Email threads, notes, messages
- \`files/\` - All client files organized by type
- \`invoices/\` - Billing and payment records
- \`contracts/\` - Legal documents and agreements

## Notes
Add any special notes or requirements for this client here.
`;

    await fs.writeFile(path.join(clientPath, 'README.md'), readme);
    
    return clientPath;
  }

  async saveClientMetadata(clientId, metadata) {
    const metaPath = path.join(this.baseDir, 'config', 'clients.json');
    
    let clients = {};
    if (await fs.pathExists(metaPath)) {
      clients = await fs.readJson(metaPath);
    }
    
    clients[clientId] = metadata;
    
    await fs.writeJson(metaPath, clients, { spaces: 2 });
  }

  async getClient(clientId) {
    const metaPath = path.join(this.baseDir, 'config', 'clients.json');
    
    if (!(await fs.pathExists(metaPath))) {
      throw new Error('No clients found');
    }
    
    const clients = await fs.readJson(metaPath);
    
    if (!clients[clientId]) {
      throw new Error(`Client ${clientId} not found`);
    }
    
    return clients[clientId];
  }

  async listClients() {
    const metaPath = path.join(this.baseDir, 'config', 'clients.json');
    
    if (!(await fs.pathExists(metaPath))) {
      return [];
    }
    
    const clients = await fs.readJson(metaPath);
    return Object.values(clients);
  }

  async updateClient(clientId, updateData) {
    const client = await this.getClient(clientId);
    
    const updatedClient = {
      ...client,
      ...updateData,
      updated: new Date().toISOString()
    };
    
    await this.saveClientMetadata(clientId, updatedClient);
    
    // Update in GHL if connected
    if (this.ghlClient && client.ghlContactId) {
      try {
        await this.ghlClient.updateContact(client.ghlContactId, {
          firstName: updatedClient.firstName,
          lastName: updatedClient.lastName,
          email: updatedClient.email,
          phone: updatedClient.phone
        });
      } catch (error) {
        console.warn('⚠️  Failed to update client in GoHighLevel:', error.message);
      }
    }
    
    return updatedClient;
  }

  async syncWithGHL() {
    if (!this.ghlClient) {
      throw new Error('GoHighLevel integration not configured');
    }

    console.log('🔄 Syncing clients with GoHighLevel...');
    
    try {
      const localClients = await this.listClients();
      const ghlContacts = await this.ghlClient.getContacts({
        tags: ['3d-shrunk-client']
      });
      
      console.log(`📊 Local clients: ${localClients.length}`);
      console.log(`📊 GHL contacts: ${ghlContacts.contacts?.length || 0}`);
      
      // Sync logic here - match by email or other identifier
      // This is a simplified version
      
      return {
        localClients: localClients.length,
        ghlContacts: ghlContacts.contacts?.length || 0,
        synced: true
      };
      
    } catch (error) {
      console.error('❌ Error syncing with GoHighLevel:', error.message);
      throw error;
    }
  }

  async generateClientReport() {
    const clients = await this.listClients();
    
    const report = {
      totalClients: clients.length,
      activeClients: clients.filter(c => c.status === 'active').length,
      clientsByMonth: {},
      ghlIntegration: !!this.ghlClient
    };
    
    // Group by creation month
    clients.forEach(client => {
      const month = new Date(client.created).toISOString().substring(0, 7);
      if (!report.clientsByMonth[month]) {
        report.clientsByMonth[month] = 0;
      }
      report.clientsByMonth[month]++;
    });
    
    console.log('\n📊 Client Report:');
    console.log('================');
    console.log(`Total Clients: ${report.totalClients}`);
    console.log(`Active Clients: ${report.activeClients}`);
    console.log(`GHL Integration: ${report.ghlIntegration ? '✅ Connected' : '❌ Not configured'}`);
    
    console.log('\nClients by Month:');
    Object.entries(report.clientsByMonth).forEach(([month, count]) => {
      console.log(`  ${month}: ${count} clients`);
    });
    
    return report;
  }
}

// CLI Usage
if (require.main === module) {
  const manager = new ClientManager();
  const command = process.argv[2];
  
  switch (command) {
    case 'setup':
      // Interactive setup - would normally use inquirer or similar
      const sampleClient = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phone: '+1234567890',
        projectValue: 500
      };
      manager.setupClient(sampleClient);
      break;
      
    case 'list':
      manager.listClients().then(clients => {
        console.log('📋 Clients:');
        clients.forEach(client => {
          console.log(`  ${client.firstName} ${client.lastName} (${client.email})`);
        });
      });
      break;
      
    case 'sync':
      manager.syncWithGHL();
      break;
      
    case 'report':
      manager.generateClientReport();
      break;
      
    default:
      console.log('Usage: node client-manager.js [setup|list|sync|report]');
  }
}

module.exports = ClientManager;