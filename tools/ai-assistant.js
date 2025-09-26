const fs = require('fs-extra');
const path = require('path');
const GoHighLevelClient = require('../ghl-integration/api/ghl-client');
const PricingEngine = require('./pricing-engine');

class AIAssistant {
  constructor() {
    this.baseDir = process.cwd();
    this.pricingEngine = new PricingEngine();
    this.businessContext = this.loadBusinessContext();
  }

  loadBusinessContext() {
    try {
      // Load Shrunk 3D business context from AI Drive
      return {
        businessName: "Shrunk 3D Jacksonville",
        businessType: "3D Figurine Printing & Event Services", 
        location: "Jacksonville, Florida",
        services: [
          "Individual 3D Figurines",
          "Wedding Party Figurines", 
          "Pet Figurines",
          "Corporate Event Services",
          "Event Booth Setup",
          "Rush Orders",
          "V-Cards (Virtual Business Cards)",
          "Mass Production Services"
        ],
        commonEventTypes: [
          "Weddings", "Corporate Events", "Conventions", "Pet Events", 
          "Marathons", "Sports Events", "Art Walks", "Festivals"
        ],
        targetMarkets: [
          "Engaged couples", "Corporate event planners", "Pet owners",
          "Convention organizers", "Sports teams", "Event photographers"
        ],
        pricingTiers: ["Standard", "Premium", "Rush", "Event"],
        avgOrderValue: 150,
        conversionRate: 0.25
      };
    } catch (error) {
      console.error('Failed to load business context:', error);
      return {};
    }
  }

  async processMessage(message, conversationHistory = [], businessContext = {}) {
    try {
      // Analyze the user's intent
      const intent = this.analyzeIntent(message);
      
      let response;
      let actions = [];

      switch (intent.type) {
        case 'contacts_query':
          response = await this.handleContactsQuery(intent, message);
          break;

        case 'pricing_request':
          response = await this.handlePricingRequest(intent, message);
          break;

        case 'email_template':
          response = await this.handleEmailTemplate(intent, message);
          break;

        case 'business_analysis':
          response = await this.handleBusinessAnalysis(intent, message);
          break;

        case 'event_opportunities':
          response = await this.handleEventOpportunities(intent, message);
          break;

        case 'follow_up_creation':
          response = await this.handleFollowUpCreation(intent, message);
          break;

        default:
          response = await this.handleGeneralQuery(message, conversationHistory);
      }

      return {
        response,
        actions,
        intent: intent.type,
        confidence: intent.confidence
      };

    } catch (error) {
      console.error('AI Assistant Error:', error);
      return {
        response: "I apologize, but I encountered an error processing your request. Please try rephrasing your question or contact support if the issue persists.",
        actions: [],
        error: error.message
      };
    }
  }

  analyzeIntent(message) {
    const msg = message.toLowerCase();
    
    // Contact-related queries
    if (msg.includes('contact') || msg.includes('lead') || msg.includes('client')) {
      if (msg.includes('show') || msg.includes('list') || msg.includes('latest')) {
        return { type: 'contacts_query', confidence: 0.9, subtype: 'list' };
      }
      if (msg.includes('analyz') || msg.includes('segment') || msg.includes('tag')) {
        return { type: 'business_analysis', confidence: 0.8, subtype: 'contacts' };
      }
    }

    // Pricing requests
    if (msg.includes('pric') || msg.includes('quote') || msg.includes('cost') || msg.includes('figur')) {
      return { type: 'pricing_request', confidence: 0.9 };
    }

    // Email/template creation
    if (msg.includes('email') || msg.includes('template') || msg.includes('message') || msg.includes('reply')) {
      return { type: 'email_template', confidence: 0.8 };
    }

    // Follow-up creation
    if (msg.includes('follow') || msg.includes('sequence') || msg.includes('campaign')) {
      return { type: 'follow_up_creation', confidence: 0.8 };
    }

    // Event opportunities
    if (msg.includes('event') || msg.includes('upcoming') || msg.includes('jacksonville') || msg.includes('opportunit')) {
      return { type: 'event_opportunities', confidence: 0.8 };
    }

    // Business analysis
    if (msg.includes('analyz') || msg.includes('report') || msg.includes('insight') || msg.includes('suggest')) {
      return { type: 'business_analysis', confidence: 0.7 };
    }

    return { type: 'general', confidence: 0.5 };
  }

