#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');

class PricingEngine {
  constructor() {
    this.baseDir = process.cwd();
    this.pricingConfig = this.loadPricingConfig();
    this.eventMultipliers = {
      'premium': 1.3,      // High-end events (NFL, major festivals)
      'standard': 1.0,     // Regular events (local sports, fairs)
      'budget': 0.85,      // School events, fundraisers
      'bulk': 0.75         // Large volume orders (50+ units)
    };
  }

  loadPricingConfig() {
    // Latest pricing from September 2025 PDF with cost data from CSV
    return {
      baseFees: {
        designFee: 30,
        shipping: 14.95,
        tripFee: 175
      },
      
      figurines: {
        // Primary person pricing (updated from latest PDF)
        primary: {
          '3': { retail: 130, cost: 15, royalty: 6.00, minPrice: 20 },
          '4': { retail: 155, cost: 25, royalty: 8.00, minPrice: 35 },
          '5': { retail: 200, cost: 40, royalty: 11.50, minPrice: 55 },
          '6': { retail: 240, cost: 55, royalty: 14.50, minPrice: 70 },
          '7': { retail: 290, cost: 65, royalty: 18.50, minPrice: 100 },
          '8': { retail: 335, cost: 90, royalty: 22.50, minPrice: 125 },
          '9': { retail: 385, cost: 120, royalty: 26.50, minPrice: 175 }
        },
        
        // Two people pricing
        twoPeople: {
          '3': { retail: 155, cost: 25, royalty: 9.50, minPrice: 35 },
          '4': { retail: 200, cost: 40, royalty: 14.00, minPrice: 60 },
          '5': { retail: 250, cost: 65, royalty: 19.00, minPrice: 90 },
          '6': { retail: 295, cost: 90, royalty: 23.50, minPrice: 120 },
          '7': { retail: 345, cost: 110, royalty: 28.50, minPrice: 160 },
          '8': { retail: 400, cost: 145, royalty: 34.00, minPrice: 200 },
          '9': { retail: 490, cost: 185, royalty: 42.50, minPrice: 275 }
        },
        
        // One person + child
        personPlusChild: {
          '3': { retail: 90, cost: 20, royalty: 9.50, minPrice: 30 },
          '4': { retail: 110, cost: 30, royalty: 14.00, minPrice: 45 },
          '5': { retail: 145, cost: 50, royalty: 19.00, minPrice: 75 },
          '6': { retail: 175, cost: 70, royalty: 23.50, minPrice: 95 },
          '7': { retail: 215, cost: 85, royalty: 28.50, minPrice: 130 },
          '8': { retail: 255, cost: 115, royalty: 34.00, minPrice: 170 },
          '9': { retail: 295, cost: 150, royalty: 42.50, minPrice: 225 }
        },
        
        // Two people + child
        twoPeoplePlusChild: {
          '3': { retail: 195, cost: 30, royalty: 13.00, minPrice: 50 },
          '4': { retail: 245, cost: 45, royalty: 20.50, minPrice: 85 },
          '5': { retail: 305, cost: 75, royalty: 26.50, minPrice: 125 },
          '6': { retail: 350, cost: 105, royalty: 32.00, minPrice: 155 },
          '7': { retail: 415, cost: 130, royalty: 38.50, minPrice: 190 },
          '8': { retail: 480, cost: 170, royalty: 46.50, minPrice: 245 },
          '9': { retail: 580, cost: 220, royalty: 57.50, minPrice: 320 }
        },
        
        // Solo pets
        soloPet: {
          '4': { retail: 130, cost: 45, royalty: 10.00, minPrice: 75 },
          '5': { retail: 155, cost: 65, royalty: 12.50, minPrice: 95 },
          '6': { retail: 180, cost: 80, royalty: 15.00, minPrice: 115 }
        }
      },
      
      addOns: {
        // Base add-ons (per PDF)
        bases: {
          '3': { retail: 0, cost: 0, royalty: 0 },
          '4': { retail: 0, cost: 0, royalty: 0 },
          '5': { retail: 10, cost: 0, royalty: 1.00 },
          '6': { retail: 10, cost: 0, royalty: 1.00 },
          '7': { retail: 15, cost: 0, royalty: 1.50 },
          '8': { retail: 15, cost: 0, royalty: 1.50 },
          '9': { retail: 20, cost: 0, royalty: 2.00 }
        },
        
        // Large prop/costume fees
        largeProp: {
          '3': { retail: 10, cost: 5, royalty: 1.00 },
          '4': { retail: 15, cost: 5, royalty: 1.50 },
          '5': { retail: 25, cost: 10, royalty: 2.50 },
          '6': { retail: 30, cost: 10, royalty: 3.00 },
          '7': { retail: 40, cost: 20, royalty: 4.00 },
          '8': { retail: 50, cost: 30, royalty: 5.00 },
          '9': { retail: 60, cost: 40, royalty: 6.00 }
        },
        
        ornament: { retail: 5, cost: 0, royalty: 0.50 }
      },
      
      // Additional products from page 2
      additionalProducts: {
        busts: {
          '4': { retail: 60, cost: 25, designFee: 0 }
        },
        
        cards3D: {
          standard: { retail: 45, cost: 15, designFee: 15 }
        },
        
        vCards: {
          single: { retail: 6.50, cost: 2.50, minOrder: 50 },
          twoPerson: { retail: 12.50, cost: 5.00, minOrder: 50 },
          bulk68Plus: { retail: 40, cost: 15, minOrder: 68 }
        },
        
        vehicles: {
          '4': { retail: 275, cost: 100, designFee: 0 },
          '6': { retail: 399, cost: 150, designFee: 0 },
          '8': { retail: 499, cost: 200, designFee: 0 }
        },
        
        buildings: {
          '4': { retail: 499, cost: 200, designFee: 0 }
        },
        
        personAnimal2Dto3D: {
          '4': { retail: 225, cost: 100, designFee: 0 },
          '6': { retail: 275, cost: 125, designFee: 0 },
          '8': { retail: 350, cost: 150, designFee: 0 }
        },
        
        digitalFiles: {
          perPerson: { retail: 100, cost: 10, leadTime: '1-2 weeks' }
        },
        
        eventServices: {
          boothRental: { retail: 175, cost: 50, perHour: true, minHours: 2 },
          scanOnly: { retail: 20, cost: 5, perSession: true }
        },
        
        injectionMolding: {
          sample: { retail: 200, cost: 100, leadTime: '12-15 days' },
          production: { minOrder: 100, leadTime: '40-90 days' }
        }
      }
    };
  }

