#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

class EventManager {
  constructor() {
    this.baseDir = process.cwd();
    this.eventTypes = {
      'sports': {
        name: 'Sports Events',
        profitability: 'high',
        avgAttendance: 5000,
        avgOrderValue: 180,
        conversionRate: 0.08,
        pricingTier: 'standard'
      },
      'festival': {
        name: 'Festivals & Fairs',
        profitability: 'high',
        avgAttendance: 8000,
        avgOrderValue: 165,
        conversionRate: 0.12,
        pricingTier: 'standard'
      },
      'nfl': {
        name: 'NFL Games',
        profitability: 'premium',
        avgAttendance: 70000,
        avgOrderValue: 250,
        conversionRate: 0.06,
        pricingTier: 'premium'
      },
      'school': {
        name: 'School Events',
        profitability: 'medium',
        avgAttendance: 500,
        avgOrderValue: 120,
        conversionRate: 0.15,
        pricingTier: 'budget'
      },
      'corporate': {
        name: 'Corporate Events',
        profitability: 'high',
        avgAttendance: 200,
        avgOrderValue: 200,
        conversionRate: 0.25,
        pricingTier: 'premium'
      },
      'private': {
        name: 'Private Parties',
        profitability: 'premium',
        avgAttendance: 50,
        avgOrderValue: 300,
        conversionRate: 0.40,
        pricingTier: 'premium'
      }
    };
    
    this.venues = {
      jacksonville: [
        {
          name: 'TIAA Bank Field',
          type: 'nfl',
          capacity: 69132,
          contact: 'events@jaguars.com',
          address: '1 TIAA Bank Field Dr, Jacksonville, FL 32202',
          seasonSchedule: 'Aug-Jan',
          notes: 'Jacksonville Jaguars home stadium - premium pricing opportunity'
        },
        {
          name: 'VyStar Veterans Memorial Arena',
          type: 'sports',
          capacity: 15000,
          contact: 'booking@vystarvet.com',
          address: '300 A Philip Randolph Blvd, Jacksonville, FL 32202',
          seasonSchedule: 'Year-round',
          notes: 'Basketball, hockey, concerts - good family audience'
        },
        {
          name: 'Jacksonville Fairgrounds',
          type: 'festival',
          capacity: 10000,
          contact: 'info@northfloridafair.com',
          address: '510 Fairground Pl, Jacksonville, FL 32202',
          seasonSchedule: 'Nov (Annual Fair)',
          notes: 'High volume family event - excellent conversion rates'
        },
        {
          name: 'Metropolitan Park',
          type: 'festival',
          capacity: 8000,
          contact: 'parks@coj.net',
          address: '1410 Gator Bowl Blvd, Jacksonville, FL 32202',
          seasonSchedule: 'Mar-Nov',
          notes: 'Outdoor festivals and events - weather dependent'
        },
        {
          name: 'Duval County Schools',
          type: 'school',
          capacity: 1000,
          contact: 'partnerships@duvalschools.org',
          address: 'Various locations',
          seasonSchedule: 'Aug-May',
          notes: 'Fundraising opportunities - volume pricing'
        }
      ]
    };
  }

