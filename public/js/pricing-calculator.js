// Pricing Calculator JavaScript
class PricingCalculator {
  constructor() {
    this.currentOrder = {
      figurines: [],
      addOns: [],
      additionalProducts: []
    };
    
    this.currentEventType = 'standard';
    this.selectedFigurineSize = '4';
    this.selectedAddonSize = '4';
    
    // Pricing data from the latest PDF and CSV
    this.pricingData = {
      eventMultipliers: {
        'premium': 1.3,
        'standard': 1.0,
        'budget': 0.85,
        'bulk': 0.75
      },
      
      figurines: {
        primary: {
          '3': { retail: 130, cost: 15, royalty: 6.00 },
          '4': { retail: 155, cost: 25, royalty: 8.00 },
          '5': { retail: 200, cost: 40, royalty: 11.50 },
          '6': { retail: 240, cost: 55, royalty: 14.50 },
          '7': { retail: 290, cost: 65, royalty: 18.50 },
          '8': { retail: 335, cost: 90, royalty: 22.50 },
          '9': { retail: 385, cost: 120, royalty: 26.50 }
        },
        
        twoPeople: {
          '3': { retail: 155, cost: 25, royalty: 9.50 },
          '4': { retail: 200, cost: 40, royalty: 14.00 },
          '5': { retail: 250, cost: 65, royalty: 19.00 },
          '6': { retail: 295, cost: 90, royalty: 23.50 },
          '7': { retail: 345, cost: 110, royalty: 28.50 },
          '8': { retail: 400, cost: 145, royalty: 34.00 },
          '9': { retail: 490, cost: 185, royalty: 42.50 }
        },
        
        personPlusChild: {
          '3': { retail: 90, cost: 20, royalty: 9.50 },
          '4': { retail: 110, cost: 30, royalty: 14.00 },
          '5': { retail: 145, cost: 50, royalty: 19.00 },
          '6': { retail: 175, cost: 70, royalty: 23.50 },
          '7': { retail: 215, cost: 85, royalty: 28.50 },
          '8': { retail: 255, cost: 115, royalty: 34.00 },
          '9': { retail: 295, cost: 150, royalty: 42.50 }
        },
        
        twoPeoplePlusChild: {
          '3': { retail: 195, cost: 30, royalty: 13.00 },
          '4': { retail: 245, cost: 45, royalty: 20.50 },
          '5': { retail: 305, cost: 75, royalty: 26.50 },
          '6': { retail: 350, cost: 105, royalty: 32.00 },
          '7': { retail: 415, cost: 130, royalty: 38.50 },
          '8': { retail: 480, cost: 170, royalty: 46.50 },
          '9': { retail: 580, cost: 220, royalty: 57.50 }
        },
        
        soloPet: {
          '4': { retail: 130, cost: 45, royalty: 10.00 },
          '5': { retail: 155, cost: 65, royalty: 12.50 },
          '6': { retail: 180, cost: 80, royalty: 15.00 }
        }
      },
      
      addOns: {
        bases: {
          '3': { retail: 0, cost: 0, royalty: 0 },
          '4': { retail: 0, cost: 0, royalty: 0 },
          '5': { retail: 10, cost: 0, royalty: 1.00 },
          '6': { retail: 10, cost: 0, royalty: 1.00 },
          '7': { retail: 15, cost: 0, royalty: 1.50 },
          '8': { retail: 15, cost: 0, royalty: 1.50 },
          '9': { retail: 20, cost: 0, royalty: 2.00 }
        },
        
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
      
      additionalProducts: {
        busts: { '4': { retail: 60, cost: 25 } },
        cards3D: { standard: { retail: 45, cost: 15 } },
        vCards: { single: { retail: 6.50, cost: 2.50 } },
        vehicles: {
          '4': { retail: 275, cost: 100 },
          '6': { retail: 399, cost: 150 },
          '8': { retail: 499, cost: 200 }
        },
        buildings: { '4': { retail: 499, cost: 200 } },
        personAnimal2Dto3D: {
          '4': { retail: 225, cost: 100 },
          '6': { retail: 275, cost: 125 },
          '8': { retail: 350, cost: 150 }
        },
        digitalFiles: { perPerson: { retail: 100, cost: 10 } },
        eventServices: { boothRental: { retail: 175, cost: 50 } }
      }
    };
    
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.updatePricePreview('figurine');
    this.updateOrderSummary();
  }

  setupEventListeners() {
    // Event type selection
    document.querySelectorAll('.event-type-card').forEach(card => {
      card.addEventListener('click', (e) => {
        document.querySelectorAll('.event-type-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        this.currentEventType = card.dataset.type;
        this.updateAllPreviews();
        this.updateOrderSummary();
      });
    });

    // Tab switching
    document.querySelectorAll('.item-type-tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        document.querySelectorAll('.item-type-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        
        tab.classList.add('active');
        document.querySelector(`[data-content="${tab.dataset.tab}"]`).classList.add('active');
      });
    });

