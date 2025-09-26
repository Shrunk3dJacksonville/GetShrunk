#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');
const mime = require('mime-types');

class FileOrganizer {
  constructor() {
    this.baseDir = process.cwd();
    this.rules = {
      images: {
        extensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.tiff'],
        categories: {
          products: ['product', 'item', 'showcase'],
          process: ['process', 'workflow', 'step', 'progress'],
          marketing: ['marketing', 'promo', 'ad', 'banner'],
          'before-after': ['before', 'after', 'comparison', 'result']
        }
      },
      '3d-models': {
        extensions: ['.stl', '.obj', '.fbx', '.3mf', '.gcode', '.step', '.iges', '.ply', '.dae'],
        categories: {
          source: ['source', 'original', 'design'],
          rendered: ['render', 'preview', 'visualization'],
          'print-ready': ['print', 'final', 'ready', 'optimized']
        }
      },
      documents: {
        extensions: ['.pdf', '.doc', '.docx', '.txt', '.md', '.rtf', '.odt'],
        categories: {
          contracts: ['contract', 'agreement', 'terms'],
          invoices: ['invoice', 'bill', 'receipt', 'payment'],
          presentations: ['presentation', 'slide', 'pitch', 'demo'],
          manuals: ['manual', 'guide', 'instructions', 'help']
        }
      }
    };
  }

  async organizeFiles(sourceDir = '.') {
    console.log('🗂️  Starting file organization...');
    
    try {
      const files = await this.getAllFiles(sourceDir);
      const organized = await this.categorizeFiles(files);
      
      for (const [category, fileList] of Object.entries(organized)) {
        await this.moveFiles(fileList, category);
      }
      
      console.log('✅ File organization completed successfully!');
      this.generateReport(organized);
      
    } catch (error) {
      console.error('❌ Error organizing files:', error.message);
    }
  }

  async getAllFiles(dir, fileList = []) {
    const files = await fs.readdir(dir);
    
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = await fs.stat(filePath);
      
      if (stat.isDirectory() && !this.isSystemDirectory(file)) {
        await this.getAllFiles(filePath, fileList);
      } else if (stat.isFile()) {
        fileList.push(filePath);
      }
    }
    
    return fileList;
  }

  isSystemDirectory(dirName) {
    const systemDirs = ['node_modules', '.git', 'assets', 'clients', 'projects', 'tools', 'config'];
    return systemDirs.includes(dirName);
  }

  async categorizeFiles(files) {
    const categorized = {};
    
    for (const filePath of files) {
      const category = this.determineCategory(filePath);
      if (category) {
        if (!categorized[category]) {
          categorized[category] = [];
        }
        categorized[category].push(filePath);
      }
    }
    
    return categorized;
  }

  determineCategory(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const basename = path.basename(filePath, ext).toLowerCase();
    
    // Check each file type category
    for (const [mainCategory, config] of Object.entries(this.rules)) {
      if (config.extensions.includes(ext)) {
        // Find subcategory based on filename keywords
        for (const [subCategory, keywords] of Object.entries(config.categories)) {
          if (keywords.some(keyword => basename.includes(keyword))) {
            return `assets/${mainCategory}/${subCategory}`;
          }
        }
        // Default to first subcategory if no keywords match
        const defaultSubCategory = Object.keys(config.categories)[0];
        return `assets/${mainCategory}/${defaultSubCategory}`;
      }
    }
    
    return null; // File doesn't match any category
  }

  async moveFiles(files, targetCategory) {
    const targetDir = path.join(this.baseDir, targetCategory);
    await fs.ensureDir(targetDir);
    
    for (const filePath of files) {
      try {
        const fileName = path.basename(filePath);
        const targetPath = path.join(targetDir, fileName);
        
        // Avoid moving files that are already in the correct location
        if (path.resolve(filePath) !== path.resolve(targetPath)) {
          await fs.move(filePath, targetPath, { overwrite: true });
          console.log(`📁 Moved: ${fileName} → ${targetCategory}`);
        }
      } catch (error) {
        console.error(`❌ Error moving ${filePath}:`, error.message);
      }
    }
  }

  generateReport(organized) {
    console.log('\n📊 Organization Report:');
    console.log('========================');
    
    let totalFiles = 0;
    for (const [category, files] of Object.entries(organized)) {
      console.log(`${category}: ${files.length} files`);
      totalFiles += files.length;
    }
    
    console.log(`\n📦 Total files organized: ${totalFiles}`);
    console.log(`📅 Organized on: ${new Date().toISOString()}`);
  }

  async createFileIndex() {
    console.log('📋 Creating file index...');
    
    const index = {
      created: new Date().toISOString(),
      structure: await this.buildDirectoryTree('assets')
    };
    
    await fs.writeJson(path.join(this.baseDir, 'config', 'file-index.json'), index, { spaces: 2 });
    console.log('✅ File index created successfully!');
  }

  async buildDirectoryTree(dir) {
    const tree = {};
    
    try {
      const items = await fs.readdir(path.join(this.baseDir, dir));
      
      for (const item of items) {
        const itemPath = path.join(this.baseDir, dir, item);
        const stat = await fs.stat(itemPath);
        
        if (stat.isDirectory()) {
          tree[item] = await this.buildDirectoryTree(path.join(dir, item));
        } else {
          if (!tree._files) tree._files = [];
          tree._files.push({
            name: item,
            size: stat.size,
            modified: stat.mtime.toISOString(),
            type: mime.lookup(item) || 'unknown'
          });
        }
      }
    } catch (error) {
      console.error(`Error reading directory ${dir}:`, error.message);
    }
    
    return tree;
  }
}

// CLI Usage
if (require.main === module) {
  const organizer = new FileOrganizer();
  
  const command = process.argv[2];
  
  switch (command) {
    case 'organize':
      organizer.organizeFiles();
      break;
    case 'index':
      organizer.createFileIndex();
      break;
    case 'all':
      (async () => {
        await organizer.organizeFiles();
        await organizer.createFileIndex();
      })();
      break;
    default:
      console.log('Usage: node file-organizer.js [organize|index|all]');
  }
}

module.exports = FileOrganizer;