  async createEvent(eventData) {
    console.log('📅 Creating new event...');
    
    try {
      const eventId = eventData.id || uuidv4();
      const event = {
        id: eventId,
        name: eventData.name,
        type: eventData.type,
        venue: eventData.venue,
        date: eventData.date,
        startTime: eventData.startTime,
        endTime: eventData.endTime,
        expectedAttendance: eventData.expectedAttendance,
        
        // Booking details
        bookingStatus: eventData.bookingStatus || 'prospect',
        contactPerson: eventData.contactPerson,
        contactEmail: eventData.contactEmail,
        contactPhone: eventData.contactPhone,
        
        // Financial projections
        projectedRevenue: 0,
        projectedCost: 0,
        projectedProfit: 0,
        actualRevenue: 0,
        actualCost: 0,
        actualProfit: 0,
        
        // Logistics
        setupTime: eventData.setupTime || '2 hours before',
        boothLocation: eventData.boothLocation,
        electricalNeeds: eventData.electricalNeeds || 'Standard 110V',
        tableRequirements: eventData.tableRequirements || '2 tables, 4 chairs',
        
        // Marketing
        marketingPlan: [],
        socialMediaPosts: [],
        
        created: new Date().toISOString(),
        updated: new Date().toISOString()
      };
      
      // Calculate projections
      await this.calculateProjections(event);
      
      // Save event
      await this.saveEvent(event);
      
      console.log(`✅ Event created: ${event.name}`);
      console.log(`📊 Projected Revenue: $${event.projectedRevenue}`);
      console.log(`💰 Projected Profit: $${event.projectedProfit}`);
      
      return event;
      
    } catch (error) {
      console.error('❌ Error creating event:', error.message);
      throw error;
    }
  }

  async calculateProjections(event) {
    const eventTypeData = this.eventTypes[event.type];
    
    if (eventTypeData) {
      // Base calculations on event type averages
      const attendanceMultiplier = event.expectedAttendance / eventTypeData.avgAttendance;
      const potentialCustomers = Math.round(event.expectedAttendance * eventTypeData.conversionRate);
      
      // Revenue projection
      event.projectedRevenue = potentialCustomers * eventTypeData.avgOrderValue;
      
      // Cost projection
      const baseCosts = {
        tripFee: 175,        // Setup/travel fee
        materials: 50,       // Scanning materials, setup
        labor: 200,         // 8 hours at $25/hour
        boothFee: 100       // Average booth rental
      };
      
      event.projectedCost = Object.values(baseCosts).reduce((sum, cost) => sum + cost, 0);
      
      // Profit projection (rough estimate before royalties)
      event.projectedProfit = Math.round((event.projectedRevenue * 0.6) - event.projectedCost);
      
      // Add detailed breakdown
      event.projections = {
        potentialCustomers: potentialCustomers,
        avgOrderValue: eventTypeData.avgOrderValue,
        conversionRate: eventTypeData.conversionRate,
        pricingTier: eventTypeData.pricingTier,
        costs: baseCosts,
        roiPercentage: event.projectedRevenue > 0 ? 
          Math.round((event.projectedProfit / event.projectedCost) * 100) : 0
      };
    }
  }

  async saveEvent(event) {
    const eventsFile = path.join(this.baseDir, 'config', 'events.json');
    
    let events = {};
    if (await fs.pathExists(eventsFile)) {
      events = await fs.readJson(eventsFile);
    }
    
    events[event.id] = event;
    
    await fs.writeJson(eventsFile, events, { spaces: 2 });
  }

  async listEvents(status = null) {
    const eventsFile = path.join(this.baseDir, 'config', 'events.json');
    
    if (!(await fs.pathExists(eventsFile))) {
      return [];
    }
    
    const events = await fs.readJson(eventsFile);
    let eventList = Object.values(events);
    
    if (status) {
      eventList = eventList.filter(event => event.bookingStatus === status);
    }
    
    // Sort by date
    eventList.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    return eventList;
  }

  async updateEventStatus(eventId, status, notes = '') {
    const eventsFile = path.join(this.baseDir, 'config', 'events.json');
    
    if (!(await fs.pathExists(eventsFile))) {
      throw new Error('No events found');
    }
    
    const events = await fs.readJson(eventsFile);
    
    if (!events[eventId]) {
      throw new Error(`Event ${eventId} not found`);
    }
    
    events[eventId].bookingStatus = status;
    events[eventId].updated = new Date().toISOString();
    
    if (notes) {
      if (!events[eventId].notes) events[eventId].notes = [];
      events[eventId].notes.push({
        date: new Date().toISOString(),
        note: notes
      });
    }
    
    await fs.writeJson(eventsFile, events, { spaces: 2 });
    
    return events[eventId];
  }