    // Size selection
    document.querySelectorAll('#figurine-sizes .size-option').forEach(option => {
      option.addEventListener('click', (e) => {
        document.querySelectorAll('#figurine-sizes .size-option').forEach(o => o.classList.remove('selected'));
        option.classList.add('selected');
        this.selectedFigurineSize = option.dataset.size;
        this.updatePricePreview('figurine');
      });
    });

    document.querySelectorAll('#addon-sizes .size-option').forEach(option => {
      option.addEventListener('click', (e) => {
        document.querySelectorAll('#addon-sizes .size-option').forEach(o => o.classList.remove('selected'));
        option.classList.add('selected');
        this.selectedAddonSize = option.dataset.size;
        this.updatePricePreview('addon');
      });
    });

    // Form changes
    document.getElementById('figurine-type').addEventListener('change', () => {
      this.updateAvailableSizes();
      this.updatePricePreview('figurine');
    });
    
    document.getElementById('figurine-quantity').addEventListener('input', () => {
      this.updatePricePreview('figurine');
    });

    document.getElementById('addon-type').addEventListener('change', () => {
      this.updateAddonSizeVisibility();
      this.updatePricePreview('addon');
    });
    
    document.getElementById('addon-quantity').addEventListener('input', () => {
      this.updatePricePreview('addon');
    });

    document.getElementById('product-type').addEventListener('change', () => {
      this.updatePricePreview('product');
    });
    
    document.getElementById('product-quantity').addEventListener('input', () => {
      this.updatePricePreview('product');
    });