  async handleContactsQuery(intent, message) {
    try {
      const ghlClient = new GoHighLevelClient();
      
      // Determine query parameters based on message
      const queryParams = this.parseContactQuery(message);
      const contacts = await ghlClient.getContacts(queryParams);

      if (!contacts || !contacts.contacts) {
        return "I couldn't retrieve your contact information. Please make sure your GoHighLevel connection is working properly.";
      }

      const totalContacts = contacts.meta?.total || contacts.contacts.length;
      const recentContacts = contacts.contacts.slice(0, 10);

      // Analyze contacts
      const analysis = this.analyzeContacts(recentContacts);
      
      let response = `📊 **Contact Overview**\n\n`;
      response += `**Total Contacts:** ${totalContacts}\n`;
      response += `**Recent Contacts:** ${recentContacts.length}\n\n`;

      if (analysis.eventContacts > 0) {
        response += `🎪 **Event Breakdown:**\n`;
        Object.entries(analysis.eventBreakdown).forEach(([event, count]) => {
          response += `• ${event}: ${count} contacts\n`;
        });
        response += `\n`;
      }

      response += `🔥 **Quick Insights:**\n`;
      if (analysis.hotLeads > 0) {
        response += `• ${analysis.hotLeads} contacts have recent activity (potential hot leads)\n`;
      }
      if (analysis.missingInfo > 0) {
        response += `• ${analysis.missingInfo} contacts missing phone or email\n`;
      }
      if (analysis.untagged > 0) {
        response += `• ${analysis.untagged} contacts need better tagging\n`;
      }

      if (recentContacts.length > 0) {
        response += `\n📝 **Latest Contacts:**\n`;
        recentContacts.slice(0, 5).forEach((contact, i) => {
          const name = contact.contactName || `${contact.firstName || ''} ${contact.lastName || ''}`.trim();
          const tags = contact.tags?.join(', ') || 'No tags';
          const added = new Date(contact.dateAdded).toLocaleDateString();
          response += `${i + 1}. **${name}** (${added}) - Tags: ${tags}\n`;
        });
      }

      response += `\n💡 **Suggested Actions:**\n`;
      response += `• Follow up with recent contacts who haven't been tagged\n`;
      response += `• Create targeted campaigns for event-specific contacts\n`;
      response += `• Reach out to contacts with recent activity\n`;

      return response;

    } catch (error) {
      return `I encountered an issue retrieving your contacts: ${error.message}. Please check your GoHighLevel connection.`;
    }
  }

  parseContactQuery(message) {
    const msg = message.toLowerCase();
    const params = { limit: 20 };

    // Date filters
    if (msg.includes('today')) {
      const today = new Date().toISOString().split('T')[0];
      params.startDate = today;
    } else if (msg.includes('week')) {
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      params.startDate = weekAgo;
    } else if (msg.includes('month')) {
      const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      params.startDate = monthAgo;
    }

    // Tag filters
    if (msg.includes('ancient city con')) {
      params.tags = ['ancient city con'];
    }

    return params;
  }

  analyzeContacts(contacts) {
    const analysis = {
      hotLeads: 0,
      eventContacts: 0,
      missingInfo: 0,
      untagged: 0,
      eventBreakdown: {}
    };

    contacts.forEach(contact => {
      // Check for hot leads (recent activity)
      if (contact.lastActivity) {
        const daysSinceActivity = (Date.now() - contact.lastActivity) / (1000 * 60 * 60 * 24);
        if (daysSinceActivity < 7) analysis.hotLeads++;
      }

      // Check for missing information
      if (!contact.phone || !contact.email) {
        analysis.missingInfo++;
      }

      // Check for tags
      if (!contact.tags || contact.tags.length === 0) {
        analysis.untagged++;
      } else {
        // Count event tags
        contact.tags.forEach(tag => {
          if (tag.includes('con') || tag.includes('event') || tag.includes('city')) {
            analysis.eventContacts++;
            analysis.eventBreakdown[tag] = (analysis.eventBreakdown[tag] || 0) + 1;
          }
        });
      }
    });

    return analysis;
  }