  async recordEventResults(eventId, results) {
    const eventsFile = path.join(this.baseDir, 'config', 'events.json');
    
    if (!(await fs.pathExists(eventsFile))) {
      throw new Error('No events found');
    }
    
    const events = await fs.readJson(eventsFile);
    
    if (!events[eventId]) {
      throw new Error(`Event ${eventId} not found`);
    }
    
    // Record actual results
    events[eventId].actualRevenue = results.revenue || 0;
    events[eventId].actualCost = results.cost || 0;
    events[eventId].actualProfit = events[eventId].actualRevenue - events[eventId].actualCost;
    events[eventId].actualCustomers = results.customers || 0;
    events[eventId].actualConversionRate = results.attendance > 0 ? 
      (results.customers / results.attendance) : 0;
    
    events[eventId].bookingStatus = 'completed';
    events[eventId].updated = new Date().toISOString();
    
    await fs.writeJson(eventsFile, events, { spaces: 2 });
    
    return events[eventId];
  }

  generateEventProspects(location = 'jacksonville', eventType = null) {
    console.log(`🎯 Event Prospects for ${location.charAt(0).toUpperCase() + location.slice(1)}:`);
    console.log('=' .repeat(50));
    
    const locationVenues = this.venues[location] || [];
    let prospects = locationVenues;
    
    if (eventType) {
      prospects = prospects.filter(venue => venue.type === eventType);
    }
    
    prospects.forEach((venue, index) => {
      const eventTypeData = this.eventTypes[venue.type];
      const projectedRevenue = Math.round(venue.capacity * eventTypeData.conversionRate * eventTypeData.avgOrderValue);
      const projectedProfit = Math.round(projectedRevenue * 0.6 - 525); // Rough estimate
      
      console.log(`\n${index + 1}. ${venue.name}`);
      console.log(`   Type: ${eventTypeData.name}`);
      console.log(`   Capacity: ${venue.capacity.toLocaleString()}`);
      console.log(`   Projected Revenue: $${projectedRevenue.toLocaleString()}`);
      console.log(`   Projected Profit: $${projectedProfit.toLocaleString()}`);
      console.log(`   Season: ${venue.seasonSchedule}`);
      console.log(`   Contact: ${venue.contact}`);
      console.log(`   Address: ${venue.address}`);
      console.log(`   Notes: ${venue.notes}`);
    });
    
    return prospects;
  }

  generateEventReport() {
    console.log('📊 Event Management Report');
    console.log('==========================\n');
    
    this.listEvents().then(events => {
      const report = {
        totalEvents: events.length,
        byStatus: {},
        byType: {},
        totalProjectedRevenue: 0,
        totalActualRevenue: 0,
        completedEvents: 0,
        successRate: 0
      };
      
      events.forEach(event => {
        // Count by status
        report.byStatus[event.bookingStatus] = (report.byStatus[event.bookingStatus] || 0) + 1;
        
        // Count by type
        report.byType[event.type] = (report.byType[event.type] || 0) + 1;
        
        // Sum revenues
        report.totalProjectedRevenue += event.projectedRevenue || 0;
        report.totalActualRevenue += event.actualRevenue || 0;
        
        if (event.bookingStatus === 'completed') {
          report.completedEvents++;
        }
      });
      
      // Calculate success metrics
      const bookedEvents = (report.byStatus.booked || 0) + (report.byStatus.completed || 0);
      const totalProspects = events.length;
      report.successRate = totalProspects > 0 ? (bookedEvents / totalProspects * 100).toFixed(1) : 0;
      
      console.log(`📈 Total Events: ${report.totalEvents}`);
      console.log(`✅ Success Rate: ${report.successRate}% (${bookedEvents}/${totalProspects})`);
      console.log(`💰 Projected Revenue: $${report.totalProjectedRevenue.toLocaleString()}`);
      console.log(`💵 Actual Revenue: $${report.totalActualRevenue.toLocaleString()}`);
      
      console.log('\n📋 Events by Status:');
      Object.entries(report.byStatus).forEach(([status, count]) => {
        console.log(`   ${status}: ${count}`);
      });
      
      console.log('\n🎪 Events by Type:');
      Object.entries(report.byType).forEach(([type, count]) => {
        const typeName = this.eventTypes[type]?.name || type;
        console.log(`   ${typeName}: ${count}`);
      });
      
      // Show upcoming events
      const upcomingEvents = events.filter(event => {
        return new Date(event.date) > new Date() && 
               ['prospect', 'contacted', 'booked'].includes(event.bookingStatus);
      }).slice(0, 5);
      
      if (upcomingEvents.length > 0) {
        console.log('\n📅 Upcoming Events:');
        upcomingEvents.forEach(event => {
          console.log(`   ${event.name} - ${new Date(event.date).toLocaleDateString()} (${event.bookingStatus})`);
        });
      }
      
      return report;
    });
  }