  calculateOrderTotal(orderDetails, eventType = 'standard') {
    let calculation = {
      items: [],
      subtotal: 0,
      eventMultiplier: this.eventMultipliers[eventType] || 1.0,
      eventType: eventType,
      designFees: 0,
      shipping: 0,
      totalCost: 0,
      totalRoyalties: 0,
      grossProfit: 0,
      netProfit: 0,
      margin: 0
    };

    // Process main figurines
    if (orderDetails.figurines && orderDetails.figurines.length > 0) {
      orderDetails.figurines.forEach((figurine, index) => {
        const item = this.calculateFigurine(figurine, eventType);
        calculation.items.push(item);
        calculation.subtotal += item.total;
        calculation.totalCost += item.cost;
        calculation.totalRoyalties += item.royalty;
        
        // Design fee (usually included in figurine price)
        if (index === 0 || figurine.separateDesignFee) {
          calculation.designFees += this.pricingConfig.baseFees.designFee;
          calculation.totalCost += this.pricingConfig.baseFees.designFee;
        }
      });
    }

    // Process add-ons
    if (orderDetails.addOns && orderDetails.addOns.length > 0) {
      orderDetails.addOns.forEach(addon => {
        const item = this.calculateAddOn(addon, eventType);
        calculation.items.push(item);
        calculation.subtotal += item.total;
        calculation.totalCost += item.cost;
        calculation.totalRoyalties += item.royalty;
      });
    }

    // Process additional products
    if (orderDetails.additionalProducts && orderDetails.additionalProducts.length > 0) {
      orderDetails.additionalProducts.forEach(product => {
        const item = this.calculateAdditionalProduct(product, eventType);
        calculation.items.push(item);
        calculation.subtotal += item.total;
        calculation.totalCost += item.cost;
        calculation.totalRoyalties += item.royalty || 0;
      });
    }

    // Add shipping (one time per order)
    if (orderDetails.includeShipping !== false) {
      calculation.shipping = this.pricingConfig.baseFees.shipping;
      calculation.totalCost += 7.95; // Actual shipping cost
    }

    // Calculate final totals
    calculation.grandTotal = calculation.subtotal + calculation.shipping;
    calculation.grossProfit = calculation.grandTotal - calculation.totalCost;
    calculation.netProfit = calculation.grossProfit - calculation.totalRoyalties;
    calculation.margin = calculation.grandTotal > 0 ? 
      (calculation.netProfit / calculation.grandTotal * 100).toFixed(2) : 0;

    return calculation;
  }