  async handlePricingRequest(intent, message) {
    try {
      // Parse pricing request details
      const pricingDetails = this.parsePricingRequest(message);
      
      // Generate quote using pricing engine
      const quote = this.pricingEngine.generatePriceQuote(
        pricingDetails.orderDetails,
        pricingDetails.eventType,
        pricingDetails.customerInfo
      );

      let response = `💰 **Pricing Quote - ${quote.quoteId}**\n\n`;
      response += `**Service:** ${pricingDetails.description}\n`;
      response += `**Event Type:** ${pricingDetails.eventType.charAt(0).toUpperCase() + pricingDetails.eventType.slice(1)}\n\n`;

      response += `📋 **Quote Details:**\n`;
      quote.itemBreakdown.forEach(item => {
        response += `• ${item.description}: $${item.price.toFixed(2)}\n`;
      });

      response += `\n💵 **Total: $${quote.totalPrice.toFixed(2)}**\n`;
      
      if (quote.savings > 0) {
        response += `💾 **You Save: $${quote.savings.toFixed(2)}**\n`;
      }

      response += `\n📧 **Professional Email Template:**\n\n`;
      response += this.generateQuoteEmail(quote, pricingDetails);

      return response;

    } catch (error) {
      return `I had trouble generating that quote: ${error.message}. Could you provide more specific details about the order?`;
    }
  }

  parsePricingRequest(message) {
    const msg = message.toLowerCase();
    
    // Default pricing request
    let orderDetails = [
      { type: 'individual_figurine', quantity: 1, size: '4_inch' }
    ];
    let eventType = 'standard';
    let description = 'Individual Figurine';

    // Parse specific requests
    if (msg.includes('wedding')) {
      eventType = 'wedding';
      if (msg.includes('party')) {
        orderDetails = [
          { type: 'individual_figurine', quantity: 6, size: '4_inch' }
        ];
        description = 'Wedding Party Figurines (6 people)';
      } else {
        orderDetails = [
          { type: 'couples_figurine', quantity: 1, size: '4_inch' }
        ];
        description = 'Wedding Couple Figurine';
      }
    }

    if (msg.includes('pet')) {
      orderDetails = [
        { type: 'pet_figurine', quantity: 1, size: '4_inch' }
      ];
      description = 'Pet Figurine';
    }

    if (msg.includes('rush')) {
      eventType = 'rush';
    }

    // Parse quantities
    const quantityMatch = msg.match(/(\d+)/);
    if (quantityMatch) {
      const qty = parseInt(quantityMatch[1]);
      orderDetails[0].quantity = qty;
      description = description.replace(/\d+/, qty);
    }

    return {
      orderDetails,
      eventType,
      description,
      customerInfo: { type: 'quote_request' }
    };
  }

  generateQuoteEmail(quote, details) {
    return `Subject: 3D Figurine Quote - ${quote.quoteId}

Dear Valued Customer,

Thank you for your interest in Shrunk 3D Jacksonville! I'm excited to help bring your ${details.description.toLowerCase()} to life.

**Your Custom Quote:**
${quote.itemBreakdown.map(item => `• ${item.description}: $${item.price.toFixed(2)}`).join('\n')}

**Total Investment: $${quote.totalPrice.toFixed(2)}**

This quote includes our premium scanning process, high-quality 3D printing, and professional finishing. All figurines come with a satisfaction guarantee.

**What's Next?**
1. Reply to confirm your order
2. Schedule your scanning appointment (takes 15-20 minutes)
3. Receive your figurine in 7-10 business days

I'd love to discuss any questions you might have. Feel free to call me at [YOUR PHONE] or reply to this email.

Best regards,
Shrunk 3D Jacksonville Team

P.S. Follow us on social media for examples of our latest work!`;
  }