  async generateMarketingPlan(eventId) {
    const eventsFile = path.join(this.baseDir, 'config', 'events.json');
    const events = await fs.readJson(eventsFile);
    const event = events[eventId];
    
    if (!event) {
      throw new Error(`Event ${eventId} not found`);
    }

    const marketingPlan = {
      eventId: eventId,
      eventName: event.name,
      eventDate: event.date,
      timeline: this.generateMarketingTimeline(event.date),
      socialMediaPosts: this.generateSocialMediaPosts(event),
      emailMarketing: this.generateEmailMarketing(event),
      partnerships: this.generatePartnershipOpportunities(event),
      materials: this.generateMarketingMaterials(event)
    };

    // Save marketing plan
    event.marketingPlan = marketingPlan;
    await fs.writeJson(eventsFile, events, { spaces: 2 });

    return marketingPlan;
  }

  generateMarketingTimeline(eventDate) {
    const eventDay = new Date(eventDate);
    const timeline = [];

    // 4 weeks before
    const fourWeeksBefore = new Date(eventDay);
    fourWeeksBefore.setDate(eventDay.getDate() - 28);
    timeline.push({
      date: fourWeeksBefore.toISOString(),
      task: 'Launch social media campaign',
      description: 'Begin posting about upcoming event'
    });

    // 2 weeks before
    const twoWeeksBefore = new Date(eventDay);
    twoWeeksBefore.setDate(eventDay.getDate() - 14);
    timeline.push({
      date: twoWeeksBefore.toISOString(),
      task: 'Send email to existing customers',
      description: 'Notify previous customers about event'
    });

    // 1 week before
    const oneWeekBefore = new Date(eventDay);
    oneWeekBefore.setDate(eventDay.getDate() - 7);
    timeline.push({
      date: oneWeekBefore.toISOString(),
      task: 'Final social media push',
      description: 'Daily posts leading up to event'
    });

    // Day of event
    timeline.push({
      date: eventDay.toISOString(),
      task: 'Live event updates',
      description: 'Post live updates and behind-scenes content'
    });

    return timeline;
  }

  generateSocialMediaPosts(event) {
    const eventTypeData = this.eventTypes[event.type];
    const posts = [
      {
        platform: 'Instagram',
        type: 'announcement',
        content: `🎉 We'll be at ${event.name} on ${new Date(event.date).toLocaleDateString()}! Come create your personalized 3D figurine with our state-of-the-art 95-camera system! #Shrunk3D #Jacksonville #3DFigurines`,
        hashtags: ['#Shrunk3D', '#Jacksonville', '#3DFigurines', '#Memories', '#Events']
      },
      {
        platform: 'Facebook',
        type: 'event',
        content: `Mark your calendars! 📅 Shrunk 3D will be at ${event.name}. Bring your family and friends to capture your memories in stunning 3D detail. Perfect for gifts, keepsakes, and amazing conversation pieces!`,
        hashtags: ['#3DMemories', '#FamilyFun', '#Jacksonville']
      },
      {
        platform: 'TikTok',
        type: 'behind-scenes',
        content: `Behind the magic ✨ See how our 95-camera system captures you in perfect 3D! Coming to ${event.venue} soon!`,
        hashtags: ['#3DTechnology', '#BehindTheScenes', '#Innovation']
      }
    ];

    return posts;
  }

