#!/usr/bin/env node

const express = require('express');
const fs = require('fs-extra');
const path = require('path');
const multer = require('multer');
const cors = require('cors');
const FileOrganizer = require('./file-organizer');
const ClientManager = require('./client-manager');
const ProjectManager = require('./project-manager');
const GoHighLevelClient = require('../ghl-integration/api/ghl-client');

class Dashboard {
  constructor() {
    this.app = express();
    this.port = process.env.PORT || 3000;
    this.baseDir = process.cwd();
    
    this.fileOrganizer = new FileOrganizer();
    this.clientManager = new ClientManager();
    this.projectManager = new ProjectManager();
    
    this.setupMiddleware();
    this.setupFileUpload();
    this.setupRoutes();
  }

  setupMiddleware() {
    this.app.use(cors());
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    this.app.use(express.static(path.join(__dirname, '../public')));
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
    this.app.post('/api/ghl/sync', this.syncWithGHL.bind(this));
    this.app.post('/webhooks/ghl', this.handleGHLWebhook.bind(this));
    
    // Search functionality
    this.app.get('/api/search', this.searchFiles.bind(this));
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

  async syncWithGHL(req, res) {
    try {
      const result = await this.clientManager.syncWithGHL();
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
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
}

// Start server if run directly
if (require.main === module) {
  const dashboard = new Dashboard();
  dashboard.start();
}

module.exports = Dashboard;