  async handleEmailTemplate(intent, message) {
    const templateType = this.parseTemplateRequest(message);
    
    const templates = {
      wedding_inquiry: this.getWeddingTemplate(),
      corporate_inquiry: this.getCorporateTemplate(),
      pet_inquiry: this.getPetTemplate(),
      event_follow_up: this.getEventFollowUpTemplate(),
      general_inquiry: this.getGeneralTemplate()
    };

    const template = templates[templateType] || templates.general_inquiry;
    
    let response = `📧 **Email Template: ${templateType.replace('_', ' ').toUpperCase()}**\n\n`;
    response += `**Subject Line:** ${template.subject}\n\n`;
    response += `**Email Body:**\n${template.body}\n\n`;
    response += `💡 **Usage Tips:**\n${template.tips}`;

    return response;
  }

  parseTemplateRequest(message) {
    const msg = message.toLowerCase();
    
    if (msg.includes('wedding')) return 'wedding_inquiry';
    if (msg.includes('corporate') || msg.includes('business')) return 'corporate_inquiry';
    if (msg.includes('pet') || msg.includes('dog') || msg.includes('cat')) return 'pet_inquiry';
    if (msg.includes('follow') || msg.includes('event')) return 'event_follow_up';
    
    return 'general_inquiry';
  }

  getWeddingTemplate() {
    return {
      subject: "Capture Your Special Day Forever - 3D Wedding Figurines",
      body: `Dear [BRIDE NAME] and [GROOM NAME],

Congratulations on your upcoming wedding! 

I'd love to help you create a magical keepsake of your special day with our 3D wedding figurines. Many couples tell us these become their most treasured wedding memento.

**What We Offer:**
• Bride & Groom figurine sets starting at $150
• Wedding party figurines (capture your whole crew!)
• Same-day scanning at your venue (Jacksonville area)
• Rush delivery available for tight timelines

We've worked with over 200+ couples in Jacksonville and would be honored to be part of your wedding story.

Would you like to schedule a quick 15-minute call to discuss your vision? I can also send you examples of recent wedding figurines we've created.

Congratulations again, and I hope to hear from you soon!

Best wishes,
[YOUR NAME]
Shrunk 3D Jacksonville`,
      tips: "• Personalize with their names and wedding date\n• Mention venue name if you know it\n• Include 2-3 photos of recent work\n• Offer flexible scheduling"
    };
  }

  getCorporateTemplate() {
    return {
      subject: "Unique Corporate Event Experience - 3D Figurine Booth",
      body: `Hello [CONTACT NAME],

I hope this message finds you well. I wanted to reach out regarding your upcoming corporate event.

At Shrunk 3D Jacksonville, we provide a unique entertainment experience that your employees and clients will remember long after the event ends - live 3D figurine scanning and printing.

**Corporate Event Benefits:**
• Unique networking icebreaker
• Memorable branded giveaways
• Professional team-building activity  
• Custom corporate packaging available
• Full-service booth setup included

We've successfully worked with companies like [LOCAL COMPANIES] for events ranging from 50-500 attendees.

I'd love to discuss how we can make your event unforgettable. Are you available for a brief call this week?

Best regards,
[YOUR NAME]
Shrunk 3D Jacksonville`,
      tips: "• Research the company beforehand\n• Mention specific event types they might host\n• Include ROI benefits (team building, engagement)\n• Offer case studies from similar companies"
    };
  }

  getPetTemplate() {
    return {
      subject: "Immortalize Your Furry Family Member - 3D Pet Figurines",
      body: `Hi [PET OWNER NAME],

I noticed you might be interested in our 3D pet figurine services, and I wanted to personally reach out.

As a fellow pet lover in Jacksonville, I understand how much our furry family members mean to us. That's why I started offering 3D pet figurines - to help pet parents preserve those precious memories forever.

**What Makes Our Pet Figurines Special:**
• Captured every detail - from whiskers to paw prints
• Safe, stress-free scanning process (pets love it!)
• Multiple size options to fit any space
• Perfect memorial pieces or celebration gifts

Many pet owners tell us these figurines become their most treasured possessions. 

Would you like to see some examples of recent pet figurines I've created? I'm happy to answer any questions about the process.

Looking forward to meeting you and your furry friend!

Warm regards,
[YOUR NAME]
Shrunk 3D Jacksonville`,
      tips: "• Ask about pet's name and breed\n• Mention it's pet-friendly process\n• Show examples of similar pets\n• Offer flexible scheduling for pet comfort"
    };
  }

