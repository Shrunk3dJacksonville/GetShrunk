const fs = require('fs-extra');
const path = require('path');

class AIContentGenerator {
  constructor() {
    this.baseDir = process.cwd();
    this.shrunkContext = this.loadShrunkContext();
    
    // In a production environment, you would set up actual AI service credentials
    // For now, we'll create a sophisticated template-based system that mimics AI behavior
    this.creativityPatterns = this.loadCreativityPatterns();
  }

  loadShrunkContext() {
    return {
      businessName: "Shrunk 3D",
      tagline: "Your Memories Captured in 3D",
      technology: {
        scanningProcess: "180-image photogrammetric capture",
        printing: "Ultra-premium nylon 3D printing",
        turnaround: "3-5 week professional production timeline",
        pricing: "$30 design fee per person"
      },
      businessModel: {
        type: "Mobile photobooth service",
        deployment: "Professional mobile booth setup",
        reach: "Nationwide franchise network",
        setup: "Cutting-edge photogrammetric technology"
      },
      targetEvents: [
        "weddings", "birthdays", "corporate events", "graduations", 
        "anniversaries", "baby showers", "retirement parties", 
        "sports events", "festivals", "holiday celebrations"
      ]
    };
  }

  loadCreativityPatterns() {
    return {
      hooks: {
        question: ["What if", "Have you ever", "Imagine if", "What would happen if"],
        statement: ["Breaking:", "Plot twist:", "Fun fact:", "Reality check:"],
        emotional: ["That moment when", "The feeling of", "Nothing beats", "You know that feeling"],
        trending: ["POV:", "Tell me why", "It's giving", "Main character energy"]
      },
      emotions: {
        excitement: ["amazing", "incredible", "mind-blowing", "game-changing", "revolutionary"],
        nostalgia: ["memories", "moments", "timeless", "forever", "keepsakes"],
        luxury: ["premium", "exclusive", "professional", "elite", "sophisticated"],
        innovation: ["cutting-edge", "advanced", "breakthrough", "next-level", "futuristic"]
      },
      callToActions: {
        booking: ["Book now", "Reserve your date", "Get started today", "Schedule your session"],
        engagement: ["Tell us below", "Share your story", "Tag someone who", "What would you choose"],
        urgency: ["Limited availability", "Don't miss out", "Book before it's gone", "Act fast"]
      }
    };
  }

  async generateIntelligentContent(platform, topic, context, tone = 'professional') {
    try {
      // Validate inputs
      if (!platform || !topic) {
        throw new Error('Platform and topic are required');
      }
      
      // Ensure all inputs are strings
      const cleanPlatform = String(platform);
      const cleanTopic = String(topic);
      const cleanContext = String(context || '');
      const cleanTone = String(tone || 'professional');
      
      console.log('Generating content for:', { platform: cleanPlatform, topic: cleanTopic, tone: cleanTone });
      
      // Create a sophisticated prompt for content generation
      const contentStrategy = this.analyzeContentNeeds(cleanPlatform, cleanTopic, cleanContext, cleanTone);
      
      // Generate content using advanced pattern matching and context awareness
      const generatedContent = await this.createContextualContent(contentStrategy);
      
      return generatedContent;
      
    } catch (error) {
      console.error('AI Content Generation Error:', error);
      throw new Error('Failed to generate intelligent content: ' + error.message);
    }
  }

  analyzeContentNeeds(platform, topic, context, tone) {
    const platformSpecs = this.getPlatformSpecifications(platform);
    const topicAnalysis = this.analyzeTopicContext(topic, context);
    const toneProfile = this.getToneProfile(tone);
    
    return {
      platform: platformSpecs,
      topic: topicAnalysis,
      tone: toneProfile,
      businessContext: this.shrunkContext,
      creativity: this.selectCreativityElements(platform, topic, tone),
      originalTopic: topic
    };
  }