  calculateFigurine(figurine, eventType = 'standard') {
    const { type, size, quantity = 1 } = figurine;
    const multiplier = this.eventMultipliers[eventType] || 1.0;
    
    const pricing = this.pricingConfig.figurines[type]?.[size];
    
    if (!pricing) {
      throw new Error(`Invalid figurine type "${type}" or size "${size}"`);
    }

    const basePrice = Math.round(pricing.retail * multiplier);
    const total = basePrice * quantity;
    
    return {
      type: 'figurine',
      description: `${this.getFigurineTypeDisplay(type)} (${size}")`,
      size: size,
      quantity: quantity,
      basePrice: basePrice,
      total: total,
      cost: pricing.cost * quantity,
      royalty: pricing.royalty * quantity,
      eventMultiplier: multiplier,
      originalPrice: pricing.retail
    };
  }

  calculateAddOn(addon, eventType = 'standard') {
    const { type, size, quantity = 1 } = addon;
    const multiplier = this.eventMultipliers[eventType] || 1.0;
    
    let pricing;
    
    if (type === 'ornament') {
      pricing = this.pricingConfig.addOns.ornament;
    } else {
      pricing = this.pricingConfig.addOns[type]?.[size];
    }
    
    if (!pricing) {
      throw new Error(`Invalid add-on type "${type}" or size "${size}"`);
    }

    const basePrice = Math.round(pricing.retail * multiplier);
    const total = basePrice * quantity;
    
    return {
      type: 'addon',
      description: `${this.getAddOnTypeDisplay(type)} ${size ? `(${size}")` : ''}`,
      size: size,
      quantity: quantity,
      basePrice: basePrice,
      total: total,
      cost: pricing.cost * quantity,
      royalty: pricing.royalty * quantity,
      eventMultiplier: multiplier,
      originalPrice: pricing.retail
    };
  }

  calculateAdditionalProduct(product, eventType = 'standard') {
    const { type, subType, size, quantity = 1 } = product;
    const multiplier = this.eventMultipliers[eventType] || 1.0;
    
    const pricing = this.pricingConfig.additionalProducts[type]?.[subType || 'standard'] || 
                   this.pricingConfig.additionalProducts[type]?.[size];
    
    if (!pricing) {
      throw new Error(`Invalid product type "${type}" or subType "${subType}"`);
    }

    const basePrice = Math.round(pricing.retail * multiplier);
    const total = basePrice * quantity;
    
    return {
      type: 'product',
      description: `${this.getProductTypeDisplay(type, subType)} ${size ? `(${size}")` : ''}`,
      size: size,
      quantity: quantity,
      basePrice: basePrice,
      total: total,
      cost: pricing.cost * quantity,
      royalty: 0, // Most additional products don't have royalties
      eventMultiplier: multiplier,
      originalPrice: pricing.retail,
      designFee: pricing.designFee || 0
    };
  }

  getFigurineTypeDisplay(type) {
    const displayNames = {
      primary: 'Single Person',
      twoPeople: 'Two People',
      personPlusChild: 'One Person + Child',
      twoPeoplePlusChild: 'Two People + Child',
      soloPet: 'Solo Pet'
    };
    return displayNames[type] || type;
  }

  getAddOnTypeDisplay(type) {
    const displayNames = {
      bases: 'Custom Base',
      largeProp: 'Large Prop/Costume',
      ornament: 'Ornament'
    };
    return displayNames[type] || type;
  }

  getProductTypeDisplay(type, subType) {
    const displayNames = {
      busts: 'Portrait Bust',
      cards3D: '3D Card',
      vCards: 'V-Card (Business Card)',
      vehicles: 'Vehicle Model',
      buildings: 'Building Model',
      personAnimal2Dto3D: '2D to 3D Conversion',
      digitalFiles: '3D Digital Files',
      eventServices: 'Event Services',
      injectionMolding: 'Injection Molded Product'
    };
    return displayNames[type] || `${type} ${subType || ''}`.trim();
  }

  getEventPricing(eventType) {
    const multiplier = this.eventMultipliers[eventType] || 1.0;
    const description = {
      premium: 'Premium Event (NFL, Major Festivals)',
      standard: 'Standard Event (Local Sports, Fairs)',
      budget: 'Budget Event (Schools, Fundraisers)',
      bulk: 'Bulk Order (50+ Units)'
    };

    return {
      type: eventType,
      multiplier: multiplier,
      description: description[eventType] || 'Custom Event',
      discount: multiplier < 1.0 ? Math.round((1 - multiplier) * 100) : 0,
      premium: multiplier > 1.0 ? Math.round((multiplier - 1) * 100) : 0
    };
  }

  generatePriceQuote(orderDetails, eventType = 'standard', customerInfo = {}) {
    const calculation = this.calculateOrderTotal(orderDetails, eventType);
    const eventPricing = this.getEventPricing(eventType);
    
    return {
      quoteId: this.generateQuoteId(),
      timestamp: new Date().toISOString(),
      customer: customerInfo,
      eventType: eventPricing,
      items: calculation.items,
      breakdown: {
        subtotal: calculation.subtotal,
        shipping: calculation.shipping,
        designFees: calculation.designFees,
        grandTotal: calculation.grandTotal
      },
      profitAnalysis: {
        totalCost: calculation.totalCost,
        totalRoyalties: calculation.totalRoyalties,
        grossProfit: calculation.grossProfit,
        netProfit: calculation.netProfit,
        margin: calculation.margin
      },
      terms: {
        turnaroundTime: '3-5 weeks',
        paymentTerms: 'Payment due at time of scanning',
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
      }
    };
  }

  generateQuoteId() {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    return `SHK3D-${timestamp}-${random}`.toUpperCase();
  }

  savePricingConfig() {
    const configPath = path.join(this.baseDir, 'config', 'pricing-config.json');
    return fs.writeJson(configPath, this.pricingConfig, { spaces: 2 });
  }

  generatePricingReport() {
    console.log('📊 Shrunk 3D Pricing Analysis Report');
    console.log('===================================\n');

    // Analyze figurine profit margins
    console.log('💰 Figurine Profit Margins by Size:');
    Object.entries(this.pricingConfig.figurines.primary).forEach(([size, pricing]) => {
      const profit = pricing.retail - pricing.cost - pricing.royalty;
      const margin = ((profit / pricing.retail) * 100).toFixed(1);
      console.log(`   ${size}": $${pricing.retail} → $${profit.toFixed(2)} profit (${margin}% margin)`);
    });

    console.log('\n🎯 Most Profitable Products:');
    const products = [];
    
    // Add figurines to analysis
    Object.entries(this.pricingConfig.figurines.primary).forEach(([size, pricing]) => {
      const profit = pricing.retail - pricing.cost - pricing.royalty;
      const margin = (profit / pricing.retail) * 100;
      products.push({
        name: `Single Person ${size}"`,
        retail: pricing.retail,
        profit: profit,
        margin: margin
      });
    });

    // Sort by margin and show top 5
    products.sort((a, b) => b.margin - a.margin)
      .slice(0, 5)
      .forEach((product, index) => {
        console.log(`   ${index + 1}. ${product.name}: ${product.margin.toFixed(1)}% margin`);
      });

    console.log('\n📈 Event Type Impact:');
    Object.entries(this.eventMultipliers).forEach(([type, multiplier]) => {
      const impact = multiplier > 1 ? `+${((multiplier - 1) * 100).toFixed(0)}%` : 
                    multiplier < 1 ? `-${((1 - multiplier) * 100).toFixed(0)}%` : 'Standard';
      console.log(`   ${type}: ${impact} pricing adjustment`);
    });

    return products;
  }
}

// CLI Usage and Testing
if (require.main === module) {
  const engine = new PricingEngine();
  const command = process.argv[2];

  switch (command) {
    case 'quote':
      // Test quote generation
      const testOrder = {
        figurines: [
          { type: 'primary', size: '5', quantity: 1 },
          { type: 'personPlusChild', size: '5', quantity: 1 }
        ],
        addOns: [
          { type: 'bases', size: '5', quantity: 2 }
        ]
      };
      
      const quote = engine.generatePriceQuote(testOrder, 'standard', {
        name: 'Test Customer',
        email: 'test@example.com'
      });
      
      console.log(JSON.stringify(quote, null, 2));
      break;

    case 'report':
      engine.generatePricingReport();
      break;

    case 'save':
      engine.savePricingConfig().then(() => {
        console.log('✅ Pricing configuration saved');
      });
      break;

    default:
      console.log('Usage: node pricing-engine.js [quote|report|save]');
  }
}

module.exports = PricingEngine;