  getEventFollowUpTemplate() {
    return {
      subject: "Great Meeting You at [EVENT NAME] - Your 3D Figurine Quote",
      body: `Hi [CONTACT NAME],

It was wonderful meeting you at [EVENT NAME] yesterday! I really enjoyed our conversation about [SPECIFIC DETAIL THEY MENTIONED].

As promised, I'm following up with information about our 3D figurine services. Based on what you shared, I think you'd love [SPECIFIC SERVICE THEY WERE INTERESTED IN].

**Your Personalized Options:**
• [SERVICE 1]: Starting at $[PRICE]
• [SERVICE 2]: Starting at $[PRICE]
• Rush options available if needed

I've attached a few examples of recent work that might inspire you.

Since we met at the event, I'd be happy to offer you a [DISCOUNT/SPECIAL OFFER] if you'd like to move forward in the next two weeks.

Feel free to reply with any questions, or we can schedule a quick call at your convenience.

Thanks again for stopping by our booth!

Best,
[YOUR NAME]
Shrunk 3D Jacksonville`,
      tips: "• Reference specific conversation details\n• Include photos from the actual event\n• Offer event-specific discount\n• Set clear next steps and timeline"
    };
  }

  getGeneralTemplate() {
    return {
      subject: "Thank You for Your 3D Figurine Inquiry",
      body: `Hello [CONTACT NAME],

Thank you for reaching out about our 3D figurine services! I'm excited to help bring your vision to life.

At Shrunk 3D Jacksonville, we specialize in creating high-quality, detailed figurines that capture life's most important moments. Whether it's for a special occasion, business promotion, or just because - we've got you covered.

**Our Popular Services:**
• Individual & couple figurines
• Pet figurines  
• Wedding keepsakes
• Corporate events & trade shows
• Custom projects

The process is simple: we scan, we print, you smile! Most figurines are ready in 7-10 business days.

I'd love to learn more about what you have in mind. Could you tell me a bit about your project? That will help me provide the most accurate information and pricing.

Looking forward to creating something amazing together!

Best regards,
[YOUR NAME]
Shrunk 3D Jacksonville`,
      tips: "• Ask qualifying questions about their project\n• Provide clear next steps\n• Include your best work examples\n• Set expectations for response time"
    };
  }

  async handleBusinessAnalysis(intent, message) {
    try {
      const ghlClient = new GoHighLevelClient();
      const contacts = await ghlClient.getContacts({ limit: 100 });

      const analysis = this.performBusinessAnalysis(contacts.contacts || []);
      
      let response = `📊 **BUSINESS INTELLIGENCE REPORT**\n\n`;
      
      response += `🎯 **LEAD QUALITY ANALYSIS**\n`;
      response += `• Hot Leads: ${analysis.hotLeads} (${analysis.hotLeadPercentage}%)\n`;
      response += `• Cold Leads: ${analysis.coldLeads}\n`;
      response += `• Follow-up Needed: ${analysis.followUpNeeded}\n\n`;

      response += `🏷️ **TAGGING INSIGHTS**\n`;
      Object.entries(analysis.tagAnalysis).slice(0, 5).forEach(([tag, count]) => {
        response += `• ${tag}: ${count} contacts\n`;
      });
      response += `• Untagged contacts: ${analysis.untaggedContacts}\n\n`;

      response += `📈 **CONVERSION OPPORTUNITIES**\n`;
      response += `• Recent signups (7 days): ${analysis.recentSignups}\n`;
      response += `• Active prospects: ${analysis.activeProspects}\n`;
      response += `• Revenue potential: $${analysis.revenuePotential.toFixed(2)}\n\n`;

      response += `💡 **RECOMMENDED ACTIONS**\n`;
      analysis.recommendations.forEach((rec, i) => {
        response += `${i + 1}. ${rec}\n`;
      });

      return response;

    } catch (error) {
      return `I had trouble analyzing your business data: ${error.message}`;
    }
  }

