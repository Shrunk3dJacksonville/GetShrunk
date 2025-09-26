// Dashboard JavaScript
class ShrunkDashboard {
  constructor() {
    this.baseURL = '/api';
    this.currentTab = 'overview';
    this.init();
  }

  async init() {
    this.setupEventListeners();
    await this.loadOverviewData();
    await this.checkGHLStatus();
  }

  setupEventListeners() {
    // File upload
    const uploadArea = document.getElementById('upload-area');
    const fileInput = document.getElementById('file-input');

    uploadArea.addEventListener('click', () => fileInput.click());
    uploadArea.addEventListener('dragover', (e) => {
      e.preventDefault();
      uploadArea.classList.add('dragover');
    });
    uploadArea.addEventListener('dragleave', () => {
      uploadArea.classList.remove('dragover');
    });
    uploadArea.addEventListener('drop', (e) => {
      e.preventDefault();
      uploadArea.classList.remove('dragover');
      this.handleFileUpload(e.dataTransfer.files);
    });

    fileInput.addEventListener('change', (e) => {
      this.handleFileUpload(e.target.files);
    });

    // Project filter
    const projectFilter = document.getElementById('project-filter');
    if (projectFilter) {
      projectFilter.addEventListener('change', (e) => {
        this.loadProjects(e.target.value);
      });
    }

    // Search inputs
    const fileSearch = document.getElementById('file-search');
    const clientSearch = document.getElementById('client-search');

    if (fileSearch) {
      fileSearch.addEventListener('input', (e) => {
        this.searchFiles(e.target.value);
      });
    }

    if (clientSearch) {
      clientSearch.addEventListener('input', (e) => {
        this.filterClients(e.target.value);
      });
    }

    // Modal close handlers
    const modalOverlay = document.getElementById('modal-overlay');
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) {
        this.closeModal();
      }
    });
  }

  async loadOverviewData() {
    try {
      const response = await fetch(`${this.baseURL}/stats`);
      const stats = await response.json();

      // Update stat cards
      document.getElementById('total-clients').textContent = stats.clients.total;
      document.getElementById('active-projects').textContent = stats.projects.active;
      document.getElementById('total-images').textContent = stats.files.images;
      document.getElementById('total-models').textContent = stats.files.models;

    } catch (error) {
      console.error('Error loading overview data:', error);
    }
  }

  async checkGHLStatus() {
    try {
      const response = await fetch(`${this.baseURL}/ghl/status`);
      const status = await response.json();

      const statusElement = document.getElementById('ghl-status');
      const statusText = document.getElementById('ghl-status-text');

      if (status.connected) {
        statusElement.classList.add('connected');
        statusElement.classList.remove('disconnected');
        statusText.textContent = 'Connected';
      } else {
        statusElement.classList.add('disconnected');
        statusElement.classList.remove('connected');
        statusText.textContent = 'Disconnected';
      }

      // Update detailed status if on GHL tab
      this.updateGHLDetailedStatus(status);

    } catch (error) {
      console.error('Error checking GHL status:', error);
      const statusElement = document.getElementById('ghl-status');
      const statusText = document.getElementById('ghl-status-text');
      statusElement.classList.add('disconnected');
      statusText.textContent = 'Error';
    }
  }

  updateGHLDetailedStatus(status) {
    const detailedStatus = document.getElementById('ghl-detailed-status');
    if (!detailedStatus) return;

    if (status.connected) {
      detailedStatus.innerHTML = `
        <div class="message success">
          <i class="fas fa-check-circle"></i>
          Successfully connected to GoHighLevel
        </div>
        <p>Last checked: ${new Date().toLocaleString()}</p>
      `;
    } else {
      detailedStatus.innerHTML = `
        <div class="message error">
          <i class="fas fa-exclamation-circle"></i>
          ${status.message || 'Connection failed'}
        </div>
        <p>Error: ${status.error || 'Unknown error'}</p>
        <p>Please check your API configuration in config/ghl-config.json</p>
      `;
    }
  }

  async handleFileUpload(files) {
    if (!files || files.length === 0) return;

    const formData = new FormData();
    Array.from(files).forEach(file => {
      formData.append('files', file);
    });

    try {
      this.showMessage('Uploading files...', 'info');
      
      const response = await fetch(`${this.baseURL}/files/upload`, {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (response.ok) {
        this.showMessage(`Successfully uploaded ${result.files.length} files`, 'success');
        await this.loadOverviewData(); // Refresh stats
        
        // Clear file input
        document.getElementById('file-input').value = '';
      } else {
        throw new Error(result.error || 'Upload failed');
      }

    } catch (error) {
      console.error('File upload error:', error);
      this.showMessage(`Upload failed: ${error.message}`, 'error');
    }
  }

  async organizeFiles() {
    try {
      this.showMessage('Organizing files...', 'info');
      
      const response = await fetch(`${this.baseURL}/files/organize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();

      if (response.ok) {
        this.showMessage('Files organized successfully!', 'success');
        await this.loadFileStructure(); // Refresh file structure
      } else {
        throw new Error(result.error || 'Organization failed');
      }

    } catch (error) {
      console.error('File organization error:', error);
      this.showMessage(`Organization failed: ${error.message}`, 'error');
    }
  }

  async loadFileStructure() {
    try {
      const response = await fetch(`${this.baseURL}/files/structure`);
      const structure = await response.json();

      const container = document.getElementById('file-structure');
      container.innerHTML = this.renderFileTree(structure);

    } catch (error) {
      console.error('Error loading file structure:', error);
      document.getElementById('file-structure').innerHTML = '<div class="message error">Failed to load file structure</div>';
    }
  }

  renderFileTree(tree, path = '') {
    let html = '<ul class="file-tree">';
    
    Object.entries(tree).forEach(([name, content]) => {
      const currentPath = path ? `${path}/${name}` : name;
      
      if (name === '_files' && Array.isArray(content)) {
        // Render files
        content.forEach(file => {
          html += `
            <li class="file-item">
              <i class="fas fa-file"></i>
              <span class="file-name">${file.name}</span>
              <span class="file-size">${this.formatFileSize(file.size)}</span>
            </li>
          `;
        });
      } else if (typeof content === 'object') {
        // Render directory
        html += `
          <li class="directory-item">
            <i class="fas fa-folder"></i>
            <span class="directory-name">${name}</span>
            ${this.renderFileTree(content, currentPath)}
          </li>
        `;
      }
    });
    
    html += '</ul>';
    return html;
  }

  async loadClients() {
    try {
      const response = await fetch(`${this.baseURL}/clients`);
      const clients = await response.json();

      const container = document.getElementById('clients-list');
      if (clients.length === 0) {
        container.innerHTML = '<div class="message info">No clients found. Create your first client to get started.</div>';
        return;
      }

      container.innerHTML = clients.map(client => `
        <div class="client-item">
          <div class="item-info">
            <h4>${client.firstName} ${client.lastName}</h4>
            <p>${client.email || 'No email'} • Created: ${new Date(client.created).toLocaleDateString()}</p>
            <p>Status: ${client.status} • GHL: ${client.ghlContactId ? 'Synced' : 'Not synced'}</p>
          </div>
          <div class="item-actions">
            <button class="btn btn-info" onclick="dashboard.viewClient('${client.id}')">
              <i class="fas fa-eye"></i> View
            </button>
            <button class="btn btn-secondary" onclick="dashboard.editClient('${client.id}')">
              <i class="fas fa-edit"></i> Edit
            </button>
          </div>
        </div>
      `).join('');

    } catch (error) {
      console.error('Error loading clients:', error);
      document.getElementById('clients-list').innerHTML = '<div class="message error">Failed to load clients</div>';
    }
  }

  async loadProjects(status = '') {
    try {
      const url = status ? `${this.baseURL}/projects?status=${status}` : `${this.baseURL}/projects`;
      const response = await fetch(url);
      const projects = await response.json();

      const container = document.getElementById('projects-list');
      if (projects.length === 0) {
        container.innerHTML = '<div class="message info">No projects found. Create your first project to get started.</div>';
        return;
      }

      container.innerHTML = projects.map(project => `
        <div class="project-item">
          <div class="item-info">
            <h4>${project.name}</h4>
            <p>Client: ${project.clientName || 'Unknown'} • Budget: $${project.budget || '0'}</p>
            <p>Status: <span class="status-badge status-${project.status}">${project.status}</span> • Priority: ${project.priority}</p>
            <p>Created: ${new Date(project.created).toLocaleDateString()}</p>
          </div>
          <div class="item-actions">
            <button class="btn btn-info" onclick="dashboard.viewProject('${project.id}')">
              <i class="fas fa-eye"></i> View
            </button>
            <button class="btn btn-secondary" onclick="dashboard.editProject('${project.id}')">
              <i class="fas fa-edit"></i> Edit
            </button>
          </div>
        </div>
      `).join('');

    } catch (error) {
      console.error('Error loading projects:', error);
      document.getElementById('projects-list').innerHTML = '<div class="message error">Failed to load projects</div>';
    }
  }

  async searchFiles(query) {
    if (!query.trim()) {
      await this.loadFileStructure();
      return;
    }

    try {
      const response = await fetch(`${this.baseURL}/search?query=${encodeURIComponent(query)}`);
      const results = await response.json();

      const container = document.getElementById('file-structure');
      if (results.length === 0) {
        container.innerHTML = '<div class="message info">No files found matching your search.</div>';
        return;
      }

      container.innerHTML = `
        <div class="search-results">
          <h3>Search Results for "${query}"</h3>
          <ul class="file-tree">
            ${results.map(result => `
              <li class="file-item">
                <i class="fas fa-${result.type === 'file' ? 'file' : 'folder'}"></i>
                <span class="file-name">${result.name}</span>
                <span class="file-path">${result.path}</span>
                ${result.size ? `<span class="file-size">${this.formatFileSize(result.size)}</span>` : ''}
              </li>
            `).join('')}
          </ul>
        </div>
      `;

    } catch (error) {
      console.error('Search error:', error);
    }
  }

  filterClients(query) {
    const clientItems = document.querySelectorAll('.client-item');
    clientItems.forEach(item => {
      const text = item.textContent.toLowerCase();
      if (text.includes(query.toLowerCase())) {
        item.style.display = 'flex';
      } else {
        item.style.display = 'none';
      }
    });
  }

  async syncWithGHL() {
    try {
      this.showMessage('Syncing with GoHighLevel...', 'info');
      
      const response = await fetch(`${this.baseURL}/ghl/sync`, {
        method: 'POST'
      });

      const result = await response.json();

      if (response.ok) {
        this.showMessage('Sync completed successfully!', 'success');
        await this.checkGHLStatus();
      } else {
        throw new Error(result.error || 'Sync failed');
      }

    } catch (error) {
      console.error('GHL sync error:', error);
      this.showMessage(`Sync failed: ${error.message}`, 'error');
    }
  }

  async testGHLConnection() {
    await this.checkGHLStatus();
    this.showMessage('Connection test completed. Check status above.', 'info');
  }

  // Modal Functions
  showNewClientModal() {
    document.getElementById('modal-overlay').classList.add('show');
    document.getElementById('new-client-modal').style.display = 'block';
    document.getElementById('new-project-modal').style.display = 'none';
  }

  showNewProjectModal() {
    document.getElementById('modal-overlay').classList.add('show');
    document.getElementById('new-project-modal').style.display = 'block';
    document.getElementById('new-client-modal').style.display = 'none';
  }

  closeModal() {
    document.getElementById('modal-overlay').classList.remove('show');
    // Reset forms
    document.getElementById('new-client-form').reset();
    document.getElementById('new-project-form').reset();
  }

  async createClient() {
    const form = document.getElementById('new-client-form');
    const formData = new FormData(form);
    const clientData = Object.fromEntries(formData);

    try {
      const response = await fetch(`${this.baseURL}/clients`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(clientData)
      });

      const result = await response.json();

      if (response.ok) {
        this.showMessage('Client created successfully!', 'success');
        this.closeModal();
        await this.loadOverviewData();
        if (this.currentTab === 'clients') {
          await this.loadClients();
        }
      } else {
        throw new Error(result.error || 'Failed to create client');
      }

    } catch (error) {
      console.error('Create client error:', error);
      this.showMessage(`Failed to create client: ${error.message}`, 'error');
    }
  }

  async createProject() {
    const form = document.getElementById('new-project-form');
    const formData = new FormData(form);
    const projectData = Object.fromEntries(formData);

    try {
      const response = await fetch(`${this.baseURL}/projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(projectData)
      });

      const result = await response.json();

      if (response.ok) {
        this.showMessage('Project created successfully!', 'success');
        this.closeModal();
        await this.loadOverviewData();
        if (this.currentTab === 'projects') {
          await this.loadProjects();
        }
      } else {
        throw new Error(result.error || 'Failed to create project');
      }

    } catch (error) {
      console.error('Create project error:', error);
      this.showMessage(`Failed to create project: ${error.message}`, 'error');
    }
  }

  // Utility Functions
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  showMessage(message, type) {
    // Remove existing messages
    const existingMessages = document.querySelectorAll('.message');
    existingMessages.forEach(msg => msg.remove());

    // Create new message
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.innerHTML = `
      <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
      ${message}
    `;

    // Insert at the top of the container
    const container = document.querySelector('.container');
    const header = document.querySelector('.header');
    container.insertBefore(messageDiv, header.nextSibling);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      messageDiv.remove();
    }, 5000);
  }

  // Placeholder functions for future implementation
  viewClient(clientId) {
    console.log('View client:', clientId);
    // TODO: Implement client detail view
  }

  editClient(clientId) {
    console.log('Edit client:', clientId);
    // TODO: Implement client editing
  }

  viewProject(projectId) {
    console.log('View project:', projectId);
    // TODO: Implement project detail view
  }

  editProject(projectId) {
    console.log('Edit project:', projectId);
    // TODO: Implement project editing
  }
}