  getPlatformSpecifications(platform) {
    const specs = {
      instagram: {
        maxLength: 2200,
        style: 'visual-story',
        features: ['hashtags', 'emojis', 'line-breaks', 'call-to-action'],
        audience: 'visual-focused, lifestyle-oriented',
        tone: 'authentic, inspiring, community-driven'
      },
      tiktok: {
        maxLength: 300,
        style: 'hook-driven',
        features: ['trending-language', 'hooks', 'rapid-engagement'],
        audience: 'young, trend-aware, entertainment-seeking',
        tone: 'energetic, relatable, trend-conscious'
      },
      facebook: {
        maxLength: 500,
        style: 'conversation-starter',
        features: ['community-engagement', 'storytelling', 'sharing-friendly'],
        audience: 'diverse, community-oriented, family-focused',
        tone: 'warm, inclusive, conversational'
      },
      linkedin: {
        maxLength: 1300,
        style: 'professional-insight',
        features: ['business-value', 'professional-tone', 'industry-focus'],
        audience: 'business professionals, decision-makers',
        tone: 'professional, authoritative, value-driven'
      },
      twitter: {
        maxLength: 280,
        style: 'concise-impact',
        features: ['brevity', 'trending-topics', 'engagement'],
        audience: 'news-aware, fast-paced, opinion-leaders',
        tone: 'witty, direct, topical'
      },
      youtube: {
        maxLength: 5000,
        style: 'detailed-description',
        features: ['seo-optimized', 'detailed-explanation', 'value-proposition'],
        audience: 'content-consumers, learners, researchers',
        tone: 'informative, engaging, comprehensive'
      },
      snapchat: {
        maxLength: 250,
        style: 'authentic-moment',
        features: ['casual-tone', 'moment-focused', 'authentic'],
        audience: 'young, spontaneous, moment-sharing',
        tone: 'casual, fun, authentic'
      }
    };
    
    return specs[platform] || specs.instagram;
  }

  analyzeTopicContext(topic, context) {
    // Ensure topic is a string
    if (!topic) {
      throw new Error('Topic is required for analysis');
    }
    
    const topicLower = String(topic).toLowerCase();
    const contextLower = String(context || '').toLowerCase();
    
    // Sophisticated topic analysis
    const analysis = {
      category: this.categorizeTopic(topicLower),
      emotions: this.identifyEmotions(topicLower, contextLower),
      audience: this.identifyTargetAudience(topicLower, contextLower),
      occasion: this.classifyOccasion(topicLower),
      urgency: this.assessUrgency(contextLower),
      uniqueElements: this.extractUniqueElements(topicLower, contextLower)
    };
    
    return analysis;
  }