    document.getElementById('include-shipping').addEventListener('change', () => {
      this.updateOrderSummary();
    });
  }

  updateAvailableSizes() {
    const figurineType = document.getElementById('figurine-type').value;
    const availableSizes = Object.keys(this.pricingData.figurines[figurineType] || {});
    
    document.querySelectorAll('#figurine-sizes .size-option').forEach(option => {
      const size = option.dataset.size;
      if (availableSizes.includes(size)) {
        option.style.display = 'block';
        option.style.opacity = '1';
      } else {
        option.style.display = 'none';
      }
    });

    // Select first available size if current selection is not available
    if (!availableSizes.includes(this.selectedFigurineSize) && availableSizes.length > 0) {
      this.selectedFigurineSize = availableSizes[0];
      document.querySelectorAll('#figurine-sizes .size-option').forEach(o => o.classList.remove('selected'));
      document.querySelector(`#figurine-sizes .size-option[data-size="${this.selectedFigurineSize}"]`)?.classList.add('selected');
    }
  }

  updateAddonSizeVisibility() {
    const addonType = document.getElementById('addon-type').value;
    const sizeGroup = document.getElementById('addon-size-group');
    
    if (addonType === 'ornament') {
      sizeGroup.style.display = 'none';
    } else {
      sizeGroup.style.display = 'block';
    }
  }

  updatePricePreview(itemType) {
    const multiplier = this.pricingData.eventMultipliers[this.currentEventType];
    
    if (itemType === 'figurine') {
      const type = document.getElementById('figurine-type').value;
      const size = this.selectedFigurineSize;
      const quantity = parseInt(document.getElementById('figurine-quantity').value) || 1;
      
      const pricing = this.pricingData.figurines[type]?.[size];
      if (pricing) {
        const price = Math.round(pricing.retail * multiplier) * quantity;
        document.getElementById('figurine-price').textContent = `$${price}`;
      }
    } else if (itemType === 'addon') {
      const type = document.getElementById('addon-type').value;
      const quantity = parseInt(document.getElementById('addon-quantity').value) || 1;
      
      let pricing;
      if (type === 'ornament') {
        pricing = this.pricingData.addOns.ornament;
      } else {
        const size = this.selectedAddonSize;
        pricing = this.pricingData.addOns[type]?.[size];
      }
      
      if (pricing) {
        const price = Math.round(pricing.retail * multiplier) * quantity;
        document.getElementById('addon-price').textContent = `$${price}`;
      }
    } else if (itemType === 'product') {
      const type = document.getElementById('product-type').value;
      const quantity = parseInt(document.getElementById('product-quantity').value) || 1;
      
      let pricing;
      if (type === 'vCards') {
        pricing = this.pricingData.additionalProducts[type].single;
      } else if (type === 'cards3D') {
        pricing = this.pricingData.additionalProducts[type].standard;
      } else if (type === 'digitalFiles') {
        pricing = this.pricingData.additionalProducts[type].perPerson;
      } else if (type === 'eventServices') {
        pricing = this.pricingData.additionalProducts[type].boothRental;
      } else {
        // For items with sizes, default to 4"
        pricing = this.pricingData.additionalProducts[type]?.['4'] || 
                 Object.values(this.pricingData.additionalProducts[type] || {})[0];
      }
      
      if (pricing) {
        const price = Math.round(pricing.retail * multiplier) * quantity;
        document.getElementById('product-price').textContent = `$${price}`;
      }
    }
  }

  updateAllPreviews() {
    this.updatePricePreview('figurine');
    this.updatePricePreview('addon');
    this.updatePricePreview('product');
  }

  addFigurine() {
    const type = document.getElementById('figurine-type').value;
    const size = this.selectedFigurineSize;
    const quantity = parseInt(document.getElementById('figurine-quantity').value) || 1;
    
    const pricing = this.pricingData.figurines[type]?.[size];
    if (!pricing) {
      alert('Invalid figurine configuration');
      return;
    }

    const multiplier = this.pricingData.eventMultipliers[this.currentEventType];
    const price = Math.round(pricing.retail * multiplier);

    this.currentOrder.figurines.push({
      type: type,
      size: size,
      quantity: quantity,
      price: price,
      cost: pricing.cost,
      royalty: pricing.royalty,
      description: `${this.getFigurineTypeDisplay(type)} (${size}")`
    });

    this.updateOrderSummary();
    document.getElementById('figurine-quantity').value = 1;
    this.updatePricePreview('figurine');
  }

  addAddon() {
    const type = document.getElementById('addon-type').value;
    const quantity = parseInt(document.getElementById('addon-quantity').value) || 1;
    
    let pricing, size = null, description;
    
    if (type === 'ornament') {
      pricing = this.pricingData.addOns.ornament;
      description = 'Ornament';
    } else {
      size = this.selectedAddonSize;
      pricing = this.pricingData.addOns[type]?.[size];
      description = `${this.getAddOnTypeDisplay(type)} (${size}")`;
    }
    
    if (!pricing) {
      alert('Invalid add-on configuration');
      return;
    }

    const multiplier = this.pricingData.eventMultipliers[this.currentEventType];
    const price = Math.round(pricing.retail * multiplier);

    this.currentOrder.addOns.push({
      type: type,
      size: size,
      quantity: quantity,
      price: price,
      cost: pricing.cost,
      royalty: pricing.royalty,
      description: description
    });

    this.updateOrderSummary();
    document.getElementById('addon-quantity').value = 1;
    this.updatePricePreview('addon');
  }

  addProduct() {
    const type = document.getElementById('product-type').value;
    const quantity = parseInt(document.getElementById('product-quantity').value) || 1;
    
    let pricing, description;
    
    if (type === 'vCards') {
      pricing = this.pricingData.additionalProducts[type].single;
      description = 'V-Card (Business Card)';
    } else if (type === 'cards3D') {
      pricing = this.pricingData.additionalProducts[type].standard;
      description = '3D Card';
    } else if (type === 'digitalFiles') {
      pricing = this.pricingData.additionalProducts[type].perPerson;
      description = '3D Digital Files';
    } else if (type === 'eventServices') {
      pricing = this.pricingData.additionalProducts[type].boothRental;
      description = 'Event Services (Booth Rental)';
    } else {
      // For items with sizes, default to 4"
      pricing = this.pricingData.additionalProducts[type]?.['4'] || 
               Object.values(this.pricingData.additionalProducts[type] || {})[0];
      description = `${this.getProductTypeDisplay(type)} (4")`;
    }
    
    if (!pricing) {
      alert('Invalid product configuration');
      return;
    }

    const multiplier = this.pricingData.eventMultipliers[this.currentEventType];
    const price = Math.round(pricing.retail * multiplier);

    this.currentOrder.additionalProducts.push({
      type: type,
      quantity: quantity,
      price: price,
      cost: pricing.cost,
      royalty: 0,
      description: description
    });

    this.updateOrderSummary();
    document.getElementById('product-quantity').value = 1;
    this.updatePricePreview('product');
  }

  updateOrderSummary() {
    const itemsContainer = document.getElementById('quote-items');
    itemsContainer.innerHTML = '';

    let subtotal = 0;
    let totalCost = 0;
    let totalRoyalties = 0;

    // Add figurines
    this.currentOrder.figurines.forEach((item, index) => {
      const total = item.price * item.quantity;
      subtotal += total;
      totalCost += item.cost * item.quantity;
      totalRoyalties += item.royalty * item.quantity;
      
      itemsContainer.innerHTML += `
        <div class="quote-item">
          <div>
            <div>${item.description}</div>
            <small>Qty: ${item.quantity} × $${item.price}</small>
          </div>
          <div style="text-align: right;">
            <strong>$${total}</strong>
            <button class="btn btn-sm" onclick="removeItem('figurines', ${index})" style="margin-left: 0.5rem;">
              <i class="fas fa-times"></i>
            </button>
          </div>
        </div>
      `;
    });

    // Add addons
    this.currentOrder.addOns.forEach((item, index) => {
      const total = item.price * item.quantity;
      subtotal += total;
      totalCost += item.cost * item.quantity;
      totalRoyalties += item.royalty * item.quantity;
      
      itemsContainer.innerHTML += `
        <div class="quote-item">
          <div>
            <div>${item.description}</div>
            <small>Qty: ${item.quantity} × $${item.price}</small>
          </div>
          <div style="text-align: right;">
            <strong>$${total}</strong>
            <button class="btn btn-sm" onclick="removeItem('addOns', ${index})" style="margin-left: 0.5rem;">
              <i class="fas fa-times"></i>
            </button>
          </div>
        </div>
      `;
    });

    // Add products
    this.currentOrder.additionalProducts.forEach((item, index) => {
      const total = item.price * item.quantity;
      subtotal += total;
      totalCost += item.cost * item.quantity;
      
      itemsContainer.innerHTML += `
        <div class="quote-item">
          <div>
            <div>${item.description}</div>
            <small>Qty: ${item.quantity} × $${item.price}</small>
          </div>
          <div style="text-align: right;">
            <strong>$${total}</strong>
            <button class="btn btn-sm" onclick="removeItem('additionalProducts', ${index})" style="margin-left: 0.5rem;">
              <i class="fas fa-times"></i>
            </button>
          </div>
        </div>
      `;
    });

    if (subtotal === 0) {
      itemsContainer.innerHTML = '<div class="quote-item" style="text-align: center; color: #666;">No items added yet</div>';
    }

    // Update totals
    const includeShipping = document.getElementById('include-shipping').checked;
    const shipping = includeShipping ? 14.95 : 0;
    const shippingCost = includeShipping ? 7.95 : 0;
    const grandTotal = subtotal + shipping;

    document.getElementById('quote-subtotal').textContent = `$${subtotal.toFixed(2)}`;
    document.getElementById('quote-shipping').textContent = `$${shipping.toFixed(2)}`;
    document.getElementById('quote-total').textContent = `$${grandTotal.toFixed(2)}`;

    // Profit analysis
    const totalActualCost = totalCost + shippingCost + (this.currentOrder.figurines.length > 0 ? 30 : 0); // Design fee
    const grossProfit = grandTotal - totalActualCost;
    const netProfit = grossProfit - totalRoyalties;
    const margin = grandTotal > 0 ? (netProfit / grandTotal * 100) : 0;

    document.getElementById('profit-revenue').textContent = `$${grandTotal.toFixed(2)}`;
    document.getElementById('profit-cost').textContent = `$${totalActualCost.toFixed(2)}`;
    document.getElementById('profit-royalties').textContent = `$${totalRoyalties.toFixed(2)}`;
    document.getElementById('profit-net').textContent = `$${netProfit.toFixed(2)}`;
    document.getElementById('profit-margin').textContent = `${margin.toFixed(1)}%`;
  }

  removeItem(category, index) {
    this.currentOrder[category].splice(index, 1);
    this.updateOrderSummary();
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

  getProductTypeDisplay(type) {
    const displayNames = {
      busts: 'Portrait Bust',
      cards3D: '3D Card', 
      vCards: 'V-Card',
      vehicles: 'Vehicle Model',
      buildings: 'Building Model',
      personAnimal2Dto3D: '2D to 3D Conversion',
      digitalFiles: '3D Digital Files',
      eventServices: 'Event Services'
    };
    return displayNames[type] || type;
  }

  generateQuote() {
    if (this.currentOrder.figurines.length === 0 && 
        this.currentOrder.addOns.length === 0 && 
        this.currentOrder.additionalProducts.length === 0) {
      alert('Please add at least one item to generate a quote.');
      return;
    }

    const customerName = document.getElementById('customer-name').value;
    const customerEmail = document.getElementById('customer-email').value;
    const customerPhone = document.getElementById('customer-phone').value;

    const quote = {
      quoteId: this.generateQuoteId(),
      timestamp: new Date().toISOString(),
      customer: {
        name: customerName || 'Walk-in Customer',
        email: customerEmail,
        phone: customerPhone
      },
      eventType: this.currentEventType,
      items: [
        ...this.currentOrder.figurines,
        ...this.currentOrder.addOns,
        ...this.currentOrder.additionalProducts
      ],
      subtotal: parseFloat(document.getElementById('quote-subtotal').textContent.replace('$', '')),
      shipping: parseFloat(document.getElementById('quote-shipping').textContent.replace('$', '')),
      total: parseFloat(document.getElementById('quote-total').textContent.replace('$', '')),
      profitAnalysis: {
        revenue: parseFloat(document.getElementById('profit-revenue').textContent.replace('$', '')),
        cost: parseFloat(document.getElementById('profit-cost').textContent.replace('$', '')),
        royalties: parseFloat(document.getElementById('profit-royalties').textContent.replace('$', '')),
        netProfit: parseFloat(document.getElementById('profit-net').textContent.replace('$', '')),
        margin: parseFloat(document.getElementById('profit-margin').textContent.replace('%', ''))
      }
    };

    // Generate printable quote
    this.showQuoteModal(quote);
  }

  generateQuoteId() {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    return `SHK3D-${timestamp}-${random}`.toUpperCase();
  }

  showQuoteModal(quote) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay show';
    modal.innerHTML = `
      <div class="modal" style="max-width: 800px;">
        <div class="modal-header">
          <h3>Quote Generated</h3>
          <button class="close-btn" onclick="this.closest('.modal-overlay').remove()">&times;</button>
        </div>
        <div class="modal-body">
          <div style="text-align: center; margin-bottom: 2rem;">
            <h2>Shrunk 3D Jacksonville</h2>
            <p>Your Memories Captured in 3D</p>
            <p><strong>Quote #${quote.quoteId}</strong></p>
            <p>Generated: ${new Date(quote.timestamp).toLocaleDateString()}</p>
          </div>
          
          <div style="margin-bottom: 2rem;">
            <h4>Customer Information:</h4>
            <p><strong>Name:</strong> ${quote.customer.name}</p>
            ${quote.customer.email ? `<p><strong>Email:</strong> ${quote.customer.email}</p>` : ''}
            ${quote.customer.phone ? `<p><strong>Phone:</strong> ${quote.customer.phone}</p>` : ''}
            <p><strong>Event Type:</strong> ${this.getEventTypeDisplay(quote.eventType)}</p>
          </div>
          
          <div style="margin-bottom: 2rem;">
            <h4>Items:</h4>
            ${quote.items.map(item => `
              <div style="display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid #eee;">
                <div>${item.description} (Qty: ${item.quantity})</div>
                <div>$${(item.price * item.quantity).toFixed(2)}</div>
              </div>
            `).join('')}
          </div>
          
          <div style="text-align: right; margin-bottom: 2rem;">
            <div><strong>Subtotal: $${quote.subtotal.toFixed(2)}</strong></div>
            <div><strong>Shipping: $${quote.shipping.toFixed(2)}</strong></div>
            <div style="font-size: 1.2rem; border-top: 2px solid #333; padding-top: 0.5rem; margin-top: 0.5rem;">
              <strong>Total: $${quote.total.toFixed(2)}</strong>
            </div>
          </div>
          
          <div style="font-size: 0.9rem; color: #666;">
            <p><strong>Terms:</strong></p>
            <ul>
              <li>Turnaround time: 3-5 weeks</li>
              <li>Payment due at time of scanning</li>
              <li>Quote valid for 30 days</li>
              <li>$30 design fee included in pricing</li>
            </ul>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-primary" onclick="window.print()">
            <i class="fas fa-print"></i> Print Quote
          </button>
          <button class="btn btn-success" onclick="calculator.saveOrder()">
            <i class="fas fa-save"></i> Save Order
          </button>
          <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">
            Close
          </button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
  }

  getEventTypeDisplay(eventType) {
    const displays = {
      standard: 'Standard Event',
      premium: 'Premium Event (+30%)',
      budget: 'Budget Event (-15%)',
      bulk: 'Bulk Order (-25%)'
    };
    return displays[eventType] || eventType;
  }

  saveOrder() {
    // Save to localStorage for now - could integrate with backend
    const orderData = {
      ...this.currentOrder,
      timestamp: new Date().toISOString(),
      eventType: this.currentEventType,
      customer: {
        name: document.getElementById('customer-name').value,
        email: document.getElementById('customer-email').value,
        phone: document.getElementById('customer-phone').value
      }
    };
    
    const savedOrders = JSON.parse(localStorage.getItem('shrunk3d-orders') || '[]');
    savedOrders.push(orderData);
    localStorage.setItem('shrunk3d-orders', JSON.stringify(savedOrders));
    
    alert('Order saved successfully!');
  }

  clearAll() {
    if (confirm('Are you sure you want to clear all items?')) {
      this.currentOrder = {
        figurines: [],
        addOns: [],
        additionalProducts: []
      };
      
      document.getElementById('customer-name').value = '';
      document.getElementById('customer-email').value = '';
      document.getElementById('customer-phone').value = '';
      
      this.updateOrderSummary();
    }
  }
}

// Global functions for HTML onclick handlers
function removeItem(category, index) {
  calculator.removeItem(category, index);
}

function addFigurine() {
  calculator.addFigurine();
}

function addAddon() {
  calculator.addAddon();
}

function addProduct() {
  calculator.addProduct();
}

function generateQuote() {
  calculator.generateQuote();
}

function saveOrder() {
  calculator.saveOrder();
}

function clearAll() {
  calculator.clearAll();
}

// Initialize calculator
const calculator = new PricingCalculator();