  performBusinessAnalysis(contacts) {
    const analysis = {
      hotLeads: 0,
      coldLeads: 0,
      followUpNeeded: 0,
      tagAnalysis: {},
      untaggedContacts: 0,
      recentSignups: 0,
      activeProspects: 0,
      revenuePotential: 0,
      recommendations: []
    };

    const now = Date.now();
    const weekAgo = now - (7 * 24 * 60 * 60 * 1000);
    const monthAgo = now - (30 * 24 * 60 * 60 * 1000);

    contacts.forEach(contact => {
      // Activity analysis
      if (contact.lastActivity && contact.lastActivity > weekAgo) {
        analysis.hotLeads++;
        analysis.revenuePotential += 150; // Avg order value
      } else if (contact.lastActivity && contact.lastActivity < monthAgo) {
        analysis.coldLeads++;
        analysis.followUpNeeded++;
      }

      // Tag analysis
      if (contact.tags && contact.tags.length > 0) {
        contact.tags.forEach(tag => {
          analysis.tagAnalysis[tag] = (analysis.tagAnalysis[tag] || 0) + 1;
        });
      } else {
        analysis.untaggedContacts++;
      }

      // Signup analysis
      if (new Date(contact.dateAdded).getTime() > weekAgo) {
        analysis.recentSignups++;
      }

      // Prospect scoring
      if (contact.email && contact.phone) {
        analysis.activeProspects++;
      }
    });

    analysis.hotLeadPercentage = ((analysis.hotLeads / contacts.length) * 100).toFixed(1);

    // Generate recommendations
    if (analysis.untaggedContacts > 5) {
      analysis.recommendations.push("Tag unorganized contacts for better segmentation");
    }
    if (analysis.followUpNeeded > 0) {
      analysis.recommendations.push(`Follow up with ${analysis.followUpNeeded} inactive contacts`);
    }
    if (analysis.hotLeads > 0) {
      analysis.recommendations.push(`Prioritize immediate outreach to ${analysis.hotLeads} hot leads`);
    }
    if (analysis.recentSignups > 0) {
      analysis.recommendations.push(`Send welcome sequences to ${analysis.recentSignups} new contacts`);
    }

    return analysis;
  }

  async handleEventOpportunities(intent, message) {
    // This would integrate with Jacksonville events calendar
    const upcomingEvents = this.getJacksonvilleEvents();
    
    let response = `🎪 **JACKSONVILLE EVENT OPPORTUNITIES**\n\n`;
    
    upcomingEvents.forEach((event, i) => {
      response += `${i + 1}. **${event.name}**\n`;
      response += `   📅 ${event.date}\n`;
      response += `   📍 ${event.venue}\n`;
      response += `   🎯 Target: ${event.target}\n`;
      response += `   💰 Potential: $${event.potential}\n\n`;
    });

    response += `💡 **OUTREACH STRATEGY**\n`;
    response += `• Contact past event attendees 2 weeks before events\n`;
    response += `• Offer early-bird pricing for event bookings\n`;
    response += `• Create event-specific marketing materials\n`;
    response += `• Partner with event organizers for booth space\n`;

    return response;
  }

  getJacksonvilleEvents() {
    // This would be dynamically loaded from an events API
    return [
      {
        name: "Jacksonville Art Walk",
        date: "First Wednesday Monthly",
        venue: "Downtown Jacksonville",
        target: "Art enthusiasts, tourists",
        potential: "500"
      },
      {
        name: "Jaguars Home Games", 
        date: "NFL Season",
        venue: "TIAA Bank Field",
        target: "Sports fans, families",
        potential: "800"
      },
      {
        name: "Gate River Run",
        date: "March (Annual)",
        venue: "Downtown to Beach",
        target: "Runners, fitness enthusiasts",
        potential: "600"
      }
    ];
  }

  async handleFollowUpCreation(intent, message) {
    const followUpType = this.parseFollowUpRequest(message);
    const sequence = this.createFollowUpSequence(followUpType);
    
    let response = `📧 **${followUpType.toUpperCase()} FOLLOW-UP SEQUENCE**\n\n`;
    
    sequence.forEach((email, i) => {
      response += `**Email ${i + 1}: ${email.timing}**\n`;
      response += `Subject: ${email.subject}\n`;
      response += `${email.preview}...\n\n`;
    });

    response += `🔄 **Implementation Tips:**\n`;
    response += `• Set up as automated sequence in GoHighLevel\n`;
    response += `• Track open rates and adjust timing\n`;
    response += `• Personalize based on contact source\n`;
    response += `• Include clear call-to-actions in each email\n`;

    return response;
  }

