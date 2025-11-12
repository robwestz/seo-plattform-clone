import { 
  SerpIntentData, 
  SerpResult, 
  KeywordIntent, 
  ContentType 
} from '@/types/seo';

// Re-using helpers from other generators
const randomInt = (min: number, max: number): number => Math.floor(Math.random() * (max - min + 1)) + min;
const sample = <T>(arr: T[]): T => arr[randomInt(0, arr.length - 1)];
const domains = ['ahrefs.com', 'semrush.com', 'moz.com', 'backlinko.com', 'neilpatel.com', 'forbes.com', 'wikipedia.org', 'reddit.com', 'youtube.com', 'hubspot.com'];

export function generateSerpResult(position: number, keyword: string): SerpResult {
  const intents: KeywordIntent[] = ['informational', 'commercial', 'transactional', 'navigational'];
  const contentTypes: ContentType[] = ['blog', 'product', 'landing', 'video', 'tool', 'forum', 'news'];
  
  const detectedIntent = sample(intents);
  const contentType = sample(contentTypes);
  const hasPricing = (detectedIntent === 'commercial' || detectedIntent === 'transactional') && Math.random() > 0.3;

  return {
    position,
    url: `https://${sample(domains)}/${keyword.replace(/\s/g, '-')}-guide-${position}`,
    domain: sample(domains),
    title: `Top Result ${position} for ${keyword}`,
    description: `A detailed description for the number ${position} search result, discussing various aspects of ${keyword}.`,
    detectedIntent,
    intentSignals: hasPricing ? ['has pricing', 'product page'] : ['informational content', 'guide'],
    contentType,
    hasVideo: Math.random() > 0.5,
    hasImages: Math.random() > 0.2,
    hasFAQ: Math.random() > 0.6,
    hasReviews: contentType === 'product' || Math.random() > 0.7,
    hasPricing,
    domainRating: randomInt(60, 95),
    pageAuthority: randomInt(30, 70),
    backlinks: randomInt(10, 1000),
  };
}

export function generateSerpIntentData(keyword: string): SerpIntentData {
  const topResults = Array.from({ length: 10 }, (_, i) => generateSerpResult(i + 1, keyword));

  const intentDistribution = { informational: 0, navigational: 0, commercial: 0, transactional: 0 };
  const contentTypeDistribution = { blog: 0, product: 0, landing: 0, video: 0, tool: 0, forum: 0, news: 0 };

  topResults.forEach(result => {
    intentDistribution[result.detectedIntent]++;
    contentTypeDistribution[result.contentType]++;
  });

  // Convert counts to percentages
  Object.keys(intentDistribution).forEach(key => {
    intentDistribution[key as KeywordIntent] = intentDistribution[key as KeywordIntent] * 10;
  });
  Object.keys(contentTypeDistribution).forEach(key => {
    contentTypeDistribution[key as ContentType] = contentTypeDistribution[key as ContentType] * 10;
  });

  return {
    keyword,
    topResults,
    intentDistribution,
    contentTypeDistribution,
    serpFeaturePresence: {
      featuredSnippet: Math.random() > 0.5,
      peopleAlsoAsk: Math.random() > 0.2,
      videoCarousel: Math.random() > 0.6,
      imagesPack: Math.random() > 0.5,
      localPack: Math.random() > 0.9,
      knowledgePanel: Math.random() > 0.7,
      shoppingResults: intentDistribution.commercial > 30 && Math.random() > 0.4,
      topStories: contentTypeDistribution.news > 10 && Math.random() > 0.3,
      siteLinks: Math.random() > 0.5,
      reviews: Math.random() > 0.5,
    }
  };
}
