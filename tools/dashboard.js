#!/usr/bin/env node

const express = require('express');
const fs = require('fs-extra');
const path = require('path');
const multer = require('multer');
const cors = require('cors');
const FileOrganizer = require('./file-organizer');
const ClientManager = require('./client-manager');
const ProjectManager = require('./project-manager');
const PricingEngine = require('./pricing-engine');
const GoHighLevelClient = require('../ghl-integration/api/ghl-client');
const AIAssistant = require('./ai-assistant');

class Dashboard {
  constructor() {
    this.app = express();
    this.port = process.env.PORT || 3000;
    this.baseDir = process.cwd();
    
    this.fileOrganizer = new FileOrganizer();
    this.clientManager = new ClientManager();
    this.projectManager = new ProjectManager();
    this.pricingEngine = new PricingEngine();
    this.aiAssistant = new AIAssistant();
    
    this.setupMiddleware();
    this.setupFileUpload();
    this.setupRoutes();
  }

  setupMiddleware() {
    this.app.use(cors());
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    // Static files will be set up AFTER API routes to prevent conflicts
  }

  setupFileUpload() {
    const storage = multer.diskStorage({
      destination: (req, file, cb) => {
        const uploadDir = path.join(this.baseDir, 'uploads', 'temp');
        fs.ensureDirSync(uploadDir);
        cb(null, uploadDir);
      },
      filename: (req, file, cb) => {
        const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}-${file.originalname}`;
        cb(null, uniqueName);
      }
    });

    this.upload = multer({
      storage: storage,
      limits: {
        fileSize: 50 * 1024 * 1024 // 50MB limit
      },
      fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|webp|svg|stl|obj|fbx|pdf|doc|docx/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        
        if (extname && mimetype) {
          return cb(null, true);
        } else {
          cb(new Error('Invalid file type'), false);
        }
      }
    });
  }

  setupRoutes() {
    // Dashboard home
    this.app.get('/', (req, res) => {
      res.sendFile(path.join(__dirname, '../public/index.html'));
    });
    
    // Pricing Calculator
    this.app.get('/pricing', (req, res) => {
      res.sendFile(path.join(__dirname, '../public/pricing-calculator.html'));
    });
    
    // GoHighLevel Setup Page
    this.app.get('/ghl-setup', (req, res) => {
      res.sendFile(path.join(__dirname, '../public/ghl-setup.html'));
    });
    
    // AI Assistant Page
    this.app.get('/ai-assistant', (req, res) => {
      res.sendFile(path.join(__dirname, '../public/ai-assistant.html'));
    });
    
    // Social Media & Email Tools Page
    this.app.get('/social-templates', (req, res) => {
      res.sendFile(path.join(__dirname, '../public/social-templates.html'));
    });

    // API Routes
    this.app.get('/api/status', this.getSystemStatus.bind(this));
    this.app.get('/api/stats', this.getSystemStats.bind(this));
    
    // File management
    this.app.post('/api/files/upload', this.upload.array('files', 10), this.handleFileUpload.bind(this));
    this.app.post('/api/files/organize', this.organizeFiles.bind(this));
    this.app.get('/api/files/structure', this.getFileStructure.bind(this));
    
    // Client management
    this.app.get('/api/clients', this.getClients.bind(this));
    this.app.post('/api/clients', this.createClient.bind(this));
    this.app.put('/api/clients/:id', this.updateClient.bind(this));
    this.app.get('/api/clients/:id', this.getClient.bind(this));
    
    // Project management
    this.app.get('/api/projects', this.getProjects.bind(this));
    this.app.post('/api/projects', this.createProject.bind(this));
    this.app.put('/api/projects/:id', this.updateProject.bind(this));
    this.app.get('/api/projects/:id', this.getProject.bind(this));
    
    // GoHighLevel integration
    this.app.get('/api/ghl/status', this.getGHLStatus.bind(this));
    this.app.post('/api/ghl/configure', this.configureGHL.bind(this));
    this.app.post('/api/ghl/sync', this.syncWithGHL.bind(this));
    this.app.post('/webhooks/ghl', this.handleGHLWebhook.bind(this));
    
    // Search functionality
    this.app.get('/api/search', this.searchFiles.bind(this));
    
    // Pricing Engine API
    this.app.post('/api/pricing/calculate', this.calculatePricing.bind(this));
    this.app.post('/api/pricing/quote', this.generateQuote.bind(this));
    this.app.get('/api/pricing/config', this.getPricingConfig.bind(this));
    
    // AI Assistant API
    this.app.post('/api/ai/chat', this.handleAIChat.bind(this));
    this.app.get('/api/ghl/contacts-summary', this.getContactsSummary.bind(this));
    
    // Social Media & Email Tools
    this.app.get('/api/ghl/contacts-list', this.getContactsList.bind(this));
    this.app.post('/api/ghl/send-email', this.sendEmailViaGHL.bind(this));
    this.app.post('/api/generate-template', this.generateCustomTemplate.bind(this));
    
    // Static files served AFTER API routes to prevent conflicts
    this.app.use(express.static(path.join(__dirname, '../public')));
  }

  async getSystemStatus(req, res) {
    try {
      const status = {
        server: 'running',
        timestamp: new Date().toISOString(),
        directories: {
          assets: await fs.pathExists(path.join(this.baseDir, 'assets')),
          clients: await fs.pathExists(path.join(this.baseDir, 'clients')),
          projects: await fs.pathExists(path.join(this.baseDir, 'projects')),
          config: await fs.pathExists(path.join(this.baseDir, 'config'))
        },
        ghlIntegration: false
      };

      // Check GHL integration
      try {
        const ghlClient = new GoHighLevelClient();
        const ghlStatus = await ghlClient.testConnection();
        status.ghlIntegration = ghlStatus.connected;
      } catch (error) {
        status.ghlIntegration = false;
      }

      res.json(status);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getSystemStats(req, res) {
    try {
      const clients = await this.clientManager.listClients();
      const projects = await this.projectManager.listProjects();
      
      const stats = {
        clients: {
          total: clients.length,
          active: clients.filter(c => c.status === 'active').length
        },
        projects: {
          total: projects.length,
          active: projects.filter(p => p.status === 'active').length,
          completed: projects.filter(p => p.status === 'completed').length
        },
        files: await this.getFileStats(),
        lastUpdate: new Date().toISOString()
      };

      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getFileStats() {
    const stats = {
      images: 0,
      models: 0,
      documents: 0
    };

    try {
      const assetsDir = path.join(this.baseDir, 'assets');
      
      if (await fs.pathExists(path.join(assetsDir, 'images'))) {
        const images = await this.countFilesInDirectory(path.join(assetsDir, 'images'));
        stats.images = images;
      }
      
      if (await fs.pathExists(path.join(assetsDir, '3d-models'))) {
        const models = await this.countFilesInDirectory(path.join(assetsDir, '3d-models'));
        stats.models = models;
      }
      
      if (await fs.pathExists(path.join(assetsDir, 'documents'))) {
        const documents = await this.countFilesInDirectory(path.join(assetsDir, 'documents'));
        stats.documents = documents;
      }
    } catch (error) {
      console.error('Error getting file stats:', error);
    }

    return stats;
  }

  async countFilesInDirectory(dir) {
    let count = 0;
    try {
      const items = await fs.readdir(dir);
      for (const item of items) {
        const itemPath = path.join(dir, item);
        const stat = await fs.stat(itemPath);
        if (stat.isFile()) {
          count++;
        } else if (stat.isDirectory()) {
          count += await this.countFilesInDirectory(itemPath);
        }
      }
    } catch (error) {
      // Directory might not exist or be accessible
    }
    return count;
  }

  async handleFileUpload(req, res) {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: 'No files uploaded' });
      }

      const uploadedFiles = req.files.map(file => ({
        originalName: file.originalname,
        filename: file.filename,
        path: file.path,
        size: file.size,
        mimetype: file.mimetype
      }));

      // Auto-organize if enabled
      if (process.env.AUTO_ORGANIZE === 'true') {
        await this.fileOrganizer.organizeFiles(path.dirname(req.files[0].path));
      }

      res.json({
        message: 'Files uploaded successfully',
        files: uploadedFiles
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async organizeFiles(req, res) {
    try {
      const { sourceDir } = req.body;
      await this.fileOrganizer.organizeFiles(sourceDir || 'uploads/temp');
      await this.fileOrganizer.createFileIndex();
      
      res.json({ message: 'Files organized successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getFileStructure(req, res) {
    try {
      const structure = await this.fileOrganizer.buildDirectoryTree('assets');
      res.json(structure);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getClients(req, res) {
    try {
      const clients = await this.clientManager.listClients();
      res.json(clients);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async createClient(req, res) {
    try {
      const client = await this.clientManager.setupClient(req.body);
      res.json(client);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async updateClient(req, res) {
    try {
      const client = await this.clientManager.updateClient(req.params.id, req.body);
      res.json(client);
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  }

  async getClient(req, res) {
    try {
      const client = await this.clientManager.getClient(req.params.id);
      res.json(client);
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  }

  async getProjects(req, res) {
    try {
      const status = req.query.status;
      const projects = await this.projectManager.listProjects(status);
      res.json(projects);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async createProject(req, res) {
    try {
      const project = await this.projectManager.createProject(req.body);
      res.json(project);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async updateProject(req, res) {
    try {
      const project = await this.projectManager.updateProjectStatus(req.params.id, req.body.status);
      res.json(project);
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  }

  async getProject(req, res) {
    try {
      const project = await this.projectManager.getProject(req.params.id);
      res.json(project);
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  }

  async getGHLStatus(req, res) {
    try {
      const ghlClient = new GoHighLevelClient();
      const status = await ghlClient.testConnection();
      res.json(status);
    } catch (error) {
      res.json({ connected: false, error: error.message });
    }
  }

  async configureGHL(req, res) {
    try {
      const { apiKey, locationId } = req.body;

      if (!apiKey || !locationId) {
        return res.status(400).json({ 
          success: false, 
          error: 'API Key and Location ID are required' 
        });
      }

      // Test the connection first
      const testClient = new GoHighLevelClient(apiKey, locationId);
      const testResult = await testClient.testConnection();
      
      if (!testResult.connected) {
        return res.status(400).json({
          success: false,
          error: testResult.error || 'Failed to connect to GoHighLevel'
        });
      }

      // Save configuration
      const configPath = path.join(this.baseDir, 'config', 'ghl-config.json');
      await fs.ensureDir(path.dirname(configPath));
      
      const config = {
        apiKey,
        locationId,
        baseUrl: 'https://rest.gohighlevel.com/v1',
        configuredAt: new Date().toISOString(),
        webhookEndpoints: {
          contacts: '/webhooks/ghl',
          opportunities: '/webhooks/ghl'
        },
        syncSettings: {
          autoSync: true,
          syncInterval: 300000, // 5 minutes
          syncOnStartup: true
        }
      };

      await fs.writeJson(configPath, config, { spaces: 2 });

      // Initialize sync
      try {
        const syncResult = await this.clientManager.syncWithGHL();
        
        res.json({
          success: true,
          message: 'GoHighLevel configured successfully!',
          config: {
            locationId: config.locationId,
            configuredAt: config.configuredAt,
            webhookEndpoints: config.webhookEndpoints
          },
          syncResult
        });
      } catch (syncError) {
        console.error('Initial sync failed:', syncError);
        res.json({
          success: true,
          message: 'GoHighLevel configured successfully, but initial sync failed',
          config: {
            locationId: config.locationId,
            configuredAt: config.configuredAt,
            webhookEndpoints: config.webhookEndpoints
          },
          syncError: syncError.message
        });
      }

    } catch (error) {
      console.error('GHL Configuration Error:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  }

  async syncWithGHL(req, res) {
    try {
      const { syncType = 'all' } = req.body;
      
      let result;
      
      switch (syncType) {
        case 'contacts':
          result = await this.clientManager.syncContacts();
          break;
        case 'projects':
          result = await this.clientManager.syncProjects();
          break;
        case 'all':
        default:
          result = await this.clientManager.syncWithGHL();
          break;
      }
      
      res.json({
        success: true,
        syncType,
        result,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  async handleGHLWebhook(req, res) {
    try {
      const webhookData = req.body;
      console.log('Received GHL webhook:', webhookData.type);
      
      // Process webhook based on type
      switch (webhookData.type) {
        case 'ContactCreate':
          // Handle new contact creation
          break;
        case 'ContactUpdate':
          // Handle contact updates
          break;
        case 'OpportunityCreate':
          // Handle new opportunity creation
          break;
        default:
          console.log('Unhandled webhook type:', webhookData.type);
      }
      
      res.json({ received: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async searchFiles(req, res) {
    try {
      const { query, type } = req.query;
      
      if (!query) {
        return res.status(400).json({ error: 'Search query required' });
      }
      
      const results = await this.performSearch(query, type);
      res.json(results);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async calculatePricing(req, res) {
    try {
      const { orderDetails, eventType = 'standard' } = req.body;
      
      if (!orderDetails) {
        return res.status(400).json({ error: 'Order details required' });
      }
      
      const calculation = this.pricingEngine.calculateOrderTotal(orderDetails, eventType);
      res.json(calculation);
      
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async generateQuote(req, res) {
    try {
      const { orderDetails, eventType = 'standard', customerInfo = {} } = req.body;
      
      if (!orderDetails) {
        return res.status(400).json({ error: 'Order details required' });
      }
      
      const quote = this.pricingEngine.generatePriceQuote(orderDetails, eventType, customerInfo);
      
      // Optionally save quote to database or file system
      const quotesDir = path.join(this.baseDir, 'config', 'quotes');
      await fs.ensureDir(quotesDir);
      await fs.writeJson(path.join(quotesDir, `${quote.quoteId}.json`), quote, { spaces: 2 });
      
      res.json(quote);
      
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getPricingConfig(req, res) {
    try {
      const config = this.pricingEngine.pricingConfig;
      res.json(config);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async handleAIChat(req, res) {
    try {
      const { message, conversationHistory = [], businessContext = {} } = req.body;

      if (!message) {
        return res.status(400).json({ 
          error: 'Message is required',
          success: false 
        });
      }

      // Process message with AI assistant
      const result = await this.aiAssistant.processMessage(
        message, 
        conversationHistory, 
        businessContext
      );

      res.json({
        success: true,
        response: result.response,
        actions: result.actions || [],
        intent: result.intent,
        confidence: result.confidence,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('AI Chat Error:', error);
      res.status(500).json({ 
        success: false,
        error: error.message,
        response: "I apologize, but I encountered an error processing your request. Please try again."
      });
    }
  }

  async getContactsSummary(req, res) {
    try {
      // Load GHL configuration to check if connected
      let ghlClient;
      try {
        const configPath = path.join(this.baseDir, 'config', 'ghl-config.json');
        if (await fs.pathExists(configPath)) {
          const config = await fs.readJson(configPath);
          ghlClient = new GoHighLevelClient(config.apiKey, config.locationId);
        } else {
          throw new Error('GoHighLevel not configured');
        }
      } catch (configError) {
        return res.json({
          success: false,
          error: 'GoHighLevel not connected',
          data: {
            total: 0,
            hotLeads: 0,
            thisMonth: 0,
            eventContacts: 0
          }
        });
      }

      // Fetch contacts from GHL
      const contacts = await ghlClient.getContacts({ limit: 100 });
      
      if (!contacts || !contacts.contacts) {
        throw new Error('Failed to fetch contacts');
      }

      // Calculate summary statistics
      const now = Date.now();
      const monthAgo = now - (30 * 24 * 60 * 60 * 1000);
      const weekAgo = now - (7 * 24 * 60 * 60 * 1000);

      const summary = {
        total: contacts.meta?.total || contacts.contacts.length,
        hotLeads: 0,
        thisMonth: 0,
        eventContacts: 0
      };

      contacts.contacts.forEach(contact => {
        // Hot leads (recent activity)
        if (contact.lastActivity && contact.lastActivity > weekAgo) {
          summary.hotLeads++;
        }

        // This month contacts
        if (new Date(contact.dateAdded).getTime() > monthAgo) {
          summary.thisMonth++;
        }

        // Event contacts
        if (contact.tags && contact.tags.some(tag => 
          tag.includes('con') || tag.includes('event') || tag.includes('city')
        )) {
          summary.eventContacts++;
        }
      });

      res.json({
        success: true,
        data: summary
      });

    } catch (error) {
      console.error('Contacts Summary Error:', error);
      res.json({
        success: false,
        error: error.message,
        data: {
          total: 0,
          hotLeads: 0,
          thisMonth: 0,
          eventContacts: 0
        }
      });
    }
  }

  async getContactsList(req, res) {
    try {
      // Load GHL configuration to check if connected
      let ghlClient;
      try {
        const configPath = path.join(this.baseDir, 'config', 'ghl-config.json');
        if (await fs.pathExists(configPath)) {
          const config = await fs.readJson(configPath);
          ghlClient = new GoHighLevelClient(config.apiKey, config.locationId);
        } else {
          throw new Error('GoHighLevel not configured');
        }
      } catch (configError) {
        return res.json({
          success: false,
          error: 'GoHighLevel not connected',
          contacts: []
        });
      }

      // Fetch contacts from GHL
      const { limit = 50 } = req.query;
      const contacts = await ghlClient.getContacts({ limit: parseInt(limit) });
      
      if (!contacts || !contacts.contacts) {
        throw new Error('Failed to fetch contacts');
      }

      res.json({
        success: true,
        contacts: contacts.contacts,
        total: contacts.meta?.total || contacts.contacts.length
      });

    } catch (error) {
      console.error('Get Contacts List Error:', error);
      res.json({
        success: false,
        error: error.message,
        contacts: []
      });
    }
  }

  async sendEmailViaGHL(req, res) {
    try {
      const { to, subject, body, contactId } = req.body;

      if (!to || !subject || !body) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: to, subject, body'
        });
      }

      // Load GHL configuration
      let ghlClient;
      try {
        const configPath = path.join(this.baseDir, 'config', 'ghl-config.json');
        if (await fs.pathExists(configPath)) {
          const config = await fs.readJson(configPath);
          ghlClient = new GoHighLevelClient(config.apiKey, config.locationId);
        } else {
          throw new Error('GoHighLevel not configured');
        }
      } catch (configError) {
        return res.json({
          success: false,
          error: 'GoHighLevel not connected'
        });
      }

      // Save email to local drafts folder for reference
      const draftsDir = path.join(this.baseDir, 'config', 'email-drafts');
      await fs.ensureDir(draftsDir);
      
      const draftId = Date.now() + '-' + Math.random().toString(36).substr(2, 9);
      const emailData = {
        subject: subject,
        body: body,
        type: 'email_draft',
        createdAt: new Date().toISOString(),
        recipient: to,
        draftId,
        contactId
      };
      
      await fs.writeJson(path.join(draftsDir, `${draftId}.json`), emailData, { spaces: 2 });

      res.json({
        success: true,
        message: 'Email drafted successfully! Copy the content to send via your preferred email client.',
        draftId: draftId,
        emailContent: {
          to: to,
          subject: subject,
          body: body
        },
        note: 'Email has been saved as a draft. You can copy this content to Gmail, Outlook, or your preferred email client.'
      });

    } catch (error) {
      console.error('Send Email Error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async performSearch(query, type = null) {
    // Simple file search implementation
    const results = [];
    const searchDirs = ['assets', 'clients', 'projects'];
    
    for (const dir of searchDirs) {
      const dirPath = path.join(this.baseDir, dir);
      if (await fs.pathExists(dirPath)) {
        const files = await this.searchInDirectory(dirPath, query, type);
        results.push(...files);
      }
    }
    
    return results;
  }

  async searchInDirectory(dir, query, type) {
    const results = [];
    const items = await fs.readdir(dir);
    
    for (const item of items) {
      const itemPath = path.join(dir, item);
      const stat = await fs.stat(itemPath);
      
      if (stat.isFile()) {
        if (item.toLowerCase().includes(query.toLowerCase())) {
          results.push({
            name: item,
            path: itemPath,
            type: 'file',
            size: stat.size,
            modified: stat.mtime
          });
        }
      } else if (stat.isDirectory()) {
        if (item.toLowerCase().includes(query.toLowerCase())) {
          results.push({
            name: item,
            path: itemPath,
            type: 'directory',
            modified: stat.mtime
          });
        }
        // Recursively search subdirectories
        const subResults = await this.searchInDirectory(itemPath, query, type);
        results.push(...subResults);
      }
    }
    
    return results;
  }

  start() {
    this.app.listen(this.port, '0.0.0.0', () => {
      console.log(`🚀 Shrunk 3D Business Dashboard running on http://0.0.0.0:${this.port}`);
      console.log(`📊 Dashboard URL: http://localhost:${this.port}`);
      console.log(`🔧 API Base URL: http://localhost:${this.port}/api`);
    });
  }