  categorizeTopic(topic) {
    const categories = {
      celebration: ['birthday', 'anniversary', 'graduation', 'wedding', 'party', 'celebration'],
      professional: ['corporate', 'business', 'conference', 'meeting', 'team building', 'networking'],
      milestone: ['graduation', 'retirement', 'promotion', 'achievement', 'milestone'],
      family: ['baby shower', 'family reunion', 'holiday', 'thanksgiving', 'christmas'],
      sports: ['game', 'tournament', 'sports', 'competition', 'championship'],
      cultural: ['festival', 'art', 'music', 'cultural', 'community', 'charity']
    };
    
    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(keyword => topic.includes(keyword))) {
        return category;
      }
    }
    
    return 'general';
  }

  identifyEmotions(topic, context) {
    const emotionMap = {
      joy: ['birthday', 'celebration', 'wedding', 'graduation', 'happy', 'fun', 'party'],
      pride: ['graduation', 'achievement', 'promotion', 'success', 'accomplishment'],
      nostalgia: ['anniversary', 'reunion', 'memory', 'remember', 'throwback'],
      excitement: ['new', 'first', 'launch', 'reveal', 'surprise'],
      professional: ['corporate', 'business', 'professional', 'meeting', 'conference']
    };
    
    const detectedEmotions = [];
    const fullText = topic + ' ' + context;
    
    for (const [emotion, keywords] of Object.entries(emotionMap)) {
      if (keywords.some(keyword => fullText.includes(keyword))) {
        detectedEmotions.push(emotion);
      }
    }
    
    return detectedEmotions.length > 0 ? detectedEmotions : ['neutral'];
  }

  identifyTargetAudience(topic, context) {
    if (topic.includes('corporate') || topic.includes('business')) return 'business-professionals';
    if (topic.includes('wedding') || topic.includes('anniversary')) return 'couples-families';
    if (topic.includes('birthday') || topic.includes('party')) return 'celebration-focused';
    if (topic.includes('graduation') || topic.includes('school')) return 'students-families';
    return 'general-audience';
  }

  classifyOccasion(topic) {
    if (topic.includes('birthday')) return 'personal-celebration';
    if (topic.includes('wedding')) return 'major-life-event';
    if (topic.includes('corporate')) return 'business-event';
    if (topic.includes('graduation')) return 'achievement-milestone';
    return 'special-occasion';
  }

  assessUrgency(context) {
    const urgencyKeywords = ['urgent', 'asap', 'soon', 'limited time', 'deadline', 'quick'];
    return urgencyKeywords.some(keyword => context.includes(keyword)) ? 'high' : 'normal';
  }

  extractUniqueElements(topic, context) {
    const elements = [];
    const combined = topic + ' ' + context;
    
    // Extract specific details
    if (combined.includes('outdoor')) elements.push('outdoor-setting');
    if (combined.includes('indoor')) elements.push('indoor-setting');
    if (combined.includes('evening')) elements.push('evening-event');
    if (combined.includes('formal')) elements.push('formal-attire');
    if (combined.includes('casual')) elements.push('casual-atmosphere');
    if (combined.includes('large') || combined.includes('big')) elements.push('large-group');
    if (combined.includes('intimate') || combined.includes('small')) elements.push('intimate-setting');
    
    return elements;
  }

  getToneProfile(tone) {
    const profiles = {
      professional: {
        vocabulary: 'formal',
        structure: 'organized',
        emotion: 'confident',
        approach: 'value-focused'
      },
      casual: {
        vocabulary: 'conversational',
        structure: 'relaxed',
        emotion: 'friendly',
        approach: 'relatable'
      },
      exciting: {
        vocabulary: 'energetic',
        structure: 'dynamic',
        emotion: 'enthusiastic',
        approach: 'engaging'
      },
      elegant: {
        vocabulary: 'sophisticated',
        structure: 'refined',
        emotion: 'graceful',
        approach: 'aspirational'
      }
    };
    
    return profiles[tone] || profiles.professional;
  }

  selectCreativityElements(platform, topic, tone) {
    const patterns = this.creativityPatterns;
    
    // Intelligently select creativity elements based on context
    let selectedHook = '';
    let selectedEmotions = [];
    let selectedCTA = '';
    
    // Select appropriate hook based on platform and topic
    if (platform === 'tiktok') {
      selectedHook = this.randomSelect(patterns.hooks.trending);
    } else if (platform === 'linkedin') {
      selectedHook = this.randomSelect(patterns.hooks.statement);
    } else {
      selectedHook = this.randomSelect([
        ...patterns.hooks.question,
        ...patterns.hooks.emotional
      ]);
    }
    
    // Select emotions based on topic analysis
    if (topic.includes('wedding') || topic.includes('anniversary')) {
      selectedEmotions = patterns.emotions.nostalgia;
    } else if (topic.includes('corporate') || topic.includes('business')) {
      selectedEmotions = patterns.emotions.luxury;
    } else {
      selectedEmotions = patterns.emotions.excitement;
    }
    
    // Select CTA based on platform
    if (platform === 'instagram' || platform === 'facebook') {
      selectedCTA = this.randomSelect(patterns.callToActions.engagement);
    } else {
      selectedCTA = this.randomSelect(patterns.callToActions.booking);
    }
    
    return {
      hook: selectedHook,
      emotions: selectedEmotions,
      cta: selectedCTA
    };
  }

  async createContextualContent(strategy) {
    const { platform, topic, tone, businessContext, creativity } = strategy;
    
    // Generate intelligent, contextual content
    const content = this.assembleIntelligentContent(
      platform,
      topic,
      businessContext,
      creativity,
      strategy.originalTopic || 'event' // fallback
    );
    
    return content;
  }

  assembleIntelligentContent(platformSpecs, topicAnalysis, businessContext, creativity, originalTopic) {
    const { category, emotions, audience, occasion, uniqueElements } = topicAnalysis;
    const { technology, businessModel } = businessContext;
    
    const platformName = platformSpecs.platform || 'instagram';
    
    // Create dynamic opening based on platform and context
    let opening = this.generateContextualOpening(platformName, category, creativity, emotions[0]);
    
    // Create main content based on topic analysis
    let mainContent = this.generateMainContent(
      topicAnalysis, 
      technology, 
      businessModel, 
      platformSpecs,
      audience
    );
    
    // Add platform-specific features
    let features = this.generateFeaturesList(technology, businessModel, platformSpecs.style);
    
    // Create closing with appropriate CTA
    let closing = this.generateClosingCTA(platformName, creativity.cta, occasion);
    
    // Add hashtags intelligently
    let hashtags = this.generateIntelligentHashtags(platformName, category, originalTopic);
    
    // Assemble final content with proper formatting
    const finalContent = this.formatForPlatform(
      platformName,
      opening,
      mainContent,
      features,
      closing,
      hashtags,
      platformSpecs.maxLength
    );
    
    return finalContent;
  }

  generateContextualOpening(platform, category, creativity, primaryEmotion) {
    const { hook, emotions } = creativity;
    const emotionWord = this.randomSelect(emotions);
    
    const openings = {
      celebration: [
        `${hook} your celebration became ${emotionWord}? ✨`,
        `🎉 This ${emotionWord} moment deserves something special!`,
        `When memories get the ${emotionWord} treatment they deserve! 🌟`
      ],
      professional: [
        `${hook} professional events get a ${emotionWord} upgrade 💼`,
        `🚀 Transforming corporate experiences with ${emotionWord} innovation`,
        `Business events just got ${emotionWord}! 📈`
      ],
      milestone: [
        `${hook} milestone moments become ${emotionWord}? 🎯`,
        `This ${emotionWord} achievement calls for something extraordinary! 🏆`,
        `Celebrating life's ${emotionWord} moments in a whole new dimension! ⭐`
      ],
      family: [
        `${hook} family moments get the ${emotionWord} treatment! 👨‍👩‍👧‍👦`,
        `Creating ${emotionWord} family memories that last forever! 💕`,
        `When family gatherings become ${emotionWord}! 🏠`
      ]
    };
    
    const categoryOpenings = openings[category] || openings.celebration;
    return this.randomSelect(categoryOpenings);
  }

  generateMainContent(topicAnalysis, technology, businessModel, platformSpecs, audience) {
    const { category, occasion, uniqueElements } = topicAnalysis;
    
    // Tailor content based on audience and platform style
    let content = '';
    
    if (platformSpecs.style === 'professional-insight') {
      content = `Our ${businessModel.deployment} leverages ${technology.scanningProcess} to capture comprehensive event moments. `;
      content += `The ${technology.printing} process ensures premium-quality results with our ${technology.turnaround}.`;
    } else if (platformSpecs.style === 'hook-driven') {
      content = `📸 ${technology.scanningProcess}\n🎪 ${businessModel.deployment}\n🎨 ${technology.printing}\n📦 ${technology.turnaround}`;
    } else {
      content = `Our ${businessModel.type} brings ${businessModel.setup} directly to your ${occasion}! `;
      content += `With ${technology.scanningProcess}, we capture every detail for ${technology.printing}. `;
      
      // Add unique elements if present
      if (uniqueElements.length > 0) {
        content += `Perfect for ${uniqueElements.join(' and ')} events! `;
      }
    }
    
    return content;
  }

  generateFeaturesList(technology, businessModel, style) {
    const features = [
      `📸 ${technology.scanningProcess}`,
      `🎪 ${businessModel.deployment}`,
      `🎨 ${technology.printing}`,
      `💰 ${technology.pricing}`,
      `📦 ${technology.turnaround}`
    ];
    
    if (style === 'professional-insight') {
      return `\\n\\nKey service features:\\n• Professional-grade photogrammetric scanning\\n• ${businessModel.deployment}\\n• ${technology.turnaround}\\n• Competitive ${technology.pricing}`;
    } else if (style === 'hook-driven') {
      return `\\n\\n${features.join('\\n')}`;
    } else {
      return `\\n\\n${features.join('\\n')}`;
    }
  }

  generateClosingCTA(platform, ctaType, occasion) {
    const businessCTA = "📞 Book your experience: Shrunk3d.com";
    
    const platformCTAs = {
      instagram: `Ready to make your ${occasion} unforgettable? ${businessCTA}`,
      tiktok: `Your ${occasion} deserves this upgrade! ${businessCTA}`,
      facebook: `Transform your ${occasion} with 3D memories! ${businessCTA}`,
      linkedin: `Elevate your professional events with innovative technology. ${businessCTA}`,
      twitter: `${occasion} + 3D tech = Unforgettable! ${businessCTA}`,
      youtube: `Don't miss the opportunity to revolutionize your ${occasion}. ${businessCTA}`,
      snapchat: `Make your ${occasion} legendary! ${businessCTA}`
    };
    
    return platformCTAs[platform] || platformCTAs.instagram;
  }

  generateIntelligentHashtags(platform, category, topic) {
    const coreHashtags = ['#Shrunk3D', '#3DPhotography', '#Photogrammetry', '#EventTech'];
    
    const categoryHashtags = {
      celebration: ['#CelebrationMemories', '#PartyTech', '#SpecialMoments'],
      professional: ['#CorporateEvents', '#BusinessInnovation', '#ProfessionalServices'],
      milestone: ['#MilestoneMemories', '#AchievementCapture', '#LifeEvents'],
      family: ['#FamilyMemories', '#FamilyTech', '#FamilyEvents'],
      sports: ['#SportsMemories', '#GameDay', '#SportsEvents'],
      cultural: ['#CulturalEvents', '#CommunityMemories', '#FestivalTech']
    };
    
    const topicSpecific = this.generateTopicHashtags(topic);
    
    const allHashtags = [
      ...coreHashtags,
      ...(categoryHashtags[category] || categoryHashtags.celebration),
      ...topicSpecific
    ];
    
    // Limit hashtags based on platform
    const limits = {
      instagram: 30,
      tiktok: 10,
      facebook: 5,
      linkedin: 5,
      twitter: 3,
      youtube: 15,
      snapchat: 5
    };
    
    const limit = limits[platform] || 10;
    return allHashtags.slice(0, limit).join(' ');
  }

  generateTopicHashtags(topic) {
    if (!topic) {
      return [];
    }
    
    const topicLower = String(topic).toLowerCase();
    const hashtags = [];
    
    if (topicLower.includes('birthday')) hashtags.push('#BirthdayMemories', '#BirthdayParty');
    if (topicLower.includes('wedding')) hashtags.push('#WeddingMemories', '#WeddingTech');
    if (topicLower.includes('graduation')) hashtags.push('#GraduationMemories', '#GradParty');
    if (topicLower.includes('corporate')) hashtags.push('#CorporateEvents', '#TeamBuilding');
    if (topicLower.includes('anniversary')) hashtags.push('#AnniversaryMemories', '#LoveStory');
    
    return hashtags;
  }

  formatForPlatform(platform, opening, main, features, closing, hashtags, maxLength) {
    let content = `${opening}\n\n${main}${features}\n\n${closing}\n\n${hashtags}`;
    
    // Platform-specific formatting
    if (platform === 'tiktok') {
      // More concise for TikTok
      content = `${opening}\n${main}\n\n${closing}\n\n${hashtags}`;
    } else if (platform === 'linkedin') {
      // More professional structure
      content = `${opening}\n\n${main}${features}\n\n${closing}\n\n${hashtags}`;
    }
    
    // Trim if too long
    if (content.length > maxLength) {
      const trimmed = content.substring(0, maxLength - 3) + '...';
      content = trimmed;
    }
    
    return content;
  }

  randomSelect(array) {
    return array[Math.floor(Math.random() * array.length)];
  }
}

module.exports = AIContentGenerator;