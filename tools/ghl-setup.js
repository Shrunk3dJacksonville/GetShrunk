#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');
const readline = require('readline');
const GoHighLevelClient = require('../ghl-integration/api/ghl-client');

class GHLSetup {
  constructor() {
    this.baseDir = process.cwd();
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  async setupInteractive() {
    console.log('🔗 GoHighLevel Integration Setup');
    console.log('================================\n');
    
    console.log('To connect GoHighLevel, you\'ll need:');
    console.log('1. Your GHL API Key (from Settings → Integrations → API)');
    console.log('2. Your Location ID (from Settings → Company)\n');
    
    try {
      // Get API credentials
      const apiKey = await this.askQuestion('Enter your GoHighLevel API Key: ');
      const locationId = await this.askQuestion('Enter your Location ID: ');
      
      console.log('\n🔍 Testing connection...');
      
      // Test the connection
      const testResult = await this.testConnection(apiKey, locationId);
      
      if (testResult.success) {
        console.log('✅ Connection successful!');
        console.log(`📊 Account: ${testResult.accountInfo.name || 'Unknown'}`);
        console.log(`📍 Location: ${testResult.locationInfo.name || 'Unknown'}`);
        
        // Save configuration
        await this.saveConfiguration(apiKey, locationId);
        
        // Set up webhooks (optional)
        const setupWebhooks = await this.askQuestion('\nWould you like to set up webhooks for real-time sync? (y/n): ');
        
        if (setupWebhooks.toLowerCase() === 'y') {
          await this.setupWebhooks(apiKey, locationId);
        }
        
        // Initial sync
        const doInitialSync = await this.askQuestion('Would you like to do an initial data sync? (y/n): ');
        
        if (doInitialSync.toLowerCase() === 'y') {
          await this.performInitialSync();
        }
        
        console.log('\n🎉 GoHighLevel integration setup complete!');
        console.log('You can now:');
        console.log('- Sync contacts automatically');
        console.log('- Create opportunities from projects');
        console.log('- Upload files to client records');
        console.log('- Track customer interactions');
        
      } else {
        console.error('❌ Connection failed:', testResult.error);
        console.log('\nPlease check your credentials and try again.');
        console.log('Common issues:');
        console.log('- API key is incorrect or expired');
        console.log('- Location ID doesn\'t match your account');
        console.log('- API permissions are insufficient');
      }
      
    } catch (error) {
      console.error('❌ Setup failed:', error.message);
    } finally {
      this.rl.close();
    }
  }

  async testConnection(apiKey, locationId) {
    try {
      // Create temporary config for testing
      const testConfig = {
        api: {
          baseUrl: "https://services.leadconnectorhq.com",
          version: "2021-07-28",
          credentials: {
            apiKey: apiKey,
            locationId: locationId
          }
        }
      };
      
      const client = new GoHighLevelClient(testConfig);
      
      // Test basic API access
      const contacts = await client.getContacts({ limit: 1 });
      
      // Get account info if possible
      const accountInfo = { name: 'Connected Successfully' };
      const locationInfo = { name: locationId };
      
      return {
        success: true,
        accountInfo: accountInfo,
        locationInfo: locationInfo,
        contacts: contacts.contacts?.length || 0
      };
      
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async saveConfiguration(apiKey, locationId) {
    console.log('💾 Saving configuration...');
    
    try {
      // Update main config file
      const configPath = path.join(this.baseDir, 'config', 'ghl-config.json');
      const config = await fs.readJson(configPath);
      
      config.api.credentials.apiKey = apiKey;
      config.api.credentials.locationId = locationId;
      
      await fs.writeJson(configPath, config, { spaces: 2 });
      
      // Update .env file
      const envPath = path.join(this.baseDir, 'config', '.env');
      let envContent = '';
      
      if (await fs.pathExists(envPath)) {
        envContent = await fs.readFile(envPath, 'utf8');
      }
      
      // Update or add GHL credentials
      const envLines = envContent.split('\n');
      const updatedLines = [];
      let foundApiKey = false;
      let foundLocationId = false;
      
      envLines.forEach(line => {
        if (line.startsWith('GHL_API_KEY=')) {
          updatedLines.push(`GHL_API_KEY=${apiKey}`);
          foundApiKey = true;
        } else if (line.startsWith('GHL_LOCATION_ID=')) {
          updatedLines.push(`GHL_LOCATION_ID=${locationId}`);
          foundLocationId = true;
        } else {
          updatedLines.push(line);
        }
      });
      
      if (!foundApiKey) {
        updatedLines.push(`GHL_API_KEY=${apiKey}`);
      }
      
      if (!foundLocationId) {
        updatedLines.push(`GHL_LOCATION_ID=${locationId}`);
      }
      
      await fs.writeFile(envPath, updatedLines.join('\n'));
      
      console.log('✅ Configuration saved');
      
    } catch (error) {
      console.error('❌ Error saving configuration:', error.message);
      throw error;
    }
  }

  async setupWebhooks(apiKey, locationId) {
    console.log('🔗 Setting up webhooks...');
    
    try {
      // In a real implementation, you would:
      // 1. Get your public URL (use ngrok or similar for development)
      // 2. Register webhook endpoints with GHL
      // 3. Configure webhook events
      
      const publicUrl = await this.getPublicUrl();
      
      if (publicUrl) {
        console.log(`📡 Webhook URL: ${publicUrl}/webhooks/ghl`);
        console.log('ℹ️  You need to manually configure this webhook in your GHL account:');
        console.log('   1. Go to Settings → Integrations → Webhooks');
        console.log('   2. Add new webhook with URL above');
        console.log('   3. Select events: ContactCreate, ContactUpdate, OpportunityCreate, OpportunityUpdate');
        
        // Update config with webhook URL
        const configPath = path.join(this.baseDir, 'config', 'ghl-config.json');
        const config = await fs.readJson(configPath);
        config.webhooks.endpoint = `${publicUrl}/webhooks/ghl`;
        await fs.writeJson(configPath, config, { spaces: 2 });
        
      } else {
        console.log('ℹ️  Webhooks will be configured later when you deploy to production');
      }
      
    } catch (error) {
      console.warn('⚠️  Webhook setup skipped:', error.message);
    }
  }

  async getPublicUrl() {
    // Try to detect if we're in a cloud environment
    const port = process.env.PORT || 3000;
    
    // Check for common cloud environment variables
    if (process.env.E2B_SANDBOX_ID) {
      // E2B sandbox
      return `https://${port}-${process.env.E2B_SANDBOX_ID}.e2b.dev`;
    } else if (process.env.REPL_SLUG && process.env.REPL_OWNER) {
      // Replit
      return `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`;
    } else if (process.env.CODESPACE_NAME) {
      // GitHub Codespaces
      return `https://${process.env.CODESPACE_NAME}-${port}.githubpreview.dev`;
    }
    
    return null;
  }

  async performInitialSync() {
    console.log('🔄 Performing initial sync...');
    
    try {
      const SyncManager = require('../ghl-integration/sync-manager');
      const syncManager = new SyncManager();
      
      // Sync contacts first
      console.log('📞 Syncing contacts...');
      const contactResults = await syncManager.syncAllContacts();
      
      console.log(`✅ Contact sync complete:`);
      console.log(`   - Processed: ${contactResults.processed}`);
      console.log(`   - Created: ${contactResults.created}`);
      console.log(`   - Updated: ${contactResults.updated}`);
      console.log(`   - Errors: ${contactResults.errors}`);
      
      // Sync opportunities/projects
      console.log('📋 Syncing projects...');
      const projectResults = await syncManager.syncProjectOpportunities();
      
      console.log(`✅ Project sync complete:`);
      console.log(`   - Processed: ${projectResults.processed}`);
      console.log(`   - Created: ${projectResults.created}`);
      console.log(`   - Errors: ${projectResults.errors}`);
      
    } catch (error) {
      console.error('❌ Sync failed:', error.message);
      console.log('You can run sync manually later using: npm run ghl-sync');
    }
  }

  async askQuestion(question) {
    return new Promise((resolve) => {
      this.rl.question(question, (answer) => {
        resolve(answer.trim());
      });
    });
  }

  async quickSetup(apiKey, locationId) {
    console.log('🚀 Quick Setup Mode');
    console.log('==================\n');
    
    try {
      const testResult = await this.testConnection(apiKey, locationId);
      
      if (testResult.success) {
        await this.saveConfiguration(apiKey, locationId);
        console.log('✅ GoHighLevel connected successfully!');
        return true;
      } else {
        console.error('❌ Connection failed:', testResult.error);
        return false;
      }
      
    } catch (error) {
      console.error('❌ Quick setup failed:', error.message);
      return false;
    }
  }

  async showStatus() {
    console.log('📊 GoHighLevel Integration Status');
    console.log('=================================\n');
    
    try {
      const configPath = path.join(this.baseDir, 'config', 'ghl-config.json');
      const config = await fs.readJson(configPath);
      
      const apiKey = config.api.credentials.apiKey;
      const locationId = config.api.credentials.locationId;
      
      if (apiKey === 'YOUR_GHL_API_KEY_HERE' || !apiKey) {
        console.log('❌ Not configured - Run setup first');
        return;
      }
      
      console.log('🔍 Testing current configuration...');
      const testResult = await this.testConnection(apiKey, locationId);
      
      if (testResult.success) {
        console.log('✅ Status: Connected');
        console.log(`📊 Contacts Available: ${testResult.contacts}`);
        console.log(`🔑 API Key: ${apiKey.substring(0, 10)}...`);
        console.log(`📍 Location ID: ${locationId}`);
        
        // Show sync status
        const ClientManager = require('./client-manager');
        const ProjectManager = require('./project-manager');
        
        const clientManager = new ClientManager();
        const projectManager = new ProjectManager();
        
        const clients = await clientManager.listClients();
        const projects = await projectManager.listProjects();
        
        const syncedClients = clients.filter(c => c.ghlContactId).length;
        const syncedProjects = projects.filter(p => p.ghlOpportunityId).length;
        
        console.log(`\n📈 Sync Status:`);
        console.log(`   Local Clients: ${clients.length} (${syncedClients} synced)`);
        console.log(`   Local Projects: ${projects.length} (${syncedProjects} synced)`);
        
      } else {
        console.log('❌ Status: Connection Failed');
        console.log(`   Error: ${testResult.error}`);
      }
      
    } catch (error) {
      console.error('❌ Error checking status:', error.message);
    }
  }
}

// CLI Usage
if (require.main === module) {
  const setup = new GHLSetup();
  const command = process.argv[2];
  
  switch (command) {
    case 'interactive':
    case undefined:
      setup.setupInteractive();
      break;
      
    case 'quick':
      const apiKey = process.argv[3];
      const locationId = process.argv[4];
      if (!apiKey || !locationId) {
        console.log('Usage: node ghl-setup.js quick <apiKey> <locationId>');
        process.exit(1);
      }
      setup.quickSetup(apiKey, locationId);
      break;
      
    case 'status':
      setup.showStatus();
      break;
      
    default:
      console.log('Usage: node ghl-setup.js [interactive|quick <apiKey> <locationId>|status]');
  }
}

module.exports = GHLSetup;