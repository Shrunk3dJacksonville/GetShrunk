const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

class GoHighLevelClient {
  constructor(apiKey = null, locationId = null) {
    // Support direct API key/location ID or config file
    if (apiKey && locationId) {
      this.apiKey = apiKey;
      this.locationId = locationId;
      this.baseURL = 'https://rest.gohighlevel.com/v1';
      this.version = '2021-07-28';
    } else {
      this.config = this.loadConfig();
      // Handle the actual config structure we save
      this.baseURL = 'https://rest.gohighlevel.com/v1'; // Use correct API base
      this.apiKey = this.config.apiKey;
      this.locationId = this.config.locationId;
      this.version = '2021-07-28';
    }
    
    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Version': this.version,
        'Content-Type': 'application/json'
      }
    });
  }

  loadConfig() {
    try {
      const configPath = path.join(process.cwd(), 'config', 'ghl-config.json');
      return fs.readJsonSync(configPath);
    } catch (error) {
      throw new Error('Failed to load GoHighLevel configuration: ' + error.message);
    }
  }

  // Contact Management
  async getContacts(params = {}) {
    try {
      const response = await this.client.get(`/contacts/`, {
        params: {
          ...params
        }
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to fetch contacts');
    }
  }

  async getContact(contactId) {
    try {
      const response = await this.client.get(`/contacts/${contactId}`, {
        params: { locationId: this.locationId }
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error, `Failed to fetch contact ${contactId}`);
    }
  }

  async createContact(contactData) {
    try {
      const response = await this.client.post('/contacts/', {
        locationId: this.locationId,
        ...contactData
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to create contact');
    }
  }

  async updateContact(contactId, updateData) {
    try {
      const response = await this.client.put(`/contacts/${contactId}`, {
        locationId: this.locationId,
        ...updateData
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error, `Failed to update contact ${contactId}`);
    }
  }

  // Opportunity Management
  async getOpportunities(params = {}) {
    try {
      const response = await this.client.get('/opportunities/', {
        params: {
          locationId: this.locationId,
          ...params
        }
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to fetch opportunities');
    }
  }

  async getOpportunity(opportunityId) {
    try {
      const response = await this.client.get(`/opportunities/${opportunityId}`, {
        params: { locationId: this.locationId }
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error, `Failed to fetch opportunity ${opportunityId}`);
    }
  }

  async createOpportunity(opportunityData) {
    try {
      const response = await this.client.post('/opportunities/', {
        locationId: this.locationId,
        ...opportunityData
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to create opportunity');
    }
  }

  // Pipeline Management
  async getPipelines() {
    try {
      const response = await this.client.get('/opportunities/pipelines', {
        params: { locationId: this.locationId }
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to fetch pipelines');
    }
  }

  // Custom Fields
  async getCustomFields() {
    try {
      const response = await this.client.get('/custom-fields', {
        params: { locationId: this.locationId }
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to fetch custom fields');
    }
  }

  // File Upload to GHL
  async uploadFile(filePath, contactId = null) {
    try {
      const FormData = require('form-data');
      const form = new FormData();
      
      form.append('file', fs.createReadStream(filePath));
      form.append('locationId', this.locationId);
      if (contactId) {
        form.append('contactId', contactId);
      }

      const response = await this.client.post('/medias/upload-file', form, {
        headers: {
          ...form.getHeaders(),
        }
      });
      
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to upload file to GHL');
    }
  }

  // Business-Specific Methods
  async create3DProject(clientData, projectDetails) {
    try {
      // Create or get contact
      let contact = await this.findContactByEmail(clientData.email);
      if (!contact) {
        contact = await this.createContact({
          firstName: clientData.firstName,
          lastName: clientData.lastName,
          email: clientData.email,
          phone: clientData.phone,
          tags: ['3d-shrunk-client']
        });
      }

      // Create opportunity for the project
      const opportunity = await this.createOpportunity({
        title: `3D Shrunk Project - ${projectDetails.name}`,
        contactId: contact.id,
        status: 'new',
        monetaryValue: projectDetails.value || 0,
        customFields: [
          {
            key: 'project_type',
            field_value: projectDetails.type || 'shrunk_3d'
          },
          {
            key: 'project_details',
            field_value: JSON.stringify(projectDetails)
          }
        ]
      });

      return {
        contact: contact,
        opportunity: opportunity,
        projectId: opportunity.id
      };
    } catch (error) {
      throw this.handleError(error, 'Failed to create 3D project in GHL');
    }
  }

  async findContactByEmail(email) {
    try {
      const contacts = await this.getContacts({ query: email });
      return contacts.contacts && contacts.contacts.length > 0 ? contacts.contacts[0] : null;
    } catch (error) {
      console.warn('Failed to find contact by email:', error.message);
      return null;
    }
  }

  // Sync local project with GHL
  async syncProjectFiles(projectId, filePaths) {
    try {
      const uploadResults = [];
      
      for (const filePath of filePaths) {
        if (await fs.pathExists(filePath)) {
          const result = await this.uploadFile(filePath, projectId);
          uploadResults.push({
            filePath: filePath,
            ghlUrl: result.url,
            success: true
          });
        }
      }
      
      return uploadResults;
    } catch (error) {
      throw this.handleError(error, 'Failed to sync project files');
    }
  }

  handleError(error, message) {
    const errorDetails = {
      message: message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      originalError: error.message
    };
    
    console.error('GHL API Error:', errorDetails);
    return new Error(`${message}: ${error.message}`);
  }

  // Add note to contact
  async addContactNote(contactId, note) {
    try {
      const response = await this.client.post(`/contacts/${contactId}/notes`, {
        body: note,
        userId: 'system'
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to add note to contact');
    }
  }

  // Health check
  async testConnection() {
    try {
      await this.getContacts({ limit: 1 });
      return { connected: true, message: 'Connection successful' };
    } catch (error) {
      return { 
        connected: false, 
        message: 'Connection failed', 
        error: error.message 
      };
    }
  }
}

module.exports = GoHighLevelClient;