  parseFollowUpRequest(message) {
    const msg = message.toLowerCase();
    
    if (msg.includes('ancient city') || msg.includes('con')) return 'convention';
    if (msg.includes('wedding')) return 'wedding';
    if (msg.includes('corporate')) return 'corporate';
    if (msg.includes('pet')) return 'pet';
    
    return 'general';
  }

  createFollowUpSequence(type) {
    const sequences = {
      convention: [
        {
          timing: "Day 1 - Thank You",
          subject: "Thanks for stopping by our booth at Ancient City Con!",
          preview: "It was great meeting you at the convention. Here's the info you requested about our 3D figurine services..."
        },
        {
          timing: "Day 4 - Social Proof",
          subject: "See what other con-goers are saying about their figurines",
          preview: "Check out these amazing figurines we created for other Ancient City Con attendees..."
        },
        {
          timing: "Day 7 - Limited Offer",
          subject: "Special con pricing expires soon - 20% off",
          preview: "As promised at the convention, here's your exclusive discount. Valid for 7 more days..."
        }
      ],
      wedding: [
        {
          timing: "Day 1 - Welcome",
          subject: "Congratulations on your engagement!",
          preview: "Thank you for considering Shrunk 3D for your wedding keepsakes. Here's everything you need to know..."
        },
        {
          timing: "Day 5 - Examples",
          subject: "Real wedding figurines from Jacksonville couples",
          preview: "See how other couples have used our figurines in their weddings..."
        },
        {
          timing: "Day 10 - Timeline",
          subject: "Planning your wedding timeline? Don't forget this!",
          preview: "Most couples book their figurine session 2-3 months before the wedding..."
        }
      ]
    };

    return sequences[type] || sequences.general;
  }

  async handleGeneralQuery(message, conversationHistory) {
    // For general queries, provide contextual business assistance
    const msg = message.toLowerCase();
    
    if (msg.includes('help') || msg.includes('what can you')) {
      return this.getHelpMessage();
    }

    // Default contextual response based on business knowledge
    return `I understand you're asking about "${message}". 

As your AI business assistant for Shrunk 3D Jacksonville, I can help you with:

🔹 **Contact Management** - Analyze your GoHighLevel contacts, identify hot leads, and suggest follow-ups
🔹 **Pricing & Quotes** - Generate professional quotes for any service (figurines, events, etc.)
🔹 **Email Templates** - Create personalized responses for different types of inquiries  
🔹 **Business Analysis** - Review your contact data and suggest improvements
🔹 **Event Opportunities** - Identify upcoming Jacksonville events and outreach strategies
🔹 **Follow-up Campaigns** - Design automated sequences for different contact types

Could you be more specific about what you'd like help with? For example:
• "Show me my contacts from this week"
• "Create a quote for wedding figurines"
• "Write an email template for corporate events"
• "Analyze my Ancient City Con contacts"`;
  }

  getHelpMessage() {
    return `🤖 **How I Can Help Your Shrunk 3D Business**

I'm your AI assistant specifically trained on your 3D figurine business in Jacksonville. Here's what I can do:

**📊 Contact & Lead Management**
• Analyze your GoHighLevel contacts
• Identify hot leads and follow-up opportunities  
• Suggest contact organization and tagging
• Track conversion opportunities

**💰 Pricing & Sales**
• Generate quotes for any service
• Create professional proposal emails
• Suggest pricing strategies for events
• Calculate revenue potential

**📧 Communication**
• Write custom email templates
• Create follow-up sequences
• Draft responses to inquiries
• Design marketing messages

**🎯 Business Strategy**
• Analyze contact data for insights
• Identify Jacksonville event opportunities
• Suggest improvement strategies
• Track business metrics

**Examples of what you can ask:**
• "Show me contacts from Ancient City Con"
• "Create a quote for 10 wedding figurines"
• "Write a follow-up email for pet owners"
• "What events should I target this month?"

Just ask me anything in plain English - I understand your business!`;
  }
}

module.exports = AIAssistant;