// Tab Management
function showTab(tabName) {
  // Hide all tab contents
  document.querySelectorAll('.tab-content').forEach(tab => {
    tab.classList.remove('active');
  });

  // Remove active class from all tab buttons
  document.querySelectorAll('.tab-button').forEach(button => {
    button.classList.remove('active');
  });

  // Show selected tab content
  document.getElementById(tabName).classList.add('active');
  
  // Add active class to selected tab button
  event.target.classList.add('active');

  // Update current tab
  dashboard.currentTab = tabName;

  // Load tab-specific data
  switch (tabName) {
    case 'files':
      dashboard.loadFileStructure();
      break;
    case 'clients':
      dashboard.loadClients();
      break;
    case 'projects':
      dashboard.loadProjects();
      break;
    case 'ghl':
      dashboard.checkGHLStatus();
      break;
  }
}

// Global functions for HTML onclick handlers
function showNewClientModal() {
  dashboard.showNewClientModal();
}

function showNewProjectModal() {
  dashboard.showNewProjectModal();
}

function closeModal() {
  dashboard.closeModal();
}

function createClient() {
  dashboard.createClient();
}

function createProject() {
  dashboard.createProject();
}

function organizeFiles() {
  dashboard.organizeFiles();
}

function syncWithGHL() {
  dashboard.syncWithGHL();
}

function testGHLConnection() {
  dashboard.testGHLConnection();
}

// Initialize dashboard
const dashboard = new ShrunkDashboard();