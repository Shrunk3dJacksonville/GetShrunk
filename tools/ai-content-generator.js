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
    // Check for specific combinations first, then individual keywords
    if (topic.includes('birthday') || topic.includes('bday')) return 'celebration';
    if (topic.includes('wedding') || topic.includes('bride') || topic.includes('groom')) return 'wedding';
    if (topic.includes('graduation') || topic.includes('retirement')) return 'milestone';
    if (topic.includes('corporate') || topic.includes('business')) return 'professional';
    if (topic.includes('baby shower') || topic.includes('family')) return 'family';
    if (topic.includes('sports') || topic.includes('game') || topic.includes('tournament')) return 'sports';
    if (topic.includes('festival') || topic.includes('art show') || topic.includes('cultural')) return 'cultural';
    
    // Fallback to keyword matching for edge cases
    const categories = {
      wedding: ['marriage', 'ceremony', 'reception'],
      milestone: ['promotion', 'achievement', 'milestone', 'accomplishment'],
      professional: ['conference', 'meeting', 'team building', 'networking', 'company'],
      family: ['holiday', 'thanksgiving', 'christmas', 'newborn'],
      sports: ['competition', 'championship', 'athletic', 'team'],
      cultural: ['music', 'community', 'charity', 'exhibit', 'museum'],
      celebration: ['anniversary', 'party', 'celebration'] // Very general terms last
    };
    
    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(keyword => topic.includes(keyword))) {
        console.log(`Topic "${topic}" categorized as: ${category}`);
        return category;
      }
    }
    
    return 'celebration'; // Default to celebration instead of general
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
    
    // Create highly specific openings for each category with multiple variations
    const openings = {
      wedding: [
        `💍 Your "I Do" moment deserves ${emotionWord} perfection!`,
        `From this day forward, ${emotionWord} memories! 👰🤵`,
        `${hook} weddings could be this ${emotionWord}? 💒`,
        `Love story meets ${emotionWord} technology! 💕`,
        `Two hearts, one ${emotionWord} celebration! 💖`,
        `Wedding day magic becomes ${emotionWord} memories! ✨`
      ],
      
      celebration: [
        `🎉 Birthday magic is about to get ${emotionWord}!`,
        `Another year older, infinitely more ${emotionWord}! 🎂`,
        `This birthday celebration deserves ${emotionWord} memories! 🎁`,
        `${hook} birthdays could be this ${emotionWord}? ✨`,
        `Party time just got a ${emotionWord} upgrade! 🎉`,
        `Blow out the candles and capture ${emotionWord} moments! 🕯️`
      ],
      professional: [
        `💼 Corporate events that are actually ${emotionWord}!`,
        `Business meetings just became ${emotionWord}! 🚀`,
        `${hook} professional networking could be this ${emotionWord}?`,
        `Transform your corporate culture with ${emotionWord} innovation! 📈`,
        `Executive decisions: Make your next event ${emotionWord}! 🎯`,
        `Professional excellence meets ${emotionWord} technology! 🏆`
      ],
      milestone: [
        `🎓 Graduation day gets the ${emotionWord} treatment!`,
        `Achievement unlocked: ${emotionWord} memories! 🏆`,
        `${hook} milestones could be this ${emotionWord}?`,
        `Success never looked so ${emotionWord}! ⭐`,
        `This accomplishment deserves ${emotionWord} recognition! 🎤`,
        `Years of hard work, one ${emotionWord} moment! 💪`
      ],
      family: [
        `💕 Family time just got infinitely more ${emotionWord}!`,
        `${hook} family gatherings could be this ${emotionWord}?`,
        `Three generations, one ${emotionWord} experience! 👨‍👩‍👧‍👦`,
        `Family bonds that are truly ${emotionWord}! 🏠`,
        `Love, laughter, and ${emotionWord} memories! 🐶`,
        `The family that captures together, stays ${emotionWord} together! 📸`
      ],
      sports: [
        `🏆 Victory never looked so ${emotionWord}!`,
        `${hook} champions could be this ${emotionWord}?`,
        `Game day just became ${emotionWord}! ⚽`,
        `Athletic excellence meets ${emotionWord} technology! 🏅`,
        `From the field to forever - ${emotionWord} memories! 🏈`,
        `Champions deserve ${emotionWord} recognition! 🥇`
      ],
      cultural: [
        `🌍 Cultural celebration meets ${emotionWord} innovation!`,
        `${hook} traditions could be this ${emotionWord}?`,
        `Heritage preservation gets ${emotionWord}! 🎭`,
        `Community spirit captured in ${emotionWord} detail! 🎪`,
        `Art, culture, and ${emotionWord} technology unite! 🎨`,
        `Festival magic becomes ${emotionWord} memories! 🎆`
      ]
    };
    
    const categoryOpenings = openings[category] || openings.celebration;
    return this.randomSelect(categoryOpenings);
  }

  generateMainContent(topicAnalysis, technology, businessModel, platformSpecs, audience) {
    const { category, occasion, uniqueElements, emotions } = topicAnalysis;
    
    // Create category-specific content that varies significantly
    let content = this.generateCategorySpecificContent(category, occasion, emotions, technology, businessModel, platformSpecs, uniqueElements);
    
    return content;
  }
  
  generateCategorySpecificContent(category, occasion, emotions, technology, businessModel, platformSpecs, uniqueElements) {
    const style = platformSpecs.style;
    
    // Create dramatically different content based on event category
    const categoryContent = {
      wedding: {
        'professional-insight': `Preserve matrimonial moments with precision photogrammetric documentation. Our wedding specialists utilize ${technology.scanningProcess} to create heirloom-quality ${technology.printing} that capture the essence of your union ceremony.`,
        'hook-driven': `💍 "I Do" to 3D forever!\n💒 ${technology.scanningProcess}\n👰 Every detail preserved\n💕 ${technology.printing}\n⏰ ${technology.turnaround}`,
        default: `Your wedding day is the most important day of your life - it deserves 3D perfection! From the first look to the last dance, our wedding photography specialists capture every precious moment in stunning three-dimensional detail. Create heirloom memories that your family will treasure for generations!`
      },
      
      celebration: {
        'professional-insight': `Our specialized event capture technology transforms birthday celebrations and personal milestones into lasting 3D memories. The ${technology.scanningProcess} ensures every joyful moment is preserved with ${technology.printing} precision.`,
        'hook-driven': `🎉 Birthday magic in 3D!\n📸 ${technology.scanningProcess}\n🎂 Capture the celebration\n🎁 ${technology.printing}\n⏰ ${technology.turnaround}`,
        default: `Transform your ${occasion} into something extraordinary! Our mobile celebration specialists bring the party-perfecting technology that turns happy moments into treasured 3D keepsakes. Every smile, every candle, every precious birthday second captured in stunning detail!`
      },
      
      professional: {
        'professional-insight': `Elevate corporate events with cutting-edge photogrammetric solutions. Our ${businessModel.deployment} provides scalable ${technology.scanningProcess} for professional environments, delivering ${technology.printing} results within our ${technology.turnaround} framework.`,
        'hook-driven': `💼 Corporate innovation unlocked\n📈 ${technology.scanningProcess}\n🚀 Professional excellence\n💰 ${technology.pricing}\n📊 ${technology.turnaround}`,
        default: `Revolutionize your ${occasion} with professional-grade 3D capture technology! Our corporate specialists understand that business events need sophisticated solutions. Transform team meetings, conferences, and corporate celebrations into engaging experiences that boost morale and create lasting connections.`
      },
      
      milestone: {
        'professional-insight': `Commemorate life's defining moments with precision 3D documentation. Our ${technology.scanningProcess} creates permanent records of achievements, utilizing ${technology.printing} to preserve graduation ceremonies, promotions, and career milestones.`,
        'hook-driven': `🏆 Achievement unlocked in 3D!\n🎓 ${technology.scanningProcess}\n⭐ Milestone magic\n🎯 ${technology.printing}\n📅 ${technology.turnaround}`,
        default: `Your ${occasion} deserves more than just photos - it deserves 3D permanence! This incredible achievement represents years of hard work, and our technology ensures these proud moments live forever in three dimensions. From graduation caps to retirement celebrations, we capture success in its full glory!`
      },
      
      family: {
        'professional-insight': `Strengthen family bonds through innovative 3D memory preservation. Our ${businessModel.deployment} specializes in multi-generational capture using ${technology.scanningProcess} to create heirloom-quality ${technology.printing} figurines.`,
        'hook-driven': `👨‍👩‍👧‍👦 Family moments in 3D\n💕 ${technology.scanningProcess}\n🏠 Love captured forever\n👶 ${technology.printing}\n⏰ ${technology.turnaround}`,
        default: `Bring your family together in the most meaningful way possible! Our ${occasion} specialists understand that family moments are precious and fleeting. Whether it's baby showers, family reunions, or holiday gatherings, we create 3D memories that connect generations and preserve family love in tangible form.`
      },
      
      sports: {
        'professional-insight': `Capture athletic achievement and team dynamics through advanced 3D documentation. Our sports-specialized ${technology.scanningProcess} preserves victory moments and team unity with ${technology.printing} precision.`,
        'hook-driven': `🏆 Victory in 3D form!\n⚽ ${technology.scanningProcess}\n🎖️ Champions preserved\n🥇 ${technology.printing}\n📅 ${technology.turnaround}`,
        default: `Champions deserve champion treatment! Your ${occasion} represents dedication, teamwork, and pure athletic excellence. Our sports photography specialists capture the energy, the victory, the team spirit in stunning 3D detail. From game-winning moments to championship celebrations!`
      },
      
      cultural: {
        'professional-insight': `Document cultural celebrations and community events with comprehensive 3D archival technology. Our ${technology.scanningProcess} preserves cultural heritage through ${technology.printing} while respecting traditional values.`,
        'hook-driven': `🌍 Culture captured in 3D\n🎭 ${technology.scanningProcess}\n🎨 Heritage preserved\n🎪 ${technology.printing}\n📅 ${technology.turnaround}`,
        default: `Celebrate culture, tradition, and community spirit! Your ${occasion} connects past, present, and future - and our technology honors that connection. From festivals to art shows, cultural events deserve documentation that matches their significance and beauty.`
      }
    };
    
    const selectedCategory = categoryContent[category] || categoryContent.celebration;
    let content = selectedCategory[style] || selectedCategory.default;
    
    // Add unique elements contextually
    if (uniqueElements.length > 0) {
      const elementText = this.generateElementEnhancement(uniqueElements, category);
      content += ` ${elementText}`;
    }
    
    return content;
  }
  
  generateElementEnhancement(uniqueElements, category) {
    const elementMap = {
      'outdoor-setting': {
        celebration: 'Perfect for outdoor birthday celebrations under the open sky!',
        professional: 'Ideal for outdoor corporate retreats and team-building events.',
        milestone: 'Beautiful outdoor graduation and achievement ceremonies.',
        family: 'Wonderful for backyard family gatherings and garden parties.',
        sports: 'Excellent for outdoor sports events and competitions.',
        cultural: 'Great for outdoor festivals and community celebrations.'
      },
      'indoor-setting': {
        celebration: 'Elegant indoor party atmosphere with controlled lighting.',
        professional: 'Professional indoor conference and meeting environments.',
        milestone: 'Sophisticated indoor ceremony settings.',
        family: 'Cozy indoor family gathering spaces.',
        sports: 'Indoor sports facilities and gymnasium events.',
        cultural: 'Beautiful indoor cultural venues and art galleries.'
      },
      'formal-attire': {
        celebration: 'Capture the elegance of formal birthday celebrations.',
        professional: 'Professional business attire and corporate sophistication.',
        milestone: 'Formal graduation and achievement ceremony attire.',
        family: 'Elegant family formal occasions and special dinners.',
        sports: 'Awards ceremonies and formal sports recognition events.',
        cultural: 'Formal cultural events and gala celebrations.'
      },
      'large-group': {
        celebration: 'Epic group birthday celebrations with all your friends!',
        professional: 'Large-scale corporate events and company-wide gatherings.',
        milestone: 'Major graduation ceremonies with hundreds of participants.',
        family: 'Big family reunions bringing everyone together.',
        sports: 'Entire team celebrations and tournament gatherings.',
        cultural: 'Community-wide festivals and cultural celebrations.'
      }
    };
    
    const enhancements = uniqueElements.map(element => {
      const elementEnhancements = elementMap[element];
      return elementEnhancements ? elementEnhancements[category] || elementEnhancements.celebration : '';
    }).filter(text => text.length > 0);
    
    return enhancements.length > 0 ? enhancements.join(' ') : '';
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
    
    // Create occasion-specific CTAs that match the content tone
    const occasionCTAs = {
      'personal-celebration': [
        `Ready to make your birthday legendary? ${businessCTA}`,
        `Turn your party into a 3D masterpiece! ${businessCTA}`,
        `Don't just celebrate - immortalize the moment! ${businessCTA}`
      ],
      'major-life-event': [
        `Your wedding deserves 3D perfection! ${businessCTA}`,
        `Create wedding memories that last lifetimes! ${businessCTA}`,
        `Say 'I Do' to 3D wedding magic! ${businessCTA}`
      ],
      'business-event': [
        `Elevate your corporate culture with innovation! ${businessCTA}`,
        `Transform your business events forever! ${businessCTA}`,
        `Professional excellence demands 3D memories! ${businessCTA}`
      ],
      'achievement-milestone': [
        `Your success deserves 3D recognition! ${businessCTA}`,
        `Graduation memories that last forever! ${businessCTA}`,
        `Achievement unlocked: 3D commemoration! ${businessCTA}`
      ],
      'special-occasion': [
        `Ready to make memories that last forever? ${businessCTA}`,
        `Transform your event into something extraordinary! ${businessCTA}`,
        `Don't just remember - relive in 3D! ${businessCTA}`
      ]
    };
    
    const selectedCTAs = occasionCTAs[occasion] || occasionCTAs['special-occasion'];
    return this.randomSelect(selectedCTAs);
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