  async generateCustomTemplate(req, res) {
    try {
      const { platform, topic, context } = req.body;

      if (!platform || !topic) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: platform and topic'
        });
      }

      // Define platform-specific guidelines
      const platformGuidelines = {
        instagram: {
          maxLength: 2200,
          style: 'Visual storytelling with emojis, hashtags, and engaging captions. Use line breaks for readability.',
          hashtags: '#Shrunk3D #3DPhotography #Photogrammetry #3DPrinting #EventTech #MemoryCapture #Innovation'
        },
        tiktok: {
          maxLength: 300,
          style: 'Short, punchy, trending language. Use hooks, trends, and relatable content.',
          hashtags: '#Shrunk3D #3DPhotography #TechTok #EventTech #MobileBusiness #Innovation #3DPrinting'
        },
        facebook: {
          maxLength: 500,
          style: 'Conversational and community-focused. Encourage engagement and sharing.',
          hashtags: '#Shrunk3D #3DPhotography #EventServices #ProfessionalPhotography #MemoryMaking'
        },
        linkedin: {
          maxLength: 1300,
          style: 'Professional, business-focused content highlighting innovation and professional services.',
          hashtags: '#Shrunk3D #EventTechnology #BusinessInnovation #ProfessionalServices #3DPhotography'
        },
        twitter: {
          maxLength: 280,
          style: 'Concise, engaging, and shareable. Use trending topics and relevant hashtags.',
          hashtags: '#Shrunk3D #3DPhotography #EventTech #Innovation #TechNews'
        },
        youtube: {
          maxLength: 5000,
          style: 'Detailed descriptions with strong hooks, clear value propositions, and call-to-actions.',
          hashtags: '#Shrunk3D #3DPhotography #EventTechnology #BehindTheScenes #TechReview'
        },
        snapchat: {
          maxLength: 250,
          style: 'Casual, fun, and authentic. Focus on the experience and moment.',
          hashtags: '#Shrunk3D #3DPhotography #SnapMemories #CoolTech'
        }
      };

      const guidelines = platformGuidelines[platform];
      
      // Generate template using built-in logic
      const template = await this.generateAIContent(platform, topic, context, guidelines);

      res.json({
        success: true,
        template: template
      });

    } catch (error) {
      console.error('Template Generation Error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async generateAIContent(platform, topic, context, guidelines) {
    // Template library for common topics
    const templates = {
      birthday: {
        instagram: `🎉 Birthday memories just got an upgrade! 🎂✨

Capturing this special day with our cutting-edge 180-image photogrammetric technology! 

📸 Professional mobile photobooth setup
🎪 Ultra-premium nylon 3D printing
⏰ 3-5 week delivery of your custom figurine
💰 Starting at $30 design fee per person

Your birthday deserves more than just photos - create lasting 3D memories! 🎁

📞 Book your event: Shrunk3d.com

${guidelines.hashtags} #BirthdayMemories #3DFigurine #SpecialDay`,
        
        tiktok: `POV: Your birthday photos just entered the 3rd dimension ✨

📸 180 cameras capture every angle
🎪 Mobile booth setup
🎨 Ultra-premium 3D printing
📦 Your mini-me in 3-5 weeks

Birthdays will never be the same! 🎂

${guidelines.hashtags} #BirthdayTech #BirthdayParty`,
        
        facebook: `🎉 Make this birthday unforgettable! 

Our mobile 3D photobooth brings cutting-edge photogrammetric technology right to your celebration. With 180 high-resolution cameras, we capture every detail to create stunning 3D figurines.

✅ Professional setup at your venue
✅ $30 design fee per person
✅ Ultra-premium nylon printing
✅ 3-5 week delivery

Book your birthday experience today!

${guidelines.hashtags}`,
        
        linkedin: `Elevating birthday celebrations with innovative 3D photogrammetry technology.

Our mobile photobooth service leverages 180-camera arrays to capture comprehensive biometric data, producing ultra-premium nylon figurines through advanced 3D printing processes.

Key service features:
• Professional-grade photogrammetric scanning
• Mobile deployment capability
• 3-5 week production timeline
• Competitive $30 design fee structure

Transforming special occasions through technological innovation.

${guidelines.hashtags}`
      },
      
      wedding: {
        instagram: `💍 "I Do" to 3D memories! 👰🤵✨

This beautiful couple chose to capture their wedding day in a whole new dimension! Our mobile 3D photobooth created stunning figurines using 180-image photogrammetric scanning.

💒 Professional venue setup
📸 Cutting-edge capture technology  
🎨 Ultra-premium nylon 3D printing
💝 $30 design fee per person
⏰ 3-5 week delivery timeline

Your wedding deserves memories that last forever in 3D! 💕

📞 Book: Shrunk3d.com

${guidelines.hashtags} #WeddingMemories #3DWedding #BrideAndGroom`,
        
        tiktok: `When your wedding photos become 3D figurines 💒✨

This couple's reaction when they saw their mini wedding selves! 😍

📸 180 cameras = perfect capture
👰 Every dress detail preserved
🤵 Every smile immortalized
📦 Delivered in 3-5 weeks

Wedding game: ELEVATED 💍

${guidelines.hashtags} #WeddingTech #WeddingGoals`,
        
        facebook: `💕 Wedding memories reimagined! 

Celebrate your special day with our revolutionary 3D photobooth service. Our professional mobile setup captures every precious detail of your wedding using advanced photogrammetric technology.

What's included:
• Professional 180-camera scanning
• Mobile setup at your venue
• Ultra-premium nylon figurines
• $30 design fee per person
• 3-5 week professional production

Create wedding keepsakes that will be treasured for generations!

${guidelines.hashtags}`,
        
        linkedin: `Revolutionizing wedding photography through advanced 3D photogrammetry.

Our enterprise-grade mobile photobooth solution captures wedding ceremonies with unprecedented detail using 180-camera photogrammetric arrays. The resulting ultra-premium nylon figurines provide couples with tangible, three-dimensional memories of their special day.

Service specifications:
• Professional mobile deployment
• Photogrammetric capture technology
• 3-5 week production cycle
• Competitive pricing at $30 per scan

Elevating milestone celebrations through innovative technology solutions.

${guidelines.hashtags}`
      },
      
      corporate: {
        instagram: `🏢 Corporate events just got a 3D upgrade! 💼✨

Team building takes on new meaning when everyone goes home with their own 3D figurine! Our mobile photobooth brought cutting-edge technology to this corporate event.

🎯 Professional mobile setup
📸 180-image capture technology
👥 Team engagement boost
💰 $30 design fee per person
📦 3-5 week delivery

Ready to elevate your next corporate event? 

📞 Contact us: Shrunk3d.com

${guidelines.hashtags} #CorporateEvents #TeamBuilding #EmployeeEngagement`,
        
        tiktok: `Corporate events when Shrunk 3D pulls up 📈✨

Employees: "Just another meeting" 😒
Also employees when they see the 3D booth: 🤩

📸 180 cameras ready
💼 Professional setup
🎨 Everyone gets their mini-me
📊 Engagement: 📈📈📈

Corporate events will never be boring again!

${guidelines.hashtags} #CorporateLife #TeamBuilding`,
        
        facebook: `🚀 Transform your corporate events! 

Our professional 3D photobooth service adds an innovative element to company gatherings, conferences, and team-building events. Employees love the unique experience and take home personalized 3D figurines as memorable keepsakes.

Professional services include:
• Mobile booth setup at your venue
• Advanced photogrammetric scanning
• Group pricing for large teams
• Professional event coordination
• 3-5 week delivery timeline

Boost employee engagement with cutting-edge technology!

${guidelines.hashtags}`,
        
        linkedin: `Enhancing corporate engagement through innovative 3D capture technology.

Our professional photogrammetric services transform standard corporate events into memorable experiences. The mobile deployment of 180-camera arrays enables comprehensive 3D scanning at any corporate venue.

Business advantages:
• Enhanced employee engagement metrics
• Unique branded corporate gifts
• Professional event technology integration
• Scalable pricing for enterprise clients
• Memorable brand experience creation

Differentiate your corporate events with cutting-edge 3D technology.

${guidelines.hashtags}`
      }
    };

    // Determine topic category
    const topicLower = topic.toLowerCase();
    let category = 'custom';
    
    if (topicLower.includes('birthday')) category = 'birthday';
    else if (topicLower.includes('wedding') || topicLower.includes('bride') || topicLower.includes('groom')) category = 'wedding';
    else if (topicLower.includes('corporate') || topicLower.includes('business') || topicLower.includes('company')) category = 'corporate';
    
    // Return template if available, otherwise generate custom
    if (templates[category] && templates[category][platform]) {
      return templates[category][platform];
    }
    
    // Generate custom template for topics not in predefined templates
    return this.generateCustomContent(platform, topic, context, guidelines);
  }

  generateCustomContent(platform, topic, context, guidelines) {
    const platformEmojis = {
      instagram: '📸',
      tiktok: '🎵',
      facebook: '👥',
      linkedin: '💼',
      twitter: '🐦',
      youtube: '📺',
      snapchat: '👻'
    };

    const emoji = platformEmojis[platform] || '✨';
    const contextText = context ? `\n\nContext: ${context}` : '';

    // Create a basic template structure
    const template = `${emoji} ${topic} just got the 3D treatment! ✨

Our mobile 3D photobooth brings cutting-edge photogrammetric technology right to your ${topic.toLowerCase()}. With 180 high-resolution cameras, we capture every detail to create stunning 3D figurines.

📸 Professional 180-camera scanning
🎪 Mobile booth setup
🎨 Ultra-premium nylon 3D printing
💰 $30 design fee per person
📦 3-5 week professional delivery${contextText}

Your memories deserve the 3D dimension!

📞 Book today: Shrunk3d.com

${guidelines.hashtags}`;

    return template;
  }
}

// Start server if run directly
if (require.main === module) {
  const dashboard = new Dashboard();
  dashboard.start();
}

module.exports = Dashboard;