  generateEmailMarketing(event) {
    return {
      subject: `Shrunk 3D Coming to ${event.name}!`,
      preheader: 'Create your personalized 3D figurine',
      content: `
        <h2>We're Coming to ${event.name}!</h2>
        <p>Join us on ${new Date(event.date).toLocaleDateString()} for an amazing 3D figurine experience!</p>
        
        <h3>What to Expect:</h3>
        <ul>
          <li>State-of-the-art 95-camera scanning technology</li>
          <li>Hyper-realistic 3D figurines in multiple sizes</li>
          <li>Perfect for gifts, keepsakes, and collectibles</li>
          <li>Professional quality results in 3-5 weeks</li>
        </ul>
        
        <h3>Special Event Pricing:</h3>
        <p>Take advantage of our ${event.type === 'premium' ? 'premium' : 'standard'} event pricing!</p>
        
        <p>Can't wait to see you there!</p>
        <p>The Shrunk 3D Jacksonville Team</p>
      `,
      cta: 'Learn More About Our Process',
      segments: ['existing-customers', 'event-attendees']
    };
  }

  generatePartnershipOpportunities(event) {
    return [
      {
        partner: 'Event Organizers',
        opportunity: 'Cross-promotion on event materials',
        benefit: 'Increased visibility and credibility'
      },
      {
        partner: 'Local Sports Teams',
        opportunity: 'Team figurine sponsorship',
        benefit: 'Team merchandise opportunities'
      },
      {
        partner: 'Photography Services',
        opportunity: 'Complementary service package',
        benefit: 'Enhanced customer experience'
      }
    ];
  }

  generateMarketingMaterials(event) {
    return {
      banners: [
        '6ft x 3ft booth backdrop with company branding',
        'Table runners with pricing information'
      ],
      flyers: [
        'Tri-fold brochure with pricing and process',
        'Business cards with QR codes'
      ],
      digital: [
        'Instagram story templates',
        'Facebook event cover photo',
        'Email signature banners'
      ],
      promotional: [
        'Sample 3D figurines for display',
        'Process demonstration video on tablet',
        'Before/after comparison displays'
      ]
    };
  }
}

// CLI Usage
if (require.main === module) {
  const manager = new EventManager();
  const command = process.argv[2];

  switch (command) {
    case 'create':
      const sampleEvent = {
        name: 'Jacksonville Jaguars vs Miami Dolphins',
        type: 'nfl',
        venue: 'TIAA Bank Field',
        date: '2024-12-01',
        startTime: '13:00',
        endTime: '17:00',
        expectedAttendance: 65000,
        contactPerson: 'Events Team',
        contactEmail: 'events@jaguars.com',
        bookingStatus: 'prospect'
      };
      manager.createEvent(sampleEvent);
      break;

    case 'list':
      manager.listEvents().then(events => {
        console.log('📅 Events:');
        events.forEach(event => {
          console.log(`  ${event.name} - ${new Date(event.date).toLocaleDateString()} (${event.bookingStatus})`);
        });
      });
      break;

    case 'prospects':
      const location = process.argv[3] || 'jacksonville';
      const eventType = process.argv[4];
      manager.generateEventProspects(location, eventType);
      break;

    case 'report':
      manager.generateEventReport();
      break;

    default:
      console.log('Usage: node event-manager.js [create|list|prospects|report] [location] [eventType]');
  }
}

module.